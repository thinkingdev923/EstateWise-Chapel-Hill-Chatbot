"use client";

import React, { useEffect, useRef, useState, memo } from "react";
import Head from "next/head";
import Link from "next/link";
import Chart, { ChartConfiguration } from "chart.js/auto";
// eslint-disable-next-line @typescript-eslint/no-unused-vars
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Sun,
  Moon,
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  ChevronLeft,
  BarChart3,
  Home as HomeIcon,
} from "lucide-react";
import { toast } from "sonner";

const API_BASE_URL = "https://estatewise-backend.vercel.app";

// ------------------------------------------------------------------
// THEME TOGGLE
// ------------------------------------------------------------------
const DarkModeToggle: React.FC = () => {
  const [darkMode, setDarkMode] = useState<boolean>(() => {
    if (typeof window === "undefined") return false;
    const saved = localStorage.getItem("dark-mode");
    if (saved !== null) return saved === "true";
    return document.documentElement.classList.contains("dark");
  });

  useEffect(() => {
    const root = document.documentElement;
    // eslint-disable-next-line @typescript-eslint/no-unused-expressions
    darkMode ? root.classList.add("dark") : root.classList.remove("dark");
    localStorage.setItem("dark-mode", String(darkMode));
    document
      .querySelector("meta[name='theme-color']")
      ?.setAttribute("content", darkMode ? "#262626" : "#faf9f2");
  }, [darkMode]);

  const toggle = () => {
    setDarkMode((prev) => {
      const next = !prev;
      toast.success(next ? "Dark mode activated" : "Light mode activated");
      return next;
    });
  };

  return (
    <button
      aria-label="Toggle theme"
      onClick={toggle}
      className="rounded-full p-2 transition-colors cursor-pointer hover:text-primary"
    >
      {darkMode ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
    </button>
  );
};

// ------------------------------------------------------------------
// Helpers
// ------------------------------------------------------------------
const PALETTE = [
  "#1f77b4",
  "#ff7f0e",
  "#2ca02c",
  "#d62728",
  "#9467bd",
  "#8c564b",
  "#e377c2",
  "#7f7f7f",
  "#bcbd22",
  "#17becf",
];

const normalizeLabel = (label: string): string =>
  label
    .toLowerCase()
    .split(/[\s_]+/)
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
    .join(" ");

// ------------------------------------------------------------------
// ChartBlock: create chart once, only update colors on theme change
// ------------------------------------------------------------------
const ChartBlock: React.FC<{ spec: ChartConfiguration }> = memo(({ spec }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const chartRef = useRef<Chart | null>(null);
  const [isDark, setIsDark] = useState<boolean>(() =>
    document.documentElement.classList.contains("dark"),
  );
  const [visible, setVisible] = useState<boolean>(false);

  useEffect(() => {
    const mo = new MutationObserver(() =>
      setIsDark(document.documentElement.classList.contains("dark")),
    );
    mo.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ["class"],
    });
    return () => mo.disconnect();
  }, []);

  // lazy load
  useEffect(() => {
    const node = canvasRef.current;
    if (!node) return;
    const obs = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setVisible(true);
          obs.disconnect();
        }
      },
      { threshold: 0.1 },
    );
    obs.observe(node);
    return () => obs.disconnect();
  }, []);

  useEffect(() => {
    if (!visible || chartRef.current || !canvasRef.current) return;

    const cfg = structuredClone(spec) as ChartConfiguration;

    if (cfg.data?.labels) {
      cfg.data.labels = cfg.data.labels.map((lbl) =>
        normalizeLabel(String(lbl)),
      );
    }

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    cfg.data?.datasets?.forEach((ds: any, idx: number) => {
      if (Array.isArray(ds.data)) {
        ds.backgroundColor = ds.data.map(
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          (_: any, i: number) => PALETTE[i % PALETTE.length],
        );
        ds.borderColor = ds.backgroundColor;
      } else {
        const c = PALETTE[idx % PALETTE.length];
        ds.backgroundColor = c;
        ds.borderColor = c;
      }
      ds.borderWidth = ds.borderWidth ?? 1;
    });

    const fontColor = isDark ? "#ffffff" : "#000000";
    Chart.defaults.color = fontColor;
    cfg.options = {
      ...(cfg.options || {}),
      maintainAspectRatio: false,
      plugins: {
        ...(cfg.options?.plugins || {}),
        legend: {
          ...(cfg.options?.plugins?.legend || {}),
          labels: { color: fontColor },
        },
      },
    };
    if (cfg.options.scales) {
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      Object.entries(cfg.options.scales).forEach(([_, scale]) => {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const s = scale as any;
        s.ticks = { ...(s.ticks || {}), color: fontColor };
        s.title = { ...(s.title || {}), color: fontColor };
      });
    }

    chartRef.current = new Chart(canvasRef.current, cfg);
  }, [visible, spec, isDark]);

  useEffect(() => {
    const chart = chartRef.current;
    if (!chart) return;

    const fontColor = isDark ? "#ffffff" : "#000000";
    Chart.defaults.color = fontColor;

    if (chart.options.plugins?.legend?.labels) {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      (chart.options.plugins.legend.labels as any).color = fontColor;
    }

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const scales = (chart.options.scales || {}) as Record<string, any>;
    Object.values(scales).forEach((s) => {
      if (s.ticks) s.ticks.color = fontColor;
      if (s.title) s.title.color = fontColor;
    });

    chart.update("none");
  }, [isDark]);

  return <canvas ref={canvasRef} className="h-full w-full mb-4" />;
});

ChartBlock.displayName = "ChartBlock";

const chartTitles: Record<string, string> = {
  homeType: "Home‑type distribution",
  bedrooms: "Bedroom count",
  bathrooms: "Bathroom count",
  priceDist: "Price distribution",
  areaDist: "Living‑area distribution",
  yearBuiltDist: "Year‑built distribution",
  priceArea: "Price vs living area",
  priceYear: "Price vs year built",
  bedsBaths: "Bedrooms vs bathrooms",
  avgPriceType: "Average price by type",
  countByZip: "Listings by zipcode",
  pricePerSqft: "Price per sqft",
  homeStatus: "Home status distribution",
  countByCity: "Listings by city",
  avgAreaType: "Average living area by type",
  scoreDist: "Score distribution",
  scorePrice: "Price vs score",
  areaYear: "Living area vs year built",
};

// ------------------------------------------------------------------
// Main Page
// ------------------------------------------------------------------
export default function ChartsPage() {
  const [charts, setCharts] = useState<Record<
    string,
    ChartConfiguration
  > | null>(null);
  const [loading, setLoading] = useState<boolean>(true);

  useEffect(() => {
    fetch(`${API_BASE_URL}/api/properties?q=Chapel%20Hill&topK=1500`)
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
        <header className="sticky top-0 z-30 w-full backdrop-blur-lg bg-background/90 border-b border-border">
          <div className="max-w-7xl mx-auto h-16 px-6 flex items-center gap-4">
            {/*<Link href="/chat">*/}
            {/*  <Button*/}
            {/*    variant="ghost"*/}
            {/*    size="icon"*/}
            {/*    aria-label="Chat"*/}
            {/*    className="cursor-pointer"*/}
            {/*  >*/}
            {/*    <ChevronLeft className="h-5 w-5" />*/}
            {/*  </Button>*/}
            {/*</Link>*/}
            <div className="flex items-center gap-2">
              <BarChart3 className="w-6 h-6 text-primary" />
              <span className="font-extrabold tracking-tight text-lg">
                Insights Dashboard
              </span>
            </div>
            <div className="ml-auto flex items-center gap-2">
              <Link href="/chat" legacyBehavior>
                <a
                  aria-label="Home"
                  className="hidden sm:inline-flex mr-2 hover:text-primary"
                >
                  <HomeIcon className="h-5 w-5" />
                </a>
              </Link>
              <DarkModeToggle />
            </div>
          </div>
        </header>

        <section className="mx-auto max-w-4xl px-6 py-10 text-center space-y-3">
          <h1 className="text-3xl md:text-4xl font-bold leading-tight">
            Chapel Hill Real‑Estate Visualized 📊
          </h1>
          <p className="text-muted-foreground max-w-xl mx-auto">
            Eighteen crisp charts uncover price patterns, bedroom trends, and
            neighbourhood popularity, giving you the data‑driven edge in your
            home search.
          </p>
        </section>

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
