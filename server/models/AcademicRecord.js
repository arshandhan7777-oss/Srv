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

  // Nlite Academy 21st-century skills evaluation (1 to 5 scale)
  nliteSkills: {
    communication: { type: Number, default: 0, min: 0, max: 5 },
    teamwork: { type: Number, default: 0, min: 0, max: 5 },
    lifelongLearning: { type: Number, default: 0, min: 0, max: 5 },
    positiveAttitude: { type: Number, default: 0, min: 0, max: 5 },
    holisticWellbeing: { type: Number, default: 0, min: 0, max: 5 },
    languageProficiency: { type: Number, default: 0, min: 0, max: 5 },
  }

}, { timestamps: true });

// Virtual for calculating attendance percentage
academicRecordSchema.virtual('attendancePercentage').get(function() {
  if (this.totalWorkingDays === 0) return 0;
  return ((this.daysPresent / this.totalWorkingDays) * 100).toFixed(2);
});

academicRecordSchema.set('toJSON', { virtuals: true });
academicRecordSchema.set('toObject', { virtuals: true });

export default mongoose.model('AcademicRecord', academicRecordSchema);
