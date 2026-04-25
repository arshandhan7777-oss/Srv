import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { ArrowRight, Building, Monitor, FlaskConical, Trophy, Video, BookOpen, Palette, Bus, MessageSquare, ChevronRight, CheckCircle2, Calendar, Award, Shield, Users } from 'lucide-react';
import { Link } from 'react-router-dom';

import heroVideo from '../assest/home/srv_revison4_60_fps.webm';
import heroImg1 from '../assest/home/home.webp';
import heroImg2 from '../assest/home/WhatsApp Image 2026-04-04 at 2.48.55 PM.webp';
import heroImg3 from '../assest/home/DSC08819.webp';
import heroImg4 from '../assest/home/DSC08691.webp';
import heroImg5 from '../assest/home/DSC08736.webp';

const mediaSequence = [
  { type: 'video', src: heroVideo },
  { type: 'image', src: heroImg1 },
  { type: 'image', src: heroImg2 },
  { type: 'image', src: heroImg3 },
  { type: 'image', src: heroImg4 },
  { type: 'image', src: heroImg5 },
];

const features = [
  {
    icon: Building,
    title: 'School Campus',
    description: '(SRV) Uppilliapuram serves the educational needs of more than 10 nearby villages of Uppilliapuram.',
    color: 'emerald'
  },
  {
    icon: Monitor,
    title: 'Computer Lab',
    description: 'These carefully created labs enable kids to see and apply the lessons they learn from books. The assistance is used to carry out the tests.',
    color: 'blue'
  },
  {
    icon: FlaskConical,
    title: 'Science Labs',
    description: 'Questions about how to erase stains, why certain chemicals have effervescence, or appear blue have all been satisfactorily addressed.',
    color: 'purple'
  },
  {
    icon: Trophy,
    title: 'Sports Activity',
    description: 'To cultivate a sound body and sound mind. Guaranteed psychological and physical well-being. Muscular strength is a particular focus.',
    color: 'amber'
  },
  {
    icon: Video,
    title: 'Audio-Visual Classroom',
    description: 'Human senses are greatly enhanced by auditory and visual stimuli. We rely on these sensory impacts to produce intellect quickly.',
    color: 'emerald'
  },
  {
    icon: BookOpen,
    title: 'Library',
    description: 'Reading is essential. Our everyday school lives attest to the continued value of books and the necessity of reading in a digital world.',
    color: 'blue'
  },
  {
    icon: Palette,
    title: 'Activity Room',
    description: 'Activity areas provide an excellent learning environment. They offer lots of room with windows that bring in natural light and fresh air.',
    color: 'purple'
  },
  {
    icon: Bus,
    title: 'Transport',
    description: 'School buses available to carry students. In addition to school tuition, students who use the bus service pay the bus fare.',
    color: 'amber'
  },
  {
    icon: MessageSquare,
    title: 'SMS Alert',
    description: 'Parents precisely receive updates on homework, attendance, exam results, and other pertinent student information via our school app.',
    color: 'emerald'
  }
];

function AnimatedCounter({ value }) {
  const [count, setCount] = useState(0);
  const ref = useRef(null);

  const numberMatch = value.match(/[\d,.]+/);
  if (!numberMatch) return <span ref={ref}>{value}</span>;

  const numStrRaw = numberMatch[0];
  const numClean = numStrRaw.replace(/,/g, '');
  const target = parseFloat(numClean);
  const suffix = value.substring(numberMatch.index + numStrRaw.length);
  const prefix = value.substring(0, numberMatch.index);

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting) {
          let startTime;
          const duration = 2000;
          const animate = (timestamp) => {
            if (!startTime) startTime = timestamp;
            const progress = Math.min((timestamp - startTime) / duration, 1);
            const easeOutQuart = 1 - Math.pow(1 - progress, 4);
            setCount(easeOutQuart * target);
            if (progress < 1) {
              requestAnimationFrame(animate);
            } else {
              setCount(target);
            }
          };
          requestAnimationFrame(animate);
          observer.disconnect();
        }
      },
      { threshold: 0.1 }
    );
    if (ref.current) observer.observe(ref.current);
    return () => observer.disconnect();
  }, [target]);

  const displayCount = target % 1 === 0 ? Math.floor(count) : Number(count.toFixed(1));
  const hasComma = value.includes(',');
  const formattedCount = hasComma ? displayCount.toLocaleString('en-US') : displayCount.toString();

  return <span ref={ref} className="inline-block">{prefix}{formattedCount}{suffix}</span>;
}

export function Home() {
  const [currentMediaIndex, setCurrentMediaIndex] = useState(0);

  useEffect(() => {
    let timeout;
    const scheduleNext = () => {
      timeout = setTimeout(() => {
        // Prevent framer-motion from getting stuck by not transitioning if tab is in the background
        if (document.hidden) {
          scheduleNext();
        } else {
          setCurrentMediaIndex((prevIndex) => {
            return prevIndex >= mediaSequence.length - 1 ? 1 : prevIndex + 1;
          });
        }
      }, document.hidden ? 1000 : 5000);
    };

    if (mediaSequence[currentMediaIndex].type === 'image') {
      scheduleNext();
    }

    return () => clearTimeout(timeout);
  }, [currentMediaIndex]);

  return (
    <div className="flex flex-col bg-slate-50 relative">

      {/* Premium Minimal Hero Section */}
      <section className="relative min-h-screen flex items-center justify-center overflow-hidden">
        <div className="absolute inset-0 z-0 bg-black">
          <AnimatePresence initial={false}>
            {currentMediaIndex === 0 ? (
              <motion.video
                key="hero-video"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 1.5, ease: "easeInOut" }}
                autoPlay
                muted
                playsInline
                onEnded={() => setCurrentMediaIndex(1)}
                className="absolute inset-0 w-full h-full object-cover opacity-80"
              >
                <source src={mediaSequence[0].src} type="video/webm" />
              </motion.video>
            ) : (
              <motion.img
                key={`hero-img-${currentMediaIndex}`}
                src={mediaSequence[currentMediaIndex].src}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 1.5, ease: "easeInOut" }}
                className="absolute inset-0 w-full h-full object-cover opacity-80"
                alt="School Hero"
              />
            )}
          </AnimatePresence>
          {/* Clean, single uniform overlay to let the video shine */}
          <div className="absolute inset-0 bg-black/30" />
        </div>

        <div className="relative z-10 w-full max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 text-center pt-10">
          <AnimatePresence>
            {currentMediaIndex > 0 && (
              <motion.div
                initial={{ opacity: 0, y: 30 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 1, ease: [0.22, 1, 0.36, 1] }}
                className="flex flex-col items-center"
              >
                <motion.h1
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.8, delay: 0.2 }}
                  className="text-4xl sm:text-5xl md:text-6xl lg:text-[68px] font-display font-semibold text-white leading-tight mb-6 drop-shadow-lg tracking-wide luxurious-roman-regular"
                >
                  SRV Matriculation School
                </motion.h1>

                <motion.p
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.8, delay: 0.4 }}
                  className="text-lg md:text-2xl text-white/90 mb-12 max-w-3xl leading-relaxed drop-shadow-md font-light"
                >
                  Empowering minds, shaping the future, and achieving excellence.
                </motion.p>

                <motion.div
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ duration: 0.8, delay: 0.5 }}
                  className="flex justify-center flex-col sm:flex-row items-center gap-6"
                >
                  <Link
                    to="/about"
                    className="px-8 py-3.5 bg-white/10 backdrop-blur-md border border-white/40 text-white rounded-full font-medium hover:bg-white/20 transition-all duration-300 min-w-[180px]"
                  >
                    Know More
                  </Link>
                  <Link
                    to="/contact"
                    className="px-8 py-3.5 bg-white text-slate-900 rounded-full font-medium hover:bg-green-100 transition-all duration-300 min-w-[180px] hover:border-2 hover:border-green-300"
                  >
                    Contact Us
                  </Link>
                </motion.div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </section>

      {/* Stats Bar */}
      <section className="relative z-20 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto w-full py-16">
        <div className="bg-white shadow-xl shadow-green-50 rounded-2xl p-8 md:p-12 border border-green-300">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8 md:gap-12 divide-x-0 md:divide-x divide-slate-200/60">
            {[
              { label: 'Enrolled Students', value: '1,200+' },
              { label: 'Expert Faculty', value: '150+' },
              { label: 'Years of Legacy', value: '36+' },
              { label: 'Alumni Worldwide', value: '10k+' },
            ].map((stat, index) => (
              <motion.div
                key={stat.label}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: "-100px" }}
                transition={{ delay: index * 0.1 }}
                className="text-center md:px-4 luxurious-roman-regular"
              >
                <div className="text-4xl md:text-5xl font-display font-bold text-slate-900 mb-2">
                  <AnimatedCounter value={stat.value} />
                </div>
                <div className="text-emerald-600 text-sm md:text-base font-semibold tracking-wide uppercase">{stat.label}</div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Welcome Section */}
      <section className="py-24 bg-white relative overflow-hidden">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid lg:grid-cols-2 gap-16 items-center">

            {/* Image Composition (Diamond Layout) */}
            <motion.div
              initial={{ opacity: 0, x: -40 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              className="relative h-[600px] hidden md:block"
            >
              <motion.div
                animate={{ y: [-15, 15, -15] }}
                transition={{ duration: 6, repeat: Infinity, ease: 'easeInOut' }}
                className="absolute inset-0"
                style={{ willChange: 'transform' }}
              >
                {/* Center Diamond */}
                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-80 h-80 rotate-45 rounded-[2.5rem] overflow-hidden border-8 border-white shadow-2xl z-20">
                  <img src="https://images.unsplash.com/photo-1546410531-bb4caa6b424d?q=80&w=2942&auto=format&fit=crop" className="-rotate-45 scale-[1.35] object-cover w-full h-full" alt="Students" referrerPolicy="no-referrer" />
                </div>
                {/* Top Right Diamond */}
                <div className="absolute top-4 right-4 w-48 h-48 rotate-45 rounded-3xl overflow-hidden border-8 border-white shadow-xl z-10">
                  <img src="https://images.unsplash.com/photo-1509062522246-3755977927d7?q=80&w=2000&auto=format&fit=crop" className="-rotate-45 scale-150 object-cover w-full h-full" alt="Campus trees" referrerPolicy="no-referrer" />
                </div>
                {/* Bottom Left Diamond */}
                <div className="absolute bottom-4 left-4 w-48 h-48 rotate-45 rounded-3xl overflow-hidden border-8 border-white shadow-xl z-10">
                  <img src="https://images.unsplash.com/photo-1577896851231-70ef18881754?q=80&w=2940&auto=format&fit=crop" className="-rotate-45 scale-150 object-cover w-full h-full" alt="Activities" referrerPolicy="no-referrer" />
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
              <h2 className="text-3xl md:text-[2.5xl] lg:text-4xl font-display font-bold text-amber-500 leading-tight ">
                Welcome To Sri Ramakrishna Vidyalaya Matriculation School
              </h2>

              <div className="space-y-4 text-slate-700 leading-relaxed text-[15px]">
                <p>
                  Sri Ramakrishna Vidyalaya Matriculation School (SRV) Uppilliapuram serves the educational needs of more than 10 nearby villages of Uppilliapuram & Pachamalai hills in Tiruchirappalli district. SRV School is established in 13.07.1988 by Mr. Sivanesan. It is a co-educational school offering classes from Kindergarten to Class X. School is recognized by government of Tamilnadu.
                </p>
                <p>
                  School currently caters to the educational needs of more than 600+ students belonging to different socio-economic groups with 30+ teaching staffs & 10 Non teaching staffs. SRV is one of the renowned Matriculation schools in Uppilliapuram. School provides a truly enabling environment to contribute to the holistic development of each student.
                </p>
                <p>
                  It is a unique school with an extraordinary dedication, spanning well more than 36 years! The school has gradually developed over the years have till 10 std. We provide academic excellence to our students. This is facilitated by dedicated educators who are trained to channelize their energy and resources towards child-centered qualitative learning.
                </p>
              </div>

              <div className="space-y-5 pt-4">
                <div className="flex gap-4 items-start">
                  <CheckCircle2 className="text-amber-500 shrink-0 mt-0.5" strokeWidth={2.5} size={22} />
                  <p className="text-sm text-slate-800 font-medium leading-relaxed">This institution is managed by a very effective team of educators under the direction of an intellectual advisory group. Excellent amenities, well-spaced infrastructure, and qualified personnel.</p>
                </div>
                <div className="flex gap-4 items-start">
                  <CheckCircle2 className="text-amber-500 shrink-0 mt-0.5" strokeWidth={2.5} size={22} />
                  <p className="text-sm text-slate-800 font-medium leading-relaxed">With integrated courses, students may receive a comprehensive education through interdisciplinary learning that promotes critical thinking and practical application.</p>
                </div>
              </div>

              <div className="pt-6">
                <Link to="/about" className="inline-flex items-center justify-center px-8 py-3.5 bg-amber-500 text-white rounded-full font-bold hover:bg-amber-600 transition-all shadow-lg hover:shadow-xl hover:-translate-y-0.5 shadow-amber-500/20">
                  Learn More
                </Link>
              </div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* Why Choose Us / Features */}
      <section className="py-32 bg-slate-50 relative">
        {/* Subtle background decoration */}
        <div className="absolute top-0 right-0 w-1/3 h-1/2 bg-amber-100/40 rounded-full blur-[120px] pointer-events-none" />

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
          <div className="text-center mb-20">
            <motion.h2
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              className="text-amber-500 font-semibold uppercase tracking-widest text-sm mb-3"
            >
              Why Choose SRV
            </motion.h2>
            <motion.h3
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: 0.1 }}
              className="text-4xl md:text-5xl font-display font-bold text-slate-900 mb-6 "
            >
              Excellence in Every Step
            </motion.h3>
            <motion.p
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: 0.2 }}
              className="text-lg text-slate-600 max-w-2xl mx-auto"
            >
              We provide an enriching atmosphere that blends deep academic rigor with robust personal development.
            </motion.p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {features.map((feature, index) => (
              <motion.div
                key={feature.title}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: index * 0.1, duration: 0.6 }}
                className="group p-8 rounded-xl bg-white border border-slate-100 shadow-xl shadow-slate-200/40 hover:shadow-2xl hover:shadow-emerald-900/10 hover:-translate-y-2 transition-all duration-300 relative overflow-hidden"
              >
                {/* Decorative hover gradient */}
                <div className="absolute inset-0 bg-gradient-to-br from-emerald-50 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />

                <div className="relative z-10">
                  <div className={`w-16 h-16 md:w-20 md:h-20 rounded-md flex items-center justify-center mb-8 shadow-sm transition-transform duration-300 group-hover:scale-110 group-hover:rotate-3
                    ${feature.color === 'emerald' ? 'bg-emerald-100 text-emerald-600' :
                      feature.color === 'amber' ? 'bg-amber-100 text-amber-600' :
                        feature.color === 'blue' ? 'bg-blue-100 text-blue-600' :
                          'bg-purple-100 text-purple-600'}`}
                  >
                    <feature.icon size={36} strokeWidth={2} className="md:w-10 md:h-10 w-8 h-8" />
                  </div>
                  <h3 className="text-xl md:text-2xl font-display title-serif font-bold text-slate-900 mb-4">{feature.title}</h3>
                  <p className="text-slate-600 leading-relaxed text-[15px]">{feature.description}</p>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Skill Development Section */}
      <section className="py-24 bg-white relative overflow-hidden">
        {/* Decorative Dotted Pattern (from the image) */}
        <div className="absolute top-8 right-8 p-8 opacity-20 hidden lg:block pointer-events-none">
          <svg width="250" height="250" viewBox="0 0 200 200">
            <defs>
              <pattern id="dot-pattern" x="0" y="0" width="20" height="20" patternUnits="userSpaceOnUse">
                <circle cx="2" cy="2" r="2" fill="#10b981" />
              </pattern>
            </defs>
            <rect width="200" height="200" fill="url(#dot-pattern)" />
          </svg>
        </div>

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
          <div className="grid lg:grid-cols-2 gap-16 items-center flex-col-reverse lg:flex-row">

            {/* Text Content */}
            <motion.div
              initial={{ opacity: 0, x: -40 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              className="space-y-6 lg:order-1 order-2"
            >
              <h2 className="text-3xl md:text-[2.5xl] lg:text-4xl font-display font-medium text-amber-500 leading-tight">
                Skill development
              </h2>

              <div className="text-slate-700 leading-relaxed text-[15px] space-y-4">
                <p>
                  <strong className="text-slate-900 font-semibold">Go beyond academics</strong> and develop the essential skills needed for success in the 21st century. Our comprehensive Skill Development Program, partnered with Nlite Academy, equips you with not only core subject expertise but also the <strong className="text-slate-900 font-semibold">highly sought-after employability skills</strong> employers crave:
                </p>

                <ul className="space-y-4 pt-4">
                  <li className="flex gap-3 items-start">
                    <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 mt-2 shrink-0"></div>
                    <p><strong className="text-slate-900 font-semibold">Communication Mastery:</strong> Sharpen your <strong className="text-slate-900 font-semibold">verbal and written communication</strong> skills in <strong className="text-slate-900 font-semibold">Hindi, English, Tamil, and Arabic</strong> to excel in any situation. (<strong className="text-amber-500 font-semibold">New!</strong> Develop commercial awareness through real-world scenarios.)</p>
                  </li>
                  <li className="flex gap-3 items-start">
                    <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 mt-2 shrink-0"></div>
                    <p><strong className="text-slate-900 font-semibold">Effective Teamwork & Problem Solving:</strong> Collaborate seamlessly, tackle challenges with innovative solutions, and demonstrate <strong className="text-slate-900 font-semibold">initiative</strong>.</p>
                  </li>
                  <li className="flex gap-3 items-start">
                    <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 mt-2 shrink-0"></div>
                    <p><strong className="text-slate-900 font-semibold">Lifelong Learner:</strong> Cultivate a growth mindset and a commitment to <strong className="text-slate-900 font-semibold">lifelong learning</strong>.</p>
                  </li>
                  <li className="flex gap-3 items-start">
                    <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 mt-2 shrink-0"></div>
                    <p><strong className="text-slate-900 font-semibold">Positive Work Attitude:</strong> Develop a strong work ethic, self-management skills, and a <strong className="text-slate-900 font-semibold">positive attitude towards work</strong>.</p>
                  </li>
                  <li className="flex gap-3 items-start">
                    <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 mt-2 shrink-0"></div>
                    <p><strong className="text-slate-900 font-semibold">Holistic Wellbeing:</strong> Prioritize your physical and mental health.</p>
                  </li>
                </ul>
              </div>

              <div className="pt-6">
                <Link to="/skills" className="inline-flex items-center justify-center px-8 py-3.5 bg-amber-500 text-white rounded-md font-bold hover:bg-amber-600 transition-all shadow-md hover:shadow-lg hover:-translate-y-0.5">
                  Learn More
                </Link>
              </div>
            </motion.div>

            {/* Circular Image Layout */}
            <motion.div
              initial={{ opacity: 0, x: 40 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              className="relative lg:h-[600px] flex items-center justify-center lg:justify-end lg:order-2 order-1"
            >
              <motion.div
                animate={{ y: [-15, 15, -15] }}
                transition={{ duration: 7, repeat: Infinity, ease: 'easeInOut' }}
                className="relative w-full max-w-lg aspect-square rounded-[100px] sm:rounded-[200px] shadow-xl overflow-hidden z-20 border-8 border-white/50"
                style={{ willChange: 'transform' }}
              >
                <img src="https://images.unsplash.com/photo-1577896851231-70ef18881754?q=80&w=2940&auto=format&fit=crop" className="object-cover w-full h-full scale-105" alt="Students" referrerPolicy="no-referrer" />
              </motion.div>
            </motion.div>

          </div>
        </div>
      </section>

      {/* Co-Curricular Activities Section */}
      <section className="py-24 bg-slate-50 relative overflow-hidden">
        {/* Decorative Dotted Pattern */}
        <div className="absolute top-8 left-8 p-8 opacity-20 hidden lg:block pointer-events-none">
          <svg width="250" height="250" viewBox="0 0 200 200">
            <defs>
              <pattern id="dot-pattern-2" x="0" y="0" width="20" height="20" patternUnits="userSpaceOnUse">
                <circle cx="2" cy="2" r="2" fill="#f59e0b" />
              </pattern>
            </defs>
            <rect width="200" height="200" fill="url(#dot-pattern-2)" />
          </svg>
        </div>

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
          <div className="grid lg:grid-cols-2 gap-16 items-center">

            {/* Blob Image Layout */}
            <motion.div
              initial={{ opacity: 0, x: -40 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              className="relative lg:h-[600px] flex items-center justify-center lg:justify-start"
            >
              {/* Organic blob shape using border-radius */}
              <motion.div
                animate={{ y: [-15, 15, -15] }}
                transition={{ duration: 5, repeat: Infinity, ease: 'easeInOut' }}
                className="relative w-full max-w-lg aspect-square shadow-xl overflow-hidden z-20 border-8 border-white/50"
                style={{ borderRadius: '60% 40% 30% 70% / 60% 30% 70% 40%', willChange: 'transform' }}
              >
                <img src="https://images.unsplash.com/photo-1546410531-bb4caa6b424d?q=80&w=2942&auto=format&fit=crop" className="object-cover w-full h-full scale-105" alt="Kids playing outside" referrerPolicy="no-referrer" />
              </motion.div>
            </motion.div>

            {/* Text Content */}
            <motion.div
              initial={{ opacity: 0, x: 40 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              className="space-y-6"
            >
              <h2 className="text-3xl md:text-[2.5xl] lg:text-4xl font-display font-medium text-amber-500 leading-tight">
                Co-Curricular Activities
              </h2>

              <div className="text-slate-700 leading-relaxed text-[15px] space-y-4">
                <p>
                  Our school offers a variety of co-curricular activities to complement academic learning and foster personal growth.
                </p>

                <ul className="space-y-4 pt-4">
                  <li className="flex gap-3 items-start">
                    <div className="w-1.5 h-1.5 rounded-full bg-amber-500 mt-2 shrink-0"></div>
                    <p><strong className="text-slate-900 font-semibold">Sports and Physical Education:</strong> Activities include football, basketball, athletics, and yoga, promoting health, teamwork, and resilience.</p>
                  </li>
                  <li className="flex gap-3 items-start">
                    <div className="w-1.5 h-1.5 rounded-full bg-amber-500 mt-2 shrink-0"></div>
                    <p><strong className="text-slate-900 font-semibold">Arts and Crafts:</strong> Students explore their creativity through drawing, painting, and craft projects.</p>
                  </li>
                  <li className="flex gap-3 items-start">
                    <div className="w-1.5 h-1.5 rounded-full bg-amber-500 mt-2 shrink-0"></div>
                    <p><strong className="text-slate-900 font-semibold">Music and Dance:</strong> Programs include learning musical instruments, vocal techniques, and dance forms, enhancing appreciation of the performing arts.</p>
                  </li>
                  <li className="flex gap-3 items-start">
                    <div className="w-1.5 h-1.5 rounded-full bg-amber-500 mt-2 shrink-0"></div>
                    <p><strong className="text-slate-900 font-semibold">Drama and Theatre:</strong> Develops acting skills, confidence, and communication abilities through plays and performances.</p>
                  </li>
                  <li className="flex gap-3 items-start">
                    <div className="w-1.5 h-1.5 rounded-full bg-amber-500 mt-2 shrink-0"></div>
                    <p><strong className="text-slate-900 font-semibold">Clubs and Societies:</strong> Includes Science Club, Literary Club, Math Club, and Eco Club for in-depth exploration of interests.</p>
                  </li>
                  <li className="flex gap-3 items-start">
                    <div className="w-1.5 h-1.5 rounded-full bg-amber-500 mt-2 shrink-0"></div>
                    <p><strong className="text-slate-900 font-semibold">Community Service:</strong> Encourages responsibility and compassion through societal contributions.</p>
                  </li>
                </ul>
              </div>

              <div className="pt-6">
                <Link to="/co-curricular" className="inline-flex items-center justify-center px-8 py-3.5 bg-amber-500 text-white rounded-md font-bold hover:bg-amber-600 transition-all shadow-md hover:shadow-lg hover:-translate-y-0.5">
                  Learn More
                </Link>
              </div>
            </motion.div>

          </div>
        </div>
      </section>

      {/* Footer CTA & Stats Banner */}
      <section className="py-24 relative overflow-hidden bg-slate-900">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10 luxurious-roman-regular">

          {/* Stats Grid */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-12 mb-20 border-b border-white/10 pb-20 mt-8">
            {/* Stat 1 */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              className="flex flex-col items-center text-center"
            >
              <Calendar className="text-amber-500 mb-5 w-12 h-12 md:w-14 md:h-14" strokeWidth={2} />
              <h3 className="text-4xl md:text-5xl font-display font-bold text-white mb-3"><AnimatedCounter value="1988" /></h3>
              <p className="text-slate-300 font-medium tracking-wide">Established</p>
            </motion.div>

            {/* Stat 2 */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: 0.1 }}
              className="flex flex-col items-center text-center"
            >
              <Award className="text-amber-500 mb-5 w-12 h-12 md:w-14 md:h-14" strokeWidth={2} />
              <h3 className="text-4xl md:text-5xl font-display font-bold text-white mb-3"><AnimatedCounter value="36+" /></h3>
              <p className="text-slate-300 font-medium tracking-wide">Year Of Experience</p>
            </motion.div>

            {/* Stat 3 */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: 0.2 }}
              className="flex flex-col items-center text-center"
            >
              <Shield className="text-amber-500 mb-5 w-12 h-12 md:w-14 md:h-14" strokeWidth={2} />
              <h3 className="text-4xl md:text-5xl font-display font-bold text-white mb-3"><AnimatedCounter value="600+" /></h3>
              <p className="text-slate-300 font-medium tracking-wide">Students</p>
            </motion.div>

            {/* Stat 4 */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: 0.3 }}
              className="flex flex-col items-center text-center"
            >
              <Users className="text-amber-500 mb-5 w-12 h-12 md:w-14 md:h-14" strokeWidth={2} />
              <h3 className="text-4xl md:text-5xl font-display font-bold text-white mb-3"><AnimatedCounter value="30+" /></h3>
              <p className="text-slate-300 font-medium tracking-wide">Well Experienced Teachers</p>
            </motion.div>
          </div>

          {/* CTA Content */}
          <div className="grid lg:grid-cols-2 gap-12 items-center mb-8">
            <motion.div
              initial={{ opacity: 0, x: -30 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
            >
              <h2 className="text-3xl md:text-4xl lg:text-5xl font-display font-semibold text-white mb-6 leading-tight">
                Educating the next generation of leaders
              </h2>
              <p className="text-slate-300 leading-relaxed text-[16px]">
                We are dedicated to providing top-notch education and fostering a learning environment where students can thrive. Our mission is to inspire, educate, and empower individuals to achieve their full potential and contribute meaningfully to society
              </p>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, x: 30 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              className="lg:text-right"
            >
              <Link to="/contact" className="inline-flex items-center justify-center px-10 py-4 bg-amber-500 text-white rounded-md font-bold hover:bg-amber-600 transition-all shadow-md hover:shadow-lg hover:-translate-y-0.5">
                Contact Us
              </Link>
            </motion.div>
          </div>

        </div>
      </section>

    </div>
  );
}
