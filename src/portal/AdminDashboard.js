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
  const [studentForm, setStudentForm] = useState({ name: '', grade: '', section: '', dateOfBirth: '' });
  const [studentMsg, setStudentMsg] = useState({ text: '', type: '' });

  // Food Menu Form State
  const [foodForm, setFoodForm] = useState({ day: 'Monday', breakfast: '', lunch: '', snacks: '' });
  const [foodMsg, setFoodMsg] = useState({ text: '', type: '' });

  // Manage Faculty State
  const [faculties, setFaculties] = useState([]);
  const [editingFacultyId, setEditingFacultyId] = useState(null);
  const [editFacultyForm, setEditFacultyForm] = useState({ assignedGrade: '', assignedSection: '', password: '' });
  const [manageFacultyMsg, setManageFacultyMsg] = useState({ text: '', type: '' });

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
  }, [navigate]);

  const fetchFaculties = (token) => {
    axios.get('https://srv-backend-3b9s.onrender.com/api/admin/faculty', {
      headers: { Authorization: `Bearer ${token}` }
    }).then(res => setFaculties(res.data)).catch(console.error);
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
      </div>
    </div>
  );
}

