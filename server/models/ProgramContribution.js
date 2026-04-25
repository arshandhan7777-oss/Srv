import mongoose from 'mongoose';

const programContributionSchema = new mongoose.Schema({
  facultyId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  programName: { 
    type: String, 
    enum: ['Extracurricular', 'CDC', 'SUITS', 'SRV Skill Development', 'General'], 
    required: true 
  },
  hoursContributed: { type: Number, default: 0 },
  participationLevel: { type: String, enum: ['Active', 'Moderate', 'Low', 'None'], default: 'Active' },
  month: { type: String } // e.g. '2026-04'
}, { timestamps: true });

export default mongoose.model('ProgramContribution', programContributionSchema);
