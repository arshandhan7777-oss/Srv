import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { LogOut, Bell, Download, FileText, Calendar as CalIcon, TrendingUp, Sparkles, CheckCircle2, Coffee, CreditCard, AlertCircle, Clock, CheckCheck, BookOpen } from 'lucide-react';
import srvLogo from '../assest/fav_logo/srv-t.png';
import { BarChart, Bar, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, Radar, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis } from 'recharts';
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';
import API_URL from '../config/api.js';

const COLORS = ['#10b981', '#f59e0b', '#ef4444', '#3b82f6'];

export function ParentDashboard() {
  const [data, setData] = useState({ student: null, records: [], homework: [], food: null, settings: {} });
  const [loading, setLoading] = useState(true);
  const [showPayModal, setShowPayModal] = useState(false);
  const [selectedTerm, setSelectedTerm] = useState({ id: '', name: '', amount: '', balance: '' });
  const [amountToPay, setAmountToPay] = useState('');
  const [processing, setProcessing] = useState(false);
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
      alert(err.response?.data?.message || 'Payment failed.');
    } finally {
      setProcessing(false);
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

            {/* Homework Section */}
            <div className="bg-white rounded-3xl p-8 shadow-sm border border-slate-100">
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
            <div className="bg-white rounded-3xl p-8 shadow-sm border border-slate-100 flex-1">
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

            <div className="h-64 mt-4 relative">
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

        {/* Homework & Assignments Section */}
        <div className="mt-8 bg-white rounded-3xl p-8 shadow-sm border border-slate-100">
          <div className="flex items-center gap-3 mb-6">
            <BookOpen className="text-pink-500" />
            <h3 className="text-xl font-display font-bold text-slate-900">Homework & Assignments</h3>
          </div>
          
          {data.homework && data.homework.length > 0 ? (
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
              {data.homework.map((hw) => (
                <div key={hw._id} className="p-5 bg-pink-50 border border-pink-100 rounded-2xl flex flex-col">
                  <span className="text-[10px] font-bold text-pink-500 uppercase tracking-widest bg-pink-100 px-2 py-1 rounded w-max mb-3">
                    {hw.subject}
                  </span>
                  <h4 className="font-display font-bold text-slate-900 text-lg mb-2 leading-tight">{hw.title}</h4>
                  <p className="text-sm text-slate-600 mb-4 flex-1">{hw.description}</p>
                  <div className="flex items-center justify-between text-xs font-bold pt-3 border-t border-pink-200/60 text-slate-500">
                    <div className="flex items-center gap-1.5"><CalIcon size={12} className="text-pink-400" /> Due:</div>
                    <span className="text-pink-700 bg-pink-200/40 px-2 py-0.5 rounded">{new Date(hw.dueDate).toLocaleDateString()}</span>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="p-6 border-2 border-dashed border-slate-100 rounded-2xl text-slate-400 font-semibold text-center mt-4">
              No active homework or assignments currently published by the faculty.
            </div>
          )}
        </div>

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
                <label className="block text-sm font-bold text-slate-600 mb-2">Amount to Pay Now (₹)</label>
                <input 
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

