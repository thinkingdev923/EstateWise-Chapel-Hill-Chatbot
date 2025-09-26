import dotenv from "dotenv";

dotenv.config();

const DEFAULT_HOST = "0.0.0.0";
const DEFAULT_PORT = 50051;

export const env = {
  host: process.env.GRPC_HOST ?? DEFAULT_HOST,
  port: Number(process.env.GRPC_PORT ?? DEFAULT_PORT),
  logLevel: process.env.LOG_LEVEL ?? "info",
};

if (Number.isNaN(env.port)) {
  throw new Error("GRPC_PORT must be a number");
}
