import mongoose from 'mongoose';

const eventRegistrationSchema = new mongoose.Schema({
  eventId: { type: mongoose.Schema.Types.ObjectId, ref: 'Event', required: true },
  parentId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  studentId: { type: mongoose.Schema.Types.ObjectId, ref: 'Student', required: true },
  facultyId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  participantNames: [{ type: String }],
  note: { type: String, default: '' },
  acknowledgedAt: { type: Date, default: Date.now }
}, { timestamps: true });

eventRegistrationSchema.index({ eventId: 1, parentId: 1 }, { unique: true });
eventRegistrationSchema.index({ facultyId: 1, createdAt: -1 });

export default mongoose.model('EventRegistration', eventRegistrationSchema);
