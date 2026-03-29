import mongoose from 'mongoose';

const eventSchema = new mongoose.Schema({
  title: { type: String, required: true },
  description: { type: String, required: true },
  venue: { type: String, default: '' },
  eventDate: { type: Date, required: true },
  targetType: { type: String, enum: ['GLOBAL', 'CLASS'], default: 'CLASS' },
  targetGrade: { type: String },
  targetSection: { type: String },
  createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  createdByRole: { type: String, enum: ['admin', 'faculty'], required: true },
  status: { type: String, enum: ['ACTIVE', 'CLOSED', 'CANCELLED'], default: 'ACTIVE' },
  isPublished: { type: Boolean, default: true }
}, { timestamps: true });

eventSchema.index({ createdBy: 1, createdAt: -1 });
eventSchema.index({ targetType: 1, targetGrade: 1, targetSection: 1, status: 1, eventDate: 1 });

export default mongoose.model('Event', eventSchema);
