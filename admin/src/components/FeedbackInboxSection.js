import { useEffect, useState } from 'react';
import axios from 'axios';
import { MessageSquareMore } from 'lucide-react';
import API_URL from '../config/api.js';

const statusOptions = ['OPEN', 'IN_REVIEW', 'RESOLVED'];

const statusClasses = {
  OPEN: 'bg-red-100 text-red-700',
  IN_REVIEW: 'bg-amber-100 text-amber-700',
  RESOLVED: 'bg-emerald-100 text-emerald-700'
};

export function FeedbackInboxSection({ role }) {
  const [feedback, setFeedback] = useState([]);
  const [drafts, setDrafts] = useState({});
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState({ text: '', type: '' });
  const endpoint = `${API_URL}/api/${role}/feedback`;

  const fetchFeedback = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem('schoolToken');
      const res = await axios.get(endpoint, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setFeedback(res.data);
      setDrafts(
        res.data.reduce((acc, item) => {
          acc[item._id] = {
            status: item.status,
            staffNote: item.staffNote || ''
          };
          return acc;
        }, {})
      );
    } catch (error) {
      setMessage({ text: 'Unable to load feedback inbox.', type: 'error' });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchFeedback();
  }, [endpoint]);

  const saveFeedback = async (feedbackId) => {
    try {
      const token = localStorage.getItem('schoolToken');
      await axios.put(`${endpoint}/${feedbackId}`, drafts[feedbackId], {
        headers: { Authorization: `Bearer ${token}` }
      });
      setMessage({ text: 'Feedback status updated.', type: 'success' });
      fetchFeedback();
    } catch (error) {
      setMessage({ text: error.response?.data?.message || 'Unable to update feedback.', type: 'error' });
    }
  };

  return (
    <div className="mt-8 bg-white rounded-3xl p-8 shadow-sm border border-slate-100">
      <div className="flex items-center justify-between gap-4 mb-6">
        <div className="flex items-center gap-3">
          <MessageSquareMore className="text-orange-500" />
          <div>
            <h3 className="text-xl font-display font-bold text-slate-900">Parent Feedback Inbox</h3>
            <p className="text-sm text-slate-500">
              Review issues, suggestions, and concerns shared by parents.
            </p>
          </div>
        </div>

        <button
          onClick={fetchFeedback}
          className="px-4 py-2 rounded-2xl bg-slate-100 text-slate-700 text-sm font-semibold hover:bg-slate-200"
        >
          Refresh
        </button>
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

      {loading ? (
        <div className="text-slate-500 font-semibold">Loading feedback...</div>
      ) : feedback.length === 0 ? (
        <div className="border border-dashed border-slate-200 rounded-3xl p-10 text-center text-slate-400 font-semibold">
          No parent feedback available yet.
        </div>
      ) : (
        <div className="space-y-5">
          {feedback.map((item) => {
            const draft = drafts[item._id] || { status: item.status, staffNote: item.staffNote || '' };
            return (
              <div key={item._id} className="border border-slate-200 rounded-3xl p-6">
                <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between gap-4 mb-4">
                  <div>
                    <div className="flex flex-wrap items-center gap-2 mb-2">
                      <span className={`px-3 py-1 rounded-full text-xs font-bold ${statusClasses[item.status] || statusClasses.OPEN}`}>
                        {item.status}
                      </span>
                      <span className="px-3 py-1 rounded-full text-xs font-bold bg-slate-100 text-slate-600">
                        {item.category}
                      </span>
                      <span className="px-3 py-1 rounded-full text-xs font-bold bg-blue-100 text-blue-700">
                        {item.grade}-{item.section}
                      </span>
                    </div>
                    <h4 className="text-lg font-display font-bold text-slate-900">{item.subject}</h4>
                    <p className="text-sm text-slate-500 mt-1">
                      Parent: {item.parentId?.name || 'Parent'} • Student: {item.studentName || item.studentId?.name || 'Student'}
                      {role === 'admin' && item.facultyId?.name ? ` • Faculty: ${item.facultyId.name}` : ''}
                    </p>
                    <p className="text-xs text-slate-400 mt-1">
                      Submitted {new Date(item.createdAt).toLocaleString()}
                    </p>
                  </div>
                </div>

                <div className="bg-slate-50 border border-slate-200 rounded-2xl p-4 text-sm text-slate-700 leading-relaxed mb-4">
                  {item.message}
                </div>

                <div className="grid lg:grid-cols-[220px,1fr,140px] gap-4">
                  <div>
                    <label className="block text-sm font-semibold text-slate-700 mb-2">Status</label>
                    <select
                      value={draft.status}
                      onChange={(event) => setDrafts({
                        ...drafts,
                        [item._id]: {
                          ...draft,
                          status: event.target.value
                        }
                      })}
                      className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-2xl outline-none focus:ring-2 focus:ring-emerald-500"
                    >
                      {statusOptions.map((status) => (
                        <option key={status} value={status}>{status}</option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-semibold text-slate-700 mb-2">Review Note</label>
                    <textarea
                      rows="3"
                      value={draft.staffNote}
                      onChange={(event) => setDrafts({
                        ...drafts,
                        [item._id]: {
                          ...draft,
                          staffNote: event.target.value
                        }
                      })}
                      placeholder="Add next steps, ownership, or closure notes..."
                      className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-2xl outline-none focus:ring-2 focus:ring-emerald-500"
                    />
                  </div>

                  <div className="flex items-end">
                    <button
                      onClick={() => saveFeedback(item._id)}
                      className="w-full px-5 py-3 rounded-2xl bg-emerald-600 text-white font-bold hover:bg-emerald-700"
                    >
                      Save
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
