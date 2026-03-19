# Music Mambo — music & video

Next.js app that searches **MusicBrainz** artists and opens a detail page with **YouTube** embeds, an English **Wikipedia** lead section (resolved with **Wikidata Query Service** using MusicBrainz ID [P434](https://www.wikidata.org/wiki/Property:P434)), and an **upcoming concerts** map from the **Ticketmaster Discovery API** (map tiles: **OpenStreetMap** via Leaflet — no map API key).

## Setup

```bash
cp .env.example .env.local
```

| Variable | Role |
|----------|------|
| `YOUTUBE_API_KEY` | [YouTube Data API v3](https://developers.google.com/youtube/v3) |
| `TICKETMASTER_CONSUMER_KEY` | [Ticketmaster Developer](https://developer.ticketmaster.com/) — your app’s **consumer key** (same value the docs call the API key for `?apikey=`). Alias: `TICKETMASTER_API_KEY`. |
| `TICKETMASTER_CONSUMER_SECRET` | Optional in `.env.local` for your records. **Not used** by this app: Discovery event search is a GET with `apikey` only; the secret is for other OAuth-style Ticketmaster APIs. |

**Wikipedia + Wikidata** — no API key. The app runs a [Wikidata SPARQL](https://query.wikidata.org/) lookup on property **P434** (MusicBrainz artist id), then loads the English article via the [Wikipedia REST summary](https://en.wikipedia.org/api/rest_v1/) API. Not every artist has a linked article; disambiguation pages are skipped.

MusicBrainz needs no key; set a real app name/contact in `src/lib/musicbrainz.ts` `User-Agent` per [MusicBrainz](https://musicbrainz.org/doc/MusicBrainz_API/Rate_Limiting).

### YouTube shows no videos but the key is set

This app calls the YouTube API from the **server**. In Google Cloud → **Credentials** → your API key: avoid **HTTP referrer** restrictions for local/server use; use **None** or **IP**. Allow **YouTube Data API v3**.

## Run

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000), search an artist, open a result.

**Your searches** (home page) are saved in **`localStorage`** (up to 16 queries, deduped), with **YouTube thumbnails** from `GET /api/youtube-thumb?q=` (needs `YOUTUBE_API_KEY`). That grid only shows on **`/` without `?q=`**; with an active search you get the **MusicBrainz list** only. Opening an artist page does **not** add them to any server-side list — only your search strings are remembered, in the browser.

**Sample artists** (second grid on `/`) are **read-only** from `data/recent-artists.json`: edit the file in git and deploy to change the curated demo tiles. Nothing in the app writes to that file at runtime.

## API routes

- `GET /api/search?q=` — MusicBrainz artist search (JSON).
- `GET /api/youtube-thumb?q=` — First YouTube search hit thumbnail URL (JSON `{ thumbnailUrl }`).
- `GET /api/artist/[mbid]` — Aggregated artist payload (JSON).
