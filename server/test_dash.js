import mongoose from 'mongoose';
import dotenv from 'dotenv';
import path from 'path';

dotenv.config({ path: path.join(process.cwd(), '.env') });
console.log("URI:", process.env.MONGODB_URI ? "Found" : "Missing");

mongoose.connect(process.env.MONGODB_URI).then(async () => {
    console.log("Connected");
    const User = (await import('./models/User.js')).default;
    const Student = (await import('./models/Student.js')).default;
    // Find a parent
    const parent = await User.findOne({ role: 'parent', studentId: { $exists: true } });
    if (!parent) {
      console.log("No parent found"); process.exit(1);
    }
    console.log("Parent:", parent.email, parent.studentId);
    
    // Simulate dashboard fetch
    try {
        const student = await Student.findById(parent.studentId).populate('facultyId', 'name').lean();
        const AcademicRecord = (await import('./models/AcademicRecord.js')).default;
        const Homework = (await import('./models/Homework.js')).default;
        
        const records = await AcademicRecord.find({ studentId: student._id }).sort({ createdAt: 1 }).lean();
        const homework = await Homework.find().limit(2).lean(); // whatever
        
        const responseJson = { student, records, homework, attendance: [], behavior: [], food: null, settings: { isOnlineFeeEnabled: false } };
        
        console.log("Success generating json");
    } catch(e) {
        console.error("Dashboard error:", e);
    }
    process.exit(0);
}).catch(console.error);
