import { motion } from 'motion/react';
import { useEffect, useMemo, useState } from 'react';
import axios from 'axios';
import { PageHero } from '../components/PageHero';
import { StatsCtaBanner } from '../components/StatsCtaBanner';
import DomeGallery from '../components/DomeGallery';
import { cloudinaryGalleryFolder, galleryFolderPath, getGalleryImages } from '../config/galleryImages';
import API_URL from '../config/api.js';

const fallbackImages = getGalleryImages();

const fallbackDomeImages = fallbackImages.map(img => ({
  src: img.url,
  alt: img.title
}));

const optimizeCloudinaryUrl = (url) => {
  const normalizedUrl = String(url || '').trim();
  if (!normalizedUrl.includes('/upload/')) {
    return normalizedUrl;
  }

  return normalizedUrl.replace('/upload/', '/upload/f_auto,q_auto,c_limit,w_1600/');
};

export function Gallery() {
  const [cloudImages, setCloudImages] = useState([]);
  const [galleryFolder, setGalleryFolder] = useState(cloudinaryGalleryFolder);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let isMounted = true;

    axios.get(`${API_URL}/api/public/gallery`)
      .then((response) => {
        if (!isMounted) return;
        const nextImages = Array.isArray(response.data?.images) ? response.data.images : [];
        setCloudImages(nextImages);
        setGalleryFolder(response.data?.folder || cloudinaryGalleryFolder);
      })
      .catch((error) => {
        if (!isMounted) return;
        console.error('Error loading public gallery:', error);
      })
      .finally(() => {
        if (isMounted) {
          setLoading(false);
        }
      });

    return () => {
      isMounted = false;
    };
  }, []);

  const domeImages = useMemo(() => {
    if (cloudImages.length > 0) {
      return cloudImages.map((img) => ({
        src: optimizeCloudinaryUrl(img.secureUrl),
        alt: img.title || img.originalFilename || 'Gallery image'
      }));
    }

    return fallbackDomeImages;
  }, [cloudImages]);

  const usingCloudGallery = cloudImages.length > 0;

  return (
    <div className="flex flex-col bg-slate-50 min-h-screen">
      <PageHero title="Gallery" breadcrumb="Gallery" />
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-20 pb-16 w-full">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center mb-16"
        >
          <span className="text-emerald-600 font-semibold tracking-[0.28em] uppercase text-sm mb-4 block">
            Our Campus Life
          </span>
          <h2 className="text-3xl md:text-5xl font-semibold text-slate-900 tracking-tight max-w-4xl mx-auto">
            Dome gallery effect with live Cloudinary media
          </h2>
          <p className="text-lg text-slate-600 max-w-3xl mx-auto leading-relaxed mt-5">
            Upload gallery photos once and this page will fetch them from the Cloudinary folder{' '}
            <span className="font-semibold text-slate-900">{galleryFolder}</span> automatically.
          </p>
          {!usingCloudGallery && !loading && (
            <p className="text-sm text-amber-700 bg-amber-50 border border-amber-200 rounded-full px-4 py-2 inline-flex mt-6">
              No Cloudinary gallery images found yet, so Dome Gallery is temporarily using the {galleryFolderPath} until uploads are added.
            </p>
          )}
        </motion.div>

        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 1 }}
          className="w-full h-[640px] md:h-[820px] rounded-[2rem] overflow-hidden relative shadow-[0_40px_120px_rgba(15,23,42,0.18)] bg-[#090611] mb-10 ring-1 ring-slate-900/5"
        >
          <DomeGallery
            images={domeImages}
            fit={0.8}
            minRadius={600}
            maxVerticalRotationDeg={0}
            segments={34}
            dragDampening={2}
            grayscale
          />
        </motion.div>

        <div className="text-center text-sm text-slate-500">
          Tap or click any tile to open it. Drag sideways to rotate the dome.
        </div>
      </div>
      <StatsCtaBanner />
    </div>
  );
}
