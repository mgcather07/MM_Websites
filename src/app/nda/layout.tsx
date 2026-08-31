import type { Metadata } from "next";

// The NDA page is a client component (it reads the agreement live from the
// database), so it can't export metadata. This route-level layout supplies the
// link-preview (Open Graph) tags — so pasting an NDA link shows a
// "Confidentiality Agreement" card rather than the generic homepage preview.
// NDA links are private, so we also ask search engines not to index them.
const title = "Confidentiality Agreement";
const description =
  "A confidentiality agreement from M&M Websites — please review and sign online.";

export const metadata: Metadata = {
  title,
  description,
  robots: { index: false, follow: false },
  alternates: { canonical: "/nda" },
  openGraph: {
    type: "website",
    title: `${title} · M&M Websites`,
    description,
    url: "/nda",
    images: [
      {
        url: "/og-nda.png",
        width: 1200,
        height: 630,
        alt: "Confidentiality agreement from M&M Websites",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: `${title} · M&M Websites`,
    description,
    images: ["/og-nda.png"],
  },
};

export default function NdaLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}
