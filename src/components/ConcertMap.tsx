"use client";

import { useEffect, useRef } from "react";
import L from "leaflet";
import "leaflet/dist/leaflet.css";

export type ConcertMapPoint = {
  id: string;
  lat: number;
  lng: number;
  title: string;
  venueName: string;
  dateLabel: string;
  url: string;
};

type Props = {
  points: ConcertMapPoint[];
  /** Fallback center when there are no points (continental US). */
  fallbackCenter?: [number, number];
  fallbackZoom?: number;
};

export function ConcertMap({
  points,
  fallbackCenter = [39.8283, -98.5795],
  fallbackZoom = 3,
}: Props) {
  const containerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<L.Map | null>(null);

  useEffect(() => {
    if (!containerRef.current) return;

    const el = containerRef.current;
    const map = L.map(el, {
      scrollWheelZoom: true,
      attributionControl: true,
    });

    mapRef.current = map;

    L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
      attribution:
        '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>',
      maxZoom: 19,
    }).addTo(map);

    const layer = L.layerGroup().addTo(map);

    if (points.length === 0) {
      map.setView(fallbackCenter, fallbackZoom);
    } else {
      for (const p of points) {
        const latlng: L.LatLngTuple = [p.lat, p.lng];

        L.circleMarker(latlng, {
          radius: 26,
          stroke: true,
          color: "#ffd54a",
          weight: 2,
          opacity: 0.55,
          fillColor: "#e2a317",
          fillOpacity: 0.35,
          interactive: false,
        }).addTo(layer);

        const core = L.circleMarker(latlng, {
          radius: 13,
          stroke: true,
          color: "#fffef8",
          weight: 4,
          opacity: 1,
          fillColor: "#f0b90b",
          fillOpacity: 1,
        });

        const wrap = document.createElement("div");
        wrap.className = "text-[13px] leading-snug text-[#1a1510] max-w-[220px]";
        const title = document.createElement("div");
        title.className = "font-semibold";
        title.textContent = p.title;
        const meta = document.createElement("div");
        meta.className = "mt-1 text-[11px] text-[#4a443c]";
        meta.textContent = `${p.dateLabel} · ${p.venueName}`;
        const link = document.createElement("a");
        link.href = p.url;
        link.target = "_blank";
        link.rel = "noreferrer";
        link.className = "mt-2 inline-block text-[12px] font-medium text-[#8b6914] underline";
        link.textContent = "Tickets / details";
        wrap.append(title, meta, link);
        core.bindPopup(wrap, { maxWidth: 260, className: "tm-concert-popup" });
        core.addTo(layer);
      }

      const bounds = L.latLngBounds(points.map((p) => [p.lat, p.lng] as L.LatLngTuple));
      map.fitBounds(bounds, { padding: [28, 28], maxZoom: 8 });
    }

    return () => {
      map.remove();
      mapRef.current = null;
    };
  }, [points, fallbackCenter, fallbackZoom]);

  return (
    <div
      ref={containerRef}
      className="z-0 h-[min(420px,55vh)] w-full min-h-[280px] overflow-hidden rounded-xl border border-[#2a2620] bg-[#141210]"
      role="presentation"
    />
  );
}
