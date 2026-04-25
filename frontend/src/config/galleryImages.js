const galleryFallbackSource = 'remote placeholder collection';

const remotePlaceholderImages = [
  {
    url: 'https://images.unsplash.com/photo-1523050854058-8df90110c9f1?q=80&w=1600&auto=format&fit=crop',
    title: 'Main Campus'
  },
  {
    url: 'https://images.unsplash.com/photo-1509062522246-3755977927d7?q=80&w=1600&auto=format&fit=crop',
    title: 'Smart Classrooms'
  },
  {
    url: 'https://images.unsplash.com/photo-1511629091441-ee46146481b6?q=80&w=1600&auto=format&fit=crop',
    title: 'Central Library'
  },
  {
    url: 'https://images.unsplash.com/photo-1577896851231-70ef18881754?q=80&w=1600&auto=format&fit=crop',
    title: 'Student Playground'
  }
];

export const cloudinaryGalleryFolder = 'SRV/gallery';
export const galleryFolderPath = galleryFallbackSource;

export const defaultFallbackImages = remotePlaceholderImages;

export const getGalleryImages = () => defaultFallbackImages;
