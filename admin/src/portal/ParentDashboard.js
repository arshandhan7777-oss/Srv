import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { LogOut, Bell, Download, FileText, Calendar as CalIcon, TrendingUp, Sparkles, CheckCircle2, Coffee, CreditCard, AlertCircle, Clock, CheckCheck, BookOpen, ChevronLeft, ChevronRight, History, ArrowRight, Archive, X } from 'lucide-react';
import srvLogo from '../assest/fav_logo/srv-t.png';
import { BarChart, Bar, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, Radar, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis } from 'recharts';
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';
import API_URL from '../config/api.js';
import Swal from 'sweetalert2';
import { ParentPollsSection } from '../components/ParentPollsSection.js';
import { ParentFeedbackSection } from '../components/ParentFeedbackSection.js';

const COLORS = ['#10b981', '#f59e0b', '#ef4444', '#3b82f6'];

export function ParentDashboard() {
  const [data, setData] = useState({ student: null, records: [], homework: [], food: null, settings: {} });
  const [weeklyHomework, setWeeklyHomework] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showPayModal, setShowPayModal] = useState(false);
  const [selectedTerm, setSelectedTerm] = useState({ id: '', name: '', amount: '', balance: '' });
  const [amountToPay, setAmountToPay] = useState('');
  const [processing, setProcessing] = useState(false);
  
  // Notifications & Announcements
  const [announcements, setAnnouncements] = useState([]);
  const [showNotifications, setShowNotifications] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);
  
  // Homework Calendar State
  const [currentWeekStart, setCurrentWeekStart] = useState(() => {
    const d = new Date();
    d.setHours(0, 0, 0, 0);
    const day = d.getDay();
    const diff = d.getDate() - day + (day === 0 ? -6 : 1);
    return new Date(d.setDate(diff));
  });
  const [flippedDay, setFlippedDay] = useState(null);
  const [historySubject, setHistorySubject] = useState(null);
  const [historyData, setHistoryData] = useState([]);
  const [historyLoading, setHistoryLoading] = useState(false);
  
  const navigate = useNavigate();
  const reportRef = useRef();

  useEffect(() => {
    // Auth is handled by ProtectedRoute — just fetch data
    const token = localStorage.getItem('schoolToken');
    axios.get(`${API_URL}/api/parent/dashboard`, {
      headers: { Authorization: `Bearer ${token}` }
    }).then(res => {
      setData(res.data);
      setLoading(false);
    }).catch(err => {
      console.error(err);
      setLoading(false); // Even if it fails, stop loading to show fallback UI
    });

    fetchWeeklyHomework();
    fetchAnnouncements();
  }, [navigate]);

  const fetchWeeklyHomework = async () => {
    try {
      const token = localStorage.getItem('schoolToken');
      const res = await axios.get(`${API_URL}/api/parent/homework/weekly`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      console.log('Successfully fetched weekly homework:', res.data);
      setWeeklyHomework(res.data);
    } catch (err) {
      console.error('Error fetching weekly homework:', err.message, err.response?.data);
    }
  };

  const fetchAnnouncements = async () => {
    try {
      const token = localStorage.getItem('schoolToken');
      const res = await axios.get(`${API_URL}/api/parent/announcements`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setAnnouncements(res.data);
      // Count unread announcements (those without isRead flag)
      const unread = res.data.filter(a => !a.isRead).length;
      setUnreadCount(unread);
    } catch (err) {
      console.error('Error fetching announcements:', err);
    }
  };

  const dismissAnnouncement = async (announcementId) => {
    try {
      const token = localStorage.getItem('schoolToken');
      await axios.post(
        `${API_URL}/api/parent/announcements/${announcementId}/dismiss`,
        {},
        { headers: { Authorization: `Bearer ${token}` } }
      );
      // Remove from local state
      setAnnouncements(announcements.filter(ann => ann._id !== announcementId));
    } catch (err) {
      console.error('Error dismissing announcement:', err);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('schoolToken');
    localStorage.removeItem('schoolUser');
    navigate('/login');
  };

  const downloadReportCard = async () => {
    const input = reportRef.current;
    if (!input) return;
    
    html2canvas(input, { scale: 2 }).then((canvas) => {
      const imgData = canvas.toDataURL('image/png');
      const pdf = new jsPDF('p', 'mm', 'a4');
      const pdfWidth = pdf.internal.pageSize.getWidth();
      const pdfHeight = (canvas.height * pdfWidth) / canvas.width;
      
      pdf.addImage(imgData, 'PNG', 0, 0, pdfWidth, pdfHeight);
      pdf.save(`${data.student?.name}_ReportCard.pdf`);
    });
  };

  const handlePayment = async () => {
    if (!data.settings?.isOnlineFeeEnabled) return;
    setProcessing(true);
    try {
      const token = localStorage.getItem('schoolToken');
      const payVal = amountToPay === '' ? selectedTerm.balance : amountToPay;
      await axios.post(`${API_URL}/api/parent/pay-fee`, { term: selectedTerm.id, amountToPay: payVal }, { headers: { Authorization: `Bearer ${token}` }});
      
      const res = await axios.get(`${API_URL}/api/parent/dashboard`, { headers: { Authorization: `Bearer ${token}` }});
      setData(res.data);
      setShowPayModal(false);
      setAmountToPay('');
    } catch (err) {
      Swal.fire('Payment Failed', err.response?.data?.message || 'Payment failed.', 'error');
    } finally {
      setProcessing(false);
    }
  };

  // Homework Calendar Helper Functions
  const days = [];
  for (let i = 0; i < 7; i++) {
    const d = new Date(currentWeekStart);
    d.setDate(d.getDate() + i);
    days.push(d);
  }

  const nextWeek = () => {
    const d = new Date(currentWeekStart);
    d.setDate(d.getDate() + 7);
    setCurrentWeekStart(d);
    setFlippedDay(null);
  };

  const prevWeek = () => {
    const d = new Date(currentWeekStart);
    d.setDate(d.getDate() - 7);
    setCurrentWeekStart(d);
    setFlippedDay(null);
  };

  const isSameDay = (d1, d2) => {
    const date1 = new Date(d1);
    const date2 = new Date(d2);
    return date1.getFullYear() === date2.getFullYear() &&
           date1.getMonth() === date2.getMonth() &&
           date1.getDate() === date2.getDate();
  };

  const isPastDeadline = (date) => {
    return new Date(date).setHours(0,0,0,0) < new Date().setHours(0,0,0,0);
  };

  const groupBySubject = (hwList) => {
    const groups = {};
    hwList.forEach(hw => {
      if (!groups[hw.subject]) {
        groups[hw.subject] = [];
      }
      groups[hw.subject].push(hw);
    });
    return groups;
  };

  const subjectColors = {
    'English': { bg: 'bg-blue-500/15', text: 'text-blue-400', border: 'border-blue-500/30', pill: 'bg-blue-100 text-blue-700', pillDark: 'bg-blue-500/20 text-blue-300' },
    'Tamil': { bg: 'bg-purple-500/15', text: 'text-purple-400', border: 'border-purple-500/30', pill: 'bg-purple-100 text-purple-700', pillDark: 'bg-purple-500/20 text-purple-300' },
    'Hindi': { bg: 'bg-orange-500/15', text: 'text-orange-400', border: 'border-orange-500/30', pill: 'bg-orange-100 text-orange-700', pillDark: 'bg-orange-500/20 text-orange-300' },
    'Mathematics': { bg: 'bg-emerald-500/15', text: 'text-emerald-400', border: 'border-emerald-500/30', pill: 'bg-emerald-100 text-emerald-700', pillDark: 'bg-emerald-500/20 text-emerald-300' },
    'Science': { bg: 'bg-cyan-500/15', text: 'text-cyan-400', border: 'border-cyan-500/30', pill: 'bg-cyan-100 text-cyan-700', pillDark: 'bg-cyan-500/20 text-cyan-300' },
    'Social Science': { bg: 'bg-amber-500/15', text: 'text-amber-400', border: 'border-amber-500/30', pill: 'bg-amber-100 text-amber-700', pillDark: 'bg-amber-500/20 text-amber-300' },
    'Computer Science': { bg: 'bg-indigo-500/15', text: 'text-indigo-400', border: 'border-indigo-500/30', pill: 'bg-indigo-100 text-indigo-700', pillDark: 'bg-indigo-500/20 text-indigo-300' },
  };

  const getSubjectColor = (subject) => {
    return subjectColors[subject] || { bg: 'bg-slate-500/15', text: 'text-slate-400', border: 'border-slate-500/30', pill: 'bg-slate-100 text-slate-700', pillDark: 'bg-slate-500/20 text-slate-300' };
  };

  // Fetch subject history
  const openSubjectHistory = async (subject) => {
    setHistorySubject(subject);
    setHistoryLoading(true);
    try {
      const token = localStorage.getItem('schoolToken');
      const res = await axios.get(`${API_URL}/api/parent/homework/history/${encodeURIComponent(subject)}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setHistoryData(res.data);
    } catch (err) {
      console.error('Error fetching subject history:', err);
      setHistoryData([]);
    } finally {
      setHistoryLoading(false);
    }
  };

  // Dynamic Data Formatting
  const latestRecord = data.records?.[0]; // Use most recent term
  
  const marksData = latestRecord?.marks ? Object.entries(latestRecord.marks).map(([sub, val]) => ({
    subject: sub.charAt(0).toUpperCase() + sub.slice(1).replace(/([A-Z])/g, ' $1'),
    marks: val
  })) : [];

  const totalClasses = data.attendance?.length || 0;
  const presentClasses = data.attendance?.filter(a => a.status === 'Present' || a.status === 'Half-Day').length || 0;
  const finalAttendancePercentage = totalClasses > 0 ? Math.round((presentClasses / totalClasses) * 100) : 0;

  const attendanceData = totalClasses > 0 ? [
    { name: 'Present', value: presentClasses },
    { name: 'Absent', value: totalClasses - presentClasses },
  ] : [];

  const behaviorChartData = data.behavior?.map(b => ({
    date: new Date(b.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
    score: b.score,
    remarks: b.remarks
  })) || [];

  const avgBehaviorScore = data.behavior?.length 
    ? (data.behavior.reduce((acc, curr) => acc + curr.score, 0) / data.behavior.length).toFixed(1) 
    : 10;

  const nliteData = latestRecord?.nliteSkills ? [
    { skill: 'Comm.', score: latestRecord.nliteSkills.communication, fullMark: 5 },
    { skill: 'Teamwork', score: latestRecord.nliteSkills.teamwork, fullMark: 5 },
    { skill: 'Learning', score: latestRecord.nliteSkills.lifelongLearning, fullMark: 5 },
    { skill: 'Attitude', score: latestRecord.nliteSkills.positiveAttitude, fullMark: 5 },
    { skill: 'Wellbeing', score: latestRecord.nliteSkills.holisticWellbeing, fullMark: 5 },
    { skill: 'Languages', score: latestRecord.nliteSkills.languageProficiency, fullMark: 5 },
  ] : [];

  // Fee Calculations
  const term1Amt = Number(data.student?.fees?.term1Amount) || 4500;
  const term2Amt = Number(data.student?.fees?.term2Amount) || 4500;
  const term3Amt = Number(data.student?.fees?.term3Amount) || 4500;
  const extraAmt = Number(data.student?.fees?.additionalFees) || 0;
  
  const totalAnnualFee = term1Amt + term2Amt + term3Amt + extraAmt;
  
  const term1Paid = Number(data.student?.fees?.term1Paid) || 0;
  const term2Paid = Number(data.student?.fees?.term2Paid) || 0;
  const term3Paid = Number(data.student?.fees?.term3Paid) || 0;
  const extraPaid = Number(data.student?.fees?.additionalPaid) || 0;
  
  const totalPaid = term1Paid + term2Paid + term3Paid + extraPaid;
  const amountDue = totalAnnualFee - totalPaid;
  
  const dueCount = [data.student?.fees?.term1, data.student?.fees?.term2, data.student?.fees?.term3].filter(s => s !== 'Paid').length;

  if (loading) return <div className="min-h-screen flex items-center justify-center bg-slate-50">Loading Dashboard...</div>;

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Top Navbar */}
      <div className="bg-slate-900 text-white px-4 sm:px-8 py-4 flex justify-between items-center shadow-md">
        <div className="flex items-center gap-4">
          <div className="w-16 h-16 bg-emerald-900 rounded-[20px] p-[4px] shadow-lg shrink-0">
             <div className="w-full h-full bg-white rounded-[16px] flex items-center justify-center overflow-hidden p-1.5">
               <img src={srvLogo} alt="SRV" className="w-full h-full object-contain scale-[1.15]" />
             </div>
          </div>
          <div>
            <h1 className="font-display font-bold text-lg leading-tight">Parent Portal</h1>
            <p className="text-xs text-amber-400">SRV Matriculation School</p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <div className="relative">
            <button 
              onClick={() => setShowNotifications(!showNotifications)}
              className="relative w-10 h-10 flex items-center justify-center text-slate-300 hover:text-white transition-colors"
            >
              <Bell size={20} />
              {unreadCount > 0 && (
                <span className="absolute top-2 right-2 w-2 h-2 bg-red-500 rounded-full animate-pulse"></span>
              )}
            </button>
            
            {/* Notifications Dropdown */}
            {showNotifications && (
              <div className="absolute right-0 mt-2 w-80 bg-white rounded-2xl shadow-2xl border border-slate-100 z-50 max-h-96 overflow-y-auto">
                <div className="sticky top-0 bg-slate-900 text-white p-4 border-b border-slate-800 rounded-t-2xl">
                  <h3 className="font-display font-bold">Announcements</h3>
                  <p className="text-xs text-slate-400">{announcements.length} total</p>
                </div>
                
                {announcements.length > 0 ? (
                  <div className="divide-y divide-slate-100">
                    {announcements.map(ann => (
                      <div key={ann._id} className={`p-4 hover:bg-slate-50 transition-colors ${ann.priority === 'HIGH' ? 'border-l-4 border-l-red-500' : 'border-l-4 border-l-slate-200'}`}>
                        <div className="flex items-start justify-between gap-2 mb-1">
                          <h4 className="font-bold text-slate-900 text-sm line-clamp-2">{ann.title}</h4>
                          <div className="flex items-center gap-2 flex-shrink-0">
                            {ann.priority === 'HIGH' && <span className="bg-red-100 text-red-700 text-[10px] font-bold px-2 py-0.5 rounded-full whitespace-nowrap">URGENT</span>}
                            <button 
                              onClick={() => dismissAnnouncement(ann._id)}
                              className="text-slate-400 hover:text-slate-600 p-0.5 rounded transition-colors"
                              title="Dismiss"
                            >
                              <X size={16} />
                            </button>
                          </div>
                        </div>
                        <p className="text-xs text-slate-600 line-clamp-2 mb-2">{ann.message}</p>
                        <div className="flex items-center justify-between text-[11px]">
                          <span className="text-slate-500">{ann.createdByRole === 'admin' ? '🏢 Admin' : '👨‍🏫 Faculty'}</span>
                          <span className="text-slate-400">{new Date(ann.createdAt).toLocaleDateString()}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="p-8 text-center text-slate-400">
                    <p className="text-sm font-semibold">No announcements yet</p>
                  </div>
                )}
              </div>
            )}
          </div>
          <button onClick={handleLogout} className="flex items-center gap-2 px-4 py-2 bg-white/10 hover:bg-white/20 rounded-lg text-sm font-semibold transition-colors">
            <LogOut size={16} /> <span className="hidden sm:inline">Logout</span>
          </button>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8" ref={reportRef}>
        
        {/* Student Header */}
        <div className="bg-white rounded-3xl p-8 mb-8 shadow-sm border border-slate-100 flex flex-col md:flex-row justify-between items-center gap-6 relative overflow-hidden">
          <div className="absolute top-0 right-0 w-64 h-64 bg-emerald-50 rounded-full blur-3xl -z-0"></div>
          
          <div className="flex items-center gap-6 relative z-10 w-full">
            <div className="w-20 h-20 bg-amber-100 text-amber-600 rounded-full flex items-center justify-center text-2xl font-display font-bold shrink-0 border-4 border-white shadow-md">
              {data.student?.name?.charAt(0) || 'S'}
            </div>
            <div>
              <h2 className="text-3xl font-display font-bold text-slate-900">{data.student?.name || 'Student Name'}</h2>
              <div className="flex flex-wrap gap-2 mt-2">
                <span className="px-3 py-1 bg-slate-100 text-slate-600 rounded-full text-xs font-semibold">Grade {data.student?.grade || 'X'} - {data.student?.section || 'A'}</span>
                <span className="px-3 py-1 bg-emerald-100 text-emerald-700 rounded-full text-xs font-semibold">SRV No: {data.student?.srvNumber || 'SRVXXXX'}</span>
              </div>
            </div>
          </div>

          <button onClick={downloadReportCard} className="w-full md:w-auto shrink-0 flex items-center justify-center gap-2 px-6 py-3 bg-slate-900 text-white font-semibold rounded-xl hover:bg-slate-800 transition-colors shadow-lg shadow-slate-900/20 relative z-10">
            <Download size={18} /> Download Report Card
          </button>
        </div>

        <div className="grid lg:grid-cols-3 gap-8">
          
          {/* LEFT COLUMN: Wide Widgets (Marks & Homework) */}
          <div className="lg:col-span-2 flex flex-col gap-8">
            
            {/* Marks Chart */}
            <div className="bg-white rounded-3xl p-8 shadow-sm border border-slate-100">
              <div className="flex justify-between items-center mb-8">
                <div className="flex items-center gap-3">
                  <TrendingUp className="text-emerald-500" />
                  <h3 className="text-xl font-display font-bold text-slate-900">Academic Performance</h3>
                </div>
                <span className="bg-slate-100 text-slate-600 px-3 py-1 rounded-full text-xs font-bold">{latestRecord?.term || 'No Data'}</span>
              </div>
              
              {marksData.length > 0 ? (
                <div className="h-72 w-full" style={{ minHeight: '288px' }}>
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={marksData} margin={{ top: 5, right: 30, left: -20, bottom: 5 }}>
                      <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E2E8F0" />
                      <XAxis dataKey="subject" axisLine={false} tickLine={false} tick={{ fill: '#64748b', fontSize: 13 }} dy={10} />
                      <YAxis axisLine={false} tickLine={false} tick={{ fill: '#64748b', fontSize: 13 }} domain={[0, 100]}/>
                      <Tooltip cursor={{ fill: '#f8fafc' }} contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)' }} />
                      <Bar dataKey="marks" fill="#10b981" radius={[6, 6, 0, 0]} maxBarSize={50} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              ) : (
                <div className="h-72 w-full flex items-center justify-center border-2 border-dashed border-slate-100 rounded-2xl text-slate-400 font-semibold">
                  No academic marks uploaded yet.
                </div>
              )}
            </div>

            {/* Today's Homework Section — grouped by subject */}
            <div className="bg-white rounded-3xl p-8 shadow-sm border border-slate-100">
              <div className="flex items-center justify-between mb-6">
                <div className="flex items-center gap-3">
                  <FileText className="text-blue-500" />
                  <h3 className="text-xl font-display font-bold text-slate-900">Today's Homework & Tasks</h3>
                </div>
                <span className="bg-blue-100 text-blue-700 px-3 py-1 rounded-full text-xs font-bold">
                  {new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'short', day: 'numeric' })}
                </span>
              </div>
              
              {data.homework?.length > 0 ? (() => {
                // Group today's homework by subject
                const grouped = {};
                data.homework.forEach(hw => {
                  if (!grouped[hw.subject]) grouped[hw.subject] = [];
                  grouped[hw.subject].push(hw);
                });
                const subjectColorMap = {
                  'English': { bg: 'bg-blue-50', border: 'border-blue-100', header: 'bg-blue-100 text-blue-700', dot: 'bg-blue-500' },
                  'Tamil': { bg: 'bg-purple-50', border: 'border-purple-100', header: 'bg-purple-100 text-purple-700', dot: 'bg-purple-500' },
                  'Hindi': { bg: 'bg-orange-50', border: 'border-orange-100', header: 'bg-orange-100 text-orange-700', dot: 'bg-orange-500' },
                  'Mathematics': { bg: 'bg-emerald-50', border: 'border-emerald-100', header: 'bg-emerald-100 text-emerald-700', dot: 'bg-emerald-500' },
                  'Science': { bg: 'bg-cyan-50', border: 'border-cyan-100', header: 'bg-cyan-100 text-cyan-700', dot: 'bg-cyan-500' },
                  'Social Science': { bg: 'bg-amber-50', border: 'border-amber-100', header: 'bg-amber-100 text-amber-700', dot: 'bg-amber-500' },
                  'Computer Science': { bg: 'bg-indigo-50', border: 'border-indigo-100', header: 'bg-indigo-100 text-indigo-700', dot: 'bg-indigo-500' },
                };
                const getColor = (sub) => subjectColorMap[sub] || { bg: 'bg-slate-50', border: 'border-slate-100', header: 'bg-slate-100 text-slate-700', dot: 'bg-slate-500' };

                return (
                  <div className="space-y-5">
                    {Object.entries(grouped).map(([subject, hwList]) => {
                      const color = getColor(subject);
                      return (
                        <div key={subject} className={`${color.bg} border ${color.border} rounded-2xl overflow-hidden`}>
                          {/* Subject Header — clickable for history */}
                          <button 
                            onClick={() => openSubjectHistory(subject)}
                            className="w-full flex items-center justify-between px-5 py-3 border-b border-inherit hover:bg-white/60 transition-colors group cursor-pointer"
                          >
                            <div className="flex items-center gap-2.5">
                              <span className={`w-2.5 h-2.5 rounded-full ${color.dot}`}></span>
                              <span className={`text-sm font-bold ${color.header.split(' ')[1]}`}>{subject}</span>
                            </div>
                            <div className="flex items-center gap-2">
                              <span className={`${color.header} text-[10px] font-bold px-2.5 py-0.5 rounded-full`}>
                                {hwList.length} Task{hwList.length > 1 ? 's' : ''}
                              </span>
                              <span className="text-[9px] text-slate-400 font-bold opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap ml-1 flex items-center gap-1">
                                History <ArrowRight size={12} />
                              </span>
                            </div>
                          </button>
                          {/* Homework entries */}
                          <div className="divide-y divide-white/80">
                            {hwList.map(hw => (
                              <button 
                                key={hw._id}
                                onClick={() => openSubjectHistory(subject)}
                                className="w-full px-5 py-4 hover:bg-white/50 transition-colors text-left cursor-pointer group"
                              >
                                <div className="flex justify-between items-start mb-1.5">
                                  <h4 className="font-display font-bold text-slate-900 text-base group-hover:text-blue-700 transition-colors">{hw.title}</h4>
                                  <span className="text-[11px] font-bold text-red-500 shrink-0 ml-3 mt-0.5">
                                    Due: {new Date(hw.dueDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                                  </span>
                                </div>
                                <p className="text-sm text-slate-600 leading-relaxed">{hw.description}</p>
                              </button>
                            ))}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                );
              })() : (
                <div className="p-8 border-2 border-dashed border-slate-100 rounded-2xl text-center">
                  <BookOpen size={36} className="mx-auto text-slate-300 mb-3" />
                  <p className="text-slate-400 font-semibold text-lg">No homework assigned for today.</p>
                  <p className="text-slate-300 text-sm mt-1">Check the Homework Dashboard below for the full weekly view.</p>
                </div>
              )}
            </div>

          </div>

          {/* RIGHT COLUMN: Narrow Widgets (Nlite & Attendance) */}
          <div className="lg:col-span-1 flex flex-col gap-8">
            
            {/* Nlite Chart */}
            <div className="bg-white rounded-3xl p-8 shadow-sm border border-slate-100">
              <div className="flex items-center gap-3 mb-6">
                <Sparkles className="text-amber-500" />
                <h3 className="text-xl font-display font-bold text-slate-900">Nlite 21st-Century Skills</h3>
              </div>
              
              {nliteData.length > 0 ? (
                <div className="h-64 w-full" style={{ minHeight: '256px' }}>
                  <ResponsiveContainer width="100%" height="100%">
                    <RadarChart cx="50%" cy="50%" outerRadius="70%" data={nliteData}>
                      <PolarGrid stroke="#e2e8f0" />
                      <PolarAngleAxis dataKey="skill" tick={{ fill: '#64748b', fontSize: 11, fontWeight: 'bold' }} />
                      <PolarRadiusAxis angle={30} domain={[0, 5]} tick={false} axisLine={false} />
                      <Radar name="Student" dataKey="score" stroke="#f59e0b" fill="#fde68a" fillOpacity={0.6} />
                      <Tooltip contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }} />
                    </RadarChart>
                  </ResponsiveContainer>
                  <p className="text-center text-xs text-slate-500 font-semibold mt-2">Overall holistic wellbeing and skill analysis</p>
                </div>
              ) : (
                <div className="h-64 w-full flex items-center justify-center border-2 border-dashed border-slate-100 rounded-2xl text-slate-400 font-semibold text-center px-4">
                  No Nlite Skill evaluations published yet.
                </div>
              )}
            </div>

            {/* Attendance Chart */}
            <div className="bg-white rounded-3xl p-8 shadow-sm border border-slate-100 flex-1">
              <div className="flex items-center gap-3 mb-6">
                <CalIcon className="text-blue-500" />
                <h3 className="text-xl font-display font-bold text-slate-900">Attendance Tracker</h3>
              </div>
              
              {attendanceData.length > 0 ? (
                <>
                  <div className="h-48 relative w-full flex justify-center" style={{ minHeight: '192px' }}>
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie
                          data={attendanceData}
                          cx="50%"
                          cy="50%"
                          innerRadius={50}
                          outerRadius={70}
                          paddingAngle={5}
                          dataKey="value"
                          stroke="none"
                        >
                          {attendanceData.map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                          ))}
                        </Pie>
                        <Tooltip />
                      </PieChart>
                    </ResponsiveContainer>
                    <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                      <span className="text-2xl font-display font-bold text-slate-900">{finalAttendancePercentage}%</span>
                      <span className="text-[10px] text-slate-500 font-bold uppercase tracking-wider">Present</span>
                    </div>
                  </div>
                  <div className="flex justify-center gap-6 mt-4">
                    <div className="flex items-center gap-2">
                      <div className="w-3 h-3 rounded-full bg-emerald-500"></div>
                      <span className="text-sm font-semibold text-slate-600">{presentClasses} Days</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="w-3 h-3 rounded-full bg-amber-500"></div>
                      <span className="text-sm font-semibold text-slate-600">{totalClasses - presentClasses} Days</span>
                    </div>
                  </div>
                </>
              ) : (
                <div className="h-56 w-full flex items-center justify-center border-2 border-dashed border-slate-100 rounded-2xl text-slate-400 font-semibold text-center px-4">
                  No attendance records found.
                </div>
              )}
            </div>

          </div>
        </div>

        {/* Behavior Analytics Section */}
        <div className="mt-8 bg-white rounded-3xl p-8 shadow-sm border border-slate-100 flex flex-col lg:flex-row gap-8">
          <div className="flex-1">
            <div className="flex items-center gap-3 mb-6">
              <TrendingUp className="text-amber-500" />
              <h3 className="text-xl font-display font-bold text-slate-900">Behavior Analytics</h3>
            </div>
            
            <div className="flex items-end gap-3 mb-6">
              <span className="text-5xl font-display font-black text-slate-900 leading-none">{avgBehaviorScore}</span>
              <span className="text-sm font-bold text-slate-500 mb-1 uppercase tracking-widest">/ 10 Avg Score</span>
            </div>

            <div className="h-64 mt-4 relative" style={{ minHeight: '256px' }}>
              {behaviorChartData.length > 0 ? (
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={behaviorChartData} margin={{ top: 5, right: 20, bottom: 5, left: 0 }}>
                    <Line type="monotone" dataKey="score" stroke="#f59e0b" strokeWidth={3} dot={{ r: 4, fill: '#f59e0b', strokeWidth: 2, stroke: '#fff' }} activeDot={{ r: 6 }} />
                    <CartesianGrid stroke="#f1f5f9" strokeDasharray="5 5" vertical={false} />
                    <XAxis dataKey="date" axisLine={false} tickLine={false} tick={{ fill: '#94a3b8', fontSize: 12 }} dy={10} />
                    <YAxis domain={[0, 10]} axisLine={false} tickLine={false} tick={{ fill: '#94a3b8', fontSize: 12 }} dx={-10} />
                    <Tooltip 
                      contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)', padding: '12px' }}
                      cursor={{ stroke: '#fef3c7', strokeWidth: 2, strokeDasharray: '5 5' }}
                    />
                  </LineChart>
                </ResponsiveContainer>
              ) : (
                <div className="w-full h-full flex flex-col items-center justify-center border-2 border-dashed border-slate-100 rounded-2xl text-slate-400 font-semibold">
                  <TrendingUp size={32} className="mb-2 text-slate-300" />
                  No behavior tracking points logged yet.
                </div>
              )}
            </div>
          </div>

          <div className="lg:w-1/3 bg-amber-50 rounded-2xl p-6 border border-amber-100 flex flex-col h-auto lg:h-[400px]">
            <h4 className="font-bold text-amber-800 mb-4 flex items-center gap-2"><Sparkles size={16} /> Recent Remarks</h4>
            <div className="flex-1 overflow-y-auto space-y-3 pr-2">
              {behaviorChartData.slice().reverse().filter(b => b.remarks).map((b, i) => (
                <div key={i} className="bg-white p-4 rounded-xl border border-amber-200/50 shadow-sm">
                  <div className="flex justify-between items-start mb-2">
                    <span className="text-xs font-bold text-amber-500 uppercase tracking-widest">{b.date}</span>
                    <span className="text-[10px] font-black bg-amber-100 text-amber-700 px-2 py-1 rounded w-max">{b.score} / 10</span>
                  </div>
                  <p className="text-sm text-slate-700 font-medium">{b.remarks}</p>
                </div>
              ))}
              {behaviorChartData.filter(b => b.remarks).length === 0 && (
                <p className="text-sm tracking-tight text-amber-600/70 font-medium text-center mt-4">No specific remarks added by faculty.</p>
              )}
            </div>
          </div>
        </div>

        {/* Cafeteria Menu Section */}
        <div className="mt-8 bg-white rounded-3xl p-8 shadow-sm border border-slate-100">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-3">
              <Coffee className="text-orange-500" />
              <h3 className="text-xl font-display font-bold text-slate-900">Today's Cafeteria Menu</h3>
            </div>
            <span className="bg-orange-100 text-orange-700 px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wide">
              {data.food?.day || new Date().toLocaleDateString('en-US', { weekday: 'long' })}
            </span>
          </div>
          
          {data.food ? (
            <div className="grid md:grid-cols-3 gap-6">
              <div className="p-5 rounded-2xl bg-orange-50 border border-orange-100 text-center">
                <span className="text-xs font-bold text-orange-500 uppercase tracking-widest block mb-2">Breakfast</span>
                <p className="font-display font-bold text-slate-800 text-lg">{data.food.breakfast || 'Not specified'}</p>
              </div>
              <div className="p-5 rounded-2xl bg-emerald-50 border border-emerald-100 text-center">
                <span className="text-xs font-bold text-emerald-500 uppercase tracking-widest block mb-2">Lunch</span>
                <p className="font-display font-bold text-slate-800 text-lg">{data.food.lunch || 'Not specified'}</p>
              </div>
              <div className="p-5 rounded-2xl bg-blue-50 border border-blue-100 text-center">
                <span className="text-xs font-bold text-blue-500 uppercase tracking-widest block mb-2">Snacks</span>
                <p className="font-display font-bold text-slate-800 text-lg">{data.food.snacks || 'Not specified'}</p>
              </div>
            </div>
          ) : (
            <div className="p-6 border-2 border-dashed border-slate-100 rounded-2xl text-slate-400 font-semibold text-center">
              Today's food menu has not been published by the administration yet.
            </div>
          )}
        </div>

        {/* Weekly Homework Dashboard */}
        <div className="bg-white rounded-3xl p-6 lg:p-8 shadow-sm border border-slate-100 mt-8 relative">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between mb-6 gap-4">
            <div className="flex items-center gap-3">
              <BookOpen className="text-emerald-500" />
              <h3 className="text-xl font-display font-bold text-slate-900">Weekly Homework Overview</h3>
            </div>
            <div className="flex items-center gap-4 cursor-pointer">
              <button onClick={fetchWeeklyHomework} className="text-sm text-slate-500 font-semibold hover:text-emerald-600 transition-colors">
                Refresh Data
              </button>
              <div className="flex items-center gap-2 bg-slate-50 rounded-xl p-1 border border-slate-200">
                <button onClick={prevWeek} className="p-1.5 hover:bg-white rounded-lg transition-colors"><ChevronLeft size={18} className="text-slate-600" /></button>
                <span className="text-sm font-bold text-slate-700 w-36 text-center">
                  {days[0].toLocaleDateString('en-US', { month: 'short', day: 'numeric' })} - {days[6].toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                </span>
                <button onClick={nextWeek} className="p-1.5 hover:bg-white rounded-lg transition-colors"><ChevronRight size={18} className="text-slate-600" /></button>
              </div>
            </div>
          </div>

          <div className="overflow-x-auto pb-4">
            <div className="min-w-[1000px] grid grid-cols-7 gap-4">
              {days.map((day, i) => {
                const dayHomework = weeklyHomework.filter(hw => isSameDay(hw.dueDate, day));
                const isToday = isSameDay(day, new Date());
                const isFlipped = flippedDay === i;
                const grouped = groupBySubject(dayHomework);
                const subjectKeys = Object.keys(grouped);

                return (
                  <div 
                    key={i} 
                    className="relative perspective-1000 h-[420px] w-full group"
                    onMouseEnter={() => setFlippedDay(i)}
                    onMouseLeave={() => setFlippedDay(null)}
                    onClick={() => setFlippedDay(isFlipped ? null : i)}
                  >
                    <div className={`w-full h-full relative transition-transform duration-700 transform-style-3d ${isFlipped ? 'rotate-y-180' : 'group-hover:[transform:rotateY(180deg)]'}`}>
                      
                      {/* FRONT FACE */}
                      <div className={`absolute w-full h-full backface-hidden rounded-[24px] border flex flex-col justify-center items-center p-6 cursor-pointer shadow-sm transition-colors ${isToday ? 'border-emerald-300 bg-emerald-50' : 'border-slate-100 bg-slate-50'}`}>
                        <p className={`text-sm font-bold uppercase tracking-widest mb-3 ${isToday ? 'text-emerald-600' : 'text-slate-500'}`}>
                          {day.toLocaleDateString('en-US', { weekday: 'long' })}
                        </p>
                        <p className={`text-6xl font-display font-black mb-4 ${isToday ? 'text-emerald-900' : 'text-slate-800'}`}>
                          {day.getDate()}
                        </p>
                        
                        {/* Subject pills on front face */}
                        {subjectKeys.length > 0 ? (
                          <div className="flex flex-col items-center gap-2 w-full">
                            <div className="bg-white border border-emerald-100 text-emerald-700 px-4 py-1.5 rounded-full text-xs font-bold shadow-sm flex items-center gap-2">
                              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
                              {dayHomework.length} Task{dayHomework.length > 1 ? 's' : ''}
                            </div>
                            <div className="flex flex-wrap justify-center gap-1 mt-1 max-w-full px-2">
                              {subjectKeys.slice(0, 3).map(sub => (
                                <span key={sub} className={`${getSubjectColor(sub).pill} text-[9px] font-bold px-2 py-0.5 rounded-full truncate max-w-[90px]`}>
                                  {sub}
                                </span>
                              ))}
                              {subjectKeys.length > 3 && (
                                <span className="bg-slate-200 text-slate-600 text-[9px] font-bold px-2 py-0.5 rounded-full">
                                  +{subjectKeys.length - 3}
                                </span>
                              )}
                            </div>
                          </div>
                        ) : (
                          <div className="bg-transparent text-slate-400 px-4 py-2 rounded-full text-xs font-semibold border border-slate-200">
                            No Tasks
                          </div>
                        )}
                        <div className="mt-auto pt-4 text-[10px] text-slate-400 font-bold uppercase tracking-widest flex items-center gap-1 opacity-50">
                          Hover to flip <ChevronRight size={10} />
                        </div>
                      </div>

                      {/* BACK FACE — Grouped by Subject */}
                      <div className={`absolute w-full h-full backface-hidden rotate-y-180 rounded-[24px] border flex flex-col overflow-hidden bg-slate-900 border-slate-800 shadow-xl cursor-default`}>
                        <div className="p-3 bg-slate-800/80 border-b border-slate-700/50 text-center shrink-0 flex justify-between items-center px-4">
                          <span className="text-emerald-400 font-bold text-[10px] tracking-wider uppercase">
                            {day.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })}
                          </span>
                          <span className="text-slate-400 text-[10px] font-bold">
                            {subjectKeys.length} Subject{subjectKeys.length !== 1 ? 's' : ''} • {dayHomework.length} Task{dayHomework.length !== 1 ? 's' : ''}
                          </span>
                        </div>
                        
                        <div className="p-3 flex-1 flex flex-col gap-2.5 overflow-y-auto no-scrollbar" onClick={e => e.stopPropagation()}>
                          {subjectKeys.length > 0 ? subjectKeys.map(subject => {
                            const color = getSubjectColor(subject);
                            const subjectHw = grouped[subject];

                            return (
                              <div key={subject} className={`${color.bg} border ${color.border} rounded-xl overflow-hidden`}>
                                {/* Subject Header — clickable for history */}
                                <button 
                                  onClick={() => openSubjectHistory(subject)}
                                  className="w-full flex items-center justify-between px-3 py-2 hover:bg-white/5 transition-colors group/sub"
                                >
                                  <div className="flex items-center gap-2">
                                    <span className={`text-[9px] font-black uppercase tracking-widest ${color.text}`}>
                                      {subject}
                                    </span>
                                    <span className="text-[9px] text-slate-500 font-bold">
                                      ({subjectHw.length})
                                    </span>
                                  </div>
                                  <div className="flex items-center gap-1 opacity-0 group-hover/sub:opacity-100 transition-opacity">
                                    <span className="text-[8px] text-slate-500 font-bold">History</span>
                                    <ArrowRight size={10} className={color.text} />
                                  </div>
                                </button>

                                {/* Homework entries under this subject — clickable for history */}
                                <div className="px-3 pb-2 space-y-1.5">
                                  {subjectHw.map(hw => (
                                    <button 
                                      key={hw._id}
                                      onClick={() => openSubjectHistory(subject)}
                                      className="w-full bg-slate-800/50 rounded-lg p-2.5 relative hover:bg-slate-700/60 transition-colors text-left group"
                                    >
                                      <h4 className="font-display font-bold text-white text-[12px] mb-0.5 leading-tight group-hover:text-emerald-300 transition-colors">{hw.title}</h4>
                                      <p className="text-[10px] text-slate-400 line-clamp-2 leading-relaxed mb-1.5">{hw.description}</p>
                                      <div className="flex items-center justify-between">
                                        <span className="text-[9px] text-slate-500 font-semibold flex items-center gap-1">
                                          <Clock size={9} /> Due: {new Date(hw.dueDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                                        </span>
                                      </div>
                                    </button>
                                  ))}
                                </div>
                              </div>
                            );
                          }) : (
                            <div className="flex flex-col items-center justify-center h-full text-slate-600 opacity-60 space-y-2">
                              <CalIcon size={24} strokeWidth={1.5} />
                              <span className="text-[10px] font-bold uppercase tracking-widest text-center">No Tasks<br/>Assigned</span>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Subject History Slide-out Panel */}
          {historySubject && (
            <div className="fixed inset-0 z-50 flex justify-end animate-fade-in" onClick={() => setHistorySubject(null)}>
              <div className="absolute inset-0 bg-slate-900/50 backdrop-blur-sm" />
              
              <div 
                className="relative w-full max-w-lg bg-white h-full shadow-2xl flex flex-col animate-slide-in"
                onClick={e => e.stopPropagation()}
              >
                {/* Panel Header */}
                <div className="shrink-0 px-6 pt-6 pb-4 border-b border-slate-100">
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-3">
                      <div className={`w-10 h-10 rounded-xl ${getSubjectColor(historySubject).pill} flex items-center justify-center`}>
                        <History size={18} />
                      </div>
                      <div>
                        <h3 className="text-lg font-display font-bold text-slate-900">{historySubject}</h3>
                        <p className="text-xs text-slate-500 font-semibold">Complete homework history</p>
                      </div>
                    </div>
                    <button 
                      onClick={() => setHistorySubject(null)} 
                      className="p-2 hover:bg-slate-100 rounded-xl transition-colors"
                    >
                      <X size={20} className="text-slate-400" />
                    </button>
                  </div>

                  {!historyLoading && (
                    <div className="flex items-center gap-3 text-xs">
                      <span className="bg-emerald-100 text-emerald-700 font-bold px-2.5 py-1 rounded-full">
                        {historyData.filter(h => !h.archived).length} Active
                      </span>
                      <span className="bg-slate-100 text-slate-600 font-bold px-2.5 py-1 rounded-full flex items-center gap-1">
                        <Archive size={10} /> {historyData.filter(h => h.archived).length} Archived
                      </span>
                      <span className="text-slate-400 font-semibold ml-auto">
                        {historyData.length} Total
                      </span>
                    </div>
                  )}
                </div>

                {/* Panel Body */}
                <div className="flex-1 overflow-y-auto p-6 no-scrollbar">
                  {historyLoading ? (
                    <div className="flex flex-col items-center justify-center h-64 text-slate-400 gap-3">
                      <div className="w-8 h-8 border-3 border-emerald-500 border-t-transparent rounded-full animate-spin"></div>
                      <span className="text-sm font-semibold">Loading history...</span>
                    </div>
                  ) : historyData.length > 0 ? (
                    <div className="space-y-4">
                      {historyData.map((hw, idx) => {
                        const isArchived = hw.archived;
                        const color = getSubjectColor(hw.subject);
                        
                        return (
                          <div 
                            key={hw._id} 
                            className={`relative rounded-2xl border p-5 transition-all hover:shadow-md ${
                              isArchived 
                                ? 'bg-slate-50 border-slate-200 opacity-75' 
                                : 'bg-white border-slate-100 shadow-sm'
                            }`}
                            style={{ animationDelay: `${idx * 50}ms` }}
                          >
                            {/* Archived badge */}
                            {isArchived && (
                              <div className="absolute top-3 right-3">
                                <span className="bg-slate-200 text-slate-600 text-[9px] font-black uppercase tracking-wider px-2 py-0.5 rounded-full flex items-center gap-1">
                                  <Archive size={9} /> Archived
                                </span>
                              </div>
                            )}

                            {/* Topic */}
                            <h4 className={`font-display font-bold text-lg mb-2 pr-20 ${isArchived ? 'text-slate-500' : 'text-slate-900'}`}>
                              {hw.title}
                            </h4>

                            {/* Description */}
                            <p className={`text-sm mb-4 leading-relaxed ${isArchived ? 'text-slate-400' : 'text-slate-600'}`}>
                              {hw.description}
                            </p>

                            {/* Meta info */}
                            <div className="flex flex-wrap items-center gap-3 text-xs">
                              <span className={`${color.pill} font-bold px-2.5 py-1 rounded-full`}>
                                {hw.subject}
                              </span>
                              <span className="text-slate-400 font-semibold flex items-center gap-1">
                                <CalIcon size={11} /> Assigned: {new Date(hw.assignedDate || hw.createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                              </span>
                              <span className={`font-semibold flex items-center gap-1 ${
                                isPastDeadline(hw.dueDate) && !isArchived ? 'text-red-500' : 'text-slate-400'
                              }`}>
                                <Clock size={11} /> Due: {new Date(hw.dueDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                              </span>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  ) : (
                    <div className="flex flex-col items-center justify-center h-64 text-slate-400 gap-3">
                      <BookOpen size={36} strokeWidth={1.5} />
                      <span className="text-sm font-semibold">No homework history found for {historySubject}.</span>
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}
        </div>

        <ParentPollsSection />
        <ParentFeedbackSection />

        {/* Pay Fees Section */}
        <div className="mt-8 bg-white rounded-3xl p-8 shadow-sm border border-slate-100">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-3">
              <CreditCard className="text-violet-600" />
              <h3 className="text-xl font-display font-bold text-slate-900">Fee Payment</h3>
            </div>
            {!data.settings?.isOnlineFeeEnabled && (
              <span className="bg-slate-100 text-slate-600 text-xs font-bold px-3 py-1 rounded-full flex items-center gap-1">
                <AlertCircle size={12} /> Online payments disabled
              </span>
            )}
            {data.settings?.isOnlineFeeEnabled && dueCount > 0 && (
               <span className="bg-red-100 text-red-600 text-xs font-bold px-3 py-1 rounded-full flex items-center gap-1">
                 <AlertCircle size={12} /> {dueCount} Term{dueCount > 1 ? 's' : ''} Due
               </span>
            )}
          </div>

          {/* Fee Summary Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8">
            <div className="bg-slate-50 border border-slate-100 rounded-2xl p-5">
              <p className="text-xs font-bold text-slate-500 uppercase tracking-widest mb-1">Total Outstanding Due</p>
              <p className={`text-3xl font-display font-extrabold ${amountDue > 0 ? 'text-red-500' : 'text-slate-800'}`}>₹{amountDue.toLocaleString()}</p>
              <p className="text-xs text-slate-400 mt-1">Pending this academic year</p>
            </div>
            <div className="bg-emerald-50 border border-emerald-100 rounded-2xl p-5">
              <p className="text-xs font-bold text-emerald-600 uppercase tracking-widest mb-1">Total Paid</p>
              <p className="text-3xl font-display font-extrabold text-emerald-700">₹{totalPaid.toLocaleString()}</p>
              <p className="text-xs text-emerald-400 mt-1">Payments collected</p>
            </div>
            <div className="bg-violet-50 border border-violet-100 rounded-2xl p-5">
              <p className="text-xs font-bold text-violet-600 uppercase tracking-widest mb-1">Total Annual</p>
              <p className="text-3xl font-display font-extrabold text-violet-700">₹{totalAnnualFee.toLocaleString()}</p>
              <p className="text-xs text-violet-400 mt-1">(Includes Add-on: ₹{extraAmt.toLocaleString()})</p>
            </div>
          </div>

          {/* Term-wise Fee Breakdown */}
          <h4 className="text-sm font-bold text-slate-700 uppercase tracking-widest mb-4">Term-wise Breakdown</h4>
          <div className="overflow-x-auto rounded-2xl border border-slate-100">
            <table className="w-full text-sm">
              <thead className="bg-slate-50 text-slate-500 font-bold uppercase text-xs">
                <tr>
                  <th className="text-left px-5 py-3">Term</th>
                  <th className="text-left px-5 py-3">Description</th>
                  <th className="text-left px-5 py-3">Total / Paid</th>
                  <th className="text-left px-5 py-3">Balance Due</th>
                  <th className="text-center px-5 py-3 w-[140px]">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                {[
                  { id: 'term1', term: 'Term 1', desc: 'Tuition + Lab Fee', amount: term1Amt, paid: term1Paid, due: '15 Jun 2024', status: data.student?.fees?.term1 || 'Unpaid' },
                  { id: 'term2', term: 'Term 2', desc: 'Tuition + Activity Fee', amount: term2Amt, paid: term2Paid, due: '15 Oct 2024', status: data.student?.fees?.term2 || 'Unpaid' },
                  { id: 'term3', term: 'Term 3', desc: 'Tuition + Exam Fee', amount: term3Amt, paid: term3Paid, due: '15 Feb 2025', status: data.student?.fees?.term3 || 'Unpaid' },
                ].map((row) => (
                  <tr key={row.term} className="hover:bg-slate-50 transition-colors">
                    <td className="px-5 py-4 font-bold text-slate-800">{row.term}</td>
                    <td className="px-5 py-4 text-slate-600">{row.desc}</td>
                    <td className="px-5 py-4 font-semibold text-slate-600">
                      ₹{row.amount.toLocaleString()} <br/>
                      <span className="text-[10px] text-emerald-600 uppercase tracking-widest font-bold">Paid: ₹{row.paid.toLocaleString()}</span>
                    </td>
                    <td className="px-5 py-4 font-bold text-red-500">₹{(row.amount - row.paid).toLocaleString()}</td>
                    <td className="px-5 py-4">
                      {row.status === 'Paid' ? (
                        <span className="flex items-center justify-center gap-1 text-emerald-600 font-bold text-xs bg-emerald-100 px-3 py-1.5 rounded-full w-full">
                          <CheckCheck size={14} /> Paid
                        </span>
                      ) : (
                        data.settings?.isOnlineFeeEnabled ? (
                          <div className="flex flex-col gap-1 items-center">
                            {row.status === 'Partial' && <span className="text-[10px] font-bold text-amber-600 bg-amber-100 px-2 py-0.5 rounded-md">PARTIAL</span>}
                            <button onClick={() => { setSelectedTerm({ id: row.id, name: row.term, amount: row.amount, balance: row.amount - row.paid }); setShowPayModal(true); }} className="w-full py-1.5 font-bold text-[11px] bg-violet-100 text-violet-700 hover:bg-violet-600 hover:text-white rounded-lg transition-colors">
                              Pay Online
                            </button>
                          </div>
                        ) : (
                          <span className="flex items-center justify-center gap-1 text-slate-500 font-bold text-[11px] bg-slate-100 px-3 py-1.5 rounded-full w-full" title="Online payment disabled. Pay offline.">
                            {row.status === 'Partial' ? 'Partial' : 'Pay at Office'}
                          </span>
                        )
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Pay Modal */}
        {showPayModal && (
          <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
            <div className="bg-white rounded-3xl p-8 max-w-md w-full shadow-2xl">
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-xl font-display font-bold text-slate-900">Complete Payment</h3>
                <button onClick={() => setShowPayModal(false)} className="text-slate-400 hover:text-slate-700 transition-colors">✕</button>
              </div>
              <div className="bg-slate-50 rounded-2xl p-5 mb-6">
                <p className="text-sm text-slate-500 mb-1">Paying for</p>
                <p className="font-bold text-slate-900 text-lg">{selectedTerm.name}</p>
                <p className="text-xs text-slate-400 mt-1 uppercase tracking-wider font-bold">Total Remaining Balance</p>
                <p className="text-3xl font-display font-extrabold text-violet-700 mt-1">₹{selectedTerm.balance?.toLocaleString()}</p>
              </div>
              
              <div className="mb-6">
                <label htmlFor="amountToPay" className="block text-sm font-bold text-slate-600 mb-2">Amount to Pay Now (₹)</label>
                <input 
                  id="amountToPay"
                  name="amountToPay"
                  type="number" 
                  value={amountToPay} 
                  onChange={(e) => setAmountToPay(e.target.value)} 
                  placeholder={`e.g. ${selectedTerm.balance}`}
                  className="w-full px-4 py-3 bg-white border border-slate-200 rounded-xl focus:ring-2 focus:ring-violet-500 outline-none font-bold text-slate-800"
                />
                <p className="text-xs text-slate-400 mt-2 italic">You can pay partially or the full balance.</p>
              </div>

              <div className="space-y-3 mb-6">
                <div className="flex gap-3">
                  <button className="flex-1 py-3 px-4 border-2 border-violet-600 text-violet-700 font-bold rounded-xl text-sm">UPI / QR</button>
                  <button className="flex-1 py-3 px-4 border-2 border-slate-200 text-slate-600 font-semibold rounded-xl text-sm">Card</button>
                </div>
              </div>
              <button disabled={processing} onClick={handlePayment} className="w-full py-4 text-center bg-violet-600 text-white font-bold rounded-xl hover:bg-violet-700 transition-colors shadow-lg shadow-violet-600/20 disabled:opacity-50">
                {processing ? 'Processing Securely...' : 'Approve & Pay Now'}
              </button>
            </div>
          </div>
        )}

      </div>
    </div>
  );
}

