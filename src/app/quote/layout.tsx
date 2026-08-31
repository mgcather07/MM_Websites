import type { Metadata } from "next";

// The quote page itself is a client component (it reads the quote live from the
// database), so it can't export metadata. This route-level layout supplies the
// link-preview (Open Graph) tags instead — so pasting a quote link shows a
// "Project Quote" card rather than the generic homepage preview. Quote links
// are private, so we also ask search engines not to index them.
const title = "Your Website Project Quote";
const description =
  "Prepared just for you by M&M Websites — view your project quote and accept online.";

export const metadata: Metadata = {
  title,
  description,
  robots: { index: false, follow: false },
  alternates: { canonical: "/quote" },
  openGraph: {
    type: "website",
    title: `${title} · M&M Websites`,
    description,
    url: "/quote",
    images: [
      {
        url: "/og-quote.png",
        width: 1200,
        height: 630,
        alt: "Project quote from M&M Websites",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: `${title} · M&M Websites`,
    description,
    images: ["/og-quote.png"],
  },
};

export default function QuoteLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}
