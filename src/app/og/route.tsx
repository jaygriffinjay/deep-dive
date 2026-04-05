import { ImageResponse } from "next/og";
import { siteConfig } from "@/site-config";

export const runtime = "edge";

// Generates a 1200x630 og:image from siteConfig.
// Visit /og in the browser to preview it.
// Logo fallback chain: png → svg → emoji
export async function GET() {
  // ImageResponse requires absolute URLs for images
  const logoUrl = siteConfig.logo.png
    ? `${siteConfig.url}${siteConfig.logo.png}`
    : siteConfig.logo.svg
      ? `${siteConfig.url}${siteConfig.logo.svg}`
      : null;

  return new ImageResponse(
    <div
      style={{
        width: "100%",
        height: "100%",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        backgroundColor: "#09090b", // zinc-950
        gap: 24,
        padding: 80,
      }}
    >
      {/* Logo: image if available, emoji as fallback */}
      {logoUrl ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={logoUrl}
          width={120}
          height={120}
          style={{ borderRadius: 24, objectFit: "contain" }}
          alt=""
        />
      ) : (
        <div style={{ fontSize: 80, lineHeight: 1 }}>
          {siteConfig.logo.emoji}
        </div>
      )}

      {/* App name */}
      <div
        style={{
          fontSize: 64,
          fontWeight: 700,
          color: "#fafafa",
          letterSpacing: -2,
          textAlign: "center",
        }}
      >
        {siteConfig.name}
      </div>

      {/* Description */}
      <div
        style={{
          fontSize: 28,
          color: "#a1a1aa", // zinc-400
          maxWidth: 700,
          textAlign: "center",
          lineHeight: 1.5,
        }}
      >
        {siteConfig.description}
      </div>
    </div>,
    { width: 1200, height: 630 },
  );
}
