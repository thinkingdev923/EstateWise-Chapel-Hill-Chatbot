import { z } from "zod";
import { httpPost } from "../core/http.js";
import type { ToolDef } from "../core/registry.js";

/** Basic auth helpers backed by the backend API. */
export const authTools: ToolDef[] = [
  {
    name: "auth.login",
    description: "Login with email and password. Returns token and user.",
    schema: { email: z.string(), password: z.string() },
    handler: async (args: any) => {
      const { email, password } = args as { email: string; password: string };
      const data = await httpPost("/api/auth/login", { email, password });
      return { content: [{ type: "text", text: JSON.stringify(data) }] };
    },
  },
  {
    name: "auth.signup",
    description: "Sign up a new user. Returns token and user.",
    schema: { username: z.string(), email: z.string(), password: z.string() },
    handler: async (args: any) => {
      const { username, email, password } = args as {
        username: string;
        email: string;
        password: string;
      };
      const data = await httpPost("/api/auth/signup", {
        username,
        email,
        password,
      });
      return { content: [{ type: "text", text: JSON.stringify(data) }] };
    },
  },
  {
    name: "auth.verifyEmail",
    description: "Verify email address for a user (admin/dev).",
    schema: { email: z.string() },
    handler: async (args: any) => {
      const { email } = args as { email: string };
      const data = await httpPost("/api/auth/verify-email", { email });
      return { content: [{ type: "text", text: JSON.stringify(data) }] };
    },
  },
  {
    name: "auth.resetPassword",
    description: "Reset password for a user by email (admin/dev).",
    schema: { email: z.string(), newPassword: z.string() },
    handler: async (args: any) => {
      const { email, newPassword } = args as {
        email: string;
        newPassword: string;
      };
      const data = await httpPost("/api/auth/reset-password", {
        email,
        newPassword,
      });
      return { content: [{ type: "text", text: JSON.stringify(data) }] };
    },
  },
];
