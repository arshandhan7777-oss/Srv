import mongoose from 'mongoose';

const taskSubmissionSchema = new mongoose.Schema({
  facultyId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  taskId: { type: mongoose.Schema.Types.ObjectId, ref: 'FacultyTask', required: true },
  proofUrl: { type: String }, // Cloudinary URL
  proofType: { type: String, enum: ['image', 'video', 'document', 'link', 'none'], default: 'image' },
  comments: { type: String },
  status: { type: String, enum: ['Pending', 'Approved', 'Rejected'], default: 'Pending' },
  qualityScore: { type: Number, min: 0, max: 100, default: 0 },
  adminFeedback: { type: String }
}, { timestamps: true });

// Ensure a faculty member only submits once per task
taskSubmissionSchema.index({ facultyId: 1, taskId: 1 }, { unique: true });

export default mongoose.model('TaskSubmission', taskSubmissionSchema);
