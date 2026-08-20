export type WorkItem = {
  title: string;
  meta: string;
  /** Path under /public, e.g. "/work/ridgeline.webp". Empty = show placeholder. */
  image?: string;
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
    title: "Ridgeline Roofing",
    meta: "5 pages · quote form · Google profile",
    image: "/images/work/ridgeline-roofing.jpg",
  },
  {
    title: "Magnolia Salon",
    meta: "Online booking · gift cards",
    image: "/images/work/magnolia-salon.jpg",
  },
  {
    title: "Cather Lawn & Land",
    meta: "One-pager · click-to-call · SEO",
    image: "/images/work/cather-lawn.jpg",
  },
];
