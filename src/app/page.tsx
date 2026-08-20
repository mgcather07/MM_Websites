import Nav from "@/components/Nav";
import Hero from "@/components/Hero";
import Services from "@/components/Services";
import Work from "@/components/Work";
import Process from "@/components/Process";
import QuoteForm from "@/components/QuoteForm";
import Footer from "@/components/Footer";
import { site } from "@/content/site";

const jsonLd = {
  "@context": "https://schema.org",
  "@type": "ProfessionalService",
  name: site.name,
  description:
    "Custom small-business websites starting at $500. Design, redesign, hosting, SEO and Google Business Profile setup.",
  telephone: site.phone,
  email: site.email,
  areaServed: [
    "Gardendale AL",
    "Fultondale AL",
    "Mt. Olive AL",
    "Morris AL",
    "Warrior AL",
    "Birmingham AL",
  ],
  address: {
    "@type": "PostalAddress",
    addressLocality: "Gardendale",
    addressRegion: "AL",
    addressCountry: "US",
  },
  priceRange: "$$",
};

export default function Home() {
  return (
    <>
      <script
        type="application/ld+json"
        // JSON-LD for local SEO; content is static and trusted.
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
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
