import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { LogOut, Bell, Download, FileText, Calendar as CalIcon, TrendingUp, Sparkles, CheckCircle2, Coffee } from 'lucide-react';
import srvLogo from '../assest/fav_logo/srv-t.png';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, Radar, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis } from 'recharts';
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';

const COLORS = ['#10b981', '#f59e0b', '#ef4444', '#3b82f6'];

export function ParentDashboard() {
  const [data, setData] = useState({ student: null, records: [], homework: [], food: null });
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();
  const reportRef = useRef();

  useEffect(() => {
    const user = JSON.parse(localStorage.getItem('schoolUser') || '{}');
    if (user.role !== 'parent') {
      navigate('/portal/login');
      return;
    }

    const token = localStorage.getItem('schoolToken');
    axios.get('https://srv-backend-3b9s.onrender.com' + '/api/parent/dashboard', {
      headers: { Authorization: `Bearer ${token}` }
    }).then(res => {
      setData(res.data);
      setLoading(false);
    }).catch(err => {
      console.error(err);
      setLoading(false); // Even if it fails, stop loading to show fallback UI
    });
  }, [navigate]);

  const handleLogout = () => {
    localStorage.removeItem('schoolToken');
    localStorage.removeItem('schoolUser');
    navigate('/portal/login');
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

  // Dynamic Data Formatting
  const latestRecord = data.records?.[0]; // Use most recent term
  
  const marksData = latestRecord?.marks ? Object.entries(latestRecord.marks).map(([sub, val]) => ({
    subject: sub.charAt(0).toUpperCase() + sub.slice(1).replace(/([A-Z])/g, ' $1'),
    marks: val
  })) : [];

  const attendanceData = latestRecord ? [
    { name: 'Present', value: latestRecord.daysPresent },
    { name: 'Absent', value: Math.max(latestRecord.totalWorkingDays - latestRecord.daysPresent, 0) },
  ] : [];

  const nliteData = latestRecord?.nliteSkills ? [
    { skill: 'Comm.', score: latestRecord.nliteSkills.communication, fullMark: 5 },
    { skill: 'Teamwork', score: latestRecord.nliteSkills.teamwork, fullMark: 5 },
    { skill: 'Learning', score: latestRecord.nliteSkills.lifelongLearning, fullMark: 5 },
    { skill: 'Attitude', score: latestRecord.nliteSkills.positiveAttitude, fullMark: 5 },
    { skill: 'Wellbeing', score: latestRecord.nliteSkills.holisticWellbeing, fullMark: 5 },
    { skill: 'Languages', score: latestRecord.nliteSkills.languageProficiency, fullMark: 5 },
  ] : [];

  if (loading) return <div className="min-h-screen flex items-center justify-center bg-slate-50">Loading Dashboard...</div>;

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Top Navbar */}
      <div className="bg-slate-900 text-white px-4 sm:px-8 py-4 flex justify-between items-center shadow-md">
        <div className="flex items-center gap-4">
          <div className="p-1.5 rounded-[1.25rem] bg-emerald-900 shadow-lg flex items-center justify-center shrink-0">
             <div className="w-16 h-16 bg-white rounded-xl flex items-center justify-center p-1.5">
               <img src={srvLogo} alt="SRV" className="w-full h-full object-contain" />
             </div>
          </div>
          <div>
            <h1 className="font-display font-bold text-lg leading-tight">Parent Portal</h1>
            <p className="text-xs text-amber-400">SRV Matriculation School</p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <button className="relative w-10 h-10 flex items-center justify-center text-slate-300 hover:text-white transition-colors">
            <Bell size={20} />
            <span className="absolute top-2 right-2 w-2 h-2 bg-red-500 rounded-full"></span>
          </button>
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
          
          {/* Marks Chart */}
          <div className="lg:col-span-2 bg-white rounded-3xl p-8 shadow-sm border border-slate-100">
            <div className="flex justify-between items-center mb-8">
              <div className="flex items-center gap-3">
                <TrendingUp className="text-emerald-500" />
                <h3 className="text-xl font-display font-bold text-slate-900">Academic Performance</h3>
              </div>
              <span className="bg-slate-100 text-slate-600 px-3 py-1 rounded-full text-xs font-bold">{latestRecord?.term || 'No Data'}</span>
            </div>
            
            {marksData.length > 0 ? (
              <div className="h-72 w-full">
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

          {/* Attendance Chart */}
          <div className="bg-white rounded-3xl p-8 shadow-sm border border-slate-100">
            <div className="flex items-center gap-3 mb-6">
              <Sparkles className="text-amber-500" />
              <h3 className="text-xl font-display font-bold text-slate-900">Nlite 21st-Century Skills</h3>
            </div>
            
            {nliteData.length > 0 ? (
              <div className="h-64 w-full">
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
          <div className="bg-white rounded-3xl p-8 shadow-sm border border-slate-100">
            <div className="flex items-center gap-3 mb-6">
              <CalIcon className="text-blue-500" />
              <h3 className="text-xl font-display font-bold text-slate-900">Attendance Tracker</h3>
            </div>
            
            {attendanceData.length > 0 ? (
              <>
                <div className="h-48 relative w-full flex justify-center">
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
                    <span className="text-2xl font-display font-bold text-slate-900">{latestRecord?.attendancePercentage || 0}%</span>
                    <span className="text-[10px] text-slate-500 font-bold uppercase tracking-wider">Present</span>
                  </div>
                </div>
                <div className="flex justify-center gap-6 mt-4">
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-3 rounded-full bg-emerald-500"></div>
                    <span className="text-sm font-semibold text-slate-600">{latestRecord.daysPresent} Days</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-3 rounded-full bg-amber-500"></div>
                    <span className="text-sm font-semibold text-slate-600">{latestRecord.totalWorkingDays - latestRecord.daysPresent} Days</span>
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

        {/* Homework Section */}
        <div className="mt-8 bg-white rounded-3xl p-8 shadow-sm border border-slate-100">
          <div className="flex items-center gap-3 mb-6">
            <FileText className="text-blue-500" />
            <h3 className="text-xl font-display font-bold text-slate-900">Recent Homework & Tasks</h3>
          </div>
          
          <div className="grid md:grid-cols-2 gap-4">
            {data.homework?.length > 0 ? data.homework.map(hw => (
              <div key={hw._id} className="p-5 border border-slate-100 rounded-2xl bg-slate-50 hover:bg-white transition-colors">
                <div className="flex justify-between items-start mb-2">
                  <span className="px-3 py-1 bg-blue-100 text-blue-700 text-xs font-bold rounded-full">{hw.subject}</span>
                  <span className="text-xs font-bold text-red-500">Due: {new Date(hw.dueDate).toLocaleDateString()}</span>
                </div>
                <h4 className="font-semibold text-slate-900 text-lg mb-1">{hw.title}</h4>
                <p className="text-sm text-slate-600">{hw.description}</p>
              </div>
            )) : (
              <div className="col-span-2 p-5 border-2 border-dashed border-slate-100 rounded-2xl text-slate-400 font-semibold text-center">
                No recent homework assignments.
              </div>
            )}
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

      </div>
    </div>
  );
}

