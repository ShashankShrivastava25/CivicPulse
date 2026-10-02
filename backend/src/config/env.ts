import 'dotenv/config';
import { z } from 'zod';

const schema = z.object({
  NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),
  PORT: z.coerce.number().default(5000),
  MONGODB_URI: z.string().min(1, 'MONGODB_URI is required'),
  JWT_SECRET: z.string().min(32, 'JWT_SECRET must be at least 32 characters'),
  JWT_EXPIRES_IN: z.string().default('7d'),
  CLIENT_URL: z.string().url().default('http://localhost:3000'),
  // Public base URL of this API, used to build links to uploaded images.
  API_PUBLIC_URL: z.string().url().default('http://localhost:5000'),
  
  // Admin seeding
  SEED_ADMIN_EMAIL: z.string().email().optional(),
  SEED_ADMIN_PASSWORD: z.string().optional(),
  SEED_ADMIN_NAME: z.string().default('System Administrator'),
  
  // Hugging Face API
  HUGGINGFACE_API_KEY: z.string().optional(),
  HF_IMAGE_MODEL: z.string().optional(),
  HF_IMAGE_EMBEDDING_MODEL: z.string().optional(),
  HF_TEXT_EMBEDDING_MODEL: z.string().optional(),
  
  // Cloud storage (Cloudinary)
  CLOUDINARY_CLOUD_NAME: z.string().optional(),
  CLOUDINARY_API_KEY: z.string().optional(),
  CLOUDINARY_API_SECRET: z.string().optional(),
  
  // Duplicate detection configuration
  DUPLICATE_SEARCH_RADIUS_METERS: z.string().default('500'),
  DUPLICATE_THRESHOLD: z.string().default('0.6'),
  
  // Similarity calculation weights
  IMAGE_SIMILARITY_WEIGHT: z.string().default('0.4'),
  TEXT_SIMILARITY_WEIGHT: z.string().default('0.35'),
  LOCATION_WEIGHT: z.string().default('0.15'),
  CATEGORY_WEIGHT: z.string().default('0.1'),
});

const parsed = schema.safeParse(process.env);
if (!parsed.success) {
  console.error('Invalid environment configuration:', parsed.error.flatten().fieldErrors);
  process.exit(1);
}
export const env = parsed.data;
export const isProd = env.NODE_ENV === 'production';
