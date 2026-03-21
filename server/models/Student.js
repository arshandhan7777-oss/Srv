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
  fees: {
    term1: { type: String, enum: ['Paid', 'Unpaid'], default: 'Unpaid' },
    term2: { type: String, enum: ['Paid', 'Unpaid'], default: 'Unpaid' },
    term3: { type: String, enum: ['Paid', 'Unpaid'], default: 'Unpaid' },
    overall: { type: String, enum: ['Paid', 'Unpaid'], default: 'Unpaid' },
    additionalFees: { type: String, default: '0' },
  }
}, { timestamps: true });

export default mongoose.model('Student', studentSchema);
