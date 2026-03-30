import { useEffect, useState } from 'react';
import axios from 'axios';
import { MessageCircleWarning } from 'lucide-react';
import API_URL from '../config/api.js';

const initialForm = {
  category: 'ISSUE',
  subject: '',
  message: ''
};

const statusClasses = {
  OPEN: 'bg-red-100 text-red-700',
  IN_REVIEW: 'bg-amber-100 text-amber-700',
  RESOLVED: 'bg-emerald-100 text-emerald-700'
};

export function ParentFeedbackSection() {
  const [form, setForm] = useState(initialForm);
  const [feedback, setFeedback] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState({ text: '', type: '' });

  const fetchFeedback = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem('schoolToken');
      const res = await axios.get(`${API_URL}/api/parent/feedback`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setFeedback(res.data);
    } catch (error) {
      setMessage({ text: 'Unable to load your feedback history.', type: 'error' });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchFeedback();
  }, []);

  const submitFeedback = async (event) => {
    event.preventDefault();
    setSaving(true);
    setMessage({ text: '', type: '' });

    try {
      const token = localStorage.getItem('schoolToken');
      await axios.post(`${API_URL}/api/parent/feedback`, form, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setForm(initialForm);
      setMessage({ text: 'Feedback submitted successfully.', type: 'success' });
      fetchFeedback();
    } catch (error) {
      setMessage({ text: error.response?.data?.message || 'Unable to submit feedback.', type: 'error' });
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="mt-8 rounded-3xl border border-slate-100 bg-white p-5 shadow-sm sm:p-8">
      <div className="flex items-center gap-3 mb-6">
        <MessageCircleWarning className="text-orange-500" />
        <div>
          <h3 className="text-xl font-display font-bold text-slate-900">Feedback & Concerns</h3>
          <p className="text-sm text-slate-500">Raise issues, suggestions, or concerns for the school team.</p>
        </div>
      </div>

      {message.text && (
        <div className={`mb-5 px-4 py-3 rounded-2xl text-sm font-semibold ${
          message.type === 'success'
            ? 'bg-emerald-100 text-emerald-800 border border-emerald-200'
            : 'bg-red-100 text-red-800 border border-red-200'
        }`}>
          {message.text}
        </div>
      )}

      <form onSubmit={submitFeedback} className="mb-8 grid gap-4 lg:grid-cols-[220px,1fr,160px]">
        <div>
          <label className="block text-sm font-semibold text-slate-700 mb-2">Category</label>
          <select
            value={form.category}
            onChange={(event) => setForm({ ...form, category: event.target.value })}
            className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-2xl outline-none focus:ring-2 focus:ring-orange-500"
          >
            <option value="ISSUE">Issue</option>
            <option value="SUGGESTION">Suggestion</option>
            <option value="CONCERN">Concern</option>
          </select>
        </div>

        <div>
          <label className="block text-sm font-semibold text-slate-700 mb-2">Subject</label>
          <input
            type="text"
            value={form.subject}
            onChange={(event) => setForm({ ...form, subject: event.target.value })}
            placeholder="Transport timing, classroom maintenance, fees clarification..."
            className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-2xl outline-none focus:ring-2 focus:ring-orange-500"
          />
        </div>

        <div className="flex items-end">
          <button
            type="submit"
            disabled={saving}
            className="w-full px-5 py-3 rounded-2xl bg-orange-500 text-white font-bold hover:bg-orange-600 disabled:opacity-60"
          >
            {saving ? 'Sending...' : 'Submit'}
          </button>
        </div>

        <div className="lg:col-span-3">
          <label className="block text-sm font-semibold text-slate-700 mb-2">Message</label>
          <textarea
            rows="4"
            value={form.message}
            onChange={(event) => setForm({ ...form, message: event.target.value })}
            placeholder="Share details so the school can review and take action."
            className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-2xl outline-none focus:ring-2 focus:ring-orange-500"
          />
        </div>
      </form>

      <div>
        <div className="flex items-center justify-between mb-4">
          <h4 className="text-lg font-display font-bold text-slate-900">Your Feedback History</h4>
          <button
            onClick={fetchFeedback}
            className="px-4 py-2 rounded-2xl bg-slate-100 text-slate-700 text-sm font-semibold hover:bg-slate-200"
          >
            Refresh
          </button>
        </div>

        {loading ? (
          <div className="text-slate-500 font-semibold">Loading feedback...</div>
        ) : feedback.length === 0 ? (
          <div className="border border-dashed border-slate-200 rounded-3xl p-10 text-center text-slate-400 font-semibold">
            No feedback submitted yet.
          </div>
        ) : (
          <div className="space-y-4">
            {feedback.map((item) => (
              <div key={item._id} className="border border-slate-200 rounded-3xl p-5">
                <div className="flex flex-wrap items-center gap-2 mb-3">
                  <span className={`px-3 py-1 rounded-full text-xs font-bold ${statusClasses[item.status] || statusClasses.OPEN}`}>
                    {item.status}
                  </span>
                  <span className="px-3 py-1 rounded-full text-xs font-bold bg-slate-100 text-slate-600">
                    {item.category}
                  </span>
                </div>

                <h5 className="text-base font-bold text-slate-900">{item.subject}</h5>
                <p className="text-sm text-slate-600 mt-2 leading-relaxed">{item.message}</p>

                {item.staffNote && (
                  <div className="mt-4 bg-emerald-50 border border-emerald-200 rounded-2xl p-4">
                    <p className="text-xs font-bold uppercase tracking-wider text-emerald-700 mb-1">School Note</p>
                    <p className="text-sm text-emerald-800">{item.staffNote}</p>
                  </div>
                )}

                <p className="text-xs text-slate-400 mt-3">
                  Submitted {new Date(item.createdAt).toLocaleString()}
                </p>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
