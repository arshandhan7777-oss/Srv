import { useEffect, useState } from 'react';
import axios from 'axios';
import { ClipboardList } from 'lucide-react';
import API_URL from '../config/api.js';

function buildAnswerState(polls) {
  return polls.reduce((acc, poll) => {
    const answers = {};

    poll.questions.forEach((question) => {
      const existingAnswer = poll.myResponse?.answers?.find(
        (answer) => String(answer.questionId) === String(question._id)
      );

      answers[question._id] = {
        selectedOption: existingAnswer?.selectedOption === 'Other'
          ? '__OTHER__'
          : existingAnswer?.selectedOption || '',
        otherText: existingAnswer?.otherText || ''
      };
    });

    acc[poll._id] = answers;
    return acc;
  }, {});
}

export function ParentPollsSection() {
  const [polls, setPolls] = useState([]);
  const [answers, setAnswers] = useState({});
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState({ text: '', type: '' });
  const [submittingId, setSubmittingId] = useState(null);

  const fetchPolls = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem('schoolToken');
      const res = await axios.get(`${API_URL}/api/parent/polls`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setPolls(res.data);
      setAnswers(buildAnswerState(res.data));
    } catch (error) {
      setMessage({ text: 'Unable to load active polls.', type: 'error' });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPolls();
  }, []);

  const updateAnswer = (pollId, questionId, nextAnswer) => {
    setAnswers((current) => ({
      ...current,
      [pollId]: {
        ...(current[pollId] || {}),
        [questionId]: {
          ...(current[pollId]?.[questionId] || {}),
          ...nextAnswer
        }
      }
    }));
  };

  const submitPoll = async (poll) => {
    setSubmittingId(poll._id);
    setMessage({ text: '', type: '' });

    try {
      const token = localStorage.getItem('schoolToken');
      const payload = {
        answers: poll.questions.map((question) => ({
          questionId: question._id,
          selectedOption: answers[poll._id]?.[question._id]?.selectedOption || '',
          otherText: answers[poll._id]?.[question._id]?.otherText || ''
        }))
      };

      await axios.post(`${API_URL}/api/parent/polls/${poll._id}/respond`, payload, {
        headers: { Authorization: `Bearer ${token}` }
      });

      setMessage({ text: 'Your poll response has been saved.', type: 'success' });
      fetchPolls();
    } catch (error) {
      setMessage({ text: error.response?.data?.message || 'Unable to submit your response.', type: 'error' });
    } finally {
      setSubmittingId(null);
    }
  };

  return (
    <div className="mt-8 rounded-3xl border border-slate-100 bg-white p-5 shadow-sm sm:p-8">
      <div className="flex items-center gap-3 mb-6">
        <ClipboardList className="text-emerald-600" />
        <div>
          <h3 className="text-xl font-display font-bold text-slate-900">Active Opinion Polls</h3>
          <p className="text-sm text-slate-500">Share your view and submit one response per poll.</p>
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
        <div className="text-slate-500 font-semibold">Loading polls...</div>
      ) : polls.length === 0 ? (
        <div className="border border-dashed border-slate-200 rounded-3xl p-10 text-center text-slate-400 font-semibold">
          No active polls are waiting for your response.
        </div>
      ) : (
        <div className="space-y-6">
          {polls.map((poll) => (
            <div key={poll._id} className="rounded-3xl border border-slate-200 bg-gradient-to-br from-white via-white to-emerald-50/40 p-5 sm:p-6">
              <div className="flex flex-wrap items-center gap-2 mb-3">
                <span className="px-3 py-1 rounded-full text-xs font-bold bg-emerald-100 text-emerald-700">
                  {poll.myResponse ? 'Response Saved' : 'Awaiting Response'}
                </span>
                {poll.closesAt && (
                  <span className="px-3 py-1 rounded-full text-xs font-bold bg-slate-100 text-slate-600">
                    Closes {new Date(poll.closesAt).toLocaleDateString()}
                  </span>
                )}
              </div>

              <h4 className="text-xl font-display font-bold text-slate-900">{poll.title}</h4>
              {poll.description && (
                <p className="text-sm text-slate-600 mt-1 mb-5">{poll.description}</p>
              )}

              <div className="space-y-5">
                {poll.questions.map((question, index) => {
                  const currentAnswer = answers[poll._id]?.[question._id] || { selectedOption: '', otherText: '' };

                  return (
                    <div key={question._id} className="bg-white border border-slate-200 rounded-3xl p-5 shadow-sm">
                      <h5 className="text-base font-bold text-slate-900 mb-4">{index + 1}. {question.prompt}</h5>

                      <div className="grid gap-3 md:grid-cols-2">
                        {question.options.map((option) => (
                          <label
                            key={option}
                            className={`flex items-center gap-3 rounded-2xl border px-4 py-3 cursor-pointer transition-colors ${
                              currentAnswer.selectedOption === option
                                ? 'border-emerald-400 bg-emerald-50'
                                : 'border-slate-200 bg-white hover:border-emerald-300'
                            }`}
                          >
                            <input
                              type="radio"
                              name={`${poll._id}-${question._id}`}
                              checked={currentAnswer.selectedOption === option}
                              onChange={() => updateAnswer(poll._id, question._id, { selectedOption: option })}
                              className="w-4 h-4 accent-emerald-600"
                            />
                            <span className="text-sm font-semibold text-slate-700">{option}</span>
                          </label>
                        ))}

                        {question.allowOther && (
                          <div className={`rounded-2xl border px-4 py-3 ${
                            currentAnswer.selectedOption === '__OTHER__'
                              ? 'border-emerald-400 bg-emerald-50'
                              : 'border-slate-200 bg-white'
                          }`}>
                            <label className="flex items-center gap-3 cursor-pointer mb-3">
                              <input
                                type="radio"
                                name={`${poll._id}-${question._id}`}
                                checked={currentAnswer.selectedOption === '__OTHER__'}
                                onChange={() => updateAnswer(poll._id, question._id, { selectedOption: '__OTHER__' })}
                                className="w-4 h-4 accent-emerald-600"
                              />
                              <span className="text-sm font-semibold text-slate-700">Other</span>
                            </label>

                            <input
                              type="text"
                              value={currentAnswer.otherText}
                              onFocus={() => updateAnswer(poll._id, question._id, { selectedOption: '__OTHER__' })}
                              onChange={(event) => updateAnswer(poll._id, question._id, { otherText: event.target.value })}
                              placeholder="Write your answer"
                              className="w-full px-4 py-3 bg-white border border-slate-200 rounded-2xl outline-none focus:ring-2 focus:ring-emerald-500"
                            />
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>

              <div className="mt-5 flex justify-stretch sm:justify-end">
                <button
                  onClick={() => submitPoll(poll)}
                  disabled={submittingId === poll._id}
                  className="w-full rounded-2xl bg-emerald-600 px-6 py-3 font-bold text-white hover:bg-emerald-700 disabled:opacity-60 sm:w-auto"
                >
                  {submittingId === poll._id ? 'Submitting...' : poll.myResponse ? 'Update Response' : 'Submit Poll'}
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
