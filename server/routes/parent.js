import express from 'express';
import Student from '../models/Student.js';
import AcademicRecord from '../models/AcademicRecord.js';
import Homework from '../models/Homework.js';
import Notification from '../models/Notification.js';
import FoodMenu from '../models/FoodMenu.js';
import { protect } from '../middleware/auth.js';

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

    // Get all academic records to build trend graphs
    const records = await AcademicRecord.find({ studentId: student._id }).sort({ createdAt: 1 });
    
    // Get recent homework
    const homework = await Homework.find({ grade: student.grade, section: student.section })
        .sort({ dueDate: -1 })
        .limit(5);

    // Get today's food menu
    const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
    const today = days[new Date().getDay()];
    const food = await FoodMenu.findOne({ day: today });

    res.json({
      student,
      records,
      homework,
      food
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

export default router;
