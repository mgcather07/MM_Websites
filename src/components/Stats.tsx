"use client";

import { useEffect, useRef, useState } from "react";
import styles from "./Stats.module.css";

type Stat = {
  value: number;
  prefix?: string;
  suffix?: string;
  label: string;
};

const STATS: Stat[] = [
  { value: 500, prefix: "$", label: "Websites starting price" },
  { value: 9, label: "Services under one roof" },
  { value: 100, suffix: "%", label: "Yours — you own the site" },
  { value: 24, suffix: "hr", label: "We reply within" },
];

const DURATION = 1400;

function CountUp({ stat, start }: { stat: Stat; start: boolean }) {
  const [n, setN] = useState(0);

  useEffect(() => {
    if (!start) return;
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (reduce) {
      setN(stat.value);
      return;
    }
    let raf = 0;
    let startTs = 0;
    const tick = (ts: number) => {
      if (!startTs) startTs = ts;
      const t = Math.min(1, (ts - startTs) / DURATION);
      // easeOutCubic
      const eased = 1 - Math.pow(1 - t, 3);
      setN(Math.round(stat.value * eased));
      if (t < 1) raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [start, stat.value]);

  return (
    <span className={styles.value}>
      {stat.prefix}
      {n.toLocaleString("en-US")}
      {stat.suffix}
    </span>
  );
}

export default function Stats() {
  const ref = useRef<HTMLDivElement>(null);
  const [shown, setShown] = useState(false);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const io = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting) {
          setShown(true);
          io.disconnect();
        }
      },
      { threshold: 0.4 },
    );
    io.observe(el);
    return () => io.disconnect();
  }, []);

  return (
    <section className={styles.section} ref={ref} aria-label="By the numbers">
      <div className={`container ${styles.grid}`}>
        {STATS.map((stat) => (
          <div key={stat.label} className={styles.stat}>
            <CountUp stat={stat} start={shown} />
            <span className={styles.label}>{stat.label}</span>
          </div>
        ))}
      </div>
    </section>
  );
}
