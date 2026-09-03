import PageHeader from "@/components/PageHeader";
import Work from "@/components/Work";
import FeatureGrid from "@/components/FeatureGrid";
import Faq from "@/components/Faq";
import CtaBand from "@/components/CtaBand";
import { everyBuild, whoWeBuildFor, workFaq } from "@/content/work";
import { pageMeta } from "@/lib/meta";

export const metadata = pageMeta({
  title: "Our Work",
  description:
    "Recent websites we've built for small businesses across Alabama — clean, fast, custom sites that help customers find you. See our work and the kinds of businesses we build for.",
  path: "/work",
});

export default function WorkPage() {
  return (
    <>
      <PageHeader
        eyebrow="Our work"
        title="Websites that do a job"
        lead="Every business here got a custom site built to look professional, load fast, and turn visitors into customers. Here's a look at some of our recent builds."
      />
      <Work />
      <FeatureGrid
        eyebrow="What you get"
        heading="What goes into every build"
        intro="No matter the business, every site we make is built to do the same four things well."
        items={everyBuild}
        columns={4}
        variant="check"
        alt
      />
      <FeatureGrid
        eyebrow="Who we build for"
        heading="Small businesses of every kind"
        intro="If you serve customers locally, we can build for you. A few of the industries we work with:"
        items={whoWeBuildFor}
        columns={3}
      />
      <Faq heading="Questions about our work" items={workFaq} />
      <CtaBand
        title="Want one like these?"
        body="We'll build you a clean, fast website you own — flat-priced, with no monthly surprises."
      />
    </>
  );
}
