import express from 'express';
import Student from '../models/Student.js';
import AcademicRecord from '../models/AcademicRecord.js';
import Homework from '../models/Homework.js';
import Notification from '../models/Notification.js';
import Attendance from '../models/Attendance.js';
import Behavior from '../models/Behavior.js';
import { protect, facultyOrAdmin } from '../middleware/auth.js';

const router = express.Router();

// @route   GET /api/faculty/students
// @desc    Get all students assigned to this faculty
// @access  Private (Faculty/Admin)
router.get('/students', protect, facultyOrAdmin, async (req, res) => {
  try {
    // If Admin, they see all mapped. If Faculty, only theirs.
    const query = req.user.role === 'admin' ? {} : { facultyId: req.user.id };
    const students = await Student.find(query).sort({ srvNumber: 1 });
    res.json(students);
  } catch (error) {
    res.status(500).json({ message: 'Error fetching students' });
  }
});

// @route   POST /api/faculty/marks
// @desc    Add or Update academic records (Marks, Attendance, Behaviour)
// @access  Private (Faculty/Admin)
router.post('/marks', protect, facultyOrAdmin, async (req, res) => {
  const { studentId, term, marks, totalWorkingDays, daysPresent, performanceRemarks, behaviour, extraActivities, nliteSkills } = req.body;

  try {
    const student = await Student.findById(studentId);
    if (!student) return res.status(404).json({ message: 'Student not found' });

    let record = await AcademicRecord.findOne({ studentId, term });

    if (record) {
      // Update existing
      record.marks = { ...record.marks, ...marks };
      if (totalWorkingDays) record.totalWorkingDays = totalWorkingDays;
      if (daysPresent) record.daysPresent = daysPresent;
      if (performanceRemarks) record.performanceRemarks = performanceRemarks;
      if (behaviour) record.behaviour = behaviour;
      if (extraActivities) record.extraActivities = extraActivities;
      if (nliteSkills) record.nliteSkills = { ...record.nliteSkills, ...nliteSkills };
      
      await record.save();
    } else {
      // Create new
      record = await AcademicRecord.create({
        studentId,
        facultyId: req.user.id,
        term,
        marks,
        totalWorkingDays,
        daysPresent,
        performanceRemarks,
        behaviour,
        extraActivities,
        nliteSkills
      });
    }

    // --- NOTIFICATIONS ---
    // Check if attendance is below 75%
    if (record.attendancePercentage < 75) {
      // Find parent user
      const parentUser = await import('../models/User.js').then(m => m.default.findOne({ studentId }));
      if (parentUser) {
        await Notification.create({
          userId: parentUser._id,
          type: 'ATTENDANCE_ALERT',
          message: `Alert: ${student.name}'s attendance has fallen below 75% (${record.attendancePercentage}%). Please meet the faculty.`
        });
      }
    }

    // Notify of marks updated
    const parentUser = await import('../models/User.js').then(m => m.default.findOne({ studentId }));
    if (parentUser) {
      await Notification.create({
        userId: parentUser._id,
        type: 'MARKS_UPDATED',
        message: `New marks for ${term} have been updated for ${student.name}.`
      });
    }

    res.status(200).json({ message: 'Academic record saved successfully', record });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error saving marks' });
  }
});

// @route   POST /api/faculty/homework
// @desc    Upload Homework
// @access  Private (Faculty/Admin)
router.post('/homework', protect, facultyOrAdmin, async (req, res) => {
  const { grade, section, subject, title, description, dueDate } = req.body;

  try {
    const homework = await Homework.create({
      facultyId: req.user.id,
      grade,
      section,
      subject,
      title,
      description,
      dueDate
    });

    // Notify all parents of students in this grade and section
    const students = await Student.find({ grade, section });
    const studentIds = students.map(s => s._id);
    const parents = await import('../models/User.js').then(m => m.default.find({ studentId: { $in: studentIds } }));
    
    const notifications = parents.map(p => ({
      userId: p._id,
      type: 'HOMEWORK_ISSUED',
      message: `New Homework: ${subject} - ${title}. Due: ${new Date(dueDate).toLocaleDateString()}`
    }));

    if (notifications.length > 0) {
      await Notification.insertMany(notifications);
    }

    res.status(201).json({ message: 'Homework added successfully', homework });
  } catch (error) {
    res.status(500).json({ message: 'Server error adding homework' });
  }
});

// @route   POST /api/faculty/attendance
// @desc    Submit daily or weekly attendance for the class
// @access  Private (Faculty/Admin)
router.post('/attendance', protect, facultyOrAdmin, async (req, res) => {
  const { date, records } = req.body;
  if (!date || !records) return res.status(400).json({ message: 'Date and records are required.' });

  try {
    const parsedDate = new Date(date).setHours(0, 0, 0, 0); // Normalize to midnight

    let attendanceDoc = await Attendance.findOne({ 
      facultyId: req.user.id, 
      date: new Date(parsedDate) 
    });

    if (attendanceDoc) {
      attendanceDoc.records = records;
      await attendanceDoc.save();
    } else {
      attendanceDoc = await Attendance.create({
        facultyId: req.user.id,
        grade: req.user.assignedGrade,
        section: req.user.assignedSection,
        date: new Date(parsedDate),
        records
      });
    }

    res.json({ message: 'Attendance accurately recorded for ' + new Date(parsedDate).toLocaleDateString(), attendanceDoc });
  } catch (error) {
    res.status(500).json({ message: 'Error saving attendance sheet', error: error.message });
  }
});

// @route   POST /api/faculty/behavior
// @desc    Submit daily behavior scores for the class
// @access  Private (Faculty/Admin)
router.post('/behavior', protect, facultyOrAdmin, async (req, res) => {
  const { date, records } = req.body;
  if (!date || !records) return res.status(400).json({ message: 'Date and records are required.' });

  try {
    const parsedDate = new Date(date).setHours(0, 0, 0, 0);

    let behaviorDoc = await Behavior.findOne({ 
      facultyId: req.user.id, 
      date: new Date(parsedDate) 
    });

    if (behaviorDoc) {
      behaviorDoc.records = records;
      await behaviorDoc.save();
    } else {
      behaviorDoc = await Behavior.create({
        facultyId: req.user.id,
        grade: req.user.assignedGrade,
        section: req.user.assignedSection,
        date: new Date(parsedDate),
        records
      });
    }

    res.json({ message: 'Behavior logs saved for ' + new Date(parsedDate).toLocaleDateString(), behaviorDoc });
  } catch (error) {
    res.status(500).json({ message: 'Error saving behavior logs', error: error.message });
  }
});

export default router;
