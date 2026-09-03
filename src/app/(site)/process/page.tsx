import PageHeader from "@/components/PageHeader";
import ProcessDetail from "@/components/ProcessDetail";
import FeatureGrid from "@/components/FeatureGrid";
import Faq from "@/components/Faq";
import CtaBand from "@/components/CtaBand";
import { whatWeNeed, processFaq } from "@/content/processDetail";
import { pageMeta } from "@/lib/meta";

export const metadata = pageMeta({
  title: "How It Works",
  description:
    "Our simple process: free quote, content & photos, build & review, and launch. Most sites go live in about two to three weeks — here's exactly what to expect.",
  path: "/process",
});

export default function ProcessPage() {
  return (
    <>
      <PageHeader
        eyebrow="How it works"
        title="A simple process, start to finish"
        lead="No agency runaround and no mystery. You'll always know what's happening, what we need from you, and when your site goes live — usually in about two to three weeks."
      />
      <ProcessDetail />
      <FeatureGrid
        eyebrow="Your part"
        heading="What we need from you"
        intro="We keep it light. The more of this you have ready, the faster it goes — but don't worry if you're missing pieces."
        items={whatWeNeed}
        columns={2}
        variant="check"
        alt
      />
      <Faq heading="Questions about the process" items={processFaq} />
      <CtaBand
        title="Ready to start?"
        body="It begins with a free quote — usually the same day. Tell us about your business."
      />
    </>
  );
}
