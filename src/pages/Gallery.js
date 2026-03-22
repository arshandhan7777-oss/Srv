import { motion } from 'motion/react';
import { ZoomIn } from 'lucide-react';
import { PageHero } from '../components/PageHero';
import { StatsCtaBanner } from '../components/StatsCtaBanner';

const images = [
  { url: 'https://images.unsplash.com/photo-1523050854058-8df90110c9f1?q=80&w=2940&auto=format&fit=crop', title: 'Main Campus', span: 'col-span-1 md:col-span-2 row-span-2' },
  { url: 'https://images.unsplash.com/photo-1509062522246-3755977927d7?q=80&w=2000&auto=format&fit=crop', title: 'Smart Classrooms', span: 'col-span-1 row-span-1' },
  { url: 'https://images.unsplash.com/photo-1511629091441-ee46146481b6?q=80&w=2940&auto=format&fit=crop', title: 'Central Library', span: 'col-span-1 row-span-1' },
  { url: 'https://images.unsplash.com/photo-1577896851231-70ef18881754?q=80&w=2940&auto=format&fit=crop', title: 'Student Playground', span: 'col-span-1 row-span-1' },
  { url: 'https://images.unsplash.com/photo-1546410531-bb4caa6b424d?q=80&w=2942&auto=format&fit=crop', title: 'Language Lab', span: 'col-span-1 md:col-span-2 row-span-1' },
  { url: 'https://images.unsplash.com/photo-1513364776144-60967b0f800f?q=80&w=2942&auto=format&fit=crop', title: 'Art & Design Studio', span: 'col-span-1 row-span-1' },
  { url: 'https://images.unsplash.com/photo-1532094349884-543bc11b234d?q=80&w=2940&auto=format&fit=crop', title: 'Science Laboratory', span: 'col-span-1 row-span-2' },
  { url: 'https://images.unsplash.com/photo-1526676037777-05a232554f77?q=80&w=2940&auto=format&fit=crop', title: 'Sports Complex', span: 'col-span-1 md:col-span-2 row-span-1' },
];

export function Gallery() {
  return (
    <div className="flex flex-col bg-slate-50 min-h-screen">
      <PageHero title="Gallery" breadcrumb="Gallery" />
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-20 pb-16 w-full">
        
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center mb-16"
        >
          <span className="text-emerald-600 font-semibold tracking-widest uppercase text-sm mb-4 block">
            Our Campus Life
          </span>
          <p className="text-lg text-slate-600 max-w-2xl mx-auto leading-relaxed">
            Take a visual tour of our state-of-the-art facilities, vibrant student life, and the dynamic environment that makes our school special.
          </p>
        </motion.div>

        <div className="grid grid-cols-1 md:grid-cols-3 auto-rows-[250px] gap-6">
          {images.map((image, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, scale: 0.95 }}
              whileInView={{ opacity: 1, scale: 1 }}
              viewport={{ once: true }}
              transition={{ delay: index * 0.05 }}
              className={`group relative rounded-3xl overflow-hidden cursor-pointer shadow-sm hover:shadow-xl transition-all duration-500 ${image.span || 'col-span-1 row-span-1'}`}
            >
              <img
                src={image.url}
                alt={image.title}
                className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
                referrerPolicy="no-referrer"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-slate-900/90 via-slate-900/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
              
              <div className="absolute inset-0 p-6 flex flex-col justify-end translate-y-4 group-hover:translate-y-0 opacity-0 group-hover:opacity-100 transition-all duration-300">
                <div className="w-10 h-10 rounded-full bg-white/20 backdrop-blur-md flex items-center justify-center text-white mb-3">
                  <ZoomIn size={18} />
                </div>
                <h3 className="text-white font-display font-medium text-xl tracking-wide">{image.title}</h3>
              </div>
            </motion.div>
          ))}
        </div>
        
        {/* <div className="mt-16 text-center">
          <button className="px-8 py-4 bg-white border border-slate-200 text-slate-700 rounded-full font-semibold hover:bg-slate-50 transition-colors shadow-sm inline-flex items-center gap-2">
            Load More Images
          </button>
        </div> */}
      </div>
      <StatsCtaBanner />
    </div>
  );
}
