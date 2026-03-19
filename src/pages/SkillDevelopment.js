import { motion } from 'motion/react';
import { Link } from 'react-router-dom';
import { MessageCircle, Users, Sparkles, Briefcase, Heart, Globe, ArrowRight, CheckCircle2, Phone } from 'lucide-react';
import { PageHero } from '../components/PageHero';
import { StatsCtaBanner } from '../components/StatsCtaBanner';

const skills = [
  {
    icon: MessageCircle,
    title: 'Communication Mastery',
    desc: 'Sharpen your verbal and written communication skills in Hindi, English, Tamil, and Arabic to excel in any situation. Develop commercial awareness through real-world scenarios.',
    color: 'amber',
  },
  {
    icon: Users,
    title: 'Effective Teamwork & Problem Solving',
    desc: 'Collaborate seamlessly, tackle challenges with innovative solutions, and demonstrate initiative in everything you do.',
    color: 'emerald',
  },
  {
    icon: Sparkles,
    title: 'Lifelong Learner',
    desc: 'Cultivate a growth mindset and a commitment to lifelong learning, adapting to the ever-changing demands of the modern world.',
    color: 'blue',
  },
  {
    icon: Briefcase,
    title: 'Positive Work Attitude',
    desc: 'Develop a strong work ethic, self-management skills, and a positive attitude towards work that employers truly value.',
    color: 'purple',
  },
  {
    icon: Heart,
    title: 'Holistic Wellbeing',
    desc: 'Prioritize your physical and mental health with structured programs designed to build resilience and personal confidence.',
    color: 'amber',
  },
  {
    icon: Globe,
    title: 'Language Proficiency',
    desc: 'The school focuses specially on developing and enhancing required language skills in Hindi, English, Tamil and Arabic to excel in any situation.',
    color: 'emerald',
  },
];

const colorMap = {
  amber: { bg: 'bg-amber-100', text: 'text-amber-600', border: 'border-amber-200' },
  emerald: { bg: 'bg-emerald-100', text: 'text-emerald-600', border: 'border-emerald-200' },
  blue: { bg: 'bg-blue-100', text: 'text-blue-600', border: 'border-blue-200' },
  purple: { bg: 'bg-purple-100', text: 'text-purple-600', border: 'border-purple-200' },
};

export function SkillDevelopment() {
  return (
    <div className="flex flex-col bg-slate-50 min-h-screen">
      <PageHero title="Skill Development" breadcrumb="Skills" />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-20 pb-20 w-full">

        {/* Section 1 — Hero Intro */}
        <div className="grid lg:grid-cols-2 gap-16 items-center mb-24">

          {/* Text */}
          <motion.div
            initial={{ opacity: 0, x: -40 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.7 }}
          >
            <span className="text-amber-500 font-semibold tracking-widest uppercase text-sm mb-3 block">
              Beyond Academics
            </span>
            <h2 className="text-3xl lg:text-4xl font-display font-bold text-slate-900 leading-tight mb-6">
              Building Bright Futures:<br />
              <span className="text-amber-500">Skill Development</span> at Our School
            </h2>
            <p className="text-slate-600 text-[15px] leading-relaxed mb-6">
              Go beyond academics and develop the essential skills needed for success in the 21st century. Our comprehensive Skill Development Program, partnered with <strong className="text-emerald-700">Nlite Academy</strong>, equips you with not only core subject expertise but also the <strong className="text-slate-900">highly sought-after employability skills</strong> employers crave.
            </p>
            <div className="bg-emerald-50 border-l-4 border-emerald-500 p-5 rounded-r-xl">
              <p className="text-emerald-800 text-sm font-semibold">
                Shape your learning journey:
              </p>
              <p className="text-emerald-700 text-sm mt-1">
                We help you identify areas for growth and personalize your development.
              </p>
            </div>
          </motion.div>

          {/* Floating Circle Image */}
          <motion.div
            initial={{ opacity: 0, x: 40 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.7 }}
            className="flex items-center justify-center"
          >
            <motion.div
              animate={{ y: [-12, 12, -12] }}
              transition={{ duration: 6, repeat: Infinity, ease: 'easeInOut' }}
              className="relative"
            >
              <div className="w-72 h-72 md:w-80 md:h-80 rounded-full overflow-hidden border-8 border-white shadow-2xl ring-4 ring-amber-200 ring-offset-4">
                <img
                  src="https://images.unsplash.com/photo-1509062522246-3755977927d7?q=80&w=2000&auto=format&fit=crop"
                  alt="Skill Development"
                  className="w-full h-full object-cover"
                  referrerPolicy="no-referrer"
                />
              </div>
              {/* Nlite Badge */}
              <div className="absolute -bottom-4 -right-4 bg-white rounded-2xl px-5 py-3 shadow-xl border border-amber-100 text-center">
                <p className="text-amber-500 font-display font-bold text-lg leading-none">Nlite</p>
                <p className="text-slate-500 text-[9px] uppercase tracking-widest mt-0.5">Enlightens Lives</p>
              </div>
            </motion.div>
          </motion.div>
        </div>

        {/* Section 2 — Skills Grid */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-center mb-12"
        >
          <span className="text-amber-500 font-semibold tracking-widest uppercase text-sm mb-3 block">What You'll Gain</span>
          <h3 className="text-3xl font-display font-bold text-slate-900">Key Skills We Develop</h3>
        </motion.div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8 mb-20">
          {skills.map((skill, idx) => {
            const c = colorMap[skill.color];
            return (
              <motion.div
                key={skill.title}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: idx * 0.08 }}
                className="group p-8 bg-white rounded-3xl border border-slate-100 shadow-lg hover:shadow-2xl hover:-translate-y-2 transition-all duration-300 relative overflow-hidden"
              >
                <div className={`w-16 h-16 md:w-20 md:h-20 rounded-2xl flex items-center justify-center mb-6 ${c.bg} ${c.text} group-hover:scale-110 transition-transform duration-300`}>
                  <skill.icon size={36} strokeWidth={2} className="md:w-10 md:h-10 w-8 h-8" />
                </div>
                <h4 className="font-display font-bold text-slate-900 text-lg md:text-xl mb-3">{skill.title}</h4>
                <p className="text-slate-500 text-sm md:text-[15px] leading-relaxed">{skill.desc}</p>
              </motion.div>
            );
          })}
        </div>

        {/* Section 3 — Admissions CTA */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="bg-emerald-900 rounded-3xl p-10 md:p-14 text-white"
        >
          <div className="grid lg:grid-cols-2 gap-10 items-center">
            <div>
              <span className="text-amber-400 font-semibold uppercase tracking-widest text-sm mb-3 block">Join Us</span>
              <h3 className="text-3xl font-display font-bold mb-4 leading-tight">
                Nurturing Minds &<br />Building Character
              </h3>
              <p className="text-emerald-100 text-[15px] leading-relaxed mb-6">
                At Sri Ramakrishna Vidyalaya Matriculation School, we believe education goes beyond academics. We focus on fostering well-rounded individuals by providing a strong academic foundation alongside opportunities for character development and confidence building.
              </p>
              <ul className="space-y-3">
                {['Holistic curriculum from KG to upper secondary', '30+ experienced teachers', 'Open admissions year-round'].map((item) => (
                  <li key={item} className="flex items-center gap-3 text-emerald-100 text-sm">
                    <CheckCircle2 size={16} className="text-amber-400 shrink-0" />
                    {item}
                  </li>
                ))}
              </ul>
            </div>

            <div className="flex flex-col gap-4">
              <Link
                to="/admission"
                className="flex items-center justify-center gap-2 px-8 py-4 bg-amber-500 text-white rounded-xl font-bold hover:bg-amber-600 transition-all text-sm shadow-md"
              >
                <ArrowRight size={18} /> Apply for Admission
              </Link>
              <Link
                to="/contact"
                className="flex items-center justify-center gap-2 px-8 py-4 bg-white/10 text-white border border-white/30 rounded-xl font-semibold hover:bg-white/20 transition-all text-sm"
              >
                <Phone size={18} /> Contact Us
              </Link>
            </div>
          </div>
        </motion.div>

      </div>

      <StatsCtaBanner />
    </div>
  );
}
