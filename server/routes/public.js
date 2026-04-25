import express from 'express';
import Memory from '../models/Memory.js';
import { getCloudinaryGalleryFolder } from '../utils/cloudinary.js';

const router = express.Router();

const escapeRegex = (value) => String(value || '').replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

// @route   GET /api/public/gallery
// @desc    Get public gallery images stored in the dedicated Cloudinary gallery folder
// @access  Public
router.get('/gallery', async (req, res) => {
  try {
    const galleryFolder = getCloudinaryGalleryFolder();
    const folderPattern = new RegExp(`^${escapeRegex(galleryFolder)}(?:/|$)`, 'i');

    const images = await Memory.find({
      resourceType: 'image',
      folder: folderPattern
    })
      .sort({ createdAt: -1 })
      .select('title description secureUrl publicId bytes format originalFilename folder createdAt');

    res.json({
      folder: galleryFolder,
      images
    });
  } catch (error) {
    res.status(500).json({ message: 'Error fetching public gallery images.' });
  }
});

export default router;
