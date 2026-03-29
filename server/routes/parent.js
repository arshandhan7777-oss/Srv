import express from 'express';
import Student from '../models/Student.js';
import AcademicRecord from '../models/AcademicRecord.js';
import Homework from '../models/Homework.js';
import Notification from '../models/Notification.js';
import Announcement from '../models/Announcement.js';
import FoodMenu from '../models/FoodMenu.js';
import Attendance from '../models/Attendance.js';
import Behavior from '../models/Behavior.js';
import Setting from '../models/Setting.js';
import User from '../models/User.js';
import Poll from '../models/Poll.js';
import PollResponse from '../models/PollResponse.js';
import Feedback from '../models/Feedback.js';
import Event from '../models/Event.js';
import EventRegistration from '../models/EventRegistration.js';
import { protect } from '../middleware/auth.js';
import { archiveOldHomework } from '../utils/archiveHomework.js';
import { buildHomeworkClassFilter } from '../utils/homeworkMatching.js';
import { hydratePolls } from '../utils/pollService.js';
import { buildClassAudienceFilter, validatePollAnswers } from '../utils/pollUtils.js';
import { hydrateEvents } from '../utils/eventService.js';
import { validateParticipantNames } from '../utils/eventUtils.js';
import { archivePastEvents } from '../utils/archiveEvents.js';

const router = express.Router();

// Ensure only parents can access these routes, and they only see their matched student
const parentOnly = (req, res, next) => {
  if (req.user && req.user.role === 'parent') {
    next();
  } else {
    res.status(403).json({ message: 'Request forbidden: Parent access required' });
  }
};

const findHomeworkForStudent = async ({ student, extraQuery = {}, sort = { dueDate: 1 } }) => {
  const facultyId = student.facultyId?._id || student.facultyId;
  const classQuery = {
    ...buildHomeworkClassFilter({ grade: student.grade, section: student.section }),
    ...extraQuery
  };

  let homework = await Homework.find(classQuery).sort(sort);

  // Backward-compatible fallback for homework saved with stale class values.
  if (homework.length === 0 && facultyId) {
    homework = await Homework.find({
      facultyId,
      ...extraQuery
    }).sort(sort);
  }

  return homework;
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

    console.log('[Dashboard] Parent:', parentUser._id, 'Student:', student._id, 'Grade:', student.grade, 'Section:', student.section);

    // Run auto-archive transparently
    await archiveOldHomework();

    // Get all academic records to build trend graphs
    const records = await AcademicRecord.find({ studentId: student._id }).sort({ createdAt: 1 });
    
    // Get TODAY's homework only (for "Recent Homework & Tasks" section)
    const todayStart = new Date();
    todayStart.setHours(0, 0, 0, 0);
    const todayEnd = new Date();
    todayEnd.setHours(23, 59, 59, 999);

    const homework = await findHomeworkForStudent({
      student,
      extraQuery: {
      archived: { $ne: true },
      dueDate: { $gte: todayStart, $lte: todayEnd }
      },
      sort: { subject: 1, dueDate: 1 }
    });

    console.log('[Dashboard] Today\'s homework found:', homework.length);

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
    console.log('Parent user:', parentUser?._id, 'studentId:', parentUser?.studentId);
    
    if (!parentUser.studentId) return res.status(404).json({ message: 'No student linked' });

    const student = await Student.findById(parentUser.studentId);
    console.log('Student found:', student?._id, 'grade:', student?.grade, 'section:', student?.section);
    
    if (!student) return res.status(404).json({ message: 'Student not found' });

    // Run auto-archive transparently
    await archiveOldHomework();

    // Fetch only active (non-archived) homework with dueDate within next 60 days
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const sixtyDaysFromNow = new Date(today);
    sixtyDaysFromNow.setDate(sixtyDaysFromNow.getDate() + 60);

    console.log('Query - Grade:', student.grade, 'Section:', student.section, 'Today:', today, 'Sixty days:', sixtyDaysFromNow);

    const homework = await findHomeworkForStudent({
      student,
      extraQuery: {
      archived: { $ne: true },
      dueDate: { $gte: today, $lte: sixtyDaysFromNow }
      },
      sort: { dueDate: 1 }
    });

    console.log('Homework found:', homework.length, homework.map(h => ({ subject: h.subject, dueDate: h.dueDate, grade: h.grade, section: h.section })));
      
    res.json(homework);
  } catch (error) {
    console.error('Error in /homework/weekly:', error.message, error);
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
      subject
    };
    
    // Optional: filter by archived status via query param
    if (req.query.archived === 'true') {
      query.archived = true;
    } else if (req.query.archived === 'false') {
      query.archived = false;
    }

    const homework = await findHomeworkForStudent({
      student,
      extraQuery: query,
      sort: { createdAt: -1 }
    });
    console.log('[History] Subject:', subject, 'Grade:', student.grade, 'Section:', student.section, 'Results:', homework.length);
      
    res.json(homework);
  } catch (error) {
    console.error('[History] Error:', error.message);
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

// @route   GET /api/parent/debug/homework
// @desc    Debug endpoint to check student linking and homework matching
// @access  Private (Parent only)
router.get('/debug/homework', protect, parentOnly, async (req, res) => {
  try {
    const parentUser = await User.findById(req.user.id);
    const student = parentUser.studentId ? await Student.findById(parentUser.studentId) : null;
    
    const allHomework = student ? await findHomeworkForStudent({
      student,
      sort: { createdAt: -1 }
    }) : [];

    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const sixtyDaysFromNow = new Date(today);
    sixtyDaysFromNow.setDate(sixtyDaysFromNow.getDate() + 60);

    const futureHomework = student ? await findHomeworkForStudent({
      student,
      extraQuery: {
        archived: { $ne: true },
        dueDate: { $gte: today, $lte: sixtyDaysFromNow }
      },
      sort: { dueDate: 1 }
    }) : [];

    res.json({
      parentId: parentUser._id,
      parentEmail: parentUser.email,
      studentLinked: !!student,
      student: student ? { _id: student._id, name: student.name, grade: student.grade, section: student.section } : null,
      allHomeworkCount: allHomework.length,
      allHomework: allHomework.map(h => ({ _id: h._id, subject: h.subject, title: h.title, grade: h.grade, section: h.section, dueDate: h.dueDate, archived: h.archived })),
      futureHomeworkCount: futureHomework.length,
      futureHomework: futureHomework.map(h => ({ _id: h._id, subject: h.subject, title: h.title, dueDate: h.dueDate })),
      queryParams: { today: today.toISOString(), sixtyDaysFromNow: sixtyDaysFromNow.toISOString() }
    });
  } catch (error) {
    console.error('[Debug] Error:', error);
    res.status(500).json({ message: 'Error', error: error.message });
  }
});

// @route   GET /api/parent/announcements
// @desc    Get all announcements for this parent (global + class-specific) excluding dismissed
// @access  Private (Parent only)
router.get('/announcements', protect, parentOnly, async (req, res) => {
  try {
    const parentUser = await User.findById(req.user.id);
    if (!parentUser.studentId) return res.status(404).json({ message: 'No student linked to this account' });

    const student = await Student.findById(parentUser.studentId);
    if (!student) return res.status(404).json({ message: 'Student record not found' });

    // Get global announcements + class-specific announcements, excluding those dismissed by this user
    const announcements = await Announcement.find({
      isPublished: true,
      dismissedBy: { $ne: req.user.id },
      $or: [
        { type: 'GLOBAL' },
        {
          type: 'CLASS',
          targetGrade: student.grade.toString(),
          targetSection: student.section
        }
      ]
    }).populate('createdBy', 'name role').sort({ createdAt: -1 });

    res.json(announcements);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Error fetching announcements' });
  }
});

// @route   POST /api/parent/announcements/:id/dismiss
// @desc    Dismiss an announcement for this parent
// @access  Private (Parent only)
router.post('/announcements/:id/dismiss', protect, parentOnly, async (req, res) => {
  try {
    const announcement = await Announcement.findById(req.params.id);
    if (!announcement) return res.status(404).json({ message: 'Announcement not found' });

    // Check if already dismissed by this user
    if (announcement.dismissedBy.includes(req.user.id)) {
      return res.json({ message: 'Announcement already dismissed' });
    }

    // Add user to dismissedBy array
    announcement.dismissedBy.push(req.user.id);
    await announcement.save();

    res.json({ message: 'Announcement dismissed' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Error dismissing announcement' });
  }
});

// @route   GET /api/parent/polls
// @desc    Get active polls available for the linked student
// @access  Private (Parent only)
router.get('/polls', protect, parentOnly, async (req, res) => {
  try {
    const parentUser = await User.findById(req.user.id);
    if (!parentUser.studentId) return res.status(404).json({ message: 'No student linked to this account' });

    const student = await Student.findById(parentUser.studentId);
    if (!student) return res.status(404).json({ message: 'Student record not found' });

    const now = new Date();
    const classFilter = buildClassAudienceFilter({ grade: student.grade, section: student.section });

    const polls = await Poll.find({
      isPublished: true,
      status: 'ACTIVE',
      $and: [
        {
          $or: [
            { closesAt: null },
            { closesAt: { $gte: now } }
          ]
        },
        {
          $or: [
            { targetType: 'GLOBAL' },
            { targetType: 'CLASS', ...classFilter }
          ]
        }
      ]
    }).sort({ createdAt: -1 });

    res.json(await hydratePolls(polls, { respondentId: req.user.id }));
  } catch (error) {
    res.status(500).json({ message: 'Error fetching polls' });
  }
});

// @route   POST /api/parent/polls/:id/respond
// @desc    Submit or update a parent poll response
// @access  Private (Parent only)
router.post('/polls/:id/respond', protect, parentOnly, async (req, res) => {
  const { answers } = req.body;

  try {
    const parentUser = await User.findById(req.user.id);
    if (!parentUser.studentId) return res.status(404).json({ message: 'No student linked to this account' });

    const student = await Student.findById(parentUser.studentId);
    if (!student) return res.status(404).json({ message: 'Student record not found' });

    const now = new Date();
    const classFilter = buildClassAudienceFilter({ grade: student.grade, section: student.section });

    const poll = await Poll.findOne({
      _id: req.params.id,
      isPublished: true,
      status: 'ACTIVE',
      $and: [
        {
          $or: [
            { closesAt: null },
            { closesAt: { $gte: now } }
          ]
        },
        {
          $or: [
            { targetType: 'GLOBAL' },
            { targetType: 'CLASS', ...classFilter }
          ]
        }
      ]
    });

    if (!poll) {
      return res.status(404).json({ message: 'Poll not found or no longer active.' });
    }

    const normalizedAnswers = validatePollAnswers(poll, answers);

    const response = await PollResponse.findOneAndUpdate(
      { pollId: poll._id, respondentId: req.user.id },
      {
        $set: {
          studentId: student._id,
          answers: normalizedAnswers,
          respondedAt: new Date()
        }
      },
      {
        new: true,
        upsert: true,
        runValidators: true,
        setDefaultsOnInsert: true
      }
    );

    res.json({ message: 'Poll response saved successfully.', response });
  } catch (error) {
    res.status(500).json({ message: error.message || 'Error submitting poll response' });
  }
});

// @route   POST /api/parent/feedback
// @desc    Submit feedback from parent to admin/faculty
// @access  Private (Parent only)
router.post('/feedback', protect, parentOnly, async (req, res) => {
  const { category, subject, message } = req.body;

  try {
    const parentUser = await User.findById(req.user.id);
    if (!parentUser.studentId) return res.status(404).json({ message: 'No student linked to this account' });

    const student = await Student.findById(parentUser.studentId);
    if (!student) return res.status(404).json({ message: 'Student record not found' });

    if (!category || !subject || !message) {
      return res.status(400).json({ message: 'Category, subject, and message are required.' });
    }

    const feedback = await Feedback.create({
      parentId: req.user.id,
      studentId: student._id,
      facultyId: student.facultyId || undefined,
      studentName: student.name,
      grade: String(student.grade),
      section: String(student.section),
      category,
      subject: String(subject).trim(),
      message: String(message).trim()
    });

    await feedback.populate('studentId', 'name srvNumber');

    res.status(201).json({ message: 'Feedback submitted successfully.', feedback });
  } catch (error) {
    res.status(500).json({ message: error.message || 'Error submitting feedback' });
  }
});

// @route   GET /api/parent/feedback
// @desc    Get feedback submitted by this parent
// @access  Private (Parent only)
router.get('/feedback', protect, parentOnly, async (req, res) => {
  try {
    const feedback = await Feedback.find({ parentId: req.user.id })
      .populate('studentId', 'name srvNumber')
      .sort({ createdAt: -1 });

    res.json(feedback);
  } catch (error) {
    res.status(500).json({ message: 'Error fetching feedback' });
  }
});

// @route   GET /api/parent/events
// @desc    Get upcoming events for the linked student
// @access  Private (Parent only)
router.get('/events', protect, parentOnly, async (req, res) => {
  try {
    await archivePastEvents();
    const parentUser = await User.findById(req.user.id);
    if (!parentUser.studentId) return res.status(404).json({ message: 'No student linked to this account' });

    const student = await Student.findById(parentUser.studentId);
    if (!student) return res.status(404).json({ message: 'Student record not found' });

    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const classFilter = buildClassAudienceFilter({ grade: student.grade, section: student.section });

    const events = await Event.find({
      isPublished: true,
      status: 'ACTIVE',
      eventDate: { $gte: today },
      $or: [
        { targetType: 'GLOBAL' },
        { targetType: 'CLASS', ...classFilter }
      ]
    }).sort({ eventDate: 1, createdAt: -1 });

    res.json(await hydrateEvents(events, { respondentId: req.user.id }));
  } catch (error) {
    res.status(500).json({ message: 'Error fetching events' });
  }
});

// @route   POST /api/parent/events/:id/register
// @desc    Acknowledge an event and optionally submit participant names
// @access  Private (Parent only)
router.post('/events/:id/register', protect, parentOnly, async (req, res) => {
  const { participantNames, note } = req.body;

  try {
    await archivePastEvents();
    const parentUser = await User.findById(req.user.id);
    if (!parentUser.studentId) return res.status(404).json({ message: 'No student linked to this account' });

    const student = await Student.findById(parentUser.studentId);
    if (!student) return res.status(404).json({ message: 'Student record not found' });

    const classFilter = buildClassAudienceFilter({ grade: student.grade, section: student.section });
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const event = await Event.findOne({
      _id: req.params.id,
      isPublished: true,
      status: 'ACTIVE',
      eventDate: { $gte: today },
      $or: [
        { targetType: 'GLOBAL' },
        { targetType: 'CLASS', ...classFilter }
      ]
    });

    if (!event) {
      return res.status(404).json({ message: 'Event not found or no longer active.' });
    }

    const normalizedNames = validateParticipantNames(participantNames);

    const registration = await EventRegistration.findOneAndUpdate(
      { eventId: event._id, parentId: req.user.id },
      {
        $set: {
          studentId: student._id,
          facultyId: student.facultyId || undefined,
          participantNames: normalizedNames,
          note: String(note || '').trim(),
          acknowledgedAt: new Date()
        }
      },
      {
        new: true,
        upsert: true,
        runValidators: true,
        setDefaultsOnInsert: true
      }
    );

    res.json({ message: 'Event acknowledgement saved successfully.', registration });
  } catch (error) {
    res.status(500).json({ message: error.message || 'Error saving event acknowledgement' });
  }
});

export default router;
