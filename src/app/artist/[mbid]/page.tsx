import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ConcertMapDynamic } from "@/components/ConcertMapDynamic";
import { loadArtistByMbid } from "@/lib/artist-data";
import { getMbArtist } from "@/lib/musicbrainz";
import { recordRecentArtist } from "@/lib/recent-artists";

type Props = { params: Promise<{ mbid: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { mbid } = await params;
  const mb = await getMbArtist(mbid);
  if (!mb) return { title: "Artist" };
  return {
    title: `${mb.name} · Discover`,
    description: mb.disambiguation
      ? `${mb.name} (${mb.disambiguation}) — videos, shows, and Wikipedia.`
      : `${mb.name} — videos, shows, and Wikipedia.`,
  };
}

export default async function ArtistPage({ params }: Props) {
  const { mbid } = await params;
  const data = await loadArtistByMbid(mbid);
  if (!data) notFound();

  await recordRecentArtist({
    mbid: data.mbid,
    name: data.name,
    disambiguation: data.disambiguation,
    coverUrl: data.youtube[0]?.thumbnailUrl,
  });

  const { sources } = data;

  const mapPoints = data.concerts.map((c) => ({
    id: c.id,
    lat: c.lat,
    lng: c.lng,
    title: c.name,
    venueName: c.venueName,
    dateLabel: c.dateLabel,
    url: c.url,
  }));

  return (
    <div className="min-h-full bg-[#0c0b09] text-[#f4f0e6]">
      <div className="mx-auto w-full max-w-6xl px-5 py-12">
        <Link
          href="/"
          className="font-mono text-xs tracking-widest text-[#c4a574] uppercase hover:text-[#e8d4b0]"
        >
          ← Search
        </Link>

        <header className="mt-8 flex flex-col gap-8 border-b border-[#2a2620] pb-10 md:flex-row md:items-start">
          <div className="relative h-40 w-40 shrink-0 overflow-hidden rounded-2xl border border-[#2a2620] bg-[#141210]">
            {data.heroImageUrl ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={data.heroImageUrl} alt="" className="h-full w-full object-cover" />
            ) : (
              <div className="flex h-full items-center justify-center font-[family-name:var(--font-fraunces)] text-4xl text-[#3d3830]">
                {data.name.slice(0, 1).toUpperCase()}
              </div>
            )}
          </div>
          <div className="min-w-0 flex-1 space-y-4">
            <div>
              <h1 className="font-[family-name:var(--font-fraunces)] text-4xl font-medium text-[#fff8ef]">
                {data.name}
              </h1>
              {data.disambiguation && (
                <p className="mt-1 text-sm text-[#a8a095]">{data.disambiguation}</p>
              )}
              {data.heroImageUrl && (
                <p className="mt-2 text-xs text-[#7a7165]">
                  {data.youtube[0]?.thumbnailUrl === data.heroImageUrl
                    ? "Thumbnail from top YouTube result."
                    : data.wikipedia?.thumbnailUrl === data.heroImageUrl
                      ? "Image from Wikipedia."
                      : "Cover image."}
                </p>
              )}
            </div>
            {(!sources.youtube || !sources.ticketmaster) && (
              <p className="text-xs text-[#7a7165]">
                {!sources.youtube && (
                  <>
                    Set <code className="text-[#c4a574]">YOUTUBE_API_KEY</code> for videos.{" "}
                  </>
                )}
                {!sources.ticketmaster && (
                  <>
                    Set <code className="text-[#c4a574]">TICKETMASTER_CONSUMER_KEY</code> for concerts on
                    the map.
                  </>
                )}
              </p>
            )}
            {sources.ticketmaster && data.ticketmasterError && (
              <p className="text-xs text-[#c49a6c]">{data.ticketmasterError}</p>
            )}
          </div>
        </header>

        {data.wikipedia && (
          <section className="mt-10 rounded-2xl border border-[#2a2620] bg-[#141210]/90 p-6">
            <div className="flex flex-col gap-4 md:flex-row md:items-start">
              {data.wikipedia.thumbnailUrl && (
                <div className="mx-auto w-full max-w-[200px] shrink-0 overflow-hidden rounded-xl border border-[#2a2620] md:mx-0">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={data.wikipedia.thumbnailUrl}
                    alt=""
                    className="aspect-square w-full object-cover"
                  />
                </div>
              )}
              <div className="min-w-0 flex-1 space-y-3">
                <h2 className="font-mono text-xs tracking-[0.2em] text-[#c4a574] uppercase">
                  From Wikipedia
                </h2>
                <p className="text-sm leading-relaxed text-[#c9c2b5]">{data.wikipedia.extract}</p>
                <p className="text-xs text-[#7a7165]">
                  Text under{" "}
                  <a
                    href="https://creativecommons.org/licenses/by-sa/4.0/"
                    target="_blank"
                    rel="noreferrer"
                    className="text-[#c4a574] underline decoration-[#5c4d3a] underline-offset-2"
                  >
                    CC BY-SA
                  </a>
                  ; from{" "}
                  <a
                    href={data.wikipedia.articleUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="text-[#c4a574] underline decoration-[#5c4d3a] underline-offset-2"
                  >
                    {data.wikipedia.displayTitle}
                  </a>
                  {data.wikipedia.wikidataUrl && (
                    <>
                      {" "}
                      ·{" "}
                      <a
                        href={data.wikipedia.wikidataUrl}
                        target="_blank"
                        rel="noreferrer"
                        className="text-[#c4a574] underline decoration-[#5c4d3a] underline-offset-2"
                      >
                        Wikidata
                      </a>
                    </>
                  )}
                  . Resolved via{" "}
                  <a
                    href="https://query.wikidata.org/"
                    target="_blank"
                    rel="noreferrer"
                    className="text-[#c4a574] underline decoration-[#5c4d3a] underline-offset-2"
                  >
                    Wikidata Query Service
                  </a>{" "}
                  (MusicBrainz ID).
                </p>
              </div>
            </div>
          </section>
        )}

        <div className="mt-10 grid gap-10 lg:grid-cols-2 lg:items-start">
          <section className="space-y-4">
            <div className="flex items-baseline justify-between gap-4">
              <h2 className="font-mono text-xs tracking-[0.2em] text-[#c4a574] uppercase">
                YouTube
              </h2>
              {!sources.youtube && (
                <span className="text-[10px] text-[#7a7165]">API key not set</span>
              )}
            </div>
            {data.youtube.length === 0 ? (
              <div className="space-y-3 text-sm text-[#a8a095]">
                <p>
                  {sources.youtube
                    ? data.youtubeError
                      ? data.youtubeError
                      : "No videos matched this search."
                    : "Set YOUTUBE_API_KEY in .env.local to load videos."}
                </p>
                {sources.youtube && data.youtubeError && (
                  <p className="text-xs leading-relaxed text-[#7a7165]">
                    Check: YouTube Data API v3 enabled, quota OK, variable name{" "}
                    <code className="text-[#c4a574]">YOUTUBE_API_KEY</code> in{" "}
                    <code className="text-[#c4a574]">.env.local</code>. If the key uses{" "}
                    <strong className="text-[#a8a095]">HTTP referrer</strong> restrictions, switch to{" "}
                    <strong className="text-[#a8a095]">None</strong> or <strong className="text-[#a8a095]">IP</strong>{" "}
                    — server-side requests have no browser referrer.
                  </p>
                )}
              </div>
            ) : (
              <ul className="grid grid-cols-1 gap-6">
                {data.youtube.map((v) => (
                  <li
                    key={v.videoId}
                    className="overflow-hidden rounded-xl border border-[#2a2620] bg-[#141210]"
                  >
                    <div className="relative aspect-video w-full bg-black">
                      <iframe
                        className="absolute inset-0 h-full w-full"
                        src={`https://www.youtube-nocookie.com/embed/${encodeURIComponent(v.videoId)}`}
                        title={v.title}
                        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                        allowFullScreen
                        loading="lazy"
                      />
                    </div>
                    <div className="space-y-2 p-3">
                      <p className="line-clamp-2 text-sm font-medium text-[#fff8ef]">{v.title}</p>
                      <p className="text-xs text-[#7a7165]">{v.channelTitle}</p>
                      <a
                        href={`https://www.youtube.com/watch?v=${encodeURIComponent(v.videoId)}`}
                        target="_blank"
                        rel="noreferrer"
                        className="inline-block text-xs text-[#c4a574] underline decoration-[#5c4d3a] underline-offset-2 hover:decoration-[#c4a574]"
                      >
                        Open on YouTube
                      </a>
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </section>

          <section className="space-y-4">
            <div className="flex flex-wrap items-baseline justify-between gap-4">
              <h2 className="font-mono text-xs tracking-[0.2em] text-[#7eb8da] uppercase">
                Upcoming concerts
              </h2>
              {!sources.ticketmaster && (
                <span className="text-[10px] text-[#7a7165]">API key not set</span>
              )}
            </div>
            <p className="text-xs text-[#7a7165]">
              From{" "}
              <a
                href="https://developer.ticketmaster.com/"
                target="_blank"
                rel="noreferrer"
                className="text-[#c4a574] underline decoration-[#5c4d3a] underline-offset-2"
              >
                Ticketmaster Discovery
              </a>
              · map tiles © OpenStreetMap
            </p>

            {!sources.ticketmaster ? (
              <p className="text-sm text-[#a8a095]">
                Set <code className="text-[#c4a574]">TICKETMASTER_CONSUMER_KEY</code> in{" "}
                <code className="text-[#c4a574]">.env.local</code> (consumer key from the Ticketmaster
                developer portal; the consumer secret is not required for this map).
              </p>
            ) : (
              <>
                {data.concerts.length === 0 && !data.ticketmasterError && (
                  <p className="text-sm text-[#a8a095]">
                    No upcoming music events matched this artist in Ticketmaster&apos;s catalog (try
                    another name or region).
                  </p>
                )}
                <ConcertMapDynamic points={mapPoints} />
                {data.concerts.length > 0 && (
                  <ul className="max-h-56 space-y-2 overflow-y-auto rounded-xl border border-[#2a2620] bg-[#141210]/80 p-3 text-sm">
                    {data.concerts.map((c) => (
                      <li
                        key={c.id}
                        className="border-b border-[#2a2620] pb-2 last:border-0 last:pb-0"
                      >
                        <a
                          href={c.url}
                          target="_blank"
                          rel="noreferrer"
                          className="font-medium text-[#fff8ef] hover:text-[#c4a574]"
                        >
                          {c.name}
                        </a>
                        <p className="text-xs text-[#7a7165]">
                          {c.dateLabel} · {c.venueName}
                        </p>
                      </li>
                    ))}
                  </ul>
                )}
              </>
            )}
          </section>
        </div>
      </div>
    </div>
  );
}
