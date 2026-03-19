import { readFile } from "fs/promises";
import path from "path";

const STORE_PATH = path.join(process.cwd(), "data", "recent-artists.json");
export const SAMPLE_ARTISTS_GRID_LIMIT = 16;

export type SampleArtistRecord = {
  mbid: string;
  name: string;
  disambiguation?: string;
  viewedAt: number;
  coverUrl?: string;
};

type StoreFile = { items: SampleArtistRecord[] };

async function readStore(): Promise<SampleArtistRecord[]> {
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

/** Curated demo tiles from `data/recent-artists.json` (git only — not updated when users open artists). */
export async function getSampleArtists(limit = SAMPLE_ARTISTS_GRID_LIMIT): Promise<SampleArtistRecord[]> {
  const items = await readStore();
  const seen = new Set<string>();
  const out: SampleArtistRecord[] = [];
  for (const r of items) {
    const id = r.mbid.toLowerCase();
    if (seen.has(id)) continue;
    seen.add(id);
    out.push(r);
    if (out.length >= limit) break;
  }
  return out;
}
