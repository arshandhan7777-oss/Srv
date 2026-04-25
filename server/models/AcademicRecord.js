import mongoose from 'mongoose';

const academicRecordSchema = new mongoose.Schema({
  studentId: { type: mongoose.Schema.Types.ObjectId, ref: 'Student', required: true },
  facultyId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  term: { type: String, required: true }, // e.g. "Term 1", "Mid-Terms"
  
  // Marks out of 100
  marks: {
    english: { type: Number, default: 0 },
    tamil: { type: Number, default: 0 },
    hindi: { type: Number, default: 0 },
    math: { type: Number, default: 0 },
    science: { type: Number, default: 0 },
    socialScience: { type: Number, default: 0 },
  },

  // Attendance for the term
  totalWorkingDays: { type: Number, default: 0 },
  daysPresent: { type: Number, default: 0 },

  // Faculty Evaluation
  performanceRemarks: { type: String }, // General performance
  behaviour: { type: String, enum: ['Excellent', 'Good', 'Needs Improvement', 'Poor'], default: 'Good' },
  extraActivities: [{ type: String }], // Optional tags for activities

  // Student Extracurricular (EC) Skills evaluation (1 to 5 scale)
  ecSkills: {
    cdc: { type: Number, default: 0, min: 0, max: 5 }, // Communication Development Center
    suits: { type: Number, default: 0, min: 0, max: 5 }, // Computer Program & IT Training
    srvSkillDevelopment: { type: Number, default: 0, min: 0, max: 5 } // Moral, Cultural, Leadership
  }

}, { timestamps: true });

// Virtual for calculating attendance percentage
academicRecordSchema.virtual('attendancePercentage').get(function() {
  if (this.totalWorkingDays === 0) return 0;
  return ((this.daysPresent / this.totalWorkingDays) * 100).toFixed(2);
});

// Index for fast lookup by student ID for dashboard queries
academicRecordSchema.index({ studentId: 1, createdAt: 1 });

academicRecordSchema.set('toJSON', { virtuals: true });
academicRecordSchema.set('toObject', { virtuals: true });

export default mongoose.model('AcademicRecord', academicRecordSchema);
