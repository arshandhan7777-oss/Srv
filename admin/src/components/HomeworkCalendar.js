import React, { useState } from 'react';
import { ChevronLeft, ChevronRight, Calendar as CalIcon, Clock, BookOpen, Edit2, Trash2, CalendarClock, X, Check, History, ArrowRight, Archive, ChevronDown } from 'lucide-react';
import axios from 'axios';
import API_URL from '../config/api.js';

export default function HomeworkCalendar({ homeworkList, onRefresh, isFaculty = false }) {
  // Weekly view logic
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

  // Subject history state
  const [historySubject, setHistorySubject] = useState(null);
  const [historyData, setHistoryData] = useState([]);
  const [historyLoading, setHistoryLoading] = useState(false);

  // Calculate the 7 days
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

  // Group homework by subject for a given day
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

  // Subject color mapping
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

  // Fetch subject history
  const openSubjectHistory = async (subject) => {
    setHistorySubject(subject);
    setHistoryLoading(true);
    try {
      const token = localStorage.getItem('schoolToken');
      const basePath = isFaculty ? '/api/faculty' : '/api/parent';
      const res = await axios.get(`${API_URL}${basePath}/homework/history/${encodeURIComponent(subject)}`, {
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

  // Actions
  const handleDelete = async (id) => {
    if (!window.confirm("Are you sure you want to archive this homework?")) return;
    try {
      const token = localStorage.getItem('schoolToken');
      await axios.delete(`${API_URL}/api/faculty/homework/${id}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (onRefresh) onRefresh();
    } catch (err) {
      console.error(err);
      alert('Error archiving homework');
    }
  };

  const handleUpdate = async (id, updatedData) => {
    setIsSubmitting(true);
    try {
      const token = localStorage.getItem('schoolToken');
      await axios.put(`${API_URL}/api/faculty/homework/${id}`, updatedData, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setEditingHw(null);
      setExtendingHw(null);
      if (onRefresh) onRefresh();
    } catch (err) {
      console.error(err);
      alert('Error updating homework');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="bg-white rounded-3xl p-6 lg:p-8 shadow-sm border border-slate-100 mt-8 relative">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between mb-6 gap-4">
        <div className="flex items-center gap-3">
          <BookOpen className="text-emerald-500" />
          <h3 className="text-xl font-display font-bold text-slate-900">Homework Dashboard</h3>
        </div>
        <div className="flex items-center gap-4 cursor-pointer">
           {onRefresh && (
             <button onClick={onRefresh} className="text-sm text-slate-500 font-semibold hover:text-emerald-600 transition-colors">
               Refresh Data
             </button>
           )}
           <div className="flex items-center gap-2 bg-slate-50 rounded-xl p-1 border border-slate-200">
             <button onClick={prevWeek} className="p-1.5 hover:bg-white rounded-lg transition-colors"><ChevronLeft size={18} className="text-slate-600" /></button>
             <span className="text-sm font-bold text-slate-700 w-36 text-center">
               {days[0].toLocaleDateString('en-US', { month: 'short', day: 'numeric' })} - {days[6].toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
             </span>
             <button onClick={nextWeek} className="p-1.5 hover:bg-white rounded-lg transition-colors"><ChevronRight size={18} className="text-slate-600" /></button>
           </div>
        </div>
      </div>

      <div className="overflow-x-auto pb-4">
        <div className="min-w-[1000px] grid grid-cols-7 gap-4">
          {days.map((day, i) => {
            const dayHomework = homeworkList.filter(hw => isSameDay(hw.dueDate, day));
            const isToday = isSameDay(day, new Date());
            const isFlipped = flippedDay === i;
            const grouped = groupBySubject(dayHomework);
            const subjectKeys = Object.keys(grouped);

            return (
              <div 
                key={i} 
                className="relative perspective-1000 h-[420px] w-full group"
                onMouseEnter={() => setFlippedDay(i)}
                onMouseLeave={() => setFlippedDay(null)}
                onClick={() => setFlippedDay(isFlipped ? null : i)}
              >
                <div className={`w-full h-full relative transition-transform duration-700 transform-style-3d ${isFlipped ? 'rotate-y-180' : 'group-hover:[transform:rotateY(180deg)]'}`}>
                  
                  {/* FRONT FACE */}
                  <div className={`absolute w-full h-full backface-hidden rounded-[24px] border flex flex-col justify-center items-center p-6 cursor-pointer shadow-sm transition-colors ${isToday ? 'border-emerald-300 bg-emerald-50' : 'border-slate-100 bg-slate-50'}`}>
                    <p className={`text-sm font-bold uppercase tracking-widest mb-3 ${isToday ? 'text-emerald-600' : 'text-slate-500'}`}>
                      {day.toLocaleDateString('en-US', { weekday: 'long' })}
                    </p>
                    <p className={`text-6xl font-display font-black mb-4 ${isToday ? 'text-emerald-900' : 'text-slate-800'}`}>
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
                      Hover to flip <ChevronRight size={10} />
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

                            {/* Homework entries under this subject */}
                            <div className="px-3 pb-2 space-y-1.5">
                              {subjectHw.map(hw => (
                                <div key={hw._id} className="bg-slate-800/50 rounded-lg p-2.5 relative">
                                  <h4 className="font-display font-bold text-white text-[12px] mb-0.5 leading-tight">{hw.title}</h4>
                                  <p className="text-[10px] text-slate-400 line-clamp-2 leading-relaxed mb-1.5">{hw.description}</p>
                                  <div className="flex items-center justify-between">
                                    <span className="text-[9px] text-slate-500 font-semibold flex items-center gap-1">
                                      <Clock size={9} /> Due: {new Date(hw.dueDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                                    </span>
                                    {isFaculty && (
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
                                    )}
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

      {/* ─── Subject History Slide-out Panel ─── */}
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
                <label className="block text-xs font-bold text-slate-500 mb-1 uppercase tracking-wider">Subject</label>
                <input required type="text" value={editingHw.subject} onChange={e => setEditingHw({...editingHw, subject: e.target.value})} className="w-full px-4 py-2 border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-blue-500 font-semibold" />
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-500 mb-1 uppercase tracking-wider">Topic</label>
                <input required type="text" value={editingHw.title} onChange={e => setEditingHw({...editingHw, title: e.target.value})} className="w-full px-4 py-2 border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-blue-500 font-semibold" />
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-500 mb-1 uppercase tracking-wider">Description</label>
                <textarea required rows="3" value={editingHw.description} onChange={e => setEditingHw({...editingHw, description: e.target.value})} className="w-full px-4 py-2 border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-blue-500 text-sm"></textarea>
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
                <label className="block text-xs font-bold text-slate-500 mb-2 uppercase tracking-wider">New Due Date</label>
                <input 
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
  );
}
