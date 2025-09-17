"use client";

import React, { useEffect, useMemo, useRef, useState } from "react";
import Head from "next/head";
import Link from "next/link";
import {
  Tooltip,
  TooltipTrigger,
  TooltipContent,
} from "@/components/ui/tooltip";
import { useRouter } from "next/router";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { searchPropertiesForMap, getPropertiesByIds } from "@/lib/api";
import { toast } from "sonner";
import {
  MapPin,
  BarChart3,
  MessageCircleMore,
  Sun,
  Moon,
  GitBranch,
} from "lucide-react";

type Listing = {
  id: string;
  zpid?: number;
  price?: number;
  city?: string;
  zipcode?: string;
  latitude?: number;
  longitude?: number;
  bedrooms?: number;
  bathrooms?: number;
  livingArea?: number;
};

const DEFAULT_CENTER = { lat: 35.9132, lng: -79.0558 }; // Chapel Hill
const MAX_POINTS = 200;
const DEFAULT_BOOTSTRAP_POINTS = 50;

declare global {
  interface Window {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    L: any;
  }
}

export default function MapPage() {
  const DarkModeToggle: React.FC = () => {
    const [darkMode, setDarkMode] = useState<boolean>(() => {
      if (typeof window === "undefined") return false;
      const saved = localStorage.getItem("dark-mode");
      if (saved !== null) return saved === "true";
      return document.documentElement.classList.contains("dark");
    });

    useEffect(() => {
      const root = document.documentElement;
      if (darkMode) {
        root.classList.add("dark");
      } else {
        root.classList.remove("dark");
      }
      localStorage.setItem("dark-mode", String(darkMode));
      document
        .querySelector("meta[name='theme-color']")
        ?.setAttribute("content", darkMode ? "#262626" : "#faf9f2");
    }, [darkMode]);

    return (
      <button
        aria-label="Toggle theme"
        onClick={() => setDarkMode((v) => !v)}
        className="inline-flex h-8 w-8 items-center justify-center rounded-full p-0 transition-colors cursor-pointer hover:text-primary"
        title="Toggle theme"
      >
        {darkMode ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
      </button>
    );
  };
  const router = useRouter();
  const zpidsParam = (router.query.zpids as string) || "";
  const qParam = (router.query.q as string) || "";
  const [loading, setLoading] = useState(false);
  const [listings, setListings] = useState<Listing[]>([]);
  const [q, setQ] = useState(qParam);

  // Load data based on query string
  useEffect(() => {
    async function load() {
      setLoading(true);
      try {
        const ids = (zpidsParam || "")
          .split(",")
          .map((s) => s.trim())
          .filter(Boolean);
        if (ids.length > 0) {
          const data = await getPropertiesByIds(ids);
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          const items: Listing[] = (data.listings || []).map((l: any) => ({
            id: String(l.zpid || l.id),
            zpid: l.zpid ?? Number(l.id),
            price: l.price,
            city: l.city,
            zipcode: l.zipcode,
            latitude: l.latitude,
            longitude: l.longitude,
            bedrooms: l.bedrooms,
            bathrooms: l.bathrooms,
            livingArea: l.livingArea,
          }));
          setListings(items);
        } else if ((qParam || "").trim().length > 0) {
          const data = await searchPropertiesForMap(qParam, MAX_POINTS);
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          const items: Listing[] = (data.listings || []).map((l: any) => ({
            id: l.id,
            zpid: Number(l.id),
            price: l.price,
            city: l.city,
            zipcode: l.zipcode,
            latitude: l.latitude,
            longitude: l.longitude,
            bedrooms: l.bedrooms,
            bathrooms: l.bathrooms,
            livingArea: l.livingArea,
          }));
          // Limit to avoid performance issues
          setListings(
            items.filter((x) => x.latitude && x.longitude).slice(0, MAX_POINTS),
          );
        } else {
          // No search input provided: show a default bootstrap of 50 properties
          const data = await searchPropertiesForMap(
            "homes",
            DEFAULT_BOOTSTRAP_POINTS,
          );
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          const items: Listing[] = (data.listings || []).map((l: any) => ({
            id: l.id,
            zpid: Number(l.id),
            price: l.price,
            city: l.city,
            zipcode: l.zipcode,
            latitude: l.latitude,
            longitude: l.longitude,
            bedrooms: l.bedrooms,
            bathrooms: l.bathrooms,
            livingArea: l.livingArea,
          }));
          setListings(items.filter((x) => x.latitude && x.longitude));
        }
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
      } catch (e: any) {
        toast.error(e.message || "Failed to load properties");
      } finally {
        setLoading(false);
      }
    }
    if (!router.isReady) return;
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [router.isReady, zpidsParam, qParam]);

  // Initialize Leaflet via CDN if not present
  const mapRef = useRef<HTMLDivElement>(null);
  const leafletReady = useLeafletCDN();

  useEffect(() => {
    if (!leafletReady || !mapRef.current) return;
    const L = window.L;
    // Clear previous
    mapRef.current.innerHTML = "";

    const map = L.map(mapRef.current).setView(
      [DEFAULT_CENTER.lat, DEFAULT_CENTER.lng],
      12,
    );
    L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
      attribution:
        '&copy; <a href="https://www.openstreetmap.org/copyright">OSM</a>',
    }).addTo(map);

    const pts = listings.filter(
      (l) => Number.isFinite(l.latitude) && Number.isFinite(l.longitude),
    );
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const markers: any[] = [];
    pts.forEach((p) => {
      const m = L.marker([p.latitude, p.longitude]).addTo(map);
      const price = p.price ? `$${Number(p.price).toLocaleString()}` : "N/A";
      const zpidLink = p.zpid
        ? `https://www.zillow.com/homedetails/${p.zpid}_zpid/`
        : "#";
      m.bindPopup(
        `ZPID: ${p.zpid || p.id}<br/>${price}<br/>${p.city || ""} ${p.zipcode || ""}<br/><a href='${zpidLink}' target='_blank' rel='noopener noreferrer'>Zillow</a>`,
      );
      markers.push(m);
    });
    if (markers.length > 0) {
      const group = L.featureGroup(markers);
      map.fitBounds(group.getBounds().pad(0.2));
    }

    return () => {
      map.remove();
    };
  }, [leafletReady, listings]);

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const zpidList = useMemo(
    () => listings.map((l) => l.zpid || Number(l.id)).filter(Boolean),
    [listings],
  );

  async function handleSearch() {
    router.push({ pathname: "/map", query: { q } });
  }

  return (
    <>
      <Head>
        <title>Map | EstateWise</title>
        <meta
          name="description"
          content="View properties on the map in Chapel Hill and surrounding areas."
        />
        <link
          rel="stylesheet"
          href="https://unpkg.com/leaflet@1.9.4/dist/leaflet.css"
        />
        {/* Script injected via hook as well, but keeping css in head */}
      </Head>

      <div className="min-h-screen bg-background text-foreground flex flex-col">
        <header className="sticky top-0 z-30 w-full backdrop-blur-lg bg-background/90 border-b border-border">
          <div className="max-w-7xl mx-auto h-16 px-6 flex items-center gap-4 overflow-x-auto whitespace-nowrap">
            <div className="flex items-center gap-2">
              <MapPin className="w-6 h-6 text-primary" />
              <span className="font-extrabold tracking-tight text-lg">
                Property Map
              </span>
            </div>
            <nav className="ml-auto flex items-center gap-6 text-sm">
              <Tooltip>
                <TooltipTrigger asChild>
                  <Link
                    href="/chat"
                    className="hover:text-primary"
                    aria-label="Chat"
                  >
                    <MessageCircleMore className="w-5 h-5" />
                  </Link>
                </TooltipTrigger>
                <TooltipContent>Chat</TooltipContent>
              </Tooltip>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Link
                    href="/insights"
                    className="hover:text-primary"
                    aria-label="Insights"
                  >
                    <GitBranch className="w-5 h-5" />
                  </Link>
                </TooltipTrigger>
                <TooltipContent>Insights</TooltipContent>
              </Tooltip>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Link
                    href="/charts"
                    className="hover:text-primary"
                    aria-label="Charts"
                  >
                    <BarChart3 className="w-5 h-5" />
                  </Link>
                </TooltipTrigger>
                <TooltipContent>Charts</TooltipContent>
              </Tooltip>
              <Tooltip>
                <TooltipTrigger asChild>
                  <span>
                    <DarkModeToggle />
                  </span>
                </TooltipTrigger>
                <TooltipContent>Toggle theme</TooltipContent>
              </Tooltip>
            </nav>
          </div>
        </header>
        <main className="flex-1 p-4 md:p-6">
          <div className="max-w-6xl mx-auto w-full">
            <header className="mb-6">
              <h1 className="text-3xl font-bold flex items-center gap-2">
                <MapPin className="w-7 h-7" /> Property Map
              </h1>
              <p className="text-muted-foreground">
                Find and view properties on an interactive map with quick
                filters.
              </p>
            </header>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <Card className="md:col-span-2">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <MapPin className="w-5 h-5" /> Property Map
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div
                    ref={mapRef}
                    className="w-full h-[70vh] rounded-lg overflow-hidden border"
                  />
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Filters</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="flex gap-2">
                    <Input
                      value={q}
                      onChange={(e) => setQ(e.target.value)}
                      placeholder="Search e.g. 3 bed homes"
                    />
                    <Button
                      onClick={handleSearch}
                      disabled={loading}
                      className="cursor-pointer"
                    >
                      Go
                    </Button>
                  </div>
                  <div className="text-xs text-muted-foreground">
                    Showing {listings.length} results. Use the search to refine.
                    For specific homes, pass <code>?zpids=123,456</code> in the
                    URL.
                  </div>
                  {/* Removed current map link display per request */}
                </CardContent>
              </Card>
            </div>
          </div>
        </main>
      </div>
    </>
  );
}

function useLeafletCDN() {
  const [ready, setReady] = useState<boolean>(false);
  useEffect(() => {
    if (typeof window === "undefined") return;
    if (window.L) {
      setReady(true);
      return;
    }
    const script = document.createElement("script");
    script.src = "https://unpkg.com/leaflet@1.9.4/dist/leaflet.js";
    script.async = true;
    script.onload = () => setReady(true);
    document.body.appendChild(script);
    return () => {
      script.remove();
    };
  }, []);
  return ready;
}
