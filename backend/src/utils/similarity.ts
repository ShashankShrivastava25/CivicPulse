/**
 * Similarity calculation utilities
 */

/**
 * Calculate cosine similarity between two vectors
 * @param vectorA - First vector (embedding)
 * @param vectorB - Second vector (embedding)
 * @returns Cosine similarity score (0-1)
 */
export function calculateCosineSimilarity(
  vectorA: number[],
  vectorB: number[],
): number {
  if (!vectorA || !vectorB || vectorA.length !== vectorB.length) {
    return 0;
  }

  let dotProduct = 0;
  let magnitudeA = 0;
  let magnitudeB = 0;

  for (let i = 0; i < vectorA.length; i++) {
    dotProduct += vectorA[i] * vectorB[i];
    magnitudeA += vectorA[i] * vectorA[i];
    magnitudeB += vectorB[i] * vectorB[i];
  }

  magnitudeA = Math.sqrt(magnitudeA);
  magnitudeB = Math.sqrt(magnitudeB);

  if (magnitudeA === 0 || magnitudeB === 0) {
    return 0;
  }

  return dotProduct / (magnitudeA * magnitudeB);
}

/**
 * Calculate Haversine distance between two geographic points
 * @returns Distance in meters
 */
export function calculateHaversineDistance(
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number,
): number {
  const R = 6371000; // Earth's radius in meters
  const φ1 = (lat1 * Math.PI) / 180;
  const φ2 = (lat2 * Math.PI) / 180;
  const Δφ = ((lat2 - lat1) * Math.PI) / 180;
  const Δλ = ((lon2 - lon1) * Math.PI) / 180;

  const a =
    Math.sin(Δφ / 2) * Math.sin(Δφ / 2) +
    Math.cos(φ1) * Math.cos(φ2) * Math.sin(Δλ / 2) * Math.sin(Δλ / 2);

  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

/**
 * Calculate category match score
 * @returns Match score (0 or 1)
 */
export function calculateCategoryMatch(
  category1: string,
  category2: string,
): number {
  return category1.toLowerCase() === category2.toLowerCase() ? 1 : 0;
}

/**
 * Calculate location proximity score based on distance
 * @returns Proximity score (0-1)
 */
export function calculateLocationScore(
  distanceMeters: number,
  searchRadiusMeters: number = 500,
): number {
  if (distanceMeters <= 0) return 1; // Same location
  if (distanceMeters >= searchRadiusMeters) return 0; // Outside search radius

  // Exponential decay: closer is better
  return Math.exp(-(distanceMeters / (searchRadiusMeters / 2)));
}

/**
 * Calculate duplicate confidence score
 * Combines multiple similarity metrics with configurable weights
 *
 * Formula:
 * confidence = (imageSimilarity * w_image) +
 *              (textSimilarity * w_text) +
 *              (locationScore * w_location) +
 *              (categoryMatch * w_category)
 *
 * Where weights sum to 1.0
 */
export interface DuplicateConfidenceInput {
  imageSimilarity: number; // 0-1
  textSimilarity: number; // 0-1
  locationScore: number; // 0-1
  categoryMatch: number; // 0 or 1
}

export interface DuplicateConfidenceWeights {
  imageWeight?: number;
  textWeight?: number;
  locationWeight?: number;
  categoryWeight?: number;
}

const DEFAULT_WEIGHTS: Required<DuplicateConfidenceWeights> = {
  imageWeight: 0.4,
  textWeight: 0.35,
  locationWeight: 0.15,
  categoryWeight: 0.1,
};

export function calculateDuplicateConfidence(
  input: DuplicateConfidenceInput,
  weights: DuplicateConfidenceWeights = {},
): number {
  const w = { ...DEFAULT_WEIGHTS, ...weights };

  // Validate weights sum to approximately 1
  const totalWeight =
    w.imageWeight + w.textWeight + w.locationWeight + w.categoryWeight;
  if (Math.abs(totalWeight - 1) > 0.01) {
    console.warn(
      `Warning: Duplicate confidence weights sum to ${totalWeight}, expected 1`,
    );
  }

  const confidence =
    input.imageSimilarity * w.imageWeight +
    input.textSimilarity * w.textWeight +
    input.locationScore * w.locationWeight +
    input.categoryMatch * w.categoryWeight;

  // Clamp to 0-1
  return Math.min(1, Math.max(0, confidence));
}

/**
 * Get default weight configuration
 */
export function getDefaultWeights(): Required<DuplicateConfidenceWeights> {
  return { ...DEFAULT_WEIGHTS };
}

/** Normalise text into word tokens (lowercase, no punctuation, no tiny/stop words). */
const STOP = new Set([
  "the",
  "and",
  "for",
  "are",
  "was",
  "with",
  "this",
  "that",
  "there",
  "near",
  "from",
  "have",
  "has",
  "not",
  "but",
  "its",
  "very",
  "please",
  "road",
  "area",
]);
function tokens(text: string): string[] {
  return (text || "")
    .toLowerCase()
    .replace(/[^\p{L}\p{N}\s]/gu, " ")
    .split(/\s+/)
    .filter((t) => t.length > 2 && !STOP.has(t));
}

/**
 * Lexical text similarity (0-1) using token-set cosine. Used as a fallback when
 * text embeddings are unavailable (HF down / model loading / key missing).
 */
export function calculateTextOverlap(a: string, b: string): number {
  const A = new Set(tokens(a));
  const B = new Set(tokens(b));
  if (A.size === 0 || B.size === 0) return 0;
  let inter = 0;
  A.forEach((t) => {
    if (B.has(t)) inter++;
  });
  return inter / Math.sqrt(A.size * B.size);
}

/**
 * Perceptual-hash similarity (0-1) from two hex dHash strings (Hamming distance).
 * Works without any external API, so the same/similar photo is detected even when HF fails.
 */
export function calculateHashSimilarity(
  hexA?: string | null,
  hexB?: string | null,
): number {
  if (!hexA || !hexB || hexA.length !== hexB.length) return 0;
  let diff = 0;
  for (let i = 0; i < hexA.length; i++) {
    let x = parseInt(hexA[i], 16) ^ parseInt(hexB[i], 16);
    while (x) {
      diff += x & 1;
      x >>= 1;
    }
  }
  return 1 - diff / (hexA.length * 4);
}

/**
 * Weighted confidence over ONLY the signals that are actually available.
 * Missing signals (null) are dropped and the remaining weights re-normalised, so a missing
 * embedding no longer caps the score below the threshold.
 */
export function combineAvailableSignals(
  signals: {
    image: number | null;
    text: number | null;
    location: number;
    category: number;
  },
  w: {
    imageWeight: number;
    textWeight: number;
    locationWeight: number;
    categoryWeight: number;
  },
): number {
  let total = 0,
    score = 0;
  if (signals.image !== null) {
    total += w.imageWeight;
    score += signals.image * w.imageWeight;
  }
  if (signals.text !== null) {
    total += w.textWeight;
    score += signals.text * w.textWeight;
  }
  total += w.locationWeight;
  score += signals.location * w.locationWeight;
  total += w.categoryWeight;
  score += signals.category * w.categoryWeight;
  return total > 0 ? Math.min(1, Math.max(0, score / total)) : 0;
}
