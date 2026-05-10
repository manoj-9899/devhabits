// src/components/ui/SegmentedControl.tsx
// ─────────────────────────────────────────────────────────────────────────────
// Pill-filter pattern used for Today's filter, Analytics range picker, etc.
// Replaces 3+ inline reimplementations across pages.
// ─────────────────────────────────────────────────────────────────────────────
import clsx from 'clsx';
import type { ReactNode } from 'react';

export interface Segment<T extends string | number> {
  value: T;
  label: ReactNode;
  count?: number;
}

interface SegmentedControlProps<T extends string | number> {
  value: T;
  options: Segment<T>[];
  onChange: (value: T) => void;
  size?: 'sm' | 'md';
  ariaLabel?: string;
  className?: string;
}

export function SegmentedControl<T extends string | number>({
  value,
  options,
  onChange,
  size = 'md',
  ariaLabel,
  className,
}: SegmentedControlProps<T>) {
  const padding = size === 'sm' ? 'px-2.5 py-1 text-[11px]' : 'px-3 py-1.5 text-xs';

  return (
    <div
      role="tablist"
      aria-label={ariaLabel}
      className={clsx(
        'inline-flex items-center gap-1 p-1 bg-[#161b22] rounded-lg border border-[#30363d]',
        className
      )}
    >
      {options.map((opt) => {
        const active = opt.value === value;
        return (
          <button
            key={String(opt.value)}
            role="tab"
            aria-selected={active}
            onClick={() => onChange(opt.value)}
            className={clsx(
              'rounded-md font-medium transition-colors duration-150 cursor-pointer',
              'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#388bfd]/40',
              padding,
              active
                ? 'bg-[#21262d] text-[#e6edf3] shadow-sm'
                : 'text-[#8b949e] hover:text-[#e6edf3]'
            )}
          >
            <span className="inline-flex items-center gap-1.5">
              {opt.label}
              {typeof opt.count === 'number' && (
                <span
                  className={clsx(
                    'text-[10px] font-mono px-1 rounded',
                    active ? 'text-[#8b949e] bg-[#0d1117]' : 'text-[#6e7681]'
                  )}
                >
                  {opt.count}
                </span>
              )}
            </span>
          </button>
        );
      })}
    </div>
  );
}
