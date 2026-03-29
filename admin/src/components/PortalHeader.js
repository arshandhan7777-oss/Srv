import { ChevronLeft, LogOut } from 'lucide-react';
import { Logo } from './Logo.js';

export function PortalHeader({
  title,
  subtitle,
  schoolLabel = 'SRV School',
  onBack,
  backLabel = 'Dashboard',
  onLogout,
  children
}) {
  return (
    <div className="sticky top-0 z-30 border-b border-slate-200 bg-white/95 backdrop-blur">
      <div className="mx-auto flex max-w-7xl flex-wrap items-center justify-between gap-3 px-3 py-3 sm:px-6 lg:px-8">
        <div className="flex min-w-0 items-center gap-3 sm:gap-4">
          <Logo className="shrink-0" />
          <div className="min-w-0">
            <p className="truncate text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-500">{schoolLabel}</p>
            <h1 className="truncate text-base font-display font-bold leading-tight text-slate-900 sm:text-lg">{title}</h1>
            {subtitle ? <p className="truncate text-xs text-slate-500">{subtitle}</p> : null}
          </div>
        </div>

        <div className="flex items-center gap-2 sm:gap-3">
          {onBack ? (
            <button
              type="button"
              onClick={onBack}
              className="inline-flex items-center gap-2 rounded-xl border border-slate-200 px-3 py-2 text-sm font-semibold text-slate-700 transition hover:bg-slate-50 active:scale-95"
            >
              <ChevronLeft size={16} />
              <span className="hidden sm:inline">{backLabel}</span>
            </button>
          ) : null}

          {children}

          {onLogout ? (
            <button
              type="button"
              onClick={onLogout}
              className="inline-flex items-center gap-2 rounded-xl bg-slate-900 px-3 py-2 text-sm font-semibold text-white transition hover:bg-slate-800 active:scale-95"
            >
              <LogOut size={16} />
              <span className="hidden sm:inline">Logout</span>
            </button>
          ) : null}
        </div>
      </div>
    </div>
  );
}
