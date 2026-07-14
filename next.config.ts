import type { NextConfig } from "next";

// The backend lives on a different origin (self-hosted Pi / DuckDNS in
// production), so CSP's connect-src/img-src/media-src must explicitly allow
// it - 'self' alone only covers this Next.js app's own origin.
const apiOrigin = process.env.NEXT_PUBLIC_API_BASE_URL || "http://127.0.0.1:5001";
const isDev = process.env.NODE_ENV === "development";

// No nonce here: nonce-based CSP forces every page into dynamic rendering
// (no static optimization / CDN caching), which isn't worth it for this app.
// 'unsafe-inline' on script-src is required because Next.js's App Router
// injects inline bootstrap scripts for streaming RSC data - it still blocks
// loading attacker-controlled external scripts, framing, and base-tag/form
// hijacking, which covers the realistic exfiltration paths for a stolen
// session token.
const cspHeader = `
    default-src 'self';
    script-src 'self' 'unsafe-inline'${isDev ? " 'unsafe-eval'" : ""};
    style-src 'self' 'unsafe-inline';
    img-src 'self' blob: data: ${apiOrigin};
    media-src 'self' ${apiOrigin};
    connect-src 'self' ${apiOrigin};
    font-src 'self';
    object-src 'none';
    base-uri 'self';
    form-action 'self';
    frame-ancestors 'none';
    ${isDev ? "" : "upgrade-insecure-requests;"}
`.replace(/\s{2,}/g, " ").trim();

const nextConfig: NextConfig = {
  async headers() {
    return [
      {
        source: "/(.*)",
        headers: [
          { key: "Content-Security-Policy", value: cspHeader },
          { key: "X-Content-Type-Options", value: "nosniff" },
          { key: "X-Frame-Options", value: "DENY" },
          { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
          { key: "Permissions-Policy", value: "camera=(), microphone=(), geolocation=()" },
        ],
      },
    ];
  },
};

export default nextConfig;
