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
const DEFAULT_MODEL = "gemini-3-flash-preview";

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
    `You are an expert e-commerce copywriter for an online store called "ZeeF Trendy Store".`,
    `Write a compelling, professional, marketing-focused and complete SEO-optimized description for the following ${subject}.`,
    `${subject === "product" ? "Product" : subject === "category" ? "Category" : "Item"} Name: "${name}".`,
  ];

  if (extraContext && extraContext.trim()) {
    base.push(
      `Additional details to incorporate naturally: ${extraContext.trim()}.`,
    );
  }

  base.push(
    `Requirements:`,
    `- Output plain text only. No markdown, no asterisks, no hashtags, no bullet symbols, no code blocks, no emojis.`,
    `- No headings or labels, just flowing descriptive paragraphs.`,
    `- Keep it between 40 and 110 words.`,
    `- Highlight key benefits and selling points.`,
    `- Use a confident, persuasive, customer-friendly tone.`,
    `- Return ONLY the description text, nothing else.`,
    `- Ensure the description is complete, detailed, and reaches at least 80 words.`,
    `- Do not truncate the response.`,
    `- Return ONLY the description text, nothing else.`,
  );

  return base.join("\n");
}

function cleanText(raw: string): string {
  if (!raw) return "";

  return raw
    .replace(/```[\s\S]*?```/g, (m) => m.replace(/```/g, ""))
    .replace(/```/g, "")
    .replace(/^#+\s*/gm, "")
    .replace(/^\s*[-*+]\s+/gm, "")
    .replace(/^\s*(\d+\.)\s+/gm, "")
    .replace(/\*\*(.+?)\*\*/g, "$1")
    .replace(/__(.+?)__/g, "$1")
    .replace(/\*(.+?)\*/g, "$1")
    .replace(/_(.+?)_/g, "$1")
    .replace(/`([^`]+)`/g, "$1")
    .replace(/[#*_>`~]/g, "")
    .replace(/\r/g, "")
    .replace(/\n{3,}/g, "\n\n")
    .trim();
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

      try {
        // useGeminiAI hook ke andar:
        const model = client.getGenerativeModel({
          model: modelName || DEFAULT_MODEL,
          generationConfig: {
            temperature: temperature ?? 0.8, // 0.7 behtar balance deta hai
            maxOutputTokens: maxOutputTokens ?? 300, // 256 se badhakar 800-1000 karein
          },
        });

        const prompt = buildPrompt(name, context, extraContext);
        const result = await model.generateContent(prompt);
        const raw = result.response.text();

        const cleaned = cleanText(raw);

        if (!cleaned) {
          throw new Error("Received an empty response from Gemini");
        }

        setLastResult(cleaned);
        return cleaned;
      } catch (err: any) {
        console.error("Gemini AI Error:", err); // ✅ Yeh line console mein actual masla dikhayegi
        const message = err?.message || "Failed to generate content with AI";
        setError(message);
        showToast(message, "error");
        return null;
      } finally {
        setLoading(false);
      }
    },
    [context, getClient, modelName, temperature, maxOutputTokens],
  );

  const reset = useCallback(() => {
    setError(null);
    setLastResult(null);
    setLoading(false);
  }, []);

  return { generate, loading, error, lastResult, reset };
}

export default useGeminiAI;
