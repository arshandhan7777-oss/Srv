import mongoose from 'mongoose';

const studentSchema = new mongoose.Schema({
  name: { type: String, required: true },
  srvNumber: { type: String, required: true, unique: true }, // Same as the Parent's SrvNumber
  grade: { type: String, required: true },
  section: { type: String, required: true },
  motherName: { type: String, trim: true, default: '' },
  fatherName: { type: String, trim: true, default: '' },
  guardianName: { type: String, trim: true, default: '' },
  dateOfBirth: { type: Date },
  contactNumber: { type: String },
  address: { type: String },
  group: { type: String }, // For 11th and 12th graders
  facultyId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' }, // The faculty managing this student
  fees: {
    term1: { type: String, enum: ['Paid', 'Partial', 'Unpaid'], default: 'Unpaid' },
    term1Amount: { type: Number, default: 4500 },
    term1Paid: { type: Number, default: 0 },
    term2: { type: String, enum: ['Paid', 'Partial', 'Unpaid'], default: 'Unpaid' },
    term2Amount: { type: Number, default: 4500 },
    term2Paid: { type: Number, default: 0 },
    term3: { type: String, enum: ['Paid', 'Partial', 'Unpaid'], default: 'Unpaid' },
    term3Amount: { type: Number, default: 4500 },
    term3Paid: { type: Number, default: 0 },
    overall: { type: String, enum: ['Paid', 'Partial', 'Unpaid'], default: 'Unpaid' },
    additionalFees: { type: Number, default: 0 },
    additionalPaid: { type: Number, default: 0 },
  }
}, { timestamps: true });

export default mongoose.model('Student', studentSchema);
