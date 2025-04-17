"use client";

import React, { useState, useEffect, useRef } from "react";
import Head from "next/head";
import Link from "next/link";
import Cookies from "js-cookie";
import { motion, AnimatePresence } from "framer-motion";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { toast } from "sonner";
import {
  Loader2,
  Send,
  Trash2,
  Search,
  Sun,
  Moon,
  User as UserIcon,
  PlusCircle,
  Pencil,
  X,
  Home,
  Menu,
  ChevronLeft,
  LogOut,
  BarChart3,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import Chart from "chart.js/auto";

const API_BASE_URL = "https://estatewise-backend.vercel.app";

const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { when: "beforeChildren", staggerChildren: 0.1 },
  },
};

const bubbleVariants = {
  hidden: { opacity: 0, y: 10, scale: 0.95 },
  visible: {
    opacity: 1,
    y: 0,
    scale: 1,
    transition: { duration: 0.3, ease: "easeOut" },
  },
};

const desktopSidebarVariants = {
  visible: { width: "18rem", transition: { duration: 0.6, ease: "easeInOut" } },
  hidden: { width: "0rem", transition: { duration: 0.6, ease: "easeInOut" } },
};

// ----------------------------------------------------------
// ChartBlock Component for rendering Chart.js specs
// ----------------------------------------------------------
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const ChartBlock: React.FC<{ spec: any }> = ({ spec }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const chartRef = useRef<Chart | null>(null);

  // helper to compute current font color
  const getFontColor = () => {
    // prefer tailwind's text-foreground in light, white in dark
    const isDark = document.documentElement.classList.contains("dark");
    if (canvasRef.current) {
      return getComputedStyle(canvasRef.current).color;
    }
    return isDark ? "#ffffff" : "#000000";
  };

  useEffect(() => {
    if (!canvasRef.current) return;

    // deep clone spec so we don’t mutate the prop
    const config = JSON.parse(JSON.stringify(spec));
    config.options = config.options || {};
    config.options.plugins = config.options.plugins || {};

    // set initial colors
    const fontColor = getFontColor();
    // legend labels
    config.options.plugins.legend = {
      ...config.options.plugins.legend,
      labels: {
        ...(config.options.plugins.legend?.labels || {}),
        color: fontColor,
      },
    };
    // scales ticks & titles
    if (config.options.scales) {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any, @typescript-eslint/no-unused-vars
      Object.entries(config.options.scales).forEach(([_, scaleOpts]: any) => {
        scaleOpts.ticks = { ...(scaleOpts.ticks || {}), color: fontColor };
        scaleOpts.title = { ...(scaleOpts.title || {}), color: fontColor };
      });
    }

    // instantiate chart
    chartRef.current = new Chart(canvasRef.current, config);

    // observe dark-mode class changes to update chart colors
    const observer = new MutationObserver(() => {
      if (!chartRef.current) return;
      const newColor = getFontColor();
      // update legend labels color
      const legend = chartRef.current.options.plugins?.legend;
      if (legend && legend.labels) {
        legend.labels.color = newColor;
      }
      // update scales
      if (chartRef.current.options.scales) {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        Object.values(chartRef.current.options.scales).forEach((scale: any) => {
          if (scale.ticks) scale.ticks.color = newColor;
          if (scale.title) scale.title.color = newColor;
        });
      }
      chartRef.current.update();
    });
    observer.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ["class"],
    });

    return () => {
      observer.disconnect();
      chartRef.current?.destroy();
      chartRef.current = null;
    };
  }, [spec]);

  return <canvas className="mb-4" ref={canvasRef} />;
};

// ----------------------------------------------------------
// ReactMarkdown Custom Components
// ----------------------------------------------------------
const markdownComponents = {
  // Headings
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  h1: ({ children, ...props }: any) => (
    <h1
      className="text-2xl font-bold my-4 border-b-2 border-gray-200 pb-2"
      {...props}
    >
      {children}
    </h1>
  ),
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  h2: ({ children, ...props }: any) => (
    <h2
      className="text-xl font-bold my-3 border-b border-gray-200 pb-1"
      {...props}
    >
      {children}
    </h2>
  ),
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  h3: ({ children, ...props }: any) => (
    <h3 className="text-lg font-bold my-3" {...props}>
      {children}
    </h3>
  ),
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  h4: ({ children, ...props }: any) => (
    <h4 className="text-base font-bold my-2" {...props}>
      {children}
    </h4>
  ),
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  h5: ({ children, ...props }: any) => (
    <h5 className="text-sm font-bold my-2" {...props}>
      {children}
    </h5>
  ),
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  h6: ({ children, ...props }: any) => (
    <h6 className="text-xs font-bold my-2" {...props}>
      {children}
    </h6>
  ),
  // Paragraph
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  p: ({ children, ...props }: any) => (
    <p className="mb-3 leading-relaxed" {...props}>
      {children}
    </p>
  ),
  // Blockquote
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  blockquote: ({ children, ...props }: any) => (
    <blockquote
      className="border-l-4 border-gray-300 pl-4 italic text-gray-700 my-3"
      {...props}
    >
      {children}
    </blockquote>
  ),
  // Horizontal Rule
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  hr: ({ ...props }: any) => (
    <hr className="border-t border-gray-300 my-3" {...props} />
  ),
  // Code Block & Inline Code
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  code: ({ inline, children, className, ...props }: any) => {
    const content = String(children).trim();

    // detect our chart-spec code blocks
    if (!inline && /language-chart-spec/.test(className || "")) {
      let spec;
      try {
        spec = JSON.parse(content);
      } catch {
        // fallback to plain code block if JSON invalid
        return (
          <pre
            className="bg-gray-100 text-gray-800 p-2 rounded text-sm font-mono overflow-x-auto my-3"
            {...props}
          >
            <code>{children}</code>
          </pre>
        );
      }
      return <ChartBlock spec={spec} />;
    }

    if (inline) {
      return (
        <code
          className="bg-gray-100 text-gray-800 px-1 py-0.5 rounded text-sm font-mono"
          {...props}
        >
          {children}
        </code>
      );
    }

    return (
      <pre
        className="bg-gray-100 text-gray-800 p-2 rounded text-sm font-mono overflow-x-auto my-3"
        {...props}
      >
        <code>{children}</code>
      </pre>
    );
  },
  // Table elements
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  table: ({ children, ...props }: any) => (
    <div className="overflow-x-auto my-3">
      <table
        className="min-w-full border-collapse border border-gray-300 text-sm"
        {...props}
      >
        {children}
      </table>
    </div>
  ),
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  thead: ({ children, ...props }: any) => (
    <thead className="bg-gray-100 border-b border-gray-300" {...props}>
      {children}
    </thead>
  ),
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  tbody: ({ children, ...props }: any) => <tbody {...props}>{children}</tbody>,
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  tr: ({ children, ...props }: any) => (
    <tr className="border-b last:border-0" {...props}>
      {children}
    </tr>
  ),
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  th: ({ children, ...props }: any) => (
    <th
      className="border border-gray-300 px-3 py-2 font-semibold text-left"
      {...props}
    >
      {children}
    </th>
  ),
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  td: ({ children, ...props }: any) => (
    <td className="border border-gray-300 px-3 py-2 align-top" {...props}>
      {children}
    </td>
  ),
  // Lists
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  ul: ({ children, ...props }: any) => (
    <ul className="list-disc list-outside pl-4 my-3" {...props}>
      {children}
    </ul>
  ),
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  ol: ({ children, ...props }: any) => (
    <ol className="list-decimal list-outside pl-4 my-3" {...props}>
      {children}
    </ol>
  ),
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  li: ({ children, ...props }: any) => (
    <li className="my-1 marker:mr-2" {...props}>
      {children}
    </li>
  ),
  // Images
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  img: ({ src, alt, ...props }: any) => (
    <img className="max-w-full h-auto my-3" src={src} alt={alt} {...props} />
  ),
  // Emphasis and strong (bold)
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  em: ({ children, ...props }: any) => (
    <em className="italic" {...props}>
      {children}
    </em>
  ),
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  strong: ({ children, ...props }: any) => (
    <strong className="font-bold" {...props}>
      {children}
    </strong>
  ),
  // Strikethrough
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  del: ({ children, ...props }: any) => (
    <del className="line-through" {...props}>
      {children}
    </del>
  ),
  // Custom Link
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  a: ({ children, href, ...props }: any) => (
    <a
      href={href}
      className="inline-block bg-blue-100 text-blue-800 px-2 py-1 rounded-full text-sm font-medium hover:bg-blue-200 max-w-full break-words"
      target="_blank"
      rel="noopener noreferrer"
      {...props}
    >
      {children}
    </a>
  ),
};

// ----------------------------------------------------------
// Chat Types and Local Storage Helper
// ----------------------------------------------------------
type ChatMessage = { role: "user" | "model"; text: string };

const getInitialMessages = (): ChatMessage[] => {
  // For unauthenticated users, load from local storage
  if (typeof window !== "undefined" && !Cookies.get("estatewise_token")) {
    const stored = localStorage.getItem("estateWiseChat");
    if (stored) {
      try {
        return JSON.parse(stored);
      } catch {
        return [];
      }
    }
  }
  return [];
};

// ----------------------------------------------------------
// ClientOnly Component
// ----------------------------------------------------------
const ClientOnly: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);
  if (!mounted) return null;
  return <>{children}</>;
};

// ----------------------------------------------------------
// Dark Mode Toggle Component
// ----------------------------------------------------------
const DarkModeToggle: React.FC = () => {
  // On initial load, read the saved preference (fallback to system or light)
  const [darkMode, setDarkMode] = useState(() => {
    if (typeof window === "undefined") return false;
    const saved = localStorage.getItem("dark-mode");
    if (saved !== null) return saved === "true";
    return window.matchMedia("(prefers-color-scheme: dark)").matches;
  });

  useEffect(() => {
    const root = document.documentElement;
    if (darkMode) {
      root.classList.add("dark");
      localStorage.setItem("dark-mode", "true");
    } else {
      root.classList.remove("dark");
      localStorage.setItem("dark-mode", "false");
    }
    const newThemeColor = darkMode ? "#262626" : "#faf9f2";
    const meta = document.querySelector("meta[name='theme-color']");
    if (meta) meta.setAttribute("content", newThemeColor);
  }, [darkMode]);

  const toggleDarkMode = () => {
    const next = !darkMode;
    setDarkMode(next);
    toast.success(next ? "Dark mode activated" : "Light mode activated");
  };

  return (
    <button
      onClick={toggleDarkMode}
      className="p-1 cursor-pointer transition-none"
    >
      {darkMode ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
    </button>
  );
};

// ----------------------------------------------------------
// Top Bar Component
// ----------------------------------------------------------
type TopBarProps = {
  onNewConvo: () => void;
  toggleSidebar: () => void;
  sidebarVisible: boolean;
};

const TopBar: React.FC<TopBarProps> = ({
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  onNewConvo,
  toggleSidebar,
  sidebarVisible,
}) => {
  const isAuthed = !!Cookies.get("estatewise_token");
  const username = localStorage.getItem("username") || "Guest";
  const [authMenuOpen, setAuthMenuOpen] = useState(false);

  const handleAuthIconClick = () => {
    setAuthMenuOpen((prev) => !prev);
  };

  return (
    <div className="sticky top-0 z-20 flex items-center justify-between p-4 border-b border-border bg-background shadow-md h-16">
      <div className="flex items-center gap-2">
        {!sidebarVisible && (
          <button
            onClick={toggleSidebar}
            className="p-2 cursor-pointer hover:bg-muted rounded duration-200"
          >
            <Menu className="w-6 h-6" />
          </button>
        )}
        <span className="hidden md:inline text-xl font-bold select-none text-foreground">
          Hi {username}, welcome to EstateWise! 🏠
        </span>
      </div>
      <div className="flex items-center gap-4 relative">
        <Link href="/charts" legacyBehavior>
          <a className="flex items-center gap-1">
            <BarChart3 className="w-5 h-5" />
          </a>
        </Link>
        <DarkModeToggle />
        {isAuthed ? (
          <>
            <Button
              onClick={() => window.location.reload()}
              variant="outline"
              className="flex items-center gap-1 transition-none cursor-pointer"
            >
              <PlusCircle className="w-5 h-5" />
              New Conversation
            </Button>
            <Button
              variant="outline"
              onClick={() => {
                document.cookie =
                  "estatewise_token=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;";
                toast.success("Logged out successfully");
                window.location.reload();
              }}
              className="flex items-center gap-1 transition-none text-red-500 hover:bg-red-500/10 cursor-pointer"
            >
              <LogOut className="w-5 h-5" />
            </Button>
          </>
        ) : (
          <div className="flex items-center gap-2">
            <div className="relative">
              <button
                onClick={handleAuthIconClick}
                className="p-1 cursor-pointer"
              >
                <UserIcon className="w-5 h-5" />
              </button>
              {authMenuOpen && (
                <div className="absolute right-0 mt-2 w-40 bg-card rounded shadow-lg py-2 z-50">
                  <Link href="/login">
                    <div
                      className="px-4 py-2 hover:bg-muted cursor-pointer select-none"
                      onClick={() => setAuthMenuOpen(false)}
                    >
                      Log In
                    </div>
                  </Link>
                  <Link href="/signup">
                    <div
                      className="px-4 py-2 hover:bg-muted cursor-pointer select-none"
                      onClick={() => setAuthMenuOpen(false)}
                    >
                      Sign Up
                    </div>
                  </Link>
                </div>
              )}
            </div>
            <Button
              onClick={() => {
                localStorage.removeItem("estateWiseChat");
                toast.success("Conversation deleted successfully");
                window.location.reload();
              }}
              variant="outline"
              className="flex items-center gap-1 transition-none text-red-500 hover:bg-red-500/10 cursor-pointer ml-2"
            >
              <Trash2 className="w-5 h-5" />
              Delete Conversation
            </Button>
          </div>
        )}
      </div>
    </div>
  );
};

// ----------------------------------------------------------
// Sidebar Component
// ----------------------------------------------------------
type SidebarProps = {
  conversationLoading: boolean;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  conversations: any[];
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  onSelect: (conv: any) => void;
  isAuthed: boolean;
  refreshConvos: () => void;
  sidebarVisible: boolean;
  toggleSidebar: () => void;
  selectedConvoId: string | null;
};

const Sidebar: React.FC<SidebarProps> = ({
  conversationLoading,
  conversations,
  onSelect,
  isAuthed,
  refreshConvos,
  sidebarVisible,
  toggleSidebar,
  selectedConvoId,
}) => {
  const [showSearchModal, setShowSearchModal] = useState(false);
  const [query, setQuery] = useState("");
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const [searchResults, setSearchResults] = useState<any[]>([]);
  const [searchLoading, setSearchLoading] = useState(false);
  const [renamingId, setRenamingId] = useState<string | null>(null);
  const [newTitle, setNewTitle] = useState("");
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const searchTimeout = useRef<NodeJS.Timeout | null>(null);
  const [isMobile, setIsMobile] = useState(false);

  /* -----------------------------------------------------------------
   * Highlighting + auto-scroll logic
   * ----------------------------------------------------------------- */
  // The id that should currently be highlighted because it is NEW
  const [highlightId, setHighlightId] = useState<string | null>(null);
  // Store refs to each conversation row so we can scroll to it
  const itemRefs = useRef<{ [key: string]: HTMLDivElement | null }>({});
  // Keep track of the previous set of ids so we can detect additions
  const prevConvoIdsRef = useRef<string[]>([]);

  useEffect(() => {
    // Detect newly‑added conversation ids
    const prevIds = prevConvoIdsRef.current;
    const currentIds = conversations.map((c) => c._id);
    const newIds = currentIds.filter((id) => !prevIds.includes(id));

    if (newIds.length > 0) {
      const newId = newIds[0]; // there will only ever be one at a time
      setHighlightId(newId);

      // Wait a beat for the row to render, then scroll it into view
      setTimeout(() => {
        const el = itemRefs.current[newId];
        el?.scrollIntoView({ behavior: "smooth", block: "center" });
      }, 100);

      // Clear highlight after 2 seconds
      setTimeout(() => setHighlightId(null), 2000);
    }

    // Update the ref for the next run
    prevConvoIdsRef.current = currentIds;
  }, [conversations]);

  useEffect(() => {
    const updateWidth = () => setIsMobile(window.innerWidth < 768);
    updateWidth();
    window.addEventListener("resize", updateWidth);
    return () => window.removeEventListener("resize", updateWidth);
  }, []);

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setQuery(value);
    if (searchTimeout.current) clearTimeout(searchTimeout.current);
    if (value.trim() === "") {
      setSearchResults([]);
      setSearchLoading(false);
      return;
    }
    setSearchLoading(true);
    searchTimeout.current = setTimeout(async () => {
      try {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        let results: any[] = [];
        if (isAuthed) {
          const token = Cookies.get("estatewise_token");
          const res = await fetch(
            `${API_BASE_URL}/api/conversations/search?q=${value}`,
            {
              headers: { Authorization: `Bearer ${token}` },
            },
          );
          if (res.ok) {
            results = await res.json();
          } else {
            toast.error("Conversation search failed");
          }
        } else {
          const local = localStorage.getItem("estateWiseConvos");
          if (local) {
            const convos = JSON.parse(local);
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            results = convos.filter((conv: any) =>
              String(conv.title).toLowerCase().includes(value.toLowerCase()),
            );
          }
        }
        setSearchResults(results);
      } catch (error) {
        console.error("Search error:", error);
        toast.error("Error searching conversations");
      } finally {
        setSearchLoading(false);
      }
    }, 500);
  };

  const handleRename = async (convId: string) => {
    try {
      const token = Cookies.get("estatewise_token");
      const res = await fetch(`${API_BASE_URL}/api/conversations/${convId}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ title: newTitle }),
      });
      if (res.ok) {
        toast.success("Conversation renamed");
        setRenamingId(null);
        setNewTitle("");
        refreshConvos();
      } else {
        toast.error("Failed to rename conversation");
      }
    } catch (error) {
      console.error(error);
      toast.error("Error renaming conversation");
    }
  };

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const renderRenameButtons = (conv: any) => (
    <div className="flex items-center gap-2">
      <button
        onClick={(e) => {
          e.stopPropagation();
          handleRename(conv._id);
        }}
        title="Save"
        className="cursor-pointer hover:text-green-500"
      >
        <X className="w-4 h-4 rotate-45" />
      </button>
      <button
        onClick={(e) => {
          e.stopPropagation();
          setRenamingId(null);
          setNewTitle("");
        }}
        title="Cancel"
        className="cursor-pointer hover:text-gray-500"
      >
        <X className="w-4 h-4" />
      </button>
    </div>
  );

  const handleDelete = async () => {
    if (!deleteId) return;
    try {
      const token = Cookies.get("estatewise_token");
      const res = await fetch(`${API_BASE_URL}/api/conversations/${deleteId}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        toast.success("Conversation deleted");
        refreshConvos();
      } else {
        toast.error("Failed to delete conversation");
      }
    } catch (error) {
      console.error(error);
      toast.error("Error deleting conversation");
    } finally {
      setDeleteId(null);
    }
  };

  /* ----------------------------------------------------------
   * Motion variants for conversation rows
   * ---------------------------------------------------------- */
  const rowVariants = {
    initial: { opacity: 0, x: -15 },
    animate: { opacity: 1, x: 0, transition: { duration: 0.25 } },
  };

  /* ----------------------------------------------------------
   * Helper to render a single conversation row (desktop/mobile)
   * ---------------------------------------------------------- */
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const ConversationRow = ({ conv }: { conv: any }) => {
    const isSelected = conv._id === selectedConvoId;

    return (
      <motion.div
        key={conv._id}
        // eslint-disable-next-line @typescript-eslint/ban-ts-comment
        // @ts-ignore
        ref={(el) => (itemRefs.current[conv._id] = el)}
        variants={rowVariants}
        initial="initial"
        animate="animate"
        layout
        className={`flex items-center justify-between border-b border-sidebar-border p-2 cursor-pointer shadow-sm transition-colors duration-500
          ${isSelected ? "bg-muted dark:bg-muted/40" : "hover:bg-muted"}
          ${highlightId === conv._id ? "bg-primary/10 dark:bg-primary/20" : ""}`}
        onClick={() => {
          onSelect(conv);
          if (isMobile) toggleSidebar(); // auto‑close on mobile
        }}
      >
        {/* Title container */}
        <div className="flex-1 min-w-0 select-none">
          {renamingId === conv._id ? (
            <Input
              value={newTitle}
              onChange={(e) => setNewTitle(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  e.preventDefault();
                  handleRename(conv._id);
                }
              }}
              autoFocus
              className="cursor-text"
            />
          ) : (
            <span className="block truncate">
              {conv.title || "Untitled Conversation"}
            </span>
          )}
        </div>
        {/* Buttons container */}
        <div className="flex items-center gap-3 flex-shrink-0">
          {renamingId === conv._id ? (
            renderRenameButtons(conv)
          ) : (
            <>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  setRenamingId(conv._id);
                  setNewTitle(conv.title);
                }}
                title="Rename"
                className="cursor-pointer hover:text-blue-500"
              >
                <Pencil className="w-4 h-4" />
              </button>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  setDeleteId(conv._id);
                }}
                title="Delete"
                className="cursor-pointer hover:text-red-500"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            </>
          )}
        </div>
      </motion.div>
    );
  };

  if (isMobile) {
    return (
      <>
        <AnimatePresence>
          {sidebarVisible && (
            <motion.aside
              className="bg-sidebar text-sidebar-foreground p-4 flex flex-col overflow-hidden h-screen shadow-lg shadow-[4px_0px_10px_rgba(0,0,0,0.1)] fixed inset-0 z-40"
              initial={{ opacity: 0.5, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
            >
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-xl font-bold select-none">Conversations</h2>
                <div className="flex items-center gap-2">
                  {isAuthed && (
                    <button
                      onClick={() => setShowSearchModal(true)}
                      className="p-1 cursor-pointer hover:bg-muted rounded"
                    >
                      <Search className="w-5 h-5" />
                    </button>
                  )}
                  <button
                    onClick={toggleSidebar}
                    className="p-1 cursor-pointer hover:bg-muted rounded"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>
              </div>
              <div className="flex-1 overflow-y-auto">
                {conversationLoading ? (
                  <div className="min-h-full flex items-center justify-center">
                    <Loader2 className="animate-spin w-8 h-8" />
                  </div>
                ) : conversations.length === 0 ? (
                  <div className="min-h-full flex items-center justify-center">
                    <p className="text-center text-sm text-muted-foreground">
                      {isAuthed
                        ? "No conversations"
                        : "Log in to save conversations"}
                    </p>
                  </div>
                ) : (
                  <motion.div
                    layout
                    className="space-y-2"
                    initial={false}
                    animate={false}
                  >
                    {conversations.map((conv) => (
                      <ConversationRow key={conv._id} conv={conv} />
                    ))}
                  </motion.div>
                )}
              </div>
            </motion.aside>
          )}
        </AnimatePresence>
        {showSearchModal && (
          <div
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/60"
            onClick={() => setShowSearchModal(false)}
          >
            <motion.div
              className="bg-card p-6 rounded-lg shadow-xl w-96"
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.8, opacity: 0 }}
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                  <Search className="w-5 h-5 text-primary" />
                  <h3 className="text-lg font-bold">Search Conversations</h3>
                </div>
                <button
                  onClick={() => setShowSearchModal(false)}
                  className="text-primary font-bold cursor-pointer"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
              <Input
                placeholder="Enter search term..."
                value={query}
                onChange={handleSearchChange}
                className="mb-4 cursor-text"
              />
              <div className="max-h-60 overflow-y-auto space-y-2">
                {searchLoading ? (
                  <div className="flex items-center justify-center">
                    <Loader2 className="animate-spin w-5 h-5" />
                  </div>
                ) : query.trim() === "" ? null : searchResults.length === 0 ? (
                  <p className="text-center text-sm text-muted-foreground"></p>
                ) : (
                  searchResults.map((conv) => (
                    <div
                      key={conv._id}
                      className="p-2 bg-muted rounded cursor-pointer hover:bg-muted-foreground shadow-sm"
                      onClick={() => {
                        onSelect(conv);
                        setShowSearchModal(false);
                      }}
                    >
                      <p className="text-sm truncate text-foreground select-none">
                        {conv.title || "Untitled Conversation"}
                      </p>
                    </div>
                  ))
                )}
              </div>
            </motion.div>
          </div>
        )}
        {deleteId && (
          <DeleteConfirmationDialog
            open={true}
            onConfirm={handleDelete}
            onCancel={() => setDeleteId(null)}
          />
        )}
      </>
    );
  }

  // Desktop version.
  return (
    <div className="shadow-lg">
      <motion.aside
        className="bg-sidebar text-sidebar-foreground flex flex-col p-4 h-screen shadow-lg"
        variants={desktopSidebarVariants}
        animate={sidebarVisible ? "visible" : "hidden"}
        initial="visible"
      >
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-bold select-none">Conversations</h2>
          <div className="flex items-center gap-2">
            {isAuthed && (
              <button
                onClick={() => setShowSearchModal(true)}
                className="p-1 cursor-pointer hover:bg-muted rounded"
              >
                <Search className="w-5 h-5" />
              </button>
            )}
            <button
              onClick={toggleSidebar}
              className="p-1 cursor-pointer hover:bg-muted rounded"
            >
              <ChevronLeft className="w-5 h-5" />
            </button>
          </div>
        </div>
        <div className="flex-1 overflow-y-auto space-y-2">
          {conversationLoading ? (
            <div className="min-h-full flex items-center justify-center">
              <Loader2 className="animate-spin w-8 h-8" />
            </div>
          ) : conversations.length === 0 ? (
            <div className="min-h-full flex items-center justify-center">
              <p className="text-center text-sm text-muted-foreground">
                {isAuthed ? "No conversations" : "Log in to save conversations"}
              </p>
            </div>
          ) : (
            <motion.div
              layout
              className="space-y-2"
              initial={false}
              animate={false}
            >
              {conversations.map((conv) => (
                <ConversationRow key={conv._id} conv={conv} />
              ))}
            </motion.div>
          )}
        </div>
        <AnimatePresence>
          {showSearchModal && (
            <motion.div
              className="fixed inset-0 z-50 flex items-center justify-center bg-black/60"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setShowSearchModal(false)}
            >
              <motion.div
                className="bg-card p-6 rounded-lg shadow-xl w-96"
                initial={{ scale: 0.8, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0.8, opacity: 0 }}
                onClick={(e) => e.stopPropagation()}
              >
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-2">
                    <Search className="w-5 h-5 text-primary" />
                    <h3 className="text-lg font-bold">Search Conversations</h3>
                  </div>
                  <button
                    onClick={() => setShowSearchModal(false)}
                    className="text-primary font-bold cursor-pointer"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>
                <Input
                  placeholder="Enter search term..."
                  value={query}
                  onChange={handleSearchChange}
                  className="mb-4 cursor-text"
                />
                <div className="max-h-60 overflow-y-auto space-y-2 p-1">
                  {searchLoading ? (
                    <div className="flex items-center justify-center">
                      <Loader2 className="animate-spin w-5 h-5" />
                    </div>
                  ) : query.trim() === "" ? null : searchResults.length ===
                    0 ? (
                    <p className="text-center text-sm text-muted-foreground"></p>
                  ) : (
                    searchResults.map((conv) => (
                      <div
                        key={conv._id}
                        className="p-2 bg-muted rounded cursor-pointer hover:bg-background shadow-sm hover:shadow-2xl"
                        onClick={() => {
                          onSelect(conv);
                          setShowSearchModal(false);
                        }}
                      >
                        <p className="text-sm truncate text-foreground select-none">
                          {conv.title || "Untitled Conversation"}
                        </p>
                      </div>
                    ))
                  )}
                </div>
              </motion.div>
            </motion.div>
          )}
          {deleteId && (
            <DeleteConfirmationDialog
              open={true}
              onConfirm={handleDelete}
              onCancel={() => setDeleteId(null)}
            />
          )}
        </AnimatePresence>
      </motion.aside>
    </div>
  );
};

// ----------------------------------------------------------
// Delete Confirmation Dialog using shadcn Dialog Components
// ----------------------------------------------------------
const DeleteConfirmationDialog: React.FC<{
  open: boolean;
  onConfirm: () => void;
  onCancel: () => void;
}> = ({ open, onConfirm, onCancel }) => {
  return (
    <Dialog open={open} onOpenChange={onCancel}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Confirm Delete</DialogTitle>
          <DialogDescription>
            Are you sure you want to delete this conversation?
          </DialogDescription>
        </DialogHeader>
        <DialogFooter>
          <Button
            variant="outline"
            className="cursor-pointer"
            onClick={onCancel}
          >
            Cancel
          </Button>
          <Button className="cursor-pointer" onClick={onConfirm}>
            Delete
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

// ----------------------------------------------------------
// ChatWindow Component  –––  ONLY PART WE NEEDED TO TOUCH
// ----------------------------------------------------------
type ChatWindowProps = {
  isAuthed: boolean;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  localConvos: any[];
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  setLocalConvos: (convos: any[]) => void;
  selectedConvoId: string | null;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  onSetSelectedConvo: (conv: any) => void;
};

const ChatWindow: React.FC<ChatWindowProps> = ({
  isAuthed,
  localConvos,
  setLocalConvos,
  selectedConvoId,
  onSetSelectedConvo,
}) => {
  const [messages, setMessages] = useState<ChatMessage>(
    // eslint-disable-next-line @typescript-eslint/ban-ts-comment
    // @ts-ignore
    !Cookies.get("estatewise_token") ? getInitialMessages() : [],
  );
  const [userInput, setUserInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [convLoading, setConvLoading] = useState(false);
  const prevConvoId = useRef<string | null>(null);

  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (
      isAuthed &&
      selectedConvoId &&
      prevConvoId.current !== selectedConvoId
    ) {
      setConvLoading(true);
      const conv = localConvos.find((c) => c._id === selectedConvoId);
      setMessages(conv?.messages ?? []);
      prevConvoId.current = selectedConvoId;
      setTimeout(() => setConvLoading(false), 300);
    }
  }, [selectedConvoId, isAuthed, localConvos]);

  useEffect(() => {
    if (!Cookies.get("estatewise_token")) {
      localStorage.setItem("estateWiseChat", JSON.stringify(messages));
    }
    scrollRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const createNewConversation = async (): Promise<any> => {
    const token = Cookies.get("estatewise_token");
    const res = await fetch(`${API_BASE_URL}/api/conversations`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({ title: "Untitled Conversation" }),
    });
    if (!res.ok) throw new Error("Failed to create new conversation");
    const data = await res.json();

    // eslint-disable-next-line @typescript-eslint/ban-ts-comment
    // @ts-ignore
    setLocalConvos((prev) => [data, ...prev]);

    onSetSelectedConvo(data);

    // eslint-disable-next-line @typescript-eslint/ban-ts-comment
    // @ts-ignore
    prevConvoId.current = data._id;

    return data;
  };

  const handleSend = async () => {
    if (!userInput.trim() || loading) return;
    setLoading(true);

    let createdNew = false;

    try {
      // capture & clear immediately
      const textToSend = userInput;
      setUserInput("");

      // append user message
      const newUserMsg: ChatMessage = { role: "user", text: textToSend };
      // eslint-disable-next-line @typescript-eslint/ban-ts-comment
      // @ts-ignore
      const updatedMessages = [...messages, newUserMsg];
      // eslint-disable-next-line @typescript-eslint/ban-ts-comment
      // @ts-ignore
      setMessages(updatedMessages);

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const body: any = { message: textToSend };
      if (isAuthed) {
        if (!selectedConvoId) {
          const newConv = await createNewConversation();
          createdNew = true;
          body.convoId = newConv._id;
        } else {
          body.convoId = selectedConvoId;
        }
      } else {
        body.history = updatedMessages;
      }

      const token = isAuthed ? Cookies.get("estatewise_token") : null;
      const res = await fetch(`${API_BASE_URL}/api/chat`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...(isAuthed && token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify(body),
      });

      if (!res.ok) {
        const errData = await res.json();
        throw new Error(errData.error || "Error sending message");
      }

      const data = await res.json();
      // eslint-disable-next-line @typescript-eslint/ban-ts-comment
      // @ts-ignore
      setMessages((prev) => [...prev, { role: "model", text: data.response }]);

      /* only refresh sidebar when we just made a new convo */
      if (isAuthed && createdNew) {
        const convRes = await fetch(`${API_BASE_URL}/api/conversations`, {
          headers: {
            Authorization: `Bearer ${Cookies.get("estatewise_token")}`,
          },
        });
        if (convRes.ok) {
          const convData = await convRes.json();
          setLocalConvos(convData);
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          const justMade = convData.find((cv: any) => cv._id === body.convoId);
          if (justMade) onSetSelectedConvo(justMade);
        }
      }
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
    } catch (err: any) {
      toast.error(err.message || "Failed to send message");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex flex-col h-full">
      <motion.div
        className="relative overflow-y-auto space-y-2 p-4 transition-none"
        style={{ height: "calc(100vh - 64px - 80px)" }}
        variants={containerVariants}
        initial="hidden"
        animate="visible"
      >
        {/* Spinner ONLY when switching conversations */}
        {convLoading && (
          <div className="absolute inset-0 z-20 flex items-center justify-center">
            <Loader2 className="animate-spin w-10 h-10" />
          </div>
        )}

        {/* eslint-disable-next-line @typescript-eslint/ban-ts-comment */}
        {/* @ts-ignore */}
        {messages.length === 0 && !loading && !convLoading && (
          <div className="flex flex-col items-center justify-center h-full text-center text-muted-foreground">
            <Home className="w-20 h-20 mb-4 text-primary" />
            <p className="text-xl font-semibold select-none">
              Hey {localStorage.getItem("username") || "there"}, send a message
              to start your home finding journey! 🚀
            </p>
          </div>
        )}

        <AnimatePresence>
          {!convLoading &&
            // eslint-disable-next-line @typescript-eslint/ban-ts-comment
            // @ts-ignore
            messages.map((msg, idx) => (
              <motion.div
                key={idx}
                variants={bubbleVariants}
                animate="visible"
                exit={{ opacity: 0, y: -10 }}
                className={`flex ${
                  msg.role === "user" ? "justify-end" : "justify-start"
                } mb-2`}
              >
                <div
                  className={`rounded-lg p-2 pb-0 shadow-lg hover:shadow-xl transition-shadow duration-300 ${
                    msg.role === "user"
                      ? "bg-primary text-primary-foreground"
                      : "bg-muted transition-none"
                  } max-w-xs sm:max-w-sm md:max-w-md lg:max-w-lg`}
                >
                  <ReactMarkdown
                    remarkPlugins={[remarkGfm]}
                    components={markdownComponents}
                  >
                    {msg.text}
                  </ReactMarkdown>
                </div>
              </motion.div>
            ))}
        </AnimatePresence>

        {loading && !convLoading && (
          <motion.div
            variants={bubbleVariants}
            initial="hidden"
            animate="visible"
            exit={{ opacity: 0, y: -10 }}
            className="flex justify-start mb-2"
          >
            <div className="bg-muted p-2 rounded-lg max-w-xs sm:max-w-sm md:max-w-md lg:max-w-lg shadow-lg flex items-center">
              <Loader2 className="animate-spin w-5 h-5 mr-1" />
              <span>Thinking</span>
              <AnimatedDots />
            </div>
          </motion.div>
        )}

        <div ref={scrollRef} />
      </motion.div>

      <div className="flex flex-col flex-shrink-0 h-20 p-4">
        <div className="flex gap-2">
          <Input
            placeholder="Type your message…"
            value={userInput}
            onChange={(e) => setUserInput(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                e.preventDefault();
                handleSend();
              }
            }}
            className="flex-1 cursor-text"
          />
          <Button
            onClick={handleSend}
            disabled={loading}
            className="flex items-center gap-1 cursor-pointer"
          >
            <Send className="h-4 w-4" />
            Send
          </Button>
        </div>
        <p className="text-center text-xs mt-1">
          By using this app, you agree to our{" "}
          <Link href="/terms" className="underline hover:text-gray-700">
            Terms of Service
          </Link>{" "}
          and{" "}
          <Link href="/privacy" className="underline hover:text-gray-700">
            Privacy Policy
          </Link>
          .
        </p>
      </div>
    </div>
  );
};

// ----------------------------------------------------------
// AnimatedDots Component (UNCHANGED)
// ----------------------------------------------------------
const AnimatedDots: React.FC = () => {
  const [dots, setDots] = useState("");
  useEffect(() => {
    const int = setInterval(
      () => setDots((d) => (d.length < 3 ? d + "." : "")),
      500,
    );
    return () => clearInterval(int);
  }, []);
  return <span>{dots}</span>;
};

// ----------------------------------------------------------
// Main ChatPage Layout: Sidebar + Top Bar + ChatWindow
// ----------------------------------------------------------
export default function ChatPage() {
  const isAuthed = !!Cookies.get("estatewise_token");
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const [conversations, setConversations] = useState<any[]>([]);
  const [conversationLoading, setConversationLoading] = useState(false);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const [selectedConvo, setSelectedConvo] = useState<any>(null);
  const [sidebarVisible, setSidebarVisible] = useState(false);

  // Persist sidebar state in local storage.
  useEffect(() => {
    const saved = localStorage.getItem("sidebarVisible");
    if (saved !== null) {
      setSidebarVisible(saved === "true");
    } else {
      const defaultVisible = window.innerWidth >= 768;
      setSidebarVisible(defaultVisible);
      localStorage.setItem("sidebarVisible", defaultVisible.toString());
    }
  }, []);

  const toggleSidebar = () => {
    setSidebarVisible((prev) => {
      const newState = !prev;
      localStorage.setItem("sidebarVisible", newState.toString());
      return newState;
    });
  };

  const refreshConvos = async () => {
    setConversationLoading(true);

    try {
      if (isAuthed) {
        const token = Cookies.get("estatewise_token");
        const res = await fetch(`${API_BASE_URL}/api/conversations`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (res.ok) {
          const data = await res.json();
          setConversations(data);
        } else {
          toast.error("Failed to load conversations");
        }
      } else {
        const local = localStorage.getItem("estateWiseConvos");
        if (local) setConversations(JSON.parse(local));
      }
    } catch (err) {
      console.error("Error fetching conversations:", err);
      toast.error("Error fetching conversations");
    } finally {
      setConversationLoading(false);
    }
  };

  useEffect(() => {
    refreshConvos();
  }, [isAuthed]);

  return (
    <>
      <Head>
        <title>EstateWise | Chat</title>
        <meta
          name="description"
          content="Chat with EstateWise for personalized property recommendations"
        />
      </Head>
      <ClientOnly>
        <div className="min-h-screen flex dark:bg-background dark:text-foreground relative">
          {/* Desktop sidebar and content container */}
          <div className="flex flex-1">
            {/* Sidebar (desktop only) */}
            <div className="hidden md:block">
              <motion.div
                className="overflow-hidden"
                variants={desktopSidebarVariants}
                animate={sidebarVisible ? "visible" : "hidden"}
                initial="visible"
              >
                <Sidebar
                  conversationLoading={conversationLoading}
                  conversations={conversations}
                  onSelect={(conv) => setSelectedConvo(conv)}
                  isAuthed={isAuthed}
                  refreshConvos={refreshConvos}
                  sidebarVisible={true}
                  toggleSidebar={toggleSidebar}
                  selectedConvoId={selectedConvo ? selectedConvo._id : null}
                />
              </motion.div>
            </div>
            {/* Main content */}
            <div className="flex-1 flex flex-col duration-600 ease-in-out">
              <TopBar
                onNewConvo={() => {
                  setSelectedConvo(null);
                  if (!isAuthed) localStorage.removeItem("estateWiseChat");
                }}
                toggleSidebar={toggleSidebar}
                sidebarVisible={sidebarVisible}
              />
              <ChatWindow
                isAuthed={isAuthed}
                localConvos={conversations}
                setLocalConvos={setConversations}
                selectedConvoId={selectedConvo ? selectedConvo._id : null}
                onSetSelectedConvo={setSelectedConvo}
              />
            </div>
          </div>
          {/* Mobile sidebar is handled inside the Sidebar component */}
          <div className="md:hidden">
            <Sidebar
              conversationLoading={conversationLoading}
              conversations={conversations}
              onSelect={(conv) => setSelectedConvo(conv)}
              isAuthed={isAuthed}
              refreshConvos={refreshConvos}
              sidebarVisible={sidebarVisible}
              toggleSidebar={toggleSidebar}
              selectedConvoId={selectedConvo ? selectedConvo._id : null}
            />
          </div>
        </div>
      </ClientOnly>
    </>
  );
}
