export type Role = 'CITIZEN' | 'PUBLIC_SERVANT' | 'ADMIN';
export type AccountStatus = 'ACTIVE' | 'PENDING' | 'APPROVED' | 'REJECTED' | 'SUSPENDED';

export interface User {
  _id: string; fullName: string; email: string; phone?: string; role: Role;
  preferredLanguage: string; city?: string; state?: string;
  department?: string; designation?: string; municipalityName?: string; ward?: string; officialId?: string;
  accountStatus: AccountStatus; createdAt: string;
}

// ---------------------------------------------------------------- Phase 3
export type IssueStatus = 'REPORTED' | 'UNDER_REVIEW' | 'ASSIGNED' | 'IN_PROGRESS' | 'RESOLVED' | 'REJECTED';
export type Priority = 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
export type ModerationStatus = 'VISIBLE' | 'FLAGGED' | 'HIDDEN';

export interface RefName { _id: string; name?: string; fullName?: string; email?: string }

export interface IssueSummary {
  id: string; category: string; description: string; imageUrl?: string;
  status: IssueStatus; priority: Priority; priorityScore?: number; priorityReasons?: string[];
  upvotes: number; ward?: string;
  municipalityId?: string | RefName; departmentId?: string | RefName;
  assignedTo?: string | RefName | null; reporterId?: string | RefName;
  location: { latitude: number; longitude: number; address?: string };
  createdAt: string; updatedAt: string;
  moderationStatus?: ModerationStatus;
}

export interface TimelineEntry {
  id: string; kind: string; visibility: 'PUBLIC' | 'INTERNAL'; status?: string; message?: string;
  imageUrl?: string; author?: { id: string; name: string }; authorRole: string; createdAt: string;
}

export interface Pagination { page: number; limit: number; total: number; pages: number }

export interface AppNotification {
  _id: string; type: string; title?: string; message: string; read: boolean; readAt?: string;
  issue?: string; link?: string; createdAt: string;
}

export interface Municipality {
  _id: string; name: string; type: string; city?: string; state?: string; wards: string[];
  status: 'ACTIVE' | 'INACTIVE'; departmentCount?: number; createdAt: string;
}

export interface Department {
  _id: string; name: string; municipality: string | { _id: string; name: string; city?: string };
  categories: string[]; status: 'ACTIVE' | 'INACTIVE'; createdAt: string;
}

export interface Servant extends User {
  municipalityId?: { _id: string; name: string; city?: string; state?: string } | string;
  departmentId?: { _id: string; name: string } | string;
  jurisdictionWards?: string[];
  statusReason?: string;
}

export interface AuditLogEntry {
  _id: string; actorId?: { _id: string; fullName: string; email: string; role: Role } | string;
  actorRole?: string; action: string; targetType?: string; targetId?: string;
  metadata?: Record<string, unknown>; timestamp: string;
}

export interface AiConfig {
  imageModel: string; imageEmbeddingModel: string; textEmbeddingModel: string;
  imageSimilarityWeight: number; textSimilarityWeight: number; locationWeight: number; categoryWeight: number;
  duplicateThreshold: number; duplicateSearchRadius: number;
}

export interface PriorityConfig {
  weights: { upvotes: number; severity: number; age: number; affected: number; status: number; context: number };
  caps: { upvotes: number; ageDays: number; affected: number; context: number };
  thresholds: { critical: number; high: number; medium: number };
  categorySeverity: Record<string, number>;
}

export interface DuplicateAnalytics {
  totalIssues: number; aiSuggestedDuplicates: number; citizenConfirmedDuplicates: number;
  citizenRejectedSuggestions: number; duplicateReportsPrevented: number;
}

export interface Analytics {
  totalReports: number; openReports: number; inProgress: number; resolved: number; rejected: number;
  byCategory: { category: string; count: number }[];
  byMunicipality: { municipality: string; count: number }[];
  byDepartment: { department: string; count: number }[];
  byPriority: { priority: string; count: number }[];
  reportsOverTime: { date: string; count: number }[];
  averageResolutionHours: number | null; resolvedCount: number;
}

export interface DashboardStats {
  totalAssigned: number; pending: number; underReview: number; inProgress: number; resolved: number; highPriority: number;
}
