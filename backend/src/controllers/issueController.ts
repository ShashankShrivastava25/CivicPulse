import { Request, Response, NextFunction } from "express";
import { Issue } from "../models/Issue";
import { Vote } from "../models/Vote";
import { DuplicateEvent } from "../models/DuplicateEvent";
import { Department } from "../models/Department";
import { HuggingFaceService } from "../services/HuggingFaceService";
import { DuplicateDetectionService } from "../services/DuplicateDetectionService";
import { StorageService } from "../services/StorageService";
import { computePriority } from "../services/PriorityService";
import { addTimeline } from "../services/TimelineService";
import { notify, notifyAdmins } from "../services/NotificationService";
import { IssueUpdate } from "../models/IssueUpdate";
import { serializeTimeline } from "../services/TimelineService";
import { asyncHandler } from "../utils/asyncHandler";
import { AppError } from "../utils/AppError";
import { computeImageHash } from "../utils/imageHash"; // CHANGED (new import)

export const issueController = {
  /**
   * Report a new issue
   * Step 1-4: Image, Description, Category, Location
   * Performs AI analysis and duplicate detection
   */
  reportIssue: asyncHandler(
    async (req: Request, res: Response, next: NextFunction) => {
      const {
        description,
        category,
        latitude,
        longitude,
        address,
        imageBase64,
        notDuplicateOf,
      } = req.body;
      const reporterId = req.user!.id;

      // Validate inputs
      if (
        !description ||
        !category ||
        latitude === undefined ||
        longitude === undefined
      ) {
        return next(new AppError(400, "Missing required fields"));
      }

      if (description.length < 10 || description.length > 2000) {
        return next(
          new AppError(
            400,
            "Description must be between 10 and 2000 characters",
          ),
        );
      }

      try {
        let imageUrl: string | undefined;
        let imageEmbedding: number[] | undefined;
        let imageHash: string | undefined; // CHANGED
        let textEmbedding: number[] | undefined;
        let aiSuggestedCategory: string | undefined;
        let aiClassificationConfidence: number | undefined;
        let aiProcessingStatus = "UNAVAILABLE";

        const hfConfigured = await HuggingFaceService.isConfigured();

        // Step 1: Process image if provided
        if (imageBase64) {
          try {
            const saved = await StorageService.saveBase64Image(imageBase64);
            imageUrl = saved.url;
            const imageBuffer = saved.buffer;

            // CHANGED: Local perceptual hash - works even when Hugging Face is down
            imageHash = await computeImageHash(imageBuffer);

            // Get image classification from Hugging Face
            if (hfConfigured) {
              aiProcessingStatus = "PROCESSING";
              const classificationResults =
                await HuggingFaceService.classifyImage(imageBuffer);

              if (classificationResults && classificationResults.length > 0) {
                const suggestion = HuggingFaceService.suggestCategory(
                  classificationResults,
                );
                if (suggestion) {
                  aiSuggestedCategory = suggestion.category;
                  aiClassificationConfidence = suggestion.confidence;
                }
                aiProcessingStatus = "COMPLETED";
              } else {
                aiProcessingStatus = "FAILED";
              }

              // Get image embedding for duplicate detection
              try {
                imageEmbedding =
                  (await HuggingFaceService.getImageEmbedding(imageBuffer)) ||
                  undefined;
              } catch (err) {
                console.error("Error getting image embedding:", err);
              }
            }
          } catch (err) {
            if (err instanceof AppError) throw err;
            console.error("Error processing image:", err);
            // Continue without image processing - don't fail the entire request
          }
        }

        // Step 2-3: Get text embedding (for semantic similarity)
        if (hfConfigured) {
          try {
            textEmbedding =
              (await HuggingFaceService.getTextEmbedding(description)) ||
              undefined;
          } catch (err) {
            console.error("Error getting text embedding:", err);
          }
        }

        // Step 4: Find duplicate candidates
        const duplicateCandidates =
          await DuplicateDetectionService.findDuplicates(
            latitude,
            longitude,
            category,
            imageEmbedding || null,
            textEmbedding || null,
            description, // CHANGED
            imageHash || null, // CHANGED
          );

        // CHANGED: findDuplicates() already filtered by the admin-configured threshold
        // (/admin/ai-configuration), so any candidate returned here is a suggested duplicate.
        // If the citizen already said "not a duplicate" (notDuplicateOf), we let them file it.
        const topDuplicate = duplicateCandidates[0];
        if (topDuplicate && !notDuplicateOf) {
          // Record that the AI/heuristic SUGGESTED a duplicate. Whether the citizen agrees is tracked
          // separately in confirmDuplicate (CONFIRMED) or here if they proceed anyway (REJECTED).
          await DuplicateEvent.create({
            reporter: reporterId,
            suggestedIssue: topDuplicate.issueId,
            outcome: "SUGGESTED",
            confidence: topDuplicate.confidence,
          });
          await notify(reporterId, {
            type: "DUPLICATE_DETECTED",
            title: "Possible duplicate found",
            message:
              "We found a similar report near your location. Please confirm if it is the same issue.",
          });
          // Don't create the issue yet - return the duplicate for user confirmation
          return res.status(200).json({
            success: true,
            data: {
              status: "DUPLICATE_FOUND",
              existingIssue: {
                id: topDuplicate.issueId,
                category: topDuplicate.category,
                description: topDuplicate.description,
                imageUrl: topDuplicate.imageUrl,
                distance: Math.round(topDuplicate.distanceMeters),
                upvotes: topDuplicate.upvoteCount,
                reportedDate: topDuplicate.createdAt,
                status: topDuplicate.status,
                confidence: Math.round(topDuplicate.confidence * 100),
              },
              message:
                "We found a similar report nearby. Please confirm if this is the same issue.",
            },
          });
        }

        // Department is inferred from category as a starting point; a public servant/admin may reassign it.
        const department = await Department.findOne({ categories: category })
          .select("_id")
          .lean();

        // No duplicate (or citizen rejected it) - create new issue
        const newIssue = new Issue({
          reporterId,
          category,
          description,
          imageUrl,
          imageEmbedding,
          imageHash, // CHANGED
          textEmbedding,
          location: {
            type: "Point",
            coordinates: [longitude, latitude],
          },
          latitude,
          longitude,
          address,
          status: "REPORTED",
          priority: "MEDIUM",
          departmentId: department?._id,
          aiSuggestedCategory,
          aiClassificationConfidence,
          aiProcessingStatus,
          duplicateCandidates: duplicateCandidates.map((dc) => ({
            issueId: dc.issueId,
            confidence: dc.confidence,
            imageSimilarity: dc.imageSimilarity,
            textSimilarity: dc.textSimilarity,
            distanceMeters: dc.distanceMeters,
          })),
          duplicateConfidence: topDuplicate?.confidence || 0,
        });

        const priority = await computePriority({
          upvoteCount: 0,
          category,
          createdAt: new Date(),
          status: "REPORTED",
          duplicateCandidateCount: duplicateCandidates.length,
        });
        newIssue.priority = priority.level;
        newIssue.priorityScore = priority.score;
        newIssue.priorityReasons = priority.reasons;
        newIssue.priorityBreakdown = priority.breakdown;
        newIssue.priorityComputedAt = new Date();

        await newIssue.save();

        // The citizen was shown a duplicate suggestion and chose "no, this is different" — record that
        // decision so admin analytics can separate AI-suggested duplicates from citizen-rejected ones.
        if (notDuplicateOf) {
          await DuplicateEvent.create({
            reporter: reporterId,
            suggestedIssue: notDuplicateOf,
            newIssue: newIssue._id,
            outcome: "REJECTED",
          });
        }

        await addTimeline({
          issue: String(newIssue._id),
          kind: "REPORTED",
          author: reporterId,
          authorRole: "CITIZEN",
          message: "Issue reported",
          status: "REPORTED",
        });
        if (aiProcessingStatus === "COMPLETED") {
          await addTimeline({
            issue: String(newIssue._id),
            kind: "AI_ANALYSIS",
            authorRole: "SYSTEM",
            message: "AI duplicate/category analysis completed",
          });
        }
        await notify(reporterId, {
          type: "REPORT_SUBMITTED",
          message: "Your report has been submitted successfully.",
          issue: String(newIssue._id),
        });
        if (priority.level === "HIGH" || priority.level === "CRITICAL") {
          await notifyAdmins({
            type: "MODERATION_EVENT",
            title: "High priority issue reported",
            message: `A ${priority.level.toLowerCase()} priority ${category} issue was just reported.`,
            issue: String(newIssue._id),
          });
        }

        res.status(201).json({
          success: true,
          data: {
            status: "CREATED",
            issue: {
              id: newIssue._id,
              category: newIssue.category,
              description: newIssue.description,
              status: newIssue.status,
              priority: newIssue.priority,
              location: {
                latitude: newIssue.latitude,
                longitude: newIssue.longitude,
                address: newIssue.address,
              },
              createdAt: newIssue.createdAt,
              aiAnalysis: {
                suggestedCategory: aiSuggestedCategory,
                confidence: aiClassificationConfidence,
                status: aiProcessingStatus,
              },
            },
            message: "Issue reported successfully!",
          },
        });
      } catch (err) {
        if (err instanceof AppError) return next(err);
        console.error("Error reporting issue:", err);
        next(new AppError(500, "Failed to report issue"));
      }
    },
  ),

  /**
   * Upvote an existing issue
   * Creates a vote if user hasn't already voted
   */
  upvoteIssue: asyncHandler(
    async (req: Request, res: Response, next: NextFunction) => {
      const { id } = req.params;
      const userId = req.user!.id;

      const issue = await Issue.findById(id);
      if (!issue) {
        return next(new AppError(404, "Issue not found"));
      }

      // Check if user already voted
      const existingVote = await Vote.findOne({ issue: id, user: userId });
      if (existingVote) {
        return next(new AppError(400, "You have already upvoted this issue"));
      }

      // Create vote
      const vote = new Vote({ issue: id, user: userId });
      await vote.save();

      // Update issue upvote count
      issue.upvoteCount = (issue.upvoteCount || 0) + 1;
      await issue.save();

      if (String(issue.reporterId) !== String(userId)) {
        await notify(String(issue.reporterId), {
          type: "UPVOTE_RECORDED",
          message: "Someone supported your report.",
          issue: String(issue._id),
        });
      }

      res.status(201).json({
        success: true,
        data: {
          issueId: id,
          upvotes: issue.upvoteCount,
        },
      });
    },
  ),

  /**
   * Remove upvote from an issue
   */
  removeUpvote: asyncHandler(
    async (req: Request, res: Response, next: NextFunction) => {
      const { id } = req.params;
      const userId = req.user!.id;

      const vote = await Vote.findOneAndDelete({ issue: id, user: userId });
      if (!vote) {
        return next(new AppError(400, "You have not upvoted this issue"));
      }

      // Update issue upvote count
      const issue = await Issue.findByIdAndUpdate(
        id,
        { $inc: { upvoteCount: -1 } },
        { new: true },
      );

      res.status(200).json({
        success: true,
        data: {
          issueId: id,
          upvotes: issue?.upvoteCount || 0,
        },
      });
    },
  ),

  /**
   * Get issue details
   */
  getIssue: asyncHandler(
    async (req: Request, res: Response, next: NextFunction) => {
      const { id } = req.params;
      const userId = req.user?.id;

      const issue = await Issue.findById(id)
        .populate("reporterId", "fullName email")
        .populate("assignedTo", "fullName email department")
        .populate("departmentId", "name");

      if (!issue) {
        return next(new AppError(404, "Issue not found"));
      }

      // A citizen may only view their own issue or a public one; staff routes cover the moderation view.
      if (
        issue.moderationStatus === "HIDDEN" &&
        String(issue.reporterId) !== String(userId)
      ) {
        return next(new AppError(404, "Issue not found"));
      }

      // Check if current user has upvoted
      let hasUpvoted = false;
      if (userId) {
        const vote = await Vote.findOne({ issue: id, user: userId });
        hasUpvoted = !!vote;
      }

      // Get related issues (high similarity duplicates)
      const relatedIssues = issue.duplicateCandidates
        .slice(0, 3)
        .map((dc) => dc.issueId);

      const timeline = (
        await IssueUpdate.find({ issue: id, visibility: "PUBLIC" })
          .sort({ createdAt: 1 })
          .populate("author", "fullName")
          .lean()
      ).map(serializeTimeline);

      res.status(200).json({
        success: true,
        data: {
          issue: {
            id: issue._id,
            category: issue.category,
            description: issue.description,
            imageUrl: issue.imageUrl,
            location: {
              latitude: issue.latitude,
              longitude: issue.longitude,
              address: issue.address,
            },
            status: issue.status,
            priority: issue.priority,
            priorityScore: issue.priorityScore,
            priorityReasons: issue.priorityReasons,
            upvotes: issue.upvoteCount,
            hasUpvoted,
            reporter: issue.reporterId,
            assignedTo: issue.assignedTo,
            department: issue.departmentId,
            createdAt: issue.createdAt,
            updatedAt: issue.updatedAt,
            resolutionDate: issue.resolutionDate,
            resolutionNotes: issue.resolutionNotes,
            resolutionEvidenceUrl: issue.resolutionEvidenceUrl,
            timeline,
            aiSuggestedCategory: issue.aiSuggestedCategory,
            aiClassificationConfidence: issue.aiClassificationConfidence,
          },
          relatedIssues,
        },
      });
    },
  ),

  /**
   * Get nearby issues
   */
  getNearbyIssues: asyncHandler(
    async (req: Request, res: Response, next: NextFunction) => {
      const { latitude, longitude, radius = 500, category, status } = req.query;

      if (latitude === undefined || longitude === undefined) {
        return next(new AppError(400, "latitude and longitude are required"));
      }

      const lat = parseFloat(latitude as string);
      const lon = parseFloat(longitude as string);
      const rad = parseInt(radius as string) || 500;

      const query: any = {
        location: {
          $near: {
            $geometry: {
              type: "Point",
              coordinates: [lon, lat],
            },
            $maxDistance: rad,
          },
        },
        moderationStatus: { $ne: "HIDDEN" },
      };

      if (category && category !== "All") {
        query.category = category;
      }

      if (status && status !== "All") {
        query.status = status;
      }

      const issues = await Issue.find(query)
        .select(
          "category description imageUrl location latitude longitude status upvoteCount createdAt",
        )
        .lean()
        .limit(50)
        .exec();

      res.status(200).json({
        success: true,
        data: {
          issues: issues.map((issue) => ({
            id: issue._id,
            category: issue.category,
            description: issue.description.substring(0, 100) + "...",
            imageUrl: issue.imageUrl,
            latitude: issue.latitude,
            longitude: issue.longitude,
            status: issue.status,
            upvotes: issue.upvoteCount,
            createdAt: issue.createdAt,
          })),
          count: issues.length,
        },
      });
    },
  ),

  /**
   * Get user's reports
   */
  getUserReports: asyncHandler(
    async (req: Request, res: Response, next: NextFunction) => {
      const userId = req.user!.id;
      const { page = 1, limit = 10 } = req.query;

      const skip = (parseInt(page as string) - 1) * parseInt(limit as string);

      const [issues, total] = await Promise.all([
        Issue.find({ reporterId: userId })
          .select(
            "category description imageUrl status upvoteCount createdAt location",
          )
          .sort({ createdAt: -1 })
          .skip(skip)
          .limit(parseInt(limit as string))
          .lean()
          .exec(),
        Issue.countDocuments({ reporterId: userId }),
      ]);

      res.status(200).json({
        success: true,
        data: {
          issues: issues.map((issue) => ({
            id: issue._id,
            category: issue.category,
            description: issue.description.substring(0, 100) + "...",
            imageUrl: issue.imageUrl,
            status: issue.status,
            upvotes: issue.upvoteCount,
            createdAt: issue.createdAt,
          })),
          pagination: {
            page: parseInt(page as string),
            limit: parseInt(limit as string),
            total,
            pages: Math.ceil(total / parseInt(limit as string)),
          },
        },
      });
    },
  ),

  /**
   * Search issues
   */
  searchIssues: asyncHandler(
    async (req: Request, res: Response, next: NextFunction) => {
      const { q, category, status, page = 1, limit = 10 } = req.query;

      const skip = (parseInt(page as string) - 1) * parseInt(limit as string);

      const query: any = { moderationStatus: { $ne: "HIDDEN" } };

      if (q) {
        query.$or = [
          { description: { $regex: q, $options: "i" } },
          { category: { $regex: q, $options: "i" } },
        ];
      }

      if (category && category !== "All") {
        query.category = category;
      }

      if (status && status !== "All") {
        query.status = status;
      }

      const [issues, total] = await Promise.all([
        Issue.find(query)
          .select("category description imageUrl status upvoteCount createdAt")
          .sort({ createdAt: -1 })
          .skip(skip)
          .limit(parseInt(limit as string))
          .lean()
          .exec(),
        Issue.countDocuments(query),
      ]);

      res.status(200).json({
        success: true,
        data: {
          issues: issues.map((issue) => ({
            id: issue._id,
            category: issue.category,
            description: issue.description.substring(0, 100) + "...",
            imageUrl: issue.imageUrl,
            status: issue.status,
            upvotes: issue.upvoteCount,
            createdAt: issue.createdAt,
          })),
          pagination: {
            page: parseInt(page as string),
            limit: parseInt(limit as string),
            total,
            pages: Math.ceil(total / parseInt(limit as string)),
          },
        },
      });
    },
  ),

  /**
   * Confirm duplicate and upvote existing issue instead of creating new one
   */
  confirmDuplicate: asyncHandler(
    async (req: Request, res: Response, next: NextFunction) => {
      const { existingIssueId } = req.body;
      const userId = req.user!.id;

      const issue = await Issue.findById(existingIssueId);
      if (!issue) {
        return next(new AppError(404, "Issue not found"));
      }

      // Check if user already voted
      const existingVote = await Vote.findOne({
        issue: existingIssueId,
        user: userId,
      });
      if (existingVote) {
        return next(new AppError(400, "You have already upvoted this issue"));
      }

      // Create vote
      const vote = new Vote({ issue: existingIssueId, user: userId });
      await vote.save();

      // Update issue upvote count
      issue.upvoteCount = (issue.upvoteCount || 0) + 1;
      await issue.save();

      // The citizen agreed this was a duplicate — this is a CONFIRMED outcome, distinct from the
      // earlier SUGGESTED event recorded when the system first flagged it (see reportIssue).
      await DuplicateEvent.create({
        reporter: userId,
        suggestedIssue: existingIssueId,
        outcome: "CONFIRMED",
      });
      if (String(issue.reporterId) !== String(userId)) {
        await notify(String(issue.reporterId), {
          type: "UPVOTE_RECORDED",
          message: "Someone supported your report.",
          issue: String(issue._id),
        });
      }

      res.status(200).json({
        success: true,
        data: {
          message: "Your support has been added to the existing report",
          issueId: existingIssueId,
          upvotes: issue.upvoteCount,
        },
      });
    },
  ),
};
