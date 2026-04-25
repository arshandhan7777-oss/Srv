import { useEffect, useState } from 'react';
import axios from 'axios';
import Swal from 'sweetalert2';
import { Download, Image as ImageIcon, RefreshCcw, Trash2, UploadCloud, Video } from 'lucide-react';
import API_URL from '../config/api.js';

const MAX_IMAGE_BYTES = 5 * 1024 * 1024;

const roleConfig = {
  admin: {
    fetchUrl: '/api/admin/memories',
    uploadConfigUrl: '/api/admin/memories/upload-config',
    uploadSignatureUrl: '/api/admin/memories/upload-signature',
    createUrl: '/api/admin/memories',
    deleteUrl: '/api/admin/memories',
    heading: 'Upload Student Photos and Videos',
    description: 'Upload school memories to Cloudinary, keep photos under 5 MB, and use the same media in the public gallery.',
    accent: 'emerald'
  },
  faculty: {
    fetchUrl: '/api/faculty/memories',
    heading: 'View Memories',
    description: 'Open school memories shared by admin and download photos or videos when needed.',
    accent: 'blue'
  },
  parent: {
    fetchUrl: '/api/parent/memories',
    heading: 'View Memories',
    description: 'Download student memories and keep important school moments saved on your device.',
    accent: 'violet'
  }
};

const accentClasses = {
  emerald: {
    iconWrap: 'bg-emerald-100 text-emerald-700',
    button: 'bg-emerald-600 hover:bg-emerald-700',
    subtle: 'bg-emerald-50 text-emerald-700 border-emerald-100'
  },
  blue: {
    iconWrap: 'bg-blue-100 text-blue-700',
    button: 'bg-blue-600 hover:bg-blue-700',
    subtle: 'bg-blue-50 text-blue-700 border-blue-100'
  },
  violet: {
    iconWrap: 'bg-violet-100 text-violet-700',
    button: 'bg-violet-600 hover:bg-violet-700',
    subtle: 'bg-violet-50 text-violet-700 border-violet-100'
  }
};

const formatFileSize = (bytes) => {
  const size = Number(bytes) || 0;
  if (size < 1024 * 1024) {
    return `${Math.max(1, Math.round(size / 1024))} KB`;
  }
  return `${(size / (1024 * 1024)).toFixed(1)} MB`;
};

const buildDownloadUrl = (url) => (
  String(url || '').includes('/upload/')
    ? String(url).replace('/upload/', '/upload/fl_attachment/')
    : url
);

export function MemoriesSection({ role = 'parent' }) {
  const config = roleConfig[role] || roleConfig.parent;
  const accent = accentClasses[config.accent] || accentClasses.violet;
  const [memories, setMemories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [refreshTick, setRefreshTick] = useState(0);
  const [uploadConfig, setUploadConfig] = useState(null);
  const [uploadForm, setUploadForm] = useState({
    title: '',
    description: '',
    file: null
  });

  useEffect(() => {
    const token = localStorage.getItem('schoolToken');
    if (!token) return;

    let isMounted = true;
    const headers = { Authorization: `Bearer ${token}` };

    const requests = [
      axios.get(`${API_URL}${config.fetchUrl}`, { headers })
    ];

    if (role === 'admin' && config.uploadConfigUrl) {
      requests.push(axios.get(`${API_URL}${config.uploadConfigUrl}`, { headers }));
    }

    setLoading(true);

    Promise.all(requests)
      .then(([memoriesResponse, uploadConfigResponse]) => {
        if (!isMounted) return;
        setMemories(Array.isArray(memoriesResponse.data) ? memoriesResponse.data : []);
        if (uploadConfigResponse) {
          setUploadConfig(uploadConfigResponse.data);
        }
      })
      .catch((error) => {
        if (!isMounted) return;
        console.error('Error loading memories:', error);
      })
      .finally(() => {
        if (isMounted) {
          setLoading(false);
        }
      });

    return () => {
      isMounted = false;
    };
  }, [config.fetchUrl, config.uploadConfigUrl, refreshTick, role]);

  const refreshMemories = () => setRefreshTick((tick) => tick + 1);

  const handleUpload = async (event) => {
    event.preventDefault();

    if (!uploadForm.file) {
      Swal.fire('Select a file', 'Choose a photo or video before uploading.', 'warning');
      return;
    }

    const file = uploadForm.file;
    const isImage = file.type.startsWith('image/');
    const isVideo = file.type.startsWith('video/');

    if (!isImage && !isVideo) {
      Swal.fire('Unsupported file', 'Upload an image or a video file only.', 'warning');
      return;
    }

    if (isImage && file.size > MAX_IMAGE_BYTES) {
      Swal.fire('Photo too large', 'Please keep photo uploads under 5 MB.', 'warning');
      return;
    }

    if (!uploadConfig?.enabled || !uploadConfig?.cloudName) {
      Swal.fire('Upload not ready', uploadConfig?.message || 'Cloudinary upload is not configured yet.', 'error');
      return;
    }

    const token = localStorage.getItem('schoolToken');
    const headers = { Authorization: `Bearer ${token}` };

    try {
      setUploading(true);

      const cloudinaryFormData = new FormData();
      cloudinaryFormData.append('file', file);

      if (uploadConfig.signedUploadsEnabled && config.uploadSignatureUrl) {
        const signatureResponse = await axios.post(
          `${API_URL}${config.uploadSignatureUrl}`,
          { folder: uploadConfig.folder || 'SRV' },
          { headers }
        );
        const signedUpload = signatureResponse.data;

        cloudinaryFormData.append('api_key', signedUpload.apiKey);
        cloudinaryFormData.append('timestamp', String(signedUpload.timestamp));
        cloudinaryFormData.append('signature', signedUpload.signature);
        cloudinaryFormData.append('folder', signedUpload.folder || uploadConfig.folder || 'SRV');
        if (signedUpload.publicId) {
          cloudinaryFormData.append('public_id', signedUpload.publicId);
        }
      } else if (uploadConfig.unsignedUploadsEnabled && uploadConfig.uploadPreset) {
        cloudinaryFormData.append('upload_preset', uploadConfig.uploadPreset);
        cloudinaryFormData.append('folder', uploadConfig.folder || 'SRV');
      } else {
        throw new Error(uploadConfig.message || 'Cloudinary upload is not configured yet.');
      }

      const cloudinaryResponse = await fetch(
        `https://api.cloudinary.com/v1_1/${uploadConfig.cloudName}/auto/upload`,
        {
          method: 'POST',
          body: cloudinaryFormData
        }
      );

      const uploadedAsset = await cloudinaryResponse.json();

      if (!cloudinaryResponse.ok) {
        throw new Error(uploadedAsset?.error?.message || 'Cloudinary upload failed.');
      }

      await axios.post(`${API_URL}${config.createUrl}`, {
        title: uploadForm.title.trim() || file.name.replace(/\.[^.]+$/, ''),
        description: uploadForm.description.trim(),
        secureUrl: uploadedAsset.secure_url,
        publicId: uploadedAsset.public_id,
        resourceType: uploadedAsset.resource_type === 'video' ? 'video' : 'image',
        bytes: uploadedAsset.bytes,
        format: uploadedAsset.format,
        originalFilename: file.name,
        folder: uploadedAsset.folder || uploadConfig.folder || 'SRV'
      }, { headers });

      setUploadForm({ title: '', description: '', file: null });
      refreshMemories();
      Swal.fire('Uploaded', 'Memory uploaded successfully.', 'success');
    } catch (error) {
      Swal.fire('Upload failed', error.message || 'Unable to upload memory right now.', 'error');
    } finally {
      setUploading(false);
    }
  };

  const handleDelete = async (memoryId) => {
    const result = await Swal.fire({
      title: 'Delete memory?',
      text: 'This will remove the item from the portal gallery.',
      icon: 'warning',
      showCancelButton: true,
      confirmButtonText: 'Delete',
      confirmButtonColor: '#dc2626',
      cancelButtonColor: '#475569'
    });

    if (!result.isConfirmed) return;

    try {
      const token = localStorage.getItem('schoolToken');
      await axios.delete(`${API_URL}${config.deleteUrl}/${memoryId}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      refreshMemories();
      Swal.fire('Deleted', 'Memory deleted successfully.', 'success');
    } catch (error) {
      Swal.fire('Delete failed', error.response?.data?.message || 'Unable to delete memory.', 'error');
    }
  };

  return (
    <div className="space-y-6">
      <div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm sm:p-8">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
          <div className="flex items-start gap-4">
            <div className={`flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl ${accent.iconWrap}`}>
              <ImageIcon size={28} />
            </div>
            <div>
              <h2 className="text-2xl font-display font-bold text-slate-900">{config.heading}</h2>
              <p className="mt-2 max-w-3xl text-sm leading-6 text-slate-500">{config.description}</p>
            </div>
          </div>

          <button
            type="button"
            onClick={refreshMemories}
            className="inline-flex items-center gap-2 rounded-xl border border-slate-200 px-4 py-2 text-sm font-semibold text-slate-600 transition hover:bg-slate-50 hover:text-slate-900"
          >
            <RefreshCcw size={16} />
            Refresh
          </button>
        </div>

        {role === 'admin' && (
          <div className="mt-6 rounded-[1.75rem] border border-slate-200 bg-slate-50 p-4 sm:p-6">
            <div className={`mb-4 rounded-2xl border px-4 py-3 text-sm font-semibold ${accent.subtle}`}>
              Photo uploads are limited to 5 MB. Videos are supported too, and new uploads are stored in the dedicated Cloudinary gallery folder.
            </div>

            {uploadConfig && !uploadConfig.enabled && (
              <div className="mb-4 rounded-2xl border border-red-100 bg-red-50 px-4 py-3 text-sm font-semibold text-red-700">
                {uploadConfig.message}
              </div>
            )}

            <form onSubmit={handleUpload} className="space-y-4">
              <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_minmax(0,1fr)]">
                <div>
                  <label className="mb-2 block text-sm font-semibold text-slate-700">Title</label>
                  <input
                    type="text"
                    value={uploadForm.title}
                    onChange={(event) => setUploadForm((current) => ({ ...current, title: event.target.value }))}
                    className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 outline-none focus:ring-2 focus:ring-emerald-500"
                    placeholder="Annual day photos"
                  />
                </div>
                <div>
                  <label className="mb-2 block text-sm font-semibold text-slate-700">Photo or Video</label>
                  <input
                    type="file"
                    accept="image/*,video/*"
                    onChange={(event) => setUploadForm((current) => ({ ...current, file: event.target.files?.[0] || null }))}
                    className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm outline-none file:mr-4 file:rounded-xl file:border-0 file:bg-slate-100 file:px-3 file:py-2 file:font-semibold file:text-slate-700"
                  />
                </div>
              </div>

              <div>
                <label className="mb-2 block text-sm font-semibold text-slate-700">Description</label>
                <textarea
                  value={uploadForm.description}
                  onChange={(event) => setUploadForm((current) => ({ ...current, description: event.target.value }))}
                  className="min-h-[120px] w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 outline-none focus:ring-2 focus:ring-emerald-500"
                  placeholder="Add a short caption for parents and faculty."
                />
              </div>

              {uploadForm.file && (
                <div className="rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-600">
                  <span className="font-semibold text-slate-900">{uploadForm.file.name}</span>
                  <span className="ml-2">{formatFileSize(uploadForm.file.size)}</span>
                </div>
              )}

              <button
                type="submit"
                disabled={uploading}
                className={`inline-flex w-full items-center justify-center gap-2 rounded-2xl px-5 py-3 text-sm font-bold text-white transition disabled:cursor-not-allowed disabled:opacity-60 sm:w-auto ${accent.button}`}
              >
                <UploadCloud size={18} />
                {uploading ? 'Uploading...' : 'Upload Memory'}
              </button>
            </form>
          </div>
        )}
      </div>

      <div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm sm:p-8">
        <div className="mb-5 flex items-center justify-between gap-3">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">Gallery</p>
            <h3 className="mt-1 text-xl font-display font-bold text-slate-900">{memories.length} Memory{memories.length === 1 ? '' : 'ies'}</h3>
          </div>
        </div>

        {loading ? (
          <div className="rounded-3xl border border-dashed border-slate-200 bg-slate-50 px-4 py-14 text-center text-sm font-semibold text-slate-500">
            Loading memories...
          </div>
        ) : memories.length === 0 ? (
          <div className="rounded-3xl border border-dashed border-slate-200 bg-slate-50 px-4 py-14 text-center text-sm font-semibold text-slate-500">
            No memories uploaded yet.
          </div>
        ) : (
          <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-3">
            {memories.map((memory) => {
              const isVideo = memory.resourceType === 'video';

              return (
                <article key={memory._id} className="overflow-hidden rounded-[1.75rem] border border-slate-200 bg-slate-50 shadow-sm">
                  <div className="aspect-[4/3] overflow-hidden bg-slate-200">
                    {isVideo ? (
                      <video
                        controls
                        preload="metadata"
                        className="h-full w-full object-cover"
                        src={memory.secureUrl}
                      />
                    ) : (
                      <img
                        src={memory.secureUrl}
                        alt={memory.title}
                        className="h-full w-full object-cover"
                        loading="lazy"
                      />
                    )}
                  </div>

                  <div className="space-y-4 p-4">
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <h4 className="text-lg font-display font-bold text-slate-900">{memory.title}</h4>
                        <div className="mt-2 flex flex-wrap items-center gap-2 text-xs font-semibold text-slate-500">
                          <span className="rounded-full bg-white px-2.5 py-1">{isVideo ? 'Video' : 'Photo'}</span>
                          <span className="rounded-full bg-white px-2.5 py-1">{formatFileSize(memory.bytes)}</span>
                          <span className="rounded-full bg-white px-2.5 py-1">
                            {new Date(memory.createdAt).toLocaleDateString()}
                          </span>
                        </div>
                      </div>
                      {isVideo ? <Video className="text-slate-400" size={18} /> : <ImageIcon className="text-slate-400" size={18} />}
                    </div>

                    {memory.description ? (
                      <p className="text-sm leading-6 text-slate-500">{memory.description}</p>
                    ) : null}

                    <div className="flex flex-col gap-2 sm:flex-row">
                      <a
                        href={buildDownloadUrl(memory.secureUrl)}
                        target="_blank"
                        rel="noreferrer"
                        className={`inline-flex flex-1 items-center justify-center gap-2 rounded-xl px-4 py-2.5 text-sm font-bold text-white transition ${accent.button}`}
                      >
                        <Download size={16} />
                        Download
                      </a>

                      {role === 'admin' && (
                        <button
                          type="button"
                          onClick={() => handleDelete(memory._id)}
                          className="inline-flex items-center justify-center gap-2 rounded-xl border border-red-200 bg-white px-4 py-2.5 text-sm font-bold text-red-600 transition hover:bg-red-50"
                        >
                          <Trash2 size={16} />
                          Delete
                        </button>
                      )}
                    </div>
                  </div>
                </article>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
