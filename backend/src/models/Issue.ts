import { Schema, model } from "mongoose";

export const ISSUE_STATUSES = [
  "REPORTED",
  "UNDER_REVIEW",
  "ASSIGNED",
  "IN_PROGRESS",
  "RESOLVED",
  "REJECTED",
] as const;
export const OPEN_STATUSES = [
  "REPORTED",
  "UNDER_REVIEW",
  "ASSIGNED",
  "IN_PROGRESS",
] as const;
export const PRIORITIES = ["LOW", "MEDIUM", "HIGH", "CRITICAL"] as const;
export type IssueStatus = (typeof ISSUE_STATUSES)[number];
export type Priority = (typeof PRIORITIES)[number];

const issueSchema = new Schema(
  {
    // Reporter information
    reporterId: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },

    // Issue details
    category: {
      type: String,
      required: true,
      enum: [
        "Garbage",
        "Drainage",
        "Road Damage",
        "Pothole",
        "Streetlight",
        "Water Leakage",
        "Waterlogging",
        "Sanitation",
        "Public Infrastructure",
        "Other",
      ],
      index: true,
    },
    description: {
      type: String,
      required: true,
      minlength: 10,
      maxlength: 2000,
      trim: true,
    },

    // Image handling
    imageUrl: { type: String },
    imageEmbedding: { type: [Number] }, // Store embedding vector securely
    imageHash: { type: String }, // 64-bit perceptual dHash (hex) - local fallback for image similarity

    // Text embedding for semantic similarity
    textEmbedding: { type: [Number] }, // Store embedding vector securely

    // Location data
    location: {
      type: {
        type: String,
        enum: ["Point"],
        default: "Point",
      },
      coordinates: {
        type: [Number], // [longitude, latitude]
        required: true,
      },
    },
    address: { type: String, trim: true },
    latitude: { type: Number },
    longitude: { type: Number },

    // Issue status and priority
    status: {
      type: String,
      default: "REPORTED",
      enum: ISSUE_STATUSES,
      index: true,
    },
    priority: {
      type: String,
      default: "MEDIUM",
      enum: PRIORITIES,
      index: true,
    },
    // Transparent, rule-based priority (see PriorityService). Not produced by AI.
    priorityScore: { type: Number, default: 0, index: true },
    priorityReasons: { type: [String], default: [] },
    priorityBreakdown: { type: Schema.Types.Mixed },
    priorityComputedAt: { type: Date },
    priorityOverride: { type: Boolean, default: false }, // true when an admin fixed the level manually

    // Voting and engagement
    upvoteCount: { type: Number, default: 0, index: true },

    // Municipality and department
    municipalityId: {
      type: Schema.Types.ObjectId,
      ref: "Municipality",
      index: true,
    },
    ward: { type: String, trim: true, index: true },
    departmentId: {
      type: Schema.Types.ObjectId,
      ref: "Department",
      index: true,
    },

    // Assignment
    assignedTo: { type: Schema.Types.ObjectId, ref: "User", index: true },
    assignedAt: { type: Date },

    // Moderation (admin only). HIDDEN issues are removed from citizen-facing lists.
    moderationStatus: {
      type: String,
      enum: ["VISIBLE", "FLAGGED", "HIDDEN"],
      default: "VISIBLE",
      index: true,
    },

    // AI Analysis
    aiSuggestedCategory: { type: String },
    aiClassificationConfidence: { type: Number },
    aiAnalysis: { type: Schema.Types.Mixed }, // Store detailed AI analysis if needed
    aiProcessingStatus: {
      type: String,
      default: "PENDING",
      enum: ["PENDING", "PROCESSING", "COMPLETED", "FAILED", "UNAVAILABLE"],
    },

    // Duplicate detection
    duplicateCandidates: [
      {
        issueId: { type: Schema.Types.ObjectId, ref: "Issue" },
        confidence: { type: Number },
        imageSimilarity: { type: Number },
        textSimilarity: { type: Number },
        distanceMeters: { type: Number },
      },
    ],
    duplicateConfidence: { type: Number, default: 0 },
    resolutionStatus: {
      type: String,
      enum: ["ORIGINAL", "DUPLICATE", "RELATED"],
    },

    // Resolution info
    resolutionDate: { type: Date },
    resolutionNotes: { type: String }, // "action taken"
    resolvedBy: { type: Schema.Types.ObjectId, ref: "User" },
    resolutionEvidenceUrl: { type: String },
  },
  { timestamps: true },
);

// Create geospatial index for location-based queries
issueSchema.index({ location: "2dsphere" });
issueSchema.index({ createdAt: -1 });
issueSchema.index({ status: 1, category: 1 });
issueSchema.index({ reporterId: 1, createdAt: -1 });

export const Issue = model("Issue", issueSchema);
