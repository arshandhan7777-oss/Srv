import { useEffect } from 'react';
import { createPortal } from 'react-dom';
import { X } from 'lucide-react';

export function NotificationPanel({ open, onClose, title, subtitle, children }) {
  useEffect(() => {
    if (!open) return undefined;

    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';

    return () => {
      document.body.style.overflow = previousOverflow;
    };
  }, [open]);

  if (!open) return null;

  const panel = (
    <>
      <style>{`
        @keyframes srvBackdropFadeIn {
          from {
            opacity: 0;
          }
          to {
            opacity: 1;
          }
        }

        @keyframes srvModalScaleIn {
          from {
            opacity: 0;
            transform: translateY(14px) scale(0.96);
          }
          to {
            opacity: 1;
            transform: translateY(0) scale(1);
          }
        }
      `}</style>
      <div
        className="fixed inset-0 z-[2000] flex items-center justify-center overflow-y-auto bg-slate-950/55 px-4 py-6 backdrop-blur-[6px] sm:px-6"
        style={{ animation: 'srvBackdropFadeIn 0.18s ease' }}
        onClick={onClose}
      >
        <div
          className="relative my-auto w-full max-w-[440px] overflow-hidden rounded-[1.75rem] border border-slate-200 bg-white shadow-[0_28px_90px_rgba(15,23,42,0.28)] sm:max-w-[480px]"
          style={{ animation: 'srvModalScaleIn 0.2s ease' }}
          onClick={(event) => event.stopPropagation()}
          role="dialog"
          aria-modal="true"
          aria-label={title}
        >
          <div className="flex items-start justify-between gap-3 border-b border-slate-200 bg-white px-5 py-4 sm:px-6">
            <div className="min-w-0">
              <h3 className="truncate text-xl font-display font-bold text-slate-900">{title}</h3>
              {subtitle ? <p className="mt-1 truncate text-sm text-slate-500">{subtitle}</p> : null}
            </div>
            <button
              type="button"
              onClick={onClose}
              className="inline-flex h-10 w-10 min-w-10 items-center justify-center rounded-[12px] text-slate-500 transition hover:bg-slate-100 hover:text-slate-900 active:scale-95"
              aria-label="Close notifications"
            >
              <X size={18} />
            </button>
          </div>
          <div className="max-h-[min(72dvh,560px)] overflow-y-auto overscroll-contain bg-slate-50/70 px-5 pb-5 pt-4 text-sm text-slate-600 sm:px-6">
            {children}
          </div>
        </div>
      </div>
    </>
  );

  return createPortal(panel, document.body);
}
