import { NextResponse } from "next/server";
import { loadArtistByMbid } from "@/lib/artist-data";

type RouteCtx = { params: Promise<{ mbid: string }> };

export async function GET(_req: Request, ctx: RouteCtx) {
  const { mbid } = await ctx.params;
  if (!mbid || !/^[0-9a-f-]{36}$/i.test(mbid)) {
    return NextResponse.json({ error: "Invalid MusicBrainz id" }, { status: 400 });
  }

  const data = await loadArtistByMbid(mbid);
  if (!data) {
    return NextResponse.json({ error: "Artist not found" }, { status: 404 });
  }

  return NextResponse.json(data);
}
