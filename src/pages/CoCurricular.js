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
    <div className="flex flex-col bg-slate-50 min-h-screen overflow-hidden">
      <PageHero title="Co-Curricular" breadcrumb="Co-Curricular" />
      <div className="absolute top-0 right-0 w-[600px] h-[600px] bg-emerald-100/30 rounded-full blur-[100px] -z-0" />
      <div className="absolute bottom-0 left-0 w-[500px] h-[500px] bg-amber-100/30 rounded-full blur-[100px] -z-0" />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10 w-full pt-20 pb-16">
        
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center mb-20"
        >
          <span className="text-emerald-600 font-semibold tracking-widest uppercase text-sm mb-4 block">
            Beyond the Classroom
          </span>
          <h1 className="text-5xl md:text-6xl font-display font-bold text-slate-900 mb-6">Co-curricular Activities</h1>
          <p className="text-lg text-slate-600 max-w-2xl mx-auto leading-relaxed">
            Discover a limitless world of opportunities to explore profound interests, develop unique talents, and build lifelong, meaningful friendships.
          </p>
        </motion.div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 lg:gap-24 items-center">
          
          <motion.div
            initial={{ opacity: 0, x: -30 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            className="grid grid-cols-2 gap-6 relative"
          >
            <div className="absolute inset-0 bg-gradient-to-tr from-emerald-500/20 to-amber-500/20 rounded-full blur-[80px] -z-10" />
            <img
              src="https://images.unsplash.com/photo-1526676037777-05a232554f77?q=80&w=2940&auto=format&fit=crop"
              alt="Sports"
              className="rounded-3xl h-72 w-full object-cover shadow-2xl shadow-slate-200/50"
              referrerPolicy="no-referrer"
            />
            <img
              src="https://images.unsplash.com/photo-1514525253161-7a46d19cd819?q=80&w=2874&auto=format&fit=crop"
              alt="Music"
              className="rounded-3xl h-72 w-full object-cover mt-12 shadow-2xl shadow-slate-200/50"
              referrerPolicy="no-referrer"
            />
          </motion.div>

          <div className="space-y-8">
            {activities.map((activity, index) => (
              <motion.div
                key={activity.title}
                initial={{ opacity: 0, x: 30 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true }}
                transition={{ delay: index * 0.1 }}
                className="group flex gap-6 p-6 rounded-3xl bg-white border border-slate-100 shadow-sm hover:shadow-xl hover:-translate-y-1 transition-all duration-300"
              >
                <div className={`w-16 h-16 rounded-2xl flex items-center justify-center shrink-0 transition-transform duration-300 group-hover:scale-110 group-hover:rotate-3
                  ${activity.color === 'emerald' ? 'bg-emerald-50 text-emerald-600' : 
                    activity.color === 'amber' ? 'bg-amber-50 text-amber-500' : 
                    activity.color === 'blue' ? 'bg-blue-50 text-blue-600' : 
                    'bg-purple-50 text-purple-600'}`}
                >
                  <activity.icon size={28} />
                </div>
                <div>
                  <h3 className="text-xl font-display font-bold text-slate-900 mb-2 flex items-center gap-2 group-hover:text-emerald-700 transition-colors">
                    {activity.title}
                    <ChevronRight size={18} className="opacity-0 -ml-4 group-hover:opacity-100 group-hover:ml-0 transition-all text-emerald-500" />
                  </h3>
                  <p className="text-slate-600 leading-relaxed text-[15px]">{activity.description}</p>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </div>
      <StatsCtaBanner />
    </div>
  );
}
