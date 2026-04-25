import crypto from 'crypto';

const trimEnv = (value) => String(value || '').trim();

const joinFolderParts = (...parts) => parts
  .map(part => trimEnv(part))
  .filter(Boolean)
  .map(part => part.replace(/^\/+|\/+$/g, ''))
  .join('/');

export const getCloudinaryConfig = () => ({
  cloudName: trimEnv(process.env.CLOUDINARY_CLOUD_NAME),
  apiKey: trimEnv(process.env.CLOUDINARY_API_KEY),
  apiSecret: trimEnv(process.env.CLOUDINARY_API_SECRET),
  uploadPreset: trimEnv(process.env.CLOUDINARY_UPLOAD_PRESET),
  folder: trimEnv(process.env.CLOUDINARY_FOLDER) || 'SRV'
});

export const getCloudinaryGalleryFolder = () => {
  const config = getCloudinaryConfig();
  return trimEnv(process.env.CLOUDINARY_GALLERY_FOLDER) || joinFolderParts(config.folder, 'gallery');
};

export const buildCloudinaryUploadConfig = ({ folder } = {}) => {
  const config = getCloudinaryConfig();
  const unsignedUploadsEnabled = Boolean(config.cloudName && config.uploadPreset);
  const signedUploadsEnabled = Boolean(config.cloudName && config.apiKey && config.apiSecret);
  const enabled = Boolean(unsignedUploadsEnabled || signedUploadsEnabled);
  const canManageAssets = signedUploadsEnabled;

  return {
    enabled,
    canManageAssets,
    signedUploadsEnabled,
    unsignedUploadsEnabled,
    cloudName: config.cloudName,
    apiKey: config.apiKey,
    uploadPreset: config.uploadPreset,
    folder: folder || config.folder,
    message: enabled
      ? ''
      : 'Cloudinary upload is not ready yet. Add the cloud name plus either an unsigned preset or full API credentials.'
  };
};

export const signCloudinaryParams = (params) => {
  const { apiSecret } = getCloudinaryConfig();
  if (!apiSecret) {
    throw new Error('Cloudinary API secret is missing.');
  }

  const payload = Object.entries(params)
    .filter(([, value]) => value !== undefined && value !== null && value !== '')
    .sort(([keyA], [keyB]) => keyA.localeCompare(keyB))
    .map(([key, value]) => `${key}=${value}`)
    .join('&');

  return crypto.createHash('sha1').update(`${payload}${apiSecret}`).digest('hex');
};

export const destroyCloudinaryAsset = async ({ publicId, resourceType = 'image' }) => {
  const { cloudName, apiKey, apiSecret } = getCloudinaryConfig();

  if (!cloudName || !apiKey || !apiSecret || !publicId) {
    return { ok: false, skipped: true };
  }

  const timestamp = Math.floor(Date.now() / 1000);
  const signature = signCloudinaryParams({
    invalidate: true,
    public_id: publicId,
    timestamp
  });

  const body = new URLSearchParams({
    public_id: publicId,
    api_key: apiKey,
    timestamp: String(timestamp),
    invalidate: 'true',
    signature
  });

  const response = await fetch(`https://api.cloudinary.com/v1_1/${cloudName}/${resourceType}/destroy`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded'
    },
    body
  });

  const payload = await response.json().catch(() => ({}));

  if (!response.ok) {
    throw new Error(payload?.error?.message || 'Cloudinary delete failed.');
  }

  return { ok: true, payload };
};

export const buildCloudinaryUploadSignature = ({ folder, publicId } = {}) => {
  const { cloudName, apiKey, apiSecret, folder: defaultFolder } = getCloudinaryConfig();

  if (!cloudName || !apiKey || !apiSecret) {
    throw new Error('Cloudinary signed upload is not configured.');
  }

  const timestamp = Math.floor(Date.now() / 1000);
  const params = {
    folder: folder || defaultFolder,
    timestamp
  };

  if (publicId) {
    params.public_id = publicId;
  }

  return {
    cloudName,
    apiKey,
    folder: params.folder,
    timestamp,
    publicId: params.public_id || '',
    signature: signCloudinaryParams(params)
  };
};

export const fetchCloudinaryGalleryImages = async () => {
  const { cloudName, apiKey, apiSecret } = getCloudinaryConfig();
  const folder = getCloudinaryGalleryFolder();

  if (!cloudName || !apiKey || !apiSecret) {
    return [];
  }

  const authHeader = 'Basic ' + Buffer.from(`${apiKey}:${apiSecret}`).toString('base64');
  
  const response = await fetch(`https://api.cloudinary.com/v1_1/${cloudName}/resources/search`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': authHeader
    },
    body: JSON.stringify({
      expression: `folder:"${folder}"`,
      sort_by: [{ created_at: 'desc' }],
      max_results: 100
    })
  });

  const payload = await response.json().catch(() => ({}));
  if (!response.ok) {
    console.error('Cloudinary search failed:', payload);
    return [];
  }

  return (payload.resources || []).map((res) => ({
    title: res.filename,
    description: '',
    secureUrl: res.secure_url,
    publicId: res.public_id,
    resourceType: res.resource_type,
    bytes: res.bytes,
    format: res.format,
    originalFilename: res.filename,
    folder: res.folder,
    createdAt: res.created_at
  }));
};
