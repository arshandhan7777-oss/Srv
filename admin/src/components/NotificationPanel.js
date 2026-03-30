import { X } from 'lucide-react';

export function NotificationPanel({ open, onClose, title, subtitle, children }) {
  if (!open) return null;

  return (
    <>
      <style>{`
        @keyframes srvModalScaleIn {
          from {
            opacity: 0;
            transform: scale(0.9);
          }
          to {
            opacity: 1;
            transform: scale(1);
          }
        }
      `}</style>
      <div
        className="fixed inset-0 z-[999] flex items-start justify-center overflow-y-auto bg-slate-950/40 px-3 py-4 sm:items-center sm:px-6"
        onClick={onClose}
      >
        <div
          className="relative my-auto w-full max-w-[420px] overflow-hidden rounded-[1.75rem] border border-slate-200 bg-white shadow-[0_20px_60px_rgba(0,0,0,0.2)] sm:max-w-[460px]"
          style={{ animation: 'srvModalScaleIn 0.2s ease' }}
          onClick={(event) => event.stopPropagation()}
        >
          <div className="flex items-center justify-between border-b border-slate-200 px-4 py-4">
            <div className="min-w-0">
              <h3 className="truncate font-display font-bold text-slate-900">{title}</h3>
              {subtitle ? <p className="truncate text-xs text-slate-500">{subtitle}</p> : null}
            </div>
            <button
              type="button"
              onClick={onClose}
              className="ml-3 inline-flex h-9 w-9 min-w-9 items-center justify-center rounded-[10px] text-slate-500 transition hover:bg-slate-100 hover:text-slate-900 active:scale-95"
              aria-label="Close notifications"
            >
              <X size={18} />
            </button>
          </div>
          <div className="max-h-[min(70vh,560px)] overflow-y-auto px-4 pb-5 pt-4 text-sm text-slate-600 sm:px-5">
            {children}
          </div>
        </div>
      </div>
    </>
  );
}
