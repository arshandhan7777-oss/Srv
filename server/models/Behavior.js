import mongoose from 'mongoose';

const behaviorSchema = new mongoose.Schema({
  facultyId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  grade: { type: String, required: true },
  section: { type: String, required: true },
  date: { type: Date, required: true },
  
  records: [{
    studentId: { type: mongoose.Schema.Types.ObjectId, ref: 'Student', required: true },
    score: { type: Number, min: 1, max: 10, default: 10 },
    remarks: { type: String, default: '' }
  }]
}, { timestamps: true });

// Ensure one behavior log per faculty per day
behaviorSchema.index({ facultyId: 1, date: 1 }, { unique: true });

export default mongoose.model('Behavior', behaviorSchema);
