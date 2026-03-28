import express from 'express';
import Student from '../models/Student.js';
import AcademicRecord from '../models/AcademicRecord.js';
import Homework from '../models/Homework.js';
import Notification from '../models/Notification.js';
import FoodMenu from '../models/FoodMenu.js';
import Attendance from '../models/Attendance.js';
import Behavior from '../models/Behavior.js';
import Setting from '../models/Setting.js';
import User from '../models/User.js';
import { protect } from '../middleware/auth.js';
import { archiveOldHomework } from '../utils/archiveHomework.js';

const router = express.Router();

// Ensure only parents can access these routes, and they only see their matched student
const parentOnly = (req, res, next) => {
  if (req.user && req.user.role === 'parent') {
    next();
  } else {
    res.status(403).json({ message: 'Request forbidden: Parent access required' });
  }
};

// @route   GET /api/parent/dashboard
// @desc    Get student profile and aggregate data for the Smart Dashboard
// @access  Private (Parent only)
router.get('/dashboard', protect, parentOnly, async (req, res) => {
  try {
    const parentUser = await import('../models/User.js').then(m => m.default.findById(req.user.id));
    if (!parentUser.studentId) return res.status(404).json({ message: 'No student linked to this account' });

    const student = await Student.findById(parentUser.studentId).populate('facultyId', 'name');
    if (!student) return res.status(404).json({ message: 'Student record not found' });

    // Run auto-archive transparently
    await archiveOldHomework();

    // Get all academic records to build trend graphs
    const records = await AcademicRecord.find({ studentId: student._id }).sort({ createdAt: 1 });
    
    // Get TODAY's homework only (for "Recent Homework & Tasks" section)
    const todayStart = new Date();
    todayStart.setHours(0, 0, 0, 0);
    const todayEnd = new Date();
    todayEnd.setHours(23, 59, 59, 999);

    const homework = await Homework.find({ 
      grade: student.grade, 
      section: student.section,
      archived: { $ne: true },
      dueDate: { $gte: todayStart, $lte: todayEnd }
    }).sort({ subject: 1, dueDate: 1 });

    // Get today's food menu
    const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
    const today = days[new Date().getDay()];
    const food = await FoodMenu.findOne({ day: today });

    // Get online fee setting
    let setting = await Setting.findOne({ key: 'onlineFeePayment' });
    const isOnlineFeeEnabled = setting ? setting.value : false;

    // Get attendance specifically for this student
    const classAttendance = await Attendance.find({
      'records.studentId': student._id
    }).sort({ date: 1 });

    const attendanceFlat = classAttendance.map(doc => {
      const p = doc.records.find(r => r.studentId.toString() === student._id.toString());
      return {
        date: doc.date,
        status: p ? p.status : 'Absent',
        remarks: p ? p.remarks : ''
      };
    });

    // Get behavior specifically for this student
    const classBehavior = await Behavior.find({
      'records.studentId': student._id
    }).sort({ date: 1 });

    const behaviorFlat = classBehavior.map(doc => {
      const p = doc.records.find(r => r.studentId.toString() === student._id.toString());
      return {
        date: doc.date,
        score: p ? p.score : null,
        remarks: p ? p.remarks : ''
      };
    }).filter(b => b.score !== null);

    res.json({
      student,
      records,
      homework,
      food,
      attendance: attendanceFlat,
      behavior: behaviorFlat,
      settings: { isOnlineFeeEnabled }
    });

  } catch (error) {
    res.status(500).json({ message: 'Server error loading dashboard' });
  }
});

// @route   GET /api/parent/notifications
// @desc    Get all notifications for this parent
// @access  Private (Parent only)
router.get('/notifications', protect, parentOnly, async (req, res) => {
  try {
    const notifications = await Notification.find({ userId: req.user.id }).sort({ createdAt: -1 });
    res.json(notifications);
  } catch (error) {
    res.status(500).json({ message: 'Server error fetching notifications' });
  }
});

// @route   GET /api/parent/homework/weekly
// @desc    Get active (non-archived) homework for the student's grade/section (due within 60 days)
// @access  Private (Parent only)
router.get('/homework/weekly', protect, parentOnly, async (req, res) => {
  try {
    const parentUser = await User.findById(req.user.id);
    if (!parentUser.studentId) return res.status(404).json({ message: 'No student linked' });

    const student = await Student.findById(parentUser.studentId);
    if (!student) return res.status(404).json({ message: 'Student not found' });

    // Run auto-archive transparently
    await archiveOldHomework();

    // Fetch only active (non-archived) homework with dueDate within next 60 days
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const sixtyDaysFromNow = new Date(today);
    sixtyDaysFromNow.setDate(sixtyDaysFromNow.getDate() + 60);

    const homework = await Homework.find({ 
      grade: student.grade, 
      section: student.section,
      archived: { $ne: true },
      dueDate: { $gte: today, $lte: sixtyDaysFromNow }
    }).sort({ dueDate: 1 });
      
    res.json(homework);
  } catch (error) {
    res.status(500).json({ message: 'Server error fetching homework' });
  }
});

// @route   GET /api/parent/homework/history/:subject
// @desc    Get ALL homework (active + archived) for a specific subject — full history
// @access  Private (Parent only)
router.get('/homework/history/:subject', protect, parentOnly, async (req, res) => {
  try {
    const parentUser = await User.findById(req.user.id);
    if (!parentUser.studentId) return res.status(404).json({ message: 'No student linked' });

    const student = await Student.findById(parentUser.studentId);
    if (!student) return res.status(404).json({ message: 'Student not found' });

    const subject = decodeURIComponent(req.params.subject);
    
    // Build query — fetch both active and archived by default
    const query = { 
      grade: student.grade, 
      section: student.section,
      subject
    };
    
    // Optional: filter by archived status via query param
    if (req.query.archived === 'true') {
      query.archived = true;
    } else if (req.query.archived === 'false') {
      query.archived = false;
    }
    // If no query param, fetch all (both active and archived)

    const homework = await Homework.find(query).sort({ createdAt: -1 });
      
    res.json(homework);
  } catch (error) {
    res.status(500).json({ message: 'Server error fetching homework history' });
  }
});

// @route   PUT /api/parent/notifications/:id/read
// @desc    Mark a notification as read
// @access  Private (Parent only)
router.put('/notifications/:id/read', protect, parentOnly, async (req, res) => {
  try {
    const notification = await Notification.findOneAndUpdate(
      { _id: req.params.id, userId: req.user.id },
      { isRead: true },
      { new: true }
    );
    res.json(notification);
  } catch (error) {
    res.status(500).json({ message: 'Server error updating notification' });
  }
});

// @route   GET /api/parent/food
// @desc    Get the entire weekly food menu
// @access  Private (Parent only)
router.get('/food', protect, parentOnly, async (req, res) => {
  try {
    const menu = await FoodMenu.find();
    res.json(menu);
  } catch (error) {
    res.status(500).json({ message: 'Error fetching food menu' });
  }
});

// @route   POST /api/parent/pay-fee
// @desc    Simulate paying a fee term
// @access  Private (Parent only)
router.post('/pay-fee', protect, parentOnly, async (req, res) => {
  const { term, amount, amountToPay } = req.body;
  try {
    let setting = await Setting.findOne({ key: 'onlineFeePayment' });
    if (!setting || setting.value !== true) {
      return res.status(403).json({ message: 'Online fee payment is currently disabled.' });
    }

    const parentUser = await User.findById(req.user.id);
    const student = await Student.findById(parentUser.studentId);
    if (!student) return res.status(404).json({ message: 'Student record not found' });

    if (!student.fees) student.fees = {};
    
    let paidVal = Number(amountToPay) || 0;
    const termPaidKey = `${term}Paid`;
    const termAmtKey = `${term}Amount`;
    
    student.fees[termPaidKey] = (Number(student.fees[termPaidKey]) || 0) + paidVal;
    
    const targetAmt = student.fees[termAmtKey] || 4500;
    if (student.fees[termPaidKey] >= targetAmt) {
      student.fees[term] = 'Paid';
    } else if (student.fees[termPaidKey] > 0) {
      student.fees[term] = 'Partial';
    } else {
      student.fees[term] = 'Unpaid';
    }
    
    await student.save();

    // Notify all admins
    const admins = await User.find({ role: 'admin' });
    const notifications = admins.map(admin => ({
      userId: admin._id,
      type: 'FEE_ALERT',
      message: `${parentUser.name} paid ${amount} for ${student.name} (${student.srvNumber}) - ${term}`
    }));
    
    if (notifications.length > 0) {
      await Notification.insertMany(notifications);
    }

    res.json({ message: 'Payment successful', student });
  } catch (error) {
    console.error('Payment error:', error);
    res.status(500).json({ message: 'Server error processing payment' });
  }
});

export default router;
