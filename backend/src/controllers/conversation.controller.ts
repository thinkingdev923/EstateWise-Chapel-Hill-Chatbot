import { Request, Response } from "express";
import Conversation from "../models/Conversation.model";
import { AuthRequest } from "../middleware/auth.middleware";

export const getConversations = async (req: AuthRequest, res: Response) => {
  try {
    if (!req.user) {
      return res.status(401).json({ error: "Unauthorized: only authenticated users have stored conversations" });
    }
    const conversations = await Conversation.find({ user: req.user.id }).sort({ updatedAt: -1 });
    res.json(conversations);
  } catch (error) {
    res.status(500).json({ error: "Failed to fetch conversations" });
  }
};

export const searchConversations = async (req: AuthRequest, res: Response) => {
  try {
    if (!req.user) {
      return res.status(401).json({ error: "Unauthorized: only authenticated users have stored conversations" });
    }
    const { q } = req.query;
    const regex = new RegExp(q as string, "i");
    const conversations = await Conversation.find({
      user: req.user.id,
      "messages.text": regex
    }).sort({ updatedAt: -1 });
    res.json(conversations);
  } catch (error) {
    res.status(500).json({ error: "Search failed" });
  }
};
