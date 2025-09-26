import { router } from "../trpc";
import { propertiesRouter } from "./properties";
import { analyticsRouter } from "./analytics";

export const appRouter = router({
  properties: propertiesRouter,
  analytics: analyticsRouter,
});

// Export type definition of the API
export type AppRouter = typeof appRouter;
