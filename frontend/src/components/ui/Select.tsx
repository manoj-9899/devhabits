// src/components/ui/Select.tsx
// ─────────────────────────────────────────────────────────────────────────────
// Custom (non-native) select. Replaces native <select> in dark UI for a
// consistent look. Keyboard accessible, click-outside, escape-to-close.
// ─────────────────────────────────────────────────────────────────────────────
import { useEffect, useId, useRef, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import clsx from 'clsx';
import { DURATION, EASE } from '../../lib/motion';

export interface SelectOption<T extends string = string> {
  value: T;
  label: string;
  hint?: string;
}

interface SelectProps<T extends string = string> {
  label?: string;
  value: T;
  options: SelectOption<T>[];
  onChange: (value: T) => void;
  placeholder?: string;
  disabled?: boolean;
  required?: boolean;
  containerClassName?: string;
  className?: string;
}

export function Select<T extends string = string>({
  label,
  value,
  options,
  onChange,
  placeholder = 'Select…',
  disabled,
  required,
  containerClassName,
  className,
}: SelectProps<T>) {
  const id = useId();
  const [open, setOpen] = useState(false);
  const [activeIndex, setActiveIndex] = useState(0);
  const buttonRef = useRef<HTMLButtonElement>(null);
  const listRef = useRef<HTMLUListElement>(null);

  const selected = options.find((o) => o.value === value);

  useEffect(() => {
    if (!open) return;
    const onClick = (e: MouseEvent) => {
      const t = e.target as Node;
      if (!buttonRef.current?.contains(t) && !listRef.current?.contains(t)) {
        setOpen(false);
      }
    };
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        e.stopPropagation();
        setOpen(false);
        buttonRef.current?.focus();
      }
      if (e.key === 'ArrowDown') {
        e.preventDefault();
        setActiveIndex((i) => Math.min(i + 1, options.length - 1));
      }
      if (e.key === 'ArrowUp') {
        e.preventDefault();
        setActiveIndex((i) => Math.max(i - 1, 0));
      }
      if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault();
        const opt = options[activeIndex];
        if (opt) {
          onChange(opt.value);
          setOpen(false);
          buttonRef.current?.focus();
        }
      }
    };
    document.addEventListener('mousedown', onClick);
    document.addEventListener('keydown', onKey);
    return () => {
      document.removeEventListener('mousedown', onClick);
      document.removeEventListener('keydown', onKey);
    };
  }, [open, options, activeIndex, onChange]);

  return (
    <div className={clsx('flex flex-col gap-1.5', containerClassName)}>
      {label && (
        <label
          htmlFor={id}
          className="text-xs font-medium text-[#8b949e] uppercase tracking-wider"
        >
          {label}
          {required && <span className="text-[#f85149] ml-1">*</span>}
        </label>
      )}

      <div className="relative">
        <button
          ref={buttonRef}
          id={id}
          type="button"
          role="combobox"
          aria-expanded={open}
          aria-haspopup="listbox"
          disabled={disabled}
          onClick={() => {
            if (!open) {
              const idx = options.findIndex((o) => o.value === value);
              setActiveIndex(idx >= 0 ? idx : 0);
            }
            setOpen((o) => !o);
          }}
          className={clsx(
            'w-full px-3 py-2 bg-[#0d1117] border border-[#30363d] rounded-md text-sm text-left',
            'flex items-center justify-between gap-2 transition-colors duration-150 cursor-pointer',
            'focus:outline-none focus-visible:ring-2 focus-visible:ring-[#388bfd]/40 focus:border-[#388bfd]',
            'hover:border-[#484f58]',
            'disabled:opacity-50 disabled:cursor-not-allowed',
            className
          )}
        >
          <span className={clsx(selected ? 'text-[#e6edf3]' : 'text-[#484f58]')}>
            {selected?.label ?? placeholder}
          </span>
          <ChevronDown
            className={clsx(
              'shrink-0 text-[#8b949e] transition-transform duration-150',
              open && 'rotate-180'
            )}
          />
        </button>

        <AnimatePresence>
          {open && (
            <motion.ul
              ref={listRef}
              role="listbox"
              initial={{ opacity: 0, y: -4 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -4 }}
              transition={{ duration: DURATION.fast, ease: EASE.decel }}
              className="absolute z-30 mt-1 w-full bg-[#161b22] border border-[#30363d] rounded-md shadow-lg overflow-hidden py-1 max-h-64 overflow-y-auto"
            >
              {options.map((opt, i) => {
                const isSelected = opt.value === value;
                const isActive = i === activeIndex;
                return (
                  <li
                    key={opt.value}
                    role="option"
                    aria-selected={isSelected}
                    onMouseEnter={() => setActiveIndex(i)}
                    onClick={() => {
                      onChange(opt.value);
                      setOpen(false);
                      buttonRef.current?.focus();
                    }}
                    className={clsx(
                      'px-3 py-1.5 text-sm cursor-pointer flex items-center justify-between gap-2',
                      isActive ? 'bg-[#21262d] text-[#e6edf3]' : 'text-[#8b949e]'
                    )}
                  >
                    <span className="truncate">{opt.label}</span>
                    {opt.hint && (
                      <span className="text-[10px] text-[#6e7681] font-mono shrink-0">
                        {opt.hint}
                      </span>
                    )}
                    {isSelected && (
                      <CheckIcon className="text-[#3fb950] shrink-0" aria-hidden="true" />
                    )}
                  </li>
                );
              })}
            </motion.ul>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}

function ChevronDown({ className }: { className?: string }) {
  return (
    <svg
      className={className}
      width="14"
      height="14"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      aria-hidden="true"
    >
      <path d="m6 9 6 6 6-6" />
    </svg>
  );
}

function CheckIcon({ className }: { className?: string }) {
  return (
    <svg
      className={className}
      width="14"
      height="14"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2.5"
      aria-hidden="true"
    >
      <path d="M20 6 9 17l-5-5" />
    </svg>
  );
}
