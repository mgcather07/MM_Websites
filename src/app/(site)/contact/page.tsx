import PageHeader from "@/components/PageHeader";
import QuoteForm from "@/components/QuoteForm";
import FeatureGrid from "@/components/FeatureGrid";
import Faq from "@/components/Faq";
import { pageMeta } from "@/lib/meta";

export const metadata = pageMeta({
  title: "Get a Free Quote",
  description:
    "Tell us about your business and we'll send a flat price and a timeline — usually the same day. Call or text (205) 914-1019. Serving Gardendale, Birmingham and North Alabama.",
  path: "/contact",
});

const whatHappensNext = [
  {
    title: "You send the details",
    body: "Fill out the form or call — whatever's easier. The more you tell us about your business, the sharper the quote.",
  },
  {
    title: "We reply with a flat price",
    body: "Usually the same day. A clear price and a realistic timeline, in writing, with no obligation and no sales calls.",
  },
  {
    title: "We get started",
    body: "Happy with the quote? A 40% deposit kicks things off, and you'll see your site live in about a week.",
  },
];

const contactFaq = [
  {
    q: "How soon will I hear back?",
    a: "Usually the same business day, and always within one. We read every request personally — you'll talk to Michael or Mandy, not a call center.",
  },
  {
    q: "Do I have to fill out the form?",
    a: "Not at all. Call or text (205) 914-1019 if that's easier — the form just helps us come to the conversation prepared.",
  },
  {
    q: "Is the quote really free?",
    a: "Yes. We'll send a flat price with no obligation. You only pay if you decide to move forward.",
  },
  {
    q: "What areas do you serve?",
    a: "We're based in Gardendale and work with businesses across the Birmingham area and North Alabama — and remotely for clients anywhere.",
  },
];

export default function ContactPage() {
  return (
    <>
      <PageHeader
        eyebrow="Get a free quote"
        title="Let's build your website"
        lead="Tell us a little about your business and we'll come back with a flat price and a timeline — usually the same day. Prefer to talk? Call or text (205) 914-1019."
      />
      <QuoteForm />
      <FeatureGrid
        eyebrow="What happens next"
        heading="Three simple steps"
        items={whatHappensNext}
        columns={3}
        variant="number"
        alt
      />
      <Faq heading="Before you reach out" items={contactFaq} />
    </>
  );
}
