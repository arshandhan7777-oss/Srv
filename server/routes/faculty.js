import express from 'express';
import Student from '../models/Student.js';
import AcademicRecord from '../models/AcademicRecord.js';
import Homework from '../models/Homework.js';
import Notification from '../models/Notification.js';
import Announcement from '../models/Announcement.js';
import Attendance from '../models/Attendance.js';
import Behavior from '../models/Behavior.js';
import User from '../models/User.js';
import Poll from '../models/Poll.js';
import PollResponse from '../models/PollResponse.js';
import Feedback from '../models/Feedback.js';
import Event from '../models/Event.js';
import EventRegistration from '../models/EventRegistration.js';
import Memory from '../models/Memory.js';
import { protect, facultyOrAdmin } from '../middleware/auth.js';
import { archiveOldHomework } from '../utils/archiveHomework.js';
import { buildHomeworkClassFilter, resolveHomeworkAudience } from '../utils/homeworkMatching.js';
import { hydratePolls } from '../utils/pollService.js';
import { buildClassAudienceFilter, normalizeClassValue, validateAndNormalizeQuestions } from '../utils/pollUtils.js';
import { hydrateEvents } from '../utils/eventService.js';
import { normalizeEventPayload } from '../utils/eventUtils.js';
import { archivePastEvents } from '../utils/archiveEvents.js';
import { applyStudentFamilyDetails, validateStudentFamilyDetails } from '../utils/studentFamilyDetails.js';
import { buildParentDisplayName, enrichParentLinkedRecord, enrichParentLinkedRecords } from '../utils/parentProfile.js';
import { normalizeParentMobileNumber, syncParentAccountDetails } from '../utils/parentContact.js';

const router = express.Router();

const getFacultyClassContext = async (facultyId) => {
  const faculty = await User.findById(facultyId).select('assignedGrade assignedSection');
  let assignedGrade = faculty?.assignedGrade;
  let assignedSection = faculty?.assignedSection;

  if ((!assignedGrade || !assignedSection) && facultyId) {
    const firstStudent = await Student.findOne({ facultyId }).select('grade section');
    assignedGrade = assignedGrade || firstStudent?.grade;
    assignedSection = assignedSection || firstStudent?.section;
  }

  if (!assignedGrade || !assignedSection) {
    return null;
  }

  return {
    assignedGrade: normalizeClassValue(assignedGrade),
    assignedSection: normalizeClassValue(assignedSection)
  };
};

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

// @route   PUT /api/faculty/student/:id
// @desc    Update a student profile from the faculty dashboard
// @access  Private (Faculty/Admin)
router.put('/student/:id', protect, facultyOrAdmin, async (req, res) => {
  const { name, grade, section, group } = req.body;

  try {
    const query = req.user.role === 'admin'
      ? { _id: req.params.id }
      : { _id: req.params.id, facultyId: req.user.id };

    const student = await Student.findOne(query);
    if (!student) return res.status(404).json({ message: 'Student not found' });

    const familyValidation = validateStudentFamilyDetails({
      motherName: student.motherName,
      fatherName: student.fatherName,
      guardianName: student.guardianName,
      ...req.body
    });
    if (!familyValidation.isValid) {
      return res.status(400).json({ message: familyValidation.message });
    }

    if (name !== undefined) student.name = name;
    if (grade !== undefined) student.grade = grade;
    if (section !== undefined) student.section = section;
    if (group !== undefined) student.group = group;
    if (req.body.parentMobileNumber !== undefined) {
      student.parentMobileNumber = normalizeParentMobileNumber(req.body.parentMobileNumber);
    }
    applyStudentFamilyDetails(student, familyValidation.familyDetails);

    await student.save();
    await syncParentAccountDetails(student, `Parent of ${student.name}`);

    res.json({ message: 'Student profile updated successfully', student });
  } catch (error) {
    console.error('[Faculty Edit Student Error]', error);
    res.status(500).json({ message: 'Error updating student profile' });
  }
});

// @route   GET /api/faculty/memories
// @desc    Get school memories for faculty download/view access
// @access  Private (Faculty/Admin)
router.get('/memories', protect, facultyOrAdmin, async (req, res) => {
  try {
    const memories = await Memory.find().sort({ createdAt: -1 });
    res.json(memories);
  } catch (error) {
    res.status(500).json({ message: 'Error fetching memories' });
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

  const { title, message, priority, toAllStudents, selectedStudentIds } = req.body;

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
    } else if (selectedStudentIds && selectedStudentIds.length > 0) {
      // Send to manually selected students
      recipients = await User.find({
        studentId: { $in: selectedStudentIds },
        role: 'parent'
      }).select('_id');
      
      recipients = recipients.map(r => r._id);
    } else {
      return res.status(400).json({ message: 'No recipients selected' });
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

// @route   GET /api/faculty/announcements/inbox
// @desc    Get all announcements targeted to this faculty (from admin) excluding dismissed
// @access  Private (Faculty only)
router.get('/announcements/inbox/all', protect, async (req, res) => {
  if (req.user.role !== 'faculty') {
    return res.status(403).json({ message: 'Only faculty can view their announcements' });
  }

  try {
    // Get global announcements + announcements where this faculty is in recipients, excluding dismissed
    const announcements = await Announcement.find({
      dismissedBy: { $ne: req.user.id },
      $or: [
        { type: 'GLOBAL', createdByRole: 'admin' },
        { 
          type: 'FACULTY',
          recipients: req.user.id,
          createdByRole: 'admin'
        }
      ]
    })
    .populate('createdBy', 'name email')
    .sort({ createdAt: -1 });
    
    res.json(announcements);
  } catch (error) {
    res.status(500).json({ message: 'Error fetching announcements' });
  }
});

// @route   POST /api/faculty/announcements/:id/dismiss
// @desc    Dismiss an announcement for this faculty
// @access  Private (Faculty only)
router.post('/announcements/:id/dismiss', protect, async (req, res) => {
  if (req.user.role !== 'faculty') {
    return res.status(403).json({ message: 'Only faculty can dismiss announcements' });
  }

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

// @route   POST /api/faculty/polls
// @desc    Create a class poll for the faculty's assigned class
// @access  Private (Faculty only)
router.post('/polls', protect, async (req, res) => {
  if (req.user.role !== 'faculty') {
    return res.status(403).json({ message: 'Only faculty can create polls' });
  }

  const { title, description, closesAt, questions } = req.body;

  try {
    const classContext = await getFacultyClassContext(req.user.id);
    if (!classContext) {
      return res.status(400).json({ message: 'Faculty class assignment is missing. Please contact admin.' });
    }

    const poll = await Poll.create({
      title: String(title ?? '').trim(),
      description: String(description ?? '').trim(),
      closesAt: closesAt ? new Date(closesAt) : null,
      targetType: 'CLASS',
      targetGrade: classContext.assignedGrade,
      targetSection: classContext.assignedSection,
      createdBy: req.user.id,
      createdByRole: 'faculty',
      status: 'ACTIVE',
      isPublished: true,
      questions: validateAndNormalizeQuestions(questions)
    });

    const [hydratedPoll] = await hydratePolls([poll]);
    res.status(201).json({ message: 'Poll created successfully.', poll: hydratedPoll });
  } catch (error) {
    res.status(500).json({ message: error.message || 'Error creating poll' });
  }
});

// @route   GET /api/faculty/polls
// @desc    Get faculty-created polls plus admin polls for the class
// @access  Private (Faculty only)
router.get('/polls', protect, async (req, res) => {
  if (req.user.role !== 'faculty') {
    return res.status(403).json({ message: 'Only faculty can view polls' });
  }

  try {
    const classContext = await getFacultyClassContext(req.user.id);
    const classFilter = classContext ? buildClassAudienceFilter({
      grade: classContext.assignedGrade,
      section: classContext.assignedSection
    }) : null;

    const query = classFilter ? {
      $or: [
        { createdBy: req.user.id },
        { createdByRole: 'admin', targetType: 'GLOBAL' },
        { createdByRole: 'admin', targetType: 'CLASS', ...classFilter }
      ]
    } : { createdBy: req.user.id };

    const polls = await Poll.find(query).sort({ createdAt: -1 });
    res.json(await hydratePolls(polls));
  } catch (error) {
    res.status(500).json({ message: 'Error fetching polls' });
  }
});

// @route   PUT /api/faculty/polls/:id
// @desc    Update or close a faculty poll
// @access  Private (Faculty only)
router.put('/polls/:id', protect, async (req, res) => {
  if (req.user.role !== 'faculty') {
    return res.status(403).json({ message: 'Only faculty can update polls' });
  }

  const { title, description, closesAt, status, questions } = req.body;

  try {
    const poll = await Poll.findOne({ _id: req.params.id, createdBy: req.user.id });
    if (!poll) return res.status(404).json({ message: 'Poll not found' });

    if (title !== undefined) poll.title = String(title).trim();
    if (description !== undefined) poll.description = String(description).trim();
    if (status !== undefined) poll.status = status;
    if (closesAt !== undefined) poll.closesAt = closesAt ? new Date(closesAt) : null;

    if (questions !== undefined) {
      const responseCount = await PollResponse.countDocuments({ pollId: poll._id });
      if (responseCount > 0) {
        return res.status(400).json({ message: 'Questions cannot be changed after votes have been submitted.' });
      }

      poll.questions = validateAndNormalizeQuestions(questions);
    }

    await poll.save();
    const [hydratedPoll] = await hydratePolls([poll]);

    res.json({ message: 'Poll updated successfully.', poll: hydratedPoll });
  } catch (error) {
    res.status(500).json({ message: error.message || 'Error updating poll' });
  }
});

// @route   DELETE /api/faculty/polls/:id
// @desc    Delete a faculty poll and its responses
// @access  Private (Faculty only)
router.delete('/polls/:id', protect, async (req, res) => {
  if (req.user.role !== 'faculty') {
    return res.status(403).json({ message: 'Only faculty can delete polls' });
  }

  try {
    const poll = await Poll.findOneAndDelete({ _id: req.params.id, createdBy: req.user.id });
    if (!poll) return res.status(404).json({ message: 'Poll not found' });

    await PollResponse.deleteMany({ pollId: req.params.id });
    res.json({ message: 'Poll deleted successfully.' });
  } catch (error) {
    res.status(500).json({ message: 'Error deleting poll' });
  }
});

// @route   GET /api/faculty/feedback
// @desc    Get feedback for the faculty's tracked class
// @access  Private (Faculty only)
router.get('/feedback', protect, async (req, res) => {
  if (req.user.role !== 'faculty') {
    return res.status(403).json({ message: 'Only faculty can view feedback' });
  }

  try {
    const feedback = await Feedback.find({ facultyId: req.user.id })
      .populate('parentId', 'name srvNumber studentId')
      .populate('studentId', 'name srvNumber motherName fatherName guardianName')
      .sort({ createdAt: -1 });

    res.json(enrichParentLinkedRecords(feedback));
  } catch (error) {
    res.status(500).json({ message: 'Error fetching feedback' });
  }
});

// @route   PUT /api/faculty/feedback/:id
// @desc    Update feedback review status
// @access  Private (Faculty only)
router.put('/feedback/:id', protect, async (req, res) => {
  if (req.user.role !== 'faculty') {
    return res.status(403).json({ message: 'Only faculty can update feedback' });
  }

  const { status, staffNote } = req.body;

  try {
    const feedback = await Feedback.findOne({ _id: req.params.id, facultyId: req.user.id });
    if (!feedback) return res.status(404).json({ message: 'Feedback not found' });

    if (status !== undefined) feedback.status = status;
    if (staffNote !== undefined) feedback.staffNote = String(staffNote).trim();
    feedback.updatedBy = req.user.id;

    await feedback.save();
    await feedback.populate('parentId', 'name srvNumber studentId');
    await feedback.populate('studentId', 'name srvNumber motherName fatherName guardianName');

    res.json({ message: 'Feedback updated successfully.', feedback: enrichParentLinkedRecord(feedback) });
  } catch (error) {
    res.status(500).json({ message: 'Error updating feedback' });
  }
});

// @route   POST /api/faculty/events
// @desc    Create an upcoming event for the faculty's class
// @access  Private (Faculty only)
router.post('/events', protect, async (req, res) => {
  if (req.user.role !== 'faculty') {
    return res.status(403).json({ message: 'Only faculty can create events' });
  }

  try {
    const classContext = await getFacultyClassContext(req.user.id);
    if (!classContext) {
      return res.status(400).json({ message: 'Faculty class assignment is missing. Please contact admin.' });
    }

    const normalizedEvent = normalizeEventPayload(req.body);
    const event = await Event.create({
      ...normalizedEvent,
      targetType: 'CLASS',
      targetGrade: classContext.assignedGrade,
      targetSection: classContext.assignedSection,
      createdBy: req.user.id,
      createdByRole: 'faculty',
      status: 'ACTIVE',
      isPublished: true
    });

    const [hydratedEvent] = await hydrateEvents([event]);
    res.status(201).json({ message: 'Event created successfully.', event: hydratedEvent });
  } catch (error) {
    res.status(500).json({ message: error.message || 'Error creating event' });
  }
});

// @route   GET /api/faculty/events
// @desc    Get faculty-created events plus admin events for the class
// @access  Private (Faculty only)
router.get('/events', protect, async (req, res) => {
  if (req.user.role !== 'faculty') {
    return res.status(403).json({ message: 'Only faculty can view events' });
  }

  try {
    await archivePastEvents();
    const classContext = await getFacultyClassContext(req.user.id);
    const classFilter = classContext ? buildClassAudienceFilter({
      grade: classContext.assignedGrade,
      section: classContext.assignedSection
    }) : null;

    const query = classFilter ? {
      $or: [
        { createdBy: req.user.id },
        { createdByRole: 'admin', targetType: 'GLOBAL' },
        { createdByRole: 'admin', targetType: 'CLASS', ...classFilter }
      ]
    } : { createdBy: req.user.id };

    const events = await Event.find(query).sort({ eventDate: 1, createdAt: -1 });
    res.json(await hydrateEvents(events));
  } catch (error) {
    res.status(500).json({ message: 'Error fetching events' });
  }
});

// @route   PUT /api/faculty/events/:id
// @desc    Update or close a faculty-created event
// @access  Private (Faculty only)
router.put('/events/:id', protect, async (req, res) => {
  if (req.user.role !== 'faculty') {
    return res.status(403).json({ message: 'Only faculty can update events' });
  }

  const { status } = req.body;

  try {
    const event = await Event.findOne({ _id: req.params.id, createdBy: req.user.id });
    if (!event) return res.status(404).json({ message: 'Event not found' });

    const normalizedPayload = normalizeEventPayload({
      title: req.body.title ?? event.title,
      description: req.body.description ?? event.description,
      venue: req.body.venue ?? event.venue,
      eventDate: req.body.eventDate ?? event.eventDate
    });

    Object.assign(event, normalizedPayload);
    if (status !== undefined) event.status = status;

    await event.save();
    const [hydratedEvent] = await hydrateEvents([event]);

    res.json({ message: 'Event updated successfully.', event: hydratedEvent });
  } catch (error) {
    res.status(500).json({ message: error.message || 'Error updating event' });
  }
});

// @route   DELETE /api/faculty/events/:id
// @desc    Delete a faculty-created event and its registrations
// @access  Private (Faculty only)
router.delete('/events/:id', protect, async (req, res) => {
  if (req.user.role !== 'faculty') {
    return res.status(403).json({ message: 'Only faculty can delete events' });
  }

  try {
    const event = await Event.findOneAndDelete({ _id: req.params.id, createdBy: req.user.id });
    if (!event) return res.status(404).json({ message: 'Event not found' });

    await EventRegistration.deleteMany({ eventId: req.params.id });
    res.json({ message: 'Event deleted successfully.' });
  } catch (error) {
    res.status(500).json({ message: 'Error deleting event' });
  }
});

export default router;
