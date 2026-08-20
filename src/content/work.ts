export type WorkItem = {
  title: string;
  meta: string;
  /** Path under /public, e.g. "/work/ridgeline.webp". Empty = show placeholder. */
  image?: string;
};

/**
 * Recent builds. PLACEHOLDER entries — the client swaps these for real jobs and
 * drops screenshots into /public/work as they finish work.
 */
export const work: WorkItem[] = [
  {
    title: "Ridgeline Roofing",
    meta: "5 pages · quote form · Google profile",
  },
  {
    title: "Magnolia Salon",
    meta: "Online booking · gift cards",
  },
  {
    title: "Cather Lawn & Land",
    meta: "One-pager · click-to-call · SEO",
  },
];
