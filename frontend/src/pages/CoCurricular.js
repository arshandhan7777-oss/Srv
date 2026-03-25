import { motion } from 'motion/react';
import { Music, Activity, Users, BookOpen, ChevronRight } from 'lucide-react';
import { PageHero } from '../components/PageHero';
import { StatsCtaBanner } from '../components/StatsCtaBanner';

const activities = [
  {
    icon: Activity,
    title: 'Sports & Athletics',
    description: 'Comprehensive sports programs including basketball, soccer, swimming, and track & field, fostering teamwork and physical wellness.',
    color: 'emerald'
  },
  {
    icon: Music,
    title: 'Performing Arts',
    description: 'Vibrant theater, award-winning choir, orchestra, and diverse dance programs designed to nurture profound creative expression.',
    color: 'amber'
  },
  {
    icon: Users,
    title: 'Clubs & Societies',
    description: 'Engaging debate club, Model UN, environmental society, and student council to build leadership and sociability.',
    color: 'blue'
  },
  {
    icon: BookOpen,
    title: 'Literary Activities',
    description: 'Creative writing workshops, intensive journalism, school magazine curation, and expressive poetry slams.',
    color: 'purple'
  }
];

export function CoCurricular() {
  return (
    <div className="flex flex-col bg-slate-50 min-h-screen">
      <PageHero title="Co-Curricular" breadcrumb="Co-Curricular" />
      
      {/* Dynamic Background */}
      <div className="absolute top-0 right-0 w-[600px] h-[600px] bg-emerald-100/30 rounded-full blur-[100px] -z-0" />
      <div className="absolute bottom-0 left-0 w-[500px] h-[500px] bg-amber-100/30 rounded-full blur-[100px] -z-0" />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10 w-full pt-20 pb-16">
        
        {/* Header Block */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center mb-16"
        >
          <span className="text-emerald-600 font-semibold tracking-widest uppercase text-sm mb-4 block">
            Beyond the Classroom
          </span>
          <h1 className="text-4xl md:text-5xl lg:text-6xl font-display font-bold text-slate-900 mb-6">Co-curricular Activities</h1>
          <p className="text-base md:text-lg text-slate-600 max-w-2xl mx-auto leading-relaxed">
            Discover a limitless world of opportunities to explore profound interests, develop unique talents, and build lifelong, meaningful friendships.
          </p>
        </motion.div>

        {/* Bento Grid Layout */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 lg:gap-8 mb-20">
          
          {/* Feature Card 1 - Spans 2 cols on Desktop */}
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="group relative md:col-span-2 lg:col-span-2 bg-slate-900 rounded-3xl overflow-hidden shadow-2xl isolate h-[350px] sm:h-[400px]"
          >
            <img 
              src="https://images.unsplash.com/photo-1526676037777-05a232554f77?q=80&w=2940&auto=format&fit=crop" 
              alt="Sports"
              className="absolute inset-0 w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-slate-900/90 via-slate-900/40 to-transparent pointer-events-none" />
            <div className="absolute bottom-0 left-0 p-8 sm:p-10 w-full">
              <div className="w-14 h-14 bg-emerald-500 rounded-2xl flex items-center justify-center text-white mb-6 shadow-xl shadow-emerald-500/30 group-hover:-translate-y-2 transition-transform duration-300">
                <Activity size={26} />
              </div>
              <h3 className="text-2xl sm:text-3xl font-display font-bold text-white mb-3">Sports & Athletics</h3>
              <p className="text-emerald-50 text-sm sm:text-base max-w-lg leading-relaxed opacity-90">
                Comprehensive sports programs including basketball, soccer, swimming, and track & field, fostering teamwork and physical wellness.
              </p>
            </div>
          </motion.div>

          {/* Feature Card 2 */}
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.1 }}
            className="group relative bg-amber-50 rounded-3xl overflow-hidden shadow-xl border border-amber-100 isolate h-[350px] sm:h-[400px] flex flex-col justify-end p-8"
          >
            <div className="absolute top-0 right-0 w-40 h-40 bg-amber-200/50 rounded-full blur-[40px] -z-10 group-hover:scale-150 transition-transform duration-700" />
            <div className="w-14 h-14 bg-amber-500 rounded-2xl flex items-center justify-center text-white mb-6 shadow-xl shadow-amber-500/20 group-hover:-translate-y-2 transition-transform duration-300">
              <Music size={26} />
            </div>
            <h3 className="text-2xl font-display font-bold text-slate-900 mb-3">Performing Arts</h3>
            <p className="text-slate-600 text-sm leading-relaxed">
              Vibrant theater, award-winning choir, orchestra, and diverse dynamic dance programs designed to nurture profound creative physical expression.
            </p>
          </motion.div>

          {/* Feature Card 3 */}
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.2 }}
            className="group relative bg-blue-50 rounded-3xl overflow-hidden shadow-xl border border-blue-100 isolate h-[350px] flex flex-col justify-end p-8"
          >
             <div className="absolute top-0 left-0 w-40 h-40 bg-blue-200/50 rounded-full blur-[40px] -z-10 group-hover:scale-150 transition-transform duration-700" />
            <div className="w-14 h-14 bg-blue-600 rounded-2xl flex items-center justify-center text-white mb-6 shadow-xl shadow-blue-600/20 group-hover:-translate-y-2 transition-transform duration-300">
              <Users size={26} />
            </div>
            <h3 className="text-2xl font-display font-bold text-slate-900 mb-3">Clubs & Societies</h3>
            <p className="text-slate-600 text-sm leading-relaxed">
              Engaging debate club, Model UN, environmental society, and student council to deeply build your leadership and sociability footprint.
            </p>
          </motion.div>

          {/* Feature Card 4 - Spans 2 cols on Desktop */}
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.3 }}
            className="group relative md:col-span-2 lg:col-span-2 bg-slate-900 rounded-3xl overflow-hidden shadow-2xl isolate h-[350px]"
          >
            <img 
              src="https://images.unsplash.com/photo-1524995997946-a1c2e315a42f?q=80&w=2940&auto=format&fit=crop" 
              alt="Literary"
              className="absolute inset-0 w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-slate-900/95 via-slate-900/60 to-transparent pointer-events-none" />
            <div className="absolute bottom-0 left-0 p-8 sm:p-10 w-full">
              <div className="w-14 h-14 bg-purple-600 rounded-2xl flex items-center justify-center text-white mb-6 shadow-xl shadow-purple-600/30 group-hover:-translate-y-2 transition-transform duration-300">
                <BookOpen size={26} />
              </div>
              <h3 className="text-2xl sm:text-3xl font-display font-bold text-white mb-3 flex items-center gap-3">
                Literary Activities
                <ChevronRight size={24} className="text-purple-400 opacity-0 -translate-x-4 group-hover:opacity-100 group-hover:translate-x-0 transition-all duration-300" />
              </h3>
              <p className="text-purple-50 text-sm sm:text-base max-w-lg leading-relaxed opacity-90">
                Creative writing workshops, intensive journalism, school magazine curation, and expressive poetry slams that open doors to global perspectives.
              </p>
            </div>
          </motion.div>

        </div>
      </div>
      
      {/* Remove rigid sizing and let content flow securely without extending past 100% */}
      <StatsCtaBanner />
    </div>
  );
}
