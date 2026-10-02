import { getPriorityConfig, PriorityConfig } from './SettingsService';

export interface PriorityInput {
  upvoteCount: number;
  category: string;
  createdAt: Date;
  status: string;
  duplicateConfidence?: number;
  duplicateCandidateCount?: number;
}

export interface PriorityResult {
  score: number; // 0-100, transparent and rule-based (NOT produced by AI)
  level: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
  reasons: string[];
  breakdown: Record<string, number>;
}

const clamp01 = (n: number) => Math.min(1, Math.max(0, n));

/**
 * PriorityService: a transparent, configurable, rule-based scoring model.
 *
 * Signals (never upvotes alone):
 *  - Community support (upvotes, capped)
 *  - Category severity (configurable per category)
 *  - Age unresolved (older open issues rank higher, capped)
 *  - Estimated affected citizens (proxied by upvotes + duplicate reports of the same issue)
 *  - Current status (REPORTED/UNDER_REVIEW issues get a small nudge so they don't get lost)
 *  - Location/context (how many nearby duplicate/related reports exist)
 *
 * This is explicitly NOT an AI/ML model. Nothing here calls Hugging Face or any inference API;
 * see HuggingFaceService for the (separate, optional) AI image/text analysis used for classification
 * and duplicate detection. Priority scoring stays deterministic so its reasons can be shown to users.
 */
export async function computePriority(input: PriorityInput): Promise<PriorityResult> {
  const cfg = await getPriorityConfig();
  const w = cfg.weights;
  const c = cfg.caps;

  const upvoteScore = clamp01(input.upvoteCount / Math.max(1, c.upvotes));
  const severityScore = cfg.categorySeverity[input.category] ?? 0.4;
  const ageDays = (Date.now() - new Date(input.createdAt).getTime()) / 86_400_000;
  const ageScore = clamp01(ageDays / Math.max(1, c.ageDays));
  const affectedProxy = input.upvoteCount + (input.duplicateCandidateCount ?? 0) * 3;
  const affectedScore = clamp01(affectedProxy / Math.max(1, c.affected));
  const statusScore = ['REPORTED', 'UNDER_REVIEW'].includes(input.status) ? 1 : input.status === 'ASSIGNED' ? 0.5 : 0;
  const contextScore = clamp01((input.duplicateCandidateCount ?? 0) / Math.max(1, c.context));

  const breakdown: PriorityConfig['weights'] & Record<string, number> = {
    upvotes: upvoteScore * w.upvotes,
    severity: severityScore * w.severity,
    age: ageScore * w.age,
    affected: affectedScore * w.affected,
    status: statusScore * w.status,
    context: contextScore * w.context,
  } as any;

  const total = Object.values(breakdown).reduce((a, b) => a + b, 0);
  const score = Math.round(clamp01(total) * 100);

  const level: PriorityResult['level'] =
    score >= cfg.thresholds.critical ? 'CRITICAL' : score >= cfg.thresholds.high ? 'HIGH' : score >= cfg.thresholds.medium ? 'MEDIUM' : 'LOW';

  const reasons: string[] = [];
  if (upvoteScore > 0.5) reasons.push('High community support');
  else if (upvoteScore > 0.15) reasons.push('Some community support');
  if (severityScore >= 0.7) reasons.push('High severity category');
  else if (severityScore >= 0.5) reasons.push('Moderate severity category');
  if (ageScore > 0.6) reasons.push('Issue has remained unresolved for a long time');
  else if (ageScore > 0.3) reasons.push('Issue has remained unresolved');
  if (affectedScore > 0.5) reasons.push('Likely affects many citizens');
  if (statusScore === 1) reasons.push('Not yet reviewed or actioned');
  if (contextScore > 0.3) reasons.push('Multiple related reports nearby');
  if (reasons.length === 0) reasons.push('No strong priority signals yet');

  return { score, level, reasons, breakdown };
}
