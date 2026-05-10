// src/components/ui/Toaster.tsx
// ─────────────────────────────────────────────────────────────────────────────
// Renders the toast stack. Mount once (in Shell) — Toasts pushed via `toast.*`.
// ─────────────────────────────────────────────────────────────────────────────
import { AnimatePresence, motion } from 'framer-motion';
import clsx from 'clsx';
import { useToastStore, type ToastVariant } from '../../store/toastStore';
import { DURATION, EASE } from '../../lib/motion';

const VARIANT_BORDER: Record<ToastVariant, string> = {
  success: 'border-[#238636]/50',
  error: 'border-[#da3633]/50',
  info: 'border-[#388bfd]/40',
  undo: 'border-[#30363d]',
};

const VARIANT_DOT: Record<ToastVariant, string> = {
  success: 'bg-[#3fb950] shadow-[0_0_8px_#23863660]',
  error: 'bg-[#f85149] shadow-[0_0_8px_#da363360]',
  info: 'bg-[#58a6ff] shadow-[0_0_8px_#388bfd60]',
  undo: 'bg-[#8b949e]',
};

export function Toaster() {
  const toasts = useToastStore((s) => s.toasts);
  const dismiss = useToastStore((s) => s.dismiss);

  return (
    <div
      aria-live="polite"
      aria-atomic="true"
      className="pointer-events-none fixed bottom-4 right-4 z-[60] flex flex-col gap-2 w-[min(360px,calc(100vw-2rem))]"
    >
      <AnimatePresence initial={false}>
        {toasts.map((t) => (
          <motion.div
            key={t.id}
            layout
            initial={{ opacity: 0, y: 14, scale: 0.96 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, x: 24, scale: 0.96 }}
            transition={{ duration: DURATION.base, ease: EASE.decel }}
            className={clsx(
              'pointer-events-auto rounded-xl border bg-[#161b22]/95 backdrop-blur-sm shadow-xl',
              'px-4 py-3 flex items-start gap-3',
              VARIANT_BORDER[t.variant]
            )}
            role="status"
          >
            <span
              className={clsx('w-2 h-2 rounded-full mt-1.5 shrink-0', VARIANT_DOT[t.variant])}
              aria-hidden="true"
            />

            <div className="flex-1 min-w-0">
              <div className="text-sm font-medium text-[#e6edf3] truncate">{t.title}</div>
              {t.description && (
                <div className="text-xs text-[#8b949e] mt-0.5">{t.description}</div>
              )}
            </div>

            {t.action && (
              <button
                onClick={() => {
                  t.action!.onClick();
                  dismiss(t.id);
                }}
                className="text-xs font-semibold text-[#58a6ff] hover:text-[#79b8ff] transition-colors shrink-0 cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#388bfd]/40 rounded px-1"
              >
                {t.action.label}
              </button>
            )}

            <button
              onClick={() => dismiss(t.id)}
              aria-label="Dismiss notification"
              className="text-[#6e7681] hover:text-[#e6edf3] transition-colors shrink-0 cursor-pointer p-0.5 -mt-0.5"
            >
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M18 6 6 18M6 6l12 12" />
              </svg>
            </button>
          </motion.div>
        ))}
      </AnimatePresence>
    </div>
  );
}
