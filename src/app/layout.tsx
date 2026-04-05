import type { Metadata } from "next";
import { fontVariables } from "./fonts";
import { ThemeProvider } from "@/components/theme-provider";
import { TooltipProvider } from "@/components/ui/tooltip";
import { Navbar } from "@/components/navbar";
import { siteConfig } from "@/site-config";
import "./globals.css";

// Favicon fallback chain: svg → png → emoji SVG data URL
const faviconHref =
  siteConfig.logo.svg ??
  siteConfig.logo.png ??
  `data:image/svg+xml,${encodeURIComponent(`<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 100 100'><text y='.9em' font-size='90'>${siteConfig.logo.emoji}</text></svg>`)}`;

export const metadata: Metadata = {
  // Makes relative URLs in metadata absolute (required for og:image etc.)
  metadataBase: new URL(siteConfig.url),

  // Title template: child pages export title: "Page Name" → becomes "Page Name | App Name"
  title: {
    default: siteConfig.name,
    template: `%s | ${siteConfig.name}`,
  },

  description: siteConfig.description,
  authors: [{ name: siteConfig.author }],

  // Open Graph — controls link previews in Slack, iMessage, LinkedIn, etc.
  openGraph: {
    type: "website",
    siteName: siteConfig.name,
    title: siteConfig.name,
    description: siteConfig.description,
    url: siteConfig.url,
    // Uses static ogImage if provided, otherwise falls back to the dynamic /og route
    images: [
      {
        url: siteConfig.ogImage ?? "/og",
        width: 1200,
        height: 630,
      },
    ],
  },

  // Twitter/X card
  twitter: {
    card: "summary_large_image",
    title: siteConfig.name,
    description: siteConfig.description,
    images: [siteConfig.ogImage ?? "/og"],
  },

  // Icons
  icons: {
    // To use favicon.ico instead, delete the `icon` line below.
    // Next.js will automatically pick up public/favicon.ico.
    icon: faviconHref,
    // Apple touch icon: uses png if available, falls back to svg
    apple: siteConfig.logo.png ?? siteConfig.logo.svg,
  },

  robots: { index: true, follow: true },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={`${fontVariables} antialiased`}>
        <ThemeProvider
          attribute="class"
          defaultTheme="system"
          enableSystem
          disableTransitionOnChange
        >
          <TooltipProvider>
            <Navbar />
            {children}
          </TooltipProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
