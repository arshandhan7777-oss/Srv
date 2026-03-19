import mongoose from 'mongoose';

const userSchema = new mongoose.Schema({
  name: { type: String, required: true },
  srvNumber: { type: String, required: true, unique: true }, // The username for login
  password: { type: String, required: true },
  role: { type: String, enum: ['admin', 'faculty', 'parent'], required: true },
  
  // Faculty specific fields
  assignedGrade: { type: String }, // e.g. "X"
  assignedSection: { type: String }, // e.g. "A"
  
  // Parent specific fields
  studentId: { type: mongoose.Schema.Types.ObjectId, ref: 'Student' } // Links parent account to the read-only student record
}, { timestamps: true });

export default mongoose.model('User', userSchema);
