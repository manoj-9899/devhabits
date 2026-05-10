// src/components/ui/Card.tsx
// ─────────────────────────────────────────────────────────────────────────────
// Generic card primitive. Replaces every ad-hoc
// `bg-[#161b22] border border-[#30363d] rounded-xl` pattern in the codebase.
// ─────────────────────────────────────────────────────────────────────────────
import clsx from 'clsx';
import type { HTMLAttributes, ReactNode } from 'react';

type Padding = 'none' | 'sm' | 'md' | 'lg';
type Variant = 'default' | 'subtle' | 'inset';
type Radius = 'md' | 'lg' | 'xl';

const PADDING: Record<Padding, string> = {
  none: 'p-0',
  sm: 'p-3',
  md: 'p-4',
  lg: 'p-5',
};

const VARIANT: Record<Variant, string> = {
  default: 'bg-[#161b22]/80 border-[#30363d]',
  subtle: 'bg-[#0d1117] border-[#30363d]',
  inset: 'bg-[#0a0e13] border-[#21262d]',
};

const RADIUS: Record<Radius, string> = {
  md: 'rounded-md',
  lg: 'rounded-lg',
  xl: 'rounded-xl',
};

interface CardProps extends HTMLAttributes<HTMLDivElement> {
  padding?: Padding;
  variant?: Variant;
  radius?: Radius;
  interactive?: boolean;
  children?: ReactNode;
}

export function Card({
  padding = 'md',
  variant = 'default',
  radius = 'xl',
  interactive,
  className,
  children,
  ...rest
}: CardProps) {
  return (
    <div
      className={clsx(
        'border transition-colors duration-200',
        RADIUS[radius],
        PADDING[padding],
        VARIANT[variant],
        interactive &&
          'cursor-pointer hover:border-[#484f58] hover:bg-[#161b22] focus-visible:ring-2 focus-visible:ring-[#388bfd]/50 focus-visible:outline-none',
        className
      )}
      {...rest}
    >
      {children}
    </div>
  );
}

// Optional sub-components for consistent internal structure.
export function CardHeader({ className, children, ...rest }: HTMLAttributes<HTMLDivElement>) {
  return (
    <div className={clsx('flex items-start justify-between gap-3', className)} {...rest}>
      {children}
    </div>
  );
}

export function CardTitle({ className, children, ...rest }: HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={clsx(
        'text-[11px] text-[#8b949e] font-semibold uppercase tracking-widest',
        className
      )}
      {...rest}
    >
      {children}
    </div>
  );
}
