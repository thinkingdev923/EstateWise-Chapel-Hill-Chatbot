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
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               history:
 *                 type: array
 *                 items:
 *                   type: object
 *                   properties:
 *                     role:
 *                       type: string
 *                     parts:
 *                       type: array
 *                       items:
 *                         type: object
 *                         properties:
 *                           text:
 *                             type: string
 *               message:
 *                 type: string
 *     responses:
 *       200:
 *         description: Chat response returned successfully
 */
router.post("/", authMiddleware, chat);
export default router;
