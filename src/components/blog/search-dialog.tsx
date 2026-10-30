"use client";

import { useEffect, useState, useRef, useCallback, useTransition } from "react";
import { useRouter } from "next/navigation";
import { useLocale } from "@/i18n/locale-provider";
import {
  searchWithPagefind,
  getPagefind,
  type PagefindResultData,
} from "@/lib/pagefind";
import {
  Search,
  SearchX,
  X,
  Loader2,
  CornerDownLeft,
  ArrowUpDown,
  FileText,
  Hash,
  AlertCircle,
} from "lucide-react";

const SEARCH_EVENT = "srp:open-search";

export function openSearch() {
  if (typeof window === "undefined") return;
  window.dispatchEvent(new CustomEvent(SEARCH_EVENT));
}

export function SearchDialog() {
  const { t } = useLocale();
  const router = useRouter();
  const [, startTransition] = useTransition();

  const [isOpen, setIsOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<PagefindResultData[]>([]);
  const [totalCount, setTotalCount] = useState(0);
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [isLoading, setIsLoading] = useState(false);
  const [isEngineReady, setIsEngineReady] = useState(true);

  const inputRef = useRef<HTMLInputElement>(null);
  const resultsContainerRef = useRef<HTMLDivElement>(null);

  // Open modal handler
  const handleOpen = useCallback(() => {
    setIsOpen(true);
    setSelectedIndex(0);
    // Auto check if Pagefind is reachable
    getPagefind().then((pf) => {
      setIsEngineReady(!!pf);
    });
  }, []);

  const handleClose = useCallback(() => {
    setIsOpen(false);
    setQuery("");
    setResults([]);
    setSelectedIndex(0);
  }, []);

  // Global event listener for `srp:open-search`
  useEffect(() => {
    window.addEventListener(SEARCH_EVENT, handleOpen);
    return () => window.removeEventListener(SEARCH_EVENT, handleOpen);
  }, [handleOpen]);

  // Global keyboard shortcuts (Cmd+K / Ctrl+K / '/' / Escape)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        if (isOpen) {
          handleClose();
        } else {
          handleOpen();
        }
        return;
      }

      if (e.key === "Escape" && isOpen) {
        e.preventDefault();
        handleClose();
        return;
      }

      // Quick slash trigger when not focusing input
      if (
        e.key === "/" &&
        !isOpen &&
        !(e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement)
      ) {
        e.preventDefault();
        handleOpen();
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, handleOpen, handleClose]);

  // Lock body scroll when modal is open
  useEffect(() => {
    if (!isOpen) return;
    const originalOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    // Auto focus search input
    setTimeout(() => {
      inputRef.current?.focus();
    }, 50);

    return () => {
      document.body.style.overflow = originalOverflow;
    };
  }, [isOpen]);

  // Search execution with debounce
  useEffect(() => {
    const trimmed = query.trim();
    if (!trimmed) {
      setResults([]);
      setTotalCount(0);
      setIsLoading(false);
      return;
    }

    setIsLoading(true);
    const timer = setTimeout(async () => {
      const response = await searchWithPagefind(trimmed, 12);
      if (response) {
        setResults(response.results);
        setTotalCount(response.total);
        setIsEngineReady(true);
      } else {
        setResults([]);
        setTotalCount(0);
        setIsEngineReady(false);
      }
      setSelectedIndex(0);
      setIsLoading(false);
    }, 150);

    return () => clearTimeout(timer);
  }, [query]);

  // Keyboard navigation across results
  const handleInputKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "ArrowDown") {
      e.preventDefault();
      if (results.length > 0) {
        setSelectedIndex((prev) => (prev + 1) % results.length);
      }
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      if (results.length > 0) {
        setSelectedIndex((prev) => (prev - 1 + results.length) % results.length);
      }
    } else if (e.key === "Enter") {
      e.preventDefault();
      const current = results[selectedIndex];
      if (current) {
        handleNavigate(current.url);
      }
    }
  };

  // Scroll active item into view
  useEffect(() => {
    if (!resultsContainerRef.current) return;
    const activeEl = resultsContainerRef.current.querySelector<HTMLElement>(
      `[data-result-index="${selectedIndex}"]`
    );
    if (activeEl) {
      activeEl.scrollIntoView({ block: "nearest", behavior: "smooth" });
    }
  }, [selectedIndex]);

  // Navigate to post
  const handleNavigate = (url: string) => {
    handleClose();
    startTransition(() => {
      router.push(url);
    });
  };

  if (!isOpen) return null;

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label={t.common.search}
      className="fixed inset-0 z-[100] flex items-start justify-center p-3 sm:p-6 md:pt-20 bg-background/80 backdrop-blur-md transition-opacity duration-200"
      onClick={(e) => {
        if (e.target === e.currentTarget) handleClose();
      }}
    >
      <div className="relative w-full max-w-2xl overflow-hidden rounded-2xl border border-border/80 bg-card text-card-foreground shadow-2xl animate-in fade-in zoom-in-95 duration-150">
        {/* Header / Input bar */}
        <div className="relative flex items-center border-b border-border/60 px-4">
          <Search className="h-5 w-5 shrink-0 text-muted-foreground mr-3" />
          <input
            ref={inputRef}
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={handleInputKeyDown}
            placeholder={t.search.placeholder}
            className="h-14 w-full bg-transparent text-base text-foreground placeholder:text-muted-foreground/70 focus:outline-none"
            aria-autocomplete="list"
          />

          <div className="flex items-center gap-1.5 shrink-0 ml-2">
            {isLoading ? (
              <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
            ) : query ? (
              <button
                type="button"
                onClick={() => setQuery("")}
                className="p-1 rounded text-muted-foreground hover:text-foreground transition-colors"
                aria-label={t.search.clear}
              >
                <X className="h-4 w-4" />
              </button>
            ) : null}

            <kbd className="hidden sm:inline-flex h-5 items-center gap-1 rounded border border-border bg-muted/60 px-1.5 font-mono text-[10px] font-medium text-muted-foreground select-none">
              ESC
            </kbd>
          </div>
        </div>

        {/* Dev warning if Pagefind index is unavailable */}
        {!isEngineReady && (
          <div className="flex items-start gap-2.5 px-4 py-3 bg-amber-500/10 border-b border-amber-500/20 text-amber-600 dark:text-amber-400 text-xs">
            <AlertCircle className="h-4 w-4 shrink-0 mt-0.5" />
            <p>{t.search.devNotice}</p>
          </div>
        )}

        {/* Results / List Stage */}
        <div
          ref={resultsContainerRef}
          className="max-h-[60vh] overflow-y-auto p-2 space-y-1 divide-y divide-border/20"
        >
          {query.trim() === "" ? (
            <div className="py-12 text-center text-muted-foreground space-y-2">
              <Search className="mx-auto h-8 w-8 opacity-30 stroke-[1.5]" />
              <p className="text-sm font-medium">{t.search.hint}</p>
              <p className="text-xs text-muted-foreground/80 max-w-sm mx-auto px-4">
                {t.search.tip}
              </p>
            </div>
          ) : results.length === 0 && !isLoading ? (
            <div className="py-12 text-center text-muted-foreground space-y-2">
              <SearchX className="mx-auto h-8 w-8 opacity-30 stroke-[1.5]" />
              <p className="text-sm font-medium">
                {t.search.empty}: <span className="text-foreground">“{query}”</span>
              </p>
              <p className="text-xs text-muted-foreground/80">{t.search.tip}</p>
            </div>
          ) : (
            results.map((item, idx) => {
              const isSelected = idx === selectedIndex;
              const title = item.meta.title || item.url;
              return (
                <div
                  key={item.url + idx}
                  data-result-index={idx}
                  onMouseEnter={() => setSelectedIndex(idx)}
                  onClick={() => handleNavigate(item.url)}
                  role="option"
                  aria-selected={isSelected}
                  className={`group relative flex flex-col gap-1 rounded-xl p-3 cursor-pointer transition-colors ${
                    isSelected
                      ? "bg-muted text-foreground"
                      : "text-muted-foreground hover:bg-muted/50 hover:text-foreground"
                  }`}
                >
                  {/* Article Title & Anchor */}
                  <div className="flex items-center justify-between gap-2">
                    <div className="flex items-center gap-2 min-w-0 font-medium text-sm text-foreground">
                      <FileText className="h-4 w-4 shrink-0 text-primary opacity-80" />
                      <span className="truncate">{title}</span>
                    </div>

                    <span className="shrink-0 text-xs font-mono opacity-50 group-hover:opacity-100 transition-opacity">
                      {isSelected && <CornerDownLeft className="h-3 w-3 inline mr-1 text-primary" />}
                    </span>
                  </div>

                  {/* Context Highlighting Snippet */}
                  {item.excerpt && (
                    <div
                      className="text-xs text-muted-foreground/90 line-clamp-2 leading-relaxed pl-6 [&_mark]:bg-primary/20 [&_mark]:text-primary [&_mark]:px-1 [&_mark]:py-0.5 [&_mark]:rounded-sm [&_mark]:font-semibold"
                      dangerouslySetInnerHTML={{ __html: item.excerpt }}
                    />
                  )}

                  {/* Sub-results (Headings) if present */}
                  {item.sub_results && item.sub_results.length > 0 && (
                    <div className="mt-1 flex flex-wrap gap-1.5 pl-6 pt-1 border-t border-border/40">
                      {item.sub_results.slice(0, 3).map((sub, subIdx) => (
                        <span
                          key={sub.url + subIdx}
                          onClick={(e) => {
                            e.stopPropagation();
                            handleNavigate(sub.url);
                          }}
                          className="inline-flex items-center gap-1 text-[11px] rounded-md px-2 py-0.5 bg-background/80 hover:bg-background text-foreground/80 hover:text-primary transition-colors border border-border/60"
                        >
                          <Hash className="h-3 w-3 text-muted-foreground" />
                          <span className="truncate max-w-[140px]">{sub.title}</span>
                        </span>
                      ))}
                    </div>
                  )}
                </div>
              );
            })
          )}
        </div>

        {/* Footer info & shortcut cues */}
        <div className="flex items-center justify-between border-t border-border/60 px-4 py-2.5 bg-muted/30 text-[11px] text-muted-foreground">
          <div className="flex items-center gap-3">
            <span className="inline-flex items-center gap-1">
              <ArrowUpDown className="h-3 w-3" />
              <span>{t.search.keyboardNavigate}</span>
            </span>
            <span className="inline-flex items-center gap-1">
              <kbd className="rounded border border-border bg-card px-1 font-mono text-[10px]">↵</kbd>
              <span>{t.search.keyboardOpen}</span>
            </span>
            <span className="inline-flex items-center gap-1">
              <kbd className="rounded border border-border bg-card px-1 font-mono text-[10px]">esc</kbd>
              <span>{t.search.keyboardClose}</span>
            </span>
          </div>

          <div className="font-mono text-[11px]">
            {totalCount > 0 ? (
              <span>
                {t.search.found.replace("{count}", String(totalCount))}
              </span>
            ) : (
              <span className="opacity-70">Pagefind</span>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
