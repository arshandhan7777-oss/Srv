import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { User, LogIn, AlertCircle } from 'lucide-react';
import { motion } from 'motion/react';
import srvLogo from '../assest/fav_logo/srv-t.png';
import axios from 'axios';
import API_URL from '../config/api';

export function Login() {
  const [srvNumber, setSrvNumber] = useState('');
  const [password, setPassword] = useState('');
  const [loginRole, setLoginRole] = useState('parent');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [showForgotModal, setShowForgotModal] = useState(false);
  const [forgotSrv, setForgotSrv] = useState('');
  const [forgotQuestion, setForgotQuestion] = useState('');
  const [forgotAnswer, setForgotAnswer] = useState('');
  const [forgotNewPassword, setForgotNewPassword] = useState('');
  const [forgotMsg, setForgotMsg] = useState({ text: '', type: '' });
  const [forgotLoading, setForgotLoading] = useState(false);
  const navigate = useNavigate();

  const resetForgotState = () => {
    setForgotMsg({ text: '', type: '' });
    setForgotSrv('');
    setForgotQuestion('');
    setForgotAnswer('');
    setForgotNewPassword('');
  };

  const handleForgotSubmit = async (e) => {
    e.preventDefault();
    if (!forgotSrv) return;
    setForgotLoading(true);
    setForgotMsg({ text: '', type: '' });

    try {
      if (!forgotQuestion) {
        const { data } = await axios.get(`${API_URL}/api/auth/recovery-question/${forgotSrv.trim()}`);
        setForgotQuestion(data.recoveryQuestion);
        setForgotMsg({ text: 'Security question loaded. Enter the answer and choose a new password.', type: 'info' });
      } else {
        const { data } = await axios.post(`${API_URL}/api/auth/reset-password-with-answer`, {
          srvNumber: forgotSrv.trim(),
          answer: forgotAnswer,
          newPassword: forgotNewPassword
        });
        setForgotMsg({ text: data.message, type: 'success' });
        setForgotAnswer('');
        setForgotNewPassword('');
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
      const { data } = await axios.post(`${API_URL}/api/auth/login`, { srvNumber: srvNumber.trim(), password });

      if (data.role !== loginRole) {
        setError(`Your account role (${data.role}) does not match the selected login type (${loginRole}).`);
        setLoading(false);
        return;
      }

      localStorage.setItem('schoolToken', data.token);
      localStorage.setItem('schoolUser', JSON.stringify(data));

      if (data.role === 'faculty') navigate('/faculty/dashboard');
      else if (data.role === 'parent') navigate('/parent/dashboard');
    } catch (err) {
      const errorMsg = err.response?.data?.message || 'Login failed. Please check your credentials.';
      setError(`Error: ${errorMsg}`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="relative flex min-h-screen flex-col justify-center overflow-hidden bg-slate-50 px-4 py-10 sm:px-6 sm:py-12 lg:px-8">
      <div className="absolute top-0 right-0 h-[600px] w-[600px] rounded-full bg-emerald-100/40 blur-[100px] -z-0" />
      <div className="absolute bottom-0 left-0 h-[500px] w-[500px] rounded-full bg-amber-100/40 blur-[100px] -z-0" />

      <div className="relative z-10 mx-auto w-full max-w-md">
        <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} className="flex flex-col items-center">
          <div className="mb-8 flex items-center gap-4">
            <div className="h-16 w-16 shrink-0 rounded-[20px] bg-emerald-900 p-[4px] shadow-lg sm:h-20 sm:w-20">
              <div className="flex h-full w-full items-center justify-center overflow-hidden rounded-[16px] bg-white p-1.5">
                <img src={srvLogo} alt="SRV Logo" className="h-full w-full scale-[1.15] object-contain" />
              </div>
            </div>
            <div className="flex flex-col items-start">
              <span className="font-display text-5xl font-extrabold leading-none tracking-tight text-slate-900 sm:text-6xl">SRV</span>
              <span className="mt-1 block text-sm font-bold uppercase tracking-widest text-emerald-700">School</span>
            </div>
          </div>

          <h2 className="text-center text-2xl font-display font-bold tracking-tight text-slate-900">Portal Access</h2>
          <p className="mt-2 text-center text-sm text-slate-600">Sign in to the SRV Faculty and Parent Portal</p>
        </motion.div>
      </div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="relative z-10 mt-8 mx-auto w-full max-w-md"
      >
        <div className="rounded-[2rem] border border-slate-100 bg-white px-5 py-6 shadow-2xl sm:px-10 sm:py-10">
          <div className="mb-8 flex rounded-2xl bg-slate-100 p-1">
            <button
              onClick={() => { setLoginRole('parent'); setError(''); }}
              type="button"
              className={`flex-1 rounded-lg py-2.5 text-sm font-semibold transition-all ${loginRole === 'parent' ? 'bg-white text-emerald-700 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
            >
              Parent
            </button>
            <button
              onClick={() => { setLoginRole('faculty'); setError(''); }}
              type="button"
              className={`flex-1 rounded-lg py-2.5 text-sm font-semibold transition-all ${loginRole === 'faculty' ? 'bg-white text-emerald-700 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
            >
              Faculty
            </button>
          </div>

          <form className="space-y-6" onSubmit={handleLogin}>
            {error && (
              <div className="flex items-start gap-3 rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-600">
                <AlertCircle size={18} className="mt-0.5 shrink-0" />
                <span>{error}</span>
              </div>
            )}

            <div>
              <label className="mb-2 block text-sm font-semibold text-slate-700">
                {loginRole === 'parent' ? 'Parent ID' : 'Faculty ID'}
              </label>
              <div className="relative">
                <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-4">
                  <User className="h-5 w-5 text-slate-400" />
                </div>
                <input
                  type="text"
                  required
                  value={srvNumber}
                  onChange={(e) => setSrvNumber(e.target.value)}
                  className="block w-full rounded-xl border border-slate-200 bg-slate-50 py-3 pl-11 pr-4 outline-none transition-shadow focus:border-emerald-500 focus:bg-white focus:ring-2 focus:ring-emerald-500"
                  placeholder={loginRole === 'parent' ? 'e.g. SRV112233' : 'e.g. FAC112233'}
                />
              </div>
            </div>

            <div>
              <label className="mb-2 block text-sm font-semibold text-slate-700">Password</label>
              <div className="relative">
                <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-4">
                  <div className="flex h-5 w-5 items-center justify-center font-serif text-slate-400">*</div>
                </div>
                <input
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="block w-full rounded-xl border border-slate-200 bg-slate-50 py-3 pl-11 pr-4 outline-none transition-shadow focus:border-emerald-500 focus:bg-white focus:ring-2 focus:ring-emerald-500"
                  placeholder="........"
                />
              </div>
            </div>

            <div className="flex justify-end">
              <button
                type="button"
                onClick={() => { setShowForgotModal(true); resetForgotState(); }}
                className="text-xs font-bold text-emerald-600 transition hover:text-emerald-700"
              >
                Forgot Password?
              </button>
            </div>

            <div>
              <button
                type="submit"
                disabled={loading}
                className="flex w-full items-center justify-center gap-2 rounded-2xl border border-transparent bg-emerald-600 px-4 py-3.5 text-sm font-bold text-white shadow-md transition-all hover:bg-emerald-700 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:ring-offset-2 disabled:opacity-70"
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
                Parents: Enter ID (e.g., SRV112233)
                <br />
                Default password is usually your child&apos;s Date of Birth (DDMMYYYY).
              </p>
            ) : (
              <p className="text-xs text-slate-500">
                Faculty: Enter ID (e.g., FAC112233)
                <br />
                Use your university-assigned faculty ID to access the system.
              </p>
            )}
          </div>
        </div>
      </motion.div>

      {showForgotModal && (
        <div className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto bg-slate-900/60 p-4 backdrop-blur-sm sm:items-center">
          <div className="relative my-auto w-full max-w-md rounded-[2rem] bg-white p-5 shadow-2xl sm:p-8">
            <button
              onClick={() => setShowForgotModal(false)}
              className="absolute right-4 top-4 rounded-xl px-2 py-1 text-sm font-semibold text-slate-400 transition hover:bg-slate-100 hover:text-slate-700"
            >
              Close
            </button>
            <h3 className="mb-4 text-xl font-display font-bold text-slate-900">Password Recovery</h3>

            <form onSubmit={handleForgotSubmit} className="space-y-4">
              <div>
                <label className="mb-2 block text-xs font-bold text-slate-600">Enter your ID (SRV / FAC)</label>
                <input
                  type="text"
                  required
                  value={forgotSrv}
                  onChange={(e) => setForgotSrv(e.target.value)}
                  placeholder="e.g. SRV26001"
                  className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm font-bold outline-none focus:ring-2 focus:ring-emerald-500"
                />
              </div>

              {forgotQuestion && (
                <>
                  <div>
                    <label className="mb-2 block text-xs font-bold text-slate-600">Security Question</label>
                    <div className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm font-semibold text-slate-700">
                      {forgotQuestion}
                    </div>
                  </div>

                  <div>
                    <label className="mb-2 block text-xs font-bold text-slate-600">Your Answer</label>
                    <input
                      type="text"
                      required
                      value={forgotAnswer}
                      onChange={(e) => setForgotAnswer(e.target.value)}
                      placeholder="Enter your answer"
                      className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm font-bold outline-none focus:ring-2 focus:ring-emerald-500"
                    />
                  </div>

                  <div>
                    <label className="mb-2 block text-xs font-bold text-slate-600">New Password</label>
                    <input
                      type="text"
                      required
                      value={forgotNewPassword}
                      onChange={(e) => setForgotNewPassword(e.target.value)}
                      placeholder="Enter your new password"
                      className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm font-bold outline-none focus:ring-2 focus:ring-emerald-500"
                    />
                  </div>
                </>
              )}

              {forgotMsg.text && (
                <div className={`rounded-xl border p-3 text-xs font-bold ${forgotMsg.type === 'error' ? 'border-red-200 bg-red-50 text-red-600' : forgotMsg.type === 'success' ? 'border-emerald-200 bg-emerald-50 text-emerald-700' : 'border-amber-200 bg-amber-50 text-amber-700'}`}>
                  {forgotMsg.text}
                </div>
              )}

              <button
                type="submit"
                disabled={forgotLoading}
                className="flex w-full items-center justify-center rounded-2xl bg-slate-900 py-3 text-sm font-bold text-white transition hover:bg-slate-800 disabled:opacity-70"
              >
                {forgotLoading ? 'Processing...' : forgotQuestion ? 'Reset Password' : 'Load Security Question'}
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
