import { motion } from 'motion/react';
import { Link } from 'react-router-dom';
import { CheckCircle2, CalendarCheck, Phone, ArrowRight } from 'lucide-react';
import { PageHero } from '../components/PageHero';
import { StatsCtaBanner } from '../components/StatsCtaBanner';

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
    <div className="flex flex-col bg-slate-50 min-h-screen">
      <PageHero title="Admissions" breadcrumb="Admission" />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-20 pb-20 w-full">

        {/* Intro */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="max-w-4xl mx-auto text-center mb-16"
        >
          <span className="text-amber-500 font-semibold tracking-widest uppercase text-sm mb-3 block">Join Our Family</span>
          <h2 className="text-4xl md:text-5xl font-display font-bold text-slate-900 mb-6">
            Nurturing Minds & Building Character
          </h2>
          <p className="text-lg text-slate-600 leading-relaxed">
            We believe in offering a comprehensive education to our kids. Our primary goal is to motivate them to pursue new educational opportunities. In addition to academic successes, we emphasize discipline and value-based education. We allow our pupils to flourish in both academic and extracurricular activities. We admit students from kindergarten to upper secondary grades.
          </p>
        </motion.div>

        {/* Admissions at SRV */}
        <div className="grid lg:grid-cols-2 gap-16 items-start mb-20">

          {/* Why Choose Us */}
          <motion.div
            initial={{ opacity: 0, x: -30 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            className="bg-white rounded-3xl p-10 shadow-xl border border-slate-100"
          >
            <h3 className="text-2xl font-display font-bold text-slate-900 mb-2">Why Choose Us?</h3>
            <div className="w-10 h-1 bg-amber-500 rounded-full mb-8"></div>
            <ul className="space-y-6">
              {whyChoose.map((item, i) => (
                <li key={i} className="flex gap-4 items-start">
                  <div className="shrink-0 mt-1">
                    <CheckCircle2 className="text-amber-500" size={22} strokeWidth={2.5} />
                  </div>
                  <div>
                    <p className="font-semibold text-slate-900 mb-1">{item.title}:</p>
                    <p className="text-slate-600 text-sm leading-relaxed">{item.desc}</p>
                  </div>
                </li>
              ))}
            </ul>
          </motion.div>

          {/* Admissions Process */}
          <motion.div
            initial={{ opacity: 0, x: 30 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            className="bg-white rounded-3xl p-10 shadow-xl border border-slate-100"
          >
            <h3 className="text-2xl font-display font-bold text-slate-900 mb-2">Admissions Process</h3>
            <div className="w-10 h-1 bg-emerald-500 rounded-full mb-8"></div>
            <ul className="space-y-6">
              {admissionProcess.map((item, i) => (
                <li key={i} className="flex gap-4 items-start">
                  <div className="shrink-0 mt-1">
                    <CalendarCheck className="text-emerald-500" size={22} strokeWidth={2} />
                  </div>
                  <div>
                    <p className="font-semibold text-slate-900 mb-1">{item.title}:</p>
                    <p className="text-slate-600 text-sm leading-relaxed">{item.desc}</p>
                  </div>
                </li>
              ))}
            </ul>
          </motion.div>
        </div>

        {/* Ready to Learn More */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="bg-emerald-900 rounded-3xl p-10 md:p-14 text-white mb-12"
        >
          <div className="grid lg:grid-cols-2 gap-10 items-center">
            <div>
              <h3 className="text-3xl font-display font-bold mb-4">Ready to Learn More?</h3>
              <ul className="space-y-4 text-emerald-100 text-sm leading-relaxed">
                <li className="flex gap-3 items-start">
                  <ArrowRight size={16} className="text-amber-400 mt-0.5 shrink-0" />
                  <span><strong className="text-white">Schedule a Visit:</strong> We invite you to schedule a meeting with our admissions counsellor who will be happy to answer your questions and give you a tour of our campus.</span>
                </li>
                <li className="flex gap-3 items-start">
                  <ArrowRight size={16} className="text-amber-400 mt-0.5 shrink-0" />
                  <span><strong className="text-white">Explore Our Programs:</strong> Learn more about our academic and extracurricular offerings on our website.</span>
                </li>
                <li className="flex gap-3 items-start">
                  <ArrowRight size={16} className="text-amber-400 mt-0.5 shrink-0" />
                  <span><strong className="text-white">Contact Us:</strong> Feel free to contact our admissions office for further information.</span>
                </li>
              </ul>
            </div>
            <div className="space-y-4">
              <div className="bg-white/10 backdrop-blur rounded-2xl p-6 border border-white/20">
                <p className="font-semibold text-white mb-2">Application Process</p>
                <p className="text-emerald-200 text-sm leading-relaxed">
                  Application forms are available for pick-up at the school office from Monday to Friday, <strong className="text-white">9:30 AM to 5:00 PM</strong>, for a nominal fee.
                </p>
                <p className="text-emerald-200 text-sm mt-3">
                  We look forward to welcoming your child to Sri Ramakrishna Vidyalaya Matriculation School!
                </p>
              </div>
              <div className="flex flex-col sm:flex-row gap-3">
                <Link to="/contact" className="flex-1 flex items-center justify-center gap-2 px-6 py-3.5 bg-amber-500 text-white rounded-xl font-bold hover:bg-amber-600 transition-all text-sm">
                  <Phone size={16} /> Contact Admissions
                </Link>
                <Link to="/about" className="flex-1 flex items-center justify-center gap-2 px-6 py-3.5 bg-white/10 text-white border border-white/30 rounded-xl font-semibold hover:bg-white/20 transition-all text-sm">
                  Know More
                </Link>
              </div>
            </div>
          </div>
        </motion.div>

      </div>

      <StatsCtaBanner />
    </div>
  );
}
