import { Request, Response } from "express";
import mongoose from "mongoose";
import Conversation, { IConversation } from "../models/Conversation.model";
import { chatWithEstateWise } from "../services/geminiChat.service";
import { AuthRequest } from "../middleware/auth.middleware";

/**
 * Main chat endpoint – handles both logged‑in and guest users.
 * Guests send their current expertWeights in the request body;
 * we echo the *updated* weights back so the FE can stash them
 * in localStorage for the next turn.
 *
 * @param req - The request object containing the chat message and optional conversation ID.
 * @param res - The response object to send the chat response.
 * @return A JSON response containing the chat response, expert views, and conversation ID.
 */
export const chat = async (req: AuthRequest, res: Response) => {
  try {
    const {
      message,
      convoId,
      history,
      expertWeights: clientWeights = {},
    } = req.body;

    /* authenticated users */
    if (req.user) {
      const userId = new mongoose.Types.ObjectId(req.user.id);

      let conversation: IConversation | null = null;
      if (convoId) {
        conversation = await Conversation.findOne({
          _id: convoId,
          user: userId,
        });
      }
      if (!conversation) {
        conversation = new Conversation({
          user: userId,
          title: "Untitled Conversation",
          messages: [],
          expertWeights: {
            "Data Analyst": 1,
            "Lifestyle Concierge": 1,
            "Financial Advisor": 1,
            "Neighborhood Expert": 1,
          },
        });
        await conversation.save();
      }

      /* build full history (stored msgs + new one) */
      const historyForGemini = [
        ...conversation.messages.map((m) => ({
          role: m.role,
          parts: [{ text: m.text }],
        })),
        { role: "user", parts: [{ text: message }] },
      ];

      /* call MoE (synthetic experts) chat */
      const { finalText, expertViews } = await chatWithEstateWise(
        historyForGemini,
        message,
        "",
        conversation.expertWeights,
      );

      /* persist both msgs */
      conversation.messages.push({
        role: "user",
        text: message,
        timestamp: new Date(),
      });
      conversation.messages.push({
        role: "model",
        text: finalText,
        timestamp: new Date(),
      });
      conversation.markModified("messages");
      await conversation.save();

      return res.json({
        response: finalText,
        expertViews,
        convoId: conversation._id,
        expertWeights: conversation.expertWeights,
      });
    }

    /* -------------------------------------------------------
     * GUEST BRANCH  – all in memory / localStorage
     * ----------------------------------------------------- */
    const defaultWeights = {
      "Data Analyst": 1,
      "Lifestyle Concierge": 1,
      "Financial Advisor": 1,
      "Neighborhood Expert": 1,
    };
    const guestWeights: Record<string, number> = {
      ...defaultWeights,
      ...clientWeights,
    };

    const historyForGemini = [
      ...(history || []),
      { role: "user", parts: [{ text: message }] },
    ];

    const { finalText, expertViews } = await chatWithEstateWise(
      historyForGemini,
      message,
      "",
      guestWeights,
    );

    return res.json({
      response: finalText,
      expertViews,
      expertWeights: guestWeights,
    });
  } catch (err) {
    console.error("Error processing chat request:", err);
    return res.status(500).json({ error: "Error processing chat request" });
  }
};

/**
 * Thumb‑rating endpoint.
 * For authenticated users: Update the expertWeights in the DB for the given convoId.
 * For unauthenticated users: Update the expertWeights in the request body so the UI
 * can stash them in localStorage for the next turn.
 *
 * @param req - The request object containing the conversation ID, rating, and optional expert.
 * @param res - The response object to send the rating response.
 * @return A JSON response indicating success and the updated expert weights.
 */
export const rateConversation = async (req: AuthRequest, res: Response) => {
  try {
    const {
      convoId,
      rating,
      expert,
      expertWeights = {},
    } = req.body as {
      convoId?: string;
      rating: "up" | "down";
      expert?: string;
      expertWeights?: Record<string, number>;
    };

    // Unauthenticated users
    if (!req.user) {
      const wts: Record<string, number> = { ...expertWeights };

      if (Object.keys(wts).length === 0) {
        // nothing to tweak – just ACK
        return res.json({ success: true });
      }

      adjustWeightsInPlace(wts, rating, expert);
      return res.json({ success: true, expertWeights: wts });
    }

    // Authenticated users
    if (!convoId) {
      return res.status(400).json({ error: "convoId is required" });
    }
    const userId = new mongoose.Types.ObjectId(req.user.id);
    const convo = await Conversation.findOne({ _id: convoId, user: userId });
    if (!convo) {
      return res.status(404).json({ error: "Conversation not found" });
    }

    adjustWeightsInPlace(convo.expertWeights, rating, expert);
    await convo.save();

    return res.json({ success: true, expertWeights: convo.expertWeights });
  } catch (err) {
    console.error("Error rating conversation:", err);
    return res.status(500).json({ error: "Error rating conversation" });
  }
};

/**
 * Helper function to adjust weights in place.
 * This function modifies the weights of the experts based on the rating provided.
 *
 * @param wts - The weights of the experts.
 * @param rating - The rating given by the user, either "up" or "down".
 * @param expert - The specific expert to adjust the weight for (optional).
 */
function adjustWeightsInPlace(
  wts: Record<string, number>,
  rating: "up" | "down",
  expert?: string,
) {
  const factor = rating === "up" ? 1.2 : 0.8;
  if (expert && wts[expert] != null) {
    wts[expert] *= factor;
  } else {
    Object.keys(wts).forEach((k) => (wts[k] *= factor));
  }

  // renormalize ratings
  const sum = Object.values(wts).reduce((a, b) => a + b, 0) || 1;
  Object.keys(wts).forEach((k) => (wts[k] = wts[k] / sum));
}
