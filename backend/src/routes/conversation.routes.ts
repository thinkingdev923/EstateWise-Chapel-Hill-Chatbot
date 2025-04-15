import { Router } from "express";
import { getConversations, searchConversations } from "../controllers/conversation.controller";
import { authMiddleware } from "../middleware/auth.middleware";

const router = Router();

/**
 * @swagger
 * /api/conversations:
 *   get:
 *     summary: Retrieve all stored conversations for the authenticated user
 *     tags: [Conversations]
 *     responses:
 *       200:
 *         description: List of conversations
 */
router.get("/", authMiddleware, getConversations);

/**
 * @swagger
 * /api/conversations/search:
 *   get:
 *     summary: Search past conversations
 *     tags: [Conversations]
 *     parameters:
 *       - in: query
 *         name: q
 *         schema:
 *           type: string
 *         required: true
 *         description: Search term
 *     responses:
 *       200:
 *         description: Search results
 */
router.get("/search", authMiddleware, searchConversations);

export default router;
