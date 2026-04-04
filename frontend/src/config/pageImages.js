const academicMods = import.meta.glob('../assest/Academic/*.{webp,jpg,jpeg,png}', { eager: true, query: '?url', import: 'default' });
const admissionsMods = import.meta.glob('../assest/Admissions/*.{webp,jpg,jpeg,png}', { eager: true, query: '?url', import: 'default' });
const coCurricularMods = import.meta.glob('../assest/Co-Curricular/*.{webp,jpg,jpeg,png}', { eager: true, query: '?url', import: 'default' });
const facilitiesMods = import.meta.glob('../assest/Facilites/*.{webp,jpg,jpeg,png}', { eager: true, query: '?url', import: 'default' });
const newsMediaMods = import.meta.glob('../assest/News&Media/*.{webp,jpg,jpeg,png}', { eager: true, query: '?url', import: 'default' });
const skillDevelopmentMods = import.meta.glob('../assest/Skill Development/*.{webp,jpg,jpeg,png}', { eager: true, query: '?url', import: 'default' });

const mapMods = (mods) => Object.keys(mods).map((filePath) => {
  const fileName = filePath.split('/').pop().replace(/\.[^/.]+$/, "");
  return { url: mods[filePath], title: fileName };
});

export const academicImages = mapMods(academicMods);
export const admissionsImages = mapMods(admissionsMods);
export const coCurricularImages = mapMods(coCurricularMods);
export const facilitiesImages = mapMods(facilitiesMods);
export const newsMediaImages = mapMods(newsMediaMods);
export const skillDevelopmentImages = mapMods(skillDevelopmentMods);

// Helper function to safely get dynamic folders' image or use standard fallback
export const getPageImage = (folderArray, index, fallbackUrl) => {
  if (folderArray && folderArray.length > index) {
    return folderArray[index].url;
  }
  return fallbackUrl;
};
