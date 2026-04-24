// src/components/ui/Button.tsx
import clsx from 'clsx';
import type { ButtonHTMLAttributes, ReactNode } from 'react';

type Variant = 'primary' | 'secondary' | 'ghost' | 'danger' | 'success';
type Size    = 'sm' | 'md' | 'lg';

const VARIANTS: Record<Variant, string> = {
  primary:   'bg-gradient-to-b from-[#2ea043] to-[#238636] hover:from-[#3fb950] hover:to-[#2ea043] text-white border border-[#2ea043] shadow-[0_1px_4px_rgba(35,134,54,0.4)] active:from-[#196c2e] active:to-[#196c2e]',
  secondary: 'bg-[#21262d] hover:bg-[#30363d] text-[#e6edf3] border border-[#30363d] active:bg-[#161b22] shadow-sm',
  ghost:     'bg-transparent hover:bg-[#30363d]/60 text-[#8b949e] hover:text-[#e6edf3] border border-transparent',
  danger:    'bg-[#3d1c1c] hover:bg-[#da3633]/20 text-[#f85149] border border-[#da3633]/40 active:bg-[#da3633]/30',
  success:   'bg-[#238636] hover:bg-[#2ea043] text-white border border-[#2ea043] shadow-sm',
};

const SIZES: Record<Size, string> = {
  sm:  'px-2.5 py-1 text-xs gap-1.5',
  md:  'px-3.5 py-1.5 text-sm gap-2',
  lg:  'px-5 py-2 text-sm gap-2',
};

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?:  Variant;
  size?:     Size;
  icon?:     ReactNode;
  loading?:  boolean;
  children?: ReactNode;
}

export function Button({
  variant = 'secondary',
  size = 'md',
  icon,
  loading,
  children,
  className,
  disabled,
  ...rest
}: ButtonProps) {
  return (
    <button
      className={clsx(
        'inline-flex items-center justify-center rounded-md font-medium',
        'transition-colors duration-100 cursor-pointer select-none',
        'disabled:opacity-50 disabled:cursor-not-allowed',
        VARIANTS[variant],
        SIZES[size],
        className
      )}
      disabled={disabled || loading}
      {...rest}
    >
      {loading
        ? <Spinner size={size === 'sm' ? 12 : 14} />
        : icon && <span className="shrink-0">{icon}</span>
      }
      {children}
    </button>
  );
}

function Spinner({ size = 14 }: { size?: number }) {
  return (
    <svg
      width={size} height={size} viewBox="0 0 24 24" fill="none"
      className="animate-spin"
    >
      <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="3" strokeLinecap="round"
        strokeDasharray="60" strokeDashoffset="20" />
    </svg>
  );
}
