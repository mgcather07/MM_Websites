import Link from "next/link";
import Reveal from "./Reveal";
import { services } from "@/content/services";
import styles from "./Services.module.css";

/**
 * `preview` (used on the homepage) shows a curated subset with a link to the
 * full Services page. Without it (the /services page) it shows everything plus
 * the pricing block and a quote CTA.
 */
export default function Services({ preview = false }: { preview?: boolean }) {
  const list = preview ? services.slice(0, 6) : services;

  return (
    <section id="services" className={`band ${styles.section}`} aria-labelledby="services-title">
      <div className="container">
        <Reveal>
          <div className={styles.header}>
            <span className="eyebrow">What we do</span>
            <h2 id="services-title" className="h2">
              {preview
                ? "What we can build for you"
                : "Everything it takes to get you found"}
            </h2>
          </div>
        </Reveal>

        <div className={styles.grid}>
          {list.map((service, i) => (
            <Reveal key={service.title} delay={(i % 3) * 70}>
              <article className={`${styles.card} mm-card-lift`}>
                <h3 className={styles.cardTitle}>{service.title}</h3>
                <p className={styles.cardBody}>{service.body}</p>
              </article>
            </Reveal>
          ))}
        </div>

        <Reveal>
          <div className={styles.pricing}>
            {preview ? (
              <>
                <p className={styles.pricingText}>
                  <b className={styles.pricingLead}>…and more.</b> Hosting, SEO,
                  logos, online stores — see everything we offer.
                </p>
                <Link href="/services" className={`btn btn-maroon ${styles.pricingBtn}`}>
                  View all services
                </Link>
              </>
            ) : (
              <>
                <p className={styles.pricingText}>
                  <b className={styles.pricingLead}>Websites start at $500.</b> Final
                  price depends on pages and features — we&apos;ll quote it flat and
                  in writing before we start.
                </p>
                <Link href="/contact" className={`btn btn-maroon ${styles.pricingBtn}`}>
                  Get my free quote
                </Link>
              </>
            )}
          </div>
        </Reveal>
      </div>
    </section>
  );
}
