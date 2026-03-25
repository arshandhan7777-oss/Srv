import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { User, LogIn, AlertCircle } from 'lucide-react';
import { motion } from 'motion/react';
import srvLogo from '../assest/fav_logo/srv-t.png';
import axios from 'axios';

export function Login() {
  const [srvNumber, setSrvNumber] = useState('');
  const [password, setPassword] = useState('');
  const [loginRole, setLoginRole] = useState('parent');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [showForgotModal, setShowForgotModal] = useState(false);
  const [forgotTab, setForgotTab] = useState('request');
  const [forgotSrv, setForgotSrv] = useState('');
  const [forgotMsg, setForgotMsg] = useState({ text: '', type: '' });
  const [forgotLoading, setForgotLoading] = useState(false);
  const navigate = useNavigate();

  const handleForgotSubmit = async (e) => {
    e.preventDefault();
    if (!forgotSrv) return;
    setForgotLoading(true);
    setForgotMsg({ text: '', type: '' });
    
    try {
      if (forgotTab === 'request') {
        const { data } = await axios.post(`${import.meta.env.VITE_API_URL}/api/auth/forgot-password`, { srvNumber: forgotSrv.trim() });
        setForgotMsg({ text: data.message, type: 'success' });
      } else {
        const { data } = await axios.get(`${import.meta.env.VITE_API_URL}/api/auth/reset-status/${forgotSrv.trim()}`);
        if (data.status === 'Reset') {
          setForgotMsg({ text: `Your password was reset to: ${data.newPassword}`, type: 'success' });
        } else {
          setForgotMsg({ text: 'Your request is still Pending approval.', type: 'info' });
        }
      }
    } catch (err) {
      setForgotMsg({ text: err.response?.data?.message || 'Error communicating with server.', type: 'error' });
    } finally {
      setForgotLoading(false);
    }
  };

  const handleLogin = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const { data } = await axios.post(`${import.meta.env.VITE_API_URL}/api/auth/login`, { srvNumber: srvNumber.trim(), password });
      
      if (data.role !== loginRole) {
        setError(`Your account role (${data.role}) does not match the selected login type (${loginRole}).`);
        setLoading(false);
        return;
      }

      // Save auth data
      localStorage.setItem('schoolToken', data.token);
      localStorage.setItem('schoolUser', JSON.stringify(data));

      // Redirect based on role
      if (data.role === 'faculty') navigate('/portal/faculty');
      else if (data.role === 'parent') navigate('/portal/parent');

    } catch (err) {
      const errorMsg = err.response?.data?.message || 'Login failed. Please check your credentials.';
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
          <div className="flex items-center gap-4 mb-8">
            <div className="w-16 h-16 sm:w-20 sm:h-20 bg-emerald-900 rounded-[20px] p-[4px] shadow-lg shrink-0">
              <div className="w-full h-full bg-white rounded-[16px] flex items-center justify-center overflow-hidden p-1.5">
                <img src={srvLogo} alt="SRV Logo" className="w-full h-full object-contain scale-[1.15]" />
              </div>
            </div>
            <div className="flex flex-col items-start">
              <span className="font-display text-5xl sm:text-6xl font-extrabold tracking-tight text-slate-900 leading-none">SRV</span>
              <span className="text-sm uppercase tracking-widest font-bold text-emerald-700 block mt-1">School</span>
            </div>
          </div>
          
          <h2 className="text-center text-2xl font-display font-bold text-slate-900 tracking-tight">
            Portal Access
          </h2>
          <p className="mt-2 text-center text-sm text-slate-600">
            Sign in to the SRV Faculty and Parent Portal
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
          
          <div className="flex p-1 mb-8 bg-slate-100 rounded-xl">
            <button
              onClick={() => { setLoginRole('parent'); setError(''); }}
              type="button"
              className={`flex-1 py-2.5 text-sm font-semibold rounded-lg transition-all ${loginRole === 'parent' ? 'bg-white text-emerald-700 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
            >
              Parent
            </button>
            <button
              onClick={() => { setLoginRole('faculty'); setError(''); }}
              type="button"
              className={`flex-1 py-2.5 text-sm font-semibold rounded-lg transition-all ${loginRole === 'faculty' ? 'bg-white text-emerald-700 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
            >
              Faculty
            </button>
          </div>

          <form className="space-y-6" onSubmit={handleLogin}>
            {error && (
              <div className="bg-red-50 text-red-600 border border-red-200 rounded-xl p-4 flex gap-3 items-start text-sm">
                <AlertCircle size={18} className="shrink-0 mt-0.5" />
                <span>{error}</span>
              </div>
            )}

            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-2">
                {loginRole === 'parent' ? 'Parent ID' : 'Faculty ID'}
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
                  placeholder={loginRole === 'parent' ? "e.g. SRV112233" : "e.g. FAC112233"}
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

            <div className="flex justify-end">
              <button 
                type="button" 
                onClick={() => { setShowForgotModal(true); setForgotMsg({text:'', type:''}); setForgotSrv(''); }}
                className="text-xs font-bold text-emerald-600 hover:text-emerald-700 transition"
              >
                Forgot Password?
              </button>
            </div>

            <div>
              <button
                type="submit"
                disabled={loading}
                className="w-full flex justify-center items-center gap-2 py-3.5 px-4 border border-transparent rounded-xl shadow-md text-sm font-bold text-white bg-emerald-600 hover:bg-emerald-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-emerald-500 transition-all disabled:opacity-70"
              >
                {loading ? 'Authenticating...' : (
                  <>
                    <LogIn size={18} /> Sign In as {loginRole === 'parent' ? 'Parent' : 'Faculty'}
                  </>
                )}
              </button>
            </div>
          </form>

          <div className="mt-8 text-center">
            {loginRole === 'parent' ? (
              <p className="text-xs text-slate-500">
                Parents: Enter ID (e.g., SRV112233)<br/>
                Default password is usually your child's Date of Birth (DDMMYYYY).
              </p>
            ) : (
              <p className="text-xs text-slate-500">
                Faculty: Enter ID (e.g., FAC112233)<br/>
                Use your university-assigned faculty ID to access the system.
              </p>
            )}
          </div>
        </div>
      </motion.div>

      {/* Forgot Password Modal */}
      {showForgotModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl p-8 max-w-sm w-full shadow-2xl relative">
            <button 
              onClick={() => setShowForgotModal(false)} 
              className="absolute top-4 right-4 text-slate-400 hover:text-slate-700 font-bold"
            >
              ✕
            </button>
            <h3 className="text-xl font-display font-bold text-slate-900 mb-4">Password Recovery</h3>
            
            <div className="flex p-1 mb-6 bg-slate-100 rounded-xl">
              <button
                onClick={() => { setForgotTab('request'); setForgotMsg({text:'', type:''}); }}
                className={`flex-1 py-1.5 text-xs font-bold justify-center flex items-center rounded-lg transition-all ${forgotTab === 'request' ? 'bg-white text-emerald-700 shadow-sm' : 'text-slate-500'}`}
              >
                Request Reset
              </button>
              <button
                onClick={() => { setForgotTab('status'); setForgotMsg({text:'', type:''}); }}
                className={`flex-1 py-1.5 text-xs font-bold justify-center flex items-center rounded-lg transition-all ${forgotTab === 'status' ? 'bg-white text-emerald-700 shadow-sm' : 'text-slate-500'}`}
              >
                Check Status
              </button>
            </div>

            <form onSubmit={handleForgotSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-600 mb-2">Enter your ID (SRV / FAC)</label>
                <input 
                  type="text" 
                  required
                  value={forgotSrv}
                  onChange={e => setForgotSrv(e.target.value)}
                  placeholder="e.g. SRV26001"
                  className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-emerald-500 outline-none text-sm font-bold"
                />
              </div>

              {forgotMsg.text && (
                <div className={`p-3 rounded-xl text-xs font-bold border ${forgotMsg.type === 'error' ? 'bg-red-50 text-red-600 border-red-200' : forgotMsg.type === 'success' ? 'bg-emerald-50 text-emerald-700 border-emerald-200' : 'bg-amber-50 text-amber-700 border-amber-200'}`}>
                  {forgotMsg.text}
                </div>
              )}

              <button 
                type="submit" 
                disabled={forgotLoading}
                className="w-full py-2.5 bg-slate-900 text-white font-bold text-sm rounded-xl hover:bg-slate-800 transition disabled:opacity-70"
              >
                {forgotLoading ? 'Processing...' : forgotTab === 'request' ? 'Submit to Administration' : 'Check Recovery Status'}
              </button>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}

