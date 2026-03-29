import { useEffect, useMemo, useState } from 'react';
import axios from 'axios';
import { BarChart3, CheckCircle2, ClipboardList, Plus, Trash2 } from 'lucide-react';
import API_URL from '../config/api.js';

const createQuestion = () => ({
  prompt: '',
  options: ['', ''],
  allowOther: false
});

const createInitialForm = (role) => ({
  title: '',
  description: '',
  targetType: role === 'admin' ? 'GLOBAL' : 'CLASS',
  targetGrade: '',
  targetSection: '',
  closesAt: '',
  questions: [createQuestion()]
});

const statusClasses = {
  ACTIVE: 'bg-emerald-100 text-emerald-700',
  CLOSED: 'bg-slate-100 text-slate-600',
  DRAFT: 'bg-amber-100 text-amber-700'
};

function formatTarget(poll) {
  return poll.targetType === 'GLOBAL'
    ? 'All parent accounts'
    : `${poll.targetGrade || '-'}-${poll.targetSection || '-'}`;
}

export function OpinionPollSection({ role }) {
  const [polls, setPolls] = useState([]);
  const [form, setForm] = useState(() => createInitialForm(role));
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState({ text: '', type: '' });

  const endpointBase = useMemo(() => `${API_URL}/api/${role}/polls`, [role]);

  const fetchPolls = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem('schoolToken');
      const res = await axios.get(endpointBase, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setPolls(res.data);
    } catch (error) {
      setMessage({ text: 'Unable to load polls right now.', type: 'error' });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPolls();
  }, [endpointBase]);

  const updateQuestion = (questionIndex, updater) => {
    setForm((current) => ({
      ...current,
      questions: current.questions.map((question, index) => (
        index === questionIndex ? updater(question) : question
      ))
    }));
  };

  const submitPoll = async (event) => {
    event.preventDefault();
    setSaving(true);
    setMessage({ text: '', type: '' });

    try {
      const token = localStorage.getItem('schoolToken');
      const payload = {
        ...form,
        questions: form.questions.map((question) => ({
          prompt: question.prompt,
          options: question.options,
          allowOther: question.allowOther
        }))
      };

      await axios.post(endpointBase, payload, {
        headers: { Authorization: `Bearer ${token}` }
      });

      setForm(createInitialForm(role));
      setMessage({ text: 'Poll created successfully.', type: 'success' });
      fetchPolls();
    } catch (error) {
      setMessage({ text: error.response?.data?.message || 'Failed to create poll.', type: 'error' });
    } finally {
      setSaving(false);
    }
  };

  const updatePollStatus = async (pollId, status) => {
    try {
      const token = localStorage.getItem('schoolToken');
      await axios.put(`${endpointBase}/${pollId}`, { status }, {
        headers: { Authorization: `Bearer ${token}` }
      });
      fetchPolls();
    } catch (error) {
      setMessage({ text: error.response?.data?.message || 'Failed to update poll.', type: 'error' });
    }
  };

  const deletePoll = async (pollId) => {
    if (!window.confirm('Delete this poll and all submitted votes?')) {
      return;
    }

    try {
      const token = localStorage.getItem('schoolToken');
      await axios.delete(`${endpointBase}/${pollId}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      fetchPolls();
    } catch (error) {
      setMessage({ text: error.response?.data?.message || 'Failed to delete poll.', type: 'error' });
    }
  };

  return (
    <div className="mt-8 space-y-6">
      <div className="bg-white rounded-3xl p-8 shadow-sm border border-slate-100">
        <div className="flex items-center gap-3 mb-6">
          <ClipboardList className="text-emerald-600" />
          <div>
            <h3 className="text-xl font-display font-bold text-slate-900">Opinion Poll Center</h3>
            <p className="text-sm text-slate-500">
              {role === 'admin'
                ? 'Create school-wide or class-specific polls and watch the response patterns.'
                : 'Run opinion polls for your class and track how families are responding.'}
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

        <form onSubmit={submitPoll} className="space-y-5">
          <div className="grid lg:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-2">Poll Title</label>
              <input
                type="text"
                value={form.title}
                onChange={(event) => setForm({ ...form, title: event.target.value })}
                placeholder="Quarterly parent feedback"
                className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-2xl outline-none focus:ring-2 focus:ring-emerald-500"
              />
            </div>

            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-2">Closes On</label>
              <input
                type="date"
                value={form.closesAt}
                onChange={(event) => setForm({ ...form, closesAt: event.target.value })}
                className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-2xl outline-none focus:ring-2 focus:ring-emerald-500"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-semibold text-slate-700 mb-2">Description</label>
            <textarea
              rows="3"
              value={form.description}
              onChange={(event) => setForm({ ...form, description: event.target.value })}
              placeholder="Tell parents why this poll matters."
              className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-2xl outline-none focus:ring-2 focus:ring-emerald-500"
            />
          </div>

          {role === 'admin' && (
            <div className="grid md:grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-2">Audience</label>
                <select
                  value={form.targetType}
                  onChange={(event) => setForm({
                    ...form,
                    targetType: event.target.value,
                    targetGrade: '',
                    targetSection: ''
                  })}
                  className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-2xl outline-none focus:ring-2 focus:ring-emerald-500"
                >
                  <option value="GLOBAL">All Parents</option>
                  <option value="CLASS">Specific Class</option>
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
                      className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-2xl outline-none focus:ring-2 focus:ring-emerald-500"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-semibold text-slate-700 mb-2">Section</label>
                    <input
                      type="text"
                      value={form.targetSection}
                      onChange={(event) => setForm({ ...form, targetSection: event.target.value })}
                      placeholder="A"
                      className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-2xl outline-none focus:ring-2 focus:ring-emerald-500"
                    />
                  </div>
                </>
              )}
            </div>
          )}

          <div className="space-y-4">
            {form.questions.map((question, questionIndex) => (
              <div key={questionIndex} className="border border-slate-200 rounded-3xl p-5 bg-slate-50">
                <div className="flex items-center justify-between mb-4">
                  <h4 className="font-bold text-slate-900">Question {questionIndex + 1}</h4>
                  {form.questions.length > 1 && (
                    <button
                      type="button"
                      onClick={() => setForm({
                        ...form,
                        questions: form.questions.filter((_, index) => index !== questionIndex)
                      })}
                      className="text-sm font-semibold text-red-500 hover:text-red-700"
                    >
                      Remove
                    </button>
                  )}
                </div>

                <div className="space-y-4">
                  <input
                    type="text"
                    value={question.prompt}
                    onChange={(event) => updateQuestion(questionIndex, (current) => ({
                      ...current,
                      prompt: event.target.value
                    }))}
                    placeholder="What would you like to ask?"
                    className="w-full px-4 py-3 bg-white border border-slate-200 rounded-2xl outline-none focus:ring-2 focus:ring-emerald-500"
                  />

                  <div className="grid md:grid-cols-2 gap-3">
                    {question.options.map((option, optionIndex) => (
                      <div key={optionIndex} className="flex gap-2">
                        <input
                          type="text"
                          value={option}
                          onChange={(event) => updateQuestion(questionIndex, (current) => ({
                            ...current,
                            options: current.options.map((currentOption, index) => (
                              index === optionIndex ? event.target.value : currentOption
                            ))
                          }))}
                          placeholder={`Option ${optionIndex + 1}`}
                          className="flex-1 px-4 py-3 bg-white border border-slate-200 rounded-2xl outline-none focus:ring-2 focus:ring-emerald-500"
                        />
                        {question.options.length > 2 && (
                          <button
                            type="button"
                            onClick={() => updateQuestion(questionIndex, (current) => ({
                              ...current,
                              options: current.options.filter((_, index) => index !== optionIndex)
                            }))}
                            className="px-3 rounded-2xl bg-red-50 text-red-500 hover:bg-red-100"
                          >
                            <Trash2 size={16} />
                          </button>
                        )}
                      </div>
                    ))}
                  </div>

                  <div className="flex flex-wrap items-center justify-between gap-3">
                    <button
                      type="button"
                      onClick={() => updateQuestion(questionIndex, (current) => ({
                        ...current,
                        options: [...current.options, '']
                      }))}
                      className="inline-flex items-center gap-2 px-4 py-2 bg-white border border-slate-200 rounded-2xl text-sm font-semibold text-slate-700 hover:border-emerald-300 hover:text-emerald-700"
                    >
                      <Plus size={16} /> Add Option
                    </button>

                    <label className="inline-flex items-center gap-2 text-sm font-semibold text-slate-700">
                      <input
                        type="checkbox"
                        checked={question.allowOther}
                        onChange={(event) => updateQuestion(questionIndex, (current) => ({
                          ...current,
                          allowOther: event.target.checked
                        }))}
                        className="w-4 h-4 accent-emerald-600"
                      />
                      Allow Other response
                    </label>
                  </div>
                </div>
              </div>
            ))}
          </div>

          <div className="flex flex-wrap items-center justify-between gap-3">
            <button
              type="button"
              onClick={() => setForm({ ...form, questions: [...form.questions, createQuestion()] })}
              className="inline-flex items-center gap-2 px-5 py-3 rounded-2xl bg-slate-100 text-slate-700 font-semibold hover:bg-slate-200"
            >
              <Plus size={18} /> Add Question
            </button>

            <button
              type="submit"
              disabled={saving}
              className="inline-flex items-center gap-2 px-6 py-3 rounded-2xl bg-emerald-600 text-white font-bold hover:bg-emerald-700 disabled:opacity-60"
            >
              <CheckCircle2 size={18} /> {saving ? 'Publishing...' : 'Publish Poll'}
            </button>
          </div>
        </form>
      </div>

      <div className="bg-white rounded-3xl p-8 shadow-sm border border-slate-100">
        <div className="flex items-center justify-between gap-4 mb-6">
          <div className="flex items-center gap-3">
            <BarChart3 className="text-blue-600" />
            <div>
              <h3 className="text-xl font-display font-bold text-slate-900">Poll Analytics</h3>
              <p className="text-sm text-slate-500">Distribution, top choices, and “Other” responses.</p>
            </div>
          </div>

          <button
            onClick={fetchPolls}
            className="px-4 py-2 rounded-2xl bg-slate-100 text-slate-700 text-sm font-semibold hover:bg-slate-200"
          >
            Refresh
          </button>
        </div>

        {loading ? (
          <div className="text-slate-500 font-semibold">Loading polls...</div>
        ) : polls.length === 0 ? (
          <div className="border border-dashed border-slate-200 rounded-3xl p-10 text-center text-slate-400 font-semibold">
            No polls created yet.
          </div>
        ) : (
          <div className="space-y-6">
            {polls.map((poll) => (
              <div key={poll._id} className="border border-slate-200 rounded-3xl p-6">
                {(() => {
                  const canManage = role === 'admin' || poll.createdByRole === role;
                  return (
                    <>
                <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between gap-4 mb-5">
                  <div>
                    <div className="flex flex-wrap items-center gap-2 mb-2">
                      <span className={`px-3 py-1 rounded-full text-xs font-bold ${statusClasses[poll.status] || statusClasses.CLOSED}`}>
                        {poll.status}
                      </span>
                      <span className="px-3 py-1 rounded-full text-xs font-bold bg-slate-100 text-slate-600">
                        {formatTarget(poll)}
                      </span>
                      <span className="px-3 py-1 rounded-full text-xs font-bold bg-blue-100 text-blue-700">
                        {poll.totalResponses || 0} responses
                      </span>
                    </div>
                    <h4 className="text-lg font-display font-bold text-slate-900">{poll.title}</h4>
                    {poll.description && (
                      <p className="text-sm text-slate-600 mt-1">{poll.description}</p>
                    )}
                    <p className="text-xs text-slate-400 mt-2">
                      Created {new Date(poll.createdAt).toLocaleDateString()} • by {poll.createdByRole}
                      {poll.closesAt ? ` • closes ${new Date(poll.closesAt).toLocaleDateString()}` : ''}
                    </p>
                  </div>

                  {canManage ? (
                    <div className="flex flex-wrap gap-2">
                      {poll.status === 'ACTIVE' ? (
                        <button
                          onClick={() => updatePollStatus(poll._id, 'CLOSED')}
                          className="px-4 py-2 rounded-2xl bg-amber-100 text-amber-700 text-sm font-bold hover:bg-amber-200"
                        >
                          Close Poll
                        </button>
                      ) : (
                        <button
                          onClick={() => updatePollStatus(poll._id, 'ACTIVE')}
                          className="px-4 py-2 rounded-2xl bg-emerald-100 text-emerald-700 text-sm font-bold hover:bg-emerald-200"
                        >
                          Reopen
                        </button>
                      )}
                      <button
                        onClick={() => deletePoll(poll._id)}
                        className="px-4 py-2 rounded-2xl bg-red-100 text-red-700 text-sm font-bold hover:bg-red-200"
                      >
                        Delete
                      </button>
                    </div>
                  ) : (
                    <div className="px-4 py-2 rounded-2xl bg-slate-100 text-slate-600 text-sm font-semibold h-fit">
                      View only
                    </div>
                  )}
                </div>

                <div className="space-y-5">
                  {poll.analytics?.questions?.map((question, index) => (
                    <div key={question.questionId || index} className="rounded-2xl bg-slate-50 border border-slate-200 p-5">
                      <div className="flex items-start justify-between gap-4 mb-4">
                        <div>
                          <h5 className="font-bold text-slate-900">{index + 1}. {question.prompt}</h5>
                          <p className="text-xs text-slate-500 mt-1">
                            Most selected: {question.topOptions?.length ? question.topOptions.join(', ') : 'No responses yet'}
                          </p>
                        </div>
                      </div>

                      <div className="space-y-3">
                        {question.distribution?.map((item) => (
                          <div key={item.option}>
                            <div className="flex items-center justify-between text-sm font-semibold text-slate-700 mb-1">
                              <span>{item.option}</span>
                              <span>{item.count} • {item.percentage}%</span>
                            </div>
                            <div className="h-2.5 rounded-full bg-white overflow-hidden border border-slate-200">
                              <div
                                className="h-full bg-emerald-500 rounded-full"
                                style={{ width: `${item.percentage}%` }}
                              />
                            </div>
                          </div>
                        ))}
                      </div>

                      {question.otherResponses?.length > 0 && (
                        <div className="mt-5 border-t border-slate-200 pt-4">
                          <p className="text-sm font-bold text-slate-800 mb-2">Other Responses</p>
                          <div className="space-y-2">
                            {question.otherResponses.map((entry, entryIndex) => (
                              <div key={entryIndex} className="bg-white border border-slate-200 rounded-2xl px-4 py-3 text-sm text-slate-600">
                                {entry.text}
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
                    </>
                  );
                })()}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
