import { motion } from 'motion/react';
import { Calendar, ArrowRight, User } from 'lucide-react';
import { PageHero } from '../components/PageHero';
import { StatsCtaBanner } from '../components/StatsCtaBanner';

const newsItems = [
  {
    title: 'Annual Science Fair 2026 Winners Announced',
    date: 'March 15, 2026',
    author: 'Admin',
    category: 'Academics',
    color: 'amber',
    image: 'https://images.unsplash.com/photo-1532094349884-543bc11b234d?q=80&w=2940&auto=format&fit=crop',
    excerpt: 'Congratulations to our brilliant students who showcased highly innovative projects and groundbreaking research at this year\'s regional science fair.',
  },
  {
    title: 'New Robotics Lab Inauguration',
    date: 'March 10, 2026',
    author: 'Principal Desk',
    category: 'Campus News',
    color: 'emerald',
    image: 'https://images.unsplash.com/photo-1485827404703-89b55fcc595e?q=80&w=2940&auto=format&fit=crop',
    excerpt: 'State-of-the-art robotics facility officially opens its doors today, providing students with unparalleled hands-on experience in AI and automation.',
  },
  {
    title: 'Elysium Choir Wins National Championship',
    date: 'March 5, 2026',
    author: 'Arts Dept',
    category: 'Arts & Culture',
    color: 'blue',
    image: 'https://images.unsplash.com/photo-1514525253161-7a46d19cd819?q=80&w=2874&auto=format&fit=crop',
    excerpt: 'Our extraordinary senior choir brought home the gold medal from the highly competitive National High School Choral Competition in New Delhi.',
  }
];

export function News() {
  return (
    <div className="flex flex-col bg-slate-50 min-h-screen">
      <PageHero title="News & Media" breadcrumb="News" />
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-20 pb-16 w-full">
        
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center mb-16"
        >
          <span className="text-emerald-600 font-semibold tracking-widest uppercase text-sm mb-4 block">
            Stay Updated
          </span>
          <h1 className="text-5xl md:text-6xl font-display font-bold text-slate-900 mb-6">News & Media</h1>
          <p className="text-lg text-slate-600 max-w-2xl mx-auto leading-relaxed">
            Read about the latest academic achievements, cultural events, and extraordinary happenings across our vibrant campus.
          </p>
        </motion.div>

        {/* Featured News (First item emphasized) */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {newsItems.map((item, index) => (
            <motion.div
              key={item.title}
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: index * 0.1 }}
              className={`group bg-white rounded-3xl border border-slate-100 overflow-hidden hover:shadow-2xl transition-all duration-300 flex flex-col h-full ${index === 0 ? 'lg:col-span-3 lg:flex-row' : 'lg:col-span-1'}`}
            >
              <div className={`relative overflow-hidden shrink-0 ${index === 0 ? 'lg:w-3/5 lg:h-[450px]' : 'h-64'}`}>
                <img
                  src={item.image}
                  alt={item.title}
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700"
                  referrerPolicy="no-referrer"
                />
                <div className={`absolute top-6 left-6 backdrop-blur-md px-4 py-1.5 rounded-full text-xs font-bold uppercase tracking-wider
                  ${item.color === 'amber' ? 'bg-amber-100/90 text-amber-700' : 
                    item.color === 'emerald' ? 'bg-emerald-100/90 text-emerald-700' : 
                    'bg-blue-100/90 text-blue-700'}`}>
                  {item.category}
                </div>
              </div>
              
              <div className={`p-8 md:p-10 flex flex-col flex-grow ${index === 0 ? 'lg:w-2/5 lg:justify-center' : ''}`}>
                <div className="flex items-center gap-4 text-slate-500 text-sm mb-5 font-medium">
                  <div className="flex items-center gap-1.5">
                    <Calendar size={16} className="text-amber-500" />
                    <span>{item.date}</span>
                  </div>
                  <div className="w-1 h-1 rounded-full bg-slate-300" />
                  <div className="flex items-center gap-1.5">
                    <User size={16} className="text-amber-500" />
                    <span>{item.author}</span>
                  </div>
                </div>
                
                <h3 className={`font-display font-bold text-slate-900 mb-4 leading-tight group-hover:text-emerald-700 transition-colors ${index === 0 ? 'text-3xl md:text-4xl' : 'text-2xl'}`}>
                  {item.title}
                </h3>
                
                <p className="text-slate-600 leading-relaxed mb-8 flex-grow">
                  {item.excerpt}
                </p>
                
                <button className="inline-flex items-center gap-2 text-slate-900 font-bold hover:text-emerald-600 transition-colors mt-auto group/btn">
                  Read Full Story <ArrowRight size={18} className="group-hover/btn:translate-x-1 transition-transform" />
                </button>
              </div>
            </motion.div>
          ))}
        </div>

      </div>
      <StatsCtaBanner />
    </div>
  );
}
