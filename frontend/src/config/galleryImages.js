const bundledGalleryFolderPath = 'frontend/src/assest/Gallery';

const bundledGalleryImages = [
  { url: new URL('../assest/Gallery/107.webp', import.meta.url).href, title: 'Gallery 107' },
  { url: new URL('../assest/Gallery/112.webp', import.meta.url).href, title: 'Gallery 112' },
  { url: new URL('../assest/Gallery/131.webp', import.meta.url).href, title: 'Gallery 131' },
  { url: new URL('../assest/Gallery/143.webp', import.meta.url).href, title: 'Gallery 143' },
  { url: new URL('../assest/Gallery/195.webp', import.meta.url).href, title: 'Gallery 195' },
  { url: new URL('../assest/Gallery/219.webp', import.meta.url).href, title: 'Gallery 219' },
  { url: new URL('../assest/Gallery/248.webp', import.meta.url).href, title: 'Gallery 248' },
  { url: new URL('../assest/Gallery/305.webp', import.meta.url).href, title: 'Gallery 305' },
  { url: new URL('../assest/Gallery/344.webp', import.meta.url).href, title: 'Gallery 344' },
  { url: new URL('../assest/Gallery/399.webp', import.meta.url).href, title: 'Gallery 399' },
  { url: new URL('../assest/Gallery/552.webp', import.meta.url).href, title: 'Gallery 552' },
  { url: new URL('../assest/Gallery/613.webp', import.meta.url).href, title: 'Gallery 613' }
];

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
export const galleryFolderPath = bundledGalleryFolderPath;

export const defaultFallbackImages = bundledGalleryImages.length > 0
  ? bundledGalleryImages
  : remotePlaceholderImages;

export const getGalleryImages = () => defaultFallbackImages;
