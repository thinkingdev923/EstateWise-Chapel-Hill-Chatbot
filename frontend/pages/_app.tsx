import "@/styles/globals.css";
import { Analytics } from "@vercel/analytics/react";
import type { AppProps } from "next/app";
import { Toaster } from "sonner";

import { TrpcProvider } from "@/lib/trpc";

export default function App({ Component, pageProps }: AppProps) {
  return (
    <TrpcProvider>
      <Component {...pageProps} />
      <Toaster />
      <Analytics />
    </TrpcProvider>
  );
}
