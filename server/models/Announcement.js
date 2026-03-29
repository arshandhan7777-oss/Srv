import mongoose from 'mongoose';

const announcementSchema = new mongoose.Schema({
  title: { type: String, required: true },
  message: { type: String, required: true },
  type: { type: String, enum: ['GLOBAL', 'CLASS', 'FACULTY'], default: 'GLOBAL' }, // GLOBAL = all, CLASS = specific grade/section, FACULTY = by faculty
  createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true }, // Admin or Faculty ID
  createdByRole: { type: String, enum: ['admin', 'faculty'], required: true },
  targetGrade: { type: String }, // For class announcements (e.g., "10", "9")
  targetSection: { type: String }, // For class announcements (e.g., "A", "B")
  recipients: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }], // Specific users who should see this
  isPublished: { type: Boolean, default: true },
  priority: { type: String, enum: ['LOW', 'MEDIUM', 'HIGH'], default: 'MEDIUM' },
}, { timestamps: true });

export default mongoose.model('Announcement', announcementSchema);
