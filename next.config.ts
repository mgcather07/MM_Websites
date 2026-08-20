import type { NextConfig } from "next";

// STATIC_EXPORT=1 produces a fully static `out/` (for a quick Firebase Hosting
// preview). In that mode the /api/quote route is skipped — see the temporary
// exclusion in scripts. Default (unset) is the normal server build used by
// App Hosting, where the quote API runs.
const isStaticExport = process.env.STATIC_EXPORT === "1";

const nextConfig: NextConfig = {
  ...(isStaticExport
    ? { output: "export" as const, images: { unoptimized: true } }
    : {}),
};

export default nextConfig;
