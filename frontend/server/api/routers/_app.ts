import { router } from "../trpc";
import { insightsRouter } from "./insights";

export const appRouter = router({
  insights: insightsRouter,
});

export type AppRouter = typeof appRouter;
