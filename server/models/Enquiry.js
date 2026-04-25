import mongoose from 'mongoose';

const interactionSchema = new mongoose.Schema({
  type: { 
    type: String, 
    enum: ['Call', 'WhatsApp', 'Email', 'Meeting', 'SMS', 'Note'], 
    required: true 
  },
  notes: { type: String, default: '' },
  by: { type: mongoose.Schema.Types.ObjectId, ref: 'User' }
}, { timestamps: true });

const enquirySchema = new mongoose.Schema({
  // ── Core Student Info (pre-fill for admission conversion) ──
  studentName: { type: String, required: true, trim: true },
  parentName: { type: String, trim: true, default: '' },
  parentMobile: { type: String, trim: true, default: '' },
  email: { type: String, trim: true, default: '' },
  grade: { type: String, trim: true, default: '' },
  section: { type: String, trim: true, default: '' },
  dateOfBirth: { type: Date },
  address: { type: String, trim: true, default: '' },
  motherName: { type: String, trim: true, default: '' },
  fatherName: { type: String, trim: true, default: '' },
  guardianName: { type: String, trim: true, default: '' },

  // ── Enquiry Metadata ──
  source: { 
    type: String, 
    enum: ['Walk-in', 'Phone', 'WhatsApp', 'Website', 'Referral', 'Other'], 
    default: 'Walk-in' 
  },
  programInterest: { 
    type: String, 
    enum: ['General', 'CDC', 'SUITS', 'SRV Skill Development'], 
    default: 'General' 
  },
  remarks: { type: String, trim: true, default: '' },

  // ── Faculty Referral ──
  referredBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null },

  // ── Pipeline Status ──
  status: { 
    type: String, 
    enum: ['New', 'Contacted', 'Interested', 'Not Interested', 'Converted'], 
    default: 'New' 
  },

  // ── Lead Scoring ──
  leadScore: { type: Number, min: 0, max: 100, default: 0 },
  leadTemperature: { type: String, enum: ['Hot', 'Warm', 'Cold'], default: 'Cold' },

  // ── Interaction Logs ──
  interactions: [interactionSchema],

  // ── Follow-up Tracking ──
  lastFollowUp: { type: Date },
  nextFollowUp: { type: Date },
  followUpCount: { type: Number, default: 0 },

  // ── Conversion Link ──
  convertedStudentId: { type: mongoose.Schema.Types.ObjectId, ref: 'Student', default: null },
  convertedAt: { type: Date },

  // ── Admin Metadata ──
  createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' }
}, { timestamps: true });

// Index for fast pipeline queries
enquirySchema.index({ status: 1, createdAt: -1 });
enquirySchema.index({ leadScore: -1 });

export default mongoose.model('Enquiry', enquirySchema);
