import { httpBatchLink, loggerLink } from "@trpc/client";
import { createTRPCReact } from "@trpc/react-query";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import React from "react";

import type { AppRouter } from "@/server/api/routers/_app";

export const trpc = createTRPCReact<AppRouter>();

const getBaseUrl = () => {
  if (typeof window !== "undefined") return "";
  if (process.env.VERCEL_URL) return `https://${process.env.VERCEL_URL}`;
  const port = process.env.PORT ?? 3000;
  return `http://localhost:${port}`;
};

export function TrpcProvider({ children }: { children: React.ReactNode }) {
  const [queryClient] = React.useState(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: {
            refetchOnWindowFocus: false,
            staleTime: 60_000,
          },
        },
      }),
  );

  const [client] = React.useState(() =>
    trpc.createClient({
      links: [
        loggerLink({ enabled: () => process.env.NODE_ENV === "development" }),
        httpBatchLink({ url: `${getBaseUrl()}/api/trpc` }),
      ],
    }),
  );

  return (
    <trpc.Provider client={client} queryClient={queryClient}>
      <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
    </trpc.Provider>
  );
}
