import type { Metadata, Viewport } from "next";
import { Archivo, Dancing_Script } from "next/font/google";
import { site } from "@/content/site";
import "./globals.css";

const archivo = Archivo({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700", "800"],
  variable: "--font-archivo",
  display: "swap",
});

// Handwriting-style face used for e-signatures on the quote/NDA sheets.
const signature = Dancing_Script({
  subsets: ["latin"],
  weight: ["600", "700"],
  variable: "--font-signature",
  display: "swap",
});

const description =
  "M&M Websites builds clean, fast custom websites for small businesses in Gardendale, Alabama and greater Birmingham. Starting at $500. Get a free quote.";

// Live site URL. Update this (and it flows to canonical / OG image URLs)
// when the custom domain (e.g. mmwebsites.com) is connected.
const siteUrl = "https://mmwebsites.com";

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  title: {
    default: "M&M Websites",
    template: "%s · M&M Websites",
  },
  description,
  keywords: [
    "small business website",
    "Gardendale web design",
    "Birmingham web design",
    "affordable websites Alabama",
    "M&M Websites",
  ],
  openGraph: {
    type: "website",
    title: "M&M Websites",
    description,
    siteName: site.name,
    url: "/",
    locale: "en_US",
    images: [
      {
        url: "/og.jpg",
        width: 1200,
        height: 630,
        alt: "M&M Websites — websites built for you",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "M&M Websites",
    description,
    images: ["/og.jpg"],
  },
  alternates: { canonical: "/" },
};

export const viewport: Viewport = {
  themeColor: "#7a1b2e",
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en" className={`${archivo.variable} ${signature.variable}`}>
      <body>{children}</body>
    </html>
  );
}
