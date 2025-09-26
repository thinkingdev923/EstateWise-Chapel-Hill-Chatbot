"use client";

import React, { useEffect, useState } from "react";
import { Moon, Sun } from "lucide-react";

type DarkModeToggleProps = {
  className?: string;
  title?: string;
};

const STORAGE_KEY = "dark-mode";

export function DarkModeToggle({ className, title }: DarkModeToggleProps) {
  const [enabled, setEnabled] = useState<boolean>(() => {
    if (typeof window === "undefined") return false;
    const stored = window.localStorage.getItem(STORAGE_KEY);
    if (stored !== null) return stored === "true";
    return document.documentElement.classList.contains("dark");
  });

  useEffect(() => {
    const root = document.documentElement;
    if (enabled) {
      root.classList.add("dark");
    } else {
      root.classList.remove("dark");
    }
    window.localStorage.setItem(STORAGE_KEY, String(enabled));
    document
      .querySelector("meta[name='theme-color']")
      ?.setAttribute("content", enabled ? "#262626" : "#faf9f2");
  }, [enabled]);

  useEffect(() => {
    const handleStorage = (event: StorageEvent) => {
      if (event.key !== STORAGE_KEY || event.newValue == null) return;
      setEnabled(event.newValue === "true");
    };

    window.addEventListener("storage", handleStorage);
    return () => window.removeEventListener("storage", handleStorage);
  }, []);

  return (
    <button
      type="button"
      aria-label="Toggle dark mode"
      title={title ?? "Toggle theme"}
      onClick={() => setEnabled((value) => !value)}
      className={`inline-flex h-8 w-8 cursor-pointer items-center justify-center rounded-full p-0 transition-colors hover:text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/60 ${className ?? ""}`}
    >
      {enabled ? <Sun className="h-5 w-5" /> : <Moon className="h-5 w-5" />}
    </button>
  );
}
