import { GoogleGenAI, Type } from "@google/genai";
import { OCR_MODEL_NAME } from "../constants";
import { ExtractedData } from "../types";

const processFileToBase64 = (file: File): Promise<string> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = () => {
      let encoded = reader.result?.toString().replace(/^data:(.*,)?/, "");
      if (encoded && (encoded.length % 4) > 0) {
        encoded += "=".repeat(4 - (encoded.length % 4));
      }
      resolve(encoded || "");
    };
    reader.onerror = (error) => reject(error);
  });
};

export const performOCR = async (file: File): Promise<ExtractedData> => {
  const apiKey = import.meta.env.VITE_GEMINI_API_KEY;
  if (!apiKey) {
    throw new Error("API Key not found. Please set VITE_GEMINI_API_KEY in your .env.local file.");
  }

  const ai = new GoogleGenAI({ apiKey });
  const base64Data = await processFileToBase64(file);

  const prompt = `
    You are an expert Legal OCR Analyst. Your goal is 100% character accuracy.
    
    TASK:
    1. Transcribe the document text exactly as it appears. Handle multi-column layouts, footnotes, and headers correctly.
    2. Analyze the content to extract a structured summary and key entities.
    3. If the document is handwritten, do your best to transcribe legibly.
    4. Provide a confidence score (0-100) reflecting the document's legibility.

    CRITICAL:
    - Verify case numbers and dates against the context.
    - Do not hallucinate information not present in the text.
    
    Output JSON.
  `;

  try {
    const response = await ai.models.generateContent({
      model: OCR_MODEL_NAME,
      contents: {
        parts: [
          {
            inlineData: {
              mimeType: file.type,
              data: base64Data,
            },
          },
          {
            text: prompt,
          },
        ],
      },
      config: {
        // High thinking budget for maximum accuracy on complex legal docs
        thinkingConfig: { thinkingBudget: 1024 }, 
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            rawText: { type: Type.STRING, description: "The full verbatim extracted text, preserving layout structure where possible with newlines." },
            summary: { type: Type.STRING, description: "A professional executive summary of the document (2-3 sentences)." },
            entities: {
              type: Type.OBJECT,
              properties: {
                dates: { type: Type.ARRAY, items: { type: Type.STRING }, description: "All distinct dates found." },
                names: { type: Type.ARRAY, items: { type: Type.STRING }, description: "Full names of people and organizations." },
                caseNumbers: { type: Type.ARRAY, items: { type: Type.STRING }, description: "Legal case IDs, docket numbers, or reference IDs." },
              },
            },
            confidenceScore: { type: Type.NUMBER, description: "Confidence score out of 100 based on text clarity." },
          },
        },
      },
    });

    const responseText = response.text;
    if (!responseText) throw new Error("No response from Gemini");

    return JSON.parse(responseText) as ExtractedData;

  } catch (error) {
    console.error("OCR Failed:", error);
    throw new Error("Failed to process document. The AI service may be temporarily unavailable or the document is unreadable.");
  }
};