// src/components/ui/AnimatedNumber.tsx
// ─────────────────────────────────────────────────────────────────────────────
// Tweens a numeric value over a short duration (rAF). Used inside stat cards
// so KPIs count up from 0 → value on mount and animate on update.
// ─────────────────────────────────────────────────────────────────────────────
import { useEffect, useRef, useState } from 'react';

interface AnimatedNumberProps {
  value: number;
  duration?: number; // ms
  format?: (n: number) => string;
  className?: string;
}

export function AnimatedNumber({
  value,
  duration = 600,
  format = (n) => Math.round(n).toString(),
  className,
}: AnimatedNumberProps) {
  const [display, setDisplay] = useState(value);
  const fromRef = useRef(value);
  const rafRef = useRef<number | null>(null);

  useEffect(() => {
    const target = value;
    const start = fromRef.current;
    if (start === target) {
      setDisplay(target);
      return;
    }

    const t0 = performance.now();
    const tick = (now: number) => {
      const t = Math.min(1, (now - t0) / duration);
      const eased = 1 - Math.pow(1 - t, 3); // ease-out cubic
      const next = start + (target - start) * eased;
      setDisplay(next);
      if (t < 1) {
        rafRef.current = requestAnimationFrame(tick);
      } else {
        fromRef.current = target;
      }
    };
    rafRef.current = requestAnimationFrame(tick);

    return () => {
      if (rafRef.current !== null) cancelAnimationFrame(rafRef.current);
    };
  }, [value, duration]);

  return <span className={className}>{format(display)}</span>;
}
