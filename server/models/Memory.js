import mongoose from 'mongoose';

const memorySchema = new mongoose.Schema({
  title: { type: String, required: true, trim: true },
  description: { type: String, trim: true, default: '' },
  secureUrl: { type: String, required: true, trim: true },
  publicId: { type: String, trim: true, default: '' },
  resourceType: { type: String, enum: ['image', 'video'], required: true },
  bytes: { type: Number, default: 0 },
  format: { type: String, trim: true, default: '' },
  originalFilename: { type: String, trim: true, default: '' },
  folder: { type: String, trim: true, default: '' },
  uploadedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  createdByRole: { type: String, enum: ['admin'], default: 'admin' }
}, { timestamps: true });

export default mongoose.model('Memory', memorySchema);
