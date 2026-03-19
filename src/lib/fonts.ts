import { DM_Mono, DM_Sans, Fraunces } from "next/font/google";

export const dmSans = DM_Sans({
  variable: "--font-dm-sans",
  subsets: ["latin"],
});

export const dmMono = DM_Mono({
  variable: "--font-dm-mono",
  weight: ["300", "400", "500"],
  subsets: ["latin"],
});

export const fraunces = Fraunces({
  variable: "--font-fraunces",
  subsets: ["latin"],
});
