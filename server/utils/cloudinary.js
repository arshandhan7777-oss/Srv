import crypto from 'crypto';

const trimEnv = (value) => String(value || '').trim();

export const getCloudinaryConfig = () => ({
  cloudName: trimEnv(process.env.CLOUDINARY_CLOUD_NAME),
  apiKey: trimEnv(process.env.CLOUDINARY_API_KEY),
  apiSecret: trimEnv(process.env.CLOUDINARY_API_SECRET),
  uploadPreset: trimEnv(process.env.CLOUDINARY_UPLOAD_PRESET),
  folder: trimEnv(process.env.CLOUDINARY_FOLDER) || 'SRV'
});

export const buildCloudinaryUploadConfig = () => {
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
    folder: config.folder,
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
