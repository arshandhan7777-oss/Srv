import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { Users, LogOut, CheckSquare, BookOpen, AlertCircle } from 'lucide-react';
import srvLogo from '../assest/fav_logo/srv-t.png';
import API_URL from '../config/api.js';
import HomeworkCalendar from '../components/HomeworkCalendar.js';

export function FacultyDashboard() {
  const [students, setStudents] = useState([]);
  const [selectedStudent, setSelectedStudent] = useState(null);
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

  // Attendance Form State
  const [showAttModal, setShowAttModal] = useState(false);
  const [attDate, setAttDate] = useState(new Date().toISOString().split('T')[0]);
  const [attRecords, setAttRecords] = useState({});
  const [attMsg, setAttMsg] = useState({ text: '', type: '' });
  
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

  useEffect(() => {
    // Auth is handled by ProtectedRoute — just fetch data
    const token = localStorage.getItem('schoolToken');
    axios.get(`${API_URL}/api/faculty/students`, {
      headers: { Authorization: `Bearer ${token}` }
    }).then(res => setStudents(res.data)).catch(console.error);

    fetchHomework();
  }, [navigate, user.role]);

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

  const handleLogout = () => {
    localStorage.removeItem('schoolToken');
    localStorage.removeItem('schoolUser');
    navigate('/login');
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

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Top Navbar */}
      <div className="bg-slate-900 text-white px-8 py-4 flex justify-between items-center shadow-md">
        <div className="flex items-center gap-4">
          <div className="w-16 h-16 bg-emerald-900 rounded-[20px] p-[4px] shadow-lg shrink-0">
            <div className="w-full h-full bg-white rounded-[16px] flex items-center justify-center overflow-hidden p-1.5">
              <img src={srvLogo} alt="SRV" className="w-full h-full object-contain scale-[1.15]" />
            </div>
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

            {/* Homework Dashboard Weekly Calendar */}
            <HomeworkCalendar homeworkList={assignedHomework} onRefresh={fetchHomework} />
          </div>

          {/* Sidebar Actions */}
          <div className="space-y-6">
            {/* Upload Homework */}
            <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-6">
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
                <select required value={hwForm.subject} onChange={e => setHwForm({...hwForm, subject: e.target.value})} className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm outline-none focus:ring-2 focus:ring-emerald-500">
                  <option value="" disabled>Select Subject</option>
                  <option value="English">English</option>
                  <option value="Tamil">Tamil</option>
                  <option value="Hindi">Hindi</option>
                  <option value="Mathematics">Mathematics</option>
                  <option value="Science">Science</option>
                  <option value="Social Science">Social Science</option>
                  <option value="Computer Science">Computer Science</option>
                </select>
                <input type="text" placeholder="Topic" required value={hwForm.title} onChange={e => setHwForm({...hwForm, title: e.target.value})} className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm outline-none focus:ring-2 focus:ring-emerald-500" />
                <textarea placeholder="Description..." rows="3" required value={hwForm.description} onChange={e => setHwForm({...hwForm, description: e.target.value})} className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm outline-none focus:ring-2 focus:ring-emerald-500"></textarea>
                <input type="date" required value={hwForm.dueDate} onChange={e => setHwForm({...hwForm, dueDate: e.target.value})} className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm outline-none focus:ring-2 focus:ring-emerald-500" />
                <button type="submit" className="w-full py-3 bg-amber-500 text-white font-bold rounded-xl hover:bg-amber-600 transition-colors text-sm">
                  Publish & Notify Parents
                </button>
              </form>
            </div>

            {/* Quick Actions */}
            <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-6">
              <h3 className="text-lg font-display font-bold text-slate-900 mb-4">Quick Actions</h3>
              <div className="space-y-3">
                <button onClick={openAttendanceModal} className="w-full flex items-center gap-3 p-3 rounded-xl border border-slate-200 hover:border-emerald-500 hover:bg-emerald-50 transition-colors text-left">
                  <CheckSquare className="text-emerald-600" size={20} />
                  <div>
                    <p className="font-semibold text-sm text-slate-900">Mark Attendance</p>
                    <p className="text-xs text-slate-500">Select student to record attendance</p>
                  </div>
                </button>
                <button onClick={openBehaviorModal} className="w-full flex items-center gap-3 p-3 rounded-xl border border-slate-200 hover:border-amber-500 hover:bg-amber-50 transition-colors text-left">
                  <AlertCircle className="text-amber-600" size={20} />
                  <div>
                    <p className="font-semibold text-sm text-slate-900">Log Daily Behavior</p>
                    <p className="text-xs text-slate-500">Assign points and add daily remarks</p>
                  </div>
                </button>
              </div>
            </div>

          </div>
        </div>

      </div>
      {/* Attendance Modal */}
      {showAttModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl p-8 max-w-lg w-full shadow-2xl relative max-h-[90vh] flex flex-col">
            <button onClick={() => setShowAttModal(false)} className="absolute top-6 right-6 text-slate-400 hover:text-slate-700 font-bold z-10">✕</button>
            <h3 className="text-2xl font-display font-bold text-slate-900 mb-6 shrink-0">Daily Register</h3>
            
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
        <div className="fixed inset-0 z-[60] bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl p-8 max-w-2xl w-full shadow-2xl relative max-h-[90vh] flex flex-col">
            <button onClick={() => setShowBhvModal(false)} className="absolute top-6 right-6 text-slate-400 hover:text-slate-700 font-bold z-10">✕</button>
            <h3 className="text-2xl font-display font-bold text-slate-900 mb-6 shrink-0 flex items-center gap-3"><AlertCircle className="text-amber-500" /> Daily Behavior Log</h3>
            
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

    </div>
  );
}

