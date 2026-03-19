import { NextResponse } from "next/server";
import { searchYoutubeVideos } from "@/lib/youtube";

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const q = searchParams.get("q")?.trim() ?? "";
  if (!q) {
    return NextResponse.json({ thumbnailUrl: null as string | null });
  }

  const outcome = await searchYoutubeVideos(q, 1);
  const thumbnailUrl = outcome.hits[0]?.thumbnailUrl ?? null;
  return NextResponse.json({ thumbnailUrl });
}
