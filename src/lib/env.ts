/** Trim, strip BOM, and remove accidental wrapping quotes from .env values. */
function cleanEnvValue(v: string | undefined): string | undefined {
  if (v == null) return undefined;
  let s = v.trim().replace(/^\uFEFF/, "");
  if (
    (s.startsWith('"') && s.endsWith('"')) ||
    (s.startsWith("'") && s.endsWith("'"))
  ) {
    s = s.slice(1, -1).trim();
  }
  return s || undefined;
}

export function getYoutubeApiKey(): string | undefined {
  return cleanEnvValue(process.env.YOUTUBE_API_KEY);
}

/**
 * Ticketmaster Discovery `apikey` query param — your app’s **consumer key**.
 * Use `TICKETMASTER_CONSUMER_KEY`, or legacy `TICKETMASTER_API_KEY`.
 */
export function getTicketmasterApiKey(): string | undefined {
  return (
    cleanEnvValue(process.env.TICKETMASTER_CONSUMER_KEY) ??
    cleanEnvValue(process.env.TICKETMASTER_API_KEY)
  );
}

export function isTicketmasterConfigured(): boolean {
  return Boolean(getTicketmasterApiKey());
}
