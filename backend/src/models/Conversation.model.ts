import mongoose, { Document, Schema } from "mongoose";

/**
 * @swagger
 * components:
 *   schemas:
 *     Message:
 *       type: object
 *       description: Represents an individual message in a conversation.
 *       properties:
 *         role:
 *           type: string
 *           enum: [user, model]
 *           description: The role of the message sender.
 *         text:
 *           type: string
 *           description: The content of the message.
 *         timestamp:
 *           type: string
 *           format: date-time
 *           description: The time the message was sent.
 *       required:
 *         - role
 *         - text
 *     Conversation:
 *       type: object
 *       description: Represents a conversation between a user and the model.
 *       properties:
 *         _id:
 *           type: string
 *           description: Unique identifier for the conversation.
 *         user:
 *           type: string
 *           description: The ID of the user who owns this conversation.
 *         title:
 *           type: string
 *           description: The title of the conversation.
 *           default: "Untitled Conversation"
 *         messages:
 *           type: array
 *           description: List of messages that belong to the conversation.
 *           items:
 *             $ref: '#/components/schemas/Message'
 *         expertWeights:
 *           type: object
 *           additionalProperties:
 *             type: number
 *           description: Relative weights for each synthetic expert (for MoE).
 *         createdAt:
 *           type: string
 *           format: date-time
 *           description: Timestamp when the conversation was created.
 *         updatedAt:
 *           type: string
 *           format: date-time
 *           description: Timestamp when the conversation was last updated.
 *       required:
 *         - title
 *         - messages
 */

/**
 * Represents a single chat message.
 */
export interface IMessage {
  role: "user" | "model";
  text: string;
  timestamp?: Date;
}

/**
 * Represents a stored conversation, with optional user and
 * expert‑weight personalization.
 */
export interface IConversation extends Document {
  user?: mongoose.Types.ObjectId;
  title: string;
  messages: IMessage[];
  expertWeights: Record<string, number>;
  createdAt: Date;
  updatedAt: Date;
}

/**
 * Schema for an individual message.
 */
const MessageSchema: Schema = new Schema({
  role: { type: String, enum: ["user", "model"], required: true },
  text: { type: String, required: true },
  timestamp: { type: Date, default: Date.now },
});

/**
 * Conversation schema, extended to include a map of expert weights.
 */
const ConversationSchema: Schema = new Schema(
  {
    user: { type: Schema.Types.ObjectId, ref: "User" },
    title: { type: String, default: "Untitled Conversation" },
    messages: [MessageSchema],
    expertWeights: {
      type: Map,
      of: Number,
      default: {
        "Data Analyst": 1,
        "Lifestyle Concierge": 1,
        "Financial Advisor": 1,
        "Neighborhood Expert": 1,
        "Cluster Analyst": 1,
      },
    },
  },
  { timestamps: true },
);

export default mongoose.model<IConversation>(
  "Conversation",
  ConversationSchema,
);
