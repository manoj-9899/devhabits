// src/components/ui/Modal.tsx
// ─────────────────────────────────────────────────────────────────────────────
// Generic dialog primitive: portal, focus trap, escape, animation, scroll-lock.
// AddHabitModal (and future EditHabitModal, ConfirmDialog) compose around this.
// ─────────────────────────────────────────────────────────────────────────────
import { useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import { AnimatePresence, motion } from 'framer-motion';
import clsx from 'clsx';
import { modalBackdrop, modalDialog } from '../../lib/motion';

type Size = 'sm' | 'md' | 'lg';

const SIZE: Record<Size, string> = {
  sm: 'max-w-sm',
  md: 'max-w-md',
  lg: 'max-w-2xl',
};

interface ModalProps {
  open: boolean;
  onClose: () => void;
  title?: string;
  subtitle?: string;
  size?: Size;
  children?: React.ReactNode;
  footer?: React.ReactNode;
  initialFocusRef?: React.RefObject<HTMLElement | null>;
  closeOnOverlay?: boolean;
  ariaLabel?: string;
}

export function Modal({
  open,
  onClose,
  title,
  subtitle,
  size = 'md',
  children,
  footer,
  initialFocusRef,
  closeOnOverlay = true,
  ariaLabel,
}: ModalProps) {
  const dialogRef = useRef<HTMLDivElement>(null);
  const previousActiveRef = useRef<HTMLElement | null>(null);

  // Lock body scroll while open + remember previously focused element.
  useEffect(() => {
    if (!open) return;
    previousActiveRef.current = document.activeElement as HTMLElement;
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';

    const focusTimer = window.setTimeout(() => {
      if (initialFocusRef?.current) initialFocusRef.current.focus();
      else dialogRef.current?.focus();
    }, 30);

    return () => {
      document.body.style.overflow = prevOverflow;
      window.clearTimeout(focusTimer);
      previousActiveRef.current?.focus?.();
    };
  }, [open, initialFocusRef]);

  // Escape closes; Tab is loosely trapped within the dialog.
  useEffect(() => {
    if (!open) return;
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        e.stopPropagation();
        onClose();
        return;
      }
      if (e.key === 'Tab' && dialogRef.current) {
        const focusable = dialogRef.current.querySelectorAll<HTMLElement>(
          'a[href], button:not([disabled]), textarea, input, select, [tabindex]:not([tabindex="-1"])'
        );
        if (focusable.length === 0) return;
        const first = focusable[0];
        const last = focusable[focusable.length - 1];
        if (e.shiftKey && document.activeElement === first) {
          e.preventDefault();
          last.focus();
        } else if (!e.shiftKey && document.activeElement === last) {
          e.preventDefault();
          first.focus();
        }
      }
    };
    document.addEventListener('keydown', handler);
    return () => document.removeEventListener('keydown', handler);
  }, [open, onClose]);

  return createPortal(
    <AnimatePresence>
      {open && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4"
          role="dialog"
          aria-modal="true"
          aria-label={ariaLabel ?? title}
        >
          <motion.div
            className="absolute inset-0 bg-black/70 backdrop-blur-sm"
            variants={modalBackdrop}
            initial="hidden"
            animate="visible"
            exit="exit"
            onClick={closeOnOverlay ? onClose : undefined}
          />

          <motion.div
            ref={dialogRef}
            tabIndex={-1}
            variants={modalDialog}
            initial="hidden"
            animate="visible"
            exit="exit"
            className={clsx(
              'relative w-full bg-[#161b22] border border-[#30363d] rounded-xl shadow-2xl',
              'flex flex-col max-h-[calc(100vh-2rem)]',
              SIZE[size]
            )}
          >
            {(title || subtitle) && (
              <div className="flex items-start justify-between gap-4 px-5 py-4 border-b border-[#30363d] shrink-0">
                <div>
                  {title && (
                    <h2 className="text-sm font-semibold text-[#e6edf3] tracking-tight">
                      {title}
                    </h2>
                  )}
                  {subtitle && <p className="text-xs text-[#8b949e] mt-0.5">{subtitle}</p>}
                </div>
                <button
                  type="button"
                  onClick={onClose}
                  aria-label="Close dialog"
                  className="text-[#8b949e] hover:text-[#e6edf3] transition-colors p-1 rounded cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#388bfd]/50"
                >
                  <svg
                    width="16"
                    height="16"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                  >
                    <path d="M18 6 6 18M6 6l12 12" />
                  </svg>
                </button>
              </div>
            )}

            <div className="overflow-y-auto px-5 py-5">{children}</div>

            {footer && (
              <div className="flex items-center justify-end gap-2 px-5 py-3 border-t border-[#21262d] shrink-0">
                {footer}
              </div>
            )}
          </motion.div>
        </div>
      )}
    </AnimatePresence>,
    document.body
  );
}
