import { initTRPC, TRPCError } from "@trpc/server";
import { CreateExpressContextOptions } from "@trpc/server/adapters/express";
import { z } from "zod";

// Context creation
export const createContext = ({ req, res }: CreateExpressContextOptions) => {
  // You can add authentication, database connections, etc. here
  const getUser = () => {
    // Mock user authentication - replace with real auth logic
    const token = req.headers.authorization?.replace("Bearer ", "");
    if (token) {
      // Verify token and return user
      return { id: "1", email: "user@example.com" };
    }
    return null;
  };

  return {
    req,
    res,
    user: getUser(),
  };
};

export type Context = Awaited<ReturnType<typeof createContext>>;

// Initialize tRPC
const t = initTRPC.context<Context>().create({
  errorFormatter({ shape, error }) {
    return {
      ...shape,
      data: {
        ...shape.data,
        zodError:
          error.cause instanceof z.ZodError ? error.cause.flatten() : null,
      },
    };
  },
});

// Export reusable router and procedure helpers
export const router = t.router;
export const publicProcedure = t.procedure;

// Protected procedure with authentication check
export const protectedProcedure = t.procedure.use(async (opts) => {
  const { ctx } = opts;
  if (!ctx.user) {
    throw new TRPCError({ code: "UNAUTHORIZED" });
  }
  return opts.next({
    ctx: {
      ...ctx,
      user: ctx.user,
    },
  });
});

// Middleware for logging
export const loggerMiddleware = t.middleware(async (opts) => {
  const start = Date.now();
  const result = await opts.next();
  const durationMs = Date.now() - start;
  const meta = { path: opts.path, type: opts.type, durationMs };

  if (result.ok) {
    console.log("tRPC Success:", meta);
  } else {
    console.error("tRPC Error:", meta, result.error);
  }

  return result;
});
