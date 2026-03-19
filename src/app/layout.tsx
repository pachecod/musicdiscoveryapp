import type { Metadata } from "next";
import Link from "next/link";
import { dmMono, dmSans, fraunces } from "@/lib/fonts";
import "./globals.css";

export const metadata: Metadata = {
  title: "Music Mambo — music & video",
  description:
    "Search artists via MusicBrainz; open pages with YouTube, Wikipedia (via Wikidata), and Ticketmaster concerts.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${dmSans.variable} ${dmMono.variable} ${fraunces.variable} h-full antialiased`}
    >
      <body className="flex min-h-full flex-col bg-[#0c0b09] font-sans text-[#f4f0e6]">
        <header className="shrink-0 border-b border-[#2a2620] bg-[#0c0b09] px-5 pt-8 pb-6 sm:pt-10 sm:pb-8">
          <div className="mx-auto w-full max-w-5xl">
            <Link
              href="/"
              className={`${fraunces.className} inline-block text-[2.25rem] font-medium leading-[0.95] tracking-tight text-[#fff8ef] transition hover:text-[#e8d4b0] sm:text-[2.8125rem] md:text-[3.375rem]`}
            >
              Music Mambo
            </Link>
          </div>
        </header>
        <div className="flex-1">{children}</div>
      </body>
    </html>
  );
}
