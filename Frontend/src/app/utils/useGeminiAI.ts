"use client";

import { GoogleGenerativeAI } from "@google/generative-ai";
import { useCallback, useRef, useState } from "react";
import { showToast } from "./commonFunctions";

const API_KEY = process.env.NEXT_PUBLIC_GEMINI_API_KEY;

export type GeminiContext = "product" | "category" | "general";

export interface UseGeminiAIOptions {
  context?: GeminiContext;
  modelName?: string;
  temperature?: number;
  maxOutputTokens?: number;
}

export interface UseGeminiAIResult {
  generate: (name: string, extraContext?: string) => Promise<string | null>;
  loading: boolean;
  error: string | null;
  lastResult: string | null;
  reset: () => void;
}

// ✅ Google's currently supported active model
const DEFAULT_MODEL = "gemini-2.5-pro  ";

// Minimum acceptable word count before we retry / give up
// (Lowered from 60 → 40 since the new bullet-point format is intentionally short)
const MIN_WORDS = 40;
// How many times to automatically retry if the AI returns a short response
const MAX_RETRIES = 2;

function buildPrompt(
  name: string,
  context: GeminiContext,
  extraContext?: string,
): string {
  const subject =
    context === "product"
      ? "product"
      : context === "category"
        ? "category"
        : "item";

  const base = [
    `You are a fun, relatable e-commerce copywriter for an online store called "ZeeF Trendy Store".`,
    `Write a SHORT, SCANNABLE, BULLET-POINT style description for the following ${subject} — like a real person hyping it up to a friend, NOT a corporate robot.`,
    `${subject === "product" ? "Product" : subject === "category" ? "Category" : "Item"} Name: "${name}".`,
  ];

  if (extraContext && extraContext.trim()) {
    base.push(
      `Additional details to weave in naturally: ${extraContext.trim()}.`,
    );
  }

  base.push(
    `Tone & style requirements:`,
    `- Write like a human, not a robot. Conversational, casual, relatable.`,
    `- Keep the language simple and easy English that anyone can read.`,
    `Formatting requirements (STRICT):`,
    `- Line 1: ONE short, punchy hook line introducing the ${subject} (can include 1 emoji).`,
    `- Then 4 to 6 short bullet points, each on its own line, each starting with a relevant emoji (e.g. ✅ 🔥 💯 ⭐ 👌 🎯) instead of a dash or asterisk.`,
    `- Each bullet must be SHORT — under 12 words — and specific to THIS ${subject} (no generic filler like "high quality material").`,
    `- Last line: ONE short closing line (under 15 words) that creates urgency/desire to buy now.`,
    `- Total length: 60 to 100 words. Do not write long paragraphs.`,
    `- NO markdown formatting at all: no asterisks, no hashtags, no dash bullets, no code blocks, no headings, no labels.`,
    `- Return ONLY the description text (hook line + emoji bullets + closing line), nothing else. No intro, no "Here is your description".`,
  );

  return base.join("\n");
}

function cleanText(raw: string): string {
  if (!raw) return "";

  return raw
    .replace(/^#+\s*/gm, "")
    .replace(/^\s*[-*+]\s+/gm, "")
    .replace(/^\s*(\d+\.)\s+/gm, "")
    .replace(/\*\*(.+?)\*\*/g, "$1")
    .replace(/__(.+?)__/g, "$1")
    .replace(/\*(.+?)\*/g, "$1")
    .replace(/_(.+?)_/g, "$1")
    .replace(/`([^`]+)`/g, "$1")
    .replace(/\r/g, "")
    .replace(/\n{3,}/g, "\n\n")
    .trim();
}

function countWords(text: string): number {
  const matches = text.trim().match(/\S+/g);
  return matches ? matches.length : 0;
}

// Detects a 429 / quota-exceeded error so we can show a clear message and
// avoid wasting remaining quota by auto-retrying.
function isQuotaExceededError(err: any): boolean {
  if (!err) return false;
  const status = err?.status ?? err?.response?.status;
  if (status === 429) return true;
  const text = [
    err?.message,
    err?.response?.statusText,
    err?.body,
    err?.error?.message,
    err?.error?.status,
  ]
    .filter(Boolean)
    .join(" ")
    .toLowerCase();
  return (
    /429/.test(text) ||
    /quota/i.test(text) ||
    /rate.?limit/i.test(text) ||
    /resource.?exhausted/i.test(text) ||
    /exceeded/i.test(text)
  );
}

export function useGeminiAI(
  options: UseGeminiAIOptions = {},
): UseGeminiAIResult {
  const {
    context = "general",
    modelName,
    temperature,
    maxOutputTokens,
  } = options;

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [lastResult, setLastResult] = useState<string | null>(null);
  const clientRef = useRef<GoogleGenerativeAI | null>(null);

  const getClient = useCallback((): GoogleGenerativeAI | null => {
    if (!API_KEY) {
      showToast("Gemini API key is not configured", "error");
      return null;
    }
    if (!clientRef.current) {
      clientRef.current = new GoogleGenerativeAI(API_KEY);
    }
    return clientRef.current;
  }, []);

  const generateOnce = useCallback(
    async (
      client: GoogleGenerativeAI,
      name: string,
      extraContext?: string,
    ): Promise<string> => {
      const model = client.getGenerativeModel({
        model: modelName || DEFAULT_MODEL,
        generationConfig: {
          temperature: temperature ?? 0.9,
          // Lowered from 2048 → 600 since we only need a short bullet-point
          // description now, not a 180-280 word paragraph. Still generous
          // headroom above the ~60-100 word target.
          maxOutputTokens: maxOutputTokens ?? 600,
          topP: 0.95,
          topK: 40,
          // 🔧 KEEP THIS FIX: gemini-2.5-flash is a "thinking" model — by
          // default it spends part of maxOutputTokens on internal reasoning
          // before ever writing the actual answer, which previously caused
          // finishReason: MAX_TOKENS with almost no real output. Disabling
          // thinking ensures the full token budget goes to the actual text.
          thinkingConfig: {
            thinkingBudget: 0,
          },
        } as any,
      });

      const prompt = buildPrompt(name, context, extraContext);
      const result = await model.generateContent(prompt);
      const raw = result.response.text();

      return cleanText(raw);
    },
    [context, modelName, temperature, maxOutputTokens],
  );

  const generate = useCallback(
    async (name: string, extraContext?: string): Promise<string | null> => {
      if (!name || !name.trim()) {
        showToast("Please enter a name first", "error");
        return null;
      }

      const client = getClient();
      if (!client) {
        setError("Gemini API key is not configured");
        return null;
      }

      setLoading(true);
      setError(null);

      let lastError: string | null = null;

      for (let attempt = 1; attempt <= MAX_RETRIES; attempt++) {
        try {
          const cleaned = await generateOnce(client, name, extraContext);

          if (!cleaned) {
            lastError = "Received an empty response from Gemini";
            continue; // try again
          }

          const wordCount = countWords(cleaned);

          if (wordCount < MIN_WORDS) {
            lastError = `Generated description was too short (${wordCount} words). Retrying...`;
            console.warn(
              `[useGeminiAI] Attempt ${attempt}/${MAX_RETRIES} returned only ${wordCount} words, retrying...`,
            );
            continue; // try again
          }

          // Success
          setLastResult(cleaned);
          setLoading(false);
          return cleaned;
        } catch (err: any) {
          console.error(
            `[useGeminiAI] Attempt ${attempt}/${MAX_RETRIES} failed:`,
            err,
          );

          // 429 / quota-exceeded: show a clear message and STOP retrying so
          // we don't burn the remaining daily quota on repeat failures.
          if (isQuotaExceededError(err)) {
            const quotaMessage =
              "Daily AI limit reached, try again later or write manually";
            setError(quotaMessage);
            showToast(quotaMessage, "error");
            setLoading(false);
            return null;
          }

          lastError = err?.message || "Failed to generate content with AI";
        }
      }

      // All retries exhausted
      const finalMessage =
        lastError ||
        "Failed to generate a full description after multiple attempts. Please try again.";
      setError(finalMessage);
      showToast(finalMessage, "error");
      setLoading(false);
      return null;
    },
    [getClient, generateOnce],
  );

  const reset = useCallback(() => {
    setError(null);
    setLastResult(null);
    setLoading(false);
  }, []);

  return { generate, loading, error, lastResult, reset };
}

export default useGeminiAI;