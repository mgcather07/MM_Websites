import PageHeader from "@/components/PageHeader";
import ServicesDetail from "@/components/ServicesDetail";
import Faq from "@/components/Faq";
import CtaBand from "@/components/CtaBand";
import { servicesFaq } from "@/content/servicesDetail";
import { pageMeta } from "@/lib/meta";

export const metadata = pageMeta({
  title: "Services",
  description:
    "Web design, redesign, hosting & domain setup, local SEO, Google Business Profile, logo & branding, booking forms and online stores — for small businesses in Gardendale, Birmingham and North Alabama.",
  path: "/services",
});

export default function ServicesPage() {
  return (
    <>
      <PageHeader
        eyebrow="Services"
        title="Everything it takes to get your business online"
        lead="From a brand-new website to getting found on Google, we handle the whole thing — design, build, hosting and the day-to-day upkeep — so you can get back to running your business."
      />
      <ServicesDetail />
      <Faq heading="Questions about our services" items={servicesFaq} />
      <CtaBand />
    </>
  );
}
