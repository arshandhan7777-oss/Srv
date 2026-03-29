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
        className="fixed inset-0 z-[999] flex items-center justify-center bg-slate-950/40 p-4 sm:p-6"
        onClick={onClose}
      >
        <div
          className="max-h-[80vh] w-[92%] max-w-[420px] overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-[0_20px_60px_rgba(0,0,0,0.2)]"
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
          <div className="max-h-[calc(80vh-73px)] overflow-y-auto px-4 py-4">
            {children}
          </div>
        </div>
      </div>
    </>
  );
}
