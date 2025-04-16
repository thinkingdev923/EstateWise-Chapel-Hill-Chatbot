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
 * This is the conversation interface.
 * It contains the fields needed for the conversation model.
 */
export interface IMessage {
  role: "user" | "model";
  text: string;
  timestamp?: Date;
}

/**
 * This is the conversation interface.
 * It contains the fields needed for the conversation model.
 */
export interface IConversation extends Document {
  user?: mongoose.Types.ObjectId;
  title: string;
  messages: IMessage[];
  createdAt: Date;
  updatedAt: Date;
}

/**
 * This is the message schema.
 * It contains the fields needed for the message model.
 */
const MessageSchema: Schema = new Schema({
  role: { type: String, enum: ["user", "model"], required: true },
  text: { type: String, required: true },
  timestamp: { type: Date, default: Date.now },
});

/**
 * This is the conversation schema.
 * It contains the fields needed for the conversation model.
 */
const ConversationSchema: Schema = new Schema(
  {
    user: { type: Schema.Types.ObjectId, ref: "User" },
    title: { type: String, default: "Untitled Conversation" },
    messages: [MessageSchema],
  },
  { timestamps: true },
);

export default mongoose.model<IConversation>(
  "Conversation",
  ConversationSchema,
);
