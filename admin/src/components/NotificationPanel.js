export function NotificationPanel({ open, onClose, title, subtitle, children }) {
  if (!open) return null;

  return (
    <>
      <button
        type="button"
        aria-label="Close notifications"
        onClick={onClose}
        className="fixed inset-0 z-40 bg-slate-950/40 sm:hidden"
      />
      <div className="fixed inset-x-0 bottom-0 z-50 max-h-[80vh] overflow-y-auto rounded-t-[1.5rem] border border-slate-200 bg-white shadow-2xl sm:absolute sm:right-0 sm:top-full sm:mt-3 sm:max-h-96 sm:w-80 sm:rounded-2xl">
        <div className="sticky top-0 z-10 border-b border-slate-200 bg-white px-4 py-4">
          <h3 className="font-display font-bold text-slate-900">{title}</h3>
          {subtitle ? <p className="text-xs text-slate-500">{subtitle}</p> : null}
        </div>
        <div>{children}</div>
      </div>
    </>
  );
}
