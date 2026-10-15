"use client";

import { useEffect, useRef, useState } from "react";

/** Tween 0→1 whenever `key` changes. Respects prefers-reduced-motion (jumps to 1). */
export function useProgress(key: unknown, durationMs = 900): number {
  const [t, setT] = useState(1);
  const first = useRef(true);
  useEffect(() => {
    if (typeof window === "undefined") return;
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (reduce) { setT(1); return; }
    // First render: animate when the element is shown; later changes: re-run.
    let raf = 0;
    const start = performance.now();
    setT(0);
    const step = (now: number) => {
      const p = Math.min(1, (now - start) / durationMs);
      setT(1 - (1 - p) ** 3);
      if (p < 1) raf = requestAnimationFrame(step);
    };
    raf = requestAnimationFrame(step);
    first.current = false;
    return () => cancelAnimationFrame(raf);
  }, [key, durationMs]);
  return t;
}

/** True once the element has entered the viewport (one-shot). */
export function useInView<T extends Element>(rootMargin = "0px 0px -15% 0px"): [React.RefObject<T | null>, boolean] {
  const ref = useRef<T>(null);
  const [seen, setSeen] = useState(false);
  useEffect(() => {
    const el = ref.current;
    if (!el || seen) return;
    if (typeof IntersectionObserver === "undefined") { setSeen(true); return; }
    const io = new IntersectionObserver(([e]) => { if (e?.isIntersecting) { setSeen(true); io.disconnect(); } }, { rootMargin });
    io.observe(el);
    return () => io.disconnect();
  }, [rootMargin, seen]);
  return [ref, seen];
}
