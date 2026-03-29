import mongoose from 'mongoose';

const pollQuestionSchema = new mongoose.Schema({
  prompt: { type: String, required: true },
  options: [{ type: String, required: true }],
  allowOther: { type: Boolean, default: false },
  required: { type: Boolean, default: true }
}, { _id: true });

const pollSchema = new mongoose.Schema({
  title: { type: String, required: true },
  description: { type: String, default: '' },
  status: { type: String, enum: ['DRAFT', 'ACTIVE', 'CLOSED'], default: 'ACTIVE' },
  isPublished: { type: Boolean, default: true },
  targetType: { type: String, enum: ['GLOBAL', 'CLASS'], default: 'CLASS' },
  targetGrade: { type: String },
  targetSection: { type: String },
  closesAt: { type: Date },
  createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  createdByRole: { type: String, enum: ['admin', 'faculty'], required: true },
  questions: [pollQuestionSchema]
}, { timestamps: true });

pollSchema.index({ createdBy: 1, createdAt: -1 });
pollSchema.index({ targetType: 1, targetGrade: 1, targetSection: 1, status: 1, isPublished: 1 });

export default mongoose.model('Poll', pollSchema);
