import { useState, useEffect, useRef } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import axios from 'axios';
import { LogOut, Bell, Download, FileText, Calendar as CalIcon, TrendingUp, Sparkles, CheckCircle2, Coffee, CreditCard, AlertCircle, Clock, CheckCheck, BookOpen, ChevronLeft, ChevronRight, History, ArrowRight, Archive, X, BookMarked, AlertCircleIcon, Home, Zap, MessageSquareMore, Image as ImageIcon } from 'lucide-react';
import { BarChart, Bar, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, Radar, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis } from 'recharts';
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';
import API_URL from '../config/api.js';
import Swal from 'sweetalert2';
import { ParentPollsSection } from '../components/ParentPollsSection.js';
import { ParentFeedbackSection } from '../components/ParentFeedbackSection.js';
import { ParentEventsSection } from '../components/ParentEventsSection.js';
import { Logo } from '../components/Logo.js';
import { PortalHeader } from '../components/PortalHeader.js';
import { NotificationPanel } from '../components/NotificationPanel.js';
import { MemoriesSection } from '../components/MemoriesSection.js';

const COLORS = ['#10b981', '#f59e0b', '#ef4444', '#3b82f6'];

function SummaryCard({ icon: Icon, title, value, subtitle, tone, onClick }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`w-full rounded-[1.75rem] border border-slate-200 bg-white p-5 text-left shadow-sm transition-all duration-300 ${
        onClick
          ? 'hover:-translate-y-1 hover:scale-[1.03] hover:shadow-lg active:scale-[0.99]'
          : ''
      }`}
    >
      <div className={`mb-4 inline-flex h-12 w-12 items-center justify-center rounded-2xl ${tone}`}>
        <Icon size={22} />
      </div>
      <p className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-500">{title}</p>
      <p className="mt-2 text-3xl font-display font-bold text-slate-900">{value}</p>
      <p className="mt-1 text-sm text-slate-500">{subtitle}</p>
      {onClick ? (
        <span className="mt-4 inline-flex items-center gap-2 text-sm font-semibold text-slate-600">
          View details
          <ArrowRight size={16} />
        </span>
      ) : null}
    </button>
  );
}

function QuickAccessCard({ icon: Icon, title, description, badge, gradient, onClick }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="group rounded-[1.75rem] border border-slate-200 bg-slate-50 p-4 text-left transition-all duration-300 hover:-translate-y-1 hover:scale-[1.03] hover:shadow-lg hover:border-slate-300 active:scale-[0.98]"
    >
      <div className={`flex h-14 w-14 items-center justify-center rounded-[1.25rem] bg-gradient-to-br ${gradient} text-white shadow-lg shadow-slate-300/40`}>
        <Icon size={24} />
      </div>
      <div className="mt-4 flex items-center justify-between gap-2">
        <h3 className="text-base font-display font-bold text-slate-900">{title}</h3>
        {badge ? <span className="rounded-full bg-slate-200 px-2.5 py-1 text-[11px] font-bold text-slate-700">{badge}</span> : null}
      </div>
      <p className="mt-2 text-sm leading-5 text-slate-500">{description}</p>
    </button>
  );
}

export function ParentDashboard({ section = 'dashboard' }) {
  // ========== Data & Loading State ==========
const [data, setData] = useState({ student: null, records: [], homework: [], food: null, settings: {} });
  const [weeklyHomework, setWeeklyHomework] = useState([]);
  const [loading, setLoading] = useState(true);
  
  // ========== Share Modal State ==========
  const [showPayModal, setShowPayModal] = useState(false);
  const [selectedTerm, setSelectedTerm] = useState({ id: '', name: '', amount: '', balance: '' });
  const [amountToPay, setAmountToPay] = useState('');
  const [processing, setProcessing] = useState(false);
  
  // ========== Notifications State ==========
  const [announcements, setAnnouncements] = useState([]);
  const [showNotifications, setShowNotifications] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);
  
  // ========== Homework Calendar State ==========
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
  const { subject: subjectParam } = useParams();
  const reportRef = useRef();
  const activeSection = section || 'dashboard';
  const selectedHomeworkSubject = activeSection === 'homework' && subjectParam ? decodeURIComponent(subjectParam) : '';

  const pageMeta = {
    dashboard: {
      title: 'Parent Dashboard',
      description: 'Academic performance, attendance, pending fees, and quick mobile access to every parent feature.'
    },
    academics: {
      title: 'Academic Performance',
      description: 'Subject-wise marks, term averages, and the latest academic record.'
    },
    attendance: {
      title: 'Attendance Tracker',
      description: 'Daily attendance summary, history, and attendance percentage.'
    },
    skills: {
      title: 'Nlite 21st-Century Skills',
      description: 'Detailed student skill analysis and score breakdown.'
    },
    homework: {
      title: 'Homework and Tasks',
      description: 'Today’s homework and the weekly homework overview in one place.'
    },
    events: {
      title: 'Upcoming Events',
      description: 'School events, schedules, and parent acknowledgements.'
    },
    polls: {
      title: 'Active Opinion Polls',
      description: 'Vote in active parent polls and review the latest questions.'
    },
    feedback: {
      title: 'Feedback and Concerns',
      description: 'Send concerns to school and review your feedback history.'
    },
    memories: {
      title: 'View Memories',
      description: 'Download student photos and videos shared by school from one clean gallery.'
    },
    fees: {
      title: 'Fee Payment',
      description: 'Check balances and complete online fee payments.'
    }
  };

  const navigateToSection = (targetSection) => {
    navigate(targetSection === 'dashboard' ? '/parent/dashboard' : `/parent/${targetSection}`);
  };

  const handleOpenHomework = (subject) => {
    if (!subject) return;
    navigate(`/parent/homework/${encodeURIComponent(subject)}`);
  };

  const handleHomeworkCardKeyDown = (event, subject) => {
    if (event.key === 'Enter' || event.key === ' ') {
      event.preventDefault();
      handleOpenHomework(subject);
    }
  };

  // ========== Fetch Data on Mount ==========
  useEffect(() => {
    const token = localStorage.getItem('schoolToken');
    axios.get(`${API_URL}/api/parent/dashboard`, {
      headers: { Authorization: `Bearer ${token}` }
    }).then(res => {
      setData(res.data);
      setLoading(false);
    }).catch(err => {
      console.error(err);
      setLoading(false);
    });

    fetchWeeklyHomework();
    fetchAnnouncements();
  }, [section]);

  const fetchWeeklyHomework = async () => {
    try {
      const token = localStorage.getItem('schoolToken');
      const res = await axios.get(`${API_URL}/api/parent/homework/weekly`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setWeeklyHomework(res.data);
    } catch (err) {
      console.error('Error fetching weekly homework:', err.message);
    }
  };

  const fetchAnnouncements = async () => {
    try {
      const token = localStorage.getItem('schoolToken');
      const res = await axios.get(`${API_URL}/api/parent/announcements`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setAnnouncements(res.data);
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

  // ========== Homework Calendar Helper Functions ==========
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

  useEffect(() => {
    if (activeSection !== 'homework') return;

    if (!selectedHomeworkSubject) {
      setHistorySubject(null);
      setHistoryData([]);
      setHistoryLoading(false);
      return;
    }

    openSubjectHistory(selectedHomeworkSubject);
  }, [activeSection, selectedHomeworkSubject]);

  // ========== Dynamic Data Formatting ==========
  const recordHistory = [...(data.records || [])].sort((a, b) => {
    return new Date(b.createdAt || b.updatedAt || 0) - new Date(a.createdAt || a.updatedAt || 0);
  });
  const latestRecord = recordHistory[0];
  const latestMarksValues = Object.values(latestRecord?.marks || {}).map(mark => Number(mark) || 0);
  
  const marksData = latestRecord?.marks ? Object.entries(latestRecord.marks).map(([sub, val]) => ({
    subject: sub.charAt(0).toUpperCase() + sub.slice(1).replace(/([A-Z])/g, ' $1'),
    marks: Number(val) || 0
  })) : [];

  const academicTrendData = [...recordHistory].reverse().map((record, index) => {
    const values = Object.values(record.marks || {}).map(mark => Number(mark) || 0);
    const average = values.length > 0
      ? Math.round(values.reduce((sum, mark) => sum + mark, 0) / values.length)
      : 0;

    return {
      term: record.term || `Term ${index + 1}`,
      average
    };
  });

  const totalClasses = data.attendance?.length || 0;
  const presentOnlyClasses = data.attendance?.filter(a => a.status === 'Present').length || 0;
  const halfDayClasses = data.attendance?.filter(a => a.status === 'Half-Day').length || 0;
  const presentClasses = presentOnlyClasses + halfDayClasses;
  const absentClasses = Math.max(totalClasses - presentClasses, 0);
  const finalAttendancePercentage = totalClasses > 0 ? Math.round((presentClasses / totalClasses) * 100) : 0;

  const attendanceChartData = [
    { name: 'Present', value: presentOnlyClasses },
    { name: 'Half-Day', value: halfDayClasses },
    { name: 'Absent', value: absentClasses }
  ].filter(item => item.value > 0);

  const recentAttendance = [...(data.attendance || [])]
    .sort((a, b) => new Date(b.date) - new Date(a.date))
    .slice(0, 12);

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

  // ========== Fee Calculations ==========
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
  const overallAcademicPercentage = latestMarksValues.length > 0
    ? Math.round(latestMarksValues.reduce((sum, mark) => sum + mark, 0) / latestMarksValues.length)
    : 0;
  const hasTodayMenu = Boolean(
    data.food &&
    [data.food.breakfast, data.food.lunch, data.food.snacks].some(item => String(item || '').trim())
  );
  const feeRows = [
    { id: 'term1', term: 'Term 1', desc: 'Tuition + Lab Fee', amount: term1Amt, paid: term1Paid, status: data.student?.fees?.term1 || 'Unpaid' },
    { id: 'term2', term: 'Term 2', desc: 'Tuition + Activity Fee', amount: term2Amt, paid: term2Paid, status: data.student?.fees?.term2 || 'Unpaid' },
    { id: 'term3', term: 'Term 3', desc: 'Tuition + Exam Fee', amount: term3Amt, paid: term3Paid, status: data.student?.fees?.term3 || 'Unpaid' }
  ];
  const appItems = [
    {
      key: 'skills',
      title: 'Nlite Skills',
      description: '21st-century skills, radar graph, and score breakdown',
      icon: Sparkles,
      badge: nliteData.length ? `${nliteData.length} areas` : 'New',
      gradient: 'from-amber-500 to-orange-500'
    },
    {
      key: 'homework',
      title: 'Homework',
      description: 'Today’s homework and weekly homework overview',
      icon: BookOpen,
      badge: data.homework?.length || weeklyHomework.length || 'Tasks',
      gradient: 'from-blue-500 to-cyan-500'
    },
    {
      key: 'events',
      title: 'Events',
      description: 'Upcoming events and schedules',
      icon: CalIcon,
      badge: 'Live',
      gradient: 'from-fuchsia-500 to-pink-500'
    },
    {
      key: 'polls',
      title: 'Polls',
      description: 'Active opinion polls and parent voting',
      icon: FileText,
      badge: 'Polls',
      gradient: 'from-violet-500 to-indigo-500'
    },
    {
      key: 'feedback',
      title: 'Feedback',
      description: 'Feedback, concerns, and your feedback history',
      icon: MessageSquareMore,
      badge: 'Inbox',
      gradient: 'from-rose-500 to-red-500'
    },
    {
      key: 'memories',
      title: 'View Memories',
      description: 'Download shared student photos and videos',
      icon: ImageIcon,
      badge: 'Media',
      gradient: 'from-sky-500 to-indigo-500'
    },
    {
      key: 'fees',
      title: 'Fees',
      description: 'Pending balance and secure fee payment',
      icon: CreditCard,
      badge: amountDue > 0 ? `₹${amountDue.toLocaleString()}` : 'Paid',
      gradient: 'from-emerald-500 to-teal-500'
    }
  ];

  const formattedPendingBalance = new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: 0
  }).format(amountDue);

  const notificationAction = (
    <div className="relative">
      <button
        type="button"
        onClick={() => setShowNotifications(current => !current)}
        className="relative flex h-9 w-9 min-w-9 items-center justify-center rounded-[10px] border border-slate-200 text-slate-600 opacity-100 transition hover:bg-slate-50 hover:text-slate-900 active:scale-95"
      >
        <Bell size={18} className="opacity-100" />
        {unreadCount > 0 ? <span className="absolute right-2 top-2 h-2 w-2 rounded-full bg-red-500"></span> : null}
      </button>
      <NotificationPanel open={showNotifications} onClose={() => setShowNotifications(false)} title="Announcements" subtitle={`${announcements.length} total`}>
        {announcements.length > 0 ? (
          <div className="divide-y divide-slate-100">
            {announcements.map(ann => (
              <div key={ann._id} className={`p-4 transition-colors hover:bg-slate-50 ${ann.priority === 'HIGH' ? 'border-l-4 border-l-red-500' : 'border-l-4 border-l-slate-200'}`}>
                <div className="mb-1 flex items-start justify-between gap-2">
                  <h4 className="line-clamp-2 text-sm font-bold text-slate-900">{ann.title}</h4>
                  <div className="flex flex-shrink-0 items-center gap-2">
                    {ann.priority === 'HIGH' ? <span className="whitespace-nowrap rounded-full bg-red-100 px-2 py-0.5 text-[10px] font-bold text-red-700">URGENT</span> : null}
                    <button type="button" onClick={() => dismissAnnouncement(ann._id)} className="rounded p-0.5 text-slate-400 transition-colors hover:text-slate-600 active:scale-95" title="Dismiss">
                      <X size={16} />
                    </button>
                  </div>
                </div>
                <p className="mb-2 text-xs text-slate-600">{ann.message}</p>
                <div className="flex items-center justify-between text-[11px]">
                  <span className="text-slate-500">{ann.createdByRole === 'admin' ? 'Admin' : 'Faculty'}</span>
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
      </NotificationPanel>
    </div>
  );

  const renderDashboardHome = () => {
    const formattedPendingBalance = new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      maximumFractionDigits: 0
    }).format(amountDue);

    const dashboardApps = [
      {
        key: 'skills',
        title: 'Nlite Skills',
        description: '21st-century skills, radar graph, and score breakdown',
        icon: Sparkles,
        badge: nliteData.length ? `${nliteData.length} areas` : 'New',
        gradient: 'from-amber-500 to-orange-500'
      },
      {
        key: 'homework',
        title: 'Homework',
        description: 'Today’s homework and weekly homework overview',
        icon: BookOpen,
        badge: data.homework?.length || weeklyHomework.length || 'Tasks',
        gradient: 'from-blue-500 to-cyan-500'
      },
      {
        key: 'events',
        title: 'Events',
        description: 'Upcoming events and schedules',
        icon: CalIcon,
        badge: 'Live',
        gradient: 'from-fuchsia-500 to-pink-500'
      },
      {
        key: 'polls',
        title: 'Polls',
        description: 'Active opinion polls and parent voting',
        icon: FileText,
        badge: 'Polls',
        gradient: 'from-violet-500 to-indigo-500'
      },
      {
        key: 'feedback',
        title: 'Feedback',
        description: 'Feedback, concerns, and your feedback history',
        icon: MessageSquareMore,
        badge: 'Inbox',
        gradient: 'from-rose-500 to-red-500'
      },
      {
        key: 'memories',
        title: 'View Memories',
        description: 'Download shared student photos and videos',
        icon: ImageIcon,
        badge: 'Media',
        gradient: 'from-sky-500 to-indigo-500'
      },
      {
        key: 'fees',
        title: 'Fees',
        description: 'Pending balance and secure fee payment',
        icon: CreditCard,
        badge: amountDue > 0 ? `₹${amountDue.toLocaleString()}` : 'Paid',
        gradient: 'from-emerald-500 to-teal-500'
      }
    ];

    return (
      <div className="min-h-screen bg-slate-100">
        <PortalHeader title="Parent Dashboard" subtitle="Clean access to your child's academics, fees, and daily updates" onLogout={handleLogout}>
          {notificationAction}
        </PortalHeader>

        <main ref={reportRef} className="mx-auto w-full max-w-7xl px-4 py-6 sm:px-6 lg:px-8 lg:py-8">
          <div className="space-y-8">
            <section className="overflow-hidden rounded-[2rem] bg-gradient-to-br from-slate-950 via-slate-900 to-emerald-700 p-6 text-white shadow-xl shadow-slate-900/10 sm:p-8">
              <div className="grid gap-6 lg:grid-cols-[1.35fr,0.85fr]">
                <div>
                  <div className="inline-flex items-center gap-2 rounded-full bg-white/10 px-3 py-1 text-xs font-semibold uppercase tracking-[0.2em] text-emerald-100">
                    <Home size={14} />
                    Parent Overview
                  </div>
                  <h2 className="mt-4 max-w-2xl text-3xl font-display font-bold leading-tight sm:text-4xl">
                    Everything for your child, organized in one mobile-first home screen.
                  </h2>
                  <p className="mt-3 max-w-2xl text-sm leading-6 text-emerald-50/90 sm:text-base">
                    Track academics, attendance, fee balance, homework, events, polls, feedback, and skill analysis from one clean parent dashboard.
                  </p>
                </div>

                <div className="rounded-[1.75rem] border border-white/15 bg-white/10 p-5 backdrop-blur">
                  <p className="text-xs font-semibold uppercase tracking-[0.18em] text-emerald-100">Student Snapshot</p>
                  <div className="mt-4 space-y-3">
                    <div className="rounded-2xl bg-white/10 px-4 py-3">
                      <p className="text-xs font-semibold uppercase tracking-[0.18em] text-emerald-100">Student</p>
                      <p className="mt-1 text-xl font-display font-bold">{data.student?.name || 'Student Name'}</p>
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                      <div className="rounded-2xl bg-white/10 px-4 py-3">
                        <p className="text-xs font-semibold uppercase tracking-[0.18em] text-emerald-100">Class</p>
                        <p className="mt-1 text-lg font-display font-bold">Grade {data.student?.grade || '-'}-{data.student?.section || '-'}</p>
                      </div>
                      <div className="rounded-2xl bg-white/10 px-4 py-3">
                        <p className="text-xs font-semibold uppercase tracking-[0.18em] text-emerald-100">SRV No</p>
                        <p className="mt-1 text-lg font-display font-bold">{data.student?.srvNumber || 'SRVXXXX'}</p>
                      </div>
                    </div>
                    <div className="flex flex-wrap items-center gap-3">
                      <div className="rounded-full bg-white/10 px-4 py-2 text-sm font-semibold text-emerald-50">
                        {unreadCount} alert{unreadCount === 1 ? '' : 's'}
                      </div>
                      <button
                        type="button"
                        onClick={downloadReportCard}
                        className="inline-flex items-center gap-2 rounded-full bg-white px-4 py-2 text-sm font-semibold text-slate-900 transition hover:bg-emerald-50 active:scale-[0.98]"
                      >
                        <Download size={16} />
                        Report Card
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            </section>

            <section className="grid grid-cols-1 gap-4 md:grid-cols-3">
              <SummaryCard
                icon={TrendingUp}
                title="Academic Performance"
                value={`${overallAcademicPercentage}%`}
                subtitle={marksData.length > 0 ? `${latestRecord?.term || 'Latest'} term • ${marksData.length} subjects` : 'No marks uploaded yet'}
                tone="bg-emerald-100 text-emerald-600"
                onClick={() => navigateToSection('academics')}
              />
              <SummaryCard
                icon={CalIcon}
                title="Attendance Tracker"
                value={`${finalAttendancePercentage}%`}
                subtitle={totalClasses > 0 ? `${presentClasses}/${totalClasses} days present` : 'No attendance records yet'}
                tone="bg-blue-100 text-blue-600"
                onClick={() => navigateToSection('attendance')}
              />
              <SummaryCard
                icon={CreditCard}
                title="Pending Fee Balance"
                value={`₹${amountDue.toLocaleString()}`}
                subtitle={amountDue > 0 ? `${dueCount} term${dueCount === 1 ? '' : 's'} pending` : 'All fees cleared'}
                tone="bg-violet-100 text-violet-600"
                onClick={() => navigateToSection('fees')}
              />
            </section>

            <section className="rounded-[2rem] border border-slate-200 bg-white p-5 shadow-sm sm:p-6">
              <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">Today Menu</p>
                  <h2 className="mt-1 text-2xl font-display font-bold text-slate-900">Today&apos;s Cafeteria Menu</h2>
                  <p className="mt-1 text-sm text-slate-500">Parents can quickly check the meals planned for today.</p>
                </div>
                <div className="inline-flex items-center gap-2 rounded-full bg-orange-100 px-4 py-2 text-sm font-semibold text-orange-700">
                  <Coffee size={16} />
                  {data.food?.day || new Date().toLocaleDateString('en-US', { weekday: 'long' })}
                </div>
              </div>

              {hasTodayMenu ? (
                <div className="mt-6 grid gap-4 md:grid-cols-3">
                  <div className="rounded-[1.5rem] border border-orange-200 bg-orange-50 p-5">
                    <p className="text-xs font-semibold uppercase tracking-[0.16em] text-orange-600">Breakfast</p>
                    <p className="mt-3 text-lg font-display font-bold text-slate-900">{data.food?.breakfast || 'Not specified'}</p>
                  </div>
                  <div className="rounded-[1.5rem] border border-emerald-200 bg-emerald-50 p-5">
                    <p className="text-xs font-semibold uppercase tracking-[0.16em] text-emerald-600">Lunch</p>
                    <p className="mt-3 text-lg font-display font-bold text-slate-900">{data.food?.lunch || 'Not specified'}</p>
                  </div>
                  <div className="rounded-[1.5rem] border border-blue-200 bg-blue-50 p-5">
                    <p className="text-xs font-semibold uppercase tracking-[0.16em] text-blue-600">Snacks</p>
                    <p className="mt-3 text-lg font-display font-bold text-slate-900">{data.food?.snacks || 'Not specified'}</p>
                  </div>
                </div>
              ) : (
                <div className="mt-6 rounded-[1.5rem] border border-dashed border-slate-300 bg-slate-50 px-5 py-8 text-center text-sm font-semibold text-slate-500">
                  Today&apos;s food menu has not been published by the administration yet.
                </div>
              )}
            </section>

            <section className="rounded-[2rem] border border-slate-200 bg-white p-5 shadow-sm sm:p-6">
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">Parent Apps</p>
                <h2 className="mt-1 text-2xl font-display font-bold text-slate-900">Tap an icon to open its page</h2>
                <p className="mt-1 text-sm text-slate-500">Built for quick mobile navigation with one focused page for each parent feature.</p>
              </div>

              <div className="mt-6 grid grid-cols-2 gap-4 lg:grid-cols-3 xl:grid-cols-4">
                {dashboardApps.map(item => (
                  <QuickAccessCard
                    key={item.key}
                    icon={item.icon}
                    title={item.title}
                    description={item.description}
                    badge={item.badge}
                    gradient={item.gradient}
                    onClick={() => navigateToSection(item.key)}
                  />
                ))}
              </div>
            </section>
          </div>
        </main>
      </div>
    );
  };

  if (loading) return <div className="min-h-screen flex items-center justify-center bg-slate-100">Loading Dashboard...</div>;

  if (activeSection === 'dashboard') {
    return renderDashboardHome();
  }

  return (
    <div className="min-h-screen bg-slate-100">
      <PortalHeader
        title={pageMeta[activeSection]?.title || 'Parent Portal'}
        subtitle="SRV Matriculation School"
        onBack={() => navigateToSection('dashboard')}
        onLogout={handleLogout}
      >
        {notificationAction}
      </PortalHeader>
      <div className="hidden sticky top-0 z-30 border-b border-slate-200 bg-white/95 backdrop-blur">
        <div className="mx-auto flex max-w-7xl items-center justify-between gap-4 px-4 py-4 sm:px-6 lg:px-8">
          <div className="flex items-center gap-4">
            <Logo />
          <div>
            <h1 className="font-display font-bold text-lg leading-tight">{pageMeta[activeSection]?.title || 'Parent Portal'}</h1>
            <p className="text-xs text-slate-500">SRV Matriculation School</p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          {activeSection !== 'dashboard' && (
            <button onClick={() => navigateToSection('dashboard')} className="hidden sm:flex items-center gap-2 rounded-xl border border-slate-200 px-4 py-2 text-sm font-semibold text-slate-700 transition hover:bg-slate-50">
              <ChevronLeft size={16} /> Dashboard
            </button>
          )}
          <div className="relative">
            <button 
              onClick={() => setShowNotifications(!showNotifications)}
              className="relative flex h-10 w-10 items-center justify-center text-slate-500 transition-colors hover:text-slate-900"
            >
              <Bell size={20} />
              {unreadCount > 0 && (
                <span className="absolute right-2 top-2 h-2 w-2 rounded-full bg-red-500"></span>
              )}
            </button>
            
            {/* Notifications Dropdown */}
            {showNotifications && (
              <div className="absolute right-0 mt-2 w-80 bg-white rounded-2xl shadow-2xl border border-slate-100 z-50 max-h-96 overflow-y-auto">
                <div className="sticky top-0 bg-slate-900 text-white p-4 border-b border-slate-800 rounded-t-2xl flex items-center justify-between">
                  <div>
                    <h3 className="font-display font-bold">Announcements</h3>
                    <p className="text-xs text-slate-400">{announcements.length} total</p>
                  </div>
                  <button 
                    onClick={() => setShowNotifications(false)}
                    className="text-slate-300 hover:text-white p-1 rounded transition-colors flex-shrink-0"
                    title="Close"
                  >
                    <X size={18} />
                  </button>
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
          <button onClick={handleLogout} className="inline-flex items-center gap-2 rounded-xl bg-slate-900 px-4 py-2 text-sm font-semibold text-white transition hover:bg-slate-800">
            <LogOut size={16} /> <span className="hidden sm:inline">Logout</span>
          </button>
        </div>
      </div>
      </div>

      <div className="mx-auto w-full max-w-7xl px-4 py-8 sm:px-6 lg:px-8" ref={reportRef}>
        {activeSection !== 'dashboard' && pageMeta[activeSection] && (
          <div className="bg-white rounded-3xl p-6 mb-8 shadow-sm border border-slate-100">
            <button 
              onClick={() => navigateToSection('dashboard')}
              className="flex items-center gap-2 text-slate-600 hover:text-slate-900 font-semibold mb-4 transition-colors"
            >
              <ChevronLeft size={20} /> Back to Dashboard
            </button>
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">Parent Apps</p>
            <h2 className="mt-2 text-2xl font-display font-bold text-slate-900">{pageMeta[activeSection].title}</h2>
            <p className="mt-2 text-sm leading-6 text-slate-500 max-w-3xl">{pageMeta[activeSection].description}</p>
          </div>
        )}
        
        {/* ========== STUDENT HEADER ========== */}
        <div className="relative mb-8 flex flex-col gap-6 overflow-hidden rounded-3xl border border-slate-100 bg-white p-5 shadow-sm sm:p-8 md:flex-row md:items-center md:justify-between">
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

          {activeSection === 'dashboard' && (
            <button onClick={downloadReportCard} className="w-full md:w-auto shrink-0 flex items-center justify-center gap-2 px-6 py-3 bg-slate-900 text-white font-semibold rounded-xl hover:bg-slate-800 transition-colors shadow-lg shadow-slate-900/20 relative z-10">
              <Download size={18} /> Download Report Card
            </button>
          )}
        </div>

        {/* ========== MAIN CONTENT: CONDITIONAL RENDERING ========== */}
        
        {activeSection === 'dashboard' && (
          <>
            {/* DASHBOARD: Top 3 Summary Cards */}
            <div className="grid md:grid-cols-3 gap-6 mb-8">
              {/* Academic Performance Card */}
              <div className="bg-white rounded-3xl p-6 shadow-sm border border-slate-100 relative overflow-hidden group cursor-pointer hover:shadow-md hover:border-emerald-200 transition-all"onClick={() => navigateToSection('skills')}>
                <div className="absolute top-0 right-0 w-32 h-32 bg-emerald-50 rounded-full blur-3xl -z-0 group-hover:bg-emerald-100 transition-colors"></div>
                <div className="relative z-10">
                  <div className="flex items-center gap-3 mb-4">
                    <div className="w-12 h-12 bg-emerald-100 rounded-xl flex items-center justify-center">
                      <TrendingUp className="text-emerald-600" size={24} />
                    </div>
                    <h3 className="text-lg font-display font-bold text-slate-900">Overall Academic Performance</h3>
                  </div>
                  {marksData.length > 0 ? (
                    <>
                      <p className="text-4xl font-display font-black text-emerald-600 mb-2">{latestRecord?.marks ? Math.round(Object.values(latestRecord.marks).reduce((a, b) => a + b) / Object.keys(latestRecord.marks).length) : 0}%</p>
                      <p className="text-sm text-slate-500 font-semibold">{latestRecord?.term || 'Latest'} Term • {Object.keys(latestRecord?.marks || {}).length} Subjects</p>
                    </>
                  ) : (
                    <p className="text-slate-400 text-sm font-semibold">No marks uploaded yet</p>
                  )}
                </div>
              </div>

              {/* Attendance Card */}
              <div className="bg-white rounded-3xl p-6 shadow-sm border border-slate-100 relative overflow-hidden group cursor-pointer hover:shadow-md hover:border-blue-200 transition-all" onClick={() => navigateToSection('dashboard')}>
                <div className="absolute top-0 right-0 w-32 h-32 bg-blue-50 rounded-full blur-3xl -z-0 group-hover:bg-blue-100 transition-colors"></div>
                <div className="relative z-10">
                  <div className="flex items-center gap-3 mb-4">
                    <div className="w-12 h-12 bg-blue-100 rounded-xl flex items-center justify-center">
                      <CalIcon className="text-blue-600" size={24} />
                    </div>
                    <h3 className="text-lg font-display font-bold text-slate-900">Attendance Tracker</h3>
                  </div>
                  {totalClasses > 0 ? (
                    <>
                      <p className="text-4xl font-display font-black text-blue-600 mb-2">{finalAttendancePercentage}%</p>
                      <p className="text-sm text-slate-500 font-semibold">{presentClasses}/{totalClasses} Days Present</p>
                    </>
                  ) : (
                    <p className="text-slate-400 text-sm font-semibold">No attendance records</p>
                  )}
                </div>
              </div>

              {/* Fee Balance Card */}
              <div className="bg-white rounded-3xl p-6 shadow-sm border border-slate-100 relative overflow-hidden group cursor-pointer hover:shadow-md hover:border-violet-200 transition-all" onClick={() => navigateToSection('fees')}>
                <div className="absolute top-0 right-0 w-32 h-32 bg-violet-50 rounded-full blur-3xl -z-0 group-hover:bg-violet-100 transition-colors"></div>
                <div className="relative z-10">
                  <div className="flex items-center gap-3 mb-4">
                    <div className="w-12 h-12 bg-violet-100 rounded-xl flex items-center justify-center">
                      <CreditCard className="text-violet-600" size={24} />
                    </div>
                    <h3 className="text-lg font-display font-bold text-slate-900">Pending Fee Balance</h3>
                  </div>
                  <p className={`text-4xl font-display font-black mb-2 ${amountDue > 0 ? 'text-red-500' : 'text-emerald-600'}`}>₹{amountDue.toLocaleString()}</p>
                  <p className="text-sm text-slate-500 font-semibold">{dueCount} Term{dueCount > 1 ? 's' : ''} Due</p>
                </div>
              </div>
            </div>

            {/* DASHBOARD: App-Style Icon Grid */}
            <div className="mb-8 rounded-3xl border border-slate-100 bg-white p-5 shadow-sm sm:p-8">
              <h2 className="text-2xl font-display font-bold text-slate-900 mb-8">Quick Access</h2>
              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-3 gap-4 sm:gap-6">
                {/* Nlite Skills */}
                <button 
                  onClick={() => navigateToSection('skills')}
                  className="group relative p-6 sm:p-8 rounded-2xl sm:rounded-3xl border-2 border-slate-100 hover:border-amber-300 bg-gradient-to-br from-amber-50 to-white hover:shadow-xl transition-all duration-300 text-left"
                >
                  <div className="absolute top-4 right-4 w-12 h-12 bg-amber-100 rounded-xl flex items-center justify-center group-hover:scale-110 transition-transform">
                    <Sparkles className="text-amber-600" size={24} />
                  </div>
                  <h3 className="font-display font-bold text-slate-900 text-base sm:text-lg mt-2">Nlite 21st-Century Skills</h3>
                  <p className="text-xs sm:text-sm text-slate-500 mt-2">Detailed skill analysis & scores</p>
                  <ArrowRight className="text-amber-600 mt-4 group-hover:translate-x-1 transition-transform" size={18} />
                </button>

                {/* Homework */}
                <button 
                  onClick={() => navigateToSection('homework')}
                  className="group relative p-6 sm:p-8 rounded-2xl sm:rounded-3xl border-2 border-slate-100 hover:border-blue-300 bg-gradient-to-br from-blue-50 to-white hover:shadow-xl transition-all duration-300 text-left"
                >
                  <div className="absolute top-4 right-4 w-12 h-12 bg-blue-100 rounded-xl flex items-center justify-center group-hover:scale-110 transition-transform">
                    <BookOpen className="text-blue-600" size={24} />
                  </div>
                  <h3 className="font-display font-bold text-slate-900 text-base sm:text-lg mt-2">Today's Homework & Tasks</h3>
                  <p className="text-xs sm:text-sm text-slate-500 mt-2">Today’s tasks and weekly homework overview</p>
                  <ArrowRight className="text-blue-600 mt-4 group-hover:translate-x-1 transition-transform" size={18} />
                </button>

                {/* Events */}
                <button 
                  onClick={() => navigateToSection('events')}
                  className="group relative p-6 sm:p-8 rounded-2xl sm:rounded-3xl border-2 border-slate-100 hover:border-cyan-300 bg-gradient-to-br from-cyan-50 to-white hover:shadow-xl transition-all duration-300 text-left"
                >
                  <div className="absolute top-4 right-4 w-12 h-12 bg-cyan-100 rounded-xl flex items-center justify-center group-hover:scale-110 transition-transform">
                    <CalIcon className="text-cyan-600" size={24} />
                  </div>
                  <h3 className="font-display font-bold text-slate-900 text-base sm:text-lg mt-2">Upcoming Events</h3>
                  <p className="text-xs sm:text-sm text-slate-500 mt-2">School calendar & schedules</p>
                  <ArrowRight className="text-cyan-600 mt-4 group-hover:translate-x-1 transition-transform" size={18} />
                </button>

                {/* Polls */}
                <button 
                  onClick={() => navigateToSection('polls')}
                  className="group relative p-6 sm:p-8 rounded-2xl sm:rounded-3xl border-2 border-slate-100 hover:border-purple-300 bg-gradient-to-br from-purple-50 to-white hover:shadow-xl transition-all duration-300 text-left"
                >
                  <div className="absolute top-4 right-4 w-12 h-12 bg-purple-100 rounded-xl flex items-center justify-center group-hover:scale-110 transition-transform">
                    <FileText className="text-purple-600" size={24} />
                  </div>
                  <h3 className="font-display font-bold text-slate-900 text-base sm:text-lg mt-2">Active Opinion Polls</h3>
                  <p className="text-xs sm:text-sm text-slate-500 mt-2">Active surveys and parent voting</p>
                  <ArrowRight className="text-purple-600 mt-4 group-hover:translate-x-1 transition-transform" size={18} />
                </button>

                {/* Feedback */}
                <button 
                  onClick={() => navigateToSection('feedback')}
                  className="group relative p-6 sm:p-8 rounded-2xl sm:rounded-3xl border-2 border-slate-100 hover:border-pink-300 bg-gradient-to-br from-pink-50 to-white hover:shadow-xl transition-all duration-300 text-left"
                >
                  <div className="absolute top-4 right-4 w-12 h-12 bg-pink-100 rounded-xl flex items-center justify-center group-hover:scale-110 transition-transform">
                    <MessageSquareMore className="text-pink-600" size={24} />
                  </div>
                  <h3 className="font-display font-bold text-slate-900 text-base sm:text-lg mt-2">Feedback & Concerns</h3>
                  <p className="text-xs sm:text-sm text-slate-500 mt-2">Send concerns and view your feedback history</p>
                  <ArrowRight className="text-pink-600 mt-4 group-hover:translate-x-1 transition-transform" size={18} />
                </button>

                {/* Fees */}
                <button 
                  onClick={() => navigateToSection('fees')}
                  className="group relative p-6 sm:p-8 rounded-2xl sm:rounded-3xl border-2 border-slate-100 hover:border-emerald-300 bg-gradient-to-br from-emerald-50 to-white hover:shadow-xl transition-all duration-300 text-left"
                >
                  <div className="absolute top-4 right-4 w-12 h-12 bg-emerald-100 rounded-xl flex items-center justify-center group-hover:scale-110 transition-transform">
                    <CreditCard className="text-emerald-600" size={24} />
                  </div>
                  <h3 className="font-display font-bold text-slate-900 text-base sm:text-lg mt-2">Fee Payment</h3>
                  <p className="text-xs sm:text-sm text-slate-500 mt-2">Pay securely online</p>
                  <ArrowRight className="text-emerald-600 mt-4 group-hover:translate-x-1 transition-transform" size={18} />
                </button>
              </div>
            </div>
          </>
        )}

        {/* ========== SECTION: ACADEMICS ========== */}
        {activeSection === 'academics' && (
          <div className="grid gap-6 xl:grid-cols-[1.2fr,0.8fr]">
            <div className="rounded-3xl border border-slate-100 bg-white p-5 shadow-sm sm:p-8">
              <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-14 h-14 bg-emerald-100 rounded-xl flex items-center justify-center">
                    <TrendingUp className="text-emerald-600" size={28} />
                  </div>
                  <div>
                    <h2 className="text-2xl font-display font-bold text-slate-900">Subject-wise Marks</h2>
                    <p className="text-sm text-slate-500 mt-1">Parents can review the latest subject scores in one place.</p>
                  </div>
                </div>
                <span className="rounded-full bg-emerald-100 px-4 py-2 text-sm font-bold text-emerald-700">
                  {latestRecord?.term || 'Latest Record'}
                </span>
              </div>

              {marksData.length > 0 ? (
                <>
                  <div className="mt-8 grid gap-4 sm:grid-cols-3">
                    <div className="rounded-2xl border border-slate-100 bg-slate-50 p-5">
                      <p className="text-xs font-bold uppercase tracking-[0.18em] text-slate-500">Overall Average</p>
                      <p className="mt-2 text-3xl font-display font-black text-slate-900">{overallAcademicPercentage}%</p>
                    </div>
                    <div className="rounded-2xl border border-emerald-100 bg-emerald-50 p-5">
                      <p className="text-xs font-bold uppercase tracking-[0.18em] text-emerald-600">Subjects</p>
                      <p className="mt-2 text-3xl font-display font-black text-emerald-700">{marksData.length}</p>
                    </div>
                    <div className="rounded-2xl border border-blue-100 bg-blue-50 p-5">
                      <p className="text-xs font-bold uppercase tracking-[0.18em] text-blue-600">Highest Mark</p>
                      <p className="mt-2 text-3xl font-display font-black text-blue-700">{Math.max(...marksData.map(item => item.marks))}%</p>
                    </div>
                  </div>

                  <div className="mt-8 h-80 w-full" style={{ minHeight: '320px' }}>
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={marksData} margin={{ top: 10, right: 16, left: -20, bottom: 8 }}>
                        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                        <XAxis dataKey="subject" axisLine={false} tickLine={false} tick={{ fill: '#64748b', fontSize: 12 }} />
                        <YAxis domain={[0, 100]} axisLine={false} tickLine={false} tick={{ fill: '#64748b', fontSize: 12 }} />
                        <Tooltip formatter={(value) => [`${value}%`, 'Mark']} />
                        <Bar dataKey="marks" radius={[10, 10, 0, 0]} fill="#10b981" />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>

                  <div className="mt-8 grid gap-4 md:grid-cols-2">
                    {marksData.map(item => (
                      <div key={item.subject} className="rounded-2xl border border-slate-100 bg-slate-50 p-5">
                        <div className="flex items-center justify-between gap-3">
                          <h3 className="text-base font-display font-bold text-slate-900">{item.subject}</h3>
                          <span className="rounded-full bg-white px-3 py-1 text-sm font-bold text-emerald-700 shadow-sm">
                            {item.marks}%
                          </span>
                        </div>
                        <div className="mt-4 h-3 overflow-hidden rounded-full bg-slate-200">
                          <div
                            className="h-full rounded-full bg-gradient-to-r from-emerald-500 to-teal-400"
                            style={{ width: `${Math.max(0, Math.min(item.marks, 100))}%` }}
                          />
                        </div>
                      </div>
                    ))}
                  </div>
                </>
              ) : (
                <div className="mt-8 rounded-3xl border-2 border-dashed border-slate-200 bg-slate-50 px-6 py-12 text-center">
                  <BookMarked size={42} className="mx-auto text-slate-300" />
                  <p className="mt-4 text-base font-semibold text-slate-500">No academic marks have been uploaded yet.</p>
                </div>
              )}
            </div>

            <div className="space-y-6">
              <div className="rounded-3xl border border-slate-100 bg-white p-5 shadow-sm sm:p-8">
                <div className="flex items-center gap-3 mb-6">
                  <div className="w-12 h-12 bg-blue-100 rounded-xl flex items-center justify-center">
                    <Zap className="text-blue-600" size={24} />
                  </div>
                  <div>
                    <h3 className="text-xl font-display font-bold text-slate-900">Term Trend</h3>
                    <p className="text-sm text-slate-500 mt-1">Average marks across uploaded terms.</p>
                  </div>
                </div>

                {academicTrendData.length > 0 ? (
                  <div className="h-72 w-full" style={{ minHeight: '288px' }}>
                    <ResponsiveContainer width="100%" height="100%">
                      <LineChart data={academicTrendData} margin={{ top: 10, right: 12, left: -20, bottom: 8 }}>
                        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                        <XAxis dataKey="term" axisLine={false} tickLine={false} tick={{ fill: '#64748b', fontSize: 12 }} />
                        <YAxis domain={[0, 100]} axisLine={false} tickLine={false} tick={{ fill: '#64748b', fontSize: 12 }} />
                        <Tooltip formatter={(value) => [`${value}%`, 'Average']} />
                        <Line type="monotone" dataKey="average" stroke="#2563eb" strokeWidth={3} dot={{ r: 4, fill: '#2563eb' }} activeDot={{ r: 6 }} />
                      </LineChart>
                    </ResponsiveContainer>
                  </div>
                ) : (
                  <div className="rounded-2xl border border-dashed border-slate-200 bg-slate-50 px-5 py-10 text-center text-sm font-semibold text-slate-500">
                    Term trend will appear after marks are published.
                  </div>
                )}
              </div>

              <div className="rounded-3xl border border-slate-100 bg-white p-5 shadow-sm sm:p-8">
                <h3 className="text-xl font-display font-bold text-slate-900">Latest Record</h3>
                {latestRecord ? (
                  <div className="mt-6 space-y-4">
                    <div className="rounded-2xl bg-slate-50 p-5">
                      <p className="text-xs font-bold uppercase tracking-[0.18em] text-slate-500">Published Term</p>
                      <p className="mt-2 text-2xl font-display font-black text-slate-900">{latestRecord.term || 'Latest Term'}</p>
                    </div>
                    <div className="rounded-2xl bg-slate-50 p-5">
                      <p className="text-xs font-bold uppercase tracking-[0.18em] text-slate-500">Updated On</p>
                      <p className="mt-2 text-base font-semibold text-slate-900">
                        {new Date(latestRecord.createdAt || Date.now()).toLocaleDateString('en-US', {
                          month: 'long',
                          day: 'numeric',
                          year: 'numeric'
                        })}
                      </p>
                    </div>
                    <div className="rounded-2xl bg-slate-50 p-5">
                      <p className="text-xs font-bold uppercase tracking-[0.18em] text-slate-500">Student</p>
                      <p className="mt-2 text-base font-semibold text-slate-900">{data.student?.name || 'Student Name'}</p>
                      <p className="mt-1 text-sm text-slate-500">Grade {data.student?.grade || '-'} / Section {data.student?.section || '-'}</p>
                    </div>
                  </div>
                ) : (
                  <div className="mt-6 rounded-2xl border border-dashed border-slate-200 bg-slate-50 px-5 py-10 text-center text-sm font-semibold text-slate-500">
                    No academic record is available for this student yet.
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* ========== SECTION: ATTENDANCE ========== */}
        {activeSection === 'attendance' && (
          <div className="grid gap-6 xl:grid-cols-[0.85fr,1.15fr]">
            <div className="space-y-6">
              <div className="rounded-3xl border border-slate-100 bg-white p-5 shadow-sm sm:p-8">
                <div className="flex items-center gap-3 mb-6">
                  <div className="w-14 h-14 bg-blue-100 rounded-xl flex items-center justify-center">
                    <CalIcon className="text-blue-600" size={28} />
                  </div>
                  <div>
                    <h2 className="text-2xl font-display font-bold text-slate-900">Attendance Summary</h2>
                    <p className="text-sm text-slate-500 mt-1">Parents can track the student&apos;s daily attendance from here.</p>
                  </div>
                </div>

                {totalClasses > 0 ? (
                  <>
                    <div className="grid gap-4 sm:grid-cols-3">
                      <div className="rounded-2xl border border-blue-100 bg-blue-50 p-5">
                        <p className="text-xs font-bold uppercase tracking-[0.18em] text-blue-600">Attendance</p>
                        <p className="mt-2 text-3xl font-display font-black text-blue-700">{finalAttendancePercentage}%</p>
                      </div>
                      <div className="rounded-2xl border border-emerald-100 bg-emerald-50 p-5">
                        <p className="text-xs font-bold uppercase tracking-[0.18em] text-emerald-600">Present</p>
                        <p className="mt-2 text-3xl font-display font-black text-emerald-700">{presentOnlyClasses}</p>
                      </div>
                      <div className="rounded-2xl border border-amber-100 bg-amber-50 p-5">
                        <p className="text-xs font-bold uppercase tracking-[0.18em] text-amber-600">Half-Day</p>
                        <p className="mt-2 text-3xl font-display font-black text-amber-700">{halfDayClasses}</p>
                      </div>
                    </div>

                    <div className="mt-8 h-72 w-full" style={{ minHeight: '288px' }}>
                      <ResponsiveContainer width="100%" height="100%">
                        <PieChart>
                          <Pie
                            data={attendanceChartData}
                            cx="50%"
                            cy="50%"
                            innerRadius={70}
                            outerRadius={100}
                            paddingAngle={4}
                            dataKey="value"
                          >
                            {attendanceChartData.map((entry, index) => (
                              <Cell key={entry.name} fill={COLORS[index % COLORS.length]} />
                            ))}
                          </Pie>
                          <Tooltip />
                        </PieChart>
                      </ResponsiveContainer>
                    </div>

                    <div className="rounded-2xl border border-slate-100 bg-slate-50 p-5 text-sm text-slate-600">
                      Total working days tracked: <span className="font-bold text-slate-900">{totalClasses}</span>
                      <br />
                      Absent days: <span className="font-bold text-slate-900">{absentClasses}</span>
                      <br />
                      Half-day entries are counted toward the attendance percentage shown above.
                    </div>
                  </>
                ) : (
                  <div className="rounded-3xl border-2 border-dashed border-slate-200 bg-slate-50 px-6 py-12 text-center">
                    <AlertCircleIcon size={42} className="mx-auto text-slate-300" />
                    <p className="mt-4 text-base font-semibold text-slate-500">No attendance records have been published yet.</p>
                  </div>
                )}
              </div>
            </div>

            <div className="rounded-3xl border border-slate-100 bg-white p-5 shadow-sm sm:p-8">
              <div className="flex items-center justify-between gap-3 mb-6">
                <div>
                  <h3 className="text-xl font-display font-bold text-slate-900">Recent Attendance Log</h3>
                  <p className="text-sm text-slate-500 mt-1">Latest daily entries for this student.</p>
                </div>
                {totalClasses > 0 ? (
                  <span className="rounded-full bg-slate-100 px-4 py-2 text-sm font-bold text-slate-700">
                    {recentAttendance.length} recent entries
                  </span>
                ) : null}
              </div>

              {recentAttendance.length > 0 ? (
                <div className="space-y-3">
                  {recentAttendance.map(entry => {
                    const isPresent = entry.status === 'Present';
                    const isHalfDay = entry.status === 'Half-Day';
                    const statusClasses = isPresent
                      ? 'bg-emerald-100 text-emerald-700'
                      : isHalfDay
                        ? 'bg-amber-100 text-amber-700'
                        : 'bg-red-100 text-red-700';

                    return (
                      <div key={`${entry.date}-${entry.status}`} className="rounded-2xl border border-slate-100 bg-slate-50 px-5 py-4">
                        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                          <div>
                            <p className="text-base font-display font-bold text-slate-900">
                              {new Date(entry.date).toLocaleDateString('en-US', {
                                weekday: 'short',
                                month: 'short',
                                day: 'numeric',
                                year: 'numeric'
                              })}
                            </p>
                            <p className="mt-1 text-sm text-slate-500">{entry.remarks || 'No remarks added for this day.'}</p>
                          </div>
                          <span className={`inline-flex w-fit items-center gap-2 rounded-full px-3 py-1 text-sm font-bold ${statusClasses}`}>
                            {isPresent || isHalfDay ? <CheckCircle2 size={16} /> : <AlertCircle size={16} />}
                            {entry.status}
                          </span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <div className="rounded-2xl border border-dashed border-slate-200 bg-slate-50 px-5 py-10 text-center text-sm font-semibold text-slate-500">
                  Attendance log entries will appear here once the class teacher updates attendance.
                </div>
              )}
            </div>
          </div>
        )}

        {/* ========== SECTION: NLITE SKILLS ========== */}
        {activeSection === 'skills' && (
          <>
            <button 
              onClick={() => navigateToSection('dashboard')}
              className="hidden"
            >
              <ChevronLeft size={20} /> Back to Dashboard
            </button>
            <div className="rounded-3xl border border-slate-100 bg-white p-5 shadow-sm sm:p-8">
              <div className="flex items-center gap-3 mb-8">
                <div className="w-14 h-14 bg-amber-100 rounded-xl flex items-center justify-center">
                  <Sparkles className="text-amber-600" size={28} />
                </div>
                <div>
                  <h2 className="text-2xl font-display font-bold text-slate-900">Nlite 21st-Century Skills</h2>
                  <p className="text-sm text-slate-500 mt-1">Detailed student skill analysis and scores</p>
                </div>
              </div>
              
              {nliteData.length > 0 ? (
                <>
                  <div className="h-80 w-full mb-8" style={{ minHeight: '320px' }}>
                    <ResponsiveContainer width="100%" height="100%">
                      <RadarChart cx="50%" cy="50%" outerRadius="70%" data={nliteData}>
                        <PolarGrid stroke="#e2e8f0" />
                        <PolarAngleAxis dataKey="skill" tick={{ fill: '#64748b', fontSize: 11, fontWeight: 'bold' }} />
                        <PolarRadiusAxis angle={30} domain={[0, 5]} tick={false} axisLine={false} />
                        <Radar name="Student" dataKey="score" stroke="#f59e0b" fill="#fde68a" fillOpacity={0.6} />
                        <Tooltip contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }} />
                      </RadarChart>
                    </ResponsiveContainer>
                  </div>

                  <div className="grid md:grid-cols-3 gap-6">
                    {nliteData.map((skill, idx) => (
                      <div key={idx} className="bg-gradient-to-br from-amber-50 to-white rounded-2xl p-6 border border-amber-100">
                        <div className="flex items-center justify-between mb-3">
                          <h4 className="font-bold text-amber-900">{skill.skill}</h4>
                          <span className="text-2xl font-display font-black text-amber-600">{skill.score}/5</span>
                        </div>
                        <div className="w-full bg-amber-100 rounded-full h-2">
                          <div className="bg-amber-500 h-2 rounded-full" style={{ width: `${(skill.score / 5) * 100}%` }}></div>
                        </div>
                      </div>
                    ))}
                  </div>
                </>
              ) : (
                <div className="p-12 border-2 border-dashed border-slate-100 rounded-2xl text-center">
                  <Sparkles size={48} className="mx-auto text-slate-300 mb-3" />
                  <p className="text-slate-400 font-semibold">No Nlite Skill evaluations published yet.</p>
                </div>
              )}
            </div>
          </>
        )}

        {/* ========== SECTION: HOMEWORK ========== */}
        {activeSection === 'homework' && (
          <>
            <button 
              onClick={() => navigateToSection('dashboard')}
              className="hidden"
            >
              <ChevronLeft size={20} /> Back to Dashboard
            </button>
            {/* Today's Homework */}
            <div className="mb-8 rounded-3xl border border-slate-100 bg-white p-5 shadow-sm sm:p-8">
              <div className="flex items-center gap-3 mb-6">
                <div className="w-14 h-14 bg-blue-100 rounded-xl flex items-center justify-center">
                  <FileText className="text-blue-600" size={28} />
                </div>
                <div>
                  <h2 className="text-2xl font-display font-bold text-slate-900">Today's Homework & Tasks</h2>
                  <p className="text-sm text-slate-500 mt-1">{new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })}</p>
                </div>
              </div>

              {selectedHomeworkSubject && (
                <div className="mb-6 rounded-3xl border border-blue-100 bg-blue-50/70 p-6">
                  <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                    <div>
                      <p className="text-xs font-semibold uppercase tracking-[0.18em] text-blue-600">Homework Detail</p>
                      <h3 className="mt-2 text-2xl font-display font-bold text-slate-900">{selectedHomeworkSubject}</h3>
                      <p className="mt-2 text-sm text-slate-500">Recent homework history and subject tasks for this section.</p>
                    </div>
                    <button
                      type="button"
                      onClick={() => navigate('/parent/homework')}
                      className="inline-flex items-center gap-2 rounded-xl border border-blue-200 bg-white px-4 py-2 text-sm font-semibold text-blue-700 transition hover:bg-blue-100 active:scale-95"
                    >
                      <ChevronLeft size={16} />
                      All Homework
                    </button>
                  </div>

                  <div className="mt-5">
                    {historyLoading ? (
                      <div className="rounded-2xl border border-dashed border-blue-200 bg-white px-4 py-8 text-center text-sm font-semibold text-slate-500">
                        Loading subject details...
                      </div>
                    ) : historyData.length > 0 ? (
                      <div className="space-y-3">
                        {historyData.map(item => (
                          <div key={item._id} className="rounded-2xl border border-white bg-white px-4 py-4 shadow-sm">
                            <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
                              <div>
                                <h4 className="text-base font-display font-bold text-slate-900">{item.title}</h4>
                                <p className="mt-1 text-sm leading-6 text-slate-600">{item.description}</p>
                              </div>
                              <div className="shrink-0 rounded-full bg-blue-100 px-3 py-1 text-xs font-bold text-blue-700">
                                Due {new Date(item.dueDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="rounded-2xl border border-dashed border-blue-200 bg-white px-4 py-8 text-center text-sm font-semibold text-slate-500">
                        No homework history available for this subject yet.
                      </div>
                    )}
                  </div>
                </div>
              )}

              {data.homework?.length > 0 ? (() => {
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
                        <div
                          key={subject}
                          role="button"
                          tabIndex={0}
                          onClick={() => handleOpenHomework(subject)}
                          onKeyDown={(event) => handleHomeworkCardKeyDown(event, subject)}
                          className={`${color.bg} border ${color.border} group cursor-pointer overflow-hidden rounded-2xl transition hover:-translate-y-0.5 hover:shadow-md active:scale-[0.98]`}
                        >
                          <div className="flex w-full items-center justify-between border-b border-inherit px-5 py-3 transition-colors group-hover:bg-white/60">
                            <div className="flex items-center gap-2.5">
                              <span className={`w-2.5 h-2.5 rounded-full ${color.dot}`}></span>
                              <span className={`text-sm font-bold ${color.header.split(' ')[1]}`}>{subject}</span>
                            </div>
                            <div className="flex items-center gap-2">
                              <span className={`${color.header} text-[10px] font-bold px-2.5 py-0.5 rounded-full`}>
                                {hwList.length} Task{hwList.length > 1 ? 's' : ''}
                              </span>
                              <span className="ml-1 flex items-center gap-1 whitespace-nowrap text-[9px] font-bold text-slate-400 opacity-0 transition-opacity group-hover:opacity-100">
                                Open <ArrowRight size={12} />
                              </span>
                            </div>
                          </div>
                          <div className="divide-y divide-white/80">
                            {hwList.map(hw => (
                              <div key={hw._id} className="px-5 py-4 text-left transition-colors group-hover:bg-white/40">
                                <div className="flex justify-between items-start mb-1.5">
                                  <h4 className="font-display font-bold text-slate-900 text-base group-hover:text-blue-700 transition-colors">{hw.title}</h4>
                                  <span className="text-[11px] font-bold text-red-500 shrink-0 ml-3 mt-0.5">
                                    Due: {new Date(hw.dueDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                                  </span>
                                </div>
                                <p className="text-sm text-slate-600 leading-relaxed">{hw.description}</p>
                              </div>
                            ))}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                );
              })() : (
                <div className="p-8 border-2 border-dashed border-slate-100 rounded-2xl text-center">
                  <BookOpen size={48} className="mx-auto text-slate-300 mb-3" />
                  <p className="text-slate-400 font-semibold text-lg">No homework assigned for today.</p>
                </div>
              )}
            </div>

            {/* Weekly Homework Overview */}
            <div className="bg-white rounded-3xl p-5 sm:p-6 lg:p-8 shadow-sm border border-slate-100">
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between mb-6 gap-4">
                <div className="flex items-center gap-3">
                  <div className="w-14 h-14 bg-emerald-100 rounded-xl flex items-center justify-center">
                    <BookOpen className="text-emerald-600" size={28} />
                  </div>
                  <div>
                    <h3 className="text-xl font-display font-bold text-slate-900">Weekly Homework Overview</h3>
                    <p className="text-sm text-slate-500 mt-1">View assignments by day</p>
                  </div>
                </div>
                <div className="flex w-full items-center justify-between gap-2 bg-slate-50 rounded-xl p-1 border border-slate-200 sm:w-auto">
                  <button onClick={prevWeek} className="p-1.5 hover:bg-white rounded-lg transition-colors"><ChevronLeft size={18} className="text-slate-600" /></button>
                  <span className="text-sm font-bold text-slate-700 text-center min-w-0 flex-1 px-2">
                    {days[0].toLocaleDateString('en-US', { month: 'short', day: 'numeric' })} - {days[6].toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                  </span>
                  <button onClick={nextWeek} className="p-1.5 hover:bg-white rounded-lg transition-colors"><ChevronRight size={18} className="text-slate-600" /></button>
                </div>
              </div>

              <div className="-mx-4 overflow-x-auto overflow-y-hidden px-4 pb-4 sm:mx-0 sm:px-0">
                <div className="grid grid-flow-col auto-cols-[minmax(250px,86vw)] gap-4 snap-x snap-mandatory md:auto-cols-[minmax(280px,320px)] xl:grid-flow-row xl:grid-cols-7 xl:auto-cols-fr">
                  {days.map((day, i) => {
                    const dayHomework = weeklyHomework.filter(hw => isSameDay(hw.dueDate, day));
                    const isToday = isSameDay(day, new Date());
                    const isFlipped = flippedDay === i;
                    const grouped = groupBySubject(dayHomework);
                    const subjectKeys = Object.keys(grouped);

                    return (
                      <div 
                        key={i} 
                        className="relative perspective-1000 h-[280px] sm:h-[320px] w-full group cursor-pointer snap-start"
                        onMouseEnter={() => setFlippedDay(i)}
                        onMouseLeave={() => setFlippedDay(null)}
                        onClick={() => setFlippedDay(isFlipped ? null : i)}
                      >
                        <div className={`w-full h-full relative transition-transform duration-700 transform-style-3d ${isFlipped ? 'rotate-y-180' : 'md:group-hover:[transform:rotateY(180deg)]'}`}>
                          <div className={`absolute w-full h-full backface-hidden rounded-[24px] border flex flex-col justify-center items-center p-4 cursor-pointer shadow-sm transition-colors ${isToday ? 'border-emerald-300 bg-emerald-50' : 'border-slate-100 bg-slate-50'}`}>
                            <p className={`text-xs font-bold uppercase tracking-widest mb-2 ${isToday ? 'text-emerald-600' : 'text-slate-500'}`}>
                              {day.toLocaleDateString('en-US', { weekday: 'short' })}
                            </p>
                            <p className={`text-5xl font-display font-black mb-3 ${isToday ? 'text-emerald-900' : 'text-slate-800'}`}>
                              {day.getDate()}
                            </p>
                            
                            {subjectKeys.length > 0 ? (
                              <div className="flex flex-col items-center gap-2 w-full px-2">
                                <div className="bg-white border border-emerald-100 text-emerald-700 px-3 py-1 rounded-full text-xs font-bold shadow-sm">
                                  {dayHomework.length} Task{dayHomework.length > 1 ? 's' : ''}
                                </div>
                              </div>
                            ) : (
                              <div className="text-slate-400 text-xs font-semibold border border-slate-200 px-3 py-1 rounded-full">
                                No Tasks
                              </div>
                            )}
                          </div>

                          <div className={`absolute w-full h-full backface-hidden rotate-y-180 rounded-[24px] border flex flex-col overflow-hidden bg-slate-900 border-slate-800 shadow-xl p-3`}>
                            <div className="text-emerald-400 font-bold text-[9px] tracking-wider uppercase mb-2 text-center">
                              {day.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })}
                            </div>
                            <div className="flex-1 flex flex-col gap-1.5 overflow-y-auto text-[10px]">
                              {subjectKeys.length > 0 ? subjectKeys.map(subject => (
                                <button
                                  key={subject}
                                  type="button"
                                  onClick={(event) => {
                                    event.stopPropagation();
                                    handleOpenHomework(subject);
                                  }}
                                  className="rounded bg-slate-800/50 p-2 text-left text-slate-200 transition hover:bg-slate-700/80 hover:shadow-md active:scale-95"
                                >
                                  <div className="font-bold text-emerald-300 mb-0.5">{subject}</div>
                                  {grouped[subject].map(hw => (
                                    <div key={hw._id} className="text-[9px] text-slate-300 line-clamp-1">{hw.title}</div>
                                  ))}
                                </button>
                              )) : (
                                <div className="flex flex-col items-center justify-center h-full text-slate-500 text-center">
                                  <span className="text-[9px]">No Tasks</span>
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
            </div>
          </>
        )}

        {/* ========== SECTION: EVENTS ========== */}
        {activeSection === 'events' && (
          <>
            <button 
              onClick={() => navigateToSection('dashboard')}
              className="hidden"
            >
              <ChevronLeft size={20} /> Back to Dashboard
            </button>
            <ParentEventsSection />
          </>
        )}

        {/* ========== SECTION: POLLS ========== */}
        {activeSection === 'polls' && (
          <>
            <button 
              onClick={() => navigateToSection('dashboard')}
              className="hidden"
            >
              <ChevronLeft size={20} /> Back to Dashboard
            </button>
            <ParentPollsSection />
          </>
        )}

        {/* ========== SECTION: FEEDBACK ========== */}
        {activeSection === 'feedback' && (
          <>
            <button 
              onClick={() => navigateToSection('dashboard')}
              className="hidden"
            >
              <ChevronLeft size={20} /> Back to Dashboard
            </button>
            <ParentFeedbackSection />
          </>
        )}

        {/* ========== SECTION: MEMORIES ========== */}
        {activeSection === 'memories' && (
          <>
            <button
              onClick={() => navigateToSection('dashboard')}
              className="hidden"
            >
              <ChevronLeft size={20} /> Back to Dashboard
            </button>
            <MemoriesSection role="parent" />
          </>
        )}

        {/* ========== SECTION: FEES ========== */}
        {activeSection === 'fees' && (
          <>
            <button 
              onClick={() => navigateToSection('dashboard')}
              className="hidden"
            >
              <ChevronLeft size={20} /> Back to Dashboard
            </button>
            <div className="rounded-3xl border border-slate-100 bg-white p-5 shadow-sm sm:p-8">
              <div className="flex items-center gap-3 mb-8">
                <div className="w-14 h-14 bg-emerald-100 rounded-xl flex items-center justify-center">
                  <CreditCard className="text-emerald-600" size={28} />
                </div>
                <div>
                  <h2 className="text-2xl font-display font-bold text-slate-900">Fee Payment</h2>
                  <p className="text-sm text-slate-500 mt-1">Manage and pay your fees securely</p>
                </div>
              </div>

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

              <h4 className="text-sm font-bold text-slate-700 uppercase tracking-widest mb-4">Term-wise Breakdown</h4>

              <div className="space-y-4 md:hidden">
                {feeRows.map((row) => (
                  <div key={row.id} className="rounded-2xl border border-slate-100 bg-slate-50 p-5">
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <h5 className="text-base font-display font-bold text-slate-900">{row.term}</h5>
                        <p className="mt-1 text-sm text-slate-500">{row.desc}</p>
                      </div>
                      <span className={`rounded-full px-3 py-1 text-xs font-bold ${row.status === 'Paid' ? 'bg-emerald-100 text-emerald-700' : 'bg-amber-100 text-amber-700'}`}>
                        {row.status}
                      </span>
                    </div>
                    <div className="mt-4 grid grid-cols-2 gap-3 text-sm">
                      <div className="rounded-xl bg-white p-3">
                        <p className="text-xs font-bold uppercase tracking-[0.16em] text-slate-500">Total</p>
                        <p className="mt-2 font-bold text-slate-900">Rs. {row.amount.toLocaleString()}</p>
                      </div>
                      <div className="rounded-xl bg-white p-3">
                        <p className="text-xs font-bold uppercase tracking-[0.16em] text-slate-500">Paid</p>
                        <p className="mt-2 font-bold text-emerald-700">Rs. {row.paid.toLocaleString()}</p>
                      </div>
                    </div>
                    <div className="mt-3 rounded-xl bg-white p-3">
                      <p className="text-xs font-bold uppercase tracking-[0.16em] text-slate-500">Balance Due</p>
                      <p className="mt-2 font-bold text-red-500">Rs. {(row.amount - row.paid).toLocaleString()}</p>
                    </div>
                    <div className="mt-4">
                      {row.status === 'Paid' ? (
                        <span className="flex items-center justify-center gap-1 text-emerald-600 font-bold text-xs bg-emerald-100 px-3 py-2 rounded-full w-full">
                          <CheckCheck size={14} /> Paid
                        </span>
                      ) : data.settings?.isOnlineFeeEnabled ? (
                        <button onClick={() => { setSelectedTerm({ id: row.id, name: row.term, amount: row.amount, balance: row.amount - row.paid }); setShowPayModal(true); }} className="w-full py-2 font-bold text-sm bg-emerald-100 text-emerald-700 hover:bg-emerald-600 hover:text-white rounded-xl transition-colors">
                          Pay Now
                        </button>
                      ) : (
                        <span className="flex items-center justify-center gap-1 text-slate-500 font-bold text-xs bg-slate-100 px-3 py-2 rounded-full w-full">
                          Pay at Office
                        </span>
                      )}
                    </div>
                  </div>
                ))}
              </div>

              <div className="hidden overflow-x-auto rounded-2xl border border-slate-100 md:block">
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
                    {feeRows.map((row) => (
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
                              <button onClick={() => { setSelectedTerm({ id: row.id, name: row.term, amount: row.amount, balance: row.amount - row.paid }); setShowPayModal(true); }} className="w-full py-1.5 font-bold text-[11px] bg-emerald-100 text-emerald-700 hover:bg-emerald-600 hover:text-white rounded-lg transition-colors">
                                Pay Now
                              </button>
                            ) : (
                              <span className="flex items-center justify-center gap-1 text-slate-500 font-bold text-[11px] bg-slate-100 px-3 py-1.5 rounded-full w-full">
                                Pay at Office
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
          </>
        )}

        {/* ========== PAY MODAL ========== */}
        {showPayModal && (
          <div className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto bg-slate-900/60 p-3 backdrop-blur-sm sm:items-center sm:p-4">
            <div className="mx-auto my-3 w-full max-w-md rounded-3xl bg-white p-5 shadow-2xl sm:my-8 sm:p-8">
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-xl font-display font-bold text-slate-900">Complete Payment</h3>
                <button onClick={() => setShowPayModal(false)} className="text-slate-400 hover:text-slate-700 transition-colors">✕</button>
              </div>
              <div className="bg-slate-50 rounded-2xl p-5 mb-6">
                <p className="text-sm text-slate-500 mb-1">Paying for</p>
                <p className="font-bold text-slate-900 text-lg">{selectedTerm.name}</p>
                <p className="text-xs text-slate-400 mt-1 uppercase tracking-wider font-bold">Total Remaining Balance</p>
                <p className="text-3xl font-display font-extrabold text-emerald-700 mt-1">₹{selectedTerm.balance?.toLocaleString()}</p>
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
                  className="w-full px-4 py-3 bg-white border border-slate-200 rounded-xl focus:ring-2 focus:ring-emerald-500 outline-none font-bold text-slate-800"
                />
                <p className="text-xs text-slate-400 mt-2 italic">You can pay partially or the full balance.</p>
              </div>

              <button disabled={processing} onClick={handlePayment} className="w-full py-4 text-center bg-emerald-600 text-white font-bold rounded-xl hover:bg-emerald-700 transition-colors shadow-lg shadow-emerald-600/20 disabled:opacity-50">
                {processing ? 'Processing...' : 'Approve & Pay Now'}
              </button>
            </div>
          </div>
        )}

      </div>
    </div>
  );
}
