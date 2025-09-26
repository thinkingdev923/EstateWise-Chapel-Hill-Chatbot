import type { CreateNextContextOptions } from "@trpc/server/adapters/next";

export type CreateContextOptions = CreateNextContextOptions;

export async function createTRPCContext(_opts: CreateContextOptions) {
  return {};
}

export type TRPCContext = Awaited<ReturnType<typeof createTRPCContext>>;
