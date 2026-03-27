import { GoogleGenAI } from "@google/genai";
import { z } from "zod";

// Singleton Gemini client
let geminiClient: GoogleGenAI | null = null;

function getGeminiClient(): GoogleGenAI {
  if (!geminiClient) {
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) throw new Error("GEMINI_API_KEY not set");
    geminiClient = new GoogleGenAI({ apiKey: apiKey.trim() });
  }
  return geminiClient;
}

export type ThinkingLevel = "minimal" | "low" | "medium" | "high";

interface GenerateOptions {
  model?: string;
  systemPrompt?: string;
  userPrompt: string;
  jsonSchema?: Record<string, unknown>;
  thinkingLevel?: ThinkingLevel;
  maxRetries?: number;
}

interface GenerateResult<T = unknown> {
  data: T;
  raw: string;
  tokensUsed?: number;
}

// Rate limiter — token bucket (15 RPM, burst 5)
const BUCKET_MAX = 5;
const REFILL_RATE = 15 / 60; // tokens per second
let bucketTokens = BUCKET_MAX;
let lastRefill = Date.now();

async function acquireToken(): Promise<void> {
  const now = Date.now();
  const elapsed = (now - lastRefill) / 1000;
  bucketTokens = Math.min(BUCKET_MAX, bucketTokens + elapsed * REFILL_RATE);
  lastRefill = now;

  if (bucketTokens >= 1) {
    bucketTokens -= 1;
    return;
  }

  // Wait for next token
  const waitMs = ((1 - bucketTokens) / REFILL_RATE) * 1000;
  await new Promise((resolve) => setTimeout(resolve, waitMs));
  bucketTokens = 0;
  lastRefill = Date.now();
}

/**
 * Generate structured content from Gemini 3 Flash.
 * Handles retries, rate limiting, and JSON parsing.
 */
export async function generateStructured<T>(
  options: GenerateOptions,
  schema: { parse: (data: unknown) => T }
): Promise<GenerateResult<T>> {
  const {
    model = "gemini-2.0-flash-lite",
    systemPrompt,
    userPrompt,
    jsonSchema,
    thinkingLevel = "low",
    maxRetries = 2,
  } = options;

  const client = getGeminiClient();

  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      await acquireToken();

      const contents: Array<{ role: string; parts: Array<{ text: string }> }> = [];

      if (systemPrompt) {
        contents.push({
          role: "user",
          parts: [{ text: `[SYSTEM INSTRUCTIONS]\n${systemPrompt}\n[END SYSTEM INSTRUCTIONS]` }],
        });
        contents.push({
          role: "model",
          parts: [{ text: "Understood. I will follow these instructions." }],
        });
      }

      contents.push({
        role: "user",
        parts: [{ text: userPrompt }],
      });

      const config: Record<string, unknown> = {};

      if (jsonSchema) {
        config.responseMimeType = "application/json";
        config.responseSchema = jsonSchema;
      }

      // Only add thinking config for models that support it (not flash-lite)
      if (thinkingLevel !== "minimal" && !model.includes("lite")) {
        config.thinkingConfig = { thinkingLevel };
      }

      const response = await client.models.generateContent({
        model,
        contents,
        config,
      });

      const raw = response.text ?? "";

      if (!raw.trim()) {
        if (attempt < maxRetries) continue;
        throw new Error("Empty response from Gemini");
      }

      // Parse JSON response — try direct parse first, then extraction
      let parsed: unknown;
      try {
        parsed = JSON.parse(raw);
      } catch {
        const jsonStr = extractJson(raw);
        parsed = JSON.parse(jsonStr);
      }
      const validated = schema.parse(parsed);

      return {
        data: validated,
        raw,
      };
    } catch (error) {
      if (attempt < maxRetries) {
        await new Promise((r) => setTimeout(r, 2000 * (attempt + 1)));
        continue;
      }
      throw error;
    }
  }

  throw new Error("Max retries exceeded");
}

/**
 * Generate plain text from Gemini (no structured output).
 */
export async function generateText(
  options: Omit<GenerateOptions, "jsonSchema">
): Promise<string> {
  const {
    model = "gemini-2.0-flash-lite",
    systemPrompt,
    userPrompt,
    thinkingLevel = "low",
    maxRetries = 2,
  } = options;

  const client = getGeminiClient();

  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      await acquireToken();

      const contents: Array<{ role: string; parts: Array<{ text: string }> }> = [];

      if (systemPrompt) {
        contents.push({
          role: "user",
          parts: [{ text: `[SYSTEM INSTRUCTIONS]\n${systemPrompt}\n[END SYSTEM INSTRUCTIONS]` }],
        });
        contents.push({
          role: "model",
          parts: [{ text: "Understood." }],
        });
      }

      contents.push({
        role: "user",
        parts: [{ text: userPrompt }],
      });

      const config: Record<string, unknown> = {};
      if (thinkingLevel !== "minimal" && !model.includes("lite")) {
        config.thinkingConfig = { thinkingLevel };
      }

      const response = await client.models.generateContent({
        model,
        contents,
        config,
      });

      return response.text ?? "";
    } catch (error) {
      if (attempt < maxRetries) {
        await new Promise((r) => setTimeout(r, 2000 * (attempt + 1)));
        continue;
      }
      throw error;
    }
  }

  throw new Error("Max retries exceeded");
}

/** Extract JSON from a response that might have markdown fences */
function extractJson(text: string): string {
  // Try to find JSON in markdown code blocks
  const fenceMatch = text.match(/```(?:json)?\s*\n?([\s\S]*?)\n?```/);
  if (fenceMatch) return fenceMatch[1].trim();

  // Try to find raw JSON object/array
  const jsonMatch = text.match(/(\{[\s\S]*\}|\[[\s\S]*\])/);
  if (jsonMatch) return jsonMatch[1].trim();

  return text.trim();
}
