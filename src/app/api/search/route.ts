import { NextResponse } from "next/server";
import { searchMbArtists } from "@/lib/musicbrainz";

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const q = searchParams.get("q")?.trim() ?? "";
  if (!q) {
    return NextResponse.json({ artists: [] satisfies unknown[] });
  }

  const artists = await searchMbArtists(q, 24);
  return NextResponse.json({
    artists: artists.map((a) => ({
      mbid: a.id,
      name: a.name,
      score: a.score,
      disambiguation: a.disambiguation,
    })),
  });
}
