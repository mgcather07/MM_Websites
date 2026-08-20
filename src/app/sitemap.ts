import type { MetadataRoute } from "next";

export const dynamic = "force-static";

export default function sitemap(): MetadataRoute.Sitemap {
  return [
    {
      url: "https://mm-websites.web.app",
      changeFrequency: "monthly",
      priority: 1,
    },
  ];
}
