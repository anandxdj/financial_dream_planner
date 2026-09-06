import type { NextConfig } from "next";
import path from "node:path";

const nextConfig: NextConfig = {
  output: "standalone",
  outputFileTracingRoot: path.resolve(__dirname, ".."),
  turbopack: { root: path.resolve(__dirname, "..") },
  // The browser always talks to the Next origin. This preserves cookie
  // semantics and lets the proxy carry SSE response streams unchanged.
  async rewrites() {
    const apiOrigin = process.env.API_ORIGIN ?? "http://localhost:4005";
    return [{ source: "/api/v1/:path*", destination: `${apiOrigin.replace(/\/$/, "")}/api/v1/:path*` }];
  },
};

export default nextConfig;
