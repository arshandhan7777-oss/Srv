import { motion } from 'motion/react';
import { BookOpen, Globe, Users, Lightbulb, CheckCircle2 } from 'lucide-react';
import { PageHero } from '../components/PageHero';
import { StatsCtaBanner } from '../components/StatsCtaBanner';
import { academicImages, getPageImage } from '../config/pageImages';

const coCurricularActivities = [
  'Dance', 'Drama', 'Singing', 'Debates', 'Elocution', 'Yoga',
  'Karate', 'Silambam', 'Chess', 'Roller Skating', 'Swimming',
  'Taekwondo', 'Arts', 'Dramatics', 'Music',
];

const skillItems = [
  { title: 'Communication Skills', desc: 'Verbal and written communication in Hindi, English, Tamil, and Arabic.' },
  { title: 'Commercial Awareness', desc: 'Developing real-world awareness through practical learning scenarios.' },
  { title: 'Teamwork & Problem Solving', desc: 'Collaborative thinking and innovative approaches to challenges.' },
  { title: 'Lifelong Learning', desc: 'Cultivating a growth mindset and commitment to continuous improvement.' },
  { title: 'Self-Management', desc: 'Building strong work ethic, initiative, and a positive attitude towards work.' },
];

export function Academics() {
  return (
    <div className="flex flex-col bg-slate-50 min-h-screen">
      <PageHero title="Academics" breadcrumb="Academics" />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-20 pb-20 w-full">

        {/* Section 1 - Overview + Diamond Image */}
        <div className="grid lg:grid-cols-2 gap-16 items-center mb-24">

          {/* Diamond Image Collage */}
          <motion.div
            initial={{ opacity: 0, x: -40 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            className="relative h-[480px] hidden md:block"
          >
            <motion.div
              animate={{ y: [-12, 12, -12] }}
              transition={{ duration: 6, repeat: Infinity, ease: 'easeInOut' }}
              className="absolute inset-0"
            >
              {/* Center Diamond */}
              <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-72 h-72 rotate-45 rounded-[2.5rem] overflow-hidden border-8 border-white shadow-2xl z-20">
                <img
                  src={getPageImage(academicImages, 0, "https://images.unsplash.com/photo-1546410531-bb4caa6b424d?q=80&w=2942&auto=format&fit=crop")}
                  className="-rotate-45 scale-[1.35] object-cover w-full h-full"
                  alt="Student"
                  referrerPolicy="no-referrer"
                />
              </div>
              {/* Top Right */}
              <div className="absolute top-4 right-4 w-44 h-44 rotate-45 rounded-3xl overflow-hidden border-8 border-white shadow-xl z-10">
                <img
                  src={getPageImage(academicImages, 1, "https://images.unsplash.com/photo-1509062522246-3755977927d7?q=80&w=2000&auto=format&fit=crop")}
                  className="-rotate-45 scale-150 object-cover w-full h-full"
                  alt="Classroom"
                  referrerPolicy="no-referrer"
                />
              </div>
              {/* Bottom Left */}
              <div className="absolute bottom-4 left-4 w-44 h-44 rotate-45 rounded-3xl overflow-hidden border-8 border-white shadow-xl z-10">
                <img
                  src={getPageImage(academicImages, 2, "https://images.unsplash.com/photo-1532094349884-543bc11b234d?q=80&w=2940&auto=format&fit=crop")}
                  className="-rotate-45 scale-150 object-cover w-full h-full"
                  alt="Science"
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
              <span className="text-amber-500 font-semibold tracking-widest uppercase text-sm mb-3 block">Our School</span>
              <h2 className="text-3xl lg:text-4xl font-display font-bold text-slate-900 leading-tight mb-5">
                Sri Ramakrishna Vidyalaya<br />Matriculation School
              </h2>
            </div>

            <div className="space-y-4 text-slate-600 text-[15px] leading-relaxed">
              <p>
                We believe in offering a comprehensive education to our kids. Our primary goal is to motivate them to pursue new educational opportunities. In addition to academic successes, we place emphasis on discipline and value-based education. We give our pupils the opportunity to flourish in both scholastic and extracurricular activities. We admit students from kindergarten to upper secondary grades.
              </p>
              <div className="bg-amber-50 border-l-4 border-amber-500 p-5 rounded-r-xl">
                <p className="font-semibold text-slate-900 mb-1 flex items-center gap-2">
                  <BookOpen size={18} className="text-amber-500" /> Curriculum
                </p>
                <p className="text-sm">
                  Our school is recognized by the Tamil Nadu government and follows a curriculum that meets the Directorate of School Education's criteria. To improve linguistic skills, we have made three languages obligatory in grades I-V. Apart from academics, we encourage our students to participate in extracurricular activities.
                </p>
              </div>
            </div>
          </motion.div>
        </div>

        {/* Section 2 - Co-Curricular Activities */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="mb-20"
        >
          <div className="bg-white rounded-3xl p-10 md:p-14 shadow-xl border border-slate-100">
            <div className="flex items-center gap-3 mb-2">
              <div className="w-10 h-10 bg-emerald-100 rounded-xl flex items-center justify-center text-emerald-600 shrink-0">
                <Users size={22} />
              </div>
              <h3 className="text-2xl md:text-3xl font-display font-bold text-slate-900">Co-Curricular Activities</h3>
            </div>
            <div className="w-10 h-1 bg-emerald-500 rounded-full mb-6 ml-[52px]"></div>

            <p className="text-slate-600 text-[15px] leading-relaxed mb-6">
              The school also encourages co-curricular activities such as dance, drama, singing, debates, elocution, yoga, Karate, Silambam, Chess etc. through Inter House Competitions.
            </p>
            <p className="text-slate-600 text-[15px] leading-relaxed mb-8">
              SRV has always sought to achieve total development of each pupil, with emphasis on learning and co-curricular activities. The school endeavors to ensure that each child receives their fair share of individual attention. The school organizes various club activities and field trips for the students to explore and expand the classroom knowledge. The school's calendar is filled with various co-curricular activities.
            </p>

            <div className="flex flex-wrap gap-2.5">
              {coCurricularActivities.map((activity) => (
                <span
                  key={activity}
                  className="px-4 py-2 bg-emerald-50 text-emerald-700 text-sm font-semibold rounded-full border border-emerald-200"
                >
                  {activity}
                </span>
              ))}
            </div>
          </div>
        </motion.div>

        {/* Section 3 - Skill Development */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="grid lg:grid-cols-2 gap-12 items-start"
        >
          <div className="bg-emerald-900 rounded-3xl p-10 md:p-12 text-white h-full">
            <div className="flex items-center gap-3 mb-6">
              <div className="w-10 h-10 bg-amber-500 rounded-xl flex items-center justify-center shrink-0">
                <Lightbulb size={20} className="text-white" />
              </div>
              <h3 className="text-2xl md:text-3xl font-display font-bold">Skill Development</h3>
            </div>
            <p className="text-emerald-100 text-[15px] leading-relaxed mb-4">
              In general, apart from the core subject expertise, some of the prominent employable skills that employers seek are: communication skills (verbal and written), commercial awareness, attitude towards work, lifelong learning, self-management, teamwork, problem solving, and initiative.
            </p>
            <p className="text-emerald-100 text-[15px] leading-relaxed">
              The school focuses specially on developing and enhancing required language skills in languages like <strong className="text-white">Hindi, English, Tamil and Arabic.</strong>
            </p>
          </div>

          <div className="space-y-4">
            {skillItems.map((item, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, x: 20 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.1 }}
                className="flex gap-4 bg-white p-5 rounded-2xl shadow-sm border border-slate-100 hover:shadow-md transition-shadow"
              >
                <CheckCircle2 className="text-amber-500 shrink-0 mt-0.5" size={20} strokeWidth={2.5} />
                <div>
                  <p className="font-semibold text-slate-900 text-sm mb-1">{item.title}</p>
                  <p className="text-slate-500 text-sm leading-relaxed">{item.desc}</p>
                </div>
              </motion.div>
            ))}
          </div>
        </motion.div>

      </div>

      <StatsCtaBanner />
    </div>
  );
}
