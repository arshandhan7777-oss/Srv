import mongoose from 'mongoose';

const attendanceSchema = new mongoose.Schema({
  facultyId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  grade: { type: String, required: true },
  section: { type: String, required: true },
  date: { type: Date, required: true },
  
  // Storing the attendance log for all students array-wise for a single day/class
  records: [{
    studentId: { type: mongoose.Schema.Types.ObjectId, ref: 'Student', required: true },
    status: { type: String, enum: ['Present', 'Absent', 'Half-Day'], default: 'Present' },
    remarks: { type: String, default: '' }
  }]
}, { timestamps: true });

// Ensure one attendance sheet per faculty per day
attendanceSchema.index({ facultyId: 1, date: 1 }, { unique: true });

export default mongoose.model('Attendance', attendanceSchema);
