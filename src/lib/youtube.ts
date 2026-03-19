import { getYoutubeApiKey } from "./env";

export type YoutubeVideoHit = {
  videoId: string;
  title: string;
  channelTitle: string;
  thumbnailUrl: string;
  publishedAt: string;
};

export type YoutubeSearchOutcome = {
  hits: YoutubeVideoHit[];
  /** Present when the API call failed or returned an error payload. */
  error?: string;
};

function parseYoutubeApiError(body: unknown): string {
  if (!body || typeof body !== "object") return "Unknown error";
  const o = body as { error?: { message?: string; errors?: { reason?: string }[] } };
  const reason = o.error?.errors?.[0]?.reason;
  const msg = o.error?.message;
  if (reason && msg) return `${reason}: ${msg}`;
  if (msg) return msg;
  if (reason) return reason;
  return "YouTube API error";
}

export async function searchYoutubeVideos(
  query: string,
  maxResults = 12
): Promise<YoutubeSearchOutcome> {
  const key = getYoutubeApiKey();
  if (!key) return { hits: [] };

  const q = `${query.trim()} music`.trim();
  const url = new URL("https://www.googleapis.com/youtube/v3/search");
  url.searchParams.set("part", "snippet");
  url.searchParams.set("type", "video");
  url.searchParams.set("maxResults", String(maxResults));
  url.searchParams.set("q", q);
  url.searchParams.set("key", key);

  const res = await fetch(url.toString(), { next: { revalidate: 300 } });

  let body: unknown;
  try {
    body = await res.json();
  } catch {
    return { hits: [], error: `YouTube: HTTP ${res.status} (invalid JSON)` };
  }

  if (!res.ok) {
    return { hits: [], error: `YouTube: ${parseYoutubeApiError(body)}` };
  }

  const data = body as {
    items?: Array<{
      id?: { videoId?: string };
      snippet?: {
        title?: string;
        channelTitle?: string;
        publishedAt?: string;
        thumbnails?: { medium?: { url?: string }; default?: { url?: string } };
      };
    }>;
    pageInfo?: { totalResults?: number };
  };

  const out: YoutubeVideoHit[] = [];
  for (const item of data.items ?? []) {
    const id = item.id?.videoId;
    if (!id || !item.snippet) continue;
    const thumb =
      item.snippet.thumbnails?.medium?.url ??
      item.snippet.thumbnails?.default?.url ??
      "";
    out.push({
      videoId: id,
      title: item.snippet.title ?? "Video",
      channelTitle: item.snippet.channelTitle ?? "",
      thumbnailUrl: thumb,
      publishedAt: item.snippet.publishedAt ?? "",
    });
  }

  return { hits: out };
}
