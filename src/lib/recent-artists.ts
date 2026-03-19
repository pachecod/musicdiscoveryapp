import { mkdir, readFile, writeFile } from "fs/promises";
import path from "path";

const DATA_DIR = path.join(process.cwd(), "data");
const STORE_PATH = path.join(DATA_DIR, "recent-artists.json");
const MAX_STORED = 48;
export const RECENT_GRID_LIMIT = 16;

export type RecentArtistRecord = {
  mbid: string;
  name: string;
  disambiguation?: string;
  viewedAt: number;
  /** Top YouTube search result thumbnail (same source as the artist page hero when YouTube wins). */
  coverUrl?: string;
};

type StoreFile = { items: RecentArtistRecord[] };

let writeChain: Promise<void> = Promise.resolve();

function enqueueWrite(task: () => Promise<void>): Promise<void> {
  writeChain = writeChain.then(task).catch(() => {});
  return writeChain;
}

async function readStore(): Promise<RecentArtistRecord[]> {
  try {
    const raw = await readFile(STORE_PATH, "utf-8");
    const parsed = JSON.parse(raw) as StoreFile;
    if (!Array.isArray(parsed.items)) return [];
    return parsed.items.filter(
      (r) =>
        r &&
        typeof r.mbid === "string" &&
        typeof r.name === "string" &&
        typeof r.viewedAt === "number" &&
        (r.coverUrl === undefined || typeof r.coverUrl === "string")
    );
  } catch {
    return [];
  }
}

async function writeStore(items: RecentArtistRecord[]): Promise<void> {
  await mkdir(DATA_DIR, { recursive: true });
  const payload: StoreFile = { items };
  await writeFile(STORE_PATH, JSON.stringify(payload, null, 2), "utf-8");
}

/** Newest-first unique artists (by mbid), capped for the home grid. */
export async function getRecentArtists(limit = RECENT_GRID_LIMIT): Promise<RecentArtistRecord[]> {
  const items = await readStore();
  const seen = new Set<string>();
  const out: RecentArtistRecord[] = [];
  for (const r of items) {
    const id = r.mbid.toLowerCase();
    if (seen.has(id)) continue;
    seen.add(id);
    out.push(r);
    if (out.length >= limit) break;
  }
  return out;
}

/**
 * Call when an artist page loads successfully. Shared across all visitors
 * (local `data/recent-artists.json`; on serverless hosts without a shared disk,
 * use external storage instead).
 */
export async function recordRecentArtist(entry: {
  mbid: string;
  name: string;
  disambiguation?: string;
  coverUrl?: string | null;
}): Promise<void> {
  const mbid = entry.mbid.trim();
  const name = entry.name.trim();
  if (!mbid || !name) return;

  await enqueueWrite(async () => {
    const items = await readStore();
    const filtered = items.filter((r) => r.mbid.toLowerCase() !== mbid.toLowerCase());
    const coverUrl = entry.coverUrl?.trim() || undefined;
    filtered.unshift({
      mbid,
      name,
      disambiguation: entry.disambiguation?.trim() || undefined,
      viewedAt: Date.now(),
      coverUrl,
    });
    await writeStore(filtered.slice(0, MAX_STORED));
  });
}
