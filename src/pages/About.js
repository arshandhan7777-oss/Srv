import { motion } from 'motion/react';
import { Target, Compass, Award, Heart, Users, ChevronRight } from 'lucide-react';
import { Link } from 'react-router-dom';
import { StatsCtaBanner } from '../components/StatsCtaBanner';

export function About() {
  return (
    <div className="flex flex-col bg-slate-50 min-h-screen">

      {/* Video Hero Banner */}
      <section className="relative h-[55vh] min-h-[380px] flex items-center justify-center overflow-hidden">
        <div className="absolute inset-0 z-0 bg-black">
          <video
            autoPlay
            loop
            muted
            playsInline
            className="w-full h-full object-cover opacity-60"
          >
            <source src="https://videos.pexels.com/video-files/4146051/4146051-uhd_2560_1440_30fps.mp4" type="video/mp4" />
            <img
              src="https://images.unsplash.com/photo-1592289143977-ed052f58a230?q=80&w=2940&auto=format&fit=crop"
              alt="School"
              className="w-full h-full object-cover"
            />
          </video>
          <div className="absolute inset-0 bg-gradient-to-b from-black/50 via-black/30 to-black/60" />
        </div>

        <div className="relative z-10 text-center px-4">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, ease: [0.22, 1, 0.36, 1] }}
          >
            <h1 className="text-5xl md:text-6xl font-display font-bold text-white mb-4 drop-shadow-lg">
              About Us
            </h1>
            {/* Breadcrumb */}
            <div className="flex items-center justify-center gap-2 text-sm font-medium">
              <Link to="/" className="text-amber-400 hover:text-amber-300 transition-colors uppercase tracking-wide">Home</Link>
              <ChevronRight size={14} className="text-white/50" />
              <span className="text-white/70 uppercase tracking-wide">About</span>
            </div>
          </motion.div>
        </div>
      </section>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-20 pb-16 w-full">

        {/* Feature Split Section */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center mb-32">
          {/* Enhanced Masonry Image Grid */}
          <motion.div
            initial={{ opacity: 0, x: -30 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            className="grid grid-cols-2 gap-4 h-[600px]"
          >
            <div className="space-y-4 h-full">
              <img
                src="https://images.unsplash.com/photo-1546410531-bb4caa6b424d?q=80&w=2942&auto=format&fit=crop"
                alt="Students studying"
                className="w-full h-[55%] object-cover rounded-3xl shadow-lg border border-slate-100"
                referrerPolicy="no-referrer"
              />
              <img
                src="https://images.unsplash.com/photo-1509062522246-3755977927d7?q=80&w=2000&auto=format&fit=crop"
                alt="Classroom"
                className="w-full h-[40%] object-cover rounded-3xl shadow-lg border border-slate-100"
                referrerPolicy="no-referrer"
              />
            </div>
            <div className="space-y-4 h-full pt-12">
              <img
                src="https://images.unsplash.com/photo-1577896851231-70ef18881754?q=80&w=2940&auto=format&fit=crop"
                alt="Group activity"
                className="w-full h-[60%] object-cover rounded-3xl shadow-lg border border-slate-100"
                referrerPolicy="no-referrer"
              />
              <div className="w-full h-[35%] rounded-3xl bg-emerald-900 shadow-lg border border-emerald-800 p-6 flex flex-col justify-end">
                <span className="text-4xl font-display font-bold text-amber-500 mb-1">25+</span>
                <span className="text-emerald-100 font-medium">Years of Excellence</span>
              </div>
            </div>
          </motion.div>
          
          <motion.div
            initial={{ opacity: 0, x: 30 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            className="space-y-10"
          >
            <div className="bg-white p-8 rounded-3xl shadow-xl shadow-slate-200/40 border border-slate-100 relative overflow-hidden group">
              <div className="absolute top-0 right-0 w-32 h-32 bg-amber-50 rounded-bl-[100px] -z-0 transition-transform duration-500 group-hover:scale-110" />
              <div className="relative z-10">
                <div className="w-12 h-12 bg-amber-100 rounded-xl flex items-center justify-center mb-6 text-amber-600">
                  <Compass size={24} />
                </div>
                <h2 className="text-2xl font-display font-bold text-slate-900 mb-3">Our Vision</h2>
                <p className="text-slate-600 leading-relaxed">
                  To be a global center of excellence in education, where every student is empowered to discover their passion, realize their potential, and make a positive impact on the world.
                </p>
              </div>
            </div>
            
            <div className="bg-white p-8 rounded-3xl shadow-xl shadow-slate-200/40 border border-slate-100 relative overflow-hidden group">
              <div className="absolute top-0 right-0 w-32 h-32 bg-emerald-50 rounded-bl-[100px] -z-0 transition-transform duration-500 group-hover:scale-110" />
              <div className="relative z-10">
                <div className="w-12 h-12 bg-emerald-100 rounded-xl flex items-center justify-center mb-6 text-emerald-600">
                  <Target size={24} />
                </div>
                <h2 className="text-2xl font-display font-bold text-slate-900 mb-3">Our Mission</h2>
                <p className="text-slate-600 leading-relaxed">
                  We are deeply committed to providing a holistic, inclusive, and highly innovative learning environment that fosters critical thinking, creativity, and outstanding character development.
                </p>
              </div>
            </div>
          </motion.div>
        </div>

        {/* Core Values */}
        <div className="text-center mb-16">
          <h2 className="text-3xl md:text-4xl font-display font-bold text-slate-900 mb-4">Our Core Values</h2>
          <p className="text-slate-600 max-w-2xl mx-auto">The foundational principles that guide everything we do.</p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
          {[
            { icon: Award, title: "Excellence", desc: "Striving for continuous improvement." },
            { icon: Heart, title: "Integrity", desc: "Upholding the highest ethical standards." },
            { icon: Users, title: "Inclusivity", desc: "Embracing diversity and community." },
            { icon: Compass, title: "Innovation", desc: "Fostering creative problem solving." }
          ].map((val, idx) => (
            <motion.div 
              key={idx}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: idx * 0.1 }}
              className="bg-white p-8 rounded-3xl border border-slate-100 shadow-sm hover:shadow-xl hover:-translate-y-1 transition-all duration-300 text-center"
            >
              <div className="w-14 h-14 mx-auto bg-slate-50 border border-slate-100 rounded-2xl flex items-center justify-center mb-6 text-emerald-600 shadow-sm">
                <val.icon size={26} />
              </div>
              <h3 className="font-display font-bold text-xl text-slate-900 mb-2">{val.title}</h3>
              <p className="text-sm text-slate-500 leading-relaxed">{val.desc}</p>
            </motion.div>
          ))}
        </div>
      </div>
      <StatsCtaBanner />
    </div>
  );
}
