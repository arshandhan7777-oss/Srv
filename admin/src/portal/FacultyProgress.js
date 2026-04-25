import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import {
  ChevronLeft, Plus, Send, CheckCircle2, XCircle, Clock, Trophy,
  AlertTriangle, Star, ExternalLink, Trash2, Eye, Award, Target,
  TrendingUp, Users, BarChart3, Sparkles, MessageSquare
} from 'lucide-react';
import API_URL from '../config/api.js';
import Swal from 'sweetalert2';
import { PortalHeader } from '../components/PortalHeader.js';

export function FacultyProgress() {
  const navigate = useNavigate();
  const token = localStorage.getItem('schoolToken');
  const headers = { Authorization: `Bearer ${token}` };

  // State
  const [activeTab, setActiveTab] = useState('tasks'); // 'tasks' | 'leaderboard'
  const [tasks, setTasks] = useState([]);
  const [leaderboard, setLeaderboard] = useState([]);
  const [faculties, setFaculties] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [reviewingSubmission, setReviewingSubmission] = useState(null);

  // Create task form
  const [taskForm, setTaskForm] = useState({
    title: '', description: '', taskType: 'General', deadline: '', targetAll: true, assignedTo: []
  });

  // Review form
  const [reviewForm, setReviewForm] = useState({ status: 'Approved', qualityScore: 80, adminFeedback: '' });

  // Fetch data
  const fetchTasks = useCallback(async () => {
    try {
      const res = await axios.get(`${API_URL}/api/tasks`, { headers });
      setTasks(res.data);
    } catch (err) { console.error('Error fetching tasks:', err); }
  }, []);

  const fetchLeaderboard = useCallback(async () => {
    try {
      const res = await axios.get(`${API_URL}/api/performance/leaderboard`, { headers });
      setLeaderboard(res.data);
    } catch (err) { console.error('Error fetching leaderboard:', err); }
  }, []);

  const fetchFaculties = useCallback(async () => {
    try {
      const res = await axios.get(`${API_URL}/api/admin/faculty`, { headers });
      setFaculties(res.data);
    } catch (err) { console.error('Error fetching faculties:', err); }
  }, []);

  useEffect(() => {
    Promise.all([fetchTasks(), fetchLeaderboard(), fetchFaculties()])
      .finally(() => setLoading(false));
  }, []);

  // Create task
  const handleCreateTask = async (e) => {
    e.preventDefault();
    if (!taskForm.title.trim() || !taskForm.description.trim() || !taskForm.deadline) {
      Swal.fire('Missing Fields', 'Please fill in all required fields.', 'warning');
      return;
    }
    try {
      await axios.post(`${API_URL}/api/tasks`, taskForm, { headers });
      Swal.fire({ toast: true, position: 'top-end', icon: 'success', title: 'Task assigned!', showConfirmButton: false, timer: 2000 });
      setShowCreateForm(false);
      setTaskForm({ title: '', description: '', taskType: 'General', deadline: '', targetAll: true, assignedTo: [] });
      fetchTasks();
    } catch (err) {
      Swal.fire('Error', err.response?.data?.message || 'Failed to create task.', 'error');
    }
  };

  // Delete task
  const handleDeleteTask = async (id) => {
    const { isConfirmed } = await Swal.fire({
      title: 'Delete Task?', text: 'All submissions will also be removed.', icon: 'warning',
      showCancelButton: true, confirmButtonColor: '#ef4444', confirmButtonText: 'Delete'
    });
    if (!isConfirmed) return;
    try {
      await axios.delete(`${API_URL}/api/tasks/${id}`, { headers });
      fetchTasks();
      fetchLeaderboard();
    } catch (err) {
      Swal.fire('Error', 'Failed to delete task.', 'error');
    }
  };

  // Review submission
  const handleReviewSubmission = async () => {
    if (!reviewingSubmission) return;
    try {
      await axios.put(`${API_URL}/api/tasks/submissions/${reviewingSubmission._id}`, reviewForm, { headers });
      Swal.fire({ toast: true, position: 'top-end', icon: 'success', title: 'Submission reviewed!', showConfirmButton: false, timer: 2000 });
      setReviewingSubmission(null);
      setReviewForm({ status: 'Approved', qualityScore: 80, adminFeedback: '' });
      fetchTasks();
      fetchLeaderboard();
    } catch (err) {
      Swal.fire('Error', 'Failed to review submission.', 'error');
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('schoolToken');
    localStorage.removeItem('schoolUser');
    navigate('/admin-login');
  };

  const getStatusBadge = (status) => {
    const map = {
      Pending: { bg: 'bg-amber-100 text-amber-800', icon: Clock },
      Approved: { bg: 'bg-emerald-100 text-emerald-800', icon: CheckCircle2 },
      Rejected: { bg: 'bg-red-100 text-red-800', icon: XCircle }
    };
    const config = map[status] || map.Pending;
    const Icon = config.icon;
    return (
      <span className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-bold ${config.bg}`}>
        <Icon size={14} /> {status}
      </span>
    );
  };

  const getRankBadge = (rank) => {
    if (rank === 1) return <div className="flex h-10 w-10 items-center justify-center rounded-full bg-gradient-to-br from-yellow-400 to-amber-500 text-white font-black text-lg shadow-lg shadow-amber-200">🥇</div>;
    if (rank === 2) return <div className="flex h-10 w-10 items-center justify-center rounded-full bg-gradient-to-br from-slate-300 to-slate-400 text-white font-black text-lg shadow-lg shadow-slate-200">🥈</div>;
    if (rank === 3) return <div className="flex h-10 w-10 items-center justify-center rounded-full bg-gradient-to-br from-orange-400 to-orange-500 text-white font-black text-lg shadow-lg shadow-orange-200">🥉</div>;
    return <div className="flex h-10 w-10 items-center justify-center rounded-full bg-slate-100 font-black text-slate-600 text-base">{rank}</div>;
  };

  if (loading) {
    return (
      <div className="flex h-screen items-center justify-center bg-slate-100">
        <div className="animate-pulse text-center">
          <div className="h-12 w-12 mx-auto rounded-full bg-emerald-200 animate-bounce" />
          <p className="mt-4 text-sm font-semibold text-slate-500">Loading Faculty Progress...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-100">
      <PortalHeader title="Faculty Progress" subtitle="Assign tasks, review submissions, and track performance" onLogout={handleLogout}>
        <button onClick={() => navigate('/admin/dashboard')} className="flex h-9 w-9 items-center justify-center rounded-[10px] border border-slate-200 text-slate-600 transition hover:bg-slate-50 active:scale-95">
          <ChevronLeft size={18} />
        </button>
      </PortalHeader>

      <main className="mx-auto w-full max-w-7xl px-4 py-6 sm:px-6 lg:px-8">
        {/* Tab Navigation */}
        <div className="mb-6 flex items-center gap-2 rounded-2xl bg-white p-1.5 shadow-sm border border-slate-100 w-fit">
          {[
            { key: 'tasks', label: 'Task Manager', icon: Target },
            { key: 'leaderboard', label: 'Leaderboard', icon: Trophy }
          ].map(tab => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.key;
            return (
              <button
                key={tab.key}
                onClick={() => setActiveTab(tab.key)}
                className={`flex items-center gap-2 rounded-xl px-5 py-2.5 text-sm font-bold transition-all ${
                  isActive
                    ? 'bg-slate-900 text-white shadow-md'
                    : 'text-slate-500 hover:bg-slate-50 hover:text-slate-900'
                }`}
              >
                <Icon size={16} /> {tab.label}
              </button>
            );
          })}
        </div>

        {/* ══════ TASKS TAB ══════ */}
        {activeTab === 'tasks' && (
          <div className="space-y-6">
            {/* Create Task Button */}
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-2xl font-display font-bold text-slate-900">Task Assignments</h2>
                <p className="text-sm text-slate-500 mt-1">{tasks.length} task{tasks.length !== 1 ? 's' : ''} total</p>
              </div>
              <button
                onClick={() => setShowCreateForm(!showCreateForm)}
                className="flex items-center gap-2 rounded-2xl bg-emerald-600 px-5 py-3 text-sm font-bold text-white shadow-lg shadow-emerald-200 transition hover:bg-emerald-700 active:scale-95"
              >
                <Plus size={18} /> Assign New Task
              </button>
            </div>

            {/* Create Task Form */}
            {showCreateForm && (
              <form onSubmit={handleCreateTask} className="rounded-3xl border border-emerald-100 bg-gradient-to-br from-emerald-50 to-white p-6 shadow-sm space-y-4">
                <h3 className="text-lg font-display font-bold text-slate-900 flex items-center gap-2"><Send size={20} className="text-emerald-600" /> New Task Assignment</h3>

                <div className="grid gap-4 sm:grid-cols-2">
                  <div>
                    <label className="text-xs font-bold uppercase tracking-[0.16em] text-slate-600">Title *</label>
                    <input
                      type="text" value={taskForm.title} onChange={e => setTaskForm(f => ({ ...f, title: e.target.value }))}
                      className="mt-1 w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm font-semibold outline-none focus:ring-2 focus:ring-emerald-500"
                      placeholder="e.g. Submit Lesson Plan for March"
                    />
                  </div>
                  <div>
                    <label className="text-xs font-bold uppercase tracking-[0.16em] text-slate-600">Task Type</label>
                    <select
                      value={taskForm.taskType} onChange={e => setTaskForm(f => ({ ...f, taskType: e.target.value }))}
                      className="mt-1 w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm font-semibold outline-none focus:ring-2 focus:ring-emerald-500"
                    >
                      <option value="General">General</option>
                      <option value="CDC">CDC</option>
                      <option value="SUITS">SUITS</option>
                      <option value="SRV Skill Development">SRV Skill Development</option>
                      <option value="Extracurricular">Extracurricular</option>
                    </select>
                  </div>
                </div>

                <div>
                  <label className="text-xs font-bold uppercase tracking-[0.16em] text-slate-600">Description *</label>
                  <textarea
                    value={taskForm.description} onChange={e => setTaskForm(f => ({ ...f, description: e.target.value }))}
                    rows={3}
                    className="mt-1 w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm outline-none focus:ring-2 focus:ring-emerald-500"
                    placeholder="Describe what the faculty member needs to do..."
                  />
                </div>

                <div className="grid gap-4 sm:grid-cols-2">
                  <div>
                    <label className="text-xs font-bold uppercase tracking-[0.16em] text-slate-600">Deadline *</label>
                    <input
                      type="date" value={taskForm.deadline} onChange={e => setTaskForm(f => ({ ...f, deadline: e.target.value }))}
                      className="mt-1 w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm font-semibold outline-none focus:ring-2 focus:ring-emerald-500"
                    />
                  </div>
                  <div>
                    <label className="text-xs font-bold uppercase tracking-[0.16em] text-slate-600">Assign To</label>
                    <div className="mt-1 flex items-center gap-3">
                      <label className="flex items-center gap-2 text-sm font-semibold text-slate-700">
                        <input type="checkbox" checked={taskForm.targetAll} onChange={e => setTaskForm(f => ({ ...f, targetAll: e.target.checked, assignedTo: [] }))} className="rounded" />
                        All Faculty
                      </label>
                    </div>
                    {!taskForm.targetAll && (
                      <select
                        multiple
                        value={taskForm.assignedTo}
                        onChange={e => setTaskForm(f => ({ ...f, assignedTo: Array.from(e.target.selectedOptions, o => o.value) }))}
                        className="mt-2 w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm outline-none focus:ring-2 focus:ring-emerald-500"
                      >
                        {faculties.map(f => (
                          <option key={f._id} value={f._id}>{f.name} ({f.srvNumber})</option>
                        ))}
                      </select>
                    )}
                  </div>
                </div>

                <div className="flex gap-3">
                  <button type="submit" className="rounded-xl bg-emerald-600 px-6 py-3 text-sm font-bold text-white hover:bg-emerald-700 active:scale-95 transition">
                    Assign Task
                  </button>
                  <button type="button" onClick={() => setShowCreateForm(false)} className="rounded-xl bg-slate-200 px-6 py-3 text-sm font-bold text-slate-700 hover:bg-slate-300 active:scale-95 transition">
                    Cancel
                  </button>
                </div>
              </form>
            )}

            {/* Task List */}
            {tasks.length > 0 ? (
              <div className="space-y-4">
                {tasks.map(task => {
                  const isOverdue = new Date(task.deadline) < new Date();
                  const totalSubmissions = task.submissions?.length || 0;
                  const approvedCount = task.submissions?.filter(s => s.status === 'Approved').length || 0;
                  const pendingCount = task.submissions?.filter(s => s.status === 'Pending').length || 0;

                  return (
                    <div key={task._id} className="rounded-3xl border border-slate-100 bg-white p-5 shadow-sm sm:p-6">
                      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                        <div className="flex-1">
                          <div className="flex items-center gap-3 flex-wrap">
                            <h3 className="text-lg font-display font-bold text-slate-900">{task.title}</h3>
                            <span className="rounded-full bg-slate-100 px-3 py-0.5 text-xs font-bold text-slate-600">{task.taskType}</span>
                            {isOverdue && <span className="rounded-full bg-red-100 px-3 py-0.5 text-xs font-bold text-red-700">Overdue</span>}
                          </div>
                          <p className="mt-2 text-sm text-slate-600 leading-relaxed">{task.description}</p>
                          <div className="mt-3 flex items-center gap-4 text-xs font-semibold text-slate-500">
                            <span>⏰ Due: {new Date(task.deadline).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}</span>
                            <span>👥 {task.targetAll ? 'All Faculty' : `${task.assignedTo?.length || 0} assigned`}</span>
                          </div>
                        </div>
                        <div className="flex items-center gap-2 shrink-0">
                          <div className="grid grid-cols-3 gap-2 text-center">
                            <div className="rounded-xl bg-emerald-50 border border-emerald-100 px-3 py-2">
                              <p className="text-lg font-black text-emerald-700">{approvedCount}</p>
                              <p className="text-[9px] font-bold uppercase tracking-wider text-emerald-600">Approved</p>
                            </div>
                            <div className="rounded-xl bg-amber-50 border border-amber-100 px-3 py-2">
                              <p className="text-lg font-black text-amber-700">{pendingCount}</p>
                              <p className="text-[9px] font-bold uppercase tracking-wider text-amber-600">Pending</p>
                            </div>
                            <div className="rounded-xl bg-slate-50 border border-slate-100 px-3 py-2">
                              <p className="text-lg font-black text-slate-700">{totalSubmissions}</p>
                              <p className="text-[9px] font-bold uppercase tracking-wider text-slate-500">Total</p>
                            </div>
                          </div>
                          <button onClick={() => handleDeleteTask(task._id)} className="p-2 rounded-xl text-red-400 hover:bg-red-50 hover:text-red-600 transition">
                            <Trash2 size={18} />
                          </button>
                        </div>
                      </div>

                      {/* Submissions */}
                      {task.submissions && task.submissions.length > 0 && (
                        <div className="mt-5 border-t border-slate-100 pt-4">
                          <p className="text-xs font-bold uppercase tracking-[0.16em] text-slate-500 mb-3">Submissions</p>
                          <div className="space-y-2">
                            {task.submissions.map(sub => (
                              <div key={sub._id} className="flex items-center justify-between rounded-2xl border border-slate-100 bg-slate-50 px-4 py-3">
                                <div className="flex items-center gap-3">
                                  <div className="h-9 w-9 rounded-full bg-gradient-to-br from-slate-200 to-slate-300 flex items-center justify-center text-xs font-black text-slate-700">
                                    {sub.facultyId?.name?.charAt(0) || '?'}
                                  </div>
                                  <div>
                                    <p className="text-sm font-bold text-slate-900">{sub.facultyId?.name}</p>
                                    <p className="text-xs text-slate-500">{sub.facultyId?.srvNumber} • {new Date(sub.createdAt).toLocaleDateString()}</p>
                                  </div>
                                </div>
                                <div className="flex items-center gap-3">
                                  {getStatusBadge(sub.status)}
                                  {sub.proofUrl && (
                                    <a href={sub.proofUrl} target="_blank" rel="noopener noreferrer" className="rounded-lg bg-blue-50 p-2 text-blue-600 hover:bg-blue-100 transition">
                                      <ExternalLink size={14} />
                                    </a>
                                  )}
                                  <button
                                    onClick={() => { setReviewingSubmission(sub); setReviewForm({ status: sub.status === 'Approved' ? 'Approved' : 'Approved', qualityScore: sub.qualityScore || 80, adminFeedback: sub.adminFeedback || '' }); }}
                                    className="rounded-xl bg-slate-900 px-4 py-2 text-xs font-bold text-white hover:bg-slate-800 active:scale-95 transition"
                                  >
                                    <Eye size={14} className="inline mr-1" /> Review
                                  </button>
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="rounded-3xl border-2 border-dashed border-slate-200 bg-white px-6 py-16 text-center">
                <Target size={48} className="mx-auto text-slate-300" />
                <p className="mt-4 text-lg font-bold text-slate-400">No tasks assigned yet</p>
                <p className="mt-1 text-sm text-slate-400">Click "Assign New Task" to get started.</p>
              </div>
            )}
          </div>
        )}

        {/* ══════ LEADERBOARD TAB ══════ */}
        {activeTab === 'leaderboard' && (
          <div className="space-y-6">
            <div>
              <h2 className="text-2xl font-display font-bold text-slate-900">Faculty Leaderboard</h2>
              <p className="text-sm text-slate-500 mt-1">Performance scoring: 40% Tasks • 20% Quality • 20% Feedback • 20% Contribution</p>
            </div>

            {/* Top 3 Podium */}
            {leaderboard.length >= 3 && (
              <div className="grid gap-4 sm:grid-cols-3">
                {leaderboard.slice(0, 3).map((entry, i) => {
                  const colors = [
                    'from-yellow-50 to-amber-50 border-amber-200',
                    'from-slate-50 to-gray-100 border-slate-200',
                    'from-orange-50 to-amber-50 border-orange-200'
                  ];
                  return (
                    <div key={entry._id} className={`rounded-3xl bg-gradient-to-br ${colors[i]} border p-6 text-center shadow-sm`}>
                      <div className="mx-auto mb-3">{getRankBadge(entry.rank)}</div>
                      <h3 className="text-lg font-display font-bold text-slate-900">{entry.name}</h3>
                      <p className="text-xs font-semibold text-slate-500">{entry.srvNumber} • Grade {entry.assignedGrade}-{entry.assignedSection}</p>
                      <div className="mt-4">
                        <p className="text-4xl font-display font-black text-slate-900">{entry.finalScore}</p>
                        <p className="text-xs font-bold uppercase tracking-wider text-slate-500 mt-1">Overall Score</p>
                      </div>
                      <div className="mt-4 grid grid-cols-2 gap-2 text-xs">
                        <div className="rounded-xl bg-white/60 p-2"><span className="font-bold text-emerald-700">{entry.taskScore}%</span><br /><span className="text-slate-500">Tasks</span></div>
                        <div className="rounded-xl bg-white/60 p-2"><span className="font-bold text-blue-700">{entry.qualityScore}%</span><br /><span className="text-slate-500">Quality</span></div>
                        <div className="rounded-xl bg-white/60 p-2"><span className="font-bold text-violet-700">{entry.feedbackScore}%</span><br /><span className="text-slate-500">Feedback</span></div>
                        <div className="rounded-xl bg-white/60 p-2"><span className="font-bold text-amber-700">{entry.contributionScore}%</span><br /><span className="text-slate-500">Contrib.</span></div>
                      </div>
                      {entry.alerts && entry.alerts.length > 0 && (
                        <div className="mt-3">
                          {entry.alerts.map((alert, idx) => (
                            <div key={idx} className="mt-1 rounded-lg bg-red-50 px-3 py-1.5 text-[10px] font-bold text-red-700 flex items-center gap-1">
                              <AlertTriangle size={12} /> {alert.message}
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            )}

            {/* Full Table */}
            <div className="rounded-3xl border border-slate-100 bg-white shadow-sm overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-slate-100 bg-slate-50">
                      <th className="px-5 py-4 text-left text-xs font-bold uppercase tracking-[0.16em] text-slate-500">Rank</th>
                      <th className="px-5 py-4 text-left text-xs font-bold uppercase tracking-[0.16em] text-slate-500">Faculty</th>
                      <th className="px-5 py-4 text-center text-xs font-bold uppercase tracking-[0.16em] text-slate-500">Tasks</th>
                      <th className="px-5 py-4 text-center text-xs font-bold uppercase tracking-[0.16em] text-slate-500">Quality</th>
                      <th className="px-5 py-4 text-center text-xs font-bold uppercase tracking-[0.16em] text-slate-500">Feedback</th>
                      <th className="px-5 py-4 text-center text-xs font-bold uppercase tracking-[0.16em] text-slate-500">Contrib.</th>
                      <th className="px-5 py-4 text-center text-xs font-bold uppercase tracking-[0.16em] text-slate-500">Score</th>
                      <th className="px-5 py-4 text-center text-xs font-bold uppercase tracking-[0.16em] text-slate-500">Alerts</th>
                    </tr>
                  </thead>
                  <tbody>
                    {leaderboard.map(entry => (
                      <tr key={entry._id} className="border-b border-slate-50 hover:bg-slate-50 transition-colors">
                        <td className="px-5 py-4">{getRankBadge(entry.rank)}</td>
                        <td className="px-5 py-4">
                          <p className="font-bold text-slate-900">{entry.name}</p>
                          <p className="text-xs text-slate-500">{entry.srvNumber} • {entry.assignedGrade}-{entry.assignedSection}</p>
                        </td>
                        <td className="px-5 py-4 text-center">
                          <span className="font-bold text-emerald-700">{entry.completedTasks}/{entry.totalTasks}</span>
                          <span className="block text-[10px] text-slate-400">{entry.taskScore}%</span>
                        </td>
                        <td className="px-5 py-4 text-center">
                          <span className="font-bold text-blue-700">{entry.qualityScore}%</span>
                        </td>
                        <td className="px-5 py-4 text-center">
                          <span className="font-bold text-violet-700">{entry.feedbackScore}%</span>
                        </td>
                        <td className="px-5 py-4 text-center">
                          <span className="font-bold text-amber-700">{entry.contributionScore}%</span>
                        </td>
                        <td className="px-5 py-4 text-center">
                          <span className={`inline-flex items-center justify-center h-10 w-10 rounded-full font-black text-sm ${
                            entry.finalScore >= 70 ? 'bg-emerald-100 text-emerald-800' : entry.finalScore >= 40 ? 'bg-amber-100 text-amber-800' : 'bg-red-100 text-red-800'
                          }`}>{entry.finalScore}</span>
                        </td>
                        <td className="px-5 py-4 text-center">
                          {entry.alerts && entry.alerts.length > 0 ? (
                            <span className="inline-flex items-center gap-1 rounded-full bg-red-100 px-2.5 py-1 text-xs font-bold text-red-700">
                              <AlertTriangle size={12} /> {entry.alerts.length}
                            </span>
                          ) : (
                            <span className="text-xs text-slate-400">—</span>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              {leaderboard.length === 0 && (
                <div className="px-6 py-16 text-center">
                  <Trophy size={48} className="mx-auto text-slate-300" />
                  <p className="mt-4 text-lg font-bold text-slate-400">No faculty data yet</p>
                  <p className="mt-1 text-sm text-slate-400">Assign tasks and start grading to populate the leaderboard.</p>
                </div>
              )}
            </div>
          </div>
        )}

        {/* ══════ REVIEW MODAL ══════ */}
        {reviewingSubmission && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
            <div className="w-full max-w-lg rounded-3xl bg-white p-6 shadow-2xl">
              <h3 className="text-xl font-display font-bold text-slate-900 flex items-center gap-2">
                <Star className="text-amber-500" size={22} /> Review Submission
              </h3>
              <p className="mt-1 text-sm text-slate-500">
                By {reviewingSubmission.facultyId?.name} ({reviewingSubmission.facultyId?.srvNumber})
              </p>

              {reviewingSubmission.proofUrl && (
                <div className="mt-4 rounded-2xl border border-blue-100 bg-blue-50 p-4">
                  <p className="text-xs font-bold uppercase tracking-wider text-blue-600 mb-2">Proof Attached</p>
                  <a href={reviewingSubmission.proofUrl} target="_blank" rel="noopener noreferrer" className="text-sm font-semibold text-blue-700 underline flex items-center gap-1">
                    <ExternalLink size={14} /> View Proof
                  </a>
                </div>
              )}

              {reviewingSubmission.comments && (
                <div className="mt-3 rounded-2xl border border-slate-100 bg-slate-50 p-4">
                  <p className="text-xs font-bold uppercase tracking-wider text-slate-500 mb-1">Faculty Comments</p>
                  <p className="text-sm text-slate-700">{reviewingSubmission.comments}</p>
                </div>
              )}

              <div className="mt-5 space-y-4">
                <div>
                  <label className="text-xs font-bold uppercase tracking-[0.16em] text-slate-600">Status</label>
                  <select
                    value={reviewForm.status}
                    onChange={e => setReviewForm(f => ({ ...f, status: e.target.value }))}
                    className="mt-1 w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm font-semibold outline-none focus:ring-2 focus:ring-emerald-500"
                  >
                    <option value="Approved">✅ Approved</option>
                    <option value="Rejected">❌ Rejected</option>
                    <option value="Pending">⏳ Keep Pending</option>
                  </select>
                </div>
                <div>
                  <label className="text-xs font-bold uppercase tracking-[0.16em] text-slate-600">Quality Score (0–100)</label>
                  <input
                    type="number" min={0} max={100}
                    value={reviewForm.qualityScore}
                    onChange={e => setReviewForm(f => ({ ...f, qualityScore: Number(e.target.value) }))}
                    className="mt-1 w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm font-semibold outline-none focus:ring-2 focus:ring-emerald-500"
                  />
                </div>
                <div>
                  <label className="text-xs font-bold uppercase tracking-[0.16em] text-slate-600">Admin Feedback</label>
                  <textarea
                    value={reviewForm.adminFeedback}
                    onChange={e => setReviewForm(f => ({ ...f, adminFeedback: e.target.value }))}
                    rows={2}
                    className="mt-1 w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm outline-none focus:ring-2 focus:ring-emerald-500"
                    placeholder="Optional: feedback for the faculty member..."
                  />
                </div>
              </div>

              <div className="mt-6 flex gap-3">
                <button onClick={handleReviewSubmission} className="rounded-xl bg-emerald-600 px-6 py-3 text-sm font-bold text-white hover:bg-emerald-700 active:scale-95 transition flex-1">
                  Save Review
                </button>
                <button onClick={() => setReviewingSubmission(null)} className="rounded-xl bg-slate-200 px-6 py-3 text-sm font-bold text-slate-700 hover:bg-slate-300 active:scale-95 transition">
                  Cancel
                </button>
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
