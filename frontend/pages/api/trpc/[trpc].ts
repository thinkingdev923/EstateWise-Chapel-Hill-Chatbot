import { createNextApiHandler } from "@trpc/server/adapters/next";

import { createTRPCContext } from "@/server/api/context";
import { appRouter } from "@/server/api/routers/_app";

export default createNextApiHandler({
  router: appRouter,
  createContext: createTRPCContext,
  onError({ error, type, path }) {
    if (process.env.NODE_ENV === "development") {
      // eslint-disable-next-line no-console
      console.error("tRPC failed on", type, path, error);
    }
  },
});
