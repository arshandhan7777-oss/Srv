import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { Users, UserPlus, BookOpen, LogOut, CheckCircle2, Coffee, Trash2, Edit2, Save, X } from 'lucide-react';
import srvLogo from '../assest/fav_logo/srv-t.png';

export function AdminDashboard() {
  const [stats, setStats] = useState({ totalStudents: 0, totalFaculty: 0 });
  
  // Faculty Form State
  const [facultyForm, setFacultyForm] = useState({ name: '', assignedGrade: '', assignedSection: '' });
  const [facultyMsg, setFacultyMsg] = useState({ text: '', type: '' });

  // Student Form State
  const [studentForm, setStudentForm] = useState({ name: '', grade: '', section: '', group: '', dateOfBirth: '' });
  const [studentMsg, setStudentMsg] = useState({ text: '', type: '' });

  // Food Menu Form State
  const [weeklyMenu, setWeeklyMenu] = useState([]);
  const [editingDay, setEditingDay] = useState(null);
  const [editFoodForm, setEditFoodForm] = useState({ breakfast: '', lunch: '', snacks: '' });
  const [foodMsg, setFoodMsg] = useState({ text: '', type: '' });

  // Manage Faculty State
  const [faculties, setFaculties] = useState([]);
  const [editingFacultyId, setEditingFacultyId] = useState(null);
  const [editFacultyForm, setEditFacultyForm] = useState({ assignedGrade: '', assignedSection: '', password: '' });
  const [manageFacultyMsg, setManageFacultyMsg] = useState({ text: '', type: '' });

  // Manage Students State
  const [selectedStudentForFees, setSelectedStudentForFees] = useState(null);

  // Fees and Settings State
  const [isOnlineFeeEnabled, setIsOnlineFeeEnabled] = useState(false);
  const [feeAlerts, setFeeAlerts] = useState([]);

  // Password Requests
  const [pwRequests, setPwRequests] = useState([]);
  const [resettingPwFor, setResettingPwFor] = useState(null);
  const [newAdminProvidedPw, setNewAdminProvidedPw] = useState('');

  // Advanced Profile State
  const [allStudents, setAllStudents] = useState([]);
  const [selectedFacultyProfile, setSelectedFacultyProfile] = useState(null);

  const navigate = useNavigate();

  useEffect(() => {
    const user = JSON.parse(localStorage.getItem('schoolUser'));
    if (!user || user.role !== 'admin') {
      navigate('/portal/login');
      return;
    }
    
    // Fetch stats
    const token = localStorage.getItem('schoolToken');
    axios.get('https://srv-backend-3b9s.onrender.com' + '/api/admin/stats', {
      headers: { Authorization: `Bearer ${token}` }
    }).then(res => setStats(res.data)).catch(console.error);

    // Fetch faculties
    fetchFaculties(token);
    // Fetch weekly menu
    fetchWeeklyMenu(token);
    // Fetch all students for the new tracking table
    fetchStudents(token);
    // Fetch settings and alerts
    fetchSettingsAndAlerts(token);
  }, [navigate]);

  const fetchSettingsAndAlerts = (token) => {
    axios.get('https://srv-backend-3b9s.onrender.com/api/admin/settings/fee-toggle', { headers: { Authorization: `Bearer ${token}` } })
      .then(res => setIsOnlineFeeEnabled(res.data.isOnlineFeeEnabled)).catch(console.error);
    axios.get('https://srv-backend-3b9s.onrender.com/api/admin/notifications', { headers: { Authorization: `Bearer ${token}` } })
      .then(res => setFeeAlerts(res.data)).catch(console.error);
    axios.get('https://srv-backend-3b9s.onrender.com/api/admin/password-requests', { headers: { Authorization: `Bearer ${token}` } })
      .then(res => setPwRequests(res.data)).catch(console.error);
  };

  const handleToggleOnlineFee = async () => {
    try {
      const token = localStorage.getItem('schoolToken');
      const newStatus = !isOnlineFeeEnabled;
      await axios.put('https://srv-backend-3b9s.onrender.com/api/admin/settings/fee-toggle', { isEnabled: newStatus }, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setIsOnlineFeeEnabled(newStatus);
    } catch (err) {
      alert('Failed to update fee setting');
    }
  };

  const fetchWeeklyMenu = (token) => {
    axios.get('https://srv-backend-3b9s.onrender.com/api/admin/food', {
      headers: { Authorization: `Bearer ${token}` }
    }).then(res => setWeeklyMenu(res.data)).catch(console.error);
  };

  const fetchFaculties = (token) => {
    axios.get('https://srv-backend-3b9s.onrender.com/api/admin/faculty', {
      headers: { Authorization: `Bearer ${token}` }
    }).then(res => setFaculties(res.data)).catch(console.error);
  };

  const fetchStudents = (token) => {
    axios.get('https://srv-backend-3b9s.onrender.com/api/admin/students', {
      headers: { Authorization: `Bearer ${token}` }
    }).then(res => setAllStudents(res.data)).catch(console.error);
  };

  const openFacultyProfile = (faculty) => {
    const token = localStorage.getItem('schoolToken');
    fetchStudents(token);
    setSelectedFacultyProfile(faculty);
  };

  const handleLogout = () => {
    localStorage.removeItem('schoolToken');
    localStorage.removeItem('schoolUser');
    navigate('/portal/login');
  };

  const handleDeleteFaculty = async (id) => {
    if (!window.confirm('Are you sure you want to delete this faculty member?')) return;
    try {
      const token = localStorage.getItem('schoolToken');
      await axios.delete(`https://srv-backend-3b9s.onrender.com/api/admin/faculty/${id}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setManageFacultyMsg({ text: 'Faculty deleted successfully', type: 'success' });
      fetchFaculties(token);
      setStats(prev => ({...prev, totalFaculty: prev.totalFaculty - 1}));
      setTimeout(() => setManageFacultyMsg({text:'', type:''}), 3000);
    } catch (err) {
      setManageFacultyMsg({ text: 'Failed to delete faculty', type: 'error' });
    }
  };

  const handleUpdateFaculty = async (id) => {
    try {
      const token = localStorage.getItem('schoolToken');
      await axios.put(`https://srv-backend-3b9s.onrender.com/api/admin/faculty/${id}`, editFacultyForm, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setManageFacultyMsg({ text: 'Faculty updated successfully', type: 'success' });
      setEditingFacultyId(null);
      fetchFaculties(token);
      setTimeout(() => setManageFacultyMsg({text:'', type:''}), 3000);
    } catch (err) {
      setManageFacultyMsg({ text: 'Failed to update faculty', type: 'error' });
    }
  };

  const startEditing = (faculty) => {
    setEditingFacultyId(faculty._id);
    setEditFacultyForm({ assignedGrade: faculty.assignedGrade || '', assignedSection: faculty.assignedSection || '', password: '' });
  };

  const handleApprovePwReset = async () => {
    if (!newAdminProvidedPw) return alert('Enter a new password');
    try {
      const token = localStorage.getItem('schoolToken');
      await axios.post(`https://srv-backend-3b9s.onrender.com/api/admin/password-requests/${resettingPwFor._id}/approve`, 
        { newPassword: newAdminProvidedPw },
        { headers: { Authorization: `Bearer ${token}` }}
      );
      setResettingPwFor(null);
      setNewAdminProvidedPw('');
      fetchSettingsAndAlerts(token); // refresh list
    } catch (err) {
      alert(err.response?.data?.message || 'Error resetting password');
    }
  };

  const handeFacultySubmit = async (e) => {
    e.preventDefault();
    try {
      const token = localStorage.getItem('schoolToken');
      const res = await axios.post('https://srv-backend-3b9s.onrender.com' + '/api/admin/faculty', facultyForm, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setFacultyMsg({ text: `Success! Faculty SRV: ${res.data.faculty.srvNumber} - Password: faculty123`, type: 'success' });
      setFacultyForm({ name: '', assignedGrade: '', assignedSection: '' });
      setStats(prev => ({...prev, totalFaculty: prev.totalFaculty + 1}));
    } catch (err) {
      setFacultyMsg({ text: err.response?.data?.message || 'Failed to create faculty', type: 'error' });
    }
  };

  const handleStudentSubmit = async (e) => {
    e.preventDefault();
    try {
      const token = localStorage.getItem('schoolToken');
      const res = await axios.post('https://srv-backend-3b9s.onrender.com' + '/api/admin/student', studentForm, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setStudentMsg({ text: `Success! Student SRV: ${res.data.student.srvNumber} Login pass: ${studentForm.dateOfBirth}`, type: 'success' });
      setStudentForm({ name: '', grade: '', section: '', group: '', dateOfBirth: '' });
      setStats(prev => ({...prev, totalStudents: prev.totalStudents + 1}));
    } catch (err) {
      setStudentMsg({ text: err.response?.data?.message || 'Failed to admit student', type: 'error' });
    }
  };

  const handleSaveFood = async (day) => {
    try {
      const token = localStorage.getItem('schoolToken');
      await axios.post('https://srv-backend-3b9s.onrender.com' + '/api/admin/food', { day, ...editFoodForm }, {
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

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Top Navbar */}
      <div className="bg-emerald-900 text-white px-8 py-4 flex justify-between items-center shadow-md">
        <div className="flex items-center gap-3">
          <div className="w-16 h-16 bg-emerald-900 rounded-[20px] p-[4px] shadow-lg shrink-0">
            <div className="w-full h-full bg-white rounded-[16px] flex items-center justify-center overflow-hidden p-1.5">
              <img src={srvLogo} alt="SRV" className="w-full h-full object-contain scale-[1.15]" />
            </div>
          </div>
          <h1 className="font-display font-bold text-xl">Admin Portal</h1>
        </div>
        <button onClick={handleLogout} className="flex items-center gap-2 px-4 py-2 bg-white/10 hover:bg-white/20 rounded-lg text-sm font-semibold transition-colors">
          <LogOut size={16} /> Logout
        </button>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
        
        {/* Stats Row */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-10">
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
        <div className="grid md:grid-cols-2 gap-8">
          
          {/* Add Faculty */}
          <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-8">
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
              <div className="grid grid-cols-2 gap-4">
                <input 
                  type="text" 
                  placeholder="Assigned Grade (e.g. X)" 
                  required
                  value={facultyForm.assignedGrade}
                  onChange={e => setFacultyForm({...facultyForm, assignedGrade: e.target.value})}
                  className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500" 
                />
                <input 
                  type="text" 
                  placeholder="Section (e.g. A)" 
                  required
                  value={facultyForm.assignedSection}
                  onChange={e => setFacultyForm({...facultyForm, assignedSection: e.target.value})}
                  className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500" 
                />
              </div>
              <button type="submit" className="w-full py-3 bg-emerald-600 text-white font-bold rounded-xl hover:bg-emerald-700 transition-colors">
                Create Faculty Account
              </button>
            </form>
          </div>

          {/* Add Student */}
          <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-8">
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
              {['11', '12', 'XI', 'XII'].includes(studentForm.grade.toUpperCase().trim()) && (
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
                <CheckCircle2 size={12} className="text-emerald-500" /> Auto-generates SRV Number and Parent Portal access
              </p>
            </form>
          </div>

        </div>

        {/* Global Settings & Alerts */}
        <div className="grid md:grid-cols-3 gap-8 mt-8">
          {/* Global Settings */}
          <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-8">
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
          <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-8">
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
          <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-8">
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
        </div>

        {/* Cafeteria Menu Panel */}
        <div className="mt-8 bg-white rounded-2xl shadow-sm border border-slate-100 p-8">
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
        <div className="mt-8 bg-white rounded-2xl shadow-sm border border-slate-100 p-8">
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
                  <th className="px-5 py-3 font-semibold">SRV No</th>
                  <th className="px-5 py-3 font-semibold">Name</th>
                  <th className="px-5 py-3 font-semibold">Grade</th>
                  <th className="px-5 py-3 font-semibold">Section / Password</th>
                  <th className="px-5 py-3 font-semibold text-center w-[120px]">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-sm">
                {faculties.map(faculty => (
                  <tr key={faculty._id} className="hover:bg-slate-50/50">
                    <td className="px-5 py-4 font-mono font-medium text-slate-600 border-b border-slate-50">{faculty.srvNumber}</td>
                    <td className="px-5 py-4 font-semibold text-slate-900 border-b border-slate-50">{faculty.name}</td>
                    
                    {editingFacultyId === faculty._id ? (
                      <>
                        <td className="px-3 py-3 font-semibold text-slate-700 border-b border-slate-50">
                          <input type="text" value={editFacultyForm.assignedGrade} onChange={e => setEditFacultyForm({...editFacultyForm, assignedGrade: e.target.value})} className="w-16 px-2 py-1.5 border rounded-lg focus:ring-2 focus:ring-blue-500 outline-none" placeholder="Grade" />
                        </td>
                        <td className="px-3 py-3 font-semibold text-slate-700 border-b border-slate-50 flex items-center gap-2">
                          <input type="text" value={editFacultyForm.assignedSection} onChange={e => setEditFacultyForm({...editFacultyForm, assignedSection: e.target.value})} className="w-16 px-2 py-1.5 border rounded-lg focus:ring-2 focus:ring-blue-500 outline-none" placeholder="Sec" />
                          <input type="text" value={editFacultyForm.password} onChange={e => setEditFacultyForm({...editFacultyForm, password: e.target.value})} className="w-24 px-2 py-1.5 border rounded-lg focus:ring-2 focus:ring-blue-500 outline-none text-xs" placeholder="New Pass" />
                        </td>
                        <td className="px-5 py-3 flex items-center justify-center gap-2 border-b border-slate-50">
                          <button onClick={() => handleUpdateFaculty(faculty._id)} className="p-2 bg-emerald-100 text-emerald-700 rounded-lg hover:bg-emerald-200" title="Save">
                            <Save size={16} />
                          </button>
                          <button onClick={() => setEditingFacultyId(null)} className="p-2 bg-slate-100 text-slate-700 rounded-lg hover:bg-slate-200" title="Cancel">
                            <X size={16} />
                          </button>
                        </td>
                      </>
                    ) : (
                      <>
                        <td className="px-5 py-4 font-semibold text-slate-700 border-b border-slate-50">{faculty.assignedGrade || '-'}</td>
                        <td className="px-5 py-4 font-semibold text-slate-700 border-b border-slate-50">{faculty.assignedSection || '-'}</td>
                        <td className="px-5 py-4 flex items-center justify-center gap-3 border-b border-slate-50">
                          <button onClick={() => openFacultyProfile(faculty)} className="text-emerald-600 hover:text-emerald-800 font-semibold text-xs hover:underline flex items-center gap-1" title="View Profile & Assign Students">
                            Profile
                          </button>
                          <button onClick={() => startEditing(faculty)} className="text-blue-600 hover:text-blue-800 font-semibold text-xs hover:underline flex items-center gap-1" title="Edit and Reset Password">
                            <Edit2 size={14} /> Edit
                          </button>
                          <button onClick={() => handleDeleteFaculty(faculty._id)} className="text-red-500 hover:text-red-700 p-1.5 rounded-lg hover:bg-red-50" title="Delete">
                            <Trash2 size={16} />
                          </button>
                        </td>
                      </>
                    )}
                  </tr>
                ))}
                {faculties.length === 0 && (
                  <tr>
                    <td colSpan="5" className="px-5 py-8 text-center text-slate-500 border-b border-slate-50">No faculty members found.</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Manage Students Panel */}
        <div className="mt-8 bg-white rounded-2xl shadow-sm border border-slate-100 p-8">
          <div className="flex items-center gap-3 mb-6">
            <Users className="text-purple-500" />
            <h2 className="text-xl font-display font-bold text-slate-900">View All Students</h2>
          </div>
          
          <div className="overflow-x-auto rounded-xl border border-slate-200">
            <table className="w-full text-left border-collapse min-w-[800px]">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-200 text-sm text-slate-500">
                  <th className="px-5 py-3 font-semibold">SRV No</th>
                  <th className="px-5 py-3 font-semibold">Name</th>
                  <th className="px-5 py-3 font-semibold">Grade & Sec</th>
                  <th className="px-5 py-3 font-semibold">Class In-Charge</th>
                  <th className="px-5 py-3 font-semibold text-center">Fee Status (Overall)</th>
                  <th className="px-5 py-3 font-semibold text-center w-[120px]">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-sm">
                {allStudents.map(student => (
                  <tr key={student._id} className="hover:bg-slate-50/50">
                    <td className="px-5 py-4 font-mono font-medium text-slate-600 border-b border-slate-50">{student.srvNumber}</td>
                    <td className="px-5 py-4 font-semibold text-slate-900 border-b border-slate-50">{student.name}</td>
                    <td className="px-5 py-4 font-semibold text-slate-700 border-b border-slate-50">{student.grade}-{student.section}</td>
                    <td className="px-5 py-4 font-semibold text-slate-700 border-b border-slate-50">
                      {student.facultyId ? student.facultyId.name : <span className="text-slate-400 italic">Unassigned</span>}
                    </td>
                    <td className="px-5 py-4 text-center border-b border-slate-50">
                      <span className={`px-2.5 py-1 rounded-lg text-xs font-bold ${student.fees?.overall === 'Paid' ? 'bg-emerald-100 text-emerald-700' : 'bg-slate-100 text-slate-500'}`}>
                        {student.fees?.overall || 'Unpaid'}
                      </span>
                    </td>
                    <td className="px-5 py-4 text-center border-b border-slate-50">
                      <button onClick={() => setSelectedStudentForFees(student)} className="text-purple-600 hover:text-purple-800 font-semibold text-xs hover:underline flex items-center justify-center gap-1 w-full" title="Manage Fees">
                        Manage Fees
                      </button>
                    </td>
                  </tr>
                ))}
                {allStudents.length === 0 && (
                  <tr>
                    <td colSpan="6" className="px-5 py-8 text-center text-slate-500 border-b border-slate-50">No students found.</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

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
        alert(`Cannot assign more than ${maxStudents} monitored students to this faculty. Increase limit if needed.`);
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
      await axios.put(`https://srv-backend-3b9s.onrender.com/api/admin/faculty/${faculty._id}`, { 
        maxStudents, 
        handledClasses 
      }, { headers: { Authorization: `Bearer ${token}` } });

      // Build student assignment payload
      await axios.post(`https://srv-backend-3b9s.onrender.com/api/admin/faculty/${faculty._id}/assign-students`, { 
        studentIds: assignedIds 
      }, { headers: { Authorization: `Bearer ${token}` } });

      alert("Profile and student tracking assignments updated successfully!");
      onUpdate();
      onClose();
    } catch (err) {
      alert("Failed to save profile. Please check connection.");
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
      await axios.put(`https://srv-backend-3b9s.onrender.com/api/admin/student/${student._id}/fees`, fees, {
        headers: { Authorization: `Bearer ${token}` }
      });
      onUpdate();
      onClose();
    } catch (err) {
      alert('Failed to save fee details.');
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

