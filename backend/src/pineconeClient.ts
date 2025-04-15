import { Pinecone } from "@pinecone-database/pinecone";
import dotenv from "dotenv";
dotenv.config();

if (!process.env.PINECONE_API_KEY) {
  throw new Error("PINECONE_API_KEY is not set in .env");
}

if (!process.env.PINECONE_INDEX) {
  throw new Error("PINECONE_INDEX is not set in .env");
}

const pinecone = new Pinecone({ apiKey: process.env.PINECONE_API_KEY });
const index = pinecone.index(process.env.PINECONE_INDEX.trim());

export { index };
