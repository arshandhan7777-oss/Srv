import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { Users, LogOut, CheckSquare, BookOpen, AlertCircle, ChevronLeft, ChevronRight, Calendar as CalIcon, Clock, Edit2, Trash2, CalendarClock, X, Check, History, ArrowRight, Archive, ChevronDown, Megaphone, Bell, LayoutDashboard, ClipboardList, MessageSquareMore } from 'lucide-react';
import API_URL from '../config/api.js';
import { OpinionPollSection } from '../components/OpinionPollSection.js';
import { FeedbackInboxSection } from '../components/FeedbackInboxSection.js';
import { UpcomingEventsSection } from '../components/UpcomingEventsSection.js';
import { Logo } from '../components/Logo.js';
import { PortalHeader } from '../components/PortalHeader.js';
import { NotificationPanel } from '../components/NotificationPanel.js';

export function FacultyDashboard({ section = 'dashboard' }) {
  const hasValidFamilyDetails = (profile) => Boolean(
    (profile.motherName?.trim() && profile.fatherName?.trim()) ||
    profile.guardianName?.trim()
  );

  const getFamilySummary = (student) => {
    if (student.motherName && student.fatherName) {
      return `Mother: ${student.motherName} | Father: ${student.fatherName}`;
    }

    if (student.guardianName) {
      return `Guardian: ${student.guardianName}`;
    }

    return 'Family details missing';
  };

  const isSeniorGrade = (grade) => ['11', '12', 'XI', 'XII'].includes((grade || '').toUpperCase().trim());

  const [students, setStudents] = useState([]);
  const [selectedStudent, setSelectedStudent] = useState(null);
  const [editingStudentProfile, setEditingStudentProfile] = useState(null);
  const [studentProfileForm, setStudentProfileForm] = useState({ name: '', grade: '', section: '', group: '', motherName: '', fatherName: '', guardianName: '' });
  const [profileMsg, setProfileMsg] = useState({ text: '', type: '' });
  const [assignedHomework, setAssignedHomework] = useState([]);
  
  // Grading Form State
  const [gradeForm, setGradeForm] = useState({
    term: 'Term 1',
    marks: { english: 0, tamil: 0, hindi: 0, math: 0, science: 0, socialScience: 0 },
    totalWorkingDays: 100,
    daysPresent: 100,
    performanceRemarks: '',
    behaviour: 'Good',
    nliteSkills: { communication: 5, teamwork: 5, lifelongLearning: 5, positiveAttitude: 5, holisticWellbeing: 5, languageProficiency: 5 }
  });
  const [gradeMsg, setGradeMsg] = useState({ text: '', type: '' });

  // Homework Form State
  const [hwForm, setHwForm] = useState({ subject: '', title: '', description: '', dueDate: '' });
  const [hwMsg, setHwMsg] = useState({ text: '', type: '' });

  // Homework Calendar State
  const [currentWeekStart, setCurrentWeekStart] = useState(() => {
    const d = new Date();
    d.setHours(0, 0, 0, 0);
    const day = d.getDay();
    const diff = d.getDate() - day + (day === 0 ? -6 : 1);
    return new Date(d.setDate(diff));
  });
  const [flippedDay, setFlippedDay] = useState(null);
  const [editingHw, setEditingHw] = useState(null);
  const [extendingHw, setExtendingHw] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [historySubject, setHistorySubject] = useState(null);
  const [historyData, setHistoryData] = useState([]);
  const [historyLoading, setHistoryLoading] = useState(false);

  // Attendance Form State
  const [showAttModal, setShowAttModal] = useState(false);
  const [attDate, setAttDate] = useState(new Date().toISOString().split('T')[0]);
  const [attRecords, setAttRecords] = useState({});
  const [attMsg, setAttMsg] = useState({ text: '', type: '' });
  
  // Announcements
  const [announcementForm, setAnnouncementForm] = useState({ title: '', message: '', priority: 'MEDIUM', toAllStudents: true });
  const [announcements, setAnnouncements] = useState([]);
  const [announcementMsg, setAnnouncementMsg] = useState({ text: '', type: '' });
  const [selectedAnnouncementStudents, setSelectedAnnouncementStudents] = useState([]);
  const [inboxAnnouncements, setInboxAnnouncements] = useState([]);
  const [showNotifications, setShowNotifications] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);
  
  const openAttendanceModal = () => {
    const initialRecords = {};
    students.forEach(s => {
      initialRecords[s._id] = 'Present';
    });
    setAttRecords(initialRecords);
    setShowAttModal(true);
    setAttMsg({ text: '', type: '' });
  };

  // Behavior Form State
  const [showBhvModal, setShowBhvModal] = useState(false);
  const [bhvDate, setBhvDate] = useState(new Date().toISOString().split('T')[0]);
  const [bhvRecords, setBhvRecords] = useState({});
  const [bhvMsg, setBhvMsg] = useState({ text: '', type: '' });

  const openBehaviorModal = () => {
    const initialRecords = {};
    students.forEach(s => {
      initialRecords[s._id] = { score: 10, remarks: '' };
    });
    setBhvRecords(initialRecords);
    setShowBhvModal(true);
    setBhvMsg({ text: '', type: '' });
  };

  const submitAttendance = async (e) => {
    e.preventDefault();
    try {
      const recordsArray = Object.keys(attRecords).map(studentId => ({
        studentId, status: attRecords[studentId], remarks: ''
      }));
      const token = localStorage.getItem('schoolToken');
      await axios.post(`${API_URL}/api/faculty/attendance`, {
        date: attDate,
        records: recordsArray
      }, { headers: { Authorization: `Bearer ${token}` } });
      setAttMsg({ text: 'Daily attendance successfully saved!', type: 'success' });
      setTimeout(() => setShowAttModal(false), 2000);
    } catch (err) {
      setAttMsg({ text: 'Error saving attendance.', type: 'error' });
    }
  };

  const submitBehavior = async (e) => {
    e.preventDefault();
    try {
      const recordsArray = Object.keys(bhvRecords).map(studentId => ({
        studentId,
        score: bhvRecords[studentId].score,
        remarks: bhvRecords[studentId].remarks
      }));
      const token = localStorage.getItem('schoolToken');
      await axios.post(`${API_URL}/api/faculty/behavior`, {
        date: bhvDate,
        records: recordsArray
      }, { headers: { Authorization: `Bearer ${token}` } });
      setBhvMsg({ text: 'Behavior logs successfully saved!', type: 'success' });
      setTimeout(() => setShowBhvModal(false), 2000);
    } catch (err) {
      setBhvMsg({ text: 'Error saving behavior logs.', type: 'error' });
    }
  };

  const navigate = useNavigate();
  const user = JSON.parse(localStorage.getItem('schoolUser') || '{}');
  const activeSection = section || 'dashboard';

  const pageMeta = {
    dashboard: {
      title: 'Faculty Dashboard',
      description: 'A clean overview with quick mobile access to all teaching tools.'
    },
    homework: {
      title: 'Homework Center',
      description: 'Assign homework and manage the daily homework dashboard.'
    },
    attendance: {
      title: 'Attendance',
      description: 'Mark daily attendance for your students.'
    },
    behavior: {
      title: 'Daily Behavior',
      description: 'Log daily behavior scores and remarks for students.'
    },
    announcements: {
      title: 'Announcements',
      description: 'Send announcements to all students or selected students.'
    },
    events: {
      title: 'Events',
      description: 'Open upcoming events and event acknowledgements.'
    },
    polls: {
      title: 'Poll Center',
      description: 'Create opinion polls and review poll analytics.'
    },
    feedback: {
      title: 'Feedback Inbox',
      description: 'Review parent feedback in a focused inbox.'
    }
  };

  const navigateToSection = (targetSection) => {
    navigate(targetSection === 'dashboard' ? '/faculty/dashboard' : `/faculty/${targetSection}`);
  };

  // Calendar Helper Functions
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

  const isUpcomingDeadline = (date) => {
    const d = new Date(date).setHours(0,0,0,0);
    const today = new Date().setHours(0,0,0,0);
    return d >= today && d <= today + 2 * 24 * 60 * 60 * 1000;
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

  useEffect(() => {
    // Auth is handled by ProtectedRoute — just fetch data
    const token = localStorage.getItem('schoolToken');
    fetchStudents(token);

    fetchHomework();
    fetchAnnouncements(token);
    fetchInboxAnnouncements(token);
  }, [section, user.role]);

  const fetchStudents = (token) => {
    axios.get(`${API_URL}/api/faculty/students`, {
      headers: { Authorization: `Bearer ${token}` }
    }).then(res => setStudents(res.data)).catch(console.error);
  };

  const fetchHomework = async () => {
    try {
      const token = localStorage.getItem('schoolToken');
      const res = await axios.get(`${API_URL}/api/faculty/homework`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setAssignedHomework(res.data);
    } catch (err) {
      console.error('Error fetching homework', err);
    }
  };

  const fetchAnnouncements = (token) => {
    axios.get(`${API_URL}/api/faculty/announcements`, {
      headers: { Authorization: `Bearer ${token}` }
    }).then(res => setAnnouncements(res.data)).catch(console.error);
  };

  const fetchInboxAnnouncements = (token) => {
    axios.get(`${API_URL}/api/faculty/announcements/inbox/all`, {
      headers: { Authorization: `Bearer ${token}` }
    }).then(res => {
      setInboxAnnouncements(res.data);
      setUnreadCount(res.data.length);
    }).catch(console.error);
  };

  const dismissInboxAnnouncement = async (announcementId) => {
    try {
      const token = localStorage.getItem('schoolToken');
      await axios.post(
        `${API_URL}/api/faculty/announcements/${announcementId}/dismiss`,
        {},
        { headers: { Authorization: `Bearer ${token}` } }
      );
      // Remove from local state
      const updated = inboxAnnouncements.filter(ann => ann._id !== announcementId);
      setInboxAnnouncements(updated);
      setUnreadCount(updated.length);
    } catch (err) {
      console.error('Error dismissing announcement:', err);
    }
  };

  const submitAnnouncement = async (e) => {
    e.preventDefault();
    if (!announcementForm.title.trim() || !announcementForm.message.trim()) {
      setAnnouncementMsg({ text: 'Title and message are required', type: 'error' });
      return;
    }

    if (!announcementForm.toAllStudents && selectedAnnouncementStudents.length === 0) {
      setAnnouncementMsg({ text: 'Select at least one student', type: 'error' });
      return;
    }

    try {
      const token = localStorage.getItem('schoolToken');
      const payload = {
        ...announcementForm,
        selectedStudentIds: !announcementForm.toAllStudents ? selectedAnnouncementStudents : []
      };
      await axios.post(`${API_URL}/api/faculty/announcements`, payload, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setAnnouncementMsg({ text: 'Announcement sent to students!', type: 'success' });
      setAnnouncementForm({ title: '', message: '', priority: 'MEDIUM', toAllStudents: true });
      setSelectedAnnouncementStudents([]);
      fetchAnnouncements(token);
    } catch (err) {
      setAnnouncementMsg({ text: 'Error sending announcement', type: 'error' });
    }
  };

  const deleteAnnouncement = async (id) => {
    try {
      const token = localStorage.getItem('schoolToken');
      await axios.delete(`${API_URL}/api/faculty/announcements/${id}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      fetchAnnouncements(token);
    } catch (err) {
      console.error('Error deleting announcement', err);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('schoolToken');
    localStorage.removeItem('schoolUser');
    navigate('/login');
  };

  const openStudentProfileEditor = (student) => {
    setEditingStudentProfile(student);
    setStudentProfileForm({
      name: student.name,
      grade: student.grade,
      section: student.section,
      group: student.group || '',
      motherName: student.motherName || '',
      fatherName: student.fatherName || '',
      guardianName: student.guardianName || ''
    });
    setProfileMsg({ text: '', type: '' });
  };

  const closeStudentProfileEditor = () => {
    setEditingStudentProfile(null);
    setProfileMsg({ text: '', type: '' });
  };

  const closeStudentEvaluation = () => {
    setSelectedStudent(null);
    setGradeMsg({ text: '', type: '' });
  };

  const saveStudentProfile = async (e) => {
    e.preventDefault();

    if (!hasValidFamilyDetails(studentProfileForm)) {
      setProfileMsg({ text: 'Enter both mother and father names, or provide a guardian name.', type: 'error' });
      return;
    }

    try {
      const token = localStorage.getItem('schoolToken');
      const res = await axios.put(`${API_URL}/api/faculty/student/${editingStudentProfile._id}`, studentProfileForm, {
        headers: { Authorization: `Bearer ${token}` }
      });

      setStudents(prev => prev.map(student => (
        student._id === editingStudentProfile._id ? res.data.student : student
      )));
      setEditingStudentProfile(res.data.student);
      setSelectedStudent(prev => (
        prev && prev._id === res.data.student._id ? { ...prev, ...res.data.student } : prev
      ));
      setProfileMsg({ text: 'Student profile updated successfully.', type: 'success' });
      fetchStudents(token);
    } catch (err) {
      setProfileMsg({ text: err.response?.data?.message || 'Failed to update student profile.', type: 'error' });
    }
  };

  const submitGrades = async (e) => {
    e.preventDefault();
    try {
      const token = localStorage.getItem('schoolToken');
      await axios.post(`${API_URL}/api/faculty/marks`, {
        studentId: selectedStudent._id,
        ...gradeForm
      }, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setGradeMsg({ text: 'Academic and Nlite skills saved successfully!', type: 'success' });
      setTimeout(() => setSelectedStudent(null), 2000);
    } catch (err) {
      setGradeMsg({ text: 'Failed to save evaluate student', type: 'error' });
    }
  };

  const submitHomework = async (e) => {
    e.preventDefault();
    try {
      const token = localStorage.getItem('schoolToken');
      await axios.post(`${API_URL}/api/faculty/homework`, {
        grade: user.assignedGrade,
        section: user.assignedSection,
        ...hwForm
      }, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setHwMsg({ text: 'Homework published successfully!', type: 'success' });
      setHwForm({ subject: '', title: '', description: '', dueDate: '' });
      fetchHomework(); // Update the UI immediately
      setTimeout(() => setHwMsg({ text: '', type: '' }), 3000);
    } catch (err) {
      setHwMsg({ text: 'Failed to publish homework', type: 'error' });
    }
  };

  // Fetch subject history
  const openSubjectHistory = async (subject) => {
    setHistorySubject(subject);
    setHistoryLoading(true);
    try {
      const token = localStorage.getItem('schoolToken');
      const res = await axios.get(`${API_URL}/api/faculty/homework/history/${encodeURIComponent(subject)}`, {
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

  // Delete/Archive homework
  const handleDelete = async (id) => {
    if (!window.confirm("Are you sure you want to archive this homework?")) return;
    try {
      const token = localStorage.getItem('schoolToken');
      await axios.delete(`${API_URL}/api/faculty/homework/${id}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      fetchHomework();
    } catch (err) {
      console.error(err);
      alert('Error archiving homework');
    }
  };

  // Update homework
  const handleUpdate = async (id, updatedData) => {
    setIsSubmitting(true);
    try {
      const token = localStorage.getItem('schoolToken');
      await axios.put(`${API_URL}/api/faculty/homework/${id}`, updatedData, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setEditingHw(null);
      setExtendingHw(null);
      fetchHomework();
    } catch (err) {
      console.error(err);
      alert('Error updating homework');
    } finally {
      setIsSubmitting(false);
    }
  };

  const upcomingHomeworkCount = assignedHomework.filter(hw => isUpcomingDeadline(hw.dueDate)).length;
  const overdueHomeworkCount = assignedHomework.filter(hw => isPastDeadline(hw.dueDate)).length;
  const recentAnnouncementCount = announcements.length;

  const appPages = [
    { key: 'homework', title: 'Assign Homework', subtitle: 'Assign Homework, Daily Homework Dashboard', icon: BookOpen, badge: assignedHomework.length, gradient: 'from-amber-500 to-orange-500' },
    { key: 'attendance', title: 'Attendance', subtitle: 'Mark Attendance', icon: CheckSquare, badge: students.length, gradient: 'from-emerald-500 to-teal-500' },
    { key: 'behavior', title: 'Log Behavior', subtitle: 'Log Daily Behavior', icon: AlertCircle, badge: 'Daily', gradient: 'from-rose-500 to-orange-500' },
    { key: 'announcements', title: 'Announcement', subtitle: 'Send Announcement', icon: Megaphone, badge: recentAnnouncementCount, gradient: 'from-blue-500 to-cyan-500' },
    { key: 'events', title: 'Events', subtitle: 'Upcoming Events, Event Acknowledgements', icon: CalIcon, badge: 'Live', gradient: 'from-fuchsia-500 to-pink-500' },
    { key: 'polls', title: 'Poll Center', subtitle: 'Opinion Poll Center, Poll Analytics', icon: ClipboardList, badge: 'Polls', gradient: 'from-violet-500 to-indigo-500' },
    { key: 'feedback', title: 'Feedback', subtitle: 'Parent Feedback Inbox', icon: MessageSquareMore, badge: unreadCount, gradient: 'from-slate-700 to-slate-900' }
  ];

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
      <NotificationPanel open={showNotifications} onClose={() => setShowNotifications(false)} title="Faculty Announcements" subtitle={`${inboxAnnouncements.length} total`}>
        {inboxAnnouncements.length > 0 ? (
          <div className="divide-y divide-slate-100">
            {inboxAnnouncements.map(ann => (
              <div key={ann._id} className={`p-4 transition-colors hover:bg-slate-50 ${ann.priority === 'HIGH' ? 'border-l-4 border-l-red-500' : 'border-l-4 border-l-slate-200'}`}>
                <div className="mb-1 flex items-start justify-between gap-2">
                  <h4 className="line-clamp-2 text-sm font-bold text-slate-900">{ann.title}</h4>
                  <div className="flex flex-shrink-0 items-center gap-2">
                    {ann.priority === 'HIGH' ? <span className="whitespace-nowrap rounded-full bg-red-100 px-2 py-0.5 text-[10px] font-bold text-red-700">URGENT</span> : null}
                    <button type="button" onClick={() => dismissInboxAnnouncement(ann._id)} className="rounded p-0.5 text-slate-400 transition-colors hover:text-slate-600 active:scale-95" title="Dismiss">
                      <X size={16} />
                    </button>
                  </div>
                </div>
                <p className="mb-2 text-xs text-slate-600">{ann.message}</p>
                <div className="flex items-center justify-between text-[11px]">
                  <span className="text-slate-500">{ann.createdBy?.name || 'Admin'}</span>
                  <span className="text-slate-400">{new Date(ann.createdAt).toLocaleDateString()}</span>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="p-8 text-center text-slate-400">
            <p className="text-sm font-semibold">No faculty announcements yet</p>
          </div>
        )}
      </NotificationPanel>
    </div>
  );

  const renderDashboardHome = () => (
    <div className="min-h-screen bg-slate-100">
      <div className="sticky top-0 z-30 border-b border-slate-200 bg-white/95 backdrop-blur">
        <div className="mx-auto flex max-w-7xl items-center justify-between gap-4 px-4 py-4 sm:px-6 lg:px-8">
          <div className="flex items-center gap-4">
            <Logo />
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">SRV School</p>
              <h1 className="text-lg font-display font-bold text-slate-900">Faculty Dashboard</h1>
              <p className="text-xs text-slate-500">Class {user.assignedGrade}-{user.assignedSection} · {user.name}</p>
            </div>
          </div>

          <button onClick={handleLogout} className="inline-flex items-center gap-2 rounded-xl bg-slate-900 px-4 py-2 text-sm font-semibold text-white transition hover:bg-slate-800">
            <LogOut size={16} />
            <span className="hidden sm:inline">Logout</span>
          </button>
        </div>
      </div>

      <main className="mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:px-8 lg:py-8">
        <div className="space-y-8">
          <section className="overflow-hidden rounded-[2rem] bg-gradient-to-br from-slate-950 via-slate-900 to-emerald-700 p-6 text-white shadow-xl shadow-slate-900/10 sm:p-8">
            <div className="grid gap-6 lg:grid-cols-[1.35fr,0.85fr]">
              <div>
                <div className="inline-flex items-center gap-2 rounded-full bg-white/10 px-3 py-1 text-xs font-semibold uppercase tracking-[0.2em] text-emerald-100">
                  <LayoutDashboard size={14} />
                  Faculty Overview
                </div>
                <h2 className="mt-4 max-w-2xl text-3xl font-display font-bold leading-tight sm:text-4xl">
                  Teaching tools organized for quick mobile access.
                </h2>
                <p className="mt-3 max-w-2xl text-sm leading-6 text-emerald-50/90 sm:text-base">
                  Open homework, attendance, behavior, announcements, events, polls, and feedback from one clean faculty home screen.
                </p>
              </div>

              <div className="rounded-[1.75rem] border border-white/15 bg-white/10 p-5 backdrop-blur">
                <p className="text-xs font-semibold uppercase tracking-[0.18em] text-emerald-100">Today</p>
                <div className="mt-4 grid grid-cols-1 gap-3">
                  <div className="rounded-2xl bg-white/10 px-4 py-3">
                    <p className="text-xs font-semibold uppercase tracking-[0.18em] text-emerald-100">Students</p>
                    <p className="mt-1 text-2xl font-display font-bold">{students.length}</p>
                  </div>
                  <div className="rounded-2xl bg-white/10 px-4 py-3">
                    <p className="text-xs font-semibold uppercase tracking-[0.18em] text-emerald-100">Upcoming Homework</p>
                    <p className="mt-1 text-2xl font-display font-bold">{upcomingHomeworkCount}</p>
                  </div>
                  <div className="rounded-2xl bg-white/10 px-4 py-3">
                    <p className="text-xs font-semibold uppercase tracking-[0.18em] text-emerald-100">Inbox Alerts</p>
                    <p className="mt-1 text-2xl font-display font-bold">{unreadCount}</p>
                  </div>
                </div>
              </div>
            </div>

            <div className="mt-8 grid grid-cols-1 gap-4 md:grid-cols-3">
              <div className="rounded-[1.5rem] border border-white/10 bg-white/10 p-4 backdrop-blur">
                <p className="text-xs font-semibold uppercase tracking-[0.16em] text-emerald-50/75">My Students</p>
                <p className="mt-2 text-3xl font-display font-bold">{students.length}</p>
              </div>
              <div className="rounded-[1.5rem] border border-white/10 bg-white/10 p-4 backdrop-blur">
                <p className="text-xs font-semibold uppercase tracking-[0.16em] text-emerald-50/75">Assigned Homework</p>
                <p className="mt-2 text-3xl font-display font-bold">{assignedHomework.length}</p>
              </div>
              <div className="rounded-[1.5rem] border border-white/10 bg-white/10 p-4 backdrop-blur">
                <p className="text-xs font-semibold uppercase tracking-[0.16em] text-emerald-50/75">Overdue Tasks</p>
                <p className="mt-2 text-3xl font-display font-bold">{overdueHomeworkCount}</p>
              </div>
            </div>
          </section>

          <section className="rounded-[2rem] border border-slate-200 bg-white p-5 shadow-sm sm:p-6">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">Faculty Apps</p>
              <h2 className="mt-1 text-2xl font-display font-bold text-slate-900">Tap an icon to open its page</h2>
              <p className="mt-1 text-sm text-slate-500">Designed for fast mobile navigation without the long faculty scrolling page.</p>
            </div>

            <div className="mt-6 grid grid-cols-2 gap-4 lg:grid-cols-4">
              {appPages.map(page => {
                const Icon = page.icon;

                return (
                  <button
                    key={page.key}
                    type="button"
                    onClick={() => navigateToSection(page.key)}
                    className="group cursor-pointer rounded-[1.75rem] border border-slate-200 bg-slate-50 p-4 text-left transition duration-200 hover:-translate-y-1 hover:border-slate-300 hover:bg-white active:scale-[0.97]"
                  >
                    <div className={`flex h-14 w-14 items-center justify-center rounded-[1.25rem] bg-gradient-to-br ${page.gradient} text-white shadow-lg shadow-slate-300/40`}>
                      <Icon size={24} />
                    </div>
                    <div className="mt-4 flex items-center justify-between gap-2">
                      <h3 className="text-base font-display font-bold text-slate-900">{page.title}</h3>
                      <span className="rounded-full bg-slate-200 px-2.5 py-1 text-[11px] font-bold text-slate-700">{page.badge}</span>
                    </div>
                    <p className="mt-2 text-sm leading-5 text-slate-500">{page.subtitle}</p>
                  </button>
                );
              })}
            </div>
          </section>
        </div>
      </main>
    </div>
  );

  const renderDashboardView = () => (
    <div className="min-h-screen bg-slate-100">
      <PortalHeader title="Faculty Dashboard" subtitle={`Class ${user.assignedGrade}-${user.assignedSection} - ${user.name}`} onLogout={handleLogout}>
        {notificationAction}
      </PortalHeader>

      <main className="mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:px-8 lg:py-8">
        <div className="space-y-8">
          <section className="overflow-hidden rounded-[2rem] bg-gradient-to-br from-slate-950 via-slate-900 to-emerald-700 p-6 text-white shadow-xl shadow-slate-900/10 sm:p-8">
            <div className="grid gap-6 lg:grid-cols-[1.35fr,0.85fr]">
              <div>
                <div className="inline-flex items-center gap-2 rounded-full bg-white/10 px-3 py-1 text-xs font-semibold uppercase tracking-[0.2em] text-emerald-100">
                  <LayoutDashboard size={14} />
                  Faculty Overview
                </div>
                <h2 className="mt-4 max-w-2xl text-3xl font-display font-bold leading-tight sm:text-4xl">
                  Teaching tools organized for quick mobile access.
                </h2>
                <p className="mt-3 max-w-2xl text-sm leading-6 text-emerald-50/90 sm:text-base">
                  Open homework, attendance, behavior, announcements, events, polls, and feedback from one clean faculty home screen.
                </p>
              </div>

              <div className="rounded-[1.75rem] border border-white/15 bg-white/10 p-5 backdrop-blur">
                <p className="text-xs font-semibold uppercase tracking-[0.18em] text-emerald-100">Today</p>
                <div className="mt-4 grid grid-cols-1 gap-3">
                  <div className="rounded-2xl bg-white/10 px-4 py-3">
                    <p className="text-xs font-semibold uppercase tracking-[0.18em] text-emerald-100">Students</p>
                    <p className="mt-1 text-2xl font-display font-bold">{students.length}</p>
                  </div>
                  <div className="rounded-2xl bg-white/10 px-4 py-3">
                    <p className="text-xs font-semibold uppercase tracking-[0.18em] text-emerald-100">Upcoming Homework</p>
                    <p className="mt-1 text-2xl font-display font-bold">{upcomingHomeworkCount}</p>
                  </div>
                  <div className="rounded-2xl bg-white/10 px-4 py-3">
                    <p className="text-xs font-semibold uppercase tracking-[0.18em] text-emerald-100">Inbox Alerts</p>
                    <p className="mt-1 text-2xl font-display font-bold">{unreadCount}</p>
                  </div>
                </div>
              </div>
            </div>

            <div className="mt-8 grid grid-cols-1 gap-4 md:grid-cols-3">
              <div className="rounded-[1.5rem] border border-white/10 bg-white/10 p-4 backdrop-blur">
                <p className="text-xs font-semibold uppercase tracking-[0.16em] text-emerald-50/75">My Students</p>
                <p className="mt-2 text-3xl font-display font-bold">{students.length}</p>
              </div>
              <div className="rounded-[1.5rem] border border-white/10 bg-white/10 p-4 backdrop-blur">
                <p className="text-xs font-semibold uppercase tracking-[0.16em] text-emerald-50/75">Assigned Homework</p>
                <p className="mt-2 text-3xl font-display font-bold">{assignedHomework.length}</p>
              </div>
              <div className="rounded-[1.5rem] border border-white/10 bg-white/10 p-4 backdrop-blur">
                <p className="text-xs font-semibold uppercase tracking-[0.16em] text-emerald-50/75">Overdue Tasks</p>
                <p className="mt-2 text-3xl font-display font-bold">{overdueHomeworkCount}</p>
              </div>
            </div>
          </section>

          <section className="rounded-[2rem] border border-slate-200 bg-white p-5 shadow-sm sm:p-6">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">Faculty Apps</p>
              <h2 className="mt-1 text-2xl font-display font-bold text-slate-900">Tap an icon to open its page</h2>
              <p className="mt-1 text-sm text-slate-500">Designed for fast mobile navigation without the long faculty scrolling page.</p>
            </div>

            <div className="mt-6 grid grid-cols-2 gap-4 lg:grid-cols-4">
              {appPages.map(page => {
                const Icon = page.icon;

                return (
                  <button
                    key={page.key}
                    type="button"
                    onClick={() => navigateToSection(page.key)}
                    className="group cursor-pointer rounded-[1.75rem] border border-slate-200 bg-slate-50 p-4 text-left transition duration-200 hover:-translate-y-1 hover:border-slate-300 hover:bg-white active:scale-[0.97]"
                  >
                    <div className={`flex h-14 w-14 items-center justify-center rounded-[1.25rem] bg-gradient-to-br ${page.gradient} text-white shadow-lg shadow-slate-300/40`}>
                      <Icon size={24} />
                    </div>
                    <div className="mt-4 flex items-center justify-between gap-2">
                      <h3 className="text-base font-display font-bold text-slate-900">{page.title}</h3>
                      <span className="rounded-full bg-slate-200 px-2.5 py-1 text-[11px] font-bold text-slate-700">{page.badge}</span>
                    </div>
                    <p className="mt-2 text-sm leading-5 text-slate-500">{page.subtitle}</p>
                  </button>
                );
              })}
            </div>
          </section>
        </div>
      </main>
    </div>
  );

  if (activeSection === 'dashboard') {
    return renderDashboardView();
  }

  return (
    <div className="min-h-screen bg-slate-50">
      <PortalHeader
        title={pageMeta[activeSection]?.title || 'Faculty Portal'}
        subtitle={`Class ${user.assignedGrade}-${user.assignedSection} - ${user.name}`}
        onBack={() => navigateToSection('dashboard')}
        onLogout={handleLogout}
      >
        {notificationAction}
      </PortalHeader>
      {/* Top Navbar */}
      <div className="hidden bg-slate-900 text-white px-8 py-4 flex justify-between items-center shadow-md">
        <div className="flex items-center gap-4">
          <Logo className="shrink-0" />
          <div>
            <h1 className="font-display font-bold text-lg leading-tight">{pageMeta[activeSection]?.title || 'Faculty Portal'}</h1>
            <p className="text-xs text-slate-400">Class {user.assignedGrade}-{user.assignedSection} • {user.name}</p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <button onClick={() => navigateToSection('dashboard')} className={`items-center gap-2 px-4 py-2 bg-white/10 hover:bg-white/20 rounded-lg text-sm font-semibold transition-colors ${activeSection === 'dashboard' ? 'hidden' : 'hidden sm:flex'}`}>
            <ChevronLeft size={16} /> Dashboard
          </button>
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

            {showNotifications && (
              <div className="absolute right-0 mt-2 w-80 bg-white rounded-2xl shadow-2xl border border-slate-100 z-50 max-h-96 overflow-y-auto">
                <div className="sticky top-0 bg-slate-900 text-white p-4 border-b border-slate-800 rounded-t-2xl flex items-center justify-between">
                  <div>
                    <h3 className="font-display font-bold">Faculty Announcements</h3>
                    <p className="text-xs text-slate-400">{inboxAnnouncements.length} total</p>
                  </div>
                  <button 
                    onClick={() => setShowNotifications(false)}
                    className="text-slate-300 hover:text-white p-1 rounded transition-colors flex-shrink-0"
                    title="Close"
                  >
                    <X size={18} />
                  </button>
                </div>

                {inboxAnnouncements.length > 0 ? (
                  <div className="divide-y divide-slate-100">
                    {inboxAnnouncements.map(ann => (
                      <div key={ann._id} className={`p-4 hover:bg-slate-50 transition-colors ${ann.priority === 'HIGH' ? 'border-l-4 border-l-red-500' : 'border-l-4 border-l-slate-200'}`}>
                        <div className="flex items-start justify-between gap-2 mb-1">
                          <h4 className="font-bold text-slate-900 text-sm line-clamp-2">{ann.title}</h4>
                          <div className="flex items-center gap-2 flex-shrink-0">
                            {ann.priority === 'HIGH' && <span className="bg-red-100 text-red-700 text-[10px] font-bold px-2 py-0.5 rounded-full whitespace-nowrap">URGENT</span>}
                            <button 
                              onClick={() => dismissInboxAnnouncement(ann._id)}
                              className="text-slate-400 hover:text-slate-600 p-0.5 rounded transition-colors"
                              title="Dismiss"
                            >
                              <X size={16} />
                            </button>
                          </div>
                        </div>
                        <p className="text-xs text-slate-600 line-clamp-2 mb-2">{ann.message}</p>
                        <div className="flex items-center justify-between text-[11px]">
                          <span className="text-slate-500">{ann.createdBy?.name || 'Admin'}</span>
                          <span className="text-slate-400">{new Date(ann.createdAt).toLocaleDateString()}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="p-8 text-center text-slate-400">
                    <p className="text-sm font-semibold">No faculty announcements yet</p>
                  </div>
                )}
              </div>
            )}
          </div>
          <button onClick={handleLogout} className="flex items-center gap-2 px-4 py-2 bg-white/10 hover:bg-white/20 rounded-lg text-sm font-semibold transition-colors">
            <LogOut size={16} /> Logout
          </button>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-10">
        {activeSection !== 'dashboard' && pageMeta[activeSection] && (
          <div className="mb-8 rounded-3xl border border-slate-200 bg-white px-6 py-5 shadow-sm">
            <button onClick={() => navigateToSection('dashboard')} className="mb-4 flex items-center gap-2 text-slate-600 hover:text-slate-900 font-semibold transition-colors">
              <ChevronLeft size={20} /> Back to Dashboard
            </button>
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">Faculty Apps</p>
            <h2 className="mt-2 text-2xl font-display font-bold text-slate-900">{pageMeta[activeSection].title}</h2>
            <p className="mt-2 max-w-3xl text-sm leading-6 text-slate-500">{pageMeta[activeSection].description}</p>
          </div>
        )}
        
        <div className={`${activeSection === 'homework' || activeSection === 'attendance' || activeSection === 'behavior' || activeSection === 'announcements' ? 'grid' : 'hidden'} ${activeSection === 'homework' ? 'lg:grid-cols-3' : 'max-w-xl mx-auto'} gap-6 sm:gap-8`}>
          {/* Main Content - Student List */}
          <div className={`${activeSection === 'homework' ? 'lg:col-span-2 space-y-6 block' : 'hidden'}`}>
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <h2 className="text-2xl font-display font-bold text-slate-900 flex items-center gap-2">
                <Users className="text-emerald-600" /> My Students
              </h2>
              <span className="w-fit bg-slate-200 text-slate-700 font-bold px-3 py-1 rounded-full text-sm">{students.length} Total</span>
            </div>

            <div className="space-y-3 md:hidden">
              {students.map(s => (
                <div key={s._id} className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <p className="text-xs font-bold uppercase tracking-[0.18em] text-slate-500">SRV No.</p>
                      <p className="mt-1 font-mono text-sm font-semibold text-slate-700">{s.srvNumber}</p>
                    </div>
                  </div>
                  <h3 className="mt-4 text-lg font-display font-bold text-slate-900">{s.name}</h3>
                  <p className={`mt-2 text-sm ${getFamilySummary(s) === 'Family details missing' ? 'text-red-500 font-semibold' : 'text-slate-500'}`}>
                    {getFamilySummary(s)}
                  </p>
                  <div className="mt-4 flex flex-wrap gap-2">
                    <button
                      onClick={() => { setSelectedStudent(s); setGradeMsg({text:'', type:''}); }}
                      className="rounded-lg bg-emerald-100 px-3 py-2 text-xs font-bold text-emerald-700"
                    >
                      Evaluate Nlite & Marks
                    </button>
                    <button
                      onClick={() => openStudentProfileEditor(s)}
                      className="rounded-lg bg-blue-100 px-3 py-2 text-xs font-bold text-blue-700"
                    >
                      Edit Profile
                    </button>
                  </div>
                </div>
              ))}
              {students.length === 0 ? (
                <div className="rounded-2xl border border-dashed border-slate-200 px-4 py-8 text-center text-sm font-semibold text-slate-500">
                  No students assigned yet.
                </div>
              ) : null}
            </div>

            <div className="hidden overflow-hidden rounded-2xl bg-white shadow-sm border border-slate-100 md:block">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-slate-50 border-b border-slate-100 text-sm text-slate-500">
                    <th className="px-6 py-4 font-semibold">SRV No.</th>
                    <th className="px-6 py-4 font-semibold">Name</th>
                    <th className="px-6 py-4 font-semibold">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {students.map(s => (
                    <tr key={s._id} className="border-b border-slate-50 hover:bg-slate-50/50">
                      <td className="px-6 py-4 font-mono text-sm font-semibold text-slate-600">{s.srvNumber}</td>
                      <td className="px-6 py-4">
                        <p className="font-semibold text-slate-900">{s.name}</p>
                        <p className={`text-xs mt-1 ${getFamilySummary(s) === 'Family details missing' ? 'text-red-500 font-semibold' : 'text-slate-500'}`}>
                          {getFamilySummary(s)}
                        </p>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex flex-col items-start gap-2">
                          <button 
                            onClick={() => { setSelectedStudent(s); setGradeMsg({text:'', type:''}); }}
                            className="text-emerald-600 font-semibold text-sm hover:underline"
                          >
                            Evaluate Nlite & Marks
                          </button>
                          <button
                            onClick={() => openStudentProfileEditor(s)}
                            className="text-blue-600 font-semibold text-sm hover:underline"
                          >
                            Edit Profile
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                  {students.length === 0 && (
                    <tr>
                      <td colSpan="3" className="px-6 py-8 text-center text-slate-500">
                        No students assigned yet.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>

            {/* Homework Dashboard Weekly Calendar */}
            <div className="bg-white rounded-3xl p-5 sm:p-6 lg:p-8 shadow-sm border border-slate-100 mt-8 relative">
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between mb-6 gap-4">
                <div className="flex items-center gap-3">
                  <BookOpen className="text-emerald-500" />
                  <h3 className="text-xl font-display font-bold text-slate-900">Daily Homework Dashboard</h3>
                </div>
                <div className="flex w-full flex-col gap-3 sm:w-auto sm:flex-row sm:items-center cursor-pointer">
                  <button onClick={fetchHomework} className="text-sm text-slate-500 font-semibold hover:text-emerald-600 transition-colors">
                    Refresh Data
                  </button>
                  <div className="flex items-center justify-between gap-2 bg-slate-50 rounded-xl p-1 border border-slate-200">
                    <button onClick={prevWeek} className="p-1.5 hover:bg-white rounded-lg transition-colors"><ChevronLeft size={18} className="text-slate-600" /></button>
                    <span className="text-sm font-bold text-slate-700 text-center min-w-0 flex-1 px-2">
                      {days[0].toLocaleDateString('en-US', { month: 'short', day: 'numeric' })} - {days[6].toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                    </span>
                    <button onClick={nextWeek} className="p-1.5 hover:bg-white rounded-lg transition-colors"><ChevronRight size={18} className="text-slate-600" /></button>
                  </div>
                </div>
              </div>

              <div className="overflow-x-auto pb-4 -mx-1 px-1">
                <div className="grid grid-flow-col auto-cols-[78vw] gap-4 snap-x snap-mandatory md:min-w-[1000px] md:grid-flow-row md:grid-cols-7 md:auto-cols-fr">
                  {days.map((day, i) => {
                    const dayHomework = assignedHomework.filter(hw => isSameDay(hw.dueDate, day));
                    const isToday = isSameDay(day, new Date());
                    const isFlipped = flippedDay === i;
                    const grouped = groupBySubject(dayHomework);
                    const subjectKeys = Object.keys(grouped);

                    return (
                      <div 
                        key={i} 
                        className="relative perspective-1000 h-[320px] sm:h-[360px] md:h-[420px] w-full group snap-start"
                        onMouseEnter={() => setFlippedDay(i)}
                        onMouseLeave={() => setFlippedDay(null)}
                        onClick={() => setFlippedDay(isFlipped ? null : i)}
                      >
                        <div className={`w-full h-full relative transition-transform duration-700 transform-style-3d ${isFlipped ? 'rotate-y-180' : 'md:group-hover:[transform:rotateY(180deg)]'}`}>
                          
                          {/* FRONT FACE */}
                          <div className={`absolute w-full h-full backface-hidden rounded-[24px] border flex flex-col justify-center items-center p-4 sm:p-6 cursor-pointer shadow-sm transition-colors ${isToday ? 'border-emerald-300 bg-emerald-50' : 'border-slate-100 bg-slate-50'}`}>
                            <p className={`text-xs sm:text-sm font-bold uppercase tracking-widest mb-3 text-center ${isToday ? 'text-emerald-600' : 'text-slate-500'}`}>
                              {day.toLocaleDateString('en-US', { weekday: 'long' })}
                            </p>
                            <p className={`text-5xl sm:text-6xl font-display font-black mb-4 ${isToday ? 'text-emerald-900' : 'text-slate-800'}`}>
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
                              <span className="hidden md:inline">Hover to flip</span>
                              <span className="md:hidden">Tap to flip</span>
                              <ChevronRight size={10} />
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
                                        <div key={hw._id} className="bg-slate-800/50 rounded-lg p-2.5 relative group hover:bg-slate-700/60 transition-colors">
                                          <button 
                                            onClick={() => openSubjectHistory(subject)}
                                            className="w-full text-left pb-2 -m-2.5 p-2.5 rounded-lg hover:bg-slate-700/40 transition-colors"
                                          >
                                            <h4 className="font-display font-bold text-white text-[12px] mb-0.5 leading-tight group-hover:text-emerald-300 transition-colors">{hw.title}</h4>
                                            <p className="text-[10px] text-slate-400 line-clamp-2 leading-relaxed">{hw.description}</p>
                                          </button>
                                          <div className="flex items-center justify-between">
                                            <span className="text-[9px] text-slate-500 font-semibold flex items-center gap-1">
                                              <Clock size={9} /> Due: {new Date(hw.dueDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                                            </span>
                                            <div className="flex gap-1">
                                              <button onClick={() => setEditingHw(hw)} className="p-1 bg-blue-500/10 hover:bg-blue-500/20 text-blue-400 rounded transition-colors" title="Edit">
                                                <Edit2 size={10} />
                                              </button>
                                              <button onClick={() => setExtendingHw(hw)} className="p-1 bg-amber-500/10 hover:bg-amber-500/20 text-amber-400 rounded transition-colors" title="Extend Deadline">
                                                <CalendarClock size={10} />
                                              </button>
                                              <button onClick={() => handleDelete(hw._id)} className="p-1 bg-red-500/10 hover:bg-red-500/20 text-red-400 rounded transition-colors" title="Archive">
                                                <Trash2 size={10} />
                                              </button>
                                            </div>
                                          </div>
                                        </div>
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

              {/* Edit Homework Modal */}
              {editingHw && (
                <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
                  <div className="bg-white rounded-3xl p-6 sm:p-8 max-w-md w-full shadow-2xl relative">
                    <button onClick={() => setEditingHw(null)} className="absolute top-6 right-6 text-slate-400 hover:text-slate-700 z-10 p-2"><X size={20}/></button>
                    <h3 className="text-xl font-display font-bold text-slate-900 mb-6 flex items-center gap-2"><Edit2 size={20} className="text-blue-500"/> Edit Homework</h3>
                    <form onSubmit={(e) => {
                      e.preventDefault();
                      handleUpdate(editingHw._id, {
                        subject: editingHw.subject,
                        title: editingHw.title,
                        description: editingHw.description,
                        dueDate: editingHw.dueDate
                      });
                    }} className="space-y-4">
                      <div>
                        <label htmlFor="editHw-subject" className="block text-xs font-bold text-slate-500 mb-1 uppercase tracking-wider">Subject</label>
                        <input id="editHw-subject" name="subject" required type="text" value={editingHw.subject} onChange={e => setEditingHw({...editingHw, subject: e.target.value})} className="w-full px-4 py-2 border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-blue-500 font-semibold" />
                      </div>
                      <div>
                        <label htmlFor="editHw-title" className="block text-xs font-bold text-slate-500 mb-1 uppercase tracking-wider">Topic</label>
                        <input id="editHw-title" name="title" required type="text" value={editingHw.title} onChange={e => setEditingHw({...editingHw, title: e.target.value})} className="w-full px-4 py-2 border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-blue-500 font-semibold" />
                      </div>
                      <div>
                        <label htmlFor="editHw-description" className="block text-xs font-bold text-slate-500 mb-1 uppercase tracking-wider">Description</label>
                        <textarea id="editHw-description" name="description" required rows="3" value={editingHw.description} onChange={e => setEditingHw({...editingHw, description: e.target.value})} className="w-full px-4 py-2 border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-blue-500 text-sm"></textarea>
                      </div>
                      <button disabled={isSubmitting} type="submit" className="w-full py-3 bg-blue-600 text-white font-bold rounded-xl hover:bg-blue-700 transition-colors shadow-lg shadow-blue-600/20 disabled:opacity-50 flex justify-center items-center gap-2 mt-2">
                        {isSubmitting ? 'Saving Changes...' : <><Check size={18}/> Save Changes</>}
                      </button>
                    </form>
                  </div>
                </div>
              )}

              {/* Extend Deadline Modal */}
              {extendingHw && (
                <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
                  <div className="bg-white rounded-3xl p-6 sm:p-8 max-w-sm w-full shadow-2xl relative">
                    <button onClick={() => setExtendingHw(null)} className="absolute top-6 right-6 text-slate-400 hover:text-slate-700 z-10 p-2"><X size={20}/></button>
                    <h3 className="text-xl font-display font-bold text-slate-900 mb-2 flex items-center gap-2"><CalendarClock size={20} className="text-amber-500"/> Update Deadline</h3>
                    <p className="text-xs text-slate-500 font-semibold mb-6">Change the due date for <span className="text-slate-800">"{extendingHw.title}"</span></p>
                    <form onSubmit={(e) => {
                      e.preventDefault();
                      handleUpdate(extendingHw._id, {
                         subject: extendingHw.subject,
                         title: extendingHw.title,
                         description: extendingHw.description,
                         dueDate: extendingHw.dueDate
                      });
                    }} className="space-y-4">
                      <div>
                        <label htmlFor="extendHw-dueDate" className="block text-xs font-bold text-slate-500 mb-2 uppercase tracking-wider">New Due Date</label>
                        <input 
                          id="extendHw-dueDate"
                          name="dueDate"
                          required 
                          type="date" 
                          value={new Date(extendingHw.dueDate).toISOString().split('T')[0]} 
                          onChange={e => setExtendingHw({...extendingHw, dueDate: e.target.value})} 
                          className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-slate-800 font-bold outline-none focus:ring-2 focus:ring-amber-500" 
                        />
                      </div>
                      <button disabled={isSubmitting} type="submit" className="w-full py-3.5 bg-amber-500 text-white font-bold rounded-xl hover:bg-amber-600 transition-colors shadow-lg shadow-amber-500/20 disabled:opacity-50 mt-4">
                        {isSubmitting ? 'Updating...' : 'Update Deadline'}
                      </button>
                    </form>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Sidebar Actions */}
          <div className={`${activeSection === 'homework' || activeSection === 'attendance' || activeSection === 'behavior' || activeSection === 'announcements' ? 'space-y-6 block' : 'hidden'}`}>
            {/* Upload Homework */}
            <div className={`${activeSection === 'homework' ? 'block' : 'hidden'} rounded-2xl border border-slate-100 bg-white p-4 shadow-sm sm:p-6`}>
              <div className="flex items-center gap-3 mb-5">
                <BookOpen className="text-amber-500" />
                <h3 className="text-lg font-display font-bold text-slate-900">Assign Homework</h3>
              </div>
              {hwMsg.text && (
                <div className={`mb-4 px-4 py-2 rounded-lg text-sm font-semibold ${hwMsg.type === 'success' ? 'bg-emerald-100 text-emerald-800' : 'bg-red-100 text-red-800'}`}>
                  {hwMsg.text}
                </div>
              )}
              <form onSubmit={submitHomework} className="space-y-3">
                <div>
                  <label htmlFor="hwForm-subject" className="block text-sm font-semibold text-slate-700 mb-1.5">Subject</label>
                  <select id="hwForm-subject" name="hwForm-subject" required value={hwForm.subject} onChange={e => setHwForm({...hwForm, subject: e.target.value})} className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm outline-none focus:ring-2 focus:ring-emerald-500">
                    <option value="" disabled>Select Subject</option>
                    <option value="English">English</option>
                    <option value="Tamil">Tamil</option>
                    <option value="Hindi">Hindi</option>
                    <option value="Mathematics">Mathematics</option>
                    <option value="Science">Science</option>
                    <option value="Social Science">Social Science</option>
                    <option value="Computer Science">Computer Science</option>
                  </select>
                </div>
                <div>
                  <label htmlFor="hwForm-title" className="block text-sm font-semibold text-slate-700 mb-1.5">Topic</label>
                  <input id="hwForm-title" name="hwForm-title" type="text" placeholder="Topic" required value={hwForm.title} onChange={e => setHwForm({...hwForm, title: e.target.value})} className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm outline-none focus:ring-2 focus:ring-emerald-500" />
                </div>
                <div>
                  <label htmlFor="hwForm-description" className="block text-sm font-semibold text-slate-700 mb-1.5">Description</label>
                  <textarea id="hwForm-description" name="hwForm-description" placeholder="Description..." rows="3" required value={hwForm.description} onChange={e => setHwForm({...hwForm, description: e.target.value})} className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm outline-none focus:ring-2 focus:ring-emerald-500"></textarea>
                </div>
                <div>
                  <label htmlFor="hwForm-dueDate" className="block text-sm font-semibold text-slate-700 mb-1.5">Due Date</label>
                  <input id="hwForm-dueDate" name="hwForm-dueDate" type="date" required value={hwForm.dueDate} onChange={e => setHwForm({...hwForm, dueDate: e.target.value})} className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm outline-none focus:ring-2 focus:ring-emerald-500" />
                </div>
                <button type="submit" className="w-full py-3 bg-amber-500 text-white font-bold rounded-xl hover:bg-amber-600 transition-colors text-sm">
                  Publish & Notify Parents
                </button>
              </form>
            </div>

            {/* Quick Actions */}
            <div className={`${activeSection === 'attendance' || activeSection === 'behavior' || activeSection === 'homework' ? 'block' : 'hidden'} rounded-2xl border border-slate-100 bg-white p-4 shadow-sm sm:p-6`}>
              <h3 className="text-lg font-display font-bold text-slate-900 mb-4">
                {activeSection === 'attendance' ? 'Mark Attendance' : activeSection === 'behavior' ? 'Log Daily Behavior' : 'Quick Actions'}
              </h3>
              <div className="space-y-3">
                <button onClick={openAttendanceModal} className={`${activeSection === 'behavior' ? 'hidden' : 'w-full flex'} items-center gap-3 p-3 rounded-xl border border-slate-200 hover:border-emerald-500 hover:bg-emerald-50 transition-colors text-left`}>
                  <CheckSquare className="text-emerald-600" size={20} />
                  <div>
                    <p className="font-semibold text-sm text-slate-900">Mark Attendance</p>
                    <p className="text-xs text-slate-500">Select student to record attendance</p>
                  </div>
                </button>
                <button onClick={openBehaviorModal} className={`${activeSection === 'attendance' ? 'hidden' : 'w-full flex'} items-center gap-3 p-3 rounded-xl border border-slate-200 hover:border-amber-500 hover:bg-amber-50 transition-colors text-left`}>
                  <AlertCircle className="text-amber-600" size={20} />
                  <div>
                    <p className="font-semibold text-sm text-slate-900">Log Daily Behavior</p>
                    <p className="text-xs text-slate-500">Assign points and add daily remarks</p>
                  </div>
                </button>
              </div>
            </div>

            {/* Send Announcement */}
            <div className={`${activeSection === 'announcements' ? 'block' : 'hidden'} mt-6 rounded-2xl border border-slate-100 bg-white p-4 shadow-sm sm:p-6`}>
              <div className="flex items-center gap-3 mb-4">
                <Megaphone className="text-blue-600" size={20} />
                <h3 className="text-lg font-display font-bold text-slate-900">Send Announcement</h3>
              </div>
              
              {announcementMsg.text && (
                <div className={`mb-4 px-4 py-3 rounded-lg text-sm font-semibold ${announcementMsg.type === 'success' ? 'bg-emerald-100 text-emerald-800 border border-emerald-200' : 'bg-red-100 text-red-800 border border-red-200'}`}>
                  {announcementMsg.text}
                </div>
              )}

              <form onSubmit={submitAnnouncement} className="space-y-4">
                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-2">Title</label>
                  <input 
                    type="text" 
                    placeholder="e.g., Important: Test Schedule"
                    value={announcementForm.title}
                    onChange={e => setAnnouncementForm({...announcementForm, title: e.target.value})}
                    className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-2">Message</label>
                  <textarea 
                    placeholder="Write your message..."
                    rows="3"
                    value={announcementForm.message}
                    onChange={e => setAnnouncementForm({...announcementForm, message: e.target.value})}
                    className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm outline-none focus:ring-2 focus:ring-blue-500"
                  ></textarea>
                </div>

                <div className="grid md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-semibold text-slate-700 mb-2">Priority</label>
                    <select 
                      value={announcementForm.priority}
                      onChange={e => setAnnouncementForm({...announcementForm, priority: e.target.value})}
                      className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm outline-none focus:ring-2 focus:ring-blue-500"
                    >
                      <option value="LOW">Low</option>
                      <option value="MEDIUM">Medium</option>
                      <option value="HIGH">High (Urgent)</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-semibold text-slate-700 mb-2">Target</label>
                    <select 
                      value={announcementForm.toAllStudents ? 'all' : 'none'}
                      onChange={e => setAnnouncementForm({...announcementForm, toAllStudents: e.target.value === 'all'})}
                      className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm outline-none focus:ring-2 focus:ring-blue-500"
                    >
                      <option value="all">All My Students</option>
                      <option value="none">Manual Selection</option>
                    </select>
                  </div>
                </div>

                {/* Student Selection - Manual Mode */}
                {!announcementForm.toAllStudents && (
                  <div className="bg-slate-50 rounded-xl p-4 border border-slate-200">
                    <label className="block text-sm font-semibold text-slate-700 mb-3">Select Students</label>
                    <div className="space-y-2 max-h-48 overflow-y-auto">
                      {students.length > 0 ? students.map(student => (
                        <label key={student._id} className="flex items-center gap-3 p-2 rounded-lg hover:bg-white transition-colors cursor-pointer">
                          <input 
                            type="checkbox" 
                            checked={selectedAnnouncementStudents.includes(student._id)}
                            onChange={e => {
                              if (e.target.checked) {
                                setSelectedAnnouncementStudents([...selectedAnnouncementStudents, student._id]);
                              } else {
                                setSelectedAnnouncementStudents(selectedAnnouncementStudents.filter(id => id !== student._id));
                              }
                            }}
                            className="w-4 h-4 rounded border-2 border-slate-300 accent-blue-600 cursor-pointer"
                          />
                          <div className="flex-1">
                            <p className="text-sm font-semibold text-slate-900">{student.name}</p>
                            <p className="text-xs text-slate-500">{student.srvNumber}</p>
                          </div>
                          {selectedAnnouncementStudents.includes(student._id) && (
                            <span className="text-blue-600 font-bold text-sm">✓</span>
                          )}
                        </label>
                      )) : (
                        <p className="text-slate-500 text-sm text-center py-4">No students assigned yet</p>
                      )}
                    </div>
                    <p className="text-xs text-slate-500 mt-2">
                      {selectedAnnouncementStudents.length > 0 ? `${selectedAnnouncementStudents.length} student${selectedAnnouncementStudents.length > 1 ? 's' : ''} selected` : 'Select at least one student'}
                    </p>
                  </div>
                )}

                <button type="submit" className="w-full py-3 bg-blue-600 text-white font-bold rounded-xl hover:bg-blue-700 transition-colors text-sm">
                  📢 Send to Students
                </button>
              </form>

              {/* Recent Announcements */}
              {announcements.length > 0 && (
                <div className="border-t border-slate-200 pt-4 mt-6">
                  <p className="text-sm font-bold text-slate-700 mb-3">Recent ({announcements.length})</p>
                  <div className="space-y-2 max-h-40 overflow-y-auto pr-2">
                    {announcements.slice(0, 3).map(ann => (
                      <div key={ann._id} className={`p-2.5 rounded-lg text-xs border-l-4 ${ann.priority === 'HIGH' ? 'bg-red-50 border-l-red-500' : ann.priority === 'MEDIUM' ? 'bg-amber-50 border-l-amber-500' : 'bg-slate-50 border-l-slate-500'}`}>
                        <div className="flex items-start justify-between gap-2">
                          <div className="flex-1">
                            <p className="font-bold text-slate-900">{ann.title}</p>
                            <p className="text-slate-600 line-clamp-1">{ann.message}</p>
                          </div>
                          <button onClick={() => deleteAnnouncement(ann._id)} className="text-red-500 hover:text-red-700 flex-shrink-0"><Trash2 size={14} /></button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

          </div>
        </div>

      </div>
      <div className={`${activeSection === 'events' || activeSection === 'polls' || activeSection === 'feedback' ? 'block' : 'hidden'} max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-10`}>
        {activeSection === 'events' && <UpcomingEventsSection role="faculty" />}
        {activeSection === 'polls' && <OpinionPollSection role="faculty" />}
        {activeSection === 'feedback' && <FeedbackInboxSection role="faculty" />}
      </div>

      {editingStudentProfile && (
        <div className="fixed inset-0 z-[55] flex items-start justify-center overflow-y-auto bg-slate-900/60 p-3 backdrop-blur-sm sm:items-center sm:p-4">
          <div className="absolute inset-0" onClick={closeStudentProfileEditor} />
          <div className="relative z-10 mx-auto my-3 w-full max-w-5xl overflow-y-auto rounded-[1.75rem] border border-slate-200 bg-white p-5 shadow-2xl max-h-[calc(100vh-1.5rem)] sm:my-8 sm:max-h-[90vh] sm:p-8">
            <div className="mb-5 flex flex-col gap-3 sm:mb-6 sm:flex-row sm:items-start sm:justify-between">
              <div>
                <h3 className="text-2xl font-display font-bold text-slate-900">Edit Student Profile</h3>
                <p className="text-sm text-slate-500 mt-1">{editingStudentProfile.name} ({editingStudentProfile.srvNumber})</p>
              </div>
              <button
                type="button"
                onClick={closeStudentProfileEditor}
                className="self-start rounded-xl px-3 py-2 text-sm font-bold text-slate-400 transition-colors hover:bg-slate-100 hover:text-slate-700 sm:self-auto"
              >
                Close
              </button>
            </div>

            {profileMsg.text && (
              <div className={`mb-4 rounded-xl px-4 py-3 text-sm font-semibold ${profileMsg.type === 'success' ? 'bg-emerald-100 text-emerald-800' : 'bg-red-100 text-red-800'}`}>
                {profileMsg.text}
              </div>
            )}

            <form onSubmit={saveStudentProfile} className="space-y-5">
              <div className="grid gap-4 md:grid-cols-3">
                <input
                  type="text"
                  value={studentProfileForm.name}
                  onChange={e => setStudentProfileForm({ ...studentProfileForm, name: e.target.value })}
                  className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Student name"
                />
                <input
                  type="text"
                  value={studentProfileForm.grade}
                  onChange={e => setStudentProfileForm({ ...studentProfileForm, grade: e.target.value, group: '' })}
                  className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Grade"
                />
                <input
                  type="text"
                  value={studentProfileForm.section}
                  onChange={e => setStudentProfileForm({ ...studentProfileForm, section: e.target.value })}
                  className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Section"
                />
              </div>

              {isSeniorGrade(studentProfileForm.grade) && (
                <input
                  type="text"
                  value={studentProfileForm.group}
                  onChange={e => setStudentProfileForm({ ...studentProfileForm, group: e.target.value })}
                  className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Group"
                />
              )}

              <div className="grid gap-4 md:grid-cols-2">
                <input
                  type="text"
                  value={studentProfileForm.motherName}
                  onChange={e => setStudentProfileForm({ ...studentProfileForm, motherName: e.target.value })}
                  className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Mother name"
                />
                <input
                  type="text"
                  value={studentProfileForm.fatherName}
                  onChange={e => setStudentProfileForm({ ...studentProfileForm, fatherName: e.target.value })}
                  className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Father name"
                />
              </div>

              <input
                type="text"
                value={studentProfileForm.guardianName}
                onChange={e => setStudentProfileForm({ ...studentProfileForm, guardianName: e.target.value })}
                className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Guardian name if parent names are unavailable"
              />

              <p className="text-sm text-slate-500">Enter mother and father names together, or fill only the guardian field.</p>

              <div className="flex flex-col-reverse gap-3 sm:flex-row sm:flex-wrap sm:items-center">
                <button type="submit" className="w-full rounded-xl bg-blue-600 px-6 py-3 font-bold text-white transition-colors hover:bg-blue-700 sm:w-auto">
                  Save Profile
                </button>
                <button type="button" onClick={closeStudentProfileEditor} className="w-full rounded-xl bg-slate-100 px-6 py-3 font-bold text-slate-700 transition-colors hover:bg-slate-200 sm:w-auto">
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Attendance Modal */}
      {showAttModal && (
        <div className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto bg-slate-900/60 p-3 backdrop-blur-sm sm:items-center sm:p-4">
          <div className="relative mx-auto my-3 flex max-h-[calc(100vh-1.5rem)] w-full max-w-lg flex-col rounded-3xl bg-white p-5 shadow-2xl sm:my-8 sm:max-h-[90vh] sm:p-8">
            <button onClick={() => setShowAttModal(false)} className="absolute right-5 top-5 z-10 font-bold text-slate-400 hover:text-slate-700 sm:right-6 sm:top-6">✕</button>
            <h3 className="mb-6 shrink-0 pr-10 text-2xl font-display font-bold text-slate-900">Daily Register</h3>
            
            {attMsg.text && (
              <div className={`mb-4 px-4 py-3 shrink-0 rounded-xl text-sm font-semibold ${attMsg.type === 'success' ? 'bg-emerald-100 text-emerald-800' : 'bg-red-100 text-red-800'}`}>
                {attMsg.text}
              </div>
            )}

            <form onSubmit={submitAttendance} className="flex flex-col overflow-hidden">
              <div className="shrink-0 mb-6">
                <label className="block text-xs font-bold text-slate-500 mb-2 uppercase tracking-wider">Date of Class</label>
                <input type="date" required value={attDate} onChange={e => setAttDate(e.target.value)} className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl font-bold text-slate-700 outline-none focus:ring-2 focus:ring-emerald-500" />
              </div>

              <div className="space-y-2 overflow-y-auto pr-2 mb-6">
                <label className="block text-xs font-bold text-slate-500 mb-2 uppercase tracking-wider">Student Roster</label>
                {students.map(s => (
                  <div key={s._id} className="flex items-center justify-between p-3 bg-slate-50 border border-slate-100 rounded-xl">
                    <div className="flex flex-col">
                      <span className="font-bold text-slate-800 text-sm">{s.name}</span>
                      <span className="text-xs font-mono text-slate-500">{s.srvNumber}</span>
                    </div>
                    <select 
                      value={attRecords[s._id] || 'Present'} 
                      onChange={e => setAttRecords({...attRecords, [s._id]: e.target.value})}
                      className={`text-sm font-bold border rounded-lg px-2 py-1 outline-none ${attRecords[s._id] === 'Absent' ? 'bg-red-100 text-red-700 border-red-200' : attRecords[s._id] === 'Half-Day' ? 'bg-amber-100 text-amber-700 border-amber-200' : 'bg-emerald-100 text-emerald-700 border-emerald-200'}`}
                    >
                      <option value="Present">Present</option>
                      <option value="Half-Day">Half-Day</option>
                      <option value="Absent">Absent</option>
                    </select>
                  </div>
                ))}
              </div>

              <button type="submit" className="w-full py-3.5 mt-auto shrink-0 bg-emerald-600 text-white font-bold rounded-xl hover:bg-emerald-700 transition-colors shadow-lg">
                Save Register
              </button>
            </form>
          </div>
        </div>
      )}

      {/* Behavior Modal */}
      {showBhvModal && (
        <div className="fixed inset-0 z-[60] flex items-start justify-center overflow-y-auto bg-slate-900/60 p-3 backdrop-blur-sm sm:items-center sm:p-4">
          <div className="relative mx-auto my-3 flex max-h-[calc(100vh-1.5rem)] w-full max-w-2xl flex-col rounded-3xl bg-white p-5 shadow-2xl sm:my-8 sm:max-h-[90vh] sm:p-8">
            <button onClick={() => setShowBhvModal(false)} className="absolute right-5 top-5 z-10 font-bold text-slate-400 hover:text-slate-700 sm:right-6 sm:top-6">✕</button>
            <h3 className="mb-6 flex shrink-0 items-center gap-3 pr-10 text-2xl font-display font-bold text-slate-900"><AlertCircle className="text-amber-500" /> Daily Behavior Log</h3>
            
            {bhvMsg.text && (
              <div className={`mb-4 px-4 py-3 shrink-0 rounded-xl text-sm font-semibold ${bhvMsg.type === 'success' ? 'bg-emerald-100 text-emerald-800' : 'bg-red-100 text-red-800'}`}>
                {bhvMsg.text}
              </div>
            )}

            <form onSubmit={submitBehavior} className="flex flex-col overflow-hidden">
              <div className="shrink-0 mb-6">
                <label className="block text-xs font-bold text-slate-500 mb-2 uppercase tracking-wider">Date</label>
                <input type="date" required value={bhvDate} onChange={e => setBhvDate(e.target.value)} className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl font-bold text-slate-700 outline-none focus:ring-2 focus:ring-amber-500" />
              </div>

              <div className="space-y-3 overflow-y-auto pr-2 mb-6">
                <label className="block text-xs font-bold text-slate-500 mb-2 uppercase tracking-wider">Student Behavior Roster</label>
                {students.map(s => (
                  <div key={s._id} className="flex flex-col sm:flex-row gap-3 items-start sm:items-center p-4 bg-slate-50 border border-slate-100 rounded-xl">
                    <div className="flex flex-col w-full sm:w-1/3 shrink-0">
                      <span className="font-bold text-slate-800 text-sm">{s.name}</span>
                      <span className="text-xs font-mono text-slate-500">{s.srvNumber}</span>
                    </div>
                    
                    <div className="flex-1 w-full flex items-center gap-3">
                      <div className="flex flex-col">
                        <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wide">Score / 10</span>
                        <input type="number" min="1" max="10" required
                          value={bhvRecords[s._id]?.score || 10}
                          onChange={e => setBhvRecords({...bhvRecords, [s._id]: { ...bhvRecords[s._id], score: Number(e.target.value) }})}
                          className="w-16 px-2 py-1.5 text-center font-bold text-amber-700 bg-amber-50 border border-amber-200 rounded-lg outline-none"
                        />
                      </div>
                      <div className="flex-1 flex flex-col">
                        <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wide">Remarks (Optional)</span>
                        <input type="text" placeholder="Great participation..."
                          value={bhvRecords[s._id]?.remarks || ''}
                          onChange={e => setBhvRecords({...bhvRecords, [s._id]: { ...bhvRecords[s._id], remarks: e.target.value }})}
                          className="w-full px-3 py-1.5 text-sm bg-white border border-slate-200 rounded-lg outline-none focus:border-amber-400"
                        />
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              <button type="submit" className="w-full py-3.5 mt-auto shrink-0 bg-amber-500 text-white font-bold rounded-xl hover:bg-amber-600 transition-colors shadow-lg">
                Publish Behavior Logs
              </button>
            </form>
          </div>
        </div>
      )}

      {selectedStudent && (
        <div className="fixed inset-0 z-[58] flex items-start justify-center overflow-y-auto bg-slate-900/60 p-3 backdrop-blur-sm sm:items-center sm:p-4">
          <div className="absolute inset-0" onClick={closeStudentEvaluation} />
          <div className="relative z-10 mx-auto my-3 w-full max-w-6xl overflow-y-auto rounded-[1.75rem] border border-slate-200 bg-white p-5 shadow-2xl max-h-[calc(100vh-1.5rem)] sm:my-8 sm:max-h-[90vh] sm:p-8">
            <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <h3 className="flex items-center gap-2 text-xl font-display font-bold text-slate-900">
                Evaluating: <span className="text-emerald-600">{selectedStudent.name}</span>
              </h3>
              <button type="button" onClick={closeStudentEvaluation} className="self-start font-bold text-slate-400 hover:text-slate-600 sm:self-auto">
                Cancel
              </button>
            </div>

            {gradeMsg.text && (
              <div className={`mb-4 rounded-lg px-4 py-3 text-sm font-semibold ${gradeMsg.type === 'success' ? 'bg-emerald-100 text-emerald-800' : 'bg-red-100 text-red-800'}`}>
                {gradeMsg.text}
              </div>
            )}

            <form onSubmit={submitGrades} className="space-y-6">
              <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                <div>
                  <label htmlFor="gradeForm-term" className="block text-xs font-bold text-slate-500 mb-1">Term</label>
                  <select id="gradeForm-term" name="term" value={gradeForm.term} onChange={e => setGradeForm({...gradeForm, term: e.target.value})} className="w-full px-4 py-2 border rounded-xl">
                    <option>Term 1</option>
                    <option>Mid-Terms</option>
                    <option>Term 2</option>
                    <option>Finals</option>
                  </select>
                </div>
                <div>
                  <label htmlFor="gradeForm-behaviour" className="block text-xs font-bold text-slate-500 mb-1">Behaviour</label>
                  <select id="gradeForm-behaviour" name="behaviour" value={gradeForm.behaviour} onChange={e => setGradeForm({...gradeForm, behaviour: e.target.value})} className="w-full px-4 py-2 border rounded-xl">
                    <option>Excellent</option>
                    <option>Good</option>
                    <option>Needs Improvement</option>
                    <option>Poor</option>
                  </select>
                </div>
              </div>

              <div>
                <h4 className="font-bold text-slate-700 border-b pb-2 mb-3">Nlite 21st-Century Skills (0-5)</h4>
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 md:grid-cols-3">
                  {Object.keys(gradeForm.nliteSkills).map(skillName => (
                    <div key={skillName}>
                      <label htmlFor={`nliteSkill-${skillName}`} className="block text-xs font-bold text-slate-500 mb-1 capitalize">{skillName.replace(/([A-Z])/g, ' $1')}</label>
                      <input
                        id={`nliteSkill-${skillName}`}
                        name={`nliteSkill-${skillName}`}
                        type="number"
                        min="0"
                        max="5"
                        required
                        value={gradeForm.nliteSkills[skillName]}
                        onChange={e => setGradeForm({...gradeForm, nliteSkills: {...gradeForm.nliteSkills, [skillName]: Number(e.target.value)}})}
                        className="w-full px-3 py-2 border rounded-xl bg-amber-50"
                      />
                    </div>
                  ))}
                </div>
              </div>

              <div>
                <h4 className="font-bold text-slate-700 border-b pb-2 mb-3">Academic Marks (Out of 100)</h4>
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 md:grid-cols-3">
                  {Object.keys(gradeForm.marks).map(subject => (
                    <div key={subject}>
                      <label htmlFor={`marks-${subject}`} className="block text-xs font-bold text-slate-500 mb-1 capitalize">{subject}</label>
                      <input
                        id={`marks-${subject}`}
                        name={`marks-${subject}`}
                        type="number"
                        min="0"
                        max="100"
                        required
                        value={gradeForm.marks[subject]}
                        onChange={e => setGradeForm({...gradeForm, marks: {...gradeForm.marks, [subject]: Number(e.target.value)}})}
                        className="w-full px-3 py-2 border rounded-xl bg-slate-50"
                      />
                    </div>
                  ))}
                </div>
              </div>

              <button type="submit" className="w-full py-3 bg-emerald-600 text-white font-bold rounded-xl hover:bg-emerald-700 transition-colors">
                Save Evaluation & Notify Parents
              </button>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}

