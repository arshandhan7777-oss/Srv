import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import {
  ChevronLeft, Plus, UserPlus, Search, Filter, Phone, Mail, MessageCircle,
  Calendar, MapPin, AlertTriangle, TrendingUp, Users, ArrowRight,
  Trash2, Edit2, CheckCircle2, XCircle, Clock, Eye, Star, Send,
  BarChart3, PieChart, Flame, Thermometer, RefreshCw, X, ExternalLink
} from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart as RPieChart, Pie, Cell } from 'recharts';
import API_URL from '../config/api.js';
import Swal from 'sweetalert2';
import { PortalHeader } from '../components/PortalHeader.js';

const STATUS_COLORS = {
  New: 'bg-blue-100 text-blue-800 border-blue-200',
  Contacted: 'bg-amber-100 text-amber-800 border-amber-200',
  Interested: 'bg-emerald-100 text-emerald-800 border-emerald-200',
  'Not Interested': 'bg-red-100 text-red-800 border-red-200',
  Converted: 'bg-violet-100 text-violet-800 border-violet-200'
};

const TEMP_CONFIG = {
  Hot: { bg: 'bg-red-500', text: 'text-white', icon: '🔥' },
  Warm: { bg: 'bg-amber-400', text: 'text-white', icon: '☀️' },
  Cold: { bg: 'bg-blue-400', text: 'text-white', icon: '❄️' }
};

const PIE_COLORS = ['#10b981', '#6366f1', '#f59e0b', '#ef4444', '#8b5cf6', '#06b6d4'];

export function EnquiryPage() {
  const navigate = useNavigate();
  const token = localStorage.getItem('schoolToken');
  const headers = { Authorization: `Bearer ${token}` };

  const [activeTab, setActiveTab] = useState('pipeline');
  const [enquiries, setEnquiries] = useState([]);
  const [faculties, setFaculties] = useState([]);
  const [stats, setStats] = useState(null);
  const [alerts, setAlerts] = useState(null);
  const [loading, setLoading] = useState(true);
  const [filterStatus, setFilterStatus] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [editingEnquiry, setEditingEnquiry] = useState(null);
  const [interactionEnquiry, setInteractionEnquiry] = useState(null);

  const emptyForm = {
    studentName: '', parentName: '', parentMobile: '', email: '',
    grade: '', section: '', dateOfBirth: '', address: '',
    motherName: '', fatherName: '', guardianName: '',
    source: 'Walk-in', programInterest: 'General', remarks: '',
    referredBy: '', nextFollowUp: ''
  };
  const [form, setForm] = useState({ ...emptyForm });
  const [interactionForm, setInteractionForm] = useState({ type: 'Call', notes: '' });

  const fetchAll = useCallback(async () => {
    try {
      const params = {};
      if (filterStatus) params.status = filterStatus;
      if (searchQuery) params.search = searchQuery;

      const [enqRes, facRes, statsRes, alertsRes] = await Promise.all([
        axios.get(`${API_URL}/api/enquiry`, { headers, params }),
        axios.get(`${API_URL}/api/admin/faculty`, { headers }),
        axios.get(`${API_URL}/api/enquiry/stats`, { headers }),
        axios.get(`${API_URL}/api/enquiry/alerts`, { headers })
      ]);
      setEnquiries(enqRes.data);
      setFaculties(facRes.data);
      setStats(statsRes.data);
      setAlerts(alertsRes.data);
    } catch (err) { console.error(err); }
    finally { setLoading(false); }
  }, [filterStatus, searchQuery]);

  useEffect(() => { fetchAll(); }, [fetchAll]);

  // Create Enquiry
  const handleCreate = async (e) => {
    e.preventDefault();
    if (!form.studentName.trim()) {
      Swal.fire('Required', 'Student name is required.', 'warning');
      return;
    }
    try {
      await axios.post(`${API_URL}/api/enquiry`, form, { headers });
      Swal.fire({ toast: true, position: 'top-end', icon: 'success', title: 'Enquiry recorded!', showConfirmButton: false, timer: 2000 });
      setShowCreateForm(false);
      setForm({ ...emptyForm });
      fetchAll();
    } catch (err) {
      Swal.fire('Error', err.response?.data?.message || 'Failed to create enquiry.', 'error');
    }
  };

  // Update status
  const handleStatusChange = async (id, newStatus) => {
    try {
      await axios.put(`${API_URL}/api/enquiry/${id}`, { status: newStatus }, { headers });
      fetchAll();
    } catch (err) {
      Swal.fire('Error', 'Failed to update status.', 'error');
    }
  };

  // Log interaction
  const handleLogInteraction = async () => {
    if (!interactionEnquiry) return;
    try {
      await axios.post(`${API_URL}/api/enquiry/${interactionEnquiry._id}/interaction`, interactionForm, { headers });
      Swal.fire({ toast: true, position: 'top-end', icon: 'success', title: 'Interaction logged!', showConfirmButton: false, timer: 2000 });
      setInteractionEnquiry(null);
      setInteractionForm({ type: 'Call', notes: '' });
      fetchAll();
    } catch (err) {
      Swal.fire('Error', 'Failed to log interaction.', 'error');
    }
  };

  // Convert to admission
  const handleConvert = async (enquiry) => {
    const { isConfirmed } = await Swal.fire({
      title: 'Convert to Admission?',
      html: `<b>${enquiry.studentName}</b> will be admitted as a student. An SRV number and parent account will be auto-generated.`,
      icon: 'question', showCancelButton: true,
      confirmButtonColor: '#059669', confirmButtonText: 'Yes, Convert!'
    });
    if (!isConfirmed) return;
    try {
      const res = await axios.post(`${API_URL}/api/enquiry/${enquiry._id}/convert`, {}, { headers });
      Swal.fire({
        title: '🎉 Admission Created!',
        html: `<b>SRV Number:</b> ${res.data.parentLogin.srvNumber}<br/><b>Parent Password:</b> ${res.data.parentLogin.defaultPassword}`,
        icon: 'success', confirmButtonColor: '#059669'
      });
      fetchAll();
    } catch (err) {
      Swal.fire('Error', err.response?.data?.message || 'Conversion failed.', 'error');
    }
  };

  // Delete
  const handleDelete = async (id) => {
    const { isConfirmed } = await Swal.fire({
      title: 'Delete Enquiry?', text: 'This cannot be undone.',
      icon: 'warning', showCancelButton: true,
      confirmButtonColor: '#ef4444', confirmButtonText: 'Delete'
    });
    if (!isConfirmed) return;
    try {
      await axios.delete(`${API_URL}/api/enquiry/${id}`, { headers });
      fetchAll();
    } catch (err) {
      Swal.fire('Error', 'Failed to delete.', 'error');
    }
  };

  // Edit
  const openEdit = (enq) => {
    setEditingEnquiry(enq);
    setForm({
      studentName: enq.studentName || '',
      parentName: enq.parentName || '',
      parentMobile: enq.parentMobile || '',
      email: enq.email || '',
      grade: enq.grade || '',
      section: enq.section || '',
      dateOfBirth: enq.dateOfBirth ? new Date(enq.dateOfBirth).toISOString().split('T')[0] : '',
      address: enq.address || '',
      motherName: enq.motherName || '',
      fatherName: enq.fatherName || '',
      guardianName: enq.guardianName || '',
      source: enq.source || 'Walk-in',
      programInterest: enq.programInterest || 'General',
      remarks: enq.remarks || '',
      referredBy: enq.referredBy?._id || '',
      nextFollowUp: enq.nextFollowUp ? new Date(enq.nextFollowUp).toISOString().split('T')[0] : ''
    });
    setShowCreateForm(true);
  };

  const handleUpdate = async (e) => {
    e.preventDefault();
    try {
      await axios.put(`${API_URL}/api/enquiry/${editingEnquiry._id}`, form, { headers });
      Swal.fire({ toast: true, position: 'top-end', icon: 'success', title: 'Updated!', showConfirmButton: false, timer: 2000 });
      setShowCreateForm(false);
      setEditingEnquiry(null);
      setForm({ ...emptyForm });
      fetchAll();
    } catch (err) {
      Swal.fire('Error', 'Failed to update.', 'error');
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('schoolToken');
    localStorage.removeItem('schoolUser');
    navigate('/admin-login');
  };

  const daysSince = (date) => {
    if (!date) return null;
    return Math.floor((Date.now() - new Date(date).getTime()) / (1000 * 60 * 60 * 24));
  };

  if (loading) {
    return (
      <div className="flex h-screen items-center justify-center bg-slate-100">
        <div className="animate-pulse text-center">
          <div className="h-12 w-12 mx-auto rounded-full bg-blue-200 animate-bounce" />
          <p className="mt-4 text-sm font-semibold text-slate-500">Loading Enquiries...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-100">
      <PortalHeader title="Enquiry Center" subtitle="Track prospective students from enquiry to admission" onLogout={handleLogout}>
        <button onClick={() => navigate('/admin/dashboard')} className="flex h-9 w-9 items-center justify-center rounded-[10px] border border-slate-200 text-slate-600 transition hover:bg-slate-50 active:scale-95">
          <ChevronLeft size={18} />
        </button>
      </PortalHeader>

      <main className="mx-auto w-full max-w-7xl px-4 py-6 sm:px-6 lg:px-8">
        {/* Tab Navigation */}
        <div className="mb-6 flex flex-wrap items-center gap-2">
          <div className="flex items-center gap-2 rounded-2xl bg-white p-1.5 shadow-sm border border-slate-100">
            {[
              { key: 'pipeline', label: 'Pipeline', icon: Users },
              { key: 'add', label: 'Quick Add', icon: UserPlus },
              { key: 'analytics', label: 'Analytics', icon: BarChart3 },
              { key: 'alerts', label: `Alerts${alerts?.totalAlerts ? ` (${alerts.totalAlerts})` : ''}`, icon: AlertTriangle }
            ].map(tab => {
              const Icon = tab.icon;
              const isActive = activeTab === tab.key;
              return (
                <button key={tab.key} onClick={() => { setActiveTab(tab.key); if (tab.key === 'add') { setShowCreateForm(true); setEditingEnquiry(null); setForm({ ...emptyForm }); } }}
                  className={`flex items-center gap-2 rounded-xl px-4 py-2.5 text-sm font-bold transition-all ${isActive ? 'bg-slate-900 text-white shadow-md' : 'text-slate-500 hover:bg-slate-50 hover:text-slate-900'}`}
                >
                  <Icon size={16} /> <span className="hidden sm:inline">{tab.label}</span>
                </button>
              );
            })}
          </div>
        </div>

        {/* ══════ PIPELINE TAB ══════ */}
        {activeTab === 'pipeline' && (
          <div className="space-y-6">
            {/* Search + Filters + Add Button */}
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <div className="flex items-center gap-3 flex-1">
                <div className="relative flex-1 max-w-md">
                  <Search size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                  <input
                    type="text" value={searchQuery} onChange={e => setSearchQuery(e.target.value)}
                    placeholder="Search by name, parent, phone..."
                    className="w-full rounded-xl border border-slate-200 bg-white py-2.5 pl-10 pr-4 text-sm outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <select value={filterStatus} onChange={e => setFilterStatus(e.target.value)}
                  className="rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm font-semibold outline-none focus:ring-2 focus:ring-blue-500">
                  <option value="">All Status</option>
                  {['New', 'Contacted', 'Interested', 'Not Interested', 'Converted'].map(s => (
                    <option key={s} value={s}>{s}</option>
                  ))}
                </select>
              </div>
              <button onClick={() => { setShowCreateForm(true); setEditingEnquiry(null); setForm({ ...emptyForm }); setActiveTab('pipeline'); }}
                className="flex items-center gap-2 rounded-2xl bg-blue-600 px-5 py-3 text-sm font-bold text-white shadow-lg shadow-blue-200 transition hover:bg-blue-700 active:scale-95">
                <Plus size={18} /> New Enquiry
              </button>
            </div>

            {/* Status Summary Chips */}
            <div className="flex flex-wrap gap-2">
              {stats && ['New', 'Contacted', 'Interested', 'Not Interested', 'Converted'].map(s => {
                const countMap = { New: stats.newCount, Contacted: stats.contacted, Interested: stats.interested, 'Not Interested': stats.notInterested, Converted: stats.converted };
                return (
                  <button key={s} onClick={() => setFilterStatus(filterStatus === s ? '' : s)}
                    className={`rounded-full border px-4 py-1.5 text-xs font-bold transition ${filterStatus === s ? STATUS_COLORS[s] : 'border-slate-200 bg-white text-slate-600 hover:bg-slate-50'}`}>
                    {s} ({countMap[s] || 0})
                  </button>
                );
              })}
            </div>

            {/* Enquiry Cards */}
            {enquiries.length > 0 ? (
              <div className="space-y-3">
                {enquiries.map(enq => {
                  const tempConfig = TEMP_CONFIG[enq.leadTemperature] || TEMP_CONFIG.Cold;
                  const age = daysSince(enq.createdAt);
                  const lastContact = daysSince(enq.lastFollowUp);
                  const isStale = enq.status !== 'Converted' && enq.status !== 'Not Interested' && (lastContact === null ? age > 2 : lastContact > 2);

                  return (
                    <div key={enq._id} className={`rounded-2xl border bg-white p-4 shadow-sm transition hover:shadow-md sm:p-5 ${isStale ? 'border-l-4 border-l-red-400' : 'border-slate-100'}`}>
                      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 flex-wrap">
                            <h3 className="text-base font-display font-bold text-slate-900 truncate">{enq.studentName}</h3>
                            <span className={`rounded-full border px-2.5 py-0.5 text-[10px] font-bold ${STATUS_COLORS[enq.status]}`}>{enq.status}</span>
                            <span className={`rounded-full ${tempConfig.bg} ${tempConfig.text} px-2 py-0.5 text-[10px] font-bold`}>{tempConfig.icon} {enq.leadScore}</span>
                            {isStale && <span className="rounded-full bg-red-100 text-red-700 px-2 py-0.5 text-[10px] font-bold">⚠ Needs Follow-up</span>}
                          </div>
                          <div className="mt-2 flex flex-wrap items-center gap-3 text-xs text-slate-500">
                            {enq.grade && <span>📚 Grade {enq.grade}{enq.section ? `-${enq.section}` : ''}</span>}
                            {enq.parentMobile && <span className="flex items-center gap-1"><Phone size={12} /> {enq.parentMobile}</span>}
                            {enq.source && <span>📌 {enq.source}</span>}
                            {enq.referredBy && <span>🤝 Ref: {enq.referredBy.name}</span>}
                            {enq.programInterest !== 'General' && <span className="rounded-full bg-indigo-50 px-2 py-0.5 text-indigo-700 font-semibold">{enq.programInterest}</span>}
                          </div>
                          <div className="mt-1.5 flex items-center gap-3 text-[11px] text-slate-400">
                            <span>{age}d ago</span>
                            {enq.followUpCount > 0 && <span>{enq.followUpCount} follow-up{enq.followUpCount !== 1 ? 's' : ''}</span>}
                            {enq.interactions?.length > 0 && <span>{enq.interactions.length} interaction{enq.interactions.length !== 1 ? 's' : ''}</span>}
                          </div>
                        </div>

                        <div className="flex items-center gap-1.5 shrink-0 flex-wrap">
                          {/* Status Quick Change */}
                          <select value={enq.status} onChange={e => handleStatusChange(enq._id, e.target.value)}
                            className="rounded-lg border border-slate-200 bg-white px-2 py-1.5 text-xs font-bold outline-none">
                            {['New', 'Contacted', 'Interested', 'Not Interested'].map(s => (
                              <option key={s} value={s}>{s}</option>
                            ))}
                          </select>
                          <button onClick={() => setInteractionEnquiry(enq)} title="Log Interaction"
                            className="rounded-lg bg-blue-50 p-2 text-blue-600 hover:bg-blue-100 transition"><MessageCircle size={16} /></button>
                          <button onClick={() => openEdit(enq)} title="Edit"
                            className="rounded-lg bg-slate-50 p-2 text-slate-600 hover:bg-slate-100 transition"><Edit2 size={16} /></button>
                          {enq.status !== 'Converted' && (
                            <button onClick={() => handleConvert(enq)} title="Convert to Admission"
                              className="rounded-lg bg-emerald-50 p-2 text-emerald-600 hover:bg-emerald-100 transition"><ArrowRight size={16} /></button>
                          )}
                          <button onClick={() => handleDelete(enq._id)} title="Delete"
                            className="rounded-lg bg-red-50 p-2 text-red-500 hover:bg-red-100 transition"><Trash2 size={16} /></button>
                        </div>
                      </div>

                      {/* Interaction Timeline (collapsed) */}
                      {enq.interactions && enq.interactions.length > 0 && (
                        <details className="mt-3">
                          <summary className="cursor-pointer text-xs font-bold text-slate-500 hover:text-slate-700">View {enq.interactions.length} interaction{enq.interactions.length !== 1 ? 's' : ''}</summary>
                          <div className="mt-2 space-y-1.5 pl-3 border-l-2 border-slate-100">
                            {enq.interactions.slice().reverse().map((log, i) => (
                              <div key={i} className="text-xs text-slate-600">
                                <span className="font-bold text-slate-700">{log.type}</span>
                                {log.notes && <span className="ml-1">— {log.notes}</span>}
                                <span className="ml-2 text-slate-400">{new Date(log.createdAt).toLocaleDateString()}</span>
                              </div>
                            ))}
                          </div>
                        </details>
                      )}
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="rounded-3xl border-2 border-dashed border-slate-200 bg-white px-6 py-16 text-center">
                <UserPlus size={48} className="mx-auto text-slate-300" />
                <p className="mt-4 text-lg font-bold text-slate-400">No enquiries yet</p>
                <p className="mt-1 text-sm text-slate-400">Click "New Enquiry" to record a walk-in or phone enquiry.</p>
              </div>
            )}
          </div>
        )}

        {/* ══════ QUICK ADD / EDIT FORM ══════ */}
        {(activeTab === 'add' || showCreateForm) && (
          <form onSubmit={editingEnquiry ? handleUpdate : handleCreate} className="rounded-3xl border border-blue-100 bg-gradient-to-br from-blue-50 to-white p-6 shadow-sm space-y-5">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-display font-bold text-slate-900 flex items-center gap-2">
                <UserPlus size={20} className="text-blue-600" />
                {editingEnquiry ? 'Edit Enquiry' : 'New Enquiry'}
              </h3>
              <button type="button" onClick={() => { setShowCreateForm(false); setEditingEnquiry(null); setActiveTab('pipeline'); }}
                className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-100 hover:text-slate-600"><X size={20} /></button>
            </div>

            {/* Quick fields (mobile first) */}
            <div className="grid gap-4 sm:grid-cols-3">
              <div>
                <label className="text-xs font-bold uppercase tracking-wider text-slate-600">Student Name *</label>
                <input type="text" value={form.studentName} onChange={e => setForm(f => ({ ...f, studentName: e.target.value }))}
                  className="mt-1 w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm font-semibold outline-none focus:ring-2 focus:ring-blue-500" placeholder="Full name" />
              </div>
              <div>
                <label className="text-xs font-bold uppercase tracking-wider text-slate-600">Parent Mobile</label>
                <input type="tel" value={form.parentMobile} onChange={e => setForm(f => ({ ...f, parentMobile: e.target.value }))}
                  className="mt-1 w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm font-semibold outline-none focus:ring-2 focus:ring-blue-500" placeholder="Phone number" />
              </div>
              <div>
                <label className="text-xs font-bold uppercase tracking-wider text-slate-600">Grade</label>
                <input type="text" value={form.grade} onChange={e => setForm(f => ({ ...f, grade: e.target.value }))}
                  className="mt-1 w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm font-semibold outline-none focus:ring-2 focus:ring-blue-500" placeholder="e.g. 6, 10, 12" />
              </div>
            </div>

            {/* Expanded fields */}
            <details open={!!editingEnquiry}>
              <summary className="cursor-pointer text-sm font-bold text-blue-600 hover:text-blue-800">▾ Full Details</summary>
              <div className="mt-4 space-y-4">
                <div className="grid gap-4 sm:grid-cols-3">
                  <div>
                    <label className="text-xs font-bold uppercase tracking-wider text-slate-600">Parent Name</label>
                    <input type="text" value={form.parentName} onChange={e => setForm(f => ({ ...f, parentName: e.target.value }))}
                      className="mt-1 w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm outline-none focus:ring-2 focus:ring-blue-500" />
                  </div>
                  <div>
                    <label className="text-xs font-bold uppercase tracking-wider text-slate-600">Email</label>
                    <input type="email" value={form.email} onChange={e => setForm(f => ({ ...f, email: e.target.value }))}
                      className="mt-1 w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm outline-none focus:ring-2 focus:ring-blue-500" />
                  </div>
                  <div>
                    <label className="text-xs font-bold uppercase tracking-wider text-slate-600">Section</label>
                    <input type="text" value={form.section} onChange={e => setForm(f => ({ ...f, section: e.target.value }))}
                      className="mt-1 w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm outline-none focus:ring-2 focus:ring-blue-500" placeholder="A, B, C" />
                  </div>
                </div>

                <div className="grid gap-4 sm:grid-cols-3">
                  <div>
                    <label className="text-xs font-bold uppercase tracking-wider text-slate-600">Mother Name</label>
                    <input type="text" value={form.motherName} onChange={e => setForm(f => ({ ...f, motherName: e.target.value }))}
                      className="mt-1 w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm outline-none focus:ring-2 focus:ring-blue-500" />
                  </div>
                  <div>
                    <label className="text-xs font-bold uppercase tracking-wider text-slate-600">Father Name</label>
                    <input type="text" value={form.fatherName} onChange={e => setForm(f => ({ ...f, fatherName: e.target.value }))}
                      className="mt-1 w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm outline-none focus:ring-2 focus:ring-blue-500" />
                  </div>
                  <div>
                    <label className="text-xs font-bold uppercase tracking-wider text-slate-600">Guardian Name</label>
                    <input type="text" value={form.guardianName} onChange={e => setForm(f => ({ ...f, guardianName: e.target.value }))}
                      className="mt-1 w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm outline-none focus:ring-2 focus:ring-blue-500" />
                  </div>
                </div>

                <div className="grid gap-4 sm:grid-cols-3">
                  <div>
                    <label className="text-xs font-bold uppercase tracking-wider text-slate-600">Date of Birth</label>
                    <input type="date" value={form.dateOfBirth} onChange={e => setForm(f => ({ ...f, dateOfBirth: e.target.value }))}
                      className="mt-1 w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm outline-none focus:ring-2 focus:ring-blue-500" />
                  </div>
                  <div>
                    <label className="text-xs font-bold uppercase tracking-wider text-slate-600">Source</label>
                    <select value={form.source} onChange={e => setForm(f => ({ ...f, source: e.target.value }))}
                      className="mt-1 w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm font-semibold outline-none focus:ring-2 focus:ring-blue-500">
                      {['Walk-in', 'Phone', 'WhatsApp', 'Website', 'Referral', 'Other'].map(s => <option key={s} value={s}>{s}</option>)}
                    </select>
                  </div>
                  <div>
                    <label className="text-xs font-bold uppercase tracking-wider text-slate-600">Program Interest</label>
                    <select value={form.programInterest} onChange={e => setForm(f => ({ ...f, programInterest: e.target.value }))}
                      className="mt-1 w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm font-semibold outline-none focus:ring-2 focus:ring-blue-500">
                      {['General', 'CDC', 'SUITS', 'SRV Skill Development'].map(p => <option key={p} value={p}>{p}</option>)}
                    </select>
                  </div>
                </div>

                <div className="grid gap-4 sm:grid-cols-3">
                  <div>
                    <label className="text-xs font-bold uppercase tracking-wider text-slate-600">Referred by Faculty</label>
                    <select value={form.referredBy} onChange={e => setForm(f => ({ ...f, referredBy: e.target.value }))}
                      className="mt-1 w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm outline-none focus:ring-2 focus:ring-blue-500">
                      <option value="">None</option>
                      {faculties.map(f => <option key={f._id} value={f._id}>{f.name} ({f.srvNumber})</option>)}
                    </select>
                  </div>
                  <div>
                    <label className="text-xs font-bold uppercase tracking-wider text-slate-600">Next Follow-up</label>
                    <input type="date" value={form.nextFollowUp} onChange={e => setForm(f => ({ ...f, nextFollowUp: e.target.value }))}
                      className="mt-1 w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm outline-none focus:ring-2 focus:ring-blue-500" />
                  </div>
                  <div>
                    <label className="text-xs font-bold uppercase tracking-wider text-slate-600">Address</label>
                    <input type="text" value={form.address} onChange={e => setForm(f => ({ ...f, address: e.target.value }))}
                      className="mt-1 w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm outline-none focus:ring-2 focus:ring-blue-500" />
                  </div>
                </div>

                <div>
                  <label className="text-xs font-bold uppercase tracking-wider text-slate-600">Remarks</label>
                  <textarea value={form.remarks} onChange={e => setForm(f => ({ ...f, remarks: e.target.value }))}
                    rows={2} className="mt-1 w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm outline-none focus:ring-2 focus:ring-blue-500" placeholder="Additional notes..." />
                </div>
              </div>
            </details>

            <div className="flex gap-3">
              <button type="submit" className="rounded-xl bg-blue-600 px-6 py-3 text-sm font-bold text-white hover:bg-blue-700 active:scale-95 transition">
                {editingEnquiry ? 'Update Enquiry' : 'Record Enquiry'}
              </button>
              <button type="button" onClick={() => { setShowCreateForm(false); setEditingEnquiry(null); setActiveTab('pipeline'); }}
                className="rounded-xl bg-slate-200 px-6 py-3 text-sm font-bold text-slate-700 hover:bg-slate-300 active:scale-95 transition">Cancel</button>
            </div>
          </form>
        )}

        {/* ══════ ANALYTICS TAB ══════ */}
        {activeTab === 'analytics' && stats && (
          <div className="space-y-6">
            {/* KPI Cards */}
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
              {[
                { label: 'Total Enquiries', value: stats.total, color: 'from-blue-500 to-indigo-600' },
                { label: 'Conversion Rate', value: `${stats.conversionRate}%`, color: 'from-emerald-500 to-teal-600' },
                { label: 'Active Pipeline', value: stats.newCount + stats.contacted + stats.interested, color: 'from-amber-500 to-orange-600' },
                { label: 'Converted', value: stats.converted, color: 'from-violet-500 to-purple-600' }
              ].map((kpi, i) => (
                <div key={i} className={`rounded-2xl bg-gradient-to-br ${kpi.color} p-5 text-white shadow-lg`}>
                  <p className="text-xs font-bold uppercase tracking-wider text-white/70">{kpi.label}</p>
                  <p className="mt-2 text-3xl font-display font-black">{kpi.value}</p>
                </div>
              ))}
            </div>

            {/* Charts Row */}
            <div className="grid gap-6 lg:grid-cols-2">
              {/* Monthly Trends */}
              <div className="rounded-3xl border border-slate-100 bg-white p-5 shadow-sm">
                <h3 className="text-lg font-display font-bold text-slate-900 mb-4">Monthly Trends</h3>
                {stats.monthlyTrends?.length > 0 ? (
                  <ResponsiveContainer width="100%" height={260}>
                    <BarChart data={stats.monthlyTrends}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                      <XAxis dataKey="_id" tick={{ fontSize: 12, fill: '#94a3b8' }} />
                      <YAxis tick={{ fontSize: 12, fill: '#94a3b8' }} />
                      <Tooltip />
                      <Bar dataKey="total" fill="#6366f1" radius={[6, 6, 0, 0]} name="Total" />
                      <Bar dataKey="converted" fill="#10b981" radius={[6, 6, 0, 0]} name="Converted" />
                    </BarChart>
                  </ResponsiveContainer>
                ) : (<p className="text-sm text-slate-400 text-center py-10">No data yet</p>)}
              </div>

              {/* Program Interest Pie */}
              <div className="rounded-3xl border border-slate-100 bg-white p-5 shadow-sm">
                <h3 className="text-lg font-display font-bold text-slate-900 mb-4">Program Interest</h3>
                {stats.programBreakdown?.length > 0 ? (
                  <div className="flex items-center gap-4">
                    <ResponsiveContainer width="50%" height={220}>
                      <RPieChart>
                        <Pie data={stats.programBreakdown} dataKey="count" nameKey="_id" cx="50%" cy="50%" outerRadius={80}>
                          {stats.programBreakdown.map((_, i) => <Cell key={i} fill={PIE_COLORS[i % PIE_COLORS.length]} />)}
                        </Pie>
                        <Tooltip />
                      </RPieChart>
                    </ResponsiveContainer>
                    <div className="space-y-2">
                      {stats.programBreakdown.map((item, i) => (
                        <div key={i} className="flex items-center gap-2 text-sm">
                          <div className="h-3 w-3 rounded-full" style={{ backgroundColor: PIE_COLORS[i % PIE_COLORS.length] }} />
                          <span className="font-semibold text-slate-700">{item._id}</span>
                          <span className="text-slate-400">({item.count})</span>
                        </div>
                      ))}
                    </div>
                  </div>
                ) : (<p className="text-sm text-slate-400 text-center py-10">No data yet</p>)}
              </div>
            </div>

            {/* Source + Temperature */}
            <div className="grid gap-6 lg:grid-cols-2">
              <div className="rounded-3xl border border-slate-100 bg-white p-5 shadow-sm">
                <h3 className="text-lg font-display font-bold text-slate-900 mb-4">Enquiry Sources</h3>
                <div className="space-y-3">
                  {stats.sourceBreakdown?.map((item, i) => {
                    const pct = stats.total > 0 ? Math.round((item.count / stats.total) * 100) : 0;
                    return (
                      <div key={i}>
                        <div className="flex items-center justify-between text-sm mb-1">
                          <span className="font-semibold text-slate-700">{item._id}</span>
                          <span className="text-slate-400">{item.count} ({pct}%)</span>
                        </div>
                        <div className="h-2 rounded-full bg-slate-100 overflow-hidden">
                          <div className="h-full rounded-full bg-blue-500 transition-all" style={{ width: `${pct}%` }} />
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              <div className="rounded-3xl border border-slate-100 bg-white p-5 shadow-sm">
                <h3 className="text-lg font-display font-bold text-slate-900 mb-4">Lead Temperature</h3>
                <div className="grid grid-cols-3 gap-4">
                  {stats.temperatureBreakdown?.map((item, i) => {
                    const cfg = TEMP_CONFIG[item._id] || TEMP_CONFIG.Cold;
                    return (
                      <div key={i} className={`rounded-2xl ${cfg.bg} p-5 text-center`}>
                        <p className="text-3xl">{cfg.icon}</p>
                        <p className={`text-2xl font-black ${cfg.text} mt-1`}>{item.count}</p>
                        <p className={`text-xs font-bold ${cfg.text} mt-1 opacity-80`}>{item._id}</p>
                      </div>
                    );
                  })}
                  {(!stats.temperatureBreakdown || stats.temperatureBreakdown.length === 0) && (
                    <p className="col-span-3 text-sm text-slate-400 text-center py-6">No active leads</p>
                  )}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ══════ ALERTS TAB ══════ */}
        {activeTab === 'alerts' && alerts && (
          <div className="space-y-6">
            <div>
              <h2 className="text-2xl font-display font-bold text-slate-900">Smart Alerts</h2>
              <p className="text-sm text-slate-500 mt-1">Enquiries that need immediate attention</p>
            </div>

            {/* Stale Enquiries */}
            <div className="rounded-3xl border border-red-100 bg-red-50/50 p-5 shadow-sm">
              <h3 className="text-lg font-display font-bold text-red-900 flex items-center gap-2">
                <AlertTriangle size={20} className="text-red-600" /> No Follow-up ({alerts.staleEnquiries?.length || 0})
              </h3>
              <p className="text-sm text-red-700 mt-1">These enquiries haven't been contacted in 48+ hours.</p>
              <div className="mt-4 space-y-2">
                {alerts.staleEnquiries?.length > 0 ? alerts.staleEnquiries.map(enq => (
                  <div key={enq._id} className="flex items-center justify-between rounded-2xl bg-white border border-red-100 px-4 py-3">
                    <div>
                      <p className="text-sm font-bold text-slate-900">{enq.studentName}</p>
                      <p className="text-xs text-slate-500">Grade {enq.grade || '?'} • {daysSince(enq.createdAt)}d ago • Score: {enq.leadScore}</p>
                    </div>
                    <button onClick={() => { setInteractionEnquiry(enq); setActiveTab('pipeline'); }}
                      className="rounded-lg bg-red-600 px-3 py-1.5 text-xs font-bold text-white hover:bg-red-700 transition">Follow Up</button>
                  </div>
                )) : (<p className="text-sm text-red-700/60 py-4 text-center">All caught up! 👏</p>)}
              </div>
            </div>

            {/* Hot Uncontacted */}
            <div className="rounded-3xl border border-amber-100 bg-amber-50/50 p-5 shadow-sm">
              <h3 className="text-lg font-display font-bold text-amber-900 flex items-center gap-2">
                🔥 Hot Leads Uncontacted ({alerts.hotUncontacted?.length || 0})
              </h3>
              <p className="text-sm text-amber-700 mt-1">High-score leads with zero interactions.</p>
              <div className="mt-4 space-y-2">
                {alerts.hotUncontacted?.length > 0 ? alerts.hotUncontacted.map(enq => (
                  <div key={enq._id} className="flex items-center justify-between rounded-2xl bg-white border border-amber-100 px-4 py-3">
                    <div>
                      <p className="text-sm font-bold text-slate-900">{enq.studentName}</p>
                      <p className="text-xs text-slate-500">Grade {enq.grade || '?'} • Score: {enq.leadScore} 🔥</p>
                    </div>
                    <button onClick={() => { setInteractionEnquiry(enq); setActiveTab('pipeline'); }}
                      className="rounded-lg bg-amber-600 px-3 py-1.5 text-xs font-bold text-white hover:bg-amber-700 transition">Contact Now</button>
                  </div>
                )) : (<p className="text-sm text-amber-700/60 py-4 text-center">No hot leads waiting 🎯</p>)}
              </div>
            </div>

            {/* Aging */}
            <div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
              <h3 className="text-lg font-display font-bold text-slate-900 flex items-center gap-2">
                <Clock size={20} className="text-slate-500" /> Aging Enquiries ({alerts.aging?.length || 0})
              </h3>
              <p className="text-sm text-slate-500 mt-1">Active enquiries older than 7 days with no conversion.</p>
              <div className="mt-4 space-y-2">
                {alerts.aging?.length > 0 ? alerts.aging.map(enq => (
                  <div key={enq._id} className="flex items-center justify-between rounded-2xl border border-slate-100 bg-slate-50 px-4 py-3">
                    <div>
                      <p className="text-sm font-bold text-slate-900">{enq.studentName}</p>
                      <p className="text-xs text-slate-500">Grade {enq.grade || '?'} • {enq.status} • {daysSince(enq.createdAt)}d old</p>
                    </div>
                    <span className="rounded-full bg-slate-200 px-3 py-1 text-xs font-bold text-slate-600">{daysSince(enq.createdAt)} days</span>
                  </div>
                )) : (<p className="text-sm text-slate-400 py-4 text-center">No aging enquiries 🎉</p>)}
              </div>
            </div>
          </div>
        )}

        {/* ══════ INTERACTION MODAL ══════ */}
        {interactionEnquiry && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
            <div className="w-full max-w-md rounded-3xl bg-white p-6 shadow-2xl">
              <h3 className="text-xl font-display font-bold text-slate-900 flex items-center gap-2">
                <MessageCircle className="text-blue-600" size={22} /> Log Interaction
              </h3>
              <p className="mt-1 text-sm text-slate-500">With {interactionEnquiry.studentName}</p>

              <div className="mt-5 space-y-4">
                <div>
                  <label className="text-xs font-bold uppercase tracking-wider text-slate-600">Interaction Type</label>
                  <select value={interactionForm.type} onChange={e => setInteractionForm(f => ({ ...f, type: e.target.value }))}
                    className="mt-1 w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm font-semibold outline-none focus:ring-2 focus:ring-blue-500">
                    {['Call', 'WhatsApp', 'Email', 'Meeting', 'SMS', 'Note'].map(t => <option key={t} value={t}>{t}</option>)}
                  </select>
                </div>
                <div>
                  <label className="text-xs font-bold uppercase tracking-wider text-slate-600">Notes</label>
                  <textarea value={interactionForm.notes} onChange={e => setInteractionForm(f => ({ ...f, notes: e.target.value }))}
                    rows={3} className="mt-1 w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="What happened during the interaction..." />
                </div>
              </div>

              <div className="mt-6 flex gap-3">
                <button onClick={handleLogInteraction}
                  className="rounded-xl bg-blue-600 px-6 py-3 text-sm font-bold text-white hover:bg-blue-700 active:scale-95 transition flex-1">Log Interaction</button>
                <button onClick={() => setInteractionEnquiry(null)}
                  className="rounded-xl bg-slate-200 px-6 py-3 text-sm font-bold text-slate-700 hover:bg-slate-300 active:scale-95 transition">Cancel</button>
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
