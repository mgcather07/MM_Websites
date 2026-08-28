import type { Metadata } from "next";
import AnchorScroll from "@/components/AnchorScroll";
import Nav from "@/components/Nav";
import Hero from "@/components/Hero";
import Services from "@/components/Services";
import Work from "@/components/Work";
import Process from "@/components/Process";
import QuoteForm from "@/components/QuoteForm";
import Footer from "@/components/Footer";
import { site } from "@/content/site";
import { services } from "@/content/services";

const siteUrl = "https://mmwebsites.com";

// Keyword- and location-rich title for the homepage specifically (the layout
// keeps the short brand title as the default for other pages).
export const metadata: Metadata = {
  title: {
    absolute: "Small-Business Web Design in Gardendale, AL | M&M Websites",
  },
  description:
    "Affordable custom websites for small businesses in Gardendale, Birmingham & North Alabama — design, redesign, hosting, SEO and Google Business Profile setup. Flat pricing from $500. Get a free quote.",
  alternates: { canonical: "/" },
};

const areaServed = [
  "Gardendale",
  "Fultondale",
  "Mount Olive",
  "Morris",
  "Kimberly",
  "Warrior",
  "Center Point",
  "Birmingham",
].map((name) => ({ "@type": "City", name: `${name}, Alabama` }));

// Rich local-business structured data. Helps Google understand who we are,
// where we serve, and exactly what services we offer — the strongest on-page
// lever for showing up in local search.
const jsonLd = {
  "@context": "https://schema.org",
  "@graph": [
    {
      "@type": "ProfessionalService",
      "@id": `${siteUrl}/#business`,
      name: site.name,
      alternateName: "M and M Websites",
      description:
        "Custom small-business websites starting at $500 — design, redesign, hosting, SEO, Google Business Profile setup, logo & branding, and online booking. Serving Gardendale, Birmingham and North Alabama.",
      url: siteUrl,
      image: `${siteUrl}/og.jpg`,
      logo: `${siteUrl}/images/logo/logo-full.png`,
      telephone: "+1-205-914-1019",
      email: site.email,
      priceRange: "$$",
      currenciesAccepted: "USD",
      paymentAccepted: "Credit Card, Debit Card",
      slogan: "Professional Websites. Built for Business.",
      knowsAbout: [
        "Web design",
        "Website development",
        "Website redesign",
        "Local SEO",
        "Google Business Profile",
        "Small business websites",
        "Logo and branding",
      ],
      address: {
        "@type": "PostalAddress",
        addressLocality: "Gardendale",
        addressRegion: "AL",
        postalCode: "35071",
        addressCountry: "US",
      },
      geo: {
        "@type": "GeoCoordinates",
        latitude: 33.6604,
        longitude: -86.8136,
      },
      areaServed,
      hasOfferCatalog: {
        "@type": "OfferCatalog",
        name: "Web design & online presence services",
        itemListElement: services.map((s) => ({
          "@type": "Offer",
          itemOffered: {
            "@type": "Service",
            name: s.title,
            description: s.body,
          },
        })),
      },
    },
    {
      "@type": "WebSite",
      "@id": `${siteUrl}/#website`,
      url: siteUrl,
      name: site.name,
      inLanguage: "en-US",
      publisher: { "@id": `${siteUrl}/#business` },
    },
  ],
};

export default function Home() {
  return (
    <>
      <script
        type="application/ld+json"
        // JSON-LD for local SEO; content is static and trusted.
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      <AnchorScroll />
      <a href="#quote" className="visually-hidden-focusable">
        Skip to quote form
      </a>
      <div id="top" />
      <Nav />
      <main>
        <Hero />
        <Services />
        <Work />
        <Process />
        <QuoteForm />
      </main>
      <Footer />
    </>
  );
}
