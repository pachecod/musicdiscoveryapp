import Link from "next/link";
import { Suspense } from "react";
import { RecentSearchHistory } from "@/components/RecentSearchTiles";
import {
  SAMPLE_ARTISTS_GRID_LIMIT,
  getSampleArtists,
  type SampleArtistRecord,
} from "@/lib/recent-artists";
import { searchMbArtists } from "@/lib/musicbrainz";

type Props = { searchParams: Promise<{ q?: string }> };

export const dynamic = "force-dynamic";

export default async function Home({ searchParams }: Props) {
  const q = (await searchParams).q?.trim() ?? "";

  const [artists, sampleArtists] = await Promise.all([
    q ? searchMbArtists(q, 24) : Promise.resolve([]),
    getSampleArtists(SAMPLE_ARTISTS_GRID_LIMIT),
  ]);

  const sampleSlots: (SampleArtistRecord | null)[] = [...sampleArtists];
  while (sampleSlots.length < SAMPLE_ARTISTS_GRID_LIMIT) sampleSlots.push(null);

  return (
    <div className="min-h-full bg-[#0c0b09] text-[#f4f0e6]">
      <div className="mx-auto flex min-h-full w-full max-w-5xl flex-col gap-10 px-5 py-14">
        <header className="space-y-4">
          <h1 className="font-[family-name:var(--font-fraunces)] text-xl font-medium text-[#c4a574] sm:text-2xl">
            Find artists, tracks, and videos
          </h1>
          <p className="max-w-xl text-sm leading-relaxed text-[#a8a095]">
            Search uses{" "}
            <a
              className="text-[#e8d4b0] underline decoration-[#5c4d3a] underline-offset-4 hover:decoration-[#c4a574]"
              href="https://musicbrainz.org/doc/MusicBrainz_API"
              target="_blank"
              rel="noreferrer"
            >
              MusicBrainz
            </a>
            . Open an artist for YouTube, a Wikipedia summary (via Wikidata), and a Ticketmaster concert
            map (API keys only where noted).
          </p>
        </header>

        <form action="/" method="get" className="flex flex-col gap-3 sm:flex-row sm:items-center">
          <label className="sr-only" htmlFor="q">
            Search artists
          </label>
          <input
            id="q"
            name="q"
            type="search"
            defaultValue={q}
            placeholder="Artist name…"
            className="w-full rounded-xl border border-[#2a2620] bg-[#141210] px-4 py-3 text-[#f4f0e6] placeholder:text-[#6b6459] outline-none ring-[#c4a574]/40 focus:ring-2"
            autoComplete="off"
          />
          <button
            type="submit"
            className="shrink-0 rounded-xl bg-[#c4a574] px-6 py-3 text-sm font-medium text-[#1a1510] transition hover:bg-[#d4b584]"
          >
            Search
          </button>
        </form>

        {q && (
          <section className="space-y-4">
            <h2 className="font-mono text-xs tracking-widest text-[#7a7165] uppercase">
              Results for “{q}”
            </h2>
            <p className="text-xs text-[#6b6459]">
              Choose an artist to open their page. Tiles for your past searches appear when you return
              to the home page without a search.
            </p>
            {artists.length === 0 ? (
              <p className="text-sm text-[#a8a095]">No artists matched. Try another spelling.</p>
            ) : (
              <ul className="divide-y divide-[#2a2620] rounded-2xl border border-[#2a2620] bg-[#141210]/80">
                {artists.map((a) => (
                  <li key={a.id}>
                    <Link
                      href={`/artist/${a.id}`}
                      className="flex flex-col gap-0.5 px-4 py-4 transition hover:bg-[#1c1914] sm:flex-row sm:items-baseline sm:justify-between"
                    >
                      <span className="text-base font-medium text-[#fff8ef]">{a.name}</span>
                      <span className="text-xs text-[#7a7165]">
                        {a.disambiguation ? `${a.disambiguation}` : "MusicBrainz artist"}
                        {typeof a.score === "number" ? ` · score ${a.score}` : ""}
                      </span>
                    </Link>
                  </li>
                ))}
              </ul>
            )}
          </section>
        )}

        <Suspense fallback={null}>
          <RecentSearchHistory />
        </Suspense>

        {!q && (
        <section className="space-y-4">
          <h2 className="font-mono text-xs tracking-[0.2em] text-[#7a7165] uppercase">
            Sample artists
          </h2>
          {sampleArtists.length === 0 ? (
            <p className="text-sm text-[#a8a095]">
              Add entries to{" "}
              <code className="rounded bg-[#141210] px-1.5 py-0.5 font-mono text-xs text-[#d4cfc4]">
                data/recent-artists.json
              </code>{" "}
              in the repo to show curated demo tiles. Personal search history lives only under Your searches
              above.
            </p>
          ) : (
            <ul className="grid w-full grid-cols-4 gap-2 sm:gap-3">
              {sampleSlots.map((a, i) =>
                a ? (
                  <li key={a.mbid} className="min-w-0">
                    <Link
                      href={`/artist/${a.mbid}`}
                      className={`relative flex aspect-square w-full flex-col overflow-hidden rounded-lg border text-center transition hover:border-[#c4a574]/45 sm:rounded-xl ${
                        a.coverUrl
                          ? "border-[#2a2620] bg-[#141210]"
                          : "items-center justify-center gap-1 border-[#2a2620] bg-[#141210]/90 p-1.5 hover:bg-[#1c1914] sm:gap-1.5 sm:p-2.5"
                      }`}
                    >
                      {a.coverUrl ? (
                        <>
                          {/* eslint-disable-next-line @next/next/no-img-element */}
                          <img
                            src={a.coverUrl}
                            alt=""
                            className="absolute inset-0 h-full w-full object-cover"
                          />
                          <div
                            className="absolute inset-0 bg-gradient-to-t from-[#0c0b09]/95 via-[#0c0b09]/35 to-transparent"
                            aria-hidden
                          />
                          <div className="relative z-10 mt-auto flex w-full flex-col gap-0.5 p-1.5 text-left sm:p-2">
                            <span className="line-clamp-2 text-[10px] font-semibold leading-tight text-[#fff8ef] drop-shadow-md sm:text-xs">
                              {a.name}
                            </span>
                            {a.disambiguation && (
                              <span className="line-clamp-1 text-[9px] leading-tight text-[#d4cfc4] drop-shadow sm:text-[10px]">
                                {a.disambiguation}
                              </span>
                            )}
                          </div>
                        </>
                      ) : (
                        <>
                          <span
                            className="font-[family-name:var(--font-fraunces)] text-2xl leading-none text-[#c4a574] sm:text-3xl md:text-4xl"
                            aria-hidden
                          >
                            {a.name.slice(0, 1).toUpperCase()}
                          </span>
                          <span className="line-clamp-3 w-full text-[10px] font-medium leading-tight text-[#fff8ef] sm:text-xs md:text-sm">
                            {a.name}
                          </span>
                          {a.disambiguation && (
                            <span className="line-clamp-2 hidden w-full text-[9px] leading-tight text-[#7a7165] sm:block sm:text-[10px]">
                              {a.disambiguation}
                            </span>
                          )}
                        </>
                      )}
                    </Link>
                  </li>
                ) : (
                  <li key={`empty-${i}`} className="min-w-0" aria-hidden>
                    <div className="aspect-square w-full rounded-lg border border-dashed border-[#2a2620]/50 bg-[#0c0b09]/40 sm:rounded-xl" />
                  </li>
                )
              )}
            </ul>
          )}
        </section>
        )}
      </div>
    </div>
  );
}
