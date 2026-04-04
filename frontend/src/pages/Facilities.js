import { motion } from 'motion/react';
import { PageHero } from '../components/PageHero';
import { StatsCtaBanner } from '../components/StatsCtaBanner';
import { Building2, Volleyball, Microscope, Monitor, Tv, BookOpen, Trophy, Users } from 'lucide-react';
import { facilitiesImages, getPageImage } from '../config/pageImages';

const infrastructureItems = [
  { icon: Microscope, label: 'Science Labs', color: 'emerald' },
  { icon: Monitor, label: 'Computer Labs', color: 'blue' },
  { icon: Tv, label: 'Smart Classrooms (LCD)', color: 'purple' },
  { icon: BookOpen, label: 'Resource Room', color: 'amber' },
  { icon: Building2, label: 'Auditorium', color: 'emerald' },
];

const sportsItems = [
  'Volleyball', 'Tennis', 'Basketball', 'Cricket Ground', 'Football Ground'
];

const programItems = [
  "Math & Science Olympiad",
  "Drug Awareness Program",
  "Scouts & Guides",
  "Social Science & Science Exhibitions",
  "Inter-School Sports Competitions",
  "Regional & National Level Events",
];

const colorMap = {
  emerald: 'bg-emerald-100 text-emerald-600',
  blue: 'bg-blue-100 text-blue-600',
  purple: 'bg-purple-100 text-purple-600',
  amber: 'bg-amber-100 text-amber-600',
};

export function Facilities() {
  return (
    <div className="flex flex-col bg-slate-50 min-h-screen">
      <PageHero title="Facilities" breadcrumb="Facilities" />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-20 pb-20 w-full">

        {/* Section 1 — Infrastructure & Facilities with Diamond Collage */}
        <div className="grid lg:grid-cols-2 gap-16 items-center mb-24">

          {/* Diamond Image Collage */}
          <motion.div
            initial={{ opacity: 0, x: -40 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            className="relative h-[480px] hidden md:block"
          >
            <motion.div
              animate={{ y: [-10, 10, -10] }}
              transition={{ duration: 6, repeat: Infinity, ease: 'easeInOut' }}
              className="absolute inset-0"
            >
              {/* Center Diamond */}
              <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-72 h-72 rotate-45 rounded-[2.5rem] overflow-hidden border-8 border-white shadow-2xl z-20">
                <img
                  src={getPageImage(facilitiesImages, 0, "https://images.unsplash.com/photo-1577896851231-70ef18881754?q=80&w=2940&auto=format&fit=crop")}
                  className="-rotate-45 scale-[1.35] object-cover w-full h-full"
                  alt="Students on Campus"
                  referrerPolicy="no-referrer"
                />
              </div>
              {/* Top Right */}
              <div className="absolute top-4 right-4 w-44 h-44 rotate-45 rounded-3xl overflow-hidden border-8 border-white shadow-xl z-10">
                <img
                  src={getPageImage(facilitiesImages, 1, "https://images.unsplash.com/photo-1532094349884-543bc11b234d?q=80&w=2940&auto=format&fit=crop")}
                  className="-rotate-45 scale-150 object-cover w-full h-full"
                  alt="Science Lab"
                  referrerPolicy="no-referrer"
                />
              </div>
              {/* Bottom Left */}
              <div className="absolute bottom-4 left-4 w-44 h-44 rotate-45 rounded-3xl overflow-hidden border-8 border-white shadow-xl z-10">
                <img
                  src={getPageImage(facilitiesImages, 2, "https://images.unsplash.com/photo-1511629091441-ee46146481b6?q=80&w=2940&auto=format&fit=crop")}
                  className="-rotate-45 scale-150 object-cover w-full h-full"
                  alt="Sports Ground"
                  referrerPolicy="no-referrer"
                />
              </div>
            </motion.div>
          </motion.div>

          {/* Text Content */}
          <motion.div
            initial={{ opacity: 0, x: 40 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            className="space-y-6"
          >
            <div>
              <span className="text-amber-500 font-semibold tracking-widest uppercase text-sm mb-3 block">Our Infrastructure</span>
              <h2 className="text-3xl lg:text-4xl font-display font-bold text-slate-900 leading-tight mb-5">
                Infrastructure &<br />Facilities
              </h2>
            </div>
            <p className="text-slate-600 text-[15px] leading-relaxed">
              The school is well equipped with all modern educational infrastructures like science labs, computer labs, an auditorium with LCD projectors (Smart Class), and a resource room to facilitate learning among students.
            </p>
            <p className="text-slate-600 text-[15px] leading-relaxed">
              The campus also has all the major sporting facilities like volleyball, tennis, basketball courts, a cricket and football ground, etc. SRV encourages students to participate in various inter-school, regional and national level sports competitions. Regular organization of co-curricular activities such as Math & Science Olympiad, drug awareness program, Scouts & Guides, Social Science & Science exhibitions makes SRV one of the top schools.
            </p>

            {/* Infrastructure Quick Tags */}
            <div className="flex flex-wrap gap-2.5 pt-2">
              {infrastructureItems.map(({ icon: Icon, label, color }) => (
                <span key={label} className={`flex items-center gap-2 px-4 py-2 rounded-full text-sm font-semibold ${colorMap[color]} border border-current/10`}>
                  <Icon size={14} strokeWidth={2.5} />
                  {label}
                </span>
              ))}
            </div>
          </motion.div>
        </div>

        {/* Section 2 — Sports + Programs */}
        <div className="grid md:grid-cols-2 gap-8 mb-20">

          {/* Sports Facilities */}
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="bg-white rounded-2xl p-10 shadow-xl border border-slate-100"
          >
            <div className="flex items-center gap-3 mb-2">
              <div className="w-10 h-10 bg-amber-100 rounded-xl flex items-center justify-center text-amber-600 shrink-0">
                <Trophy size={20} />
              </div>
              <h3 className="text-xl font-display font-bold text-slate-900">Sports Facilities</h3>
            </div>
            <div className="w-10 h-0.5 bg-amber-500 rounded-full mb-6 ml-[52px]"></div>
            <p className="text-slate-600 text-sm leading-relaxed mb-6">
              SRV encourages students to participate in various inter-school, regional and national level sports competitions with world-class sporting infrastructure.
            </p>
            <div className="flex flex-wrap gap-2.5">
              {sportsItems.map((sport) => (
                <span key={sport} className="px-4 py-2 bg-amber-50 text-amber-700 text-sm font-semibold rounded-full border border-amber-200">
                  {sport}
                </span>
              ))}
            </div>
          </motion.div>

          {/* Programs & Activities */}
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.1 }}
            className="bg-emerald-900 rounded-2xl p-10 shadow-xl text-white"
          >
            <div className="flex items-center gap-3 mb-2">
              <div className="w-10 h-10 bg-amber-500 rounded-xl flex items-center justify-center shrink-0">
                <Users size={20} className="text-white" />
              </div>
              <h3 className="text-xl font-display font-bold">Programs & Events</h3>
            </div>
            <div className="w-10 h-0.5 bg-amber-500 rounded-full mb-6 ml-[52px]"></div>
            <p className="text-emerald-200 text-sm leading-relaxed mb-6">
              Regular organization of co-curricular activities makes SRV one of the top schools in the region.
            </p>
            <ul className="space-y-3">
              {programItems.map((item) => (
                <li key={item} className="flex items-center gap-3 text-emerald-100 text-sm">
                  <span className="w-2 h-2 rounded-full bg-amber-400 shrink-0"></span>
                  {item}
                </li>
              ))}
            </ul>
          </motion.div>
        </div>

        {/* Section 3 — Facilities Grid Cards */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-center mb-12"
        >
          <span className="text-amber-500 font-semibold tracking-widest uppercase text-sm mb-3 block">Infrastructure</span>
          <h3 className="text-3xl font-display font-bold text-slate-900">World-Class Infrastructure</h3>
        </motion.div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
          {[
            { img: getPageImage(facilitiesImages, 3, 'https://images.unsplash.com/photo-1509062522246-3755977927d7?q=80&w=2000&auto=format&fit=crop'), label: 'Smart Classrooms', desc: 'Equipped with LCD projectors and interactive boards for immersive learning.' },
            { img: getPageImage(facilitiesImages, 4, 'https://images.unsplash.com/photo-1532094349884-543bc11b234d?q=80&w=2940&auto=format&fit=crop'), label: 'Science Laboratories', desc: 'Fully equipped labs for Physics, Chemistry, and Biology experiments.' },
            { img: getPageImage(facilitiesImages, 5, 'https://images.unsplash.com/photo-1517694712202-14dd9538aa97?q=80&w=2940&auto=format&fit=crop'), label: 'Computer Labs', desc: 'Modern computer labs for digital skills and software learning.' },
            { img: getPageImage(facilitiesImages, 6, 'https://images.unsplash.com/photo-1546410531-bb4caa6b424d?q=80&w=2942&auto=format&fit=crop'), label: 'Resource Room', desc: 'A dedicated space to facilitate research, self-study, and collaborative work.' },
            { img: getPageImage(facilitiesImages, 7, 'https://images.unsplash.com/photo-1577896851231-70ef18881754?q=80&w=2940&auto=format&fit=crop'), label: 'Sports Ground', desc: 'Volleyball, cricket, football and basketball facilities for physical fitness.' },
            { img: getPageImage(facilitiesImages, 8, 'https://images.unsplash.com/photo-1523050854058-8df90110c9f1?q=80&w=2940&auto=format&fit=crop'), label: 'Auditorium', desc: 'A spacious auditorium for cultural events, competitions, and assemblies.' },
          ].map((item, i) => (
            <motion.div
              key={item.label}
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.08 }}
              className="group rounded-3xl overflow-hidden bg-white shadow-lg hover:shadow-2xl hover:-translate-y-2 transition-all duration-300 border border-slate-100"
            >
              <div className="h-48 overflow-hidden">
                <img
                  src={item.img}
                  alt={item.label}
                  referrerPolicy="no-referrer"
                  className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                />
              </div>
              <div className="p-6">
                <h4 className="font-display font-bold text-slate-900 text-lg mb-2">{item.label}</h4>
                <p className="text-slate-500 text-sm leading-relaxed">{item.desc}</p>
              </div>
            </motion.div>
          ))}
        </div>

      </div>

      <StatsCtaBanner />
    </div>
  );
}
