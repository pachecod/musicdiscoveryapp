import Link from "next/link";

export default function ArtistNotFound() {
  return (
    <div className="flex min-h-full flex-col items-center justify-center gap-4 bg-[#0c0b09] px-6 py-24 text-center text-[#f4f0e6]">
      <h1 className="font-[family-name:var(--font-fraunces)] text-2xl text-[#fff8ef]">
        Artist not found
      </h1>
      <p className="max-w-md text-sm text-[#a8a095]">
        That MusicBrainz id is missing or invalid. Try another search.
      </p>
      <Link
        href="/"
        className="rounded-full border border-[#2a2620] px-5 py-2 text-sm text-[#c4a574] hover:border-[#c4a574]/40"
      >
        Back to search
      </Link>
    </div>
  );
}
