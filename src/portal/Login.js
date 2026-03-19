import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { User, LogIn, AlertCircle } from 'lucide-react';
import { motion } from 'motion/react';
import srvLogo from '../assest/fav_logo/srv-t.png';
import axios from 'axios';

export function Login() {
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
      const { data } = await axios.post('https://srv-backend-3b9s.onrender.com' + '/api/auth/login', { srvNumber, password });
      
      // Save auth data
      localStorage.setItem('schoolToken', data.token);
      localStorage.setItem('schoolUser', JSON.stringify(data));

      // Redirect based on role
      if (data.role === 'admin') navigate('/portal/admin');
      else if (data.role === 'faculty') navigate('/portal/faculty');
      else if (data.role === 'parent') navigate('/portal/parent');

    } catch (err) {
      const errorMsg = err.response?.data?.details || err.response?.data?.message || 'Login failed. Please check your credentials.';
      setError(`Error: ${errorMsg}`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col justify-center py-12 sm:px-6 lg:px-8 relative overflow-hidden">
      {/* Background Decor */}
      <div className="absolute top-0 right-0 w-[600px] h-[600px] bg-emerald-100/40 rounded-full blur-[100px] -z-0" />
      <div className="absolute bottom-0 left-0 w-[500px] h-[500px] bg-amber-100/40 rounded-full blur-[100px] -z-0" />

      <div className="sm:mx-auto sm:w-full sm:max-w-md relative z-10">
        <motion.div 
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex flex-col items-center"
        >
          {/* Branded Logo Block */}
          <div className="flex items-center gap-3 mb-6">
            <div className="p-1.5 rounded-2xl bg-emerald-900 shadow-md flex items-center justify-center shrink-0 overflow-hidden">
               <img src={srvLogo} alt="SRV Logo" className="h-14 w-auto object-cover rounded-xl drop-shadow" />
            </div>
            <div className="flex flex-col items-start">
              <span className="font-display text-4xl font-bold tracking-tight text-slate-900 leading-none">SRV</span>
              <span className="text-xs uppercase tracking-widest font-bold text-emerald-700 block mt-0.5">School</span>
            </div>
          </div>
          
          <h2 className="text-center text-2xl font-display font-bold text-slate-900 tracking-tight">
            Portal Access
          </h2>
          <p className="mt-2 text-center text-sm text-slate-600">
            Sign in to the SRV School Management System
          </p>
        </motion.div>
      </div>

      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="mt-8 sm:mx-auto sm:w-full sm:max-w-md relative z-10"
      >
        <div className="bg-white py-10 px-4 shadow-2xl sm:rounded-3xl border border-slate-100 sm:px-10">
          <form className="space-y-6" onSubmit={handleLogin}>
            {error && (
              <div className="bg-red-50 text-red-600 border border-red-200 rounded-xl p-4 flex gap-3 items-start text-sm">
                <AlertCircle size={18} className="shrink-0 mt-0.5" />
                <span>{error}</span>
              </div>
            )}

            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-2">
                SRV Number / Username
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                  <User className="h-5 w-5 text-slate-400" />
                </div>
                <input
                  type="text"
                  required
                  value={srvNumber}
                  onChange={(e) => setSrvNumber(e.target.value)}
                  className="block w-full pl-11 pr-4 py-3 border border-slate-200 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 transition-shadow outline-none bg-slate-50 focus:bg-white"
                  placeholder="e.g. SRV249012"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-2">
                Password
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                  <div className="h-5 w-5 text-slate-400 flex items-center justify-center font-bold font-serif italic">*</div>
                </div>
                <input
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="block w-full pl-11 pr-4 py-3 border border-slate-200 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 transition-shadow outline-none bg-slate-50 focus:bg-white"
                  placeholder="••••••••"
                />
              </div>
            </div>

            <div>
              <button
                type="submit"
                disabled={loading}
                className="w-full flex justify-center items-center gap-2 py-3.5 px-4 border border-transparent rounded-xl shadow-md text-sm font-bold text-white bg-emerald-600 hover:bg-emerald-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-emerald-500 transition-all disabled:opacity-70"
              >
                {loading ? 'Authenticating...' : (
                  <>
                    <LogIn size={18} /> Sign In
                  </>
                )}
              </button>
            </div>
          </form>

          <div className="mt-8 text-center">
            <p className="text-xs text-slate-500">
              Parents: Use the credentials provided by the school administration.<br/>
              Default password is usually your child's Date of Birth (DDMMYYYY).
            </p>
          </div>
        </div>
      </motion.div>
    </div>
  );
}
