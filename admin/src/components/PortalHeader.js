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
      <div className="mx-auto flex min-h-16 w-full max-w-7xl flex-wrap items-start justify-between gap-3 px-3 py-2.5 sm:flex-nowrap sm:items-center sm:px-6 sm:py-3 lg:px-8">
        <div className="flex min-w-0 flex-1 items-center gap-2.5 sm:gap-4">
          <Logo className="shrink-0" />
          <div className="flex min-w-0 flex-col overflow-hidden leading-tight">
            <p className="truncate whitespace-nowrap text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-500">{schoolLabel}</p>
            <h1 className="truncate whitespace-nowrap text-sm font-display font-bold leading-tight text-slate-900 sm:text-lg">{title}</h1>
            {subtitle ? <p className="truncate whitespace-nowrap text-[11px] text-slate-500 sm:text-xs">{subtitle}</p> : null}
          </div>
        </div>

        <div className="flex w-full flex-shrink-0 items-center justify-end gap-2 sm:w-auto">
          {onBack ? (
            <button
              type="button"
              onClick={onBack}
              className="inline-flex h-9 w-9 min-w-9 items-center justify-center gap-2 rounded-[10px] border border-slate-200 text-sm font-semibold text-slate-700 transition hover:bg-slate-50 active:scale-95 sm:h-auto sm:w-auto sm:min-w-0 sm:px-3 sm:py-2"
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
              className="inline-flex h-9 w-9 min-w-9 items-center justify-center gap-2 rounded-[10px] bg-slate-900 text-sm font-semibold text-white transition hover:bg-slate-800 active:scale-95 sm:h-auto sm:w-auto sm:min-w-0 sm:px-3 sm:py-2"
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
