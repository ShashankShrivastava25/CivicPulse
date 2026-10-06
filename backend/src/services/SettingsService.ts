import { env } from '../config/env';
import { Setting } from '../models';

/** Runtime-configurable settings stored in MongoDB. Environment variables provide the defaults.
 *  The Hugging Face API key is deliberately NOT part of this: it only ever lives in the server environment. */
export interface AiConfig {
  imageModel: string;
  imageEmbeddingModel: string;
  textEmbeddingModel: string;
  imageSimilarityWeight: number;
  textSimilarityWeight: number;
  locationWeight: number;
  categoryWeight: number;
  duplicateThreshold: number;
  duplicateSearchRadius: number; // metres
}

export interface PriorityConfig {
  weights: { upvotes: number; severity: number; age: number; affected: number; status: number; context: number };
  caps: { upvotes: number; ageDays: number; affected: number; context: number };
  thresholds: { critical: number; high: number; medium: number };
  categorySeverity: Record<string, number>;
}

const num = (v: string | undefined, d: number) => { const n = Number(v); return Number.isFinite(n) ? n : d; };

export const aiDefaults = (): AiConfig => ({
  imageModel: env.HF_IMAGE_MODEL ?? '',
  imageEmbeddingModel: env.HF_IMAGE_EMBEDDING_MODEL ?? '',
  textEmbeddingModel: env.HF_TEXT_EMBEDDING_MODEL ?? '',
  imageSimilarityWeight: num(env.IMAGE_SIMILARITY_WEIGHT, 0.4),
  textSimilarityWeight: num(env.TEXT_SIMILARITY_WEIGHT, 0.35),
  locationWeight: num(env.LOCATION_WEIGHT, 0.15),
  categoryWeight: num(env.CATEGORY_WEIGHT, 0.1),
  duplicateThreshold: num(env.DUPLICATE_THRESHOLD, 0.6),
  duplicateSearchRadius: num(env.DUPLICATE_SEARCH_RADIUS_METERS, 500),
});

export const priorityDefaults = (): PriorityConfig => ({
  weights: { upvotes: 0.2, severity: 0.25, age: 0.2, affected: 0.1, status: 0.15, context: 0.1 },
  caps: { upvotes: 20, ageDays: 14, affected: 200, context: 5 },
  thresholds: { critical: 70, high: 50, medium: 30 },
  categorySeverity: {
    Garbage: 0.5, Drainage: 0.7, 'Road Damage': 0.6, Pothole: 0.7, Streetlight: 0.5,
    'Water Leakage': 0.7, Waterlogging: 0.9, Sanitation: 0.6, 'Public Infrastructure': 0.6, Other: 0.3,
  },
});

const TTL_MS = 30_000;
const cache = new Map<string, { at: number; value: unknown }>();

async function load<T extends object>(key: string, defaults: T): Promise<T> {
  const hit = cache.get(key);
  if (hit && Date.now() - hit.at < TTL_MS) return hit.value as T;
  const row = await Setting.findOne({ key }).lean();
  const stored = (row?.value ?? {}) as Partial<T>;
  const merged = mergeDeep(defaults, stored) as T;
  cache.set(key, { at: Date.now(), value: merged });
  return merged;
}

function mergeDeep<T extends object>(
  base: T,
  over: Record<string, unknown>,
): T {
  const out = { ...base } as Record<string, unknown>;

  for (const [k, v] of Object.entries(over ?? {})) {
    const b = out[k];

    if (
      b &&
      typeof b === "object" &&
      !Array.isArray(b) &&
      v &&
      typeof v === "object" &&
      !Array.isArray(v)
    ) {
      out[k] = mergeDeep(
        b as Record<string, unknown>,
        v as Record<string, unknown>,
      );
    } else {
      out[k] = v;
    }
  }

  return out as T;
}

export const getAiConfig = () => load<AiConfig>('ai.config', aiDefaults());
export const getPriorityConfig = () => load<PriorityConfig>('priority.config', priorityDefaults());

export async function saveSetting(key: 'ai.config' | 'priority.config', value: object, userId: string) {
  await Setting.findOneAndUpdate({ key }, { key, value, updatedBy: userId }, { upsert: true, new: true });
  cache.delete(key);
}
