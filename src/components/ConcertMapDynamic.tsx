"use client";

import dynamic from "next/dynamic";
import type { ConcertMapPoint } from "./ConcertMap";

const Map = dynamic(() => import("./ConcertMap").then((m) => m.ConcertMap), {
  ssr: false,
  loading: () => (
    <div className="h-[min(420px,55vh)] min-h-[280px] animate-pulse rounded-xl border border-[#2a2620] bg-[#141210]" />
  ),
});

export function ConcertMapDynamic(props: { points: ConcertMapPoint[] }) {
  return <Map {...props} />;
}
