import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ShieldCheck, LogIn, AlertCircle } from 'lucide-react';
import { motion } from 'motion/react';
import srvLogo from '../assest/fav_logo/srv-t.png';
import axios from 'axios';
import API_URL from '../config/api';

export function AdminLogin() {
  const [srvNumber, setSrvNumber] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleLogin = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

  try {
      const { data } = await axios.post(`${API_URL}/api/auth/admin-login`, { srvNumber: srvNumber.trim(), password });
      
      // Save auth data
      localStorage.setItem('schoolToken', data.token);
      localStorage.setItem('schoolUser', JSON.stringify(data));

      // Always redirect to admin dashboard
      navigate('/admin/dashboard');

    } catch (err) {
      const errorMsg = err.response?.data?.message || 'Login failed. Please check your credentials.';
      setError(`Error: ${errorMsg}`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="relative flex min-h-screen flex-col justify-center overflow-hidden bg-slate-900 px-4 py-10 sm:px-6 sm:py-12 lg:px-8">
      {/* Background Decor */}
      <div className="absolute top-0 right-0 w-[600px] h-[600px] bg-emerald-600/20 rounded-full blur-[100px] -z-0" />
      <div className="absolute bottom-0 left-0 w-[500px] h-[500px] bg-slate-800/40 rounded-full blur-[100px] -z-0" />

      <div className="relative z-10 mx-auto w-full max-w-md">
        <motion.div 
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex flex-col items-center"
        >
          {/* Branded Logo Block */}
          <div className="mb-8 flex items-center gap-4">
            <div className="w-16 h-16 sm:w-20 sm:h-20 bg-emerald-600 rounded-[20px] p-[4px] shadow-lg shrink-0">
              <div className="w-full h-full bg-white rounded-[16px] flex items-center justify-center overflow-hidden p-1.5">
                <img src={srvLogo} alt="SRV Logo" className="w-full h-full object-contain scale-[1.15]" />
              </div>
            </div>
            <div className="flex flex-col items-start">
              <span className="font-display text-5xl font-extrabold leading-none tracking-tight text-white sm:text-6xl">SRV</span>
              <span className="text-sm uppercase tracking-widest font-bold text-emerald-400 block mt-1">Admin</span>
            </div>
          </div>
          
          <h2 className="text-center text-2xl font-display font-bold text-white tracking-tight">
            Administrator Access
          </h2>
          <p className="mt-2 text-center text-sm text-slate-400">
            Secure login for restricted administrative roles
          </p>
        </motion.div>
      </div>

      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="relative z-10 mt-8 mx-auto w-full max-w-md"
      >
        <div className="rounded-[2rem] border border-slate-700 bg-slate-800 px-5 py-6 shadow-2xl sm:px-10 sm:py-10">
          <form className="space-y-6" onSubmit={handleLogin}>
            {error && (
              <div className="bg-red-500/10 text-red-400 border border-red-500/20 rounded-xl p-4 flex gap-3 items-start text-sm">
                <AlertCircle size={18} className="shrink-0 mt-0.5" />
                <span>{error}</span>
              </div>
            )}

            <div>
              <label className="block text-sm font-semibold text-slate-300 mb-2">
                Admin ID / Username
              </label>
              <div className="relative">
                <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-4">
                  <ShieldCheck className="h-5 w-5 text-slate-500" />
                </div>
                <input
                  type="text"
                  required
                  value={srvNumber}
                  onChange={(e) => setSrvNumber(e.target.value)}
                  className="block w-full pl-11 pr-4 py-3 border border-slate-600 rounded-xl text-white focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 transition-shadow outline-none bg-slate-900 focus:bg-slate-950"
                  placeholder="e.g. ADMIN"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-semibold text-slate-300 mb-2">
                Password
              </label>
              <div className="relative">
                <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-4">
                  <div className="h-5 w-5 text-slate-500 flex items-center justify-center font-bold font-serif italic">*</div>
                </div>
                <input
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="block w-full pl-11 pr-4 py-3 border border-slate-600 rounded-xl text-white focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 transition-shadow outline-none bg-slate-900 focus:bg-slate-950"
                  placeholder="••••••••"
                />
              </div>
            </div>

            <div>
              <button
                type="submit"
                disabled={loading}
                className="flex w-full items-center justify-center gap-2 rounded-2xl border border-transparent bg-emerald-600 px-4 py-3.5 text-sm font-bold text-white shadow-md transition-all hover:bg-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:ring-offset-2 focus:ring-offset-slate-900 disabled:opacity-70"
              >
                {loading ? 'Authenticating...' : (
                  <>
                    <LogIn size={18} /> Sign In to Admin Panel
                  </>
                )}
              </button>
            </div>
          </form>
        </div>
      </motion.div>
    </div>
  );
}
