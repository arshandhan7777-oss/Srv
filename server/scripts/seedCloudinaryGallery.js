import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';
import mongoose from 'mongoose';

import Memory from '../models/Memory.js';
import User from '../models/User.js';
import { getCloudinaryConfig, getCloudinaryGalleryFolder, signCloudinaryParams } from '../utils/cloudinary.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config({ path: path.join(__dirname, '..', '.env') });

const GALLERY_SOURCE_DIR = path.resolve(__dirname, '../../frontend/src/assest/Gallery');
const SUPPORTED_EXTENSIONS = new Set(['.jpg', '.jpeg', '.png', '.webp', '.avif']);

const argMap = new Map(
  process.argv.slice(2).map((entry) => {
    const [key, value = ''] = entry.split('=');
    return [key.replace(/^--/, ''), value];
  })
);

const mimeTypes = {
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.png': 'image/png',
  '.webp': 'image/webp',
  '.avif': 'image/avif'
};

const toTitle = (fileName) => (
  String(fileName || '')
    .replace(/\.[^.]+$/, '')
    .replace(/\s*\(\d+\)\s*/g, ' ')
    .replace(/[-_]+/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
);

const slugify = (value) => (
  String(value || '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 120) || 'gallery-image'
);

const uploadImageToCloudinary = async ({ buffer, fileName, folder, cloudName, apiKey }) => {
  const timestamp = Math.floor(Date.now() / 1000);
  const publicId = slugify(fileName);
  const signature = signCloudinaryParams({
    folder,
    overwrite: true,
    public_id: publicId,
    timestamp
  });

  const extension = path.extname(fileName).toLowerCase();
  const body = new FormData();
  body.append('file', new Blob([buffer], { type: mimeTypes[extension] || 'application/octet-stream' }), fileName);
  body.append('api_key', apiKey);
  body.append('timestamp', String(timestamp));
  body.append('signature', signature);
  body.append('folder', folder);
  body.append('public_id', publicId);
  body.append('overwrite', 'true');

  const response = await fetch(`https://api.cloudinary.com/v1_1/${cloudName}/image/upload`, {
    method: 'POST',
    body
  });

  const payload = await response.json().catch(() => ({}));
  if (!response.ok) {
    throw new Error(payload?.error?.message || `Upload failed for ${fileName}`);
  }

  return payload;
};

const run = async () => {
  const { cloudName, apiKey, apiSecret } = getCloudinaryConfig();
  const galleryFolder = getCloudinaryGalleryFolder();

  if (!process.env.MONGODB_URI) {
    throw new Error('MONGODB_URI is missing in server/.env');
  }
  if (!cloudName || !apiKey || !apiSecret) {
    throw new Error('Cloudinary API credentials are incomplete in server/.env');
  }

  const rawFiles = (await fs.readdir(GALLERY_SOURCE_DIR))
    .filter((name) => SUPPORTED_EXTENSIONS.has(path.extname(name).toLowerCase()))
    .sort((left, right) => left.localeCompare(right, undefined, { numeric: true, sensitivity: 'base' }));

  const startIndex = Math.max(0, Number(argMap.get('start')) || 0);
  const requestedLimit = Number(argMap.get('limit')) || 0;
  const localFiles = requestedLimit > 0
    ? rawFiles.slice(startIndex, startIndex + requestedLimit)
    : rawFiles.slice(startIndex);

  if (localFiles.length === 0) {
    throw new Error(`No supported gallery images found in ${GALLERY_SOURCE_DIR}`);
  }

  await mongoose.connect(process.env.MONGODB_URI);

  try {
    const adminUser = await User.findOne({ role: 'admin' }).select('_id name');
    if (!adminUser) {
      throw new Error('No admin user found. A seeded admin account is required before creating Memory records.');
    }

    let uploadedCount = 0;

    for (const fileName of localFiles) {
      const absolutePath = path.join(GALLERY_SOURCE_DIR, fileName);
      const buffer = await fs.readFile(absolutePath);
      const uploadedAsset = await uploadImageToCloudinary({
        buffer,
        fileName,
        folder: galleryFolder,
        cloudName,
        apiKey
      });

      await Memory.findOneAndUpdate(
        { publicId: uploadedAsset.public_id },
        {
          title: toTitle(fileName),
          description: '',
          secureUrl: uploadedAsset.secure_url,
          publicId: uploadedAsset.public_id,
          resourceType: 'image',
          bytes: uploadedAsset.bytes || buffer.length,
          format: uploadedAsset.format || path.extname(fileName).slice(1),
          originalFilename: fileName,
          folder: uploadedAsset.folder || galleryFolder,
          uploadedBy: adminUser._id,
          createdByRole: 'admin'
        },
        { upsert: true, returnDocument: 'after', setDefaultsOnInsert: true }
      );

      uploadedCount += 1;
      console.log(`[seed-cloudinary-gallery] Uploaded ${uploadedCount}/${localFiles.length}: ${fileName}`);
    }

    console.log(`[seed-cloudinary-gallery] Completed. Seeded ${uploadedCount} images into ${galleryFolder}.`);
  } finally {
    await mongoose.disconnect();
  }
};

run().catch((error) => {
  console.error(`[seed-cloudinary-gallery] ${error.message}`);
  process.exit(1);
});
