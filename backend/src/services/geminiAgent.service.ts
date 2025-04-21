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

/**
 * Runs the EstateWise “Agent” which can call first‐class tools before
 * falling back to the full MoE pipeline in geminiChat.service.ts.
 *
 * Available tools:
 *  - searchProperties({ query, topK? }): RawQueryResult[]
 *  - clusterProperties({ query, topK? }): { results: RawQueryResult[], clusters: number[] }
 *
 * The agent emits a JSON tool call, we execute it, feed back the result,
 * and loop until the model returns a non-JSON final answer—then we hand
 * that off to chatWithEstateWise for expert synthesis.
 *
 * @param prompt         The user’s original prompt.
 * @param userContext    Extra context to include in the system instruction.
 * @param expertWeights  Weights for each synthetic expert (for MoE).
 */
export async function runEstateWiseAgent(
  prompt: string,
  userContext = "",
  expertWeights: Record<string, number> = {},
): Promise<{ finalText: string; expertViews: Record<string, string> }> {
  const apiKey = process.env.GOOGLE_AI_API_KEY;
  if (!apiKey) throw new Error("Missing GOOGLE_AI_API_KEY in environment");

  const genAI = new GoogleGenerativeAI(apiKey);

  // --- Tool implementations ---
  async function searchPropertiesTool(args: {
    query: string;
    topK?: number;
  }): Promise<RawQueryResult[]> {
    return await queryProperties(args.query, args.topK ?? 10);
  }

  async function clusterPropertiesTool(args: {
    query: string;
    topK?: number;
  }): Promise<{ results: RawQueryResult[]; clusters: number[] }> {
    const results = await queryProperties(args.query, args.topK ?? 10);
    // reuse the same in‑TS kmeans from geminiChat.service.ts
    const featureVectors = results.map((r) => {
      const m = r.metadata;
      const price =
        typeof m.price === "number"
          ? m.price
          : parseFloat(String(m.price).replace(/[^0-9.-]+/g, "")) || 0;
      const bedrooms = Number(m.bedrooms) || 0;
      const bathrooms = Number(m.bathrooms) || 0;
      const livingArea =
        typeof m.livingArea === "string"
          ? parseFloat(m.livingArea.replace(/[^0-9.]/g, "")) || 0
          : Number(m.livingArea) || 0;
      const yearBuilt = Number(m.yearBuilt) || 0;
      return [price, bedrooms, bathrooms, livingArea, yearBuilt];
    });
    // normalization
    const dims = featureVectors[0]?.length ?? 0;
    const mins = Array(dims).fill(Infinity);
    const maxs = Array(dims).fill(-Infinity);
    featureVectors.forEach((vec) =>
      vec.forEach((v, i) => {
        if (v < mins[i]) mins[i] = v;
        if (v > maxs[i]) maxs[i] = v;
      }),
    );
    const normalized = featureVectors.map((vec) =>
      vec.map((v, i) =>
        maxs[i] === mins[i] ? 0 : (v - mins[i]) / (maxs[i] - mins[i]),
      ),
    );
    // simple kmeans
    const k = 4;
    const { clusters } = ((): { clusters: number[] } => {
      const n = normalized.length;
      if (n === 0 || k <= 0) return { clusters: [] };
      const cDims = normalized[0].length;
      let centroids = normalized.slice(0, Math.min(k, n)).map((v) => v.slice());
      while (centroids.length < k) centroids.push(normalized[n - 1].slice());
      const assign = new Array(n).fill(0);
      for (let iter = 0; iter < 100; iter++) {
        let changed = false;
        for (let i = 0; i < n; i++) {
          let best = 0;
          let minD = Infinity;
          for (let ci = 0; ci < k; ci++) {
            let d = 0;
            for (let di = 0; di < cDims; di++) {
              const diff = normalized[i][di] - centroids[ci][di];
              d += diff * diff;
            }
            if (d < minD) {
              minD = d;
              best = ci;
            }
          }
          if (assign[i] !== best) {
            assign[i] = best;
            changed = true;
          }
        }
        if (!changed) break;
        const sums = Array(k)
          .fill(0)
          .map(() => Array(cDims).fill(0));
        const counts = Array(k).fill(0);
        for (let i = 0; i < n; i++) {
          const ci = assign[i];
          counts[ci]++;
          normalized[i].forEach((v, di) => (sums[ci][di] += v));
        }
        for (let ci = 0; ci < k; ci++) {
          if (counts[ci] > 0) {
            sums[ci].forEach((sv, di) => (centroids[ci][di] = sv / counts[ci]));
          }
        }
      }
      return { clusters: assign };
    })();

    return { results, clusters };
  }

  // --- Agent system instruction ---
  const systemInstruction = `
    You are EstateWise Agent.  
    You have access to two tools:
    
    1. searchProperties({ query, topK? }) → returns a list of matching properties.  
    2. clusterProperties({ query, topK? }) → returns properties plus cluster assignments.
    
    When you want to call a tool, respond with a JSON object **and nothing else**, e.g.:
    
    \`\`\`json
    {"tool":"searchProperties","args":{"query":"3‑bed condos under $500k","topK":5}}
    \`\`\`
    
    After we invoke that tool, you will receive a message with role "tool" whose content is the tool’s JSON output. Then continue reasoning or return your final answer.
    
    Additional context: ${userContext || "None provided."}
  `.trim();

  // build initial messages
  const messages: Array<{ role: string; parts: [{ text: string }] }> = [
    { role: "system", parts: [{ text: systemInstruction }] },
    { role: "user", parts: [{ text: prompt }] },
  ];

  const generationConfig = {
    temperature: 0.7,
    topP: 0.9,
    topK: 64,
    maxOutputTokens: 2048,
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

  while (true) {
    // call Gemini
    const model = genAI.getGenerativeModel({
      model: "gemini-2.0-flash-lite",
      systemInstruction: messages[0].parts[0].text,
    });
    const chat = model.startChat({
      generationConfig,
      safetySettings,
      history: messages,
    });
    const result = await chat.sendMessage("");
    const text = result.response.text().trim();

    // try parse as JSON tool call
    let payload: any;
    try {
      payload = JSON.parse(text);
    } catch {
      // not a tool call → final answer, now delegate to MoE pipeline
      return await chatWithEstateWise(
        messages.slice(1), // drop the system message
        prompt,
        userContext,
        expertWeights,
      );
    }

    // if it's a valid tool call
    if (payload.tool === "searchProperties") {
      const out = await searchPropertiesTool(payload.args || {});
      messages.push({ role: "assistant", parts: [{ text }] });
      messages.push({ role: "tool", parts: [{ text: JSON.stringify(out) }] });
      continue;
    }
    if (payload.tool === "clusterProperties") {
      const out = await clusterPropertiesTool(payload.args || {});
      messages.push({ role: "assistant", parts: [{ text }] });
      messages.push({ role: "tool", parts: [{ text: JSON.stringify(out) }] });
      continue;
    }

    // unknown tool → treat as final
    return await chatWithEstateWise(
      messages.slice(1),
      prompt,
      userContext,
      expertWeights,
    );
  }
}
