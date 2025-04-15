import { GoogleGenerativeAI, HarmCategory, HarmBlockThreshold } from "@google/generative-ai";
import { queryPropertiesAsString } from "../scripts/queryProperties";

export async function chatWithEstateWise(
  history: Array<{ role: string; parts: Array<{ text: string }> }>,
  message: string,
  userContext = ""
): Promise<string> {
  const apiKey = process.env.GOOGLE_AI_API_KEY;
  if (!apiKey) {
    throw new Error("Missing GOOGLE_AI_API_KEY in environment variables");
  }

  const propertyContext: string = await queryPropertiesAsString(message, 100);

  const systemInstruction = `
You are EstateWise Assistant, an expert real estate concierge.
Below is a current list of detailed property records from our database:
---------------------------------------------------------
${propertyContext}
---------------------------------------------------------
When recommending properties, please do the following:
1. For each property, list the full address (street, city, state, zipcode), price, number of bedrooms, number of bathrooms, living area (in sqft), year built, and home type.
2. Include the property description.
3. Always provide a direct link to the property's Zillow page using its Zillow id. Use the exact format:
     "More details: https://www.zillow.com/homedetails/{zpid}_zpid/"
4. Present your answer in a clear, numbered list so the user can easily see all options.
5. Use the property data to create engaging, detailed, and actionable recommendations. Present a top few options first, and then provide additional options based on the user's preferences and feedback.
6. If the user provides additional context or preferences, adjust your recommendations accordingly.

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
    { category: HarmCategory.HARM_CATEGORY_HARASSMENT, threshold: HarmBlockThreshold.BLOCK_NONE },
    { category: HarmCategory.HARM_CATEGORY_HATE_SPEECH, threshold: HarmBlockThreshold.BLOCK_NONE },
    { category: HarmCategory.HARM_CATEGORY_SEXUALLY_EXPLICIT, threshold: HarmBlockThreshold.BLOCK_NONE },
    { category: HarmCategory.HARM_CATEGORY_DANGEROUS_CONTENT, threshold: HarmBlockThreshold.BLOCK_NONE },
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
