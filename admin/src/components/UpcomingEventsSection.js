import { useEffect, useMemo, useState } from 'react';
import axios from 'axios';
import { CalendarDays, CheckCircle2, MapPin, Trash2 } from 'lucide-react';
import API_URL from '../config/api.js';

const initialForm = (role) => ({
  title: '',
  description: '',
  venue: '',
  eventDate: '',
  targetType: role === 'admin' ? 'GLOBAL' : 'CLASS',
  targetGrade: '',
  targetSection: ''
});

const statusClasses = {
  ACTIVE: 'bg-emerald-100 text-emerald-700',
  CLOSED: 'bg-slate-100 text-slate-600',
  CANCELLED: 'bg-red-100 text-red-700'
};

function formatTarget(event) {
  return event.targetType === 'GLOBAL'
    ? 'All parent accounts'
    : `${event.targetGrade || '-'}-${event.targetSection || '-'}`;
}

export function UpcomingEventsSection({ role }) {
  const [events, setEvents] = useState([]);
  const [form, setForm] = useState(() => initialForm(role));
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState({ text: '', type: '' });

  const endpointBase = useMemo(() => `${API_URL}/api/${role}/events`, [role]);
  const orderedEvents = [...events].sort((left, right) => {
    if (left.isArchived !== right.isArchived) {
      return left.isArchived ? 1 : -1;
    }

    return new Date(left.eventDate) - new Date(right.eventDate);
  });

  const fetchEvents = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem('schoolToken');
      const res = await axios.get(endpointBase, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setEvents(res.data);
    } catch (error) {
      setMessage({ text: 'Unable to load upcoming events.', type: 'error' });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchEvents();
  }, [endpointBase]);

  const submitEvent = async (event) => {
    event.preventDefault();
    setSaving(true);
    setMessage({ text: '', type: '' });

    try {
      const token = localStorage.getItem('schoolToken');
      await axios.post(endpointBase, form, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setForm(initialForm(role));
      setMessage({ text: 'Upcoming event created successfully.', type: 'success' });
      fetchEvents();
    } catch (error) {
      setMessage({ text: error.response?.data?.message || 'Failed to create event.', type: 'error' });
    } finally {
      setSaving(false);
    }
  };

  const updateEventStatus = async (eventId, status) => {
    try {
      const token = localStorage.getItem('schoolToken');
      await axios.put(`${endpointBase}/${eventId}`, { status }, {
        headers: { Authorization: `Bearer ${token}` }
      });
      fetchEvents();
    } catch (error) {
      setMessage({ text: error.response?.data?.message || 'Failed to update event.', type: 'error' });
    }
  };

  const deleteEvent = async (eventId) => {
    if (!window.confirm('Delete this event and all acknowledgements?')) {
      return;
    }

    try {
      const token = localStorage.getItem('schoolToken');
      await axios.delete(`${endpointBase}/${eventId}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      fetchEvents();
    } catch (error) {
      setMessage({ text: error.response?.data?.message || 'Failed to delete event.', type: 'error' });
    }
  };

  return (
    <div className="mt-8 space-y-6">
      <div className="rounded-3xl border border-slate-100 bg-white p-5 shadow-sm sm:p-8">
        <div className="flex items-center gap-3 mb-6">
          <CalendarDays className="text-orange-500" />
          <div>
            <h3 className="text-xl font-display font-bold text-slate-900">Upcoming Events</h3>
            <p className="text-sm text-slate-500">
              {role === 'admin'
                ? 'Publish school-wide or class events and collect parent acknowledgements.'
                : 'Create class events and receive participant name lists from parents.'}
            </p>
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

        <form onSubmit={submitEvent} className="space-y-4">
          <div className="grid gap-4 lg:grid-cols-2">
            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-2">Event Title</label>
              <input
                type="text"
                value={form.title}
                onChange={(event) => setForm({ ...form, title: event.target.value })}
                placeholder="Annual Day, Sports Meet, Excursion..."
                className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-2xl outline-none focus:ring-2 focus:ring-orange-500"
              />
            </div>

            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-2">Event Date</label>
              <input
                type="date"
                value={form.eventDate}
                onChange={(event) => setForm({ ...form, eventDate: event.target.value })}
                className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-2xl outline-none focus:ring-2 focus:ring-orange-500"
              />
            </div>
          </div>

          <div className="grid gap-4 lg:grid-cols-2">
            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-2">Venue</label>
              <input
                type="text"
                value={form.venue}
                onChange={(event) => setForm({ ...form, venue: event.target.value })}
                placeholder="School ground, auditorium, city hall..."
                className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-2xl outline-none focus:ring-2 focus:ring-orange-500"
              />
            </div>

            {role === 'admin' ? (
              <div className="grid gap-3 sm:grid-cols-3">
                <div className="col-span-1">
                  <label className="block text-sm font-semibold text-slate-700 mb-2">Audience</label>
                  <select
                    value={form.targetType}
                    onChange={(event) => setForm({
                      ...form,
                      targetType: event.target.value,
                      targetGrade: '',
                      targetSection: ''
                    })}
                    className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-2xl outline-none focus:ring-2 focus:ring-orange-500"
                  >
                    <option value="GLOBAL">All</option>
                    <option value="CLASS">Class</option>
                  </select>
                </div>
                {form.targetType === 'CLASS' && (
                  <>
                    <div>
                      <label className="block text-sm font-semibold text-slate-700 mb-2">Grade</label>
                      <input
                        type="text"
                        value={form.targetGrade}
                        onChange={(event) => setForm({ ...form, targetGrade: event.target.value })}
                        placeholder="10"
                        className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-2xl outline-none focus:ring-2 focus:ring-orange-500"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-semibold text-slate-700 mb-2">Section</label>
                      <input
                        type="text"
                        value={form.targetSection}
                        onChange={(event) => setForm({ ...form, targetSection: event.target.value })}
                        placeholder="A"
                        className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-2xl outline-none focus:ring-2 focus:ring-orange-500"
                      />
                    </div>
                  </>
                )}
              </div>
            ) : (
              <div className="rounded-2xl bg-orange-50 border border-orange-200 px-4 py-3">
                <p className="text-sm font-semibold text-orange-800">This event will go to your assigned class.</p>
              </div>
            )}
          </div>

          <div>
            <label className="block text-sm font-semibold text-slate-700 mb-2">Description</label>
            <textarea
              rows="4"
              value={form.description}
              onChange={(event) => setForm({ ...form, description: event.target.value })}
              placeholder="Explain the event, timings, instructions, materials, dress code, or any guidance for parents."
              className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-2xl outline-none focus:ring-2 focus:ring-orange-500"
            />
          </div>

          <div className="flex justify-stretch sm:justify-end">
            <button
              type="submit"
              disabled={saving}
              className="inline-flex w-full items-center justify-center gap-2 rounded-2xl bg-orange-500 px-6 py-3 font-bold text-white hover:bg-orange-600 disabled:opacity-60 sm:w-auto"
            >
              <CheckCircle2 size={18} /> {saving ? 'Publishing...' : 'Publish Event'}
            </button>
          </div>
        </form>
      </div>

      <div className="rounded-3xl border border-slate-100 bg-white p-5 shadow-sm sm:p-8">
        <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="min-w-0">
            <h3 className="text-xl font-display font-bold text-slate-900">Event Acknowledgements</h3>
            <p className="text-sm text-slate-500">Review who acknowledged each event and the participant names they shared.</p>
          </div>
          <button
            onClick={fetchEvents}
            className="px-4 py-2 rounded-2xl bg-slate-100 text-slate-700 text-sm font-semibold hover:bg-slate-200"
          >
            Refresh
          </button>
        </div>

        {loading ? (
          <div className="text-slate-500 font-semibold">Loading events...</div>
        ) : orderedEvents.length === 0 ? (
          <div className="border border-dashed border-slate-200 rounded-3xl p-10 text-center text-slate-400 font-semibold">
            No upcoming events created yet.
          </div>
        ) : (
          <div className="space-y-6">
            {orderedEvents.map((item) => {
              const canManage = role === 'admin' || item.createdByRole === role;
              return (
                <div key={item._id} className="rounded-3xl border border-slate-200 p-5 sm:p-6">
                  <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between gap-4 mb-5">
                    <div>
                      <div className="flex flex-wrap items-center gap-2 mb-2">
                      <span className={`px-3 py-1 rounded-full text-xs font-bold ${statusClasses[item.status] || statusClasses.CLOSED}`}>
                          {item.status}
                      </span>
                      {item.isArchived && (
                        <span className="px-3 py-1 rounded-full text-xs font-bold bg-slate-200 text-slate-700">
                          Archived Summary
                        </span>
                      )}
                      <span className="px-3 py-1 rounded-full text-xs font-bold bg-slate-100 text-slate-600">
                        {formatTarget(item)}
                      </span>
                        <span className="px-3 py-1 rounded-full text-xs font-bold bg-blue-100 text-blue-700">
                          {item.registrationCount || 0} acknowledgements
                        </span>
                      </div>
                      <h4 className="text-lg font-display font-bold text-slate-900">{item.title}</h4>
                      <div className="flex flex-wrap items-center gap-3 text-sm text-slate-500 mt-2">
                        <span className="inline-flex items-center gap-1"><CalendarDays size={14} /> {new Date(item.eventDate).toLocaleDateString()}</span>
                        {item.venue && <span className="inline-flex items-center gap-1"><MapPin size={14} /> {item.venue}</span>}
                      </div>
                      <p className="text-sm text-slate-600 mt-3">{item.description}</p>
                    </div>

                    {canManage && !item.isArchived ? (
                      <div className="flex flex-wrap gap-2">
                        {item.status === 'ACTIVE' ? (
                          <button
                            onClick={() => updateEventStatus(item._id, 'CLOSED')}
                            className="px-4 py-2 rounded-2xl bg-amber-100 text-amber-700 text-sm font-bold hover:bg-amber-200"
                          >
                            Close Event
                          </button>
                        ) : (
                          <button
                            onClick={() => updateEventStatus(item._id, 'ACTIVE')}
                            className="px-4 py-2 rounded-2xl bg-emerald-100 text-emerald-700 text-sm font-bold hover:bg-emerald-200"
                          >
                            Reopen
                          </button>
                        )}
                        <button
                          onClick={() => updateEventStatus(item._id, 'CANCELLED')}
                          className="px-4 py-2 rounded-2xl bg-red-100 text-red-700 text-sm font-bold hover:bg-red-200"
                        >
                          Cancel
                        </button>
                        <button
                          onClick={() => deleteEvent(item._id)}
                          className="px-4 py-2 rounded-2xl bg-slate-100 text-slate-700 text-sm font-bold hover:bg-slate-200"
                        >
                          <Trash2 size={16} />
                        </button>
                      </div>
                    ) : canManage ? (
                      <div className="px-4 py-2 rounded-2xl bg-slate-100 text-slate-600 text-sm font-semibold h-fit">
                        Past event summary
                      </div>
                    ) : (
                      <div className="px-4 py-2 rounded-2xl bg-slate-100 text-slate-600 text-sm font-semibold h-fit">
                        View only
                      </div>
                    )}
                  </div>

                  {item.registrations?.length > 0 ? (
                    <div className="space-y-3">
                      {item.registrations.map((registration) => (
                        <div key={registration._id} className="bg-slate-50 border border-slate-200 rounded-2xl p-4">
                          <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-3">
                            <div>
                              <p className="font-bold text-slate-900">
                                {registration.isArchivedSnapshot
                                  ? (registration.studentId?.name || 'Student')
                                  : `${registration.parentId?.name || 'Parent'} • ${registration.studentId?.name || 'Student'}`}
                              </p>
                              <p className="text-xs text-slate-500 mt-1">
                                {registration.isArchivedSnapshot ? 'Archived after event completion' : 'Acknowledged'} {new Date(registration.acknowledgedAt || registration.createdAt).toLocaleString()}
                              </p>
                            </div>
                            <div className="text-sm text-slate-600">
                              {registration.isArchivedSnapshot
                                ? 'Student participation preserved'
                                : registration.participantNames?.length > 0
                                ? `Names: ${registration.participantNames.join(', ')}`
                                : 'Acknowledged without names'}
                            </div>
                          </div>
                          {registration.note && !registration.isArchivedSnapshot && (
                            <p className="text-sm text-slate-600 mt-3 leading-relaxed">{registration.note}</p>
                          )}
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="border border-dashed border-slate-200 rounded-2xl p-6 text-center text-slate-400 font-semibold">
                      No acknowledgements yet.
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
