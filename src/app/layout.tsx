import type { Metadata, Viewport } from "next";
import { Archivo } from "next/font/google";
import { site } from "@/content/site";
import "./globals.css";

const archivo = Archivo({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700", "800"],
  variable: "--font-archivo",
  display: "swap",
});

const description =
  "M&M Websites builds clean, fast custom websites for small businesses in Gardendale, Alabama and greater Birmingham. Starting at $500. Get a free quote.";

export const metadata: Metadata = {
  metadataBase: new URL("https://mmwebsites.com"),
  title: {
    default: "M&M Websites — Small business websites in Gardendale, AL",
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
    title: "M&M Websites — Small business websites in Gardendale, AL",
    description,
    siteName: site.name,
    locale: "en_US",
  },
  twitter: {
    card: "summary_large_image",
    title: "M&M Websites — Small business websites in Gardendale, AL",
    description,
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
    <html lang="en" className={archivo.variable}>
      <body>{children}</body>
    </html>
  );
}
