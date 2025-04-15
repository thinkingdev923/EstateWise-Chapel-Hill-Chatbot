import mongoose, { Document, Schema } from "mongoose";

export interface IMessage {
  role: "user" | "model";
  text: string;
  timestamp?: Date;
}

export interface IConversation extends Document {
  user?: mongoose.Types.ObjectId;
  messages: IMessage[];
  createdAt: Date;
  updatedAt: Date;
}

const MessageSchema: Schema = new Schema({
  role: { type: String, enum: ["user", "model"], required: true },
  text: { type: String, required: true },
  timestamp: { type: Date, default: Date.now }
});

const ConversationSchema: Schema = new Schema(
  {
    user: { type: Schema.Types.ObjectId, ref: "User" },
    messages: [MessageSchema]
  },
  { timestamps: true }
);

export default mongoose.model<IConversation>("Conversation", ConversationSchema);
