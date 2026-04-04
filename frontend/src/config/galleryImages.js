const imageModules = import.meta.glob('../assest/Gallery/*.{webp,jpg,jpeg,png}', { eager: true, query: '?url', import: 'default' });

export const autoGalleryImages = Object.keys(imageModules).map((filePath, index) => {
  const fileName = filePath.split('/').pop().replace(/\.[^/.]+$/, "");
  return {
    url: imageModules[filePath],
    title: fileName
  };
});

// Keep the old unsplash images as fallback if the folder is empty
export const defaultFallbackImages = [
  { url: 'https://images.unsplash.com/photo-1523050854058-8df90110c9f1?q=80&w=2940&auto=format&fit=crop', title: 'Main Campus', span: 'col-span-1 md:col-span-2 row-span-2' },
  { url: 'https://images.unsplash.com/photo-1509062522246-3755977927d7?q=80&w=2000&auto=format&fit=crop', title: 'Smart Classrooms', span: 'col-span-1 row-span-1' },
  { url: 'https://images.unsplash.com/photo-1511629091441-ee46146481b6?q=80&w=2940&auto=format&fit=crop', title: 'Central Library', span: 'col-span-1 row-span-1' },
  { url: 'https://images.unsplash.com/photo-1577896851231-70ef18881754?q=80&w=2940&auto=format&fit=crop', title: 'Student Playground', span: 'col-span-1 row-span-1' },
  { url: 'https://images.unsplash.com/photo-1546410531-bb4caa6b424d?q=80&w=2942&auto=format&fit=crop', title: 'Language Lab', span: 'col-span-1 md:col-span-2 row-span-1' },
  { url: 'https://images.unsplash.com/photo-1513364776144-60967b0f800f?q=80&w=2942&auto=format&fit=crop', title: 'Art & Design Studio', span: 'col-span-1 row-span-1' },
  { url: 'https://images.unsplash.com/photo-1532094349884-543bc11b234d?q=80&w=2940&auto=format&fit=crop', title: 'Science Laboratory', span: 'col-span-1 row-span-2' },
  { url: 'https://images.unsplash.com/photo-1526676037777-05a232554f77?q=80&w=2940&auto=format&fit=crop', title: 'Sports Complex', span: 'col-span-1 md:col-span-2 row-span-1' },
];

export const getGalleryImages = () => {
    if (autoGalleryImages.length > 0) {
        return autoGalleryImages;
    }
    return defaultFallbackImages;
};
