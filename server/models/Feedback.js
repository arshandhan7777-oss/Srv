import mongoose from 'mongoose';

const feedbackSchema = new mongoose.Schema({
  parentId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  studentId: { type: mongoose.Schema.Types.ObjectId, ref: 'Student', required: true },
  facultyId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  studentName: { type: String, required: true },
  grade: { type: String, required: true },
  section: { type: String, required: true },
  category: { type: String, enum: ['ISSUE', 'SUGGESTION', 'CONCERN'], required: true },
  subject: { type: String, required: true },
  message: { type: String, required: true },
  status: { type: String, enum: ['OPEN', 'IN_REVIEW', 'RESOLVED'], default: 'OPEN' },
  staffNote: { type: String, default: '' },
  updatedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' }
}, { timestamps: true });

feedbackSchema.index({ facultyId: 1, createdAt: -1 });
feedbackSchema.index({ parentId: 1, createdAt: -1 });
feedbackSchema.index({ status: 1, createdAt: -1 });

export default mongoose.model('Feedback', feedbackSchema);
