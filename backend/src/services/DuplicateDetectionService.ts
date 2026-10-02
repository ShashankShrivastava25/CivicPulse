import { Issue } from "../models/Issue";
import { getAiConfig } from "./SettingsService";
import {
  calculateCosineSimilarity,
  calculateHaversineDistance,
  calculateLocationScore,
  calculateCategoryMatch,
  calculateTextOverlap,
  calculateHashSimilarity,
  combineAvailableSignals,
} from "../utils/similarity";

export interface DuplicateCandidate {
  issueId: string;
  confidence: number;
  imageSimilarity: number;
  textSimilarity: number;
  distanceMeters: number;
  category: string;
  description: string;
  imageUrl?: string | null;
  upvoteCount: number;
  status: string;
  createdAt: Date;
}

/**
 * DuplicateDetectionService: Finds potential duplicate issues
 *
 * Process:
 * 1. Find nearby existing reports (geospatial search)
 * 2. Filter relevant unresolved/recent reports
 * 3. Compare images (HF embedding, or local perceptual hash as fallback)
 * 4. Compare text (HF embedding, or word overlap as fallback)
 * 5. Compare categories
 * 6. Compare geographic distance
 * 7. Calculate duplicate confidence score from the signals that are available
 */
export class DuplicateDetectionService {
  private static readonly MAX_HOURS_OLD = 30 * 24; // Look at reports from last 30 days

  static async findDuplicates(
    latitude: number,
    longitude: number,
    category: string,
    imageEmbedding: number[] | null,
    textEmbedding: number[] | null,
    description: string = "",
    imageHash: string | null = null,
  ): Promise<DuplicateCandidate[]> {
    try {
      const cfg = await getAiConfig();
      // Step 1: Find nearby issues using geospatial search
      const nearbyIssues = await this.findNearbyIssues(
        latitude,
        longitude,
        cfg.duplicateSearchRadius,
      );

      if (nearbyIssues.length === 0) {
        return [];
      }

      // Step 2: Compare each nearby issue
      const candidates: DuplicateCandidate[] = [];

      for (const issue of nearbyIssues) {
        // ---- IMAGE: HF embedding if both sides have one, else local perceptual hash, else "not available"
        let imageSimilarity: number | null = null;
        if (
          imageEmbedding &&
          issue.imageEmbedding &&
          issue.imageEmbedding.length === imageEmbedding.length
        ) {
          imageSimilarity = calculateCosineSimilarity(
            imageEmbedding,
            issue.imageEmbedding,
          );
        } else if (imageHash && (issue as any).imageHash) {
          imageSimilarity = calculateHashSimilarity(
            imageHash,
            (issue as any).imageHash,
          );
        }

        // ---- TEXT: HF embedding if both sides have one, else lexical overlap
        let textSimilarity: number | null = null;
        if (
          textEmbedding &&
          issue.textEmbedding &&
          issue.textEmbedding.length === textEmbedding.length
        ) {
          textSimilarity = calculateCosineSimilarity(
            textEmbedding,
            issue.textEmbedding,
          );
        } else if (description && issue.description) {
          textSimilarity = calculateTextOverlap(description, issue.description);
        }

        const distanceMeters = calculateHaversineDistance(
          latitude,
          longitude,
          issue.latitude || 0,
          issue.longitude || 0,
        );

        const locationScore = calculateLocationScore(
          distanceMeters,
          cfg.duplicateSearchRadius,
        );
        const categoryMatch = calculateCategoryMatch(category, issue.category);

        // Weighted score over the signals that actually exist (weights are re-normalised)
        let confidence = combineAvailableSignals(
          {
            image: imageSimilarity,
            text: textSimilarity,
            location: locationScore,
            category: categoryMatch,
          },
          {
            imageWeight: cfg.imageSimilarityWeight,
            textWeight: cfg.textSimilarityWeight,
            locationWeight: cfg.locationWeight,
            categoryWeight: cfg.categoryWeight,
          },
        );

        // Strong single-signal rules so one very clear match is never diluted by weak ones:
        //  - near-identical photo within the search radius
        //  - very similar wording, same category, very close by
        if (
          imageSimilarity !== null &&
          imageSimilarity >= 0.9 &&
          distanceMeters <= cfg.duplicateSearchRadius
        ) {
          confidence = Math.max(confidence, 0.85);
        }
        if (
          textSimilarity !== null &&
          textSimilarity >= 0.85 &&
          categoryMatch === 1 &&
          distanceMeters <= 100
        ) {
          confidence = Math.max(confidence, 0.8);
        }

        console.log(
          `[duplicate] vs ${issue._id}: image=${imageSimilarity?.toFixed(2) ?? "n/a"} text=${textSimilarity?.toFixed(2) ?? "n/a"} dist=${Math.round(distanceMeters)}m cat=${categoryMatch} -> ${confidence.toFixed(2)} (threshold ${cfg.duplicateThreshold})`,
        );

        // Only include if above the configured threshold
        if (confidence >= cfg.duplicateThreshold) {
          candidates.push({
            issueId: issue._id.toString(),
            confidence,
            imageSimilarity: imageSimilarity ?? 0,
            textSimilarity: textSimilarity ?? 0,
            distanceMeters,
            category: issue.category,
            description: issue.description,
            imageUrl: issue.imageUrl,
            upvoteCount: issue.upvoteCount,
            status: issue.status,
            createdAt: issue.createdAt,
          });
        }
      }

      // Sort by confidence (highest first)
      return candidates.sort((a, b) => b.confidence - a.confidence);
    } catch (error) {
      console.error("Error finding duplicates:", error);
      return [];
    }
  }

  /**
   * Find nearby issues using MongoDB geospatial query
   */
  private static async findNearbyIssues(
    latitude: number,
    longitude: number,
    radiusMeters: number,
  ) {
    try {
      // Use MongoDB $near query with 2dsphere index
      const issues = await Issue.find({
        location: {
          $near: {
            $geometry: {
              type: "Point",
              coordinates: [longitude, latitude],
            },
            $maxDistance: radiusMeters,
          },
        },
        // Only compare with unresolved issues
        status: {
          $in: ["REPORTED", "UNDER_REVIEW", "ASSIGNED", "IN_PROGRESS"],
        },
        // Only look at recent issues (last 30 days)
        createdAt: {
          $gte: new Date(Date.now() - this.MAX_HOURS_OLD * 60 * 60 * 1000),
        },
      })
        .select(
          "category description imageEmbedding imageHash textEmbedding latitude longitude imageUrl upvoteCount status createdAt",
        )
        .lean()
        .exec();

      return issues || [];
    } catch (error) {
      console.error("Error finding nearby issues:", error);
      return [];
    }
  }

  /**
   * Get duplicate detection threshold
   */
  static async getThreshold(): Promise<number> {
    return (await getAiConfig()).duplicateThreshold;
  }

  /**
   * Get search radius in meters
   */
  static async getSearchRadius(): Promise<number> {
    return (await getAiConfig()).duplicateSearchRadius;
  }

  /**
   * Check if duplicate detection is available
   */
  static isAvailable(): boolean {
    return true;
  }
}
