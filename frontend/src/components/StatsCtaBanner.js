import { useState, useEffect, useRef } from 'react';
import { motion } from 'motion/react';
import { Link } from 'react-router-dom';
import { Calendar, Award, Shield, Users } from 'lucide-react';

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

export function StatsCtaBanner() {
  return (
    <section className="py-24 relative overflow-hidden bg-slate-900">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">

        {/* Stats Grid */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-12 mb-20 border-b border-white/10 pb-20 mt-8">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="flex flex-col items-center text-center"
          >
            <Calendar className="text-amber-500 mb-5" size={40} strokeWidth={2} />
            <h3 className="text-4xl md:text-5xl font-display font-bold text-white mb-3">
              <AnimatedCounter value="1988" />
            </h3>
            <p className="text-slate-300 font-medium tracking-wide ">Established</p>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.1 }}
            className="flex flex-col items-center text-center"
          >
            <Award className="text-amber-500 mb-5" size={40} strokeWidth={2} />
            <h3 className="text-4xl md:text-5xl font-display font-bold text-white mb-3">
              <AnimatedCounter value="36+" />
            </h3>
            <p className="text-slate-300 font-medium tracking-wide">Year Of Experience</p>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.2 }}
            className="flex flex-col items-center text-center"
          >
            <Shield className="text-amber-500 mb-5" size={40} strokeWidth={2} />
            <h3 className="text-4xl md:text-5xl font-display font-bold text-white mb-3">
              <AnimatedCounter value="600+" />
            </h3>
            <p className="text-slate-300 font-medium tracking-wide">Students</p>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.3 }}
            className="flex flex-col items-center text-center"
          >
            <Users className="text-amber-500 mb-5" size={40} strokeWidth={2} />
            <h3 className="text-4xl md:text-5xl font-display font-bold text-white mb-3">
              <AnimatedCounter value="30+" />
            </h3>
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
  );
}
