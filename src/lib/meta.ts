import type { Metadata } from "next";

const SITE_NAME = "M&M Websites";
const OG_IMAGE = "/og.jpg";

/**
 * Build a marketing page's metadata so its link-preview (Open Graph / Twitter)
 * title matches its browser-tab title — "Page Name · M&M Websites" — instead of
 * falling back to the site-wide "M&M Websites". Next.js does not copy the page
 * `title` into `openGraph.title`, and a child `openGraph` replaces the parent's,
 * so we spell out the social title, description and image here on every page.
 */
export function pageMeta({
  title,
  description,
  path,
}: {
  title: string;
  description: string;
  path: string;
}): Metadata {
  const social = `${title} · ${SITE_NAME}`;
  return {
    title, // <title> uses the root template → "Title · M&M Websites"
    description,
    alternates: { canonical: path },
    openGraph: {
      type: "website",
      siteName: SITE_NAME,
      title: social,
      description,
      url: path,
      locale: "en_US",
      images: [
        { url: OG_IMAGE, width: 1200, height: 630, alt: SITE_NAME },
      ],
    },
    twitter: {
      card: "summary_large_image",
      title: social,
      description,
      images: [OG_IMAGE],
    },
  };
}
