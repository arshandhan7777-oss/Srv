import mongoose from 'mongoose';

const notificationSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true }, // The parent/student ID
  type: { type: String, enum: ['ATTENDANCE_ALERT', 'MARKS_UPDATED', 'HOMEWORK_ISSUED', 'GENERAL'], required: true },
  message: { type: String, required: true },
  isRead: { type: Boolean, default: false },
}, { timestamps: true });

export default mongoose.model('Notification', notificationSchema);
