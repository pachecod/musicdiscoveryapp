"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { useEffect, useState } from "react";
import {
  RECENT_SEARCHES_STORAGE_KEY,
  addRecentSearch,
  clearRecentSearches,
  loadRecentSearches,
  patchRecentSearchCoverUrl,
  type RecentSearchEntry,
} from "@/lib/recent-searches-storage";

async function fetchYoutubeThumb(query: string): Promise<string | undefined> {
  try {
    const res = await fetch(`/api/youtube-thumb?q=${encodeURIComponent(query)}`);
    if (!res.ok) return undefined;
    const data = (await res.json()) as { thumbnailUrl?: string | null };
    const u = data.thumbnailUrl;
    return typeof u === "string" && u.trim() ? u.trim() : undefined;
  } catch {
    return undefined;
  }
}

/** Runs on every home visit: saves `?q=` + YouTube thumb to localStorage. Renders nothing while a search is active. */
export function RecentSearchHistory() {
  const searchParams = useSearchParams();
  const q = searchParams.get("q")?.trim() ?? "";

  useEffect(() => {
    if (!q) return;
    let cancelled = false;
    queueMicrotask(() => {
      addRecentSearch(q);
    });
    void (async () => {
      const thumb = await fetchYoutubeThumb(q);
      if (cancelled || !thumb) return;
      patchRecentSearchCoverUrl(q, thumb);
    })();
    return () => {
      cancelled = true;
    };
  }, [q]);

  if (q) return null;

  return <RecentSearchTilesPanel />;
}

function RecentSearchTilesPanel() {
  const [items, setItems] = useState<RecentSearchEntry[]>([]);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    queueMicrotask(() => {
      setItems(loadRecentSearches());
      setReady(true);
    });
  }, []);

  useEffect(() => {
    const onStorage = (e: StorageEvent) => {
      if (e.key !== RECENT_SEARCHES_STORAGE_KEY) return;
      setItems(loadRecentSearches());
    };
    window.addEventListener("storage", onStorage);
    return () => window.removeEventListener("storage", onStorage);
  }, []);

  useEffect(() => {
    if (!ready) return;
    let cancelled = false;
    void (async () => {
      const initial = loadRecentSearches();
      const missing = initial.filter((e) => !e.coverUrl);
      for (const e of missing) {
        if (cancelled) break;
        const thumb = await fetchYoutubeThumb(e.query);
        if (cancelled || !thumb) continue;
        const next = patchRecentSearchCoverUrl(e.query, thumb);
        setItems(next);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [ready]);

  return (
    <section className="space-y-4">
      <div className="flex flex-wrap items-end justify-between gap-2">
        <div>
          <h2 className="font-mono text-xs tracking-[0.2em] text-[#7a7165] uppercase">
            Your searches
          </h2>
          <p className="mt-1 text-xs text-[#6b6459]">
            Stored in this browser only — tap a tile to run that search again.
          </p>
        </div>
        {ready && items.length > 0 && (
          <button
            type="button"
            onClick={() => {
              clearRecentSearches();
              setItems([]);
            }}
            className="text-xs text-[#7a7165] underline decoration-[#5c4d3a] underline-offset-4 hover:text-[#c4a574]"
          >
            Clear
          </button>
        )}
      </div>
      {!ready ? (
        <div
          className="h-10 max-w-xs animate-pulse rounded-lg bg-[#141210]/60 sm:h-11"
          aria-hidden
        />
      ) : items.length === 0 ? (
        <p className="text-sm text-[#a8a095]">
          Search for an artist, pick one from the list, then come back here — your queries show up as
          tiles below the search box.
        </p>
      ) : (
        <ul className="grid w-full grid-cols-2 gap-2 sm:grid-cols-4 sm:gap-3">
          {items.map((e) => (
            <li key={e.query} className="min-w-0">
              <Link
                href={`/?q=${encodeURIComponent(e.query)}`}
                className={`relative flex aspect-square w-full flex-col overflow-hidden rounded-lg border text-center transition hover:border-[#c4a574]/45 sm:rounded-xl ${
                  e.coverUrl
                    ? "border-[#2a2620] bg-[#141210]"
                    : "items-center justify-center gap-1 border-[#2a2620] bg-[#141210]/90 p-1.5 hover:bg-[#1c1914] sm:gap-1.5 sm:p-2.5"
                }`}
              >
                {e.coverUrl ? (
                  <>
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={e.coverUrl}
                      alt=""
                      className="absolute inset-0 h-full w-full object-cover"
                    />
                    <div
                      className="absolute inset-0 bg-gradient-to-t from-[#0c0b09]/95 via-[#0c0b09]/35 to-transparent"
                      aria-hidden
                    />
                    <div className="relative z-10 mt-auto flex w-full flex-col gap-0.5 p-1.5 text-left sm:p-2">
                      <span className="line-clamp-2 text-[10px] font-semibold leading-tight text-[#fff8ef] drop-shadow-md sm:text-xs">
                        {e.query}
                      </span>
                    </div>
                  </>
                ) : (
                  <>
                    <span
                      className="font-[family-name:var(--font-fraunces)] text-2xl leading-none text-[#c4a574] sm:text-3xl md:text-4xl"
                      aria-hidden
                    >
                      {e.query.slice(0, 1).toUpperCase()}
                    </span>
                    <span className="line-clamp-3 w-full text-[10px] font-medium leading-tight text-[#fff8ef] sm:text-xs md:text-sm">
                      {e.query}
                    </span>
                  </>
                )}
              </Link>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
