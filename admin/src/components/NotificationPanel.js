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
        className="fixed inset-0 z-[1200] flex items-start justify-center overflow-y-auto bg-slate-950/45 px-3 pb-3 pt-[max(0.75rem,env(safe-area-inset-top))] backdrop-blur-[2px] sm:items-center sm:px-6 sm:py-6"
        onClick={onClose}
      >
        <div
          className="relative mt-2 w-full max-w-[420px] overflow-hidden rounded-[1.5rem] border border-slate-200 bg-white shadow-[0_20px_60px_rgba(0,0,0,0.2)] sm:mt-0 sm:my-auto sm:max-w-[460px] sm:rounded-[1.75rem]"
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
          <div className="max-h-[min(72dvh,560px)] overflow-y-auto overscroll-contain px-4 pb-5 pt-4 text-sm text-slate-600 sm:px-5">
            {children}
          </div>
        </div>
      </div>
    </>
  );
}
