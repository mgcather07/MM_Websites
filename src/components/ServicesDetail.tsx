import Link from "next/link";
import Reveal from "./Reveal";
import TiltCard from "./TiltCard";
import {
  serviceGroups,
  includedWithEverySite,
} from "@/content/servicesDetail";
import styles from "./ServicesDetail.module.css";

export default function ServicesDetail() {
  return (
    <>
      {/* What comes with every website */}
      <section className={`band ${styles.included}`} aria-labelledby="included-title">
        <div className="container">
          <Reveal>
            <div className={styles.includedHead}>
              <span className="eyebrow">The baseline</span>
              <h2 id="included-title" className="h2">
                What comes with every website
              </h2>
              <p className={styles.includedLede}>
                No matter which services you pick, every site we build starts here.
              </p>
            </div>
          </Reveal>
          <div className={styles.includedGrid}>
            {includedWithEverySite.map((item, i) => (
              <Reveal key={item.title} delay={(i % 3) * 60}>
                <div className={styles.includedItem}>
                  <span className={styles.check} aria-hidden="true">
                    ✓
                  </span>
                  <div>
                    <h3 className={styles.includedItemTitle}>{item.title}</h3>
                    <p className={styles.includedItemBody}>{item.body}</p>
                  </div>
                </div>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      {/* Detailed services, grouped */}
      {serviceGroups.map((group, gi) => (
        <section
          key={group.heading}
          className={`band ${styles.group} ${gi % 2 === 1 ? styles.alt : ""}`}
        >
          <div className="container">
            <Reveal>
              <div className={styles.groupHead}>
                <span className="eyebrow">{group.eyebrow}</span>
                <h2 className="h2">{group.heading}</h2>
                <p className={styles.groupIntro}>{group.intro}</p>
              </div>
            </Reveal>
            <div className={styles.cards}>
              {group.services.map((service, i) => (
                <Reveal key={service.title} delay={(i % 2) * 80}>
                  <TiltCard as="article" className={styles.card}>
                    <h3 className={styles.cardTitle}>{service.title}</h3>
                    <p className={styles.cardBlurb}>{service.blurb}</p>
                    <ul className={styles.includes}>
                      {service.includes.map((inc) => (
                        <li key={inc}>{inc}</li>
                      ))}
                    </ul>
                  </TiltCard>
                </Reveal>
              ))}
            </div>
          </div>
        </section>
      ))}

      {/* Pricing explainer */}
      <section className={`band ${styles.pricing}`} aria-labelledby="pricing-title">
        <div className="container">
          <Reveal>
            <div className={styles.pricingCard}>
              <div>
                <span className="eyebrow">Pricing</span>
                <h2 id="pricing-title" className={styles.pricingTitle}>
                  Flat pricing, quoted in writing
                </h2>
                <p className={styles.pricingBody}>
                  Websites start at <b>$500</b>. What you pay depends on how many
                  pages and features you need — not an hourly meter. We put the
                  full price in writing before any work begins, so you always know
                  what you&apos;re getting and what it costs. Third-party costs
                  like a domain or payment processing are always separate and
                  clearly listed.
                </p>
                <ul className={styles.pricingPoints}>
                  <li>No hourly billing and no surprise invoices</li>
                  <li>A 40% deposit to start; the rest as we go</li>
                  <li>Optional maintenance at $75/month — cancel anytime</li>
                </ul>
              </div>
              <Link href="/contact" className={`btn btn-maroon ${styles.pricingBtn}`}>
                Get my free quote
              </Link>
            </div>
          </Reveal>
        </div>
      </section>
    </>
  );
}
