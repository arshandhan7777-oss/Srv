import { useNavigate } from 'react-router-dom';
import { AlertCircle, ArrowLeft } from 'lucide-react';
import { PortalHeader } from '../components/PortalHeader.js';

export function NotFound() {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-slate-100">
      <PortalHeader title="Page Not Found" subtitle="The page you requested is unavailable." schoolLabel="SRV School" />
      <main className="mx-auto max-w-3xl px-4 py-8 sm:px-6 lg:px-8">
        <div className="rounded-[2rem] border border-slate-200 bg-white p-6 shadow-sm sm:p-8">
          <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-rose-100 text-rose-600">
            <AlertCircle size={28} />
          </div>
          <h2 className="mt-5 text-2xl font-display font-bold text-slate-900">This route is not available.</h2>
          <p className="mt-2 text-sm leading-6 text-slate-500">
            Use the button below to return to login and continue with a valid portal path.
          </p>
          <button
            type="button"
            onClick={() => navigate('/login')}
            className="mt-6 inline-flex items-center gap-2 rounded-xl bg-slate-900 px-4 py-3 text-sm font-semibold text-white transition hover:bg-slate-800 active:scale-95"
          >
            <ArrowLeft size={16} />
            Back to Login
          </button>
        </div>
      </main>
    </div>
  );
}
