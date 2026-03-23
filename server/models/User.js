import mongoose from 'mongoose';

const userSchema = new mongoose.Schema({
  name: { type: String, required: true },
  srvNumber: { type: String, required: true, unique: true }, // The username for login
  password: { type: String, required: true },
  role: { type: String, enum: ['admin', 'faculty', 'parent'], required: true },
  
  // Faculty specific fields
  assignedGrade: { type: String }, // e.g. "X" (Class Incharge)
  assignedSection: { type: String }, // e.g. "A" (Class Incharge)
  mobileNumber: { type: String }, // Faculty contact number
  maxStudents: { type: Number, default: 30 }, // Capacity limit for tracking their incharge students
  handledClasses: [{
    grade: { type: String },
    section: { type: String },
    subject: { type: String }
  }], // Represents all subjects taught across various grades/sections
  
  // Parent specific fields
  studentId: { type: mongoose.Schema.Types.ObjectId, ref: 'Student' } // Links parent account to the read-only student record
}, { timestamps: true });

export default mongoose.model('User', userSchema);
