import { useEffect, useState } from 'react';
import axios from 'axios';
import { CalendarDays, MapPin } from 'lucide-react';
import API_URL from '../config/api.js';

function buildDraftState(events) {
  return events.reduce((acc, event) => {
    acc[event._id] = {
      participantNames: event.myRegistration?.participantNames?.join(', ') || '',
      note: event.myRegistration?.note || ''
    };
    return acc;
  }, {});
}

export function ParentEventsSection() {
  const [events, setEvents] = useState([]);
  const [drafts, setDrafts] = useState({});
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState({ text: '', type: '' });
  const [savingId, setSavingId] = useState(null);

  const fetchEvents = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem('schoolToken');
      const res = await axios.get(`${API_URL}/api/parent/events`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setEvents(res.data);
      setDrafts(buildDraftState(res.data));
    } catch (error) {
      setMessage({ text: 'Unable to load upcoming events.', type: 'error' });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchEvents();
  }, []);

  const submitRegistration = async (eventId) => {
    setSavingId(eventId);
    setMessage({ text: '', type: '' });

    try {
      const token = localStorage.getItem('schoolToken');
      const draft = drafts[eventId] || { participantNames: '', note: '' };
      await axios.post(`${API_URL}/api/parent/events/${eventId}/register`, draft, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setMessage({ text: 'Event acknowledgement saved successfully.', type: 'success' });
      fetchEvents();
    } catch (error) {
      setMessage({ text: error.response?.data?.message || 'Unable to save event acknowledgement.', type: 'error' });
    } finally {
      setSavingId(null);
    }
  };

  return (
    <div className="mt-8 rounded-3xl border border-slate-100 bg-white p-5 shadow-sm sm:p-8">
      <div className="flex items-center gap-3 mb-6">
        <CalendarDays className="text-orange-500" />
        <div>
          <h3 className="text-xl font-display font-bold text-slate-900">Upcoming Events</h3>
          <p className="text-sm text-slate-500">View upcoming events and send your acknowledgement or participant names to the faculty.</p>
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

      {loading ? (
        <div className="text-slate-500 font-semibold">Loading upcoming events...</div>
      ) : events.length === 0 ? (
        <div className="border border-dashed border-slate-200 rounded-3xl p-10 text-center text-slate-400 font-semibold">
          No upcoming events available right now.
        </div>
      ) : (
        <div className="space-y-6">
          {events.map((event) => {
            const draft = drafts[event._id] || { participantNames: '', note: '' };
            return (
              <div key={event._id} className="rounded-3xl border border-slate-200 bg-gradient-to-br from-white via-white to-orange-50/40 p-5 sm:p-6">
                <div className="flex flex-wrap items-center gap-2 mb-3">
                  <span className="px-3 py-1 rounded-full text-xs font-bold bg-orange-100 text-orange-700">
                    {event.myRegistration ? 'Acknowledged' : 'Awaiting acknowledgement'}
                  </span>
                  <span className="px-3 py-1 rounded-full text-xs font-bold bg-slate-100 text-slate-600">
                    {event.targetType === 'GLOBAL' ? 'School event' : `Class ${event.targetGrade}-${event.targetSection}`}
                  </span>
                </div>

                <h4 className="text-xl font-display font-bold text-slate-900">{event.title}</h4>
                <div className="flex flex-wrap items-center gap-3 text-sm text-slate-500 mt-2">
                  <span className="inline-flex items-center gap-1"><CalendarDays size={14} /> {new Date(event.eventDate).toLocaleDateString()}</span>
                  {event.venue && <span className="inline-flex items-center gap-1"><MapPin size={14} /> {event.venue}</span>}
                </div>
                <p className="text-sm text-slate-600 mt-3">{event.description}</p>

                <div className="mt-5 grid gap-4 lg:grid-cols-[1fr,1fr,180px]">
                  <div>
                    <label className="block text-sm font-semibold text-slate-700 mb-2">Participant Name List</label>
                    <input
                      type="text"
                      value={draft.participantNames}
                      onChange={(inputEvent) => setDrafts({
                        ...drafts,
                        [event._id]: {
                          ...draft,
                          participantNames: inputEvent.target.value
                        }
                      })}
                      placeholder="Enter names separated by commas"
                      className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-2xl outline-none focus:ring-2 focus:ring-orange-500"
                    />
                    <p className="text-xs text-slate-400 mt-2">Leave blank if you only want to acknowledge the event.</p>
                  </div>

                  <div>
                    <label className="block text-sm font-semibold text-slate-700 mb-2">Note to Faculty</label>
                    <textarea
                      rows="3"
                      value={draft.note}
                      onChange={(inputEvent) => setDrafts({
                        ...drafts,
                        [event._id]: {
                          ...draft,
                          note: inputEvent.target.value
                        }
                      })}
                      placeholder="Transport, permissions, costume info, or anything faculty should know."
                      className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-2xl outline-none focus:ring-2 focus:ring-orange-500"
                    />
                  </div>

                  <div className="flex items-end">
                    <button
                      onClick={() => submitRegistration(event._id)}
                      disabled={savingId === event._id}
                      className="w-full px-5 py-3 rounded-2xl bg-orange-500 text-white font-bold hover:bg-orange-600 disabled:opacity-60"
                    >
                      {savingId === event._id ? 'Saving...' : event.myRegistration ? 'Update Reply' : 'Send to Faculty'}
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
