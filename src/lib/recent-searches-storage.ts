export const LOCAL_RECENT_SEARCH_LIMIT = 16;

export const RECENT_SEARCHES_STORAGE_KEY = "musicdiscovery:v1:recent-searches";

export type RecentSearchEntry = {
  query: string;
  searchedAt: number;
  /** Top YouTube search hit thumbnail (same idea as artist tiles). */
  coverUrl?: string;
};

type StoredShape = { items: RecentSearchEntry[] };

function parseStored(raw: string | null): RecentSearchEntry[] {
  if (!raw) return [];
  try {
    const j = JSON.parse(raw) as StoredShape;
    if (!j || !Array.isArray(j.items)) return [];
    return j.items.filter(
      (r) =>
        r &&
        typeof r.query === "string" &&
        r.query.trim().length > 0 &&
        typeof r.searchedAt === "number" &&
        (r.coverUrl === undefined || typeof r.coverUrl === "string")
    );
  } catch {
    return [];
  }
}

export function loadRecentSearches(): RecentSearchEntry[] {
  if (typeof window === "undefined") return [];
  try {
    return parseStored(localStorage.getItem(RECENT_SEARCHES_STORAGE_KEY));
  } catch {
    return [];
  }
}

/**
 * Newest-first unique queries (case-insensitive), capped.
 * `coverUrl` from the latest fetch wins; if omitted on a repeat search, keeps the previous cover for that query.
 */
export function addRecentSearch(query: string, coverUrl?: string | null): RecentSearchEntry[] {
  if (typeof window === "undefined") return [];
  const q = query.trim();
  if (!q) return loadRecentSearches();

  const prev = loadRecentSearches();
  const key = q.toLowerCase();
  const prevMatch = prev.find((e) => e.query.trim().toLowerCase() === key);
  const filtered = prev.filter((e) => e.query.trim().toLowerCase() !== key);
  const thumb =
    coverUrl != null && String(coverUrl).trim()
      ? String(coverUrl).trim()
      : prevMatch?.coverUrl;

  const entry: RecentSearchEntry = {
    query: q,
    searchedAt: Date.now(),
    ...(thumb ? { coverUrl: thumb } : {}),
  };
  const next: RecentSearchEntry[] = [entry, ...filtered].slice(0, LOCAL_RECENT_SEARCH_LIMIT);

  try {
    localStorage.setItem(RECENT_SEARCHES_STORAGE_KEY, JSON.stringify({ items: next }));
  } catch {
    /* quota / private mode */
  }
  return next;
}

/** Attach a YouTube thumbnail to an existing entry (e.g. backfill). */
export function patchRecentSearchCoverUrl(query: string, coverUrl: string): RecentSearchEntry[] {
  if (typeof window === "undefined") return [];
  const q = query.trim().toLowerCase();
  const url = coverUrl.trim();
  if (!q || !url) return loadRecentSearches();

  const prev = loadRecentSearches();
  const next = prev.map((e) =>
    e.query.trim().toLowerCase() === q ? { ...e, coverUrl: url } : e
  );

  try {
    localStorage.setItem(RECENT_SEARCHES_STORAGE_KEY, JSON.stringify({ items: next }));
  } catch {
    /* ignore */
  }
  return next;
}

export function clearRecentSearches(): void {
  if (typeof window === "undefined") return;
  try {
    localStorage.removeItem(RECENT_SEARCHES_STORAGE_KEY);
  } catch {
    /* ignore */
  }
}
