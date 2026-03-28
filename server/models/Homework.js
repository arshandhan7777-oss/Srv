import mongoose from 'mongoose';

const homeworkSchema = new mongoose.Schema({
  facultyId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  grade: { type: String, required: true },
  section: { type: String, required: true },
  
  subject: { type: String, required: true },
  title: { type: String, required: true },
  description: { type: String, required: true },
  dueDate: { type: Date, required: true },
  createdAt: { type: Date, default: Date.now, expires: '14d' }
}, { timestamps: true });

export default mongoose.model('Homework', homeworkSchema);
