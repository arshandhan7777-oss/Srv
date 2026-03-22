import { motion } from 'motion/react';
import { Link } from 'react-router-dom';
import { ChevronRight } from 'lucide-react';

/**
 * Reusable video hero banner for all inner pages.
 * Props:
 *   title       - Page heading (e.g. "About Us")
 *   breadcrumb  - Label for the current page in the breadcrumb (e.g. "About")
 */
export function PageHero({ title, breadcrumb }) {
  return (
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
            alt={title}
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
          <h1 className="text-5xl md:text-6xl font-display font-bold text-white mb-4 drop-shadow-lg luxurious-roman-regular">
            {title}
          </h1>
          {/* <div className="flex items-center justify-center gap-2 text-sm font-medium">
            <Link to="/" className="text-amber-400 hover:text-amber-300 transition-colors uppercase tracking-wide">
              Home
            </Link>
            <ChevronRight size={14} className="text-white/50" />
            <span className="text-white/70 uppercase tracking-wide">{breadcrumb}</span>
          </div> */}
        </motion.div>
      </div>
    </section>
  );
}
