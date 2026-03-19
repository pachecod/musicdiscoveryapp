import { getTicketmasterApiKey, getYoutubeApiKey, isTicketmasterConfigured } from "./env";
import { getMbArtist } from "./musicbrainz";
import { searchTicketmasterConcerts, type ConcertEvent } from "./ticketmaster";
import { loadWikipediaAboutForMbid, type WikipediaAbout } from "./wikidata-wikipedia";
import { searchYoutubeVideos, type YoutubeVideoHit } from "./youtube";

export type ArtistPageData = {
  mbid: string;
  name: string;
  disambiguation?: string;
  heroImageUrl?: string;
  youtube: YoutubeVideoHit[];
  youtubeError?: string;
  concerts: ConcertEvent[];
  ticketmasterError?: string;
  wikipedia: WikipediaAbout | null;
  sources: {
    youtube: boolean;
    ticketmaster: boolean;
  };
};

export async function loadArtistByMbid(mbid: string): Promise<ArtistPageData | null> {
  const mb = await getMbArtist(mbid);
  if (!mb?.name) return null;

  const name = mb.name;
  const id = mb.id;

  const [ytOutcome, tmOutcome, wikipedia] = await Promise.all([
    searchYoutubeVideos(name, 12),
    isTicketmasterConfigured()
      ? searchTicketmasterConcerts(name, 40)
      : Promise.resolve({ events: [] as ConcertEvent[], error: undefined as string | undefined }),
    loadWikipediaAboutForMbid(id),
  ]);

  const youtube = ytOutcome.hits;
  const concerts = tmOutcome.events;

  const heroImageUrl =
    youtube[0]?.thumbnailUrl ?? wikipedia?.thumbnailUrl;

  return {
    mbid: id,
    name,
    disambiguation: mb.disambiguation,
    heroImageUrl,
    youtube,
    youtubeError: ytOutcome.error,
    concerts,
    ticketmasterError: tmOutcome.error,
    wikipedia,
    sources: {
      youtube: Boolean(getYoutubeApiKey()),
      ticketmaster: Boolean(getTicketmasterApiKey()),
    },
  };
}
