import {
  GoogleGenerativeAI,
  HarmCategory,
  HarmBlockThreshold,
} from "@google/generative-ai";
import { queryPropertiesAsString } from "../scripts/queryProperties";

/**
 * Chat with EstateWise Assistant using Google Gemini AI.
 * This uses a Mixture-of-Experts (MoE) with Reinforcement Learning
 * to generate more informed responses.
 *
 * @param history - The conversation history, including previous messages.
 * @param message - The new message to send.
 * @param userContext - Additional context provided by the user.
 * @param expertWeights - Weights for each expert to influence their responses.
 */
export async function chatWithEstateWise(
  history: Array<{ role: string; parts: Array<{ text: string }> }>,
  message: string,
  userContext = "",
  expertWeights: Record<string, number> = {},
): Promise<{ finalText: string; expertViews: Record<string, string> }> {
  const apiKey = process.env.GOOGLE_AI_API_KEY;
  if (!apiKey) {
    throw new Error("Missing GOOGLE_AI_API_KEY in environment variables");
  }

  // 1) Fetch property context
  const propertyContext: string = await queryPropertiesAsString(message, 200);

  // 2) Base system instruction (used for all experts)
  const baseSystemInstruction = `
    You are EstateWise Assistant, an expert real estate concierge for Chapel Hill, NC, USA. You help users find their dream homes by providing personalized property recommendations based on their preferences and needs. You have access to a database of detailed property records, including information about the properties, their locations, and their features.

    Below is a current list of detailed property records from our database:
    ---------------------------------------------------------
    ${propertyContext}
    ---------------------------------------------------------

    When recommending properties, please do the following:
    1. For each property, list the full address (street, city, state, zipcode), price, number of bedrooms, number of bathrooms, living area (in sqft), year built, and home type.
    2. Include the property description.
    3. Always provide a direct link to the property's Zillow page using its Zillow id. Use the exact format:
         More details: https://www.zillow.com/homedetails/{zpid}_zpid/
    4. Present your answer in a clear, numbered list so the user can easily see all options.
    5. Use the property data to create engaging, detailed, and actionable recommendations. Present a top few options first, and then provide additional options based on the user's preferences and feedback.
    6. If the user provides additional context or preferences, adjust your recommendations accordingly.
    7. Format your responses in a way that is easy to read and understand. Use structures like bullet points, tables, or numbered lists where appropriate.

    8. **Whenever** the user asks for a comparison, distribution, or trend (e.g. “show me price trends”, “how many bedrooms?”, “compare year built”), you **must** append a valid Chart.js spec in its own code block tagged \`chart-spec\`.

    9. Here’s a minimal example you should follow exactly:

    \`\`\`chart-spec
    {
      "type": "bar",
      "data": {
        "labels": ["2 beds","3 beds","4 beds"],
        "datasets":[
          {
            "label":"Number of Homes",
            "data":[12, 8, 5]
          }
        ]
      },
      "options": {
        "responsive": true,
        "plugins": { "legend": { "position": "top" } }
      }
    }
    \`\`\`

    - **Do not** include any extra text or markdown in that block—only the raw JSON.
    - If no chart is needed, simply omit the block.

    10. **Allowed chart types:** you may only ever output one of the built‑in Chart.js types:
     \`"bar"\`, \`"line"\`, \`"pie"\`, \`"doughnut"\`, \`"radar"\`, \`"polarArea"\`, \`"bubble"\`, or \`"scatter"\`.
     – If you need a “histogram,” use \`"bar"\` with full‑width bars (set \`categoryPercentage\` and \`barPercentage\` to 1).
     – All trend‑lines (e.g. price vs. area) must be \`"line"\`.

    11. Every time you list properties, you must generate at least one relevant chart. Use the data you have to create a chart that is relevant to the properties listed.
    
    12. Make sure your responses, while detailed, are concise and to the point. Avoid unnecessary verbosity or repetition. And must not be too long. And avoid asking additional questions. Just give user the recommendations/options first, and ask for follow‑up questions only if needed.

    Additional context: ${userContext || "None provided."}
  `;

  // 3) Define your experts with very detailed instructions
  const experts = [
    {
      name: "Data Analyst",
      instructions: `
        You are the Data Analyst. Focus on extracting statistics, distributions, and trends in the property data. Provide breakdowns (avg price, bedroom counts, area distributions) and, when relevant, include a Chart.js code block showing these metrics. Keep language concise and data‑driven.
      `.trim(),
    },
    {
      name: "Lifestyle Concierge",
      instructions: `
        You are the Lifestyle Concierge. Emphasize lifestyle fit—nearby schools, parks, restaurants, commute times, and community vibes. Do not overload with raw numbers; frame features in terms of daily living and comfort.
      `.trim(),
    },
    {
      name: "Financial Advisor",
      instructions: `
        You are the Financial Advisor. Highlight price trends, mortgage/payment estimates, ROI potential, tax implications, and any financing options. Provide bullet points on cost analysis and include a chart if illustrating financial comparisons.
      `.trim(),
    },
    {
      name: "Neighborhood Expert",
      instructions: `
        You are the Neighborhood Expert. Provide insights on safety, demographic trends, noise levels, walkability scores, and future development. Use tables or bullets for clarity; charts only if showing comparative ratings.
      `.trim(),
    },
  ];

  // 4) Normalize weights or default to equal
  const weights: Record<string, number> = {};
  let total = 0;
  experts.forEach((e) => {
    const w = expertWeights[e.name] ?? 1;
    weights[e.name] = w;
    total += w;
  });
  if (total <= 0) {
    experts.forEach((e) => (weights[e.name] = 1));
    total = experts.length;
  }
  Object.keys(weights).forEach((k) => {
    weights[k] = weights[k] / total;
  });

  // 5) Prepare common generation & safety config
  const genAI = new GoogleGenerativeAI(apiKey);
  const generationConfig = {
    temperature: 1,
    topP: 0.95,
    topK: 64,
    maxOutputTokens: 8192,
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

  // 6) Run each expert in parallel
  const expertResults = await Promise.all(
    experts.map(async (expert) => {
      const model = genAI.getGenerativeModel({
        model: "gemini-1.5-flash",
        systemInstruction: baseSystemInstruction + "\n\n" + expert.instructions,
      });
      const chat = model.startChat({
        generationConfig,
        safetySettings,
        history,
      });
      const result = await chat.sendMessage(message);
      const text = result.response.text();
      return { name: expert.name, text };
    }),
  );

  // 7) Build merger instruction, including expert weights
  const mergerInstruction = `
You are the EstateWise Master Agent. You have now received input from four specialized agents.
Below are their responses along with their relative weights (importance):

${expertResults
  .map(
    (r) => `**${r.name}** (weight: ${weights[r.name].toFixed(2)}):
${r.text}`,
  )
  .join("\n\n")}

Now, **synthesize** these four expert opinions into **one unified** final recommendation for the user. Follow all of the original EstateWise instructions (including numbering, full property details, chart-spec blocks when needed, concise format, and no extra markdown around charts). Use the expert weights to prioritize which insights to emphasize, but produce a single cohesive response exactly as the user expects from EstateWise Assistant.
`;

  // 8) Final, merged call
  const mergerModel = genAI.getGenerativeModel({
    model: "gemini-1.5-flash",
    systemInstruction: baseSystemInstruction + "\n\n" + mergerInstruction,
  });
  const mergerChat = mergerModel.startChat({
    generationConfig,
    safetySettings,
    history,
  });
  const finalResult = await mergerChat.sendMessage(message);
  const finalText = finalResult.response.text();

  // 9) Return both the merged text and each expert view so the UI can toggle them
  const expertViews: Record<string, string> = {};
  expertResults.forEach((r) => {
    expertViews[r.name] = r.text;
  });

  return { finalText, expertViews };
}
