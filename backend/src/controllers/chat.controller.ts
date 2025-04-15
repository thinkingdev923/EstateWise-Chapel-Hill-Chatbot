import { Request, Response } from "express";
import { chatWithEstateWise } from "../services/geminiChat.service";
import Conversation, { IConversation } from "../models/Conversation.model";
import { AuthRequest } from "../middleware/auth.middleware";
import { queryPropertiesAsString} from "../scripts/queryProperties";

export const chat = async (req: AuthRequest, res: Response) => {
  try {
    let conversation: IConversation | { messages: any } | null = null;

    if (req.user) {
      conversation = await Conversation.findOne({ user: req.user.id });
      if (!conversation) {
        conversation = new Conversation({ user: req.user.id, messages: [] });
      }
    } else {
      conversation = { messages: req.body.history || [] };
    }

    const userMessage = req.body.message;

    const historyForGemini = conversation.messages.map((msg: any) => ({
      role: msg.role,
      parts: [{ text: msg.text }],
    }));

    const responseText = await chatWithEstateWise(
      historyForGemini,
      userMessage,
      ""
    );

    if (req.user) {
      (conversation as IConversation).messages.push({
        role: "user",
        text: userMessage,
      });
      (conversation as IConversation).messages.push({
        role: "model",
        text: responseText,
      });
      if ("save" in conversation && typeof (conversation as IConversation).save === "function") {
        await (conversation as IConversation).save();
      }
    }

    return res.json({ response: responseText, history: historyForGemini });
  } catch (error) {
    console.error("Error processing chat request:", error);
    return res.status(500).json({ error: "Error processing chat request" });
  }
};
