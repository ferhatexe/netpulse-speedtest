import React, { useRef, useState, useEffect } from 'react';

/**
 * Fade/slide a block in the first time it enters the viewport.
 *
 * This used to be the only consumer of framer-motion in the whole app — roughly
 * 45KB gzipped in the initial bundle for one fade. IntersectionObserver plus a
 * CSS transition does the same job with no dependency.
 *
 * Three deliberate guards, because "content never appears" is a far worse
 * failure than "content appears without animating":
 *
 *  - Anything already on screen at mount is revealed synchronously, with no
 *    transition. Fading in above-the-fold content would only push out LCP.
 *  - A timeout reveals the block regardless if the observer never reports, which
 *    is what happens in environments that do not run the compositor.
 *  - Reduced-motion and missing IntersectionObserver both short-circuit to
 *    visible.
 */
const REVEAL_FALLBACK_MS = 1200;

export default function ScrollReveal({
  children,
  delay = 0,
  duration = 0.55,
  yOffset = 32,
  className = '',
  scale = 0.98
}) {
  const ref = useRef(null);
  const [revealed, setRevealed] = useState(false);
  // Skips the transition for content that was visible from the start
  const [immediate, setImmediate] = useState(false);

  useEffect(() => {
    const node = ref.current;
    if (!node) return;

    const reduced = window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;
    if (reduced || typeof IntersectionObserver === 'undefined') {
      setImmediate(true);
      setRevealed(true);
      return;
    }

    // IntersectionObserver always delivers one callback describing the current
    // position, so the first report tells us whether this block started on
    // screen. Reading getBoundingClientRect() here instead forced a synchronous
    // layout per wrapper on mount, which Lighthouse flagged as forced reflow.
    let first = true;
    const observer = new IntersectionObserver(
      (entries) => {
        const visible = entries.some((e) => e.isIntersecting);
        if (first) {
          first = false;
          // Above the fold at load: show it at once. Fading in content that is
          // already on screen only delays LCP.
          if (visible) setImmediate(true);
        }
        if (visible) {
          setRevealed(true);
          observer.disconnect();
        }
      },
      { rootMargin: '-40px' }
    );
    observer.observe(node);

    // Safety net: never leave content invisible because the observer stayed quiet
    const fallback = setTimeout(() => setRevealed(true), REVEAL_FALLBACK_MS);

    return () => {
      observer.disconnect();
      clearTimeout(fallback);
    };
  }, []);

  return (
    <div
      ref={ref}
      className={className}
      style={{
        opacity: revealed ? 1 : 0,
        transform: revealed ? 'none' : `translateY(${yOffset}px) scale(${scale})`,
        transition: immediate
          ? 'none'
          : `opacity ${duration}s cubic-bezier(0.16, 1, 0.3, 1) ${delay}s, transform ${duration}s cubic-bezier(0.16, 1, 0.3, 1) ${delay}s`,
        willChange: revealed ? 'auto' : 'opacity, transform'
      }}
    >
      {children}
    </div>
  );
}
