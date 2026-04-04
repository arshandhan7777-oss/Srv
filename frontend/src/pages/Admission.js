import { motion } from 'motion/react';
import { Link } from 'react-router-dom';
import { CheckCircle2, CalendarCheck, Phone, ArrowRight } from 'lucide-react';
import { PageHero } from '../components/PageHero';
import { StatsCtaBanner } from '../components/StatsCtaBanner';
import { admissionsImages, getPageImage } from '../config/pageImages';

const whyChoose = [
  {
    title: 'Holistic Education',
    desc: 'We offer a balanced curriculum that integrates academics with extracurricular activities, ensuring your child develops essential life skills.',
  },
  {
    title: 'Strong Foundation',
    desc: 'Our experienced faculty provides a solid academic foundation, preparing your child for future success.',
  },
  {
    title: 'Character Development',
    desc: 'We instill strong values and ethical principles in our students, shaping them into confident and responsible individuals.',
  },
];

const admissionProcess = [
  {
    title: 'Open Throughout the Year',
    desc: 'We accept applications year-round, subject to availability.',
  },
  {
    title: 'Rolling Admissions',
    desc: 'Students can join our school throughout the academic year (April to March). However, April typically sees the highest volume of applications.',
  },
  {
    title: 'Plan Ahead',
    desc: 'To avoid the rush, we recommend starting the admission process early. Our admissions team begins reviewing applications for the upcoming year in January.',
  },
  {
    title: 'Welcome All Nationalities',
    desc: 'We encourage applications from students of all backgrounds.',
  },
];

export function Admission() {
  return (
    <div className="flex flex-col bg-slate-50 min-h-screen overflow-x-hidden relative">
      <PageHero title="Admissions" breadcrumb="Admission" />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-16 sm:pt-24 pb-20 w-full overflow-hidden">

        {/* Intro */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="max-w-4xl mx-auto text-center mb-16 sm:mb-24"
        >
          <span className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-amber-100 text-amber-700 font-bold text-xs uppercase tracking-widest mb-6">
            <span className="w-2 h-2 rounded-full bg-amber-500 animate-pulse"></span>
            Join Our Family
          </span>
          <h2 className="text-4xl md:text-5xl font-display font-bold text-slate-900 mb-6">
            Nurturing Minds & Building Character
          </h2>
          <p className="text-base sm:text-lg text-slate-600 leading-relaxed max-w-2xl mx-auto">
            We believe in offering a comprehensive education to our kids. Our primary goal is to motivate them to pursue new educational opportunities. In addition to academic successes, we emphasize discipline and value-based education.
          </p>
        </motion.div>

        {/* Bento/Timeline Split Layout */}
        <div className="grid lg:grid-cols-12 gap-12 lg:gap-16 items-start mb-24">

          {/* Left Column: Why Choose Us (Grid of Cards) */}
          <div className="lg:col-span-7 space-y-6">
            <div className="mb-8">
              <h3 className="text-3xl font-display font-bold text-slate-900 mb-3">Why SRV School?</h3>
              <p className="text-slate-500">Discover the unique pillars that make our educational pathway exceptional.</p>
            </div>
            
            <div className="grid sm:grid-cols-2 gap-6">
              {whyChoose.map((item, i) => (
                <motion.div
                  key={i}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: i * 0.1 }}
                  className="bg-white rounded-3xl p-8 border border-slate-100 shadow-xl shadow-slate-200/40 hover:-translate-y-1 transition-transform duration-300"
                >
                  <div className="w-12 h-12 bg-amber-50 rounded-2xl flex items-center justify-center mb-6 border border-amber-100">
                    <CheckCircle2 className="text-amber-500" size={24} strokeWidth={2} />
                  </div>
                  <h4 className="text-xl font-bold text-slate-900 mb-3">{item.title}</h4>
                  <p className="text-slate-600 text-sm leading-relaxed">{item.desc}</p>
                </motion.div>
              ))}
            </div>
          </div>

          {/* Right Column: Interactive Vertical Timeline */}
          <div className="lg:col-span-5 relative">
            <div className="bg-emerald-900 rounded-3xl p-8 sm:p-10 shadow-2xl text-white relative isolate overflow-hidden">
              <div className="absolute top-0 right-0 w-64 h-64 bg-emerald-500/20 rounded-full blur-[60px] -z-10" />
              
              <div className="mb-10 text-center sm:text-left">
                <h3 className="text-2xl font-display font-bold text-white mb-2 flex items-center gap-3">
                  <CalendarCheck className="text-emerald-400 hidden sm:block" /> Admissions Process
                </h3>
                <p className="text-emerald-100/70 text-sm">Follow these simple steps to enroll securely.</p>
              </div>

              <div className="space-y-8 relative">
                {/* Connecting Line */}
                <div className="absolute top-2 left-[19px] bottom-6 w-0.5 bg-gradient-to-b from-emerald-500 to-transparent z-0 hidden sm:block" />
                
                {admissionProcess.map((item, i) => (
                  <motion.div 
                    key={i}
                    initial={{ opacity: 0, x: 20 }}
                    whileInView={{ opacity: 1, x: 0 }}
                    viewport={{ once: true }}
                    transition={{ delay: i * 0.15 }}
                    className="flex gap-5 items-start relative z-10"
                  >
                    <div className="hidden sm:flex shrink-0 w-10 h-10 rounded-full bg-emerald-800 border-2 border-emerald-500 items-center justify-center font-bold text-emerald-300 shadow-[0_0_15px_rgba(16,185,129,0.3)]">
                      {i + 1}
                    </div>
                    <div className="bg-white/10 backdrop-blur-md border border-white/10 rounded-2xl p-5 hover:bg-white/20 transition duration-300 w-full">
                      <p className="font-bold text-lg text-white mb-1">{item.title}</p>
                      <p className="text-emerald-100/80 text-sm leading-relaxed">{item.desc}</p>
                    </div>
                  </motion.div>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Action Packed Footer Section */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="bg-slate-900 rounded-3xl p-8 sm:p-12 lg:p-16 text-white mb-12 relative overflow-hidden isolate shadow-2xl"
        >
          <div className="absolute -top-40 -right-40 w-96 h-96 bg-emerald-600/30 blur-[80px] rounded-full -z-10 pointer-events-none" />
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            <div>
              <h3 className="text-3xl sm:text-4xl font-display font-bold mb-5 leading-tight">Ready to Begin Your Journey?</h3>
              <p className="text-slate-300 mb-8 leading-relaxed max-w-lg">
                Application forms are available for pick-up at the school office from Monday to Friday, <strong>9:30 AM to 5:00 PM</strong>. We invite you to schedule a meeting with our admissions counsellor.
              </p>
              <div className="flex flex-col sm:flex-row gap-4 w-full">
                <Link to="/contact" className="flex items-center justify-center gap-2 px-8 py-4 bg-emerald-500 text-slate-900 rounded-xl font-bold hover:bg-emerald-400 hover:scale-105 transition-all text-sm w-full sm:w-auto shadow-lg shadow-emerald-500/20">
                  <Phone size={18} /> Schedule a Visit
                </Link>
                <Link to="/about" className="flex items-center justify-center gap-2 px-8 py-4 bg-white/5 backdrop-blur text-white border border-white/20 rounded-xl font-semibold hover:bg-white/10 transition-all text-sm w-full sm:w-auto">
                  Explore Programs <ArrowRight size={18} />
                </Link>
              </div>
            </div>
            
            <div className="relative w-full h-full min-h-[250px] lg:min-h-full rounded-2xl overflow-hidden shadow-2xl hidden md:block border border-white/10">
              <img 
                src={getPageImage(admissionsImages, 0, "https://images.unsplash.com/photo-1577896851231-70ef18881754?q=80&w=2940&auto=format&fit=crop")} 
                alt="Students" 
                className="absolute inset-0 w-full h-full object-cover"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-slate-900 via-transparent to-transparent flex items-end p-8">
                 <p className="text-white font-serif italic text-lg opacity-90">"Education is the passport to the future."</p>
              </div>
            </div>
          </div>
        </motion.div>

      </div>

      <StatsCtaBanner />
    </div>
  );
}
