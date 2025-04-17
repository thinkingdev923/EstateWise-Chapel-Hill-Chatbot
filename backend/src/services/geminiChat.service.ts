import {
  GoogleGenerativeAI,
  HarmCategory,
  HarmBlockThreshold,
} from "@google/generative-ai";
import { queryPropertiesAsString } from "../scripts/queryProperties";

export async function chatWithEstateWise(
  history: Array<{ role: string; parts: Array<{ text: string }> }>,
  message: string,
  userContext = "",
): Promise<string> {
  const apiKey = process.env.GOOGLE_AI_API_KEY;
  if (!apiKey) {
    throw new Error("Missing GOOGLE_AI_API_KEY in environment variables");
  }

  const propertyContext: string = await queryPropertiesAsString(message, 1000);

  const systemInstruction = `
    You are EstateWise Assistant, an expert real estate concierge for Chapel Hill, NC, USA. You help users find their dream homes by providing personalized property recommendations based on their preferences and needs. You have access to a database of detailed property records, including information about the properties, their locations, and their features.

    Below is a current list of detailed property records from our database:
    ---------------------------------------------------------
    ${propertyContext}
    ---------------------------------------------------------

    When recommending properties, please do the following:
    1. For each property, list the full address (street, city, state, zipcode), price, number of bedrooms, number of bathrooms, living area (in sqft), year built, and home type.
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

    10. **Allowed chart types:** you may only ever output \`"type": "bar"\` or \`"type": "line"\`.
       – If you need a “histogram,” use \`"bar"\` with full‑width bars (set \`categoryPercentage\` and \`barPercentage\` to 1).
       – All trend‑lines (e.g. price vs. area) must be \`"line"\`.

    11. Every time you list properties, you must generate at least one relevant chart. Use the data you have to create a chart that is relevant to the properties listed.
    
    12. Ensure your responses are formatted in a way that is easy to read and understand. Use structures like bullet points, tables, or numbered lists where appropriate.

    Use the above property data to create engaging, detailed, and actionable recommendations.
    Additional context: ${userContext || "None provided."}
  `;

  const genAI = new GoogleGenerativeAI(apiKey);
  const model = genAI.getGenerativeModel({
    model: "gemini-1.5-flash",
    systemInstruction: systemInstruction,
  });

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

  history.push({ role: "user", parts: [{ text: message }] });

  const chatSession = model.startChat({
    generationConfig,
    safetySettings,
    history,
  });

  const result = await chatSession.sendMessage(message);
  if (!result.response || !result.response.text()) {
    throw new Error("Failed to get text response from the AI.");
  }

  history.push({ role: "model", parts: [{ text: result.response.text() }] });
  return result.response.text();
}
