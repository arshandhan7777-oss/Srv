import mongoose from 'mongoose';

const pollAnswerSchema = new mongoose.Schema({
  questionId: { type: mongoose.Schema.Types.ObjectId, required: true },
  selectedOption: { type: String, required: true },
  otherText: { type: String, default: '' }
}, { _id: false });

const pollResponseSchema = new mongoose.Schema({
  pollId: { type: mongoose.Schema.Types.ObjectId, ref: 'Poll', required: true },
  respondentId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  studentId: { type: mongoose.Schema.Types.ObjectId, ref: 'Student', required: true },
  answers: [pollAnswerSchema],
  respondedAt: { type: Date, default: Date.now }
}, { timestamps: true });

pollResponseSchema.index({ pollId: 1, respondentId: 1 }, { unique: true });
pollResponseSchema.index({ pollId: 1, respondedAt: -1 });

export default mongoose.model('PollResponse', pollResponseSchema);
