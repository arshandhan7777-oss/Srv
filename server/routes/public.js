import express from 'express';
import { getCloudinaryGalleryFolder, fetchCloudinaryGalleryImages } from '../utils/cloudinary.js';

const router = express.Router();

let cachedGalleryImages = null;
let lastGalleryFetchTime = 0;
const CACHE_TTL_MS = 10 * 60 * 1000; // 10 minutes

// @route   GET /api/public/gallery
// @desc    Get public gallery images stacked directly from Cloudinary (with cache)
// @access  Public
router.get('/gallery', async (req, res) => {
  try {
    const galleryFolder = getCloudinaryGalleryFolder();

    const now = Date.now();
    if (cachedGalleryImages && (now - lastGalleryFetchTime < CACHE_TTL_MS)) {
      return res.json({
        folder: galleryFolder,
        images: cachedGalleryImages
      });
    }
    
    // Fetch directly from Cloudinary API
    const images = await fetchCloudinaryGalleryImages();

    // Update cache if successful
    if (images && images.length > 0) {
      cachedGalleryImages = images;
      lastGalleryFetchTime = now;
    }

    res.json({
      folder: galleryFolder,
      images: cachedGalleryImages || images
    });
  } catch (error) {
    res.status(500).json({ message: 'Error fetching public gallery images.' });
  }
});

export default router;
