import { Product } from "../Models/Product.js";
import { createError, createSuccess } from "../utils/commonFunctions.js";
import { GoogleGenerativeAI } from "@google/generative-ai";

// Prompt to extract structured intent from user query
const INTENT_PROMPT = `You are an e‑commerce assistant. Given a natural language query from a shopper, output a JSON object with the following shape:
{
  "keywords": string[],          // important words (excluding stop‑words)
  "category": string | null,     // category name if clearly mentioned
  "minPrice": number | null,     // lowest price mentioned (inclusive)
  "maxPrice": number | null,     // highest price mentioned (inclusive)
  "colors": string[],            // any color words mentioned
  "isProductQuery": boolean      // true if the user is asking about a product, false otherwise
}
Only output valid JSON, no explanations. If the query is unrelated to shopping, set "isProductQuery" to false and leave other fields null or empty arrays.`;

// Helper: call Gemini to get intent JSON
async function getIntent(query) {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) throw new Error("Gemini API key not configured");
  const genAI = new GoogleGenerativeAI(apiKey);
  const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });
  const result = await model.generateContent(`${INTENT_PROMPT}\n\nUser query: "${query}"`);
  const text = result.response.text();
  try {
    return JSON.parse(text);
  } catch (e) {
    const cleaned = text.replace(/```json|```/g, "").trim();
    return JSON.parse(cleaned);
  }
}

// Build MongoDB filter based on extracted intent
function buildFilter(intent) {
  const filter = { stock: { $gt: 0 } };
  const { keywords, category, minPrice, maxPrice, colors } = intent;
  if (category) filter.category = category;
  const orArr = [];
  if (keywords && keywords.length) {
    const keywordRegex = keywords.map(k => new RegExp(k, "i"));
    orArr.push({ name: { $in: keywordRegex } });
    orArr.push({ description: { $in: keywordRegex } });
    orArr.push({ tags: { $in: keywordRegex } });
  }
  if (colors && colors.length) {
    const colorRegex = colors.map(c => new RegExp(c, "i"));
    orArr.push({ colors: { $in: colorRegex } });
  }
  if (orArr.length) filter.$or = orArr;
  if (minPrice != null || maxPrice != null) {
    filter.price = {};
    if (minPrice != null) filter.price.$gte = minPrice;
    if (maxPrice != null) filter.price.$lte = maxPrice;
  }
  return filter;
}

export const searchProductsAI = async (req, res, next) => {
  try {
    const { query } = req.body;
    if (!query || !query.trim()) {
      return next(createError(400, "Query is required"));
    }
    // 1️⃣ Ask Gemini for intent
    let intent;
    try {
      intent = await getIntent(query.trim());
    } catch (geminiErr) {
      console.warn("Gemini intent extraction failed, falling back to keyword search", geminiErr);
      const products = await Product.find({ $text: { $search: query } }, { score: { $meta: "textScore" } })
        .populate("category", "name slug")
        .populate("user", "username email")
        .sort({ score: { $meta: "textScore" } })
        .limit(20);
      return res.status(200).json(createSuccess(200, "Search results (fallback)", { products }));
    }
    // 2️⃣ If not a product query, respond politely
    if (!intent.isProductQuery) {
      return res.status(200).json(
        createSuccess(200, "Non‑product query", {
          message: "I can help you find products in our store! Try asking about specific items, categories, or price ranges."
        })
      );
    }
    // 3️⃣ Build DB filter and execute search
    const filter = buildFilter(intent);
    const products = await Product.find(filter)
      .populate("category", "name slug")
      .populate("user", "username email")
      .limit(20);
    // 4️⃣ Respond with matches
    return res.status(200).json(
      createSuccess(200, "AI search results", { products, count: products.length, intent })
    );
  } catch (error) {
    next(error);
  }
};
