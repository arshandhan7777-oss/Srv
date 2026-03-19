import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { Users, UserPlus, BookOpen, LogOut, CheckCircle2, Coffee } from 'lucide-react';
import srvLogo from '../assest/fav_logo/srv-t.png';

export function AdminDashboard() {
  const [stats, setStats] = useState({ totalStudents: 0, totalFaculty: 0 });
  
  // Faculty Form State
  const [facultyForm, setFacultyForm] = useState({ name: '', assignedGrade: '', assignedSection: '' });
  const [facultyMsg, setFacultyMsg] = useState({ text: '', type: '' });

  // Student Form State
  const [studentForm, setStudentForm] = useState({ name: '', grade: '', section: '', dateOfBirth: '' });
  const [studentMsg, setStudentMsg] = useState({ text: '', type: '' });

  // Food Menu Form State
  const [foodForm, setFoodForm] = useState({ day: 'Monday', breakfast: '', lunch: '', snacks: '' });
  const [foodMsg, setFoodMsg] = useState({ text: '', type: '' });

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
  }, [navigate]);

  const handleLogout = () => {
    localStorage.removeItem('schoolToken');
    localStorage.removeItem('schoolUser');
    navigate('/portal/login');
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
      setStudentForm({ name: '', grade: '', section: '', dateOfBirth: '' });
      setStats(prev => ({...prev, totalStudents: prev.totalStudents + 1}));
    } catch (err) {
      setStudentMsg({ text: err.response?.data?.message || 'Failed to admit student', type: 'error' });
    }
  };

  const handleFoodSubmit = async (e) => {
    e.preventDefault();
    try {
      const token = localStorage.getItem('schoolToken');
      await axios.post('https://srv-backend-3b9s.onrender.com' + '/api/admin/food', foodForm, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setFoodMsg({ text: `${foodForm.day} menu published successfully!`, type: 'success' });
      setFoodForm({ day: 'Monday', breakfast: '', lunch: '', snacks: '' });
    } catch (err) {
      setFoodMsg({ text: 'Failed to update food menu', type: 'error' });
    }
  };

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Top Navbar */}
      <div className="bg-emerald-900 text-white px-8 py-4 flex justify-between items-center shadow-md">
        <div className="flex items-center gap-3">
          <div className="w-14 h-14 bg-white rounded-2xl shadow-sm border border-slate-200 flex items-center justify-center shrink-0 p-1.5">
            <img src={srvLogo} alt="SRV" className="w-full h-full object-contain transition-transform hover:scale-105" />
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
                  onChange={e => setStudentForm({...studentForm, grade: e.target.value})}
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
              <button type="submit" className="w-full py-3 bg-amber-500 text-white font-bold rounded-xl hover:bg-amber-600 transition-colors">
                Admit Student & Generate Parent Login
              </button>
              <p className="text-xs text-slate-500 text-center mt-2 flex items-center justify-center gap-1">
                <CheckCircle2 size={12} className="text-emerald-500" /> Auto-generates SRV Number and Parent Portal access
              </p>
            </form>
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

          <form onSubmit={handleFoodSubmit} className="space-y-4">
            <div className="grid md:grid-cols-4 gap-4">
              <select 
                value={foodForm.day}
                onChange={e => setFoodForm({...foodForm, day: e.target.value})}
                className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-orange-500 font-bold text-slate-700"
              >
                {['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'].map(d => <option key={d}>{d}</option>)}
              </select>
              <input 
                type="text" 
                placeholder="Breakfast Menu" 
                value={foodForm.breakfast}
                onChange={e => setFoodForm({...foodForm, breakfast: e.target.value})}
                className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-orange-500" 
              />
              <input 
                type="text" 
                placeholder="Lunch Menu" 
                value={foodForm.lunch}
                onChange={e => setFoodForm({...foodForm, lunch: e.target.value})}
                className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-orange-500" 
              />
              <input 
                type="text" 
                placeholder="Evening Snacks" 
                value={foodForm.snacks}
                onChange={e => setFoodForm({...foodForm, snacks: e.target.value})}
                className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-orange-500" 
              />
            </div>
            <button type="submit" className="w-full py-3 bg-orange-500 text-white font-bold rounded-xl hover:bg-orange-600 transition-colors">
              Publish Menu to Parents
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
