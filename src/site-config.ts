/**
 * Site config — single source of truth for identity, SEO, and branding.
 * Change these values when starting a new project. Everything reads from here:
 * tab title, favicon, navbar logo, og:image, apple touch icon, twitter card.
 */
export const siteConfig = {
  name: "Deep Dive",
  description: "AI-powered security audit for any GitHub repo. BYO API key.",
  author: "Deep Dive",

  // Production URL — reads from NEXT_PUBLIC_SITE_URL env var.
  // Set NEXT_PUBLIC_SITE_URL=https://yourapp.com in your host's env vars (e.g. Vercel).
  // Falls back to localhost:3000 in dev — only matters if testing og:image locally.
  url: process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000",

  logo: {
    // Emoji fallback — always shown if no svg/png provided.
    emoji: "�",
    // Optional: path to logo SVG in /public (e.g. "/logo.svg")
    svg: undefined as string | undefined,
    // Optional: path to logo PNG in /public (e.g. "/logo.png")
    // Also used as apple-touch-icon if provided.
    png: undefined as string | undefined,
  },

  // Optional: path to a static 1200x630 og:image in /public (e.g. "/og.png").
  // If not set, the dynamic /og route auto-generates one from name + description.
  ogImage: undefined as string | undefined,
};
