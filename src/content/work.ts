export type WorkItem = {
  title: string;
  meta: string;
  /** Longer description shown on the full /work page (not the home preview). */
  blurb?: string;
  /** Path under /public, e.g. "/images/work/name.jpg". Empty = show placeholder. */
  image?: string;
  /** Live site URL. When set, the card links out to it in a new tab. */
  url?: string;
};

/**
 * Recent builds. PLACEHOLDER entries — swap these for real jobs.
 *
 * The `image` paths point at /public/images/work/. Drop a screenshot with the
 * matching filename and it appears automatically; until then each card shows a
 * neutral placeholder (see public/images/README.md).
 */
export const work: WorkItem[] = [
  {
    title: "Bowfishing Association of America",
    meta: "Non-profit membership site · online sign-ups · events",
    blurb:
      "A membership site for a national non-profit — members can sign up and renew online, and the events stay up to date in one place.",
    image: "/images/work/bowfishing-association.jpg",
    url: "https://www.bowfishingassociation.com",
  },
  {
    title: "Lumière Beauty Studio",
    meta: "Bridal makeup studio · portfolio · online booking",
    blurb:
      "A bridal makeup studio's site built to show the work — a clean photo portfolio up front and an easy way for brides to book.",
    image: "/images/work/lumiere-beauty.jpg",
    url: "https://lumierebeauty.web.app",
  },
  {
    title: "Hometown Handyman Co.",
    meta: "Home services · services grid · quote CTA",
    blurb:
      "A home-services site with a clear list of what they do and a quote request front and center, so calls and leads come in.",
    image: "/images/work/hometown-handyman.jpg",
    url: "https://hometownhandyman.web.app",
  },
];

/** What every build delivers — shown on the /work page. */
export const everyBuild: { title: string; body: string }[] = [
  {
    title: "Looks professional",
    body: "A clean, current design that makes a small business look established and trustworthy.",
  },
  {
    title: "Loads fast",
    body: "Lightweight pages that open quickly on a phone, so visitors don't bounce before they see you.",
  },
  {
    title: "Easy to find",
    body: "Built the way Google expects, with local search in mind, so the right customers can find you.",
  },
  {
    title: "Easy to act on",
    body: "Clear calls to action — call, text, book or request a quote — so a visit turns into a customer.",
  },
];

/** The kinds of small businesses we build for — shown on the /work page. */
export const whoWeBuildFor: { title: string; body: string }[] = [
  {
    title: "Contractors & home services",
    body: "Plumbers, electricians, handymen, lawn care, roofing — trades that live and die by the phone ringing.",
  },
  {
    title: "Salons & studios",
    body: "Beauty, barbers, makeup, fitness and wellness — visual sites with easy booking.",
  },
  {
    title: "Local shops & restaurants",
    body: "Storefronts and eateries that need hours, a menu or catalog, and directions front and center.",
  },
  {
    title: "Non-profits & clubs",
    body: "Membership, sign-ups, events and donations — organized so volunteers can keep it going.",
  },
  {
    title: "Professional services",
    body: "Accountants, agents, consultants and clinics that need to look credible and capture inquiries.",
  },
  {
    title: "Brand-new businesses",
    body: "Just getting started? We'll set up the website, domain, email and Google presence together.",
  },
];

export const workFaq: { q: string; a: string }[] = [
  {
    q: "Will my website be custom, or a template?",
    a: "Custom. We design around your business, your services and your photos — your site won't look like anyone else's.",
  },
  {
    q: "What if I don't have photos or a logo?",
    a: "That's fine. We can work with what you have, use quality stock where it fits, and we also do logos and branding if you need them.",
  },
  {
    q: "Can you match my existing brand?",
    a: "Absolutely — send us your logo and colors and we'll build around them. If you don't have a brand yet, we can create one.",
  },
  {
    q: "Can you link my Google reviews and social media?",
    a: "Yes. We can tie in your Google Business Profile, reviews, Facebook, Instagram and anywhere else your customers find you.",
  },
];
