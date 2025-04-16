import { Router } from "express";
import { chat } from "../controllers/chat.controller";
import { authMiddleware } from "../middleware/auth.middleware";

const router = Router();

/**
 * @swagger
 * /api/chat:
 *   post:
 *     summary: Send a chat message to EstateWise
 *     tags: [Chat]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       description: Contains the conversation history and the new message.
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - history
 *               - message
 *             properties:
 *               history:
 *                 type: array
 *                 description: An array containing previous chat messages.
 *                 items:
 *                   type: object
 *                   required:
 *                     - role
 *                     - parts
 *                   properties:
 *                     role:
 *                       type: string
 *                       description: Role of the message sender (e.g., "user", "assistant").
 *                       example: user
 *                     parts:
 *                       type: array
 *                       description: Contains the content segments of the message.
 *                       items:
 *                         type: object
 *                         required:
 *                           - text
 *                         properties:
 *                           text:
 *                             type: string
 *                             description: The text content of the message part.
 *                             example: "Hello, how can I help you?"
 *               message:
 *                 type: string
 *                 description: The new message content to be sent.
 *                 example: "I need information on property taxes."
 *     responses:
 *       200:
 *         description: Chat response returned successfully.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 response:
 *                   type: string
 *                   description: The reply message from EstateWise.
 *                   example: "Sure, I can help you with property taxes. Could you provide more details?"
 *       401:
 *         description: Unauthorized - invalid or missing authentication token.
 *       500:
 *         description: Server error - Unable to process chat request.
 */
router.post("/", authMiddleware, chat);

export default router;
