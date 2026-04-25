import mongoose from 'mongoose';

const facultyTaskSchema = new mongoose.Schema({
  title: { type: String, required: true },
  description: { type: String, required: true },
  taskType: { 
    type: String, 
    enum: ['General', 'CDC', 'SUITS', 'SRV Skill Development', 'Extracurricular'], 
    default: 'General' 
  },
  deadline: { type: Date, required: true },
  assignedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  assignedTo: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }], // Array of Faculty User IDs. Empty if targetAll = true.
  targetAll: { type: Boolean, default: false }, // If true, assigned to all faculty
  isActive: { type: Boolean, default: true }
}, { timestamps: true });

export default mongoose.model('FacultyTask', facultyTaskSchema);
