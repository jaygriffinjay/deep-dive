import { Geist, Geist_Mono, JetBrains_Mono } from "next/font/google";

export const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

export const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const jetbrainsMono = JetBrains_Mono({
  variable: "--font-jetbrains-mono",
  subsets: ["latin"],
  style: ["normal", "italic"],
});

// Sekuya is self-hosted via @font-face in globals.css (not supported by next/font)

export const fontVariables = [geistSans, geistMono, jetbrainsMono]
  .map((f) => f.variable)
  .join(" ");
