"use client";

import { useEffect, useState } from "react";
import { ref, onValue } from "firebase/database";
import { rtdb } from "@/lib/firebaseClient";
import { site } from "@/content/site";
import styles from "./Quote.module.css";

type QuoteItem = { title?: string; description?: string; price?: number };

type Quote = {
  quoteNumber?: string;
  status?: string;
  subtitle?: string;
  preparedFor?: { name?: string; org?: string; location?: string };
  summary?: string;
  items?: QuoteItem[] | Record<string, QuoteItem>;
  terms?: string;
  feesNote?: string;
  supportNote?: string;
  createdAt?: number;
};

const money = (n?: number) =>
  "$" +
  Number(n || 0).toLocaleString("en-US", {
    maximumFractionDigits: Number(n || 0) % 1 ? 2 : 0,
  });

function itemList(items: Quote["items"]): QuoteItem[] {
  if (!items) return [];
  return Array.isArray(items) ? items.filter(Boolean) : Object.values(items);
}

export default function QuotePage() {
  const [id, setId] = useState<string | null>(null);
  const [quote, setQuote] = useState<Quote | null | undefined>(undefined);

  useEffect(() => {
    const q = new URLSearchParams(window.location.search).get("id");
    setId(q);
    if (!q) {
      setQuote(null);
      return;
    }
    return onValue(
      ref(rtdb, "quotes/" + q),
      (s) => setQuote(s.exists() ? (s.val() as Quote) : null),
      () => setQuote(null),
    );
  }, []);

  if (quote === undefined) {
    return <div className={styles.state}>Loading quote…</div>;
  }
  if (quote === null) {
    return (
      <div className={styles.state}>
        <h1>Quote not found</h1>
        <p>
          This quote link isn&apos;t valid. Please check with M&amp;M Websites at{" "}
          <a href={site.phoneHref}>{site.phone}</a>.
        </p>
      </div>
    );
  }

  const items = itemList(quote.items);
  const total = items.reduce((sum, it) => sum + Number(it.price || 0), 0);

  return (
    <div className={styles.wrap}>
      <div className={styles.actions}>
        <button className={styles.printBtn} onClick={() => window.print()}>
          Print / Save as PDF
        </button>
      </div>

      <article className={styles.sheet}>
        <div className={styles.topbar} />

        <header className={styles.head}>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img className={styles.logo} src="/images/logo/logo-full.png" alt="M&M Websites" />
          <div className={styles.headRight}>
            <h1 className={styles.title}>PROJECT QUOTE</h1>
            {quote.subtitle && <p className={styles.subtitle}>{quote.subtitle}</p>}
          </div>
        </header>

        <hr className={styles.rule} />

        <section className={styles.parties}>
          <div>
            <p className={styles.label}>Prepared for</p>
            <p className={styles.partyName}>
              {[quote.preparedFor?.name, quote.preparedFor?.org]
                .filter(Boolean)
                .join(" / ")}
            </p>
            {quote.preparedFor?.location && (
              <p className={styles.partySub}>{quote.preparedFor.location}</p>
            )}
          </div>
          <div className={styles.by}>
            <p className={styles.label}>Prepared by</p>
            <p className={styles.partyName}>M&amp;M Websites</p>
            <p className={styles.partySub}>
              {site.phone} &nbsp;|&nbsp; {site.email}
            </p>
            <p className={styles.partySub}>www.mmwebsites.com</p>
          </div>
        </section>

        {quote.summary && (
          <div className={styles.summary}>
            <p>{quote.summary}</p>
          </div>
        )}

        <div className={styles.itemsHead}>
          <span>Project Component</span>
          <span>Price</span>
        </div>

        <div className={styles.items}>
          {items.map((it, i) => (
            <div className={styles.item} key={i}>
              <div className={styles.itemMain}>
                <div className={styles.itemTitle}>{it.title}</div>
                {it.description && (
                  <div className={styles.itemDesc}>{it.description}</div>
                )}
              </div>
              <div className={styles.itemPrice}>{money(it.price)}</div>
            </div>
          ))}
        </div>

        <div className={styles.total}>
          <div>
            <div className={styles.totalLabel}>Complete Project Total</div>
            {quote.terms && <div className={styles.terms}>{quote.terms}</div>}
            {quote.feesNote && <div className={styles.fees}>{quote.feesNote}</div>}
          </div>
          <div className={styles.totalValue}>{money(total)}</div>
        </div>

        <footer className={styles.foot}>
          <div>
            {quote.supportNote && (
              <>
                <p className={styles.label}>Optional ongoing support</p>
                <p className={styles.supportNote}>{quote.supportNote}</p>
              </>
            )}
          </div>
          <p className={styles.tagline}>Professional Websites. Built for Business.</p>
        </footer>
      </article>
    </div>
  );
}
