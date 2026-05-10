// src/components/ui/Textarea.tsx
// ─────────────────────────────────────────────────────────────────────────────
// Multi-line input matching the Input primitive's labeled/error/hint pattern.
// ─────────────────────────────────────────────────────────────────────────────
import clsx from 'clsx';
import { forwardRef, useId } from 'react';
import type { TextareaHTMLAttributes } from 'react';

interface TextareaProps extends TextareaHTMLAttributes<HTMLTextAreaElement> {
  label?: string;
  hint?: string;
  error?: string;
  required?: boolean;
  containerClassName?: string;
}

export const Textarea = forwardRef<HTMLTextAreaElement, TextareaProps>(function Textarea(
  { label, hint, error, required, className, containerClassName, id, rows = 2, ...rest },
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

      <textarea
        ref={ref}
        id={inputId}
        rows={rows}
        aria-invalid={!!error || undefined}
        aria-describedby={describedBy}
        required={required}
        className={clsx(
          'w-full px-3 py-2 bg-[#0d1117] border rounded-md text-sm text-[#e6edf3]',
          'placeholder-[#484f58] transition-colors duration-150 resize-none',
          'focus:outline-none focus-visible:ring-2 focus-visible:ring-[#388bfd]/40',
          error
            ? 'border-[#da3633]/60 focus:border-[#f85149]'
            : 'border-[#30363d] focus:border-[#388bfd]',
          className
        )}
        {...rest}
      />

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
