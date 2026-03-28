import React, { useState } from 'react';
import { ChevronLeft, ChevronRight, Calendar as CalIcon, Clock, BookOpen, Edit2, Trash2, CalendarClock, X, Check } from 'lucide-react';
import axios from 'axios';
import API_URL from '../config/api.js';

export default function HomeworkCalendar({ homeworkList, onRefresh, isFaculty = false }) {
  // Weekly view logic
  const [currentWeekStart, setCurrentWeekStart] = useState(() => {
    const d = new Date();
    d.setHours(0, 0, 0, 0);
    const day = d.getDay(); // 0 is Sunday, 1 is Monday
    const diff = d.getDate() - day + (day === 0 ? -6 : 1); // adjust when day is sunday
    return new Date(d.setDate(diff));
  });

  const [flippedDay, setFlippedDay] = useState(null);
  const [editingHw, setEditingHw] = useState(null);
  const [extendingHw, setExtendingHw] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

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
    return d >= today && d <= today + 2 * 24 * 60 * 60 * 1000; // Due in next 2 days
  };

  // Actions
  const handleDelete = async (id) => {
    if (!window.confirm("Are you sure you want to delete this homework?")) return;
    try {
      const token = localStorage.getItem('schoolToken');
      await axios.delete(`${API_URL}/api/faculty/homework/${id}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (onRefresh) onRefresh();
    } catch (err) {
      console.error(err);
      alert('Error deleting homework');
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

            return (
              <div 
                key={i} 
                className="relative perspective-1000 h-[400px] w-full group"
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
                    <p className={`text-6xl font-display font-black mb-6 ${isToday ? 'text-emerald-900' : 'text-slate-800'}`}>
                      {day.getDate()}
                    </p>
                    {dayHomework.length > 0 ? (
                      <div className="bg-white border border-emerald-100 text-emerald-700 px-4 py-2 rounded-full text-xs font-bold shadow-sm flex items-center gap-2">
                        <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
                        {dayHomework.length} Task{dayHomework.length > 1 ? 's' : ''}
                      </div>
                    ) : (
                      <div className="bg-transparent text-slate-400 px-4 py-2 rounded-full text-xs font-semibold border border-slate-200">
                        No Tasks
                      </div>
                    )}
                    <div className="mt-auto pt-6 text-[10px] text-slate-400 font-bold uppercase tracking-widest flex items-center gap-1 opacity-50">
                      Hover to flip <ChevronRight size={10} />
                    </div>
                  </div>

                  {/* BACK FACE */}
                  <div className={`absolute w-full h-full backface-hidden rotate-y-180 rounded-[24px] border flex flex-col overflow-hidden bg-slate-900 border-slate-800 shadow-xl cursor-default`}>
                    <div className="p-3 bg-slate-800/80 border-b border-slate-700/50 text-center shrink-0 flex justify-between items-center px-4">
                      <span className="text-emerald-400 font-bold text-[10px] tracking-wider uppercase">
                        {day.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })}
                      </span>
                      <span className="text-slate-400 text-[10px] font-bold">{dayHomework.length} Task(s)</span>
                    </div>
                    
                    <div className="p-3 flex-1 flex flex-col gap-3 overflow-y-auto no-scrollbar" onClick={e => e.stopPropagation()}>
                      {dayHomework.length > 0 ? dayHomework.map(hw => {
                         const isPast = isPastDeadline(hw.dueDate);
                         const isUpcoming = isUpcomingDeadline(hw.dueDate) && !isPast;
                         
                         let borderClass = "border-slate-700/50";
                         if (isUpcoming) borderClass = "border-amber-500/30";

                         return (
                           <div key={hw._id} className={`bg-slate-800/50 border ${borderClass} rounded-xl p-3 shadow-sm relative flex flex-col`}>
                             <div className="flex justify-between items-start mb-2">
                               <span className="text-[9px] font-bold uppercase tracking-widest px-2 py-0.5 rounded bg-slate-700 text-emerald-400 inline-block">
                                 {hw.subject}
                               </span>
                             </div>
                             <h4 className="font-display font-bold text-white text-sm mb-1 leading-tight">{hw.title}</h4>
                             <p className="text-[11px] text-slate-400 line-clamp-2 leading-relaxed mb-3">{hw.description}</p>
                             
                             {/* Actions Footer */}
                             {isFaculty && (
                               <div className="flex justify-end gap-2 mt-auto pt-2 border-t border-slate-700/50">
                                 <button onClick={() => setEditingHw(hw)} className="p-1.5 bg-blue-500/10 hover:bg-blue-500/20 text-blue-400 rounded-md transition-colors" title="Edit Homework">
                                   <Edit2 size={12} />
                                 </button>
                                 <button onClick={() => setExtendingHw(hw)} className="p-1.5 bg-amber-500/10 hover:bg-amber-500/20 text-amber-400 rounded-md transition-colors" title="Extend Deadline">
                                   <CalendarClock size={12} />
                                 </button>
                                 <button onClick={() => handleDelete(hw._id)} className="p-1.5 bg-red-500/10 hover:bg-red-500/20 text-red-400 rounded-md transition-colors" title="Delete">
                                   <Trash2 size={12} />
                                 </button>
                               </div>
                             )}
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
