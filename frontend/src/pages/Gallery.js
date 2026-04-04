import { motion } from 'motion/react';
import { ZoomIn } from 'lucide-react';
import { PageHero } from '../components/PageHero';
import { StatsCtaBanner } from '../components/StatsCtaBanner';
import DomeGallery from '../components/DomeGallery';
import { getGalleryImages } from '../config/galleryImages';

const images = getGalleryImages();

const domeImages = images.map(img => ({
  src: img.url,
  alt: img.title
}));

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

        {/* Dome Gallery Container */}
        <motion.div 
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 1 }}
          className="w-full h-[600px] md:h-[800px] rounded-3xl overflow-hidden relative shadow-2xl bg-black mb-16"
        >
          <DomeGallery
            images={domeImages}
            fit={0.8}
            minRadius={600}
            maxVerticalRotationDeg={0}
            segments={34}
            dragDampening={2}
            grayscale={false}
          />
        </motion.div>
        
      </div>
      <StatsCtaBanner />
    </div>
  );
}
