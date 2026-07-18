"use client";

import { motion, useReducedMotion } from "framer-motion";
import type { ReactNode } from "react";

export function Reveal({
  children,
  delay = 0,
  y = 24,
  className,
  immediate = false,
}: {
  children: ReactNode;
  delay?: number;
  y?: number;
  className?: string;
  /**
   * Animate on mount instead of on scroll-into-view. Use for above-the-fold
   * content: whileInView with `once` does not reliably fire for elements
   * already in the viewport at initial paint, leaving the hero blank until the
   * first scroll.
   */
  immediate?: boolean;
}) {
  const reduceMotion = useReducedMotion();
  const target = { opacity: 1, y: 0 };
  const trigger = immediate
    ? { animate: target }
    : { whileInView: target, viewport: { once: true, margin: "-60px" } };

  if (reduceMotion) {
    return (
      <motion.div initial={{ opacity: 1, y: 0 }} animate={target} className={className}>
        {children}
      </motion.div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y }}
      {...trigger}
      transition={{ type: "spring", duration: 0.75, bounce: 0.18, delay }}
      className={className}
    >
      {children}
    </motion.div>
  );
}
