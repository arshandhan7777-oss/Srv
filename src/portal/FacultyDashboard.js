import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { Users, LogOut, CheckSquare, BookOpen, AlertCircle } from 'lucide-react';

export function FacultyDashboard() {
  const [students, setStudents] = useState([]);
  const [selectedStudent, setSelectedStudent] = useState(null);
  
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
  const navigate = useNavigate();
  const user = JSON.parse(localStorage.getItem('schoolUser') || '{}');

  useEffect(() => {
    if (user.role !== 'faculty') {
      navigate('/portal/login');
      return;
    }
    
    const token = localStorage.getItem('schoolToken');
    axios.get((import.meta.env.VITE_API_URL || 'http://localhost:5000') + '/api/faculty/students', {
      headers: { Authorization: `Bearer ${token}` }
    }).then(res => setStudents(res.data)).catch(console.error);
  }, [navigate, user.role]);

  const handleLogout = () => {
    localStorage.removeItem('schoolToken');
    localStorage.removeItem('schoolUser');
    navigate('/portal/login');
  };

  const submitGrades = async (e) => {
    e.preventDefault();
    try {
      const token = localStorage.getItem('schoolToken');
      await axios.post((import.meta.env.VITE_API_URL || 'http://localhost:5000') + '/api/faculty/marks', {
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

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Top Navbar */}
      <div className="bg-slate-900 text-white px-8 py-4 flex justify-between items-center shadow-md">
        <div className="flex items-center gap-4">
          <div className="w-10 h-10 bg-white rounded-lg flex items-center justify-center">
            <img src="/srv T.png" alt="SRV" className="h-6" />
          </div>
          <div>
            <h1 className="font-display font-bold text-lg leading-tight">Faculty Portal</h1>
            <p className="text-xs text-slate-400">Class {user.assignedGrade}-{user.assignedSection} • {user.name}</p>
          </div>
        </div>
        <button onClick={handleLogout} className="flex items-center gap-2 px-4 py-2 bg-white/10 hover:bg-white/20 rounded-lg text-sm font-semibold transition-colors">
          <LogOut size={16} /> Logout
        </button>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
        
        <div className="grid lg:grid-cols-3 gap-8">
          {/* Main Content - Student List */}
          <div className="lg:col-span-2 space-y-6">
            <div className="flex items-center justify-between">
              <h2 className="text-2xl font-display font-bold text-slate-900 flex items-center gap-2">
                <Users className="text-emerald-600" /> My Students
              </h2>
              <span className="bg-slate-200 text-slate-700 font-bold px-3 py-1 rounded-full text-sm">{students.length} Total</span>
            </div>

            <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
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
                      <td className="px-6 py-4 font-semibold text-slate-900">{s.name}</td>
                      <td className="px-6 py-4">
                        <button 
                          onClick={() => { setSelectedStudent(s); setGradeMsg({text:'', type:''}); }}
                          className="text-emerald-600 font-semibold text-sm hover:underline"
                        >
                          Evaluate Nlite & Marks
                        </button>
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

            {/* Grading Drawer / Panel */}
            {selectedStudent && (
              <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-8 mt-6">
                <div className="flex justify-between items-center mb-6">
                  <h3 className="text-xl font-display font-bold text-slate-900 flex items-center gap-2">
                    Evaluating: <span className="text-emerald-600">{selectedStudent.name}</span>
                  </h3>
                  <button onClick={() => setSelectedStudent(null)} className="text-slate-400 hover:text-slate-600 font-bold">Cancel</button>
                </div>
                
                {gradeMsg.text && (
                  <div className={`mb-4 px-4 py-3 rounded-lg text-sm font-semibold ${gradeMsg.type === 'success' ? 'bg-emerald-100 text-emerald-800' : 'bg-red-100 text-red-800'}`}>
                    {gradeMsg.text}
                  </div>
                )}

                <form onSubmit={submitGrades} className="space-y-6">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-bold text-slate-500 mb-1">Term</label>
                      <select value={gradeForm.term} onChange={e => setGradeForm({...gradeForm, term: e.target.value})} className="w-full px-4 py-2 border rounded-xl">
                        <option>Term 1</option>
                        <option>Mid-Terms</option>
                        <option>Term 2</option>
                        <option>Finals</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-slate-500 mb-1">Behaviour</label>
                      <select value={gradeForm.behaviour} onChange={e => setGradeForm({...gradeForm, behaviour: e.target.value})} className="w-full px-4 py-2 border rounded-xl">
                        <option>Excellent</option>
                        <option>Good</option>
                        <option>Needs Improvement</option>
                        <option>Poor</option>
                      </select>
                    </div>
                  </div>

                  {/* Nlite Academy Skills */}
                  <div>
                    <h4 className="font-bold text-slate-700 border-b pb-2 mb-3">Nlite 21st-Century Skills (0-5)</h4>
                    <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                      {Object.keys(gradeForm.nliteSkills).map(skillName => (
                        <div key={skillName}>
                          <label className="block text-xs font-bold text-slate-500 mb-1 capitalize">{skillName.replace(/([A-Z])/g, ' $1')}</label>
                          <input type="number" min="0" max="5" required
                            value={gradeForm.nliteSkills[skillName]} 
                            onChange={e => setGradeForm({...gradeForm, nliteSkills: {...gradeForm.nliteSkills, [skillName]: Number(e.target.value)}})}
                            className="w-full px-3 py-2 border rounded-xl bg-amber-50"
                          />
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Marks */}
                  <div>
                    <h4 className="font-bold text-slate-700 border-b pb-2 mb-3">Academic Marks (Out of 100)</h4>
                    <div className="grid grid-cols-3 gap-4">
                      {Object.keys(gradeForm.marks).map(subject => (
                        <div key={subject}>
                          <label className="block text-xs font-bold text-slate-500 mb-1 capitalize">{subject}</label>
                          <input type="number" min="0" max="100" required
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
            )}
          </div>

          {/* Sidebar Actions */}
          <div className="space-y-6">
            {/* Upload Homework */}
            <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-6">
              <div className="flex items-center gap-3 mb-5">
                <BookOpen className="text-amber-500" />
                <h3 className="text-lg font-display font-bold text-slate-900">Assign Homework</h3>
              </div>
              <div className="space-y-3">
                <input type="text" placeholder="Subject" className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm outline-none focus:ring-2 focus:ring-emerald-500" />
                <input type="text" placeholder="Title" className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm outline-none focus:ring-2 focus:ring-emerald-500" />
                <textarea placeholder="Description..." rows="3" className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm outline-none focus:ring-2 focus:ring-emerald-500"></textarea>
                <input type="date" className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm outline-none focus:ring-2 focus:ring-emerald-500" />
                <button className="w-full py-3 bg-amber-500 text-white font-bold rounded-xl hover:bg-amber-600 transition-colors text-sm">
                  Publish & Notify Parents
                </button>
              </div>
            </div>

            {/* Quick Actions */}
            <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-6">
              <h3 className="text-lg font-display font-bold text-slate-900 mb-4">Quick Actions</h3>
              <div className="space-y-3">
                <button className="w-full flex items-center gap-3 p-3 rounded-xl border border-slate-200 hover:border-emerald-500 hover:bg-emerald-50 transition-colors text-left">
                  <CheckSquare className="text-emerald-600" size={20} />
                  <div>
                    <p className="font-semibold text-sm text-slate-900">Mark Attendance</p>
                    <p className="text-xs text-slate-500">Record daily present/absent</p>
                  </div>
                </button>
                <button className="w-full flex items-center gap-3 p-3 rounded-xl border border-slate-200 hover:border-amber-500 hover:bg-amber-50 transition-colors text-left">
                  <AlertCircle className="text-amber-600" size={20} />
                  <div>
                    <p className="font-semibold text-sm text-slate-900">Log Behaviour</p>
                    <p className="text-xs text-slate-500">Add discipline/activity notes</p>
                  </div>
                </button>
              </div>
            </div>

          </div>
        </div>

      </div>
    </div>
  );
}
