
import { GoogleGenAI, GenerateContentResponse } from "@google/genai";
import { Customer, CustomerSegment } from '../types';
import { 
  GEMINI_MODEL_TEXT, 
  LTV_PROMPT_TEMPLATE, 
  RETENTION_STRATEGY_PROMPT_TEMPLATE, 
  MARKETING_IDEAS_PROMPT_TEMPLATE 
} from '../constants';

// Ensure API_KEY is available.
const API_KEY = process.env.API_KEY;

if (!API_KEY) {
  console.error("API_KEY for Gemini is not set. Please set the environment variable.");
  // It's crucial that the application can handle a missing API key gracefully,
  // potentially by disabling API-dependent features or showing a clear error message.
  // For now, operations will fail if API_KEY is not set, as per checks in each method.
}

// Initialize with API_KEY or a placeholder if it's not set, to prevent immediate crash.
// However, methods will throw errors if API_KEY is actually missing when they are called.
const ai = new GoogleGenAI({ apiKey: API_KEY || "YOUR_API_KEY_placeholder" });

const parseJsonFromGeminiResponse = <T,>(responseText: string): T => {
  let jsonStr = responseText.trim();
  const fenceRegex = /^```(?:json)?\s*\n?(.*?)\n?\s*```$/s;
  const match = jsonStr.match(fenceRegex);
  if (match && match[1]) {
    jsonStr = match[1].trim();
  }
  try {
    return JSON.parse(jsonStr) as T;
  } catch (e) {
    console.error("Failed to parse JSON response:", jsonStr, e);
    throw new Error(`Failed to parse AI response as JSON. Raw text: ${jsonStr}`);
  }
};


export const geminiService = {
  predictLTV: async (customer: Customer): Promise<{ ltv: number; segment: CustomerSegment }> => {
    if (!API_KEY) throw new Error("Gemini API Key not configured. Please set process.env.API_KEY.");
    const prompt = LTV_PROMPT_TEMPLATE(customer);
    try {
      const response: GenerateContentResponse = await ai.models.generateContent({
        model: GEMINI_MODEL_TEXT,
        contents: prompt,
        config: {
          responseMimeType: "application/json",
          temperature: 0.3, 
        },
      });
      const result = parseJsonFromGeminiResponse<{ predictedLTV: number; segment: string }>(response.text);
      
      const segmentKey = result.segment.toUpperCase().replace('-', '_').replace(' ', '_') as keyof typeof CustomerSegment;
      const validSegment = CustomerSegment[segmentKey] || CustomerSegment.UNKNOWN;

      return { ltv: result.predictedLTV, segment: validSegment };
    } catch (error) {
      console.error("Error calling Gemini API for LTV prediction:", error);
      if (error instanceof Error) {
        throw new Error(`Gemini API error (LTV): ${error.message}`);
      }
      throw new Error("Unknown Gemini API error (LTV).");
    }
  },

  getRetentionStrategies: async (ltv: number, segment: CustomerSegment): Promise<string[]> => {
    if (!API_KEY) throw new Error("Gemini API Key not configured. Please set process.env.API_KEY.");
    const prompt = RETENTION_STRATEGY_PROMPT_TEMPLATE(ltv, segment);
    try {
      const response: GenerateContentResponse = await ai.models.generateContent({
        model: GEMINI_MODEL_TEXT,
        contents: prompt,
        config: {
          responseMimeType: "application/json",
          temperature: 0.7, 
        },
      });
      return parseJsonFromGeminiResponse<string[]>(response.text);
    } catch (error) {
      console.error("Error calling Gemini API for retention strategies:", error);
       if (error instanceof Error) {
        throw new Error(`Gemini API error (Retention): ${error.message}`);
      }
      throw new Error("Unknown Gemini API error (Retention).");
    }
  },

  getMarketingIdeas: async (ltv: number, segment: CustomerSegment): Promise<string[]> => {
    if (!API_KEY) throw new Error("Gemini API Key not configured. Please set process.env.API_KEY.");
    const prompt = MARKETING_IDEAS_PROMPT_TEMPLATE(ltv, segment);
    try {
      const response: GenerateContentResponse = await ai.models.generateContent({
        model: GEMINI_MODEL_TEXT,
        contents: prompt,
        config: {
          responseMimeType: "application/json",
          temperature: 0.7,
        },
      });
      return parseJsonFromGeminiResponse<string[]>(response.text);
    } catch (error) {
      console.error("Error calling Gemini API for marketing ideas:", error);
       if (error instanceof Error) {
        throw new Error(`Gemini API error (Marketing): ${error.message}`);
      }
      throw new Error("Unknown Gemini API error (Marketing).");
    }
  },
};
