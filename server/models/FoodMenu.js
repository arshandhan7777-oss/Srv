import mongoose from 'mongoose';

const foodMenuSchema = new mongoose.Schema({
  day: { 
    type: String, 
    required: true, 
    unique: true,
    enum: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday']
  },
  breakfast: { type: String, default: '' },
  lunch: { type: String, default: '' },
  snacks: { type: String, default: '' }
}, { timestamps: true });

export default mongoose.model('FoodMenu', foodMenuSchema);
