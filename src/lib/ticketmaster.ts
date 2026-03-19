import { getTicketmasterApiKey } from "./env";

/** Music segment (Ticketmaster Discovery API). */
const MUSIC_SEGMENT_ID = "KZFzniwnSyZfZ7v7nJ";

export type ConcertEvent = {
  id: string;
  name: string;
  url: string;
  dateLabel: string;
  venueName: string;
  lat: number;
  lng: number;
};

export type TicketmasterSearchOutcome = {
  events: ConcertEvent[];
  error?: string;
};

type TmVenue = {
  name?: string;
  location?: { longitude?: string; latitude?: string };
};

type TmEventRaw = {
  id: string;
  name: string;
  url: string;
  dates?: { start?: { localDate?: string; dateTime?: string } };
  _embedded?: { venues?: TmVenue[] };
};

function parseTmError(body: unknown): string {
  if (!body || typeof body !== "object") return "Unknown error";
  const o = body as {
    errors?: { detail?: string; status?: string }[];
    fault?: { faultstring?: string };
  };
  const d = o.errors?.[0]?.detail;
  if (d) return d;
  if (o.fault?.faultstring) return o.fault.faultstring;
  return "Ticketmaster API error";
}

export async function searchTicketmasterConcerts(
  artistKeyword: string,
  limit = 40
): Promise<TicketmasterSearchOutcome> {
  const apikey = getTicketmasterApiKey();
  if (!apikey) return { events: [] };

  const kw = artistKeyword.trim();
  if (!kw) return { events: [] };

  const startDateTime = new Date().toISOString().replace(/\.\d{3}Z$/, "Z");

  const url = new URL("https://app.ticketmaster.com/discovery/v2/events.json");
  url.searchParams.set("apikey", apikey);
  url.searchParams.set("keyword", kw);
  url.searchParams.set("segmentId", MUSIC_SEGMENT_ID);
  url.searchParams.set("startDateTime", startDateTime);
  url.searchParams.set("sort", "date,asc");
  url.searchParams.set("size", String(Math.min(limit, 200)));

  const res = await fetch(url.toString(), { next: { revalidate: 600 } });

  let body: unknown;
  try {
    body = await res.json();
  } catch {
    return { events: [], error: `Ticketmaster: HTTP ${res.status} (invalid JSON)` };
  }

  if (!res.ok) {
    return { events: [], error: `Ticketmaster: ${parseTmError(body)}` };
  }

  const data = body as { _embedded?: { events?: TmEventRaw[] }; page?: { totalElements?: number } };
  const raw = data._embedded?.events ?? [];

  const events: ConcertEvent[] = [];
  const jitterCount = new Map<string, number>();

  for (const e of raw) {
    const venue = e._embedded?.venues?.[0];
    if (!venue?.location?.latitude || !venue?.location?.longitude) continue;

    const lat0 = Number.parseFloat(venue.location.latitude);
    const lng0 = Number.parseFloat(venue.location.longitude);
    if (!Number.isFinite(lat0) || !Number.isFinite(lng0)) continue;

    const key = `${lat0.toFixed(4)},${lng0.toFixed(4)}`;
    const n = jitterCount.get(key) ?? 0;
    jitterCount.set(key, n + 1);
    const lat = lat0 + n * 0.00025;
    const lng = lng0 + n * 0.00025;

    const dateLabel =
      e.dates?.start?.localDate ??
      (e.dates?.start?.dateTime
        ? e.dates.start.dateTime.slice(0, 10)
        : "Date TBA");

    events.push({
      id: e.id,
      name: e.name,
      url: e.url,
      dateLabel,
      venueName: venue.name ?? "Venue",
      lat,
      lng,
    });
  }

  return { events };
}
