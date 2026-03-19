const MB_HEADERS = {
  Accept: "application/json",
  "User-Agent": "DiscoverMusic/1.0 (local dev; contact@example.invalid)",
};

export type MbArtistSearchHit = {
  id: string;
  name: string;
  score?: number;
  disambiguation?: string;
};

export type MbArtistDetail = {
  id: string;
  name: string;
  disambiguation?: string;
  relations?: Array<{
    type: string;
    url?: { resource: string };
  }>;
};

export async function searchMbArtists(
  query: string,
  limit = 20
): Promise<MbArtistSearchHit[]> {
  const q = query.trim();
  if (!q) return [];

  const url = new URL("https://musicbrainz.org/ws/2/artist");
  url.searchParams.set("query", q);
  url.searchParams.set("fmt", "json");
  url.searchParams.set("limit", String(limit));

  const res = await fetch(url.toString(), { headers: MB_HEADERS, next: { revalidate: 300 } });
  if (!res.ok) return [];

  const data = (await res.json()) as { artists?: MbArtistSearchHit[] };
  return data.artists ?? [];
}

export async function getMbArtist(mbid: string): Promise<MbArtistDetail | null> {
  const url = new URL(`https://musicbrainz.org/ws/2/artist/${encodeURIComponent(mbid)}`);
  url.searchParams.set("inc", "url-rels");
  url.searchParams.set("fmt", "json");

  const res = await fetch(url.toString(), { headers: MB_HEADERS, next: { revalidate: 600 } });
  if (res.status === 404) return null;
  if (!res.ok) return null;

  return (await res.json()) as MbArtistDetail;
}
