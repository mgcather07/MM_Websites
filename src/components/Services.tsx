import { services } from "@/content/services";
import styles from "./Services.module.css";

export default function Services() {
  return (
    <section id="services" className={`band ${styles.section}`} aria-labelledby="services-title">
      <div className="container">
        <div className={styles.header}>
          <span className="eyebrow">What we do</span>
          <h2 id="services-title" className="h2">
            Everything it takes to get you found
          </h2>
        </div>

        <div className={styles.grid}>
          {services.map((service) => (
            <article key={service.title} className={styles.card}>
              <h3 className={styles.cardTitle}>{service.title}</h3>
              <p className={styles.cardBody}>{service.body}</p>
            </article>
          ))}
        </div>

        <div className={styles.pricing}>
          <p className={styles.pricingText}>
            <b className={styles.pricingLead}>Websites start at $500.</b> Final
            price depends on pages and features — we&apos;ll quote it flat and in
            writing before we start.
          </p>
          <a href="#quote" className={`btn btn-maroon ${styles.pricingBtn}`}>
            Get my free quote
          </a>
        </div>
      </div>
    </section>
  );
}
