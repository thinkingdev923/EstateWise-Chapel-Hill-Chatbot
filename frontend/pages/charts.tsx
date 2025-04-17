"use client";

import React, { useEffect, useRef, useState } from "react";
import Head from "next/head";
import Link from "next/link";
import Chart, { ChartConfiguration } from "chart.js/auto";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Sun,
  Moon,
  ChevronLeft,
  BarChart3,
  Home as HomeIcon,
} from "lucide-react";

const API_BASE_URL = "https://estatewise-backend.vercel.app";

/* ------------------------------------------------------------------ */
/*  THEME TOGGLE                                                      */
/* ------------------------------------------------------------------ */
const DarkModeToggle: React.FC = () => {
  const [dark, setDark] = useState(
    typeof window !== "undefined" &&
      document.documentElement.classList.contains("dark"),
  );

  useEffect(() => {
    const meta = document.querySelector("meta[name='theme-color']");
    if (meta) meta.setAttribute("content", dark ? "#262626" : "#faf9f2");
  }, [dark]);

  return (
    <button
      aria-label="Toggle theme"
      onClick={() => {
        document.documentElement.classList.toggle("dark");
        setDark((p) => !p);
      }}
      className="rounded-full p-2 transition-colors cursor-pointer"
    >
      {dark ? (
        <Sun className="w-5 h-5 text-foreground" />
      ) : (
        <Moon className="w-5 h-5 text-foreground" />
      )}
    </button>
  );
};

/* ------------------------------------------------------------------ */
/*  Chart block – normalises any transparent colours                  */
/* ------------------------------------------------------------------ */
const solidify = (cfg: ChartConfiguration): ChartConfiguration => {
  const clone = structuredClone(cfg) as ChartConfiguration;
  const toSolid = (c: unknown) =>
    typeof c === "string" && c.startsWith("rgba")
      ? c.replace(/rgba\(([^,]+,[^,]+,[^,]+),\s*[\d.]+\)/, "rgb($1)")
      : c;

  (clone.data?.datasets ?? []).forEach((ds: any) => {
    if (ds.backgroundColor)
      ds.backgroundColor = Array.isArray(ds.backgroundColor)
        ? ds.backgroundColor.map(toSolid)
        : toSolid(ds.backgroundColor);
    if (ds.borderColor)
      ds.borderColor = Array.isArray(ds.borderColor)
        ? ds.borderColor.map(toSolid)
        : toSolid(ds.borderColor);
  });
  return clone;
};

const ChartBlock: React.FC<{ spec: any }> = ({ spec }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const chartRef = useRef<Chart | null>(null);

  useEffect(() => {
    if (!canvasRef.current) return;

    chartRef.current?.destroy();
    const fixed = solidify({
      ...spec,
      options: { ...spec.options, maintainAspectRatio: false },
    });
    chartRef.current = new Chart(canvasRef.current, fixed);
    return () => chartRef.current?.destroy();
  }, [spec]);

  return <canvas ref={canvasRef} className="h-full w-full" />;
};

/* ------------------------------------------------------------------ */
const chartTitles: Record<string, string> = {
  homeType: "Home‑type distribution",
  bedrooms: "Bedroom count",
  bathrooms: "Bathroom count",
  priceDist: "Price distribution",
  areaDist: "Living‑area distribution",
  yearBuiltDist: "Year‑built distribution",
  priceArea: "Price vs living area",
  priceYear: "Price vs year built",
  pricePerSqft: "Price per sqft",
  bedsBaths: "Bedrooms vs bathrooms",
  avgPriceType: "Average price by type",
  countByZip: "Listings by zipcode",
};

/* ------------------------------------------------------------------ */
export default function ChartsPage() {
  const [charts, setCharts] = useState<Record<string, any> | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch(`${API_BASE_URL}/api/properties?q=Chapel%20Hill&topK=12`)
      .then((r) => r.json())
      .then((d) => setCharts(d.charts))
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  return (
    <>
      <Head>
        <title>EstateWise | Charts</title>
        <meta
          name="description"
          content="Interactive visualizations of Chapel Hill real‑estate data"
        />
      </Head>

      <div className="min-h-screen bg-background text-foreground flex flex-col">
        {/* ------------------------------------------------------------------ */}
        {/*  Top bar                                                           */}
        {/* ------------------------------------------------------------------ */}
        <header className="sticky top-0 z-30 w-full backdrop-blur-lg bg-background/90 border-b border-border">
          <div className="max-w-7xl mx-auto h-16 px-6 flex items-center gap-4">
            <Link href="/chat">
              <Button
                variant="ghost"
                size="icon"
                aria-label="Chat"
                className="cursor-pointer"
              >
                <ChevronLeft className="h-5 w-5" />
              </Button>
            </Link>

            <div className="flex items-center gap-2">
              <BarChart3 className="w-6 h-6 text-primary" />
              <span className="font-extrabold tracking-tight text-lg">
                Insights Dashboard
              </span>
            </div>

            <div className="ml-auto flex items-center gap-2">
              <Link href="/" legacyBehavior>
                <a
                  aria-label="Home"
                  className="hidden sm:inline-flex cursor-pointer mr-2"
                >
                  <HomeIcon className="h-5 w-5" />
                </a>
              </Link>
              <DarkModeToggle />
            </div>
          </div>
        </header>

        {/* ------------------------------------------------------------------ */}
        {/*  Intro                                                             */}
        {/* ------------------------------------------------------------------ */}
        <section className="mx-auto max-w-4xl px-6 py-10 text-center space-y-3">
          <h1 className="text-3xl md:text-4xl font-bold leading-tight">
            Chapel Hill Real‑Estate Visualized
          </h1>
          <p className="text-muted-foreground max-w-xl mx-auto">
            Twelve crisp charts uncover price patterns, bedroom trends, and
            neighbourhood popularity, giving you the data‑driven edge in your
            home search.
          </p>
        </section>

        {/* ------------------------------------------------------------------ */}
        {/*  Charts grid                                                       */}
        {/* ------------------------------------------------------------------ */}
        <main className="flex-1 px-6 pb-16">
          {loading ? (
            <div className="flex items-center justify-center h-60">
              <div className="h-12 w-12 rounded-full border-4 border-primary border-t-transparent animate-spin" />
            </div>
          ) : charts ? (
            <div className="max-w-7xl mx-auto grid gap-8 sm:grid-cols-2 lg:grid-cols-3">
              {Object.entries(charts).map(([key, spec]) => (
                <Card
                  key={key}
                  className="bg-card border border-border rounded-2xl shadow-sm"
                >
                  <CardHeader className="pb-2 flex-row items-center gap-2">
                    <BarChart3 className="w-4 h-4 text-primary" />
                    <CardTitle className="text-md font-bold">
                      {chartTitles[key]}
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="h-72">
                    <ChartBlock spec={spec} />
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : (
            <p className="text-center text-red-500">
              Couldn’t load chart data — please try again later.
            </p>
          )}
        </main>
      </div>
    </>
  );
}
