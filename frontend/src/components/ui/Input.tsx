// src/components/ui/Input.tsx
// ─────────────────────────────────────────────────────────────────────────────
// Labeled text input with optional hint, error, leading icon, and required mark.
// ─────────────────────────────────────────────────────────────────────────────
import clsx from 'clsx';
import { forwardRef, useId } from 'react';
import type { InputHTMLAttributes, ReactNode } from 'react';

interface InputProps extends Omit<InputHTMLAttributes<HTMLInputElement>, 'size'> {
  label?: string;
  hint?: string;
  error?: string;
  leadingIcon?: ReactNode;
  required?: boolean;
  containerClassName?: string;
}

export const Input = forwardRef<HTMLInputElement, InputProps>(function Input(
  { label, hint, error, leadingIcon, required, className, containerClassName, id, ...rest },
  ref
) {
  const generatedId = useId();
  const inputId = id ?? generatedId;
  const describedBy = error ? `${inputId}-err` : hint ? `${inputId}-hint` : undefined;

  return (
    <div className={clsx('flex flex-col gap-1.5', containerClassName)}>
      {label && (
        <label
          htmlFor={inputId}
          className="text-xs font-medium text-[#8b949e] uppercase tracking-wider"
        >
          {label}
          {required && <span className="text-[#f85149] ml-1">*</span>}
        </label>
      )}

      <div className="relative">
        {leadingIcon && (
          <span
            className="absolute left-3 top-1/2 -translate-y-1/2 text-[#8b949e] pointer-events-none flex items-center"
            aria-hidden="true"
          >
            {leadingIcon}
          </span>
        )}
        <input
          ref={ref}
          id={inputId}
          aria-invalid={!!error || undefined}
          aria-describedby={describedBy}
          required={required}
          className={clsx(
            'w-full py-2 bg-[#0d1117] border rounded-md text-sm text-[#e6edf3]',
            'placeholder-[#484f58] transition-colors duration-150',
            'focus:outline-none focus-visible:ring-2 focus-visible:ring-[#388bfd]/40',
            leadingIcon ? 'pl-9 pr-3' : 'px-3',
            error
              ? 'border-[#da3633]/60 focus:border-[#f85149]'
              : 'border-[#30363d] focus:border-[#388bfd]',
            className
          )}
          {...rest}
        />
      </div>

      {error ? (
        <span id={`${inputId}-err`} className="text-[11px] text-[#f85149]">
          {error}
        </span>
      ) : hint ? (
        <span id={`${inputId}-hint`} className="text-[11px] text-[#6e7681]">
          {hint}
        </span>
      ) : null}
    </div>
  );
});
