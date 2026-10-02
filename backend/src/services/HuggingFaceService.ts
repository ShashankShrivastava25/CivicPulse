import { env } from "../config/env";
import { getAiConfig } from "./SettingsService";

export interface ImageClassificationResult {
  label: string;
  score: number;
}

export interface EmbeddingResult {
  embeddings: number[];
}

/**
 * HuggingFaceService: Communicates with Hugging Face Inference API
 *
 * Never exposes API key to frontend.
 * Backend handles all Hugging Face communication.
 */
export class HuggingFaceService {
  private static readonly HF_API_URL =
    "https://router.huggingface.co/hf-inference/models";
  // The API key is a server secret. It is read ONLY from the environment, never from admin-configurable
  // settings, and is never included in any API response (see adminController.getAiConfiguration).
  private static readonly API_KEY = env.HUGGINGFACE_API_KEY;

  /**
   * Classify an image using Hugging Face image classification model
   */
  static async classifyImage(
    imageBuffer: Buffer,
  ): Promise<ImageClassificationResult[] | null> {
    const cfg = await getAiConfig();
    if (!this.API_KEY || !cfg.imageModel) {
      console.warn("Hugging Face image classification not configured");
      return null;
    }

    try {
      const response = await fetch(`${this.HF_API_URL}/${cfg.imageModel}`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${this.API_KEY}`,
          "Content-Type": "application/octet-stream",
        },
        body: new Uint8Array(imageBuffer),
      });

      if (!response.ok) {
        if (response.status === 503) {
          console.warn("Hugging Face model is loading or unavailable");
          return null;
        }
        throw new Error(
          `HF API error: ${response.status} ${response.statusText} - ${(await response.text()).slice(0, 200)}`,
        );
      }

      const results = (await response.json()) as ImageClassificationResult[];
      return results;
    } catch (error) {
      console.error("Error classifying image:", error);
      return null;
    }
  }

  /**
   * Generate image embeddings for semantic similarity
   */
  static async getImageEmbedding(
    imageBuffer: Buffer,
  ): Promise<number[] | null> {
    const cfg = await getAiConfig();
    if (!this.API_KEY || !cfg.imageEmbeddingModel) {
      console.warn("Hugging Face image embedding not configured");
      return null;
    }

    try {
      const response = await fetch(
        `${this.HF_API_URL}/${cfg.imageEmbeddingModel}`,
        {
          method: "POST",
          headers: {
            Authorization: `Bearer ${this.API_KEY}`,
            "Content-Type": "application/octet-stream",
          },
          body: new Uint8Array(imageBuffer),
        },
      );

      if (!response.ok) {
        if (response.status === 503) {
          console.warn(
            "Hugging Face embedding model is loading or unavailable",
          );
          return null;
        }
        throw new Error(
          `HF API error: ${response.status} ${response.statusText} - ${(await response.text()).slice(0, 200)}`,
        );
      }

      const data = (await response.json()) as any;

      // Handle different response formats
      if (Array.isArray(data)) {
        return data;
      }
      if (data.embeddings) {
        return data.embeddings[0] || data.embeddings;
      }
      if (data[0] && Array.isArray(data[0])) {
        return data[0];
      }

      console.warn("Unexpected embedding response format:", data);
      return null;
    } catch (error) {
      console.error("Error generating image embedding:", error);
      return null;
    }
  }

  /**
   * Generate text embeddings for semantic similarity
   */
  static async getTextEmbedding(text: string): Promise<number[] | null> {
    const cfg = await getAiConfig();
    if (!this.API_KEY || !cfg.textEmbeddingModel) {
      console.warn("Hugging Face text embedding not configured");
      return null;
    }

    try {
      const response = await fetch(
        `${this.HF_API_URL}/${cfg.textEmbeddingModel}/pipeline/feature-extraction`,
        {
          method: "POST",
          headers: {
            Authorization: `Bearer ${this.API_KEY}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            inputs: text,
            options: { wait_for_model: true },
          }),
        },
      );

      if (!response.ok) {
        if (response.status === 503) {
          console.warn(
            "Hugging Face text embedding model is loading or unavailable",
          );
          return null;
        }
        throw new Error(
          `HF API error: ${response.status} ${response.statusText} - ${(await response.text()).slice(0, 200)}`,
        );
      }

      const data = (await response.json()) as any;

      // 1-D vector: use as is. 2-D (per-token): mean-pool into one vector.
      if (Array.isArray(data) && typeof data[0] === "number") return data;
      if (Array.isArray(data) && Array.isArray(data[0])) {
        const rows = (Array.isArray(data[0][0]) ? data[0] : data) as number[][];
        const dim = rows[0].length;
        const out = new Array(dim).fill(0);
        for (const r of rows)
          for (let i = 0; i < dim; i++) out[i] += r[i] / rows.length;
        return out;
      }

      console.warn("Unexpected text embedding response format:", data);
      return null;
    } catch (error) {
      console.error("Error generating text embedding:", error);
      return null;
    }
  }

  /**
   * Suggest a category based on image classification
   * Maps HF labels to CivicPulse categories
   */
  static suggestCategory(
    classificationResults: ImageClassificationResult[],
  ): { category: string; confidence: number } | null {
    if (!classificationResults || classificationResults.length === 0) {
      return null;
    }

    const topResult = classificationResults[0];
    const categoryMapping: Record<string, string> = {
      garbage: "Garbage",
      trash: "Garbage",
      waste: "Garbage",
      pothole: "Pothole",
      hole: "Pothole",
      road: "Road Damage",
      "damaged road": "Road Damage",
      streetlight: "Streetlight",
      "street light": "Streetlight",
      light: "Streetlight",
      water: "Water Leakage",
      "water leak": "Water Leakage",
      drainage: "Drainage",
      drain: "Drainage",
      waterlogging: "Waterlogging",
      flood: "Waterlogging",
      sanitation: "Sanitation",
      infrastructure: "Public Infrastructure",
    };

    const labelLower = topResult.label.toLowerCase();
    for (const [key, value] of Object.entries(categoryMapping)) {
      if (labelLower.includes(key)) {
        return { category: value, confidence: topResult.score };
      }
    }

    // Simple heuristic based on confidence
    if (topResult.score > 0.5) {
      return { category: "Public Infrastructure", confidence: topResult.score };
    }

    return null;
  }

  /**
   * Check if API is configured
   */
  static async isConfigured(): Promise<boolean> {
    const cfg = await getAiConfig();
    return !!(
      this.API_KEY &&
      cfg.imageModel &&
      cfg.imageEmbeddingModel &&
      cfg.textEmbeddingModel
    );
  }

  /** True only if the server has a Hugging Face API key set. Never reveals the key itself. */
  static hasApiKey(): boolean {
    return !!this.API_KEY;
  }
}
