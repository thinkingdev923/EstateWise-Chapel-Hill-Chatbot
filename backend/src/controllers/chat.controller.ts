import { Request, Response } from "express";
import mongoose from "mongoose";
import Conversation, { IConversation } from "../models/Conversation.model";
import { chatWithEstateWise } from "../services/geminiChat.service";
import { AuthRequest } from "../middleware/auth.middleware";

/**
 * Handles chat requests. This function processes the user's message,
 * retrieves or creates a conversation, and interacts with the chat service.
 *
 * @param req - The request object containing the user's message, conversation ID, and history.
 * @param res - The response object to send the chat response back to the client.
 */
export const chat = async (req: AuthRequest, res: Response) => {
  try {
    const { message, convoId, history } = req.body;
    let conversation: IConversation | null = null;

    console.log(req.user);

    if (req.user) {
      // Convert the user ID from token to a Mongoose ObjectId.
      const userId = new mongoose.Types.ObjectId(req.user.id);

      // If a conversation ID is provided, try to load that conversation for this user.
      if (convoId) {
        conversation = await Conversation.findOne({
          _id: convoId,
          user: userId,
        });
        console.log("Loaded conversation:", convoId, conversation);
      }

      console.log("Conversation:", conversation);
      console.log(req.user);
      console.log("User ID:", userId);

      // If no conversation was found (or no convoId was provided), create a new one.
      if (!conversation) {
        conversation = new Conversation({
          user: userId,
          title: "Untitled Conversation",
          messages: [],
        });
        await conversation.save();
        console.log("Created new conversation:", conversation);
      }
    } else {
      // For unauthenticated users, we don't persist data and rely on the supplied history.
      conversation = { messages: history || [] } as IConversation;
    }

    // Build the history for the Gemini chat service.
    // For authenticated users, use the conversation's stored messages;
    // for unauthenticated users, use the provided history.
    const existingMessages = req.user ? conversation.messages : history || [];
    const historyForGemini = existingMessages.map((msg: any) => ({
      role: msg.role,
      parts: [{ text: msg.text }],
    }));

    // Append the new user message.
    historyForGemini.push({
      role: "user",
      parts: [{ text: message }],
    });

    // Get the response from the chat service.
    const responseText = await chatWithEstateWise(
      historyForGemini,
      message,
      "",
    );
    console.log("Chat service response:", responseText);

    if (req.user) {
      // Append the user message and the bot response to the conversation.
      conversation.messages.push({
        role: "user",
        text: message,
        timestamp: new Date(),
      });
      conversation.messages.push({
        role: "model",
        text: responseText,
        timestamp: new Date(),
      });
      conversation.markModified("messages");

      // Save the updated conversation.
      await conversation.save();
      console.log("Updated conversation messages:", conversation.messages);
    }

    return res.json({
      response: responseText,
      // Return the conversation ID for authenticated users so the front end uses it for future requests.
      convoId: req.user ? conversation._id : undefined,
    });
  } catch (error) {
    console.error("Error processing chat request:", error);
    return res.status(500).json({ error: "Error processing chat request" });
  }
};
