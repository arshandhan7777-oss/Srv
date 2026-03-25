import mongoose from 'mongoose';

const passwordResetSchema = new mongoose.Schema({
  srvNumber: { type: String, required: true },
  role: { type: String, required: true },
  status: { type: String, enum: ['Pending', 'Reset'], default: 'Pending' },
  newPassword: { type: String, default: '' }
}, { timestamps: true });

export default mongoose.model('PasswordReset', passwordResetSchema);
