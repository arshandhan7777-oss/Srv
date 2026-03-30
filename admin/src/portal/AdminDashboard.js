import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { Users, UserPlus, BookOpen, LogOut, CheckCircle2, Coffee, Trash2, Edit2, Save, X, Megaphone, GraduationCap, CalendarDays, ClipboardList, MessageSquareMore, BellRing, ArrowUpCircle, UtensilsCrossed, LayoutDashboard, ShieldAlert, ChevronLeft } from 'lucide-react';
import API_URL from '../config/api.js';
import Swal from 'sweetalert2';
import { OpinionPollSection } from '../components/OpinionPollSection.js';
import { FeedbackInboxSection } from '../components/FeedbackInboxSection.js';
import { UpcomingEventsSection } from '../components/UpcomingEventsSection.js';
import { PortalHeader } from '../components/PortalHeader.js';
import { NotificationPanel } from '../components/NotificationPanel.js';

export function AdminDashboard({ section = 'home' }) {
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

    return 'Missing family details';
  };

  const isSeniorGrade = (grade) => ['11', '12', 'XI', 'XII'].includes((grade || '').toUpperCase().trim());

  const [stats, setStats] = useState({
    totalStudents: 0,
    totalFaculty: 0,
    totalEvents: 0,
    totalPolls: 0,
    totalFeedback: 0,
    totalAnnouncements: 0
  });
  
  // Faculty Form State
  const [facultyForm, setFacultyForm] = useState({ name: '', assignedGrade: '', assignedSection: '', mobileNumber: '' });
  const [facultyMsg, setFacultyMsg] = useState({ text: '', type: '' });

  // Student Form State
  const [studentForm, setStudentForm] = useState({ name: '', grade: '', section: '', group: '', dateOfBirth: '', admissionNumber: '', motherName: '', fatherName: '', guardianName: '' });
  const [studentMsg, setStudentMsg] = useState({ text: '', type: '' });
  const [editingSrvId, setEditingSrvId] = useState(null);
  const [editSrvValue, setEditSrvValue] = useState('');
  const [editingStudentId, setEditingStudentId] = useState(null);
  const [editStudentForm, setEditStudentForm] = useState({ admissionNumber: '', name: '', grade: '', section: '', group: '', motherName: '', fatherName: '', guardianName: '' });
  const [promoteFrom, setPromoteFrom] = useState('');
  const [promoteTo, setPromoteTo] = useState('');

  // Food Menu Form State
  const [weeklyMenu, setWeeklyMenu] = useState([]);
  const [editingDay, setEditingDay] = useState(null);
  const [editFoodForm, setEditFoodForm] = useState({ breakfast: '', lunch: '', snacks: '' });
  const [foodMsg, setFoodMsg] = useState({ text: '', type: '' });

  // Manage Faculty State
  const [faculties, setFaculties] = useState([]);
  const [editingFacultyId, setEditingFacultyId] = useState(null);
  const [editFacultyForm, setEditFacultyForm] = useState({ facultyNumber: '', name: '', mobileNumber: '', assignedGrade: '', assignedSection: '', password: '' });
  const [manageFacultyMsg, setManageFacultyMsg] = useState({ text: '', type: '' });

  // Manage Students State
  const [selectedStudentForFees, setSelectedStudentForFees] = useState(null);
  const [manageStudentMsg, setManageStudentMsg] = useState({ text: '', type: '' });

  // Fees and Settings State
  const [isOnlineFeeEnabled, setIsOnlineFeeEnabled] = useState(false);
  const [feeAlerts, setFeeAlerts] = useState([]);
  const [showNotifications, setShowNotifications] = useState(false);

  // Password Requests
  const [pwRequests, setPwRequests] = useState([]);
  const [resettingPwFor, setResettingPwFor] = useState(null);
  const [newAdminProvidedPw, setNewAdminProvidedPw] = useState('');

  // Announcements
  const [announcementForm, setAnnouncementForm] = useState({ title: '', message: '', priority: 'MEDIUM', targetType: 'students', targetGrade: '', targetSection: '' });
  const [announcements, setAnnouncements] = useState([]);
  const [announcementMsg, setAnnouncementMsg] = useState({ text: '', type: '' });
  const [selectedAnnouncementFaculties, setSelectedAnnouncementFaculties] = useState([]);

  // Advanced Profile State
  const [allStudents, setAllStudents] = useState([]);
  const [selectedFacultyProfile, setSelectedFacultyProfile] = useState(null);
  const [studentListFilter, setStudentListFilter] = useState({ grade: '', section: '' });

  const navigate = useNavigate();

  const fetchStats = (token) => {
    return axios.get(`${API_URL}/api/admin/stats`, {
      headers: { Authorization: `Bearer ${token}` }
    }).then(res => setStats(res.data)).catch(console.error);
  };

  useEffect(() => {
    // Auth is handled by ProtectedRoute — just fetch data
    const token = localStorage.getItem('schoolToken');
    fetchStats(token);

    // Fetch faculties
    fetchFaculties(token);
    // Fetch weekly menu
    fetchWeeklyMenu(token);
    // Fetch all students for the new tracking table
    fetchStudents(token);
    // Fetch settings and alerts
    fetchSettingsAndAlerts(token);
    // Fetch announcements
    fetchAnnouncements(token);
  }, [section]);

  const fetchSettingsAndAlerts = (token) => {
    axios.get(`${API_URL}/api/admin/settings/fee-toggle`, { headers: { Authorization: `Bearer ${token}` } })
      .then(res => setIsOnlineFeeEnabled(res.data.isOnlineFeeEnabled)).catch(console.error);
    axios.get(`${API_URL}/api/admin/notifications`, { headers: { Authorization: `Bearer ${token}` } })
      .then(res => setFeeAlerts(res.data)).catch(console.error);
    axios.get(`${API_URL}/api/admin/password-requests`, { headers: { Authorization: `Bearer ${token}` } })
      .then(res => setPwRequests(res.data)).catch(console.error);
  };

  const handleToggleOnlineFee = async () => {
    try {
      const token = localStorage.getItem('schoolToken');
      const newStatus = !isOnlineFeeEnabled;
      await axios.put(`${API_URL}/api/admin/settings/fee-toggle`, { isEnabled: newStatus }, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setIsOnlineFeeEnabled(newStatus);
    } catch (err) {
      Swal.fire('Error', 'Failed to update fee setting', 'error');
    }
  };

  const fetchWeeklyMenu = (token) => {
    axios.get(`${API_URL}/api/admin/food`, {
      headers: { Authorization: `Bearer ${token}` }
    }).then(res => setWeeklyMenu(res.data)).catch(console.error);
  };

  const fetchFaculties = (token) => {
    axios.get(`${API_URL}/api/admin/faculty`, {
      headers: { Authorization: `Bearer ${token}` }
    }).then(res => setFaculties(res.data)).catch(console.error);
  };

  const fetchStudents = (token) => {
    axios.get(`${API_URL}/api/admin/students`, {
      headers: { Authorization: `Bearer ${token}` }
    }).then(res => setAllStudents(res.data)).catch(console.error);
  };

  const fetchAnnouncements = (token) => {
    axios.get(`${API_URL}/api/admin/announcements`, {
      headers: { Authorization: `Bearer ${token}` }
    }).then(res => setAnnouncements(res.data)).catch(console.error);
  };

  const submitAnnouncement = async (e) => {
    e.preventDefault();
    if (!announcementForm.title.trim() || !announcementForm.message.trim()) {
      setAnnouncementMsg({ text: 'Title and message are required', type: 'error' });
      return;
    }

    if (announcementForm.targetType === 'faculty' && selectedAnnouncementFaculties.length === 0) {
      setAnnouncementMsg({ text: 'Select at least one faculty member', type: 'error' });
      return;
    }

    if (announcementForm.targetType === 'class' && (!announcementForm.targetGrade || !announcementForm.targetSection)) {
      setAnnouncementMsg({ text: 'Select Grade and Section', type: 'error' });
      return;
    }

    try {
      const token = localStorage.getItem('schoolToken');
      const payload = {
        ...announcementForm,
        selectedFacultyIds: announcementForm.targetType === 'faculty' ? selectedAnnouncementFaculties : []
      };
      await axios.post(`${API_URL}/api/admin/announcements`, payload, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setAnnouncementMsg({ text: 'Announcement published successfully!', type: 'success' });
      setAnnouncementForm({ title: '', message: '', priority: 'MEDIUM', targetType: 'students', targetGrade: '', targetSection: '' });
      setSelectedAnnouncementFaculties([]);
      fetchAnnouncements(token);
    } catch (err) {
      setAnnouncementMsg({ text: 'Error publishing announcement', type: 'error' });
    }
  };

  const deleteAnnouncement = async (id) => {
    const { isConfirmed } = await Swal.fire({
      title: 'Delete Announcement?',
      text: 'This action cannot be undone',
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#ef4444',
      cancelButtonColor: '#6b7280',
      confirmButtonText: 'Delete'
    });

    if (!isConfirmed) return;

    try {
      const token = localStorage.getItem('schoolToken');
      await axios.delete(`${API_URL}/api/admin/announcements/${id}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      fetchAnnouncements(token);
      Swal.fire('Deleted!', 'Announcement deleted successfully.', 'success');
    } catch (err) {
      Swal.fire('Error', 'Failed to delete announcement', 'error');
    }
  };

  const openFacultyProfile = (faculty) => {
    const token = localStorage.getItem('schoolToken');
    fetchStudents(token);
    setSelectedFacultyProfile(faculty);
  };

  const handleLogout = () => {
    localStorage.removeItem('schoolToken');
    localStorage.removeItem('schoolUser');
    navigate('/admin-login');
  };

  const handleDeleteFaculty = async (id) => {
    const result = await Swal.fire({
      title: 'Delete Faculty?',
      text: 'Are you sure you want to permanently delete this faculty member?',
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#ef4444',
      cancelButtonColor: '#0f172a',
      confirmButtonText: 'Yes, delete!'
    });
    if (!result.isConfirmed) return;
    try {
      const token = localStorage.getItem('schoolToken');
      await axios.delete(`${API_URL}/api/admin/faculty/${id}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setManageFacultyMsg({ text: 'Faculty deleted successfully', type: 'success' });
      fetchFaculties(token);
      setStats(prev => ({...prev, totalFaculty: prev.totalFaculty - 1}));
      setTimeout(() => setManageFacultyMsg({text:'', type:''}), 3000);
    } catch (err) {
      console.error('[Delete Faculty Error]', err.response?.data || err.message || err);
      setManageFacultyMsg({ text: err.response?.data?.message || 'Failed to delete faculty', type: 'error' });
    }
  };

  const handleDeleteStudent = async (id) => {
    const result = await Swal.fire({
      title: 'Delete Student?',
      text: 'Are you sure? Their parent account will also be permanently deleted.',
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#ef4444',
      cancelButtonColor: '#0f172a',
      confirmButtonText: 'Yes, delete!'
    });
    if (!result.isConfirmed) return;
    try {
      const token = localStorage.getItem('schoolToken');
      await axios.delete(`${API_URL}/api/admin/student/${id}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setManageStudentMsg({ text: 'Student and parent account deleted successfully', type: 'success' });
      fetchStudents(token);
      setStats(prev => ({...prev, totalStudents: prev.totalStudents - 1}));
      setTimeout(() => setManageStudentMsg({text:'', type:''}), 4000);
    } catch (err) {
      console.error('[Delete Student Error]', err.response?.data || err.message || err);
      setManageStudentMsg({ text: err.response?.data?.message || 'Failed to delete student', type: 'error' });
    }
  };

  const handleUpdateStudent = async (id) => {
    if (!hasValidFamilyDetails(editStudentForm)) {
      Swal.fire('Missing Family Details', 'Enter both mother and father names, or provide a guardian name.', 'warning');
      return;
    }
    try {
      const token = localStorage.getItem('schoolToken');
      const currentStudent = allStudents.find(student => student._id === id);
      const nextAdmissionNumber = String(editStudentForm.admissionNumber || '').replace(/\D/g, '');
      const currentAdmissionNumber = String(currentStudent?.srvNumber || '').replace(/\D/g, '');

      if (nextAdmissionNumber && nextAdmissionNumber !== currentAdmissionNumber) {
        await axios.put(`${API_URL}/api/admin/student/${id}/srv`, { admissionNumber: nextAdmissionNumber }, {
          headers: { Authorization: `Bearer ${token}` }
        });
      }

      await axios.put(`${API_URL}/api/admin/student/${id}`, editStudentForm, {
        headers: { Authorization: `Bearer ${token}` }
      });
      Swal.fire({toast: true, position: 'top-end', icon: 'success', title: 'Student updated!', showConfirmButton: false, timer: 2000});
      closeStudentEditor();
      fetchStudents(token);
    } catch (err) {
      Swal.fire('Error', err.response?.data?.message || 'Failed to update student', 'error');
    }
  };

  const handlePromoteStudents = async () => {
    if (!promoteFrom || !promoteTo) {
      Swal.fire('Missing Fields', 'Please select both "From Grade" and "To Grade".', 'warning');
      return;
    }
    const confirm = await Swal.fire({
      title: 'Promote Students?',
      html: `This will move <b>ALL</b> students from Grade <b>${promoteFrom}</b> to Grade <b>${promoteTo}</b>.<br/>This action cannot be undone.`,
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#059669',
      cancelButtonColor: '#0f172a',
      confirmButtonText: 'Yes, promote them!'
    });
    if (!confirm.isConfirmed) return;
    try {
      const token = localStorage.getItem('schoolToken');
      const res = await axios.post(`${API_URL}/api/admin/students/promote`, { fromGrade: promoteFrom, toGrade: promoteTo }, {
        headers: { Authorization: `Bearer ${token}` }
      });
      Swal.fire('Promoted!', res.data.message, 'success');
      setPromoteFrom('');
      setPromoteTo('');
      fetchStudents(token);
    } catch (err) {
      Swal.fire('Error', err.response?.data?.message || 'Promotion failed', 'error');
    }
  };

  const openStudentEditor = (student) => {
    setEditingStudentId(student._id);
    setEditStudentForm({
      admissionNumber: String(student.srvNumber || '').replace(/\D/g, ''),
      name: student.name,
      grade: student.grade,
      section: student.section,
      group: student.group || '',
      motherName: student.motherName || '',
      fatherName: student.fatherName || '',
      guardianName: student.guardianName || ''
    });
  };

  const closeStudentEditor = () => {
    setEditingStudentId(null);
    setEditStudentForm({ admissionNumber: '', name: '', grade: '', section: '', group: '', motherName: '', fatherName: '', guardianName: '' });
  };

  const handleUpdateFaculty = async (id) => {
    try {
      const token = localStorage.getItem('schoolToken');
      const currentFaculty = faculties.find(faculty => faculty._id === id);
      const nextFacultyNumber = String(editFacultyForm.facultyNumber || '').replace(/\D/g, '');
      const currentFacultyNumber = String(currentFaculty?.srvNumber || '').replace(/\D/g, '');

      if (!editFacultyForm.name.trim()) {
        setManageFacultyMsg({ text: 'Faculty name is required', type: 'error' });
        return;
      }

      if (nextFacultyNumber && nextFacultyNumber !== currentFacultyNumber) {
        await axios.put(`${API_URL}/api/admin/faculty/${id}/srv`, { facultyNumber: nextFacultyNumber }, {
          headers: { Authorization: `Bearer ${token}` }
        });
      }

      await axios.put(`${API_URL}/api/admin/faculty/${id}`, {
        name: editFacultyForm.name,
        mobileNumber: editFacultyForm.mobileNumber,
        assignedGrade: editFacultyForm.assignedGrade,
        assignedSection: editFacultyForm.assignedSection,
        password: editFacultyForm.password
      }, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setEditingFacultyId(null);
      setEditFacultyForm({ facultyNumber: '', name: '', mobileNumber: '', assignedGrade: '', assignedSection: '', password: '' });
      setManageFacultyMsg({ text: 'Faculty updated successfully', type: 'success' });
      fetchFaculties(token);
      setTimeout(() => setManageFacultyMsg({text:'', type:''}), 3000);
    } catch (err) {
      setManageFacultyMsg({ text: err.response?.data?.message || 'Failed to update faculty', type: 'error' });
    }
  };

  const startEditing = (faculty) => {
    setEditingFacultyId(faculty._id);
    setEditFacultyForm({
      facultyNumber: String(faculty.srvNumber || '').replace(/\D/g, ''),
      name: faculty.name || '',
      mobileNumber: faculty.mobileNumber || '',
      assignedGrade: faculty.assignedGrade || '',
      assignedSection: faculty.assignedSection || '',
      password: ''
    });
    setManageFacultyMsg({ text: '', type: '' });
  };

  const closeFacultyEditor = () => {
    setEditingFacultyId(null);
    setManageFacultyMsg({ text: '', type: '' });
    setEditFacultyForm({ facultyNumber: '', name: '', mobileNumber: '', assignedGrade: '', assignedSection: '', password: '' });
  };

  const handleApprovePwReset = async () => {
    if (!newAdminProvidedPw) {
      Swal.fire('Required', 'Enter a new password', 'warning');
      return;
    }
    try {
      const token = localStorage.getItem('schoolToken');
      await axios.post(`${API_URL}/api/admin/password-requests/${resettingPwFor._id}/approve`, 
        { newPassword: newAdminProvidedPw },
        { headers: { Authorization: `Bearer ${token}` }}
      );
      setResettingPwFor(null);
      setNewAdminProvidedPw('');
      fetchSettingsAndAlerts(token); // refresh list
    } catch (err) {
      Swal.fire('Error', err.response?.data?.message || 'Error resetting password', 'error');
    }
  };

  const handeFacultySubmit = async (e) => {
    e.preventDefault();
    try {
      const token = localStorage.getItem('schoolToken');
      const res = await axios.post(`${API_URL}/api/admin/faculty`, facultyForm, {
        headers: { Authorization: `Bearer ${token}` }
      });
      Swal.fire({
        title: 'Faculty Created!',
        html: `<b>SRV Number:</b> ${res.data.faculty.srvNumber}<br/><b>Password:</b> faculty123`,
        icon: 'success',
        confirmButtonColor: '#059669'
      });
      setFacultyForm({ name: '', assignedGrade: '', assignedSection: '', mobileNumber: '' });
      setStats(prev => ({...prev, totalFaculty: prev.totalFaculty + 1}));
      fetchFaculties(token); // dynamically refresh the table
    } catch (err) {
      Swal.fire('Error', err.response?.data?.message || 'Failed to create faculty', 'error');
    }
  };

  const handleStudentSubmit = async (e) => {
    e.preventDefault();
    if (!hasValidFamilyDetails(studentForm)) {
      Swal.fire('Missing Family Details', 'Enter both mother and father names, or provide a guardian name.', 'warning');
      return;
    }
    try {
      const token = localStorage.getItem('schoolToken');
      const res = await axios.post(`${API_URL}/api/admin/student`, studentForm, {
        headers: { Authorization: `Bearer ${token}` }
      });
      Swal.fire({
        title: 'Student Admitted!',
        html: `<b>SRV Number:</b> ${res.data.student.srvNumber}<br/><b>Password:</b> ${res.data.parentLogin.defaultPassword}`,
        icon: 'success',
        confirmButtonColor: '#059669'
      });
      setStudentForm({ name: '', grade: '', section: '', group: '', dateOfBirth: '', admissionNumber: '', motherName: '', fatherName: '', guardianName: '' });
      setStats(prev => ({...prev, totalStudents: prev.totalStudents + 1}));
      fetchStudents(token); // dynamically refresh the table
    } catch (err) {
      Swal.fire('Error', err.response?.data?.message || 'Failed to admit student', 'error');
    }
  };

  const handleSaveFood = async (day) => {
    try {
      const token = localStorage.getItem('schoolToken');
      await axios.post(`${API_URL}/api/admin/food`, { day, ...editFoodForm }, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setFoodMsg({ text: `${day} menu updated successfully!`, type: 'success' });
      setEditingDay(null);
      fetchWeeklyMenu(token);
      setTimeout(() => setFoodMsg({text:'', type:''}), 3000);
    } catch (err) {
      setFoodMsg({ text: 'Failed to update food menu', type: 'error' });
    }
  };

  const activeSection = section || 'home';
  const recentAnnouncements = announcements.slice(0, 5);

  const statCards = [
    { key: 'students', label: 'Total Students', value: stats.totalStudents, icon: Users, tone: 'bg-emerald-100 text-emerald-700' },
    { key: 'faculty', label: 'Total Faculty', value: stats.totalFaculty, icon: BookOpen, tone: 'bg-blue-100 text-blue-700' },
    { key: 'events', label: 'Total Events', value: stats.totalEvents, icon: CalendarDays, tone: 'bg-amber-100 text-amber-700' },
    { key: 'polls', label: 'Total Polls', value: stats.totalPolls, icon: ClipboardList, tone: 'bg-violet-100 text-violet-700' },
    { key: 'feedback', label: 'Total Feedback', value: stats.totalFeedback, icon: MessageSquareMore, tone: 'bg-rose-100 text-rose-700' },
    { key: 'announcements', label: 'Total Announcements', value: stats.totalAnnouncements, icon: BellRing, tone: 'bg-slate-200 text-slate-700' }
  ];

  const appPages = [
    { key: 'faculty', title: 'Faculty', subtitle: 'Add Faculty, Manage Faculty', icon: BookOpen, badge: stats.totalFaculty, gradient: 'from-emerald-500 to-teal-500' },
    { key: 'students', title: 'Students', subtitle: 'Add Student, Manage Students', icon: GraduationCap, badge: stats.totalStudents, gradient: 'from-amber-500 to-orange-500' },
    { key: 'promote', title: 'Promote', subtitle: 'Promote Students', icon: ArrowUpCircle, badge: 'Year', gradient: 'from-cyan-500 to-sky-500' },
    { key: 'events', title: 'Events', subtitle: 'Upcoming Events, Acknowledgements', icon: CalendarDays, badge: stats.totalEvents, gradient: 'from-fuchsia-500 to-pink-500' },
    { key: 'polls', title: 'Poll Center', subtitle: 'Opinion Polls, Analytics', icon: ClipboardList, badge: stats.totalPolls, gradient: 'from-violet-500 to-indigo-500' },
    { key: 'feedback', title: 'Feedback', subtitle: 'Parent Feedback Inbox', icon: MessageSquareMore, badge: stats.totalFeedback, gradient: 'from-rose-500 to-red-500' },
    { key: 'cafeteria', title: 'Cafeteria', subtitle: 'Manage Cafeteria Menu', icon: UtensilsCrossed, badge: weeklyMenu.length || 'Menu', gradient: 'from-orange-500 to-yellow-500' },
    { key: 'announcements', title: 'Announcements', subtitle: 'Broadcast Announcement', icon: Megaphone, badge: stats.totalAnnouncements, gradient: 'from-slate-700 to-slate-900' }
  ];

  const pageMeta = {
    faculty: {
      title: 'Faculty Center',
      description: 'Create faculty accounts, edit FAC numbers, and manage faculty access from one page.'
    },
    students: {
      title: 'Student Center',
      description: 'Admit new students, edit SRV numbers, and maintain family details and fee records.'
    },
    promote: {
      title: 'Academic Promotion',
      description: 'Move an entire grade to the next academic year in an admin-only flow.'
    },
    events: {
      title: 'Event Hub',
      description: 'Open upcoming events and acknowledgement tracking in a dedicated page.'
    },
    polls: {
      title: 'Poll Center',
      description: 'Manage opinion polls and open analytics from a cleaner workspace.'
    },
    feedback: {
      title: 'Feedback Inbox',
      description: 'Read parent feedback from a focused page without the rest of the admin tools around it.'
    },
    cafeteria: {
      title: 'Cafeteria Menu',
      description: 'Update breakfast, lunch, and snacks for the full week.'
    },
    announcements: {
      title: 'Announcement Studio',
      description: 'Publish targeted announcements to classes, students, or faculty members.'
    }
  };

  const navigateToSection = (targetSection) => {
    navigate(targetSection === 'home' ? '/admin/dashboard' : `/admin/${targetSection}`);
  };

  const adminNotificationCount = feeAlerts.length + pwRequests.length;

  const notificationAction = (
    <div className="relative">
      <button
        type="button"
        onClick={() => setShowNotifications(current => !current)}
        className="relative flex h-9 w-9 min-w-9 items-center justify-center rounded-[10px] border border-slate-200 text-slate-600 opacity-100 transition hover:bg-slate-50 hover:text-slate-900 active:scale-95"
      >
        <BellRing size={18} className="opacity-100" />
        {adminNotificationCount > 0 && (
          <span className="absolute right-2 top-2 h-2 w-2 rounded-full bg-red-500"></span>
        )}
      </button>
      <NotificationPanel
        open={showNotifications}
        onClose={() => setShowNotifications(false)}
        title="Admin Alerts"
        subtitle={`${feeAlerts.length} payment alerts • ${pwRequests.length} recovery requests`}
      >
        <div className="space-y-4 p-4">
          <div>
            <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-500">Payment Alerts</p>
            <div className="mt-2 space-y-2">
              {feeAlerts.length > 0 ? feeAlerts.slice(0, 4).map(alert => (
                <div key={alert._id} className="rounded-2xl border border-emerald-100 bg-emerald-50 px-3 py-3">
                  <p className="text-sm font-semibold text-emerald-900">{alert.message}</p>
                  <p className="mt-1 text-[11px] text-emerald-700">{new Date(alert.createdAt).toLocaleString()}</p>
                </div>
              )) : (
                <div className="rounded-2xl border border-dashed border-slate-200 bg-slate-50 px-3 py-6 text-center text-sm text-slate-500">
                  No payment alerts.
                </div>
              )}
            </div>
          </div>

          <div>
            <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-500">Recovery Requests</p>
            <div className="mt-2 space-y-2">
              {pwRequests.length > 0 ? pwRequests.slice(0, 4).map(req => (
                <div key={req._id} className="rounded-2xl border border-indigo-100 bg-indigo-50 px-3 py-3">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <p className="text-sm font-bold text-indigo-900">{req.srvNumber}</p>
                      <p className="mt-1 text-[11px] uppercase tracking-[0.16em] text-indigo-700">{req.role}</p>
                    </div>
                    <p className="text-[11px] text-indigo-700">{new Date(req.createdAt).toLocaleDateString()}</p>
                  </div>
                </div>
              )) : (
                <div className="rounded-2xl border border-dashed border-slate-200 bg-slate-50 px-3 py-6 text-center text-sm text-slate-500">
                  No recovery requests.
                </div>
              )}
            </div>
          </div>
        </div>
      </NotificationPanel>
    </div>
  );

  const renderHomePage = () => (
    <div className="min-h-screen bg-slate-100">
      <PortalHeader
        title="Admin Dashboard"
        subtitle="School operations, alerts, and quick admin actions"
        onLogout={handleLogout}
      >
        {notificationAction}
      </PortalHeader>

      <main className="mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:px-8 lg:py-8">
        <div className="space-y-8">
          <section className="overflow-hidden rounded-[2rem] bg-gradient-to-br from-slate-950 via-emerald-900 to-teal-700 p-6 text-white shadow-xl shadow-emerald-950/10 sm:p-8">
            <div className="grid gap-6 lg:grid-cols-[1.35fr,0.85fr]">
              <div>
                <div className="inline-flex items-center gap-2 rounded-full bg-white/10 px-3 py-1 text-xs font-semibold uppercase tracking-[0.2em] text-emerald-100">
                  <LayoutDashboard size={14} />
                  Admin Dashboard
                </div>
                <h2 className="mt-4 max-w-2xl text-3xl font-display font-bold leading-tight sm:text-4xl">
                  Clean overview first, then quick access to every admin tool.
                </h2>
                <p className="mt-3 max-w-2xl text-sm leading-6 text-emerald-50/90 sm:text-base">
                  Mobile users land on a simple dashboard with totals, alerts, and app-style shortcuts instead of one long mixed page.
                </p>
              </div>

              <div className="rounded-[1.75rem] border border-white/15 bg-white/10 p-5 backdrop-blur">
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-[0.18em] text-emerald-100">Portal Controls</p>
                    <h3 className="mt-2 text-xl font-display font-bold">Online Fee Collection</h3>
                    <p className="mt-2 text-sm text-emerald-50/85">Keep parent payment access ready without opening another page.</p>
                  </div>
                  <ShieldAlert className="shrink-0 text-emerald-100" size={20} />
                </div>
                <div className="mt-6 flex items-center justify-between rounded-2xl bg-white/10 px-4 py-3">
                  <div>
                    <p className="text-sm font-semibold">{isOnlineFeeEnabled ? 'Payments Enabled' : 'Payments Disabled'}</p>
                    <p className="text-xs text-emerald-50/80">Passwords stay unchanged for existing users.</p>
                  </div>
                  <button
                    onClick={handleToggleOnlineFee}
                    className={`relative inline-flex h-7 w-12 items-center rounded-full transition-colors focus:outline-none ${isOnlineFeeEnabled ? 'bg-emerald-400' : 'bg-white/30'}`}
                  >
                    <span className={`inline-block h-5 w-5 transform rounded-full bg-white transition-transform ${isOnlineFeeEnabled ? 'translate-x-6' : 'translate-x-1'}`} />
                  </button>
                </div>
                <div className="mt-4 grid grid-cols-2 gap-3">
                  <button type="button" onClick={() => navigateToSection('students')} className="cursor-pointer rounded-2xl bg-white px-4 py-3 text-left text-slate-900 transition hover:-translate-y-0.5 active:scale-[0.97]">
                    <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">Most Used</p>
                    <p className="mt-1 text-sm font-bold">Student Center</p>
                  </button>
                  <button type="button" onClick={() => navigateToSection('faculty')} className="cursor-pointer rounded-2xl border border-white/20 bg-white/10 px-4 py-3 text-left transition hover:-translate-y-0.5 active:scale-[0.97]">
                    <p className="text-xs font-semibold uppercase tracking-[0.18em] text-emerald-100">Quick Open</p>
                    <p className="mt-1 text-sm font-bold">Faculty Center</p>
                  </button>
                </div>
              </div>
            </div>

            <div className="mt-8 grid grid-cols-2 gap-4 xl:grid-cols-6">
              {statCards.map(card => {
                const Icon = card.icon;

                return (
                  <div key={card.key} className="rounded-[1.5rem] border border-white/10 bg-white/10 p-4 backdrop-blur">
                    <div className={`mb-4 inline-flex h-12 w-12 items-center justify-center rounded-2xl ${card.tone}`}>
                      <Icon size={22} />
                    </div>
                    <p className="text-xs font-semibold uppercase tracking-[0.16em] text-emerald-50/75">{card.label}</p>
                    <p className="mt-2 text-3xl font-display font-bold">{card.value}</p>
                  </div>
                );
              })}
            </div>
          </section>

          <section className="space-y-4">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">Alerts</p>
              <h2 className="mt-1 text-2xl font-display font-bold text-slate-900">Recent payment alerts and recovery requests</h2>
            </div>

            <div className="grid gap-6 lg:grid-cols-2">
              <div className="rounded-[2rem] border border-slate-200 bg-white p-5 shadow-sm">
                <div className="flex items-center gap-3">
                  <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-emerald-100 text-emerald-700">
                    <BellRing size={22} />
                  </div>
                  <div>
                    <h3 className="text-lg font-display font-bold text-slate-900">Recent Payment Alerts</h3>
                    <p className="text-sm text-slate-500">Latest fee updates visible to admin.</p>
                  </div>
                </div>
                <div className="mt-5 space-y-3">
                  {feeAlerts.length > 0 ? feeAlerts.slice(0, 5).map(alert => (
                    <div key={alert._id} className="rounded-2xl border border-emerald-100 bg-emerald-50 px-4 py-3">
                      <p className="text-sm font-semibold text-emerald-900">{alert.message}</p>
                      <p className="mt-1 text-[11px] font-semibold uppercase tracking-[0.16em] text-emerald-700">{new Date(alert.createdAt).toLocaleString()}</p>
                    </div>
                  )) : (
                    <div className="rounded-2xl border border-dashed border-slate-200 bg-slate-50 px-4 py-10 text-center text-sm text-slate-500">
                      No recent payment alerts.
                    </div>
                  )}
                </div>
              </div>

              <div className="rounded-[2rem] border border-slate-200 bg-white p-5 shadow-sm">
                <div className="flex items-center gap-3">
                  <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-indigo-100 text-indigo-700">
                    <ShieldAlert size={22} />
                  </div>
                  <div>
                    <h3 className="text-lg font-display font-bold text-slate-900">Recovery Requests</h3>
                    <p className="text-sm text-slate-500">Approve password help requests directly from the dashboard.</p>
                  </div>
                </div>
                <div className="mt-5 space-y-3">
                  {pwRequests.length > 0 ? pwRequests.slice(0, 5).map(req => (
                    <div key={req._id} className="rounded-2xl border border-indigo-100 bg-indigo-50 px-4 py-3">
                      <div className="flex items-start justify-between gap-3">
                        <div>
                          <p className="text-sm font-bold text-indigo-900">{req.srvNumber}</p>
                          <p className="mt-1 text-xs font-semibold uppercase tracking-[0.14em] text-indigo-600">{req.role}</p>
                        </div>
                        <p className="text-[11px] font-semibold text-indigo-600">{new Date(req.createdAt).toLocaleDateString()}</p>
                      </div>
                      {resettingPwFor?._id === req._id ? (
                        <div className="mt-3 flex gap-2">
                          <input type="text" placeholder="New password" value={newAdminProvidedPw} onChange={e => setNewAdminProvidedPw(e.target.value)} className="w-full rounded-xl border border-indigo-200 bg-white px-3 py-2 text-sm font-semibold outline-none focus:ring-2 focus:ring-indigo-500" />
                          <button onClick={handleApprovePwReset} className="rounded-xl bg-indigo-600 px-4 py-2 text-sm font-bold text-white hover:bg-indigo-700">Save</button>
                          <button onClick={() => { setResettingPwFor(null); setNewAdminProvidedPw(''); }} className="rounded-xl bg-slate-200 px-4 py-2 text-sm font-bold text-slate-700 hover:bg-slate-300">Cancel</button>
                        </div>
                      ) : (
                        <button onClick={() => setResettingPwFor(req)} className="mt-3 rounded-xl border border-indigo-200 bg-white px-4 py-2 text-sm font-bold text-indigo-700 transition hover:bg-indigo-600 hover:text-white">
                          Reset Request
                        </button>
                      )}
                    </div>
                  )) : (
                    <div className="rounded-2xl border border-dashed border-slate-200 bg-slate-50 px-4 py-10 text-center text-sm text-slate-500">
                      No recovery requests right now.
                    </div>
                  )}
                </div>
              </div>
            </div>
          </section>

          <section className="rounded-[2rem] border border-slate-200 bg-white p-5 shadow-sm sm:p-6">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">Admin Apps</p>
              <h2 className="mt-1 text-2xl font-display font-bold text-slate-900">Tap an icon to open its page</h2>
              <p className="mt-1 text-sm text-slate-500">Built for clean mobile navigation and quick desktop access.</p>
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

  if (activeSection === 'home') {
    return renderHomePage();
  }

  return (
    <div className="min-h-screen bg-slate-50">
      <PortalHeader
        title={pageMeta[activeSection]?.title || 'Admin Portal'}
        subtitle="SRV Matriculation School"
        onBack={() => navigateToSection('home')}
        onLogout={handleLogout}
      >
        {notificationAction}
      </PortalHeader>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
        {activeSection !== 'home' && pageMeta[activeSection] && (
          <div className="mb-8 rounded-3xl border border-slate-200 bg-white px-6 py-5 shadow-sm">
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">Admin Apps</p>
            <h2 className="mt-2 text-2xl font-display font-bold text-slate-900">{pageMeta[activeSection].title}</h2>
            <p className="mt-2 max-w-3xl text-sm leading-6 text-slate-500">{pageMeta[activeSection].description}</p>
          </div>
        )}
        
        {/* Stats Row */}
        <div className="hidden grid-cols-1 md:grid-cols-3 gap-6 mb-10">
          <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100 flex items-center gap-5">
            <div className="w-14 h-14 bg-emerald-100 text-emerald-600 rounded-xl flex items-center justify-center">
              <Users size={28} />
            </div>
            <div>
              <p className="text-sm font-semibold text-slate-500 mb-1">Total Students</p>
              <h3 className="text-3xl font-display font-bold text-slate-900">{stats.totalStudents}</h3>
            </div>
          </div>
          
          <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100 flex items-center gap-5">
            <div className="w-14 h-14 bg-amber-100 text-amber-600 rounded-xl flex items-center justify-center">
              <BookOpen size={28} />
            </div>
            <div>
              <p className="text-sm font-semibold text-slate-500 mb-1">Total Faculty</p>
              <h3 className="text-3xl font-display font-bold text-slate-900">{stats.totalFaculty}</h3>
            </div>
          </div>
        </div>

        {/* Action Panels */}
        <div className={`${activeSection === 'faculty' || activeSection === 'students' ? 'grid' : 'hidden'} md:grid-cols-2 gap-8`}>
          
          {/* Add Faculty */}
          <div className={`${activeSection === 'faculty' ? 'block' : 'hidden'} bg-white rounded-2xl shadow-sm border border-slate-100 p-8`}>
            <div className="flex items-center gap-3 mb-6">
              <UserPlus className="text-emerald-600" />
              <h2 className="text-xl font-display font-bold text-slate-900">Add New Faculty</h2>
            </div>
            {facultyMsg.text && (
              <div className={`mb-4 px-4 py-3 rounded-lg text-sm font-semibold ${facultyMsg.type === 'success' ? 'bg-emerald-100 text-emerald-800 border border-emerald-200' : 'bg-red-100 text-red-800 border border-red-200'}`}>
                {facultyMsg.text}
              </div>
            )}
            <form onSubmit={handeFacultySubmit} className="space-y-4">
              <input 
                type="text" 
                placeholder="Full Name" 
                required
                value={facultyForm.name}
                onChange={e => setFacultyForm({...facultyForm, name: e.target.value})}
                className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500" 
              />
              <div className="grid grid-cols-3 gap-4">
                <input 
                  type="text" 
                  placeholder="Grade" 
                  required
                  value={facultyForm.assignedGrade}
                  onChange={e => setFacultyForm({...facultyForm, assignedGrade: e.target.value})}
                  className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500" 
                />
                <input 
                  type="text" 
                  placeholder="Section" 
                  required
                  value={facultyForm.assignedSection}
                  onChange={e => setFacultyForm({...facultyForm, assignedSection: e.target.value})}
                  className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500" 
                />
                <input 
                  type="text" 
                  placeholder="Mobile" 
                  required
                  value={facultyForm.mobileNumber}
                  onChange={e => setFacultyForm({...facultyForm, mobileNumber: e.target.value})}
                  className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500" 
                />
              </div>
              <button type="submit" className="w-full py-3 bg-emerald-600 text-white font-bold rounded-xl hover:bg-emerald-700 transition-colors">
                Create Faculty Account
              </button>
            </form>
          </div>

          {/* Add Student */}
          <div className={`${activeSection === 'students' ? 'block' : 'hidden'} bg-white rounded-2xl shadow-sm border border-slate-100 p-8`}>
            <div className="flex items-center gap-3 mb-6">
              <UserPlus className="text-amber-500" />
              <h2 className="text-xl font-display font-bold text-slate-900">Admit New Student</h2>
            </div>
            {studentMsg.text && (
              <div className={`mb-4 px-4 py-3 rounded-lg text-sm font-semibold ${studentMsg.type === 'success' ? 'bg-amber-100 text-amber-800 border border-amber-200' : 'bg-red-100 text-red-800 border border-red-200'}`}>
                {studentMsg.text}
              </div>
            )}
            <form onSubmit={handleStudentSubmit} className="space-y-4">
              <input 
                type="text" 
                placeholder="Student Full Name" 
                required
                value={studentForm.name}
                onChange={e => setStudentForm({...studentForm, name: e.target.value})}
                className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-amber-500" 
              />
              <input 
                type="text" 
                inputMode="numeric"
                placeholder="Admission Number (e.g., 1695) — leave empty for auto" 
                value={studentForm.admissionNumber}
                onChange={e => { const v = e.target.value.replace(/\D/g, ''); setStudentForm({...studentForm, admissionNumber: v}); }}
                className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-amber-500 font-mono" 
              />
              <div className="grid grid-cols-3 gap-4">
                <input 
                  type="text" 
                  placeholder="Grade" 
                  required
                  value={studentForm.grade}
                  onChange={e => setStudentForm({...studentForm, grade: e.target.value, group: ''})}
                  className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-amber-500" 
                />
                <input 
                  type="text" 
                  placeholder="Section" 
                  required
                  value={studentForm.section}
                  onChange={e => setStudentForm({...studentForm, section: e.target.value})}
                  className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-amber-500" 
                />
                <input 
                  type="text" 
                  placeholder="DOB (DDMMYYYY)" 
                  required
                  value={studentForm.dateOfBirth}
                  onChange={e => setStudentForm({...studentForm, dateOfBirth: e.target.value})}
                  className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-amber-500" 
                />
              </div>
              <div className="grid md:grid-cols-2 gap-4">
                <input 
                  type="text" 
                  placeholder="Mother Name" 
                  value={studentForm.motherName}
                  onChange={e => setStudentForm({...studentForm, motherName: e.target.value})}
                  className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-amber-500" 
                />
                <input 
                  type="text" 
                  placeholder="Father Name" 
                  value={studentForm.fatherName}
                  onChange={e => setStudentForm({...studentForm, fatherName: e.target.value})}
                  className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-amber-500" 
                />
              </div>
              <input 
                type="text" 
                placeholder="Guardian Name (if parent names are not available)" 
                value={studentForm.guardianName}
                onChange={e => setStudentForm({...studentForm, guardianName: e.target.value})}
                className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-amber-500" 
              />
              {isSeniorGrade(studentForm.grade) && (
                <input 
                  type="text" 
                  placeholder="Group Details (e.g. Science, Commerce, Arts)" 
                  required
                  value={studentForm.group}
                  onChange={e => setStudentForm({...studentForm, group: e.target.value})}
                  className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-amber-500" 
                />
              )}
              <button type="submit" className="w-full py-3 bg-amber-500 text-white font-bold rounded-xl hover:bg-amber-600 transition-colors">
                Admit Student & Generate Parent Login
              </button>
              <p className="text-xs text-slate-500 text-center mt-2 flex items-center justify-center gap-1">
                <CheckCircle2 size={12} className="text-emerald-500" /> Enter mother and father names, or add a guardian. SRV prefix auto-added if you leave admission # blank.
              </p>
            </form>
          </div>

        </div>

        {/* Global Settings & Alerts */}
        <div className={`${activeSection === 'announcements' ? 'grid' : 'hidden'} md:grid-cols-3 gap-8 mt-8`}>
          {/* Global Settings */}
          <div className="hidden bg-white rounded-2xl shadow-sm border border-slate-100 p-8">
            <h2 className="text-xl font-display font-bold text-slate-900 mb-6 flex items-center gap-3">
              ⚙️ Global Settings
            </h2>
            <div className="flex items-center justify-between p-4 border border-slate-200 rounded-xl bg-slate-50">
              <div>
                <h3 className="font-bold text-slate-800">Online Fee Collection</h3>
                <p className="text-sm text-slate-500">Allow parents to pay term fees directly via portal.</p>
              </div>
              <button 
                onClick={handleToggleOnlineFee}
                className={`relative inline-flex h-7 w-12 items-center rounded-full transition-colors focus:outline-none ${isOnlineFeeEnabled ? 'bg-emerald-500' : 'bg-slate-300'}`}
              >
                <span className={`inline-block h-5 w-5 transform rounded-full bg-white transition-transform ${isOnlineFeeEnabled ? 'translate-x-6' : 'translate-x-1'}`} />
              </button>
            </div>
          </div>

          {/* Fee Alerts */}
          <div className="hidden bg-white rounded-2xl shadow-sm border border-slate-100 p-8">
            <h2 className="text-xl font-display font-bold text-slate-900 mb-6 flex items-center gap-3">
              🔔 Recent Payment Alerts
            </h2>
            <div className="space-y-3 max-h-48 overflow-y-auto pr-2">
              {feeAlerts.length > 0 ? feeAlerts.map(alert => (
                <div key={alert._id} className="p-3 bg-emerald-50 border border-emerald-100 rounded-xl text-sm">
                  <p className="text-emerald-800 font-semibold">{alert.message}</p>
                  <p className="text-[10px] text-emerald-600 font-bold mt-1 uppercase tracking-wider">{new Date(alert.createdAt).toLocaleString()}</p>
                </div>
              )) : (
                <p className="text-slate-500 text-sm text-center py-4 italic">No recent payments logged.</p>
              )}
            </div>
          </div>

          {/* Password Reset Requests */}
          <div className="hidden bg-white rounded-2xl shadow-sm border border-slate-100 p-8">
            <h2 className="text-xl font-display font-bold text-slate-900 mb-6 flex items-center gap-3">
              🔑 Recovery Requests
            </h2>
            <div className="space-y-3 max-h-48 overflow-y-auto pr-2">
              {pwRequests.length > 0 ? pwRequests.map(req => (
                <div key={req._id} className="p-3 bg-indigo-50 border border-indigo-100 rounded-xl text-sm">
                  <div className="flex justify-between items-start mb-2">
                    <p className="text-indigo-800 font-bold">{req.srvNumber} <span className="text-xs bg-indigo-200 text-indigo-800 px-2 py-0.5 rounded ml-1">{req.role}</span></p>
                    <p className="text-[10px] text-indigo-600 font-bold uppercase tracking-wider">{new Date(req.createdAt).toLocaleDateString()}</p>
                  </div>
                  {resettingPwFor?._id === req._id ? (
                    <div className="flex gap-2">
                      <input 
                        type="text" 
                        placeholder="New Pass..."
                        value={newAdminProvidedPw}
                        onChange={e => setNewAdminProvidedPw(e.target.value)}
                        className="flex-1 px-2 py-1 text-xs font-bold border border-indigo-200 rounded outline-none w-full"
                      />
                      <button onClick={handleApprovePwReset} className="bg-indigo-600 hover:bg-indigo-700 text-white text-[10px] font-bold px-2 py-1 rounded transition">Save</button>
                      <button onClick={() => { setResettingPwFor(null); setNewAdminProvidedPw(''); }} className="bg-slate-200 hover:bg-slate-300 text-slate-600 text-[10px] font-bold px-2 py-1 rounded transition">X</button>
                    </div>
                  ) : (
                    <button onClick={() => setResettingPwFor(req)} className="w-full bg-white border border-indigo-200 text-indigo-600 text-xs font-bold py-1.5 rounded-lg hover:bg-indigo-600 hover:text-white transition">Action Reset</button>
                  )}
                </div>
              )) : (
                <p className="text-slate-500 text-sm text-center py-4 italic">No pending requests.</p>
              )}
            </div>
          </div>

          {/* Announcement Maker */}
          <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-8 mt-8 md:col-span-3">
            <div className="flex items-center gap-3 mb-6">
              <Megaphone className="text-blue-600" />
              <h2 className="text-xl font-display font-bold text-slate-900">Broadcast Announcement</h2>
            </div>
            
            {announcementMsg.text && (
              <div className={`mb-4 px-4 py-3 rounded-lg text-sm font-semibold ${announcementMsg.type === 'success' ? 'bg-emerald-100 text-emerald-800 border border-emerald-200' : 'bg-red-100 text-red-800 border border-red-200'}`}>
                {announcementMsg.text}
              </div>
            )}

            <form onSubmit={submitAnnouncement} className="space-y-4 mb-6">
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-2">Announcement Title</label>
                <input 
                  type="text" 
                  placeholder="e.g., School Assembly Cancelled"
                  value={announcementForm.title}
                  onChange={e => setAnnouncementForm({...announcementForm, title: e.target.value})}
                  className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-2">Message</label>
                <textarea 
                  placeholder="Write your announcement message..."
                  rows="4"
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
                  <label className="block text-sm font-semibold text-slate-700 mb-2">Target Type</label>
                  <select 
                    value={announcementForm.targetType}
                    onChange={e => {
                      setAnnouncementForm({...announcementForm, targetType: e.target.value, targetGrade: '', targetSection: ''});
                      setSelectedAnnouncementFaculties([]);
                    }}
                    className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="students">All Students</option>
                    <option value="class">Specific Grade & Section</option>
                    <option value="faculty">Faculty Members</option>
                  </select>
                </div>
              </div>

              {announcementForm.targetType === 'class' && (
                <div className="grid md:grid-cols-2 gap-4">
                  <input 
                    type="text" 
                    placeholder="Grade (e.g., 10)"
                    value={announcementForm.targetGrade}
                    onChange={e => setAnnouncementForm({...announcementForm, targetGrade: e.target.value})}
                    className="px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm outline-none focus:ring-2 focus:ring-blue-500"
                  />
                  <input 
                    type="text" 
                    placeholder="Section (e.g., A)"
                    value={announcementForm.targetSection}
                    onChange={e => setAnnouncementForm({...announcementForm, targetSection: e.target.value})}
                    className="px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              )}

              {announcementForm.targetType === 'faculty' && (
                <div className="bg-slate-50 rounded-xl p-4 border border-slate-200">
                  <label className="block text-sm font-semibold text-slate-700 mb-3">Select Faculty Members</label>
                  <div className="space-y-2 max-h-48 overflow-y-auto">
                    {faculties.length > 0 ? faculties.map(faculty => (
                      <label key={faculty._id} className="flex items-center gap-3 p-2 rounded-lg hover:bg-white transition-colors cursor-pointer">
                        <input 
                          type="checkbox" 
                          checked={selectedAnnouncementFaculties.includes(faculty._id)}
                          onChange={e => {
                            if (e.target.checked) {
                              setSelectedAnnouncementFaculties([...selectedAnnouncementFaculties, faculty._id]);
                            } else {
                              setSelectedAnnouncementFaculties(selectedAnnouncementFaculties.filter(id => id !== faculty._id));
                            }
                          }}
                          className="w-4 h-4 rounded border-2 border-slate-300 accent-blue-600 cursor-pointer"
                        />
                        <div className="flex-1">
                          <p className="text-sm font-semibold text-slate-900">{faculty.name}</p>
                          <p className="text-xs text-slate-500">{faculty.srvNumber} · Grade {faculty.assignedGrade} - {faculty.assignedSection}</p>
                        </div>
                        {selectedAnnouncementFaculties.includes(faculty._id) && (
                          <span className="text-blue-600 font-bold text-sm">✓</span>
                        )}
                      </label>
                    )) : (
                      <p className="text-slate-500 text-sm text-center py-4">No faculty members found</p>
                    )}
                  </div>
                  <p className="text-xs text-slate-500 mt-2">
                    {selectedAnnouncementFaculties.length > 0 ? `${selectedAnnouncementFaculties.length} faculty member${selectedAnnouncementFaculties.length > 1 ? 's' : ''} selected` : 'Select at least one faculty member'}
                  </p>
                </div>
              )}

              <button type="submit" className="w-full py-3 bg-blue-600 text-white font-bold rounded-xl hover:bg-blue-700 transition-colors">
                📢 Publish Announcement
              </button>
            </form>

            {/* Recent Announcements */}
            <div className="border-t border-slate-200 pt-6">
              <h3 className="font-bold text-slate-900 mb-4">Recent Announcements ({announcements.length})</h3>
              <div className="space-y-3 max-h-64 overflow-y-auto pr-2">
                {announcements.length > 0 ? announcements.slice(0, 5).map(ann => (
                  <div key={ann._id} className={`p-3 rounded-xl border-l-4 ${ann.priority === 'HIGH' ? 'bg-red-50 border-l-red-500' : ann.priority === 'MEDIUM' ? 'bg-amber-50 border-l-amber-500' : 'bg-slate-50 border-l-slate-500'}`}>
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex-1">
                        <p className="font-bold text-sm text-slate-900">{ann.title}</p>
                        <p className="text-xs text-slate-600 line-clamp-1">{ann.message}</p>
                        <p className="text-[10px] text-slate-500 mt-1">{new Date(ann.createdAt).toLocaleDateString()} · {ann.type === 'CLASS' ? `Grade ${ann.targetGrade} - ${ann.targetSection}` : 'All Students'}</p>
                      </div>
                      <button onClick={() => deleteAnnouncement(ann._id)} className="text-red-500 hover:text-red-700 p-1"><Trash2 size={16} /></button>
                    </div>
                  </div>
                )) : (
                  <p className="text-slate-400 text-sm text-center py-4">No announcements yet</p>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Cafeteria Menu Panel */}
        <div className={`${activeSection === 'cafeteria' ? 'block' : 'hidden'} mt-8 bg-white rounded-2xl shadow-sm border border-slate-100 p-8`}>
          <div className="flex items-center gap-3 mb-6">
            <Coffee className="text-orange-500" />
            <h2 className="text-xl font-display font-bold text-slate-900">Manage Cafeteria Menu</h2>
          </div>
          
          {foodMsg.text && (
            <div className={`mb-4 px-4 py-3 rounded-lg text-sm font-semibold ${foodMsg.type === 'success' ? 'bg-orange-100 text-orange-800 border border-orange-200' : 'bg-red-100 text-red-800 border border-red-200'}`}>
              {foodMsg.text}
            </div>
          )}

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'].map(day => {
              const isWeekend = day === 'Saturday' || day === 'Sunday';
              const dayMenu = weeklyMenu.find(m => m.day === day) || { breakfast: '', lunch: '', snacks: '' };
              const isEditing = editingDay === day;

              return (
                <div key={day} className={`p-4 rounded-xl border ${isWeekend ? 'bg-slate-50 border-slate-200 opacity-70' : 'bg-white border-slate-200 shadow-sm'}`}>
                  <div className="flex items-center justify-between mb-3 border-b border-slate-100 pb-2">
                    <h3 className="font-bold text-slate-800">{day}</h3>
                    {!isWeekend && (
                      isEditing ? (
                        <div className="flex gap-2">
                          <button onClick={() => handleSaveFood(day)} className="text-emerald-600 hover:text-emerald-700 p-1"><CheckCircle2 size={18} /></button>
                          <button onClick={() => setEditingDay(null)} className="text-slate-400 hover:text-slate-600 p-1"><X size={18} /></button>
                        </div>
                      ) : (
                        <button onClick={() => { setEditingDay(day); setEditFoodForm({ breakfast: dayMenu.breakfast, lunch: dayMenu.lunch, snacks: dayMenu.snacks }); }} className="text-blue-500 hover:text-blue-700 text-xs font-semibold flex items-center gap-1"><Edit2 size={12}/> Edit</button>
                      )
                    )}
                  </div>
                  
                  {isWeekend ? (
                    <div className="py-8 text-center flex flex-col items-center justify-center">
                      <p className="text-slate-400 font-bold uppercase tracking-widest text-sm">Holiday</p>
                    </div>
                  ) : (
                    <div className="space-y-3 text-sm">
                      <div>
                        <p className="text-[10px] text-slate-500 font-bold mb-1 uppercase tracking-wider">Breakfast</p>
                        {isEditing ? <input type="text" value={editFoodForm.breakfast} onChange={e => setEditFoodForm({...editFoodForm, breakfast: e.target.value})} className="w-full border rounded px-2 py-1 outline-none focus:ring-1 focus:ring-orange-500 text-xs" /> : <p className="font-medium text-slate-800 text-xs">{dayMenu.breakfast || '-'}</p>}
                      </div>
                      <div>
                        <p className="text-[10px] text-slate-500 font-bold mb-1 uppercase tracking-wider">Lunch</p>
                        {isEditing ? <input type="text" value={editFoodForm.lunch} onChange={e => setEditFoodForm({...editFoodForm, lunch: e.target.value})} className="w-full border rounded px-2 py-1 outline-none focus:ring-1 focus:ring-orange-500 text-xs" /> : <p className="font-medium text-slate-800 text-xs">{dayMenu.lunch || '-'}</p>}
                      </div>
                      <div>
                        <p className="text-[10px] text-slate-500 font-bold mb-1 uppercase tracking-wider">Snacks</p>
                        {isEditing ? <input type="text" value={editFoodForm.snacks} onChange={e => setEditFoodForm({...editFoodForm, snacks: e.target.value})} className="w-full border rounded px-2 py-1 outline-none focus:ring-1 focus:ring-orange-500 text-xs" /> : <p className="font-medium text-slate-800 text-xs">{dayMenu.snacks || '-'}</p>}
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
        {/* Manage Faculty Panel */}
        <div className={`${activeSection === 'faculty' ? 'block' : 'hidden'} mt-8 bg-white rounded-2xl shadow-sm border border-slate-100 p-8`}>
          <div className="flex items-center gap-3 mb-6">
            <Users className="text-blue-500" />
            <h2 className="text-xl font-display font-bold text-slate-900">Manage Faculty</h2>
          </div>
          
          {manageFacultyMsg.text && (
            <div className={`mb-4 px-4 py-3 rounded-lg text-sm font-semibold ${manageFacultyMsg.type === 'success' ? 'bg-blue-100 text-blue-800 border border-blue-200' : 'bg-red-100 text-red-800 border border-red-200'}`}>
              {manageFacultyMsg.text}
            </div>
          )}

          <div className="overflow-x-auto rounded-xl border border-slate-200">
            <table className="w-full text-left border-collapse min-w-[700px]">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-200 text-sm text-slate-500">
                  <th className="px-5 py-3 font-semibold">FAC No</th>
                  <th className="px-5 py-3 font-semibold">Name</th>
                  <th className="px-5 py-3 font-semibold">Mobile</th>
                  <th className="px-5 py-3 font-semibold">Grade</th>
                  <th className="px-5 py-3 font-semibold">Section / Password</th>
                  <th className="px-5 py-3 font-semibold text-center w-[120px]">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-sm">
                {faculties.map(faculty => (
                  <tr key={faculty._id} className="hover:bg-slate-50/50">
                    <td className="px-5 py-4 font-mono font-medium text-slate-600 border-b border-slate-50">
                      {faculty.srvNumber}
                    </td>
                    <td className="px-5 py-4 font-semibold text-slate-900 border-b border-slate-50">{faculty.name}</td>
                    <td className="px-5 py-4 font-semibold text-slate-700 border-b border-slate-50">{faculty.mobileNumber || '-'}</td>
                    <td className="px-5 py-4 font-semibold text-slate-700 border-b border-slate-50">{faculty.assignedGrade || '-'}</td>
                    <td className="px-5 py-4 font-semibold text-slate-700 border-b border-slate-50">{faculty.assignedSection || '-'}</td>
                    <td className="px-5 py-4 flex items-center justify-center gap-3 border-b border-slate-50">
                      <button onClick={() => openFacultyProfile(faculty)} className="text-emerald-600 hover:text-emerald-800 font-semibold text-xs hover:underline flex items-center gap-1" title="View Profile & Assign Students">
                        Profile
                      </button>
                      <button onClick={() => startEditing(faculty)} className="text-blue-600 hover:text-blue-800 font-semibold text-xs hover:underline flex items-center gap-1" title="Edit Faculty">
                        <Edit2 size={14} /> Edit
                      </button>
                      <button onClick={() => handleDeleteFaculty(faculty._id)} className="text-red-500 hover:text-red-700 p-1.5 rounded-lg hover:bg-red-50" title="Delete">
                        <Trash2 size={16} />
                      </button>
                    </td>
                  </tr>
                ))}
                {faculties.length === 0 && (
                  <tr>
                    <td colSpan="6" className="px-5 py-8 text-center text-slate-500 border-b border-slate-50">No faculty members found.</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Manage Students Panel */}
        <div className={`${activeSection === 'students' || activeSection === 'promote' ? 'block' : 'hidden'} mt-8 bg-white rounded-2xl shadow-sm border border-slate-100 p-8`}>
          <div className={`flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6 ${activeSection === 'promote' ? 'hidden' : 'flex'}`}>
            <div className="flex items-center gap-3">
              <Users className="text-purple-500" />
              <h2 className="text-xl font-display font-bold text-slate-900">View All Students</h2>
            </div>
            <div className="flex gap-3">
              <input type="text" placeholder="Filter Class (e.g. 10)" value={studentListFilter.grade} onChange={e => setStudentListFilter({...studentListFilter, grade: e.target.value})} className="px-4 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm outline-none focus:ring-2 focus:ring-purple-500 w-40" />
              <input type="text" placeholder="Filter Section (e.g. A)" value={studentListFilter.section} onChange={e => setStudentListFilter({...studentListFilter, section: e.target.value})} className="px-4 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm outline-none focus:ring-2 focus:ring-purple-500 w-40" />
            </div>
          </div>
          
          {activeSection !== 'promote' && manageStudentMsg.text && (
            <div className={`mb-6 p-4 rounded-xl flex items-center gap-3 text-sm font-semibold border ${manageStudentMsg.type === 'success' ? 'bg-emerald-50 text-emerald-600 border-emerald-200' : 'bg-red-50 text-red-600 border-red-200'}`}>
              <CheckCircle2 size={18} /> {manageStudentMsg.text}
            </div>
          )}

          <div className={`${activeSection === 'students' ? 'block' : 'hidden'} overflow-x-auto rounded-xl border border-slate-200`}>
            <table className="w-full text-left border-collapse min-w-[980px]">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-200 text-sm text-slate-500">
                  <th className="px-5 py-3 font-semibold">SRV No</th>
                  <th className="px-5 py-3 font-semibold">Name</th>
                  <th className="px-5 py-3 font-semibold">Grade & Sec</th>
                  <th className="px-5 py-3 font-semibold">Family Details</th>
                  <th className="px-5 py-3 font-semibold">Class In-Charge</th>
                  <th className="px-5 py-3 font-semibold text-center">Fee Status (Overall)</th>
                  <th className="px-5 py-3 font-semibold text-center w-[120px]">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-sm">
                {allStudents.filter(s => {
                  if (studentListFilter.grade && s.grade.toLowerCase() !== studentListFilter.grade.toLowerCase()) return false;
                  if (studentListFilter.section && s.section.toLowerCase() !== studentListFilter.section.toLowerCase()) return false;
                  return true;
                }).map(student => (
                  <tr key={student._id} className="hover:bg-slate-50/50">
                    <td className="px-5 py-4 font-mono font-medium text-slate-600 border-b border-slate-50">
                      {editingSrvId === student._id ? (
                        <div className="flex items-center gap-1">
                          <span className="text-slate-400 text-xs">SRV</span>
                          <input 
                            type="text" 
                            inputMode="numeric"
                            value={editSrvValue} 
                            onChange={e => setEditSrvValue(e.target.value.replace(/\D/g, ''))}
                            className="w-20 px-2 py-1 border border-purple-300 rounded-lg focus:ring-2 focus:ring-purple-500 outline-none text-xs font-mono"
                            autoFocus
                          />
                          <button onClick={async () => {
                            try {
                              const token = localStorage.getItem('schoolToken');
                              await axios.put(`${API_URL}/api/admin/student/${student._id}/srv`, { admissionNumber: editSrvValue }, { headers: { Authorization: `Bearer ${token}` }});
                              Swal.fire({toast: true, position: 'top-end', icon: 'success', title: 'SRV updated. Parent login ID changed, password unchanged.', showConfirmButton: false, timer: 2500});
                              setEditingSrvId(null);
                              fetchStudents(token);
                            } catch (err) {
                              Swal.fire('Error', err.response?.data?.message || 'Failed to update SRV', 'error');
                            }
                          }} className="p-1 bg-emerald-100 text-emerald-700 rounded hover:bg-emerald-200" title="Save"><Save size={12}/></button>
                          <button onClick={() => setEditingSrvId(null)} className="p-1 bg-slate-100 text-slate-600 rounded hover:bg-slate-200" title="Cancel"><X size={12}/></button>
                        </div>
                      ) : (
                        <span className="cursor-pointer hover:text-purple-600" onClick={() => { setEditingSrvId(student._id); setEditSrvValue(student.srvNumber.replace(/\D/g, '')); }} title="Click to edit SRV number">
                          {student.srvNumber}
                        </span>
                      )}
                    </td>
                    <td className="px-5 py-4 font-semibold text-slate-900 border-b border-slate-50">{student.name}</td>
                    <td className="px-5 py-4 font-semibold text-slate-700 border-b border-slate-50">
                      <div>{student.grade}-{student.section}</div>
                      {student.group && <div className="text-xs text-slate-400 mt-1">{student.group}</div>}
                    </td>
                    <td className="px-5 py-4 text-slate-700 border-b border-slate-50">
                      <div className={getFamilySummary(student) === 'Missing family details' ? 'font-semibold text-red-500' : 'text-xs leading-5'}>
                        {getFamilySummary(student)}
                      </div>
                    </td>
                    <td className="px-5 py-4 font-semibold text-slate-700 border-b border-slate-50">
                      {student.facultyId ? student.facultyId.name : <span className="text-slate-400 italic">Unassigned</span>}
                    </td>
                    <td className="px-5 py-4 text-center border-b border-slate-50">
                      <span className={`px-2.5 py-1 rounded-lg text-xs font-bold ${student.fees?.overall === 'Paid' ? 'bg-emerald-100 text-emerald-700' : 'bg-slate-100 text-slate-500'}`}>
                        {student.fees?.overall || 'Unpaid'}
                      </span>
                    </td>
                    <td className="px-5 py-4 flex items-center justify-center gap-2 border-b border-slate-50">
                      <button onClick={() => openStudentEditor(student)} className="text-blue-600 hover:text-blue-800 font-semibold text-xs hover:underline flex items-center gap-1" title="Edit Student">
                        <Edit2 size={12}/> Edit
                      </button>
                      <button onClick={() => setSelectedStudentForFees(student)} className="text-purple-600 hover:text-purple-800 font-semibold text-xs hover:underline" title="Manage Fees">
                        Fees
                      </button>
                      <button onClick={() => handleDeleteStudent(student._id)} className="text-red-500 hover:text-red-700 p-1 rounded-lg hover:bg-red-50 shrink-0" title="Delete">
                        <Trash2 size={14}/>
                      </button>
                    </td>
                  </tr>
                ))}
                {allStudents.length === 0 && (
                  <tr>
                    <td colSpan="7" className="px-5 py-8 text-center text-slate-500 border-b border-slate-50">No students found.</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

          {/* Promote Students Panel */}
          <div className={`${activeSection === 'promote' ? 'block' : 'hidden'} mt-6 p-6 bg-gradient-to-r from-emerald-50 to-amber-50 border border-emerald-200 rounded-2xl`}>
            <h3 className="font-display font-bold text-slate-900 mb-1 flex items-center gap-2">
              🎓 Promote Students (Academic Year)
            </h3>
            <p className="text-xs text-slate-500 mb-4">Move all students from one grade to the next. This is typically done after April each year.</p>
            <div className="flex flex-col sm:flex-row items-center gap-3">
              <div className="flex-1 w-full">
                <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1 block">From Grade</label>
                <select value={promoteFrom} onChange={e => setPromoteFrom(e.target.value)} className="w-full px-4 py-3 bg-white border border-slate-200 rounded-xl focus:ring-2 focus:ring-emerald-500 outline-none text-sm font-semibold">
                  <option value="">Select Current Grade</option>
                  {['LKG','UKG','1','2','3','4','5','6','7','8','9','10','11','12'].map(g => <option key={g} value={g}>{g}</option>)}
                </select>
              </div>
              <span className="text-2xl text-emerald-600 font-bold hidden sm:block mt-4">→</span>
              <div className="flex-1 w-full">
                <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1 block">To Grade</label>
                <select value={promoteTo} onChange={e => setPromoteTo(e.target.value)} className="w-full px-4 py-3 bg-white border border-slate-200 rounded-xl focus:ring-2 focus:ring-emerald-500 outline-none text-sm font-semibold">
                  <option value="">Select New Grade</option>
                  {['LKG','UKG','1','2','3','4','5','6','7','8','9','10','11','12','PASSED OUT'].map(g => <option key={g} value={g}>{g}</option>)}
                </select>
              </div>
              <button onClick={handlePromoteStudents} className="w-full sm:w-auto px-8 py-3 mt-4 sm:mt-5 bg-emerald-600 text-white font-bold rounded-xl hover:bg-emerald-500 transition-colors shadow-lg shadow-emerald-600/20 shrink-0">
                Promote All
              </button>
            </div>
          </div>
        </div>

      </div>

      <div className={`${activeSection === 'events' || activeSection === 'polls' || activeSection === 'feedback' ? 'block' : 'hidden'} max-w-7xl mx-auto px-6 pb-10`}>
        {activeSection === 'events' && <UpcomingEventsSection role="admin" />}
        {activeSection === 'polls' && <OpinionPollSection role="admin" />}
        {activeSection === 'feedback' && <FeedbackInboxSection role="admin" />}
      </div>
      
      {selectedFacultyProfile && (
        <FacultyProfileModal 
          faculty={selectedFacultyProfile} 
          allStudents={allStudents} 
          onClose={() => setSelectedFacultyProfile(null)} 
          onUpdate={() => {
            const token = localStorage.getItem('schoolToken');
            fetchFaculties(token);
            fetchStudents(token);
          }} 
        />
      )}

      {editingStudentId && (
        <div className="fixed inset-0 z-[56] flex items-center justify-center bg-slate-900/60 p-4 backdrop-blur-sm">
          <div className="absolute inset-0" onClick={closeStudentEditor} />
          <div className="relative z-10 w-full max-w-5xl rounded-[2rem] border border-slate-200 bg-white p-6 shadow-2xl sm:p-8">
            <div className="flex items-start justify-between gap-4 mb-6">
              <div>
                <h3 className="text-2xl font-display font-bold text-slate-900">Edit Student Profile</h3>
                <p className="text-sm text-slate-500 mt-1">Update student information and family details from one popup.</p>
              </div>
              <button
                type="button"
                onClick={closeStudentEditor}
                className="rounded-xl px-3 py-2 text-sm font-bold text-slate-400 transition-colors hover:bg-slate-100 hover:text-slate-700"
              >
                Close
              </button>
            </div>

            <form
              onSubmit={(event) => {
                event.preventDefault();
                handleUpdateStudent(editingStudentId);
              }}
              className="space-y-5"
            >
              <div className="grid gap-4 md:grid-cols-3">
                <div>
                  <label className="mb-2 block text-sm font-semibold text-slate-700">SRV Number</label>
                  <div className="relative">
                    <span className="absolute left-4 top-1/2 -translate-y-1/2 text-sm font-bold text-slate-400">SRV</span>
                    <input
                      type="text"
                      inputMode="numeric"
                      value={editStudentForm.admissionNumber}
                      onChange={e => setEditStudentForm({ ...editStudentForm, admissionNumber: e.target.value.replace(/\D/g, '') })}
                      className="w-full rounded-xl border border-slate-200 bg-slate-50 py-3 pl-14 pr-4 outline-none focus:ring-2 focus:ring-purple-500"
                      placeholder="26001"
                    />
                  </div>
                </div>
                <div>
                  <label className="mb-2 block text-sm font-semibold text-slate-700">Student Name</label>
                  <input
                    type="text"
                    value={editStudentForm.name}
                    onChange={e => setEditStudentForm({ ...editStudentForm, name: e.target.value })}
                    className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 outline-none focus:ring-2 focus:ring-purple-500"
                    placeholder="Student name"
                  />
                </div>
                <div>
                  <label className="mb-2 block text-sm font-semibold text-slate-700">Grade</label>
                  <input
                    type="text"
                    value={editStudentForm.grade}
                    onChange={e => setEditStudentForm({ ...editStudentForm, grade: e.target.value, group: '' })}
                    className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 outline-none focus:ring-2 focus:ring-purple-500"
                    placeholder="Grade"
                  />
                </div>
                <div>
                  <label className="mb-2 block text-sm font-semibold text-slate-700">Section</label>
                  <input
                    type="text"
                    value={editStudentForm.section}
                    onChange={e => setEditStudentForm({ ...editStudentForm, section: e.target.value })}
                    className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 outline-none focus:ring-2 focus:ring-purple-500"
                    placeholder="Section"
                  />
                </div>
              </div>

              {isSeniorGrade(editStudentForm.grade) && (
                <div>
                  <label className="mb-2 block text-sm font-semibold text-slate-700">Group</label>
                  <input
                    type="text"
                    value={editStudentForm.group}
                    onChange={e => setEditStudentForm({ ...editStudentForm, group: e.target.value })}
                    className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 outline-none focus:ring-2 focus:ring-purple-500"
                    placeholder="Group"
                  />
                </div>
              )}

              <div className="grid gap-4 md:grid-cols-2">
                <div>
                  <label className="mb-2 block text-sm font-semibold text-slate-700">Mother Name</label>
                  <input
                    type="text"
                    value={editStudentForm.motherName}
                    onChange={e => setEditStudentForm({ ...editStudentForm, motherName: e.target.value })}
                    className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 outline-none focus:ring-2 focus:ring-purple-500"
                    placeholder="Mother name"
                  />
                </div>
                <div>
                  <label className="mb-2 block text-sm font-semibold text-slate-700">Father Name</label>
                  <input
                    type="text"
                    value={editStudentForm.fatherName}
                    onChange={e => setEditStudentForm({ ...editStudentForm, fatherName: e.target.value })}
                    className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 outline-none focus:ring-2 focus:ring-purple-500"
                    placeholder="Father name"
                  />
                </div>
              </div>

              <div>
                <label className="mb-2 block text-sm font-semibold text-slate-700">Guardian Name</label>
                <input
                  type="text"
                  value={editStudentForm.guardianName}
                  onChange={e => setEditStudentForm({ ...editStudentForm, guardianName: e.target.value })}
                  className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 outline-none focus:ring-2 focus:ring-purple-500"
                  placeholder="Guardian name (if parent names are not available)"
                />
              </div>

              <p className="text-sm text-slate-500">Enter mother and father names together, or fill only the guardian field.</p>

              <div className="flex flex-wrap items-center gap-3">
                <button type="submit" className="rounded-xl bg-purple-600 px-6 py-3 font-bold text-white transition-colors hover:bg-purple-700">
                  Save Student
                </button>
                <button type="button" onClick={closeStudentEditor} className="rounded-xl bg-slate-100 px-6 py-3 font-bold text-slate-700 transition-colors hover:bg-slate-200">
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {editingFacultyId && (
        <div className="fixed inset-0 z-[55] flex items-center justify-center bg-slate-900/60 p-4 backdrop-blur-sm">
          <div className="absolute inset-0" onClick={closeFacultyEditor} />
          <div className="relative z-10 w-full max-w-5xl rounded-[2rem] border border-slate-200 bg-white p-6 shadow-2xl sm:p-8">
            <div className="flex items-start justify-between gap-4 mb-6">
              <div>
                <h3 className="text-2xl font-display font-bold text-slate-900">Edit Faculty Profile</h3>
                <p className="text-sm text-slate-500 mt-1">Update FAC number, faculty details, class assignment, and password.</p>
              </div>
              <button
                type="button"
                onClick={closeFacultyEditor}
                className="rounded-xl px-3 py-2 text-sm font-bold text-slate-400 transition-colors hover:bg-slate-100 hover:text-slate-700"
              >
                Close
              </button>
            </div>

            {manageFacultyMsg.text && (
              <div className={`mb-4 rounded-xl px-4 py-3 text-sm font-semibold ${manageFacultyMsg.type === 'success' ? 'bg-blue-100 text-blue-800 border border-blue-200' : 'bg-red-100 text-red-800 border border-red-200'}`}>
                {manageFacultyMsg.text}
              </div>
            )}

            <form
              onSubmit={(event) => {
                event.preventDefault();
                handleUpdateFaculty(editingFacultyId);
              }}
              className="space-y-5"
            >
              <div className="grid gap-4 md:grid-cols-3">
                <div>
                  <label className="mb-2 block text-sm font-semibold text-slate-700">FAC Number</label>
                  <div className="relative">
                    <span className="absolute left-4 top-1/2 -translate-y-1/2 text-sm font-bold text-slate-400">FAC</span>
                    <input
                      type="text"
                      inputMode="numeric"
                      value={editFacultyForm.facultyNumber}
                      onChange={e => setEditFacultyForm({ ...editFacultyForm, facultyNumber: e.target.value.replace(/\D/g, '') })}
                      className="w-full rounded-xl border border-slate-200 bg-slate-50 py-3 pl-14 pr-4 outline-none focus:ring-2 focus:ring-blue-500"
                      placeholder="26001"
                    />
                  </div>
                </div>
                <div>
                  <label className="mb-2 block text-sm font-semibold text-slate-700">Faculty Name</label>
                  <input
                    type="text"
                    value={editFacultyForm.name}
                    onChange={e => setEditFacultyForm({ ...editFacultyForm, name: e.target.value })}
                    className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="Faculty name"
                  />
                </div>
                <div>
                  <label className="mb-2 block text-sm font-semibold text-slate-700">Mobile Number</label>
                  <input
                    type="text"
                    inputMode="numeric"
                    value={editFacultyForm.mobileNumber}
                    onChange={e => setEditFacultyForm({ ...editFacultyForm, mobileNumber: e.target.value.replace(/\D/g, '') })}
                    className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="Mobile number"
                  />
                </div>
              </div>

              <div className="grid gap-4 md:grid-cols-3">
                <div>
                  <label className="mb-2 block text-sm font-semibold text-slate-700">Grade</label>
                  <input
                    type="text"
                    value={editFacultyForm.assignedGrade}
                    onChange={e => setEditFacultyForm({ ...editFacultyForm, assignedGrade: e.target.value })}
                    className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="Grade"
                  />
                </div>
                <div>
                  <label className="mb-2 block text-sm font-semibold text-slate-700">Section</label>
                  <input
                    type="text"
                    value={editFacultyForm.assignedSection}
                    onChange={e => setEditFacultyForm({ ...editFacultyForm, assignedSection: e.target.value })}
                    className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="Section"
                  />
                </div>
                <div>
                  <label className="mb-2 block text-sm font-semibold text-slate-700">New Password</label>
                  <input
                    type="text"
                    value={editFacultyForm.password}
                    onChange={e => setEditFacultyForm({ ...editFacultyForm, password: e.target.value })}
                    className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="Leave empty to keep current password"
                  />
                </div>
              </div>

              <div className="flex flex-wrap items-center gap-3">
                <button type="submit" className="rounded-xl bg-blue-600 px-6 py-3 font-bold text-white transition-colors hover:bg-blue-700">
                  Save Faculty
                </button>
                <button type="button" onClick={closeFacultyEditor} className="rounded-xl bg-slate-100 px-6 py-3 font-bold text-slate-700 transition-colors hover:bg-slate-200">
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {selectedStudentForFees && (
        <StudentFeeModal 
          student={selectedStudentForFees} 
          onClose={() => setSelectedStudentForFees(null)} 
          onUpdate={() => fetchStudents(localStorage.getItem('schoolToken'))}
        />
      )}
    </div>
  );
}

function FacultyProfileModal({ faculty, allStudents, onClose, onUpdate }) {
  const [maxStudents, setMaxStudents] = useState(faculty.maxStudents || 30);
  const [handledClasses, setHandledClasses] = useState(faculty.handledClasses || []);
  
  // Initialize assigned students
  const [assignedIds, setAssignedIds] = useState(
    allStudents.filter(s => (s.facultyId?._id === faculty._id) || (s.facultyId === faculty._id)).map(s => s._id)
  );

  const [studentFilter, setStudentFilter] = useState({ grade: '', section: '' });
  const [saving, setSaving] = useState(false);

  const toggleStudent = (id) => {
    setAssignedIds(prev => {
      if (prev.includes(id)) return prev.filter(i => i !== id);
      if (prev.length >= maxStudents) {
        Swal.fire('Limit Reached', `Cannot assign more than ${maxStudents} monitored students to this faculty. Increase limit if needed.`, 'warning');
        return prev;
      }
      return [...prev, id];
    });
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      const token = localStorage.getItem('schoolToken');
      
      // Update limit and handled classes
      await axios.put(`${API_URL}/api/admin/faculty/${faculty._id}`, { 
        maxStudents, 
        handledClasses 
      }, { headers: { Authorization: `Bearer ${token}` } });

      // Build student assignment payload
      await axios.post(`${API_URL}/api/admin/faculty/${faculty._id}/assign-students`, { 
        studentIds: assignedIds 
      }, { headers: { Authorization: `Bearer ${token}` } });

      Swal.fire({toast: true, position: 'top-end', icon: 'success', title: 'Profile and student tracking assignments updated!', showConfirmButton: false, timer: 3000, timerProgressBar: true});
      onUpdate();
      onClose();
    } catch (err) {
      Swal.fire('Error', 'Failed to save profile. Please check connection.', 'error');
    } finally {
      setSaving(false);
    }
  };

  // Filter students
  const filteredStudents = allStudents.filter(s => {
    if (studentFilter.grade && s.grade !== studentFilter.grade) return false;
    if (studentFilter.section && s.section !== studentFilter.section) return false;
    return true;
  });

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/60 flex items-center justify-center p-4 backdrop-blur-sm overflow-y-auto">
      <div className="bg-white rounded-2xl w-full max-w-4xl shadow-2xl overflow-hidden my-8">
        
        {/* Header */}
        <div className="bg-slate-900 px-6 py-4 flex justify-between items-center text-white">
          <div>
            <h2 className="text-xl font-bold font-display">Faculty Profile: {faculty.name}</h2>
            <p className="text-sm text-slate-300">Class Incharge: {faculty.assignedGrade || '-'}-{faculty.assignedSection || '-'}</p>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-white/10 rounded-lg"><X size={20} /></button>
        </div>

        <div className="p-6 grid grid-cols-1 md:grid-cols-2 gap-8">
          
          {/* Left Column: Config */}
          <div className="space-y-6">
            <div>
              <h3 className="font-bold text-slate-800 mb-2 border-b pb-2">Tracking Limit</h3>
              <p className="text-xs text-slate-500 mb-2">Maximum students this faculty handles as a class tutor.</p>
              <input type="number" min="1" value={maxStudents} onChange={e => setMaxStudents(Number(e.target.value))} className="w-full px-3 py-2 border rounded-xl focus:ring-2 focus:ring-emerald-500 outline-none font-bold text-slate-700" />
            </div>

            <div>
              <h3 className="font-bold text-slate-800 mb-2 border-b pb-2 flex justify-between items-center">
                <span>Handled Classes & Subjects</span>
                <button onClick={() => setHandledClasses([...handledClasses, { grade: '', section: '', subject: '' }])} className="text-xs bg-slate-100 text-slate-700 font-bold px-2 py-1 rounded hover:bg-slate-200">
                  + Add Subject
                </button>
              </h3>
              <div className="space-y-2 max-h-[300px] overflow-y-auto pr-2">
                {handledClasses.map((hc, idx) => (
                  <div key={idx} className="flex gap-2 p-2 bg-slate-50 rounded-xl border border-slate-100 items-center">
                    <input type="text" placeholder="Grade" value={hc.grade} onChange={e => { const newHc = [...handledClasses]; newHc[idx].grade = e.target.value; setHandledClasses(newHc); }} className="w-16 px-2 py-1 border rounded text-sm" />
                    <input type="text" placeholder="Sec" value={hc.section} onChange={e => { const newHc = [...handledClasses]; newHc[idx].section = e.target.value; setHandledClasses(newHc); }} className="w-16 px-2 py-1 border rounded text-sm" />
                    <input type="text" placeholder="Subject" value={hc.subject} onChange={e => { const newHc = [...handledClasses]; newHc[idx].subject = e.target.value; setHandledClasses(newHc); }} className="flex-1 px-2 py-1 border rounded text-sm min-w-0" />
                    <button onClick={() => setHandledClasses(handledClasses.filter((_, i) => i !== idx))} className="text-red-400 hover:text-red-600"><X size={16}/></button>
                  </div>
                ))}
                {handledClasses.length === 0 && <p className="text-sm text-slate-400 italic">No additional subjects assigned yet.</p>}
              </div>
            </div>
          </div>

          {/* Right Column: Assign Students */}
          <div className="flex flex-col h-[500px]">
             <h3 className="font-bold text-slate-800 mb-2 border-b pb-2 flex justify-between">
                <span>Assign Tracking Students</span>
                <span className={`text-sm ${assignedIds.length > maxStudents ? 'text-red-500' : 'text-emerald-600'}`}>{assignedIds.length} / {maxStudents}</span>
             </h3>
             <div className="flex gap-2 mb-3">
               <input type="text" placeholder="Filter Grade" value={studentFilter.grade} onChange={e => setStudentFilter({...studentFilter, grade: e.target.value})} className="w-1/2 px-3 py-2 border rounded-xl text-sm outline-none focus:ring-2 focus:ring-emerald-500" />
               <input type="text" placeholder="Filter Sec" value={studentFilter.section} onChange={e => setStudentFilter({...studentFilter, section: e.target.value})} className="w-1/2 px-3 py-2 border rounded-xl text-sm outline-none focus:ring-2 focus:ring-emerald-500" />
             </div>
             <div className="flex-1 overflow-y-auto border rounded-xl bg-slate-50 p-2 space-y-1">
                {filteredStudents.map(s => {
                  const isAssignedToMe = assignedIds.includes(s._id);
                  const isAssignedToOther = !isAssignedToMe && s.facultyId && s.facultyId._id !== faculty._id;
                  
                  return (
                    <div key={s._id} className={`flex items-center justify-between p-2 rounded-lg text-sm border bg-white ${isAssignedToMe ? 'border-emerald-300 ring-1 ring-emerald-300' : 'border-slate-200'}`}>
                      <div>
                        <p className="font-bold text-slate-800">{s.name} <span className="text-xs font-normal text-slate-500 ml-1">({s.srvNumber})</span></p>
                        <p className="text-xs flex gap-2">
                          <span className="bg-slate-100 text-slate-500 px-1.5 rounded">{s.grade}-{s.section}</span>
                          {s.group && <span className="bg-amber-100 text-amber-700 px-1.5 rounded">{s.group}</span>}
                          {isAssignedToOther && <span className="text-red-500 text-[10px] ml-1 flex items-center">⚠ Tracked by {s.facultyId.name}</span>}
                        </p>
                      </div>
                      <button 
                        onClick={() => toggleStudent(s._id)}
                        className={`text-xs px-3 py-1.5 font-bold rounded-lg ${isAssignedToMe ? 'bg-emerald-100 text-emerald-700' : 'bg-slate-200 text-slate-600 hover:bg-emerald-50 hover:text-emerald-600'}`}
                      >
                        {isAssignedToMe ? 'Assigned' : 'Assign'}
                      </button>
                    </div>
                  );
                })}
                {filteredStudents.length === 0 && <p className="text-center p-4 text-slate-500 text-sm">No students match the filters.</p>}
             </div>
          </div>

        </div>

        {/* Footer */}
        <div className="bg-slate-50 p-4 border-t flex justify-end gap-3">
          <button onClick={onClose} className="px-5 py-2 text-slate-600 font-bold hover:bg-slate-200 rounded-xl">Cancel</button>
          <button onClick={handleSave} disabled={saving} className="px-5 py-2 bg-emerald-600 text-white font-bold hover:bg-emerald-700 rounded-xl disabled:opacity-50">
            {saving ? 'Saving...' : 'Save Profile & Assignments'}
          </button>
        </div>
      </div>
    </div>
  );
}

function StudentFeeModal({ student, onClose, onUpdate }) {
  const [fees, setFees] = useState({
    term1: student.fees?.term1 || 'Unpaid',
    term1Amount: student.fees?.term1Amount || 4500,
    term1Paid: student.fees?.term1Paid || 0,
    term2: student.fees?.term2 || 'Unpaid',
    term2Amount: student.fees?.term2Amount || 4500,
    term2Paid: student.fees?.term2Paid || 0,
    term3: student.fees?.term3 || 'Unpaid',
    term3Amount: student.fees?.term3Amount || 4500,
    term3Paid: student.fees?.term3Paid || 0,
    overall: student.fees?.overall || 'Unpaid',
    additionalFees: student.fees?.additionalFees || 0,
    additionalPaid: student.fees?.additionalPaid || 0,
  });
  const [saving, setSaving] = useState(false);

  const handleSave = async () => {
    setSaving(true);
    try {
      const token = localStorage.getItem('schoolToken');
      await axios.put(`${API_URL}/api/admin/student/${student._id}/fees`, fees, {
        headers: { Authorization: `Bearer ${token}` }
      });
      onUpdate();
      onClose();
    } catch (err) {
      Swal.fire('Error', 'Failed to save fee details.', 'error');
    } finally {
      setSaving(false);
    }
  };

  const FeeRow = ({ label, value, amount, paid, onValueChange, onAmountChange, onPaidChange }) => (
    <div className="flex items-center justify-between p-3 bg-slate-50 border border-slate-200 rounded-xl mb-3">
      <span className="font-semibold text-sm text-slate-700 w-20">{label}</span>
      <div className="flex items-center gap-2">
        <div className="relative" title="Total Due">
          <span className="absolute left-2 top-1/2 -translate-y-1/2 text-slate-400 font-bold text-xs">₹</span>
          <input 
            type="number" 
            value={amount} 
            onChange={e => onAmountChange(e.target.value)}
            className="w-16 pl-5 pr-1 py-1.5 text-xs font-bold border border-slate-300 rounded-lg focus:ring-1 focus:ring-purple-500 outline-none"
          />
        </div>
        <span className="text-slate-400 text-[10px] font-bold">Paid:</span>
        <div className="relative" title="Amount Paid">
          <span className="absolute left-2 top-1/2 -translate-y-1/2 text-emerald-500 font-bold text-xs">₹</span>
          <input 
            type="number" 
            value={paid} 
            onChange={e => onPaidChange(e.target.value)}
            className="w-16 pl-5 pr-1 py-1.5 text-xs font-bold border border-emerald-300 rounded-lg focus:ring-1 focus:ring-emerald-500 outline-none text-emerald-700 bg-emerald-50"
          />
        </div>
        <select 
          value={value} 
          onChange={(e) => onValueChange(e.target.value)}
          className={`text-[10px] font-bold px-1 py-1.5 rounded-lg border-2 w-20 outline-none ${value === 'Paid' ? 'border-emerald-500 text-emerald-700 bg-emerald-50' : value === 'Partial' ? 'border-amber-500 text-amber-700 bg-amber-50' : 'border-slate-300 text-slate-600 bg-white'}`}
        >
          <option value="Unpaid">Unpaid</option>
          <option value="Partial">Partial</option>
          <option value="Paid">Paid</option>
        </select>
      </div>
    </div>
  );

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/60 flex items-center justify-center p-4 backdrop-blur-sm overflow-y-auto w-full">
      <div className="bg-white rounded-2xl w-full max-w-lg shadow-2xl overflow-hidden my-8">
        
        <div className="bg-slate-900 px-6 py-4 flex justify-between items-center text-white">
          <div>
            <h2 className="text-xl font-bold font-display">Manage Fees</h2>
            <p className="text-sm text-slate-300">{student.name} ({student.srvNumber})</p>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-white/10 rounded-lg"><X size={20} /></button>
        </div>

        <div className="p-6">
          <FeeRow label="Term 1" value={fees.term1} amount={fees.term1Amount} paid={fees.term1Paid} onValueChange={v => setFees({...fees, term1: v})} onAmountChange={a => setFees({...fees, term1Amount: a})} onPaidChange={p => setFees({...fees, term1Paid: p})} />
          <FeeRow label="Term 2" value={fees.term2} amount={fees.term2Amount} paid={fees.term2Paid} onValueChange={v => setFees({...fees, term2: v})} onAmountChange={a => setFees({...fees, term2Amount: a})} onPaidChange={p => setFees({...fees, term2Paid: p})} />
          <FeeRow label="Term 3" value={fees.term3} amount={fees.term3Amount} paid={fees.term3Paid} onValueChange={v => setFees({...fees, term3: v})} onAmountChange={a => setFees({...fees, term3Amount: a})} onPaidChange={p => setFees({...fees, term3Paid: p})} />
          
          <div className="pt-4 border-t border-slate-100 mt-2">
            <div className="flex items-center justify-between p-3 bg-slate-50 border border-slate-200 rounded-xl">
              <span className="font-semibold text-sm text-slate-700">Overall Core Fees</span>
              <select 
                value={fees.overall} 
                onChange={(e) => setFees({...fees, overall: e.target.value})}
                className={`text-xs font-bold px-3 py-2 rounded-lg border-2 w-28 outline-none ${fees.overall === 'Paid' ? 'border-emerald-500 text-emerald-700 bg-emerald-50' : fees.overall === 'Partial' ? 'border-amber-500 text-amber-700 bg-amber-50' : 'border-slate-300 text-slate-600 bg-white'}`}
              >
                <option value="Unpaid">Unpaid</option>
                <option value="Partial">Partial</option>
                <option value="Paid">Paid</option>
              </select>
            </div>
          </div>

          <div className="pt-4 border-t border-slate-100 mt-4">
            <label className="block font-semibold text-sm text-slate-700 mb-2">Additional Fees / Uniform / Transport</label>
            <div className="flex gap-3">
              <div className="relative flex-1" title="Total Due">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 font-bold text-sm">₹</span>
                <input 
                  type="number" 
                  value={fees.additionalFees} 
                  onChange={e => setFees({...fees, additionalFees: e.target.value})} 
                  className="w-full pl-8 pr-4 py-2 border border-slate-200 rounded-xl focus:ring-2 focus:ring-purple-500 outline-none font-bold text-slate-700"
                  placeholder="Total Add-on"
                />
              </div>
              <div className="relative flex-1" title="Amount Paid">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-emerald-500 font-bold text-sm">₹</span>
                <input 
                  type="number" 
                  value={fees.additionalPaid} 
                  onChange={e => setFees({...fees, additionalPaid: e.target.value})} 
                  className="w-full pl-8 pr-4 py-2 border border-emerald-300 rounded-xl focus:ring-2 focus:ring-emerald-500 outline-none font-bold text-emerald-700 bg-emerald-50"
                  placeholder="Paid Add-on"
                />
              </div>
            </div>
          </div>
        </div>

        <div className="bg-slate-50 p-4 border-t flex justify-end gap-3">
          <button onClick={onClose} className="px-5 py-2 text-slate-600 font-bold hover:bg-slate-200 rounded-xl">Cancel</button>
          <button onClick={handleSave} disabled={saving} className="px-5 py-2 bg-purple-600 text-white font-bold hover:bg-purple-700 rounded-xl flex items-center gap-2 disabled:opacity-50">
            <CheckCircle2 size={18} /> {saving ? 'Saving...' : 'Save Fees'}
          </button>
        </div>

      </div>
    </div>
  );
}

