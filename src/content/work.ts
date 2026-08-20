export type WorkItem = {
  title: string;
  meta: string;
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
    image: "/images/work/bowfishing-association.jpg",
    url: "https://www.bowfishingassociation.com",
  },
  {
    title: "Lumière Beauty Studio",
    meta: "Bridal makeup studio · portfolio · online booking",
    image: "/images/work/lumiere-beauty.jpg",
    url: "https://lumierebeauty.web.app",
  },
  {
    title: "Cather Lawn & Land",
    meta: "One-pager · click-to-call · SEO",
    image: "/images/work/cather-lawn.jpg",
  },
];
