import mongoose from 'mongoose';

const studentSchema = new mongoose.Schema({
  name: { type: String, required: true },
  srvNumber: { type: String, required: true, unique: true }, // Same as the Parent's SrvNumber
  grade: { type: String, required: true },
  section: { type: String, required: true },
  dateOfBirth: { type: Date },
  contactNumber: { type: String },
  address: { type: String },
  group: { type: String }, // For 11th and 12th graders
  facultyId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' }, // The faculty managing this student
}, { timestamps: true });

export default mongoose.model('Student', studentSchema);
