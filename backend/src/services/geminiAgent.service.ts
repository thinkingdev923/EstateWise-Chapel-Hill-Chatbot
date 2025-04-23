import {
  GoogleGenerativeAI,
  HarmCategory,
  HarmBlockThreshold,
} from "@google/generative-ai";
import {
  queryProperties,
  queryPropertiesAsString,
  RawQueryResult,
} from "../scripts/queryProperties";
import { chatWithEstateWise } from "./geminiChat.service";

interface DecisionPayload {
  usePropertyData: boolean;
}

/**
 * Top‑level agent that first determines whether we need to
 * fetch RAG data (property listings from Pinecone). If so,
 * it retrieves that data and injects it into the downstream
 * Mixture‑of‑Experts pipeline; if not, it calls the experts
 * without any RAG context.
 *
 * @param prompt         The user’s latest message
 * @param userContext    Any additional context you want to pass through
 * @param expertWeights  Weights for each expert in the MoE
 */
export async function runEstateWiseAgent(
  prompt: string,
  userContext = "",
  expertWeights: Record<string, number> = {},
): Promise<{ finalText: string; expertViews: Record<string, string> }> {
  const apiKey = process.env.GOOGLE_AI_API_KEY;
  if (!apiKey) {
    throw new Error("Missing GOOGLE_AI_API_KEY in environment");
  }
  const genAI = new GoogleGenerativeAI(apiKey);

  // --- 1) Decide via a quick Gemini call whether to fetch property data ---
  const decisionInstruction = `
    You are a simple decision agent. Given the user's message, decide
    whether querying our property database is needed to answer it.
    Respond **only** with a JSON object, nothing else, like:
    {"usePropertyData": true}
    or
    {"usePropertyData": false}
  `.trim();

  const decisionModel = genAI.getGenerativeModel({
    model: "gemini-2.0-flash-lite",
    systemInstruction: decisionInstruction,
  });

  const generationConfig = {
    temperature: 0.0,
    topP: 1,
    topK: 1,
    maxOutputTokens: 16,
  };
  const safetySettings = [
    {
      category: HarmCategory.HARM_CATEGORY_HARASSMENT,
      threshold: HarmBlockThreshold.BLOCK_NONE,
    },
    {
      category: HarmCategory.HARM_CATEGORY_HATE_SPEECH,
      threshold: HarmBlockThreshold.BLOCK_NONE,
    },
    {
      category: HarmCategory.HARM_CATEGORY_SEXUALLY_EXPLICIT,
      threshold: HarmBlockThreshold.BLOCK_NONE,
    },
    {
      category: HarmCategory.HARM_CATEGORY_DANGEROUS_CONTENT,
      threshold: HarmBlockThreshold.BLOCK_NONE,
    },
  ];

  const decisionChat = decisionModel.startChat({
    generationConfig,
    safetySettings,
    history: [
      { role: "system", parts: [{ text: decisionInstruction }] },
      { role: "user", parts: [{ text: prompt }] },
    ],
  });

  const decisionResult = await decisionChat.sendMessage("");
  let usePropertyData = false;
  try {
    const parsed = JSON.parse(
      decisionResult.response.text(),
    ) as DecisionPayload;
    usePropertyData = Boolean(parsed.usePropertyData);
  } catch {
    // If parsing fails, default to no RAG
    usePropertyData = false;
  }

  // --- 2) If needed, fetch RAG data (properties + text blob) ---
  let propertyContext = "";
  let rawResults: RawQueryResult[] = [];
  if (usePropertyData) {
    [propertyContext, rawResults] = await Promise.all([
      queryPropertiesAsString(prompt, 50),
      queryProperties(prompt, 50),
    ]);
  }

  // --- 3) Build a little envelope to deliver RAG context to the experts ---
  const mergedUserContext = usePropertyData
    ? `${userContext}

      --- PROPERTY DATA START ---
      ${propertyContext}
      --- PROPERTY DATA END ---`
    : userContext;

  // 4) Kick off the Mixture‑of‑Experts pipeline (delegates to geminiChat.service)
  return chatWithEstateWise(
    [{ role: "user", parts: [{ text: prompt }] }],
    prompt,
    mergedUserContext,
    expertWeights,
  );
}
