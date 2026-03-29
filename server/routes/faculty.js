import express from 'express';
import Student from '../models/Student.js';
import AcademicRecord from '../models/AcademicRecord.js';
import Homework from '../models/Homework.js';
import Notification from '../models/Notification.js';
import Announcement from '../models/Announcement.js';
import Attendance from '../models/Attendance.js';
import Behavior from '../models/Behavior.js';
import User from '../models/User.js';
import { protect, facultyOrAdmin } from '../middleware/auth.js';
import { archiveOldHomework } from '../utils/archiveHomework.js';
import { buildHomeworkClassFilter, resolveHomeworkAudience } from '../utils/homeworkMatching.js';

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
    const faculty = req.user.role === 'faculty'
      ? await User.findById(req.user.id).select('assignedGrade assignedSection')
      : null;

    const audience = resolveHomeworkAudience({
      grade,
      section,
      assignedGrade: faculty?.assignedGrade,
      assignedSection: faculty?.assignedSection
    });

    if (!audience) {
      return res.status(400).json({ message: 'Faculty class assignment is missing. Please contact admin and try again.' });
    }

    const homework = await Homework.create({
      facultyId: req.user.id,
      grade: audience.grade,
      section: audience.section,
      subject,
      title,
      description,
      dueDate,
      assignedDate: new Date(),
      archived: false
    });

    // Notify all parents of students in this grade and section
    const students = await Student.find(buildHomeworkClassFilter(audience));
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

// @route   GET /api/faculty/homework
// @desc    Get active (non-archived) homework assigned by faculty (last 14 days)
// @access  Private (Faculty/Admin)
router.get('/homework', protect, facultyOrAdmin, async (req, res) => {
  try {
    // Run auto-archive transparently
    await archiveOldHomework();

    const fourteenDaysAgo = new Date();
    fourteenDaysAgo.setDate(fourteenDaysAgo.getDate() - 14);

    const query = req.user.role === 'admin' 
        ? { archived: { $ne: true }, createdAt: { $gte: fourteenDaysAgo } } 
        : { facultyId: req.user.id, archived: { $ne: true }, createdAt: { $gte: fourteenDaysAgo } };
        
    const homeworkList = await Homework.find(query).sort({ dueDate: 1 });
    res.json(homeworkList);
  } catch (error) {
    res.status(500).json({ message: 'Error fetching homework' });
  }
});

// @route   GET /api/faculty/homework/history/:subject
// @desc    Get all historical homework (active + archived) for a specific subject
// @access  Private (Faculty/Admin)
router.get('/homework/history/:subject', protect, facultyOrAdmin, async (req, res) => {
  try {
    const subject = decodeURIComponent(req.params.subject);
    const query = req.user.role === 'admin' 
        ? { subject } 
        : { facultyId: req.user.id, subject };
    
    // Optional: filter by archived status via query param
    if (req.query.archived === 'true') {
      query.archived = true;
    } else if (req.query.archived === 'false') {
      query.archived = false;
    }
        
    const homeworkList = await Homework.find(query).sort({ createdAt: -1 });
    res.json(homeworkList);
  } catch (error) {
    res.status(500).json({ message: 'Error fetching homework history' });
  }
});

// @route   PUT /api/faculty/homework/:id
// @desc    Update/Edit existing homework (including deadline)
// @access  Private (Faculty/Admin)
router.put('/homework/:id', protect, facultyOrAdmin, async (req, res) => {
  const { subject, title, description, dueDate } = req.body;
  try {
    const query = req.user.role === 'admin' ? { _id: req.params.id } : { _id: req.params.id, facultyId: req.user.id };
    const hw = await Homework.findOneAndUpdate(
      query,
      { subject, title, description, dueDate },
      { new: true, runValidators: true }
    );
    if (!hw) return res.status(404).json({ message: 'Homework not found or unauthorized' });
    res.json({ message: 'Homework updated successfully', homework: hw });
  } catch (error) {
    res.status(500).json({ message: 'Error updating homework' });
  }
});

// @route   DELETE /api/faculty/homework/:id
// @desc    Soft-delete (archive) a homework assignment — no permanent deletion
// @access  Private (Faculty/Admin)
router.delete('/homework/:id', protect, facultyOrAdmin, async (req, res) => {
  try {
    const query = req.user.role === 'admin' ? { _id: req.params.id } : { _id: req.params.id, facultyId: req.user.id };
    const hw = await Homework.findOneAndUpdate(
      query,
      { $set: { archived: true } },
      { new: true }
    );
    if (!hw) return res.status(404).json({ message: 'Homework not found or unauthorized' });
    res.json({ message: 'Homework archived successfully' });
  } catch (error) {
    res.status(500).json({ message: 'Error archiving homework' });
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
      let gradeStr = req.user.assignedGrade;
      let sectionStr = req.user.assignedSection;
      
      if ((!gradeStr || !sectionStr) && records.length > 0) {
        const Student = (await import('../models/Student.js')).default;
        const firstStudent = await Student.findById(records[0].studentId);
        if (firstStudent) {
            gradeStr = firstStudent.grade;
            sectionStr = firstStudent.section;
        }
      }
      
      attendanceDoc = await Attendance.create({
        facultyId: req.user.id,
        grade: gradeStr || 'N/A',
        section: sectionStr || 'N/A',
        date: new Date(parsedDate),
        records
      });
    }

    res.json({ message: 'Attendance accurately recorded for ' + new Date(parsedDate).toLocaleDateString(), attendanceDoc });
  } catch (error) {
    res.status(500).json({ message: 'Error saving attendance sheet' });
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
      let gradeStr = req.user.assignedGrade;
      let sectionStr = req.user.assignedSection;
      
      if ((!gradeStr || !sectionStr) && records.length > 0) {
        const Student = (await import('../models/Student.js')).default;
        const firstStudent = await Student.findById(records[0].studentId);
        if (firstStudent) {
            gradeStr = firstStudent.grade;
            sectionStr = firstStudent.section;
        }
      }
      
      behaviorDoc = await Behavior.create({
        facultyId: req.user.id,
        grade: gradeStr || 'N/A',
        section: sectionStr || 'N/A',
        date: new Date(parsedDate),
        records
      });
    }

    res.json({ message: 'Behavior logs saved for ' + new Date(parsedDate).toLocaleDateString(), behaviorDoc });
  } catch (error) {
    res.status(500).json({ message: 'Error saving behavior logs' });
  }
});

// @route   POST /api/faculty/announcements
// @desc    Create an announcement for faculty's students
// @access  Private (Faculty only)
router.post('/announcements', protect, async (req, res) => {
  if (req.user.role !== 'faculty') {
    return res.status(403).json({ message: 'Only faculty can create announcements' });
  }

  const { title, message, priority, toAllStudents } = req.body;

  try {
    if (!title || !message) {
      return res.status(400).json({ message: 'Title and message are required' });
    }

    let recipients = [];
    
    if (toAllStudents) {
      // Send to all students in faculty's grade/section
      const students = await Student.find({
        grade: req.user.assignedGrade,
        section: req.user.assignedSection
      });
      
      // Get parent users for these students
      recipients = await User.find({
        studentId: { $in: students.map(s => s._id) },
        role: 'parent'
      }).select('_id');
      
      recipients = recipients.map(r => r._id);
    }

    const announcement = await Announcement.create({
      title,
      message,
      priority: priority || 'MEDIUM',
      type: 'CLASS',
      targetGrade: req.user.assignedGrade,
      targetSection: req.user.assignedSection,
      recipients,
      createdBy: req.user.id,
      createdByRole: 'faculty',
      isPublished: true
    });

    res.status(201).json({
      message: 'Announcement created successfully',
      announcement
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Error creating announcement' });
  }
});

// @route   GET /api/faculty/announcements
// @desc    Get all announcements created by this faculty
// @access  Private (Faculty only)
router.get('/announcements', protect, async (req, res) => {
  if (req.user.role !== 'faculty') {
    return res.status(403).json({ message: 'Only faculty can view their announcements' });
  }

  try {
    const announcements = await Announcement.find({ createdBy: req.user.id }).sort({ createdAt: -1 });
    res.json(announcements);
  } catch (error) {
    res.status(500).json({ message: 'Error fetching announcements' });
  }
});

// @route   DELETE /api/faculty/announcements/:id
// @desc    Delete an announcement
// @access  Private (Faculty only)
router.delete('/announcements/:id', protect, async (req, res) => {
  if (req.user.role !== 'faculty') {
    return res.status(403).json({ message: 'Only faculty can delete their announcements' });
  }

  try {
    const announcement = await Announcement.findByIdAndDelete(req.params.id);
    if (!announcement) return res.status(404).json({ message: 'Announcement not found' });
    res.json({ message: 'Announcement deleted' });
  } catch (error) {
    res.status(500).json({ message: 'Error deleting announcement' });
  }
});

export default router;
