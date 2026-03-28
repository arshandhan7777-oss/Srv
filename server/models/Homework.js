import mongoose from 'mongoose';

const homeworkSchema = new mongoose.Schema({
  facultyId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  grade: { type: String, required: true },
  section: { type: String, required: true },
  
  subject: { type: String, required: true },
  title: { type: String, required: true },
  description: { type: String, required: true },
  dueDate: { type: Date, required: true },
  assignedDate: { type: Date, default: Date.now },
  archived: { type: Boolean, default: false },
  createdAt: { type: Date, default: Date.now }
}, { timestamps: true });

// Compound index for optimizing active/archived searches per class
homeworkSchema.index({ grade: 1, section: 1, archived: 1, createdAt: -1 });
// Index for subject-wise history queries
homeworkSchema.index({ grade: 1, section: 1, subject: 1, createdAt: -1 });
// Index for parent homework/weekly query filtering by dueDate
homeworkSchema.index({ grade: 1, section: 1, archived: 1, dueDate: 1 });

export default mongoose.model('Homework', homeworkSchema);
