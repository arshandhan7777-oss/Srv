import mongoose from 'mongoose';

const studentFeedbackSchema = new mongoose.Schema({
  studentId: { type: mongoose.Schema.Types.ObjectId, ref: 'Student', required: true },
  facultyId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  
  // Ratings on a 1-5 scale
  ratings: {
    teachingQuality: { type: Number, min: 1, max: 5, required: true },
    communication: { type: Number, min: 1, max: 5, required: true },
    support: { type: Number, min: 1, max: 5, required: true }
  },
  comments: { type: String }
}, { timestamps: true });

// Prevent spam: maybe 1 feedback per faculty per month? For now let's just keep track
export default mongoose.model('StudentFeedback', studentFeedbackSchema);
