const WD_HEADERS = {
  Accept: "application/sparql-results+json",
  "User-Agent": "DiscoverMusic/1.0 (Wikidata SPARQL; local dev)",
};

const WP_HEADERS = {
  Accept: "application/json",
  "User-Agent": "DiscoverMusic/1.0 (Wikipedia REST; local dev)",
};

export type WikipediaAbout = {
  title: string;
  displayTitle: string;
  extract: string;
  articleUrl: string;
  /** Wikidata item URL when known (for attribution / further reading). */
  wikidataUrl?: string;
  thumbnailUrl?: string;
};

function isValidMbid(mbid: string): boolean {
  return /^[0-9a-f-]{36}$/i.test(mbid);
}

/** English Wikipedia article IRI → API title (spaces, decoded). */
function titleFromWikipediaArticleUri(uri: string): string | null {
  try {
    const u = new URL(uri);
    if (u.hostname !== "en.wikipedia.org") return null;
    const prefix = "/wiki/";
    if (!u.pathname.startsWith(prefix)) return null;
    const encoded = u.pathname.slice(prefix.length);
    return decodeURIComponent(encoded).replace(/_/g, " ");
  } catch {
    return null;
  }
}

async function sparqlEnWikipediaArticle(
  mbid: string
): Promise<{ articleUri: string; itemUri: string } | null> {
  const q = `
SELECT ?article ?item WHERE {
  ?item wdt:P434 "${mbid}" .
  ?article schema:about ?item .
  ?article schema:inLanguage "en" .
  ?article schema:isPartOf <https://en.wikipedia.org/> .
}
LIMIT 1`.trim();

  const url = new URL("https://query.wikidata.org/sparql");
  url.searchParams.set("query", q);
  url.searchParams.set("format", "json");

  const res = await fetch(url.toString(), {
    headers: WD_HEADERS,
    next: { revalidate: 86_400 },
  });

  if (!res.ok) return null;

  const data = (await res.json()) as {
    results?: {
      bindings?: Array<{ article?: { value: string }; item?: { value: string } }>;
    };
  };

  const b = data.results?.bindings?.[0];
  const articleUri = b?.article?.value;
  const itemUri = b?.item?.value;
  if (!articleUri || !itemUri) return null;

  return { articleUri, itemUri };
}

async function fetchWikipediaSummary(pageTitle: string): Promise<WikipediaAbout | null> {
  const path = encodeURIComponent(pageTitle.replace(/ /g, "_"));
  const res = await fetch(`https://en.wikipedia.org/api/rest_v1/page/summary/${path}`, {
    headers: WP_HEADERS,
    next: { revalidate: 86_400 },
  });

  if (res.status === 404) return null;
  if (!res.ok) return null;

  const j = (await res.json()) as {
    type?: string;
    title?: string;
    displaytitle?: string;
    extract?: string;
    content_urls?: { desktop?: { page?: string } };
    thumbnail?: { source?: string };
  };

  if (j.type === "disambiguation" || !j.extract || !j.title) return null;

  const articleUrl = j.content_urls?.desktop?.page;
  if (!articleUrl) return null;

  return {
    title: j.title,
    displayTitle: j.displaytitle ?? j.title,
    extract: j.extract.trim(),
    articleUrl,
    thumbnailUrl: j.thumbnail?.source,
  };
}

/**
 * Resolve MusicBrainz artist id (P434) via Wikidata Query Service, then load
 * the English Wikipedia REST summary.
 */
export async function loadWikipediaAboutForMbid(mbid: string): Promise<WikipediaAbout | null> {
  if (!isValidMbid(mbid)) return null;

  let resolved = await sparqlEnWikipediaArticle(mbid.toLowerCase());
  if (!resolved && mbid !== mbid.toLowerCase()) {
    resolved = await sparqlEnWikipediaArticle(mbid);
  }
  if (!resolved) return null;

  const pageTitle = titleFromWikipediaArticleUri(resolved.articleUri);
  if (!pageTitle) return null;

  const summary = await fetchWikipediaSummary(pageTitle);
  if (!summary) return null;

  return {
    ...summary,
    wikidataUrl: resolved.itemUri,
  };
}
