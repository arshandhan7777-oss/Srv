import React, { useState } from 'react';
import { ChevronLeft, ChevronRight, Calendar as CalIcon, Clock, BookOpen } from 'lucide-react';

export default function HomeworkCalendar({ homeworkList, onRefresh }) {
  // Weekly view logic
  const [currentWeekStart, setCurrentWeekStart] = useState(() => {
    const d = new Date();
    d.setHours(0, 0, 0, 0);
    const day = d.getDay(); // 0 is Sunday, 1 is Monday
    const diff = d.getDate() - day + (day === 0 ? -6 : 1); // adjust when day is sunday
    return new Date(d.setDate(diff));
  });

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
  };

  const prevWeek = () => {
    const d = new Date(currentWeekStart);
    d.setDate(d.getDate() - 7);
    setCurrentWeekStart(d);
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

  return (
    <div className="bg-white rounded-3xl p-6 lg:p-8 shadow-sm border border-slate-100 mt-8">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between mb-6 gap-4">
        <div className="flex items-center gap-3">
          <BookOpen className="text-emerald-500" />
          <h3 className="text-xl font-display font-bold text-slate-900">Homework Dashboard</h3>
        </div>
        <div className="flex items-center gap-4">
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
        <div className="min-w-[900px] grid grid-cols-7 gap-4">
          {days.map((day, i) => {
            const dayHomework = homeworkList.filter(hw => isSameDay(hw.dueDate, day));
            const isToday = isSameDay(day, new Date());
            return (
              <div key={i} className={`flex flex-col h-full min-h-[350px] rounded-2xl border ${isToday ? 'border-emerald-300 bg-emerald-50/30' : 'border-slate-100 bg-slate-50'} overflow-hidden`}>
                <div className={`text-center py-3 border-b ${isToday ? 'bg-emerald-100 border-emerald-200 shadow-sm' : 'bg-slate-100/50 border-slate-100'}`}>
                  <p className={`text-xs font-bold uppercase tracking-widest ${isToday ? 'text-emerald-700' : 'text-slate-500'}`}>
                    {day.toLocaleDateString('en-US', { weekday: 'short' })}
                  </p>
                  <p className={`text-lg font-display font-black ${isToday ? 'text-emerald-900' : 'text-slate-900'}`}>
                    {day.getDate()}
                  </p>
                </div>
                <div className="p-3 flex-1 flex flex-col gap-3 overflow-y-auto">
                  {dayHomework.length > 0 ? dayHomework.map(hw => {
                     const isPast = isPastDeadline(hw.dueDate);
                     const isUpcoming = isUpcomingDeadline(hw.dueDate) && !isPast;
                     
                     let cardClasses = "bg-white border rounded-xl p-3 shadow-sm hover:shadow-md transition-shadow relative overflow-hidden flex flex-col ";
                     if (isPast) cardClasses += "border-slate-200 opacity-75 grayscale-[20%]";
                     else if (isUpcoming) cardClasses += "border-red-200 bg-red-50/50";
                     else cardClasses += "border-slate-100 hover:border-emerald-200";

                     return (
                       <div key={hw._id} className={cardClasses}>
                         {isUpcoming && <div className="absolute top-0 right-0 w-8 h-8 bg-red-100 rounded-bl-full border-b border-l border-red-200 flex items-start justify-end p-1"><span className="w-2 h-2 rounded-full bg-red-600 animate-pulse"></span></div>}
                         <span className={`text-[9px] font-bold uppercase tracking-widest px-2 py-0.5 rounded w-max mb-2 inline-block ${isPast ? 'bg-slate-100 text-slate-500' : isUpcoming ? 'bg-red-100 text-red-700' : 'bg-blue-100 text-blue-700'}`}>
                           {hw.subject}
                         </span>
                         <h4 className="font-display font-bold text-slate-900 text-sm mb-1.5 leading-tight break-words">{hw.title}</h4>
                         <p className="text-xs text-slate-600 mb-3 line-clamp-3 leading-relaxed">{hw.description}</p>
                         <div className="flex justify-between items-center text-[10px] font-bold text-slate-400 mt-auto pt-2 border-t border-slate-50">
                            <div className="flex items-center gap-1"><Clock size={10} /> {isPast ? 'Passed' : 'Due'}</div>
                            <span className={isPast ? 'text-slate-500 line-through' : isUpcoming ? 'text-red-600' : 'text-slate-700'}>
                              {new Date(hw.dueDate).toLocaleDateString()}
                            </span>
                         </div>
                       </div>
                     );
                  }) : (
                    <div className="flex flex-col items-center justify-center h-full text-slate-400 opacity-40 space-y-2 mt-4">
                       <CalIcon size={24} strokeWidth={1.5} />
                       <span className="text-[10px] font-bold uppercase tracking-widest text-center">No Tasks<br/>Assigned</span>
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
