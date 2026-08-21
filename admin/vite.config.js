import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

// The admin app is served from /admin on the same Firebase Hosting site as the
// public (Next.js) marketing site. `base` makes assets resolve under /admin/,
// and the build output is written into ../public/admin — Next copies /public
// into its static export (out/admin), so a single deploy ships both.
export default defineConfig({
  plugins: [react()],
  base: "/admin/",
  build: {
    outDir: "../public/admin",
    emptyOutDir: true,
  },
});
