import express from 'express';
import bcrypt from 'bcryptjs';
import User from '../models/User.js';
import Student from '../models/Student.js';
import FoodMenu from '../models/FoodMenu.js';
import Setting from '../models/Setting.js';
import Notification from '../models/Notification.js';
import Announcement from '../models/Announcement.js';
import PasswordReset from '../models/PasswordReset.js';
import { protect, adminOnly } from '../middleware/auth.js';

const router = express.Router();

// Generate a random 4 digit string
const generateRandomDigits = () => Math.floor(1000 + Math.random() * 9000).toString();

// @route   POST /api/admin/faculty
// @desc    Register a new faculty member
// @access  Private (Admin only)
router.post('/faculty', protect, adminOnly, async (req, res) => {
  const { name, assignedGrade, assignedSection, password, mobileNumber } = req.body;

  try {
    // Generate a unique sequential SRV number for faculty (e.g., FAC26001)
    const year = new Date().getFullYear().toString().slice(-2);
    const prefix = `FAC${year}`;
    const lastFaculty = await User.findOne({ 
      role: 'faculty', 
      srvNumber: { $regex: `^${prefix}` } 
    }).sort({ srvNumber: -1 });

    let sequence = '001';
    if (lastFaculty && lastFaculty.srvNumber) {
      const lastSequence = parseInt(lastFaculty.srvNumber.replace(prefix, ''), 10);
      if (!isNaN(lastSequence)) {
        sequence = (lastSequence + 1).toString().padStart(3, '0');
      }
    }
    const srvNumber = `${prefix}${sequence}`;
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password || 'faculty123', salt);

    const faculty = await User.create({
      name,
      srvNumber,
      password: hashedPassword,
      role: 'faculty',
      assignedGrade,
      assignedSection,
      mobileNumber
    });

    res.status(201).json({
      message: 'Faculty created successfully',
      faculty: {
        _id: faculty._id,
        name: faculty.name,
        srvNumber: faculty.srvNumber,
        assignedGrade: faculty.assignedGrade,
        assignedSection: faculty.assignedSection,
        mobileNumber: faculty.mobileNumber
      }
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error adding faculty' });
  }
});

// @route   POST /api/admin/student
// @desc    Register a new student and generate their parent account
// @access  Private (Admin only)
router.post('/student', protect, adminOnly, async (req, res) => {
  const { name, grade, section, group, dateOfBirth, contactNumber, address, admissionNumber } = req.body;

  try {
    let srvNumber;

    if (admissionNumber && admissionNumber.toString().trim() !== '') {
      // Admin provided a custom admission number — validate numeric only
      const numStr = admissionNumber.toString().trim();
      if (!/^\d+$/.test(numStr)) {
        return res.status(400).json({ message: 'Admission number must contain only digits (e.g., 1695)' });
      }
      srvNumber = `SRV${numStr}`;

      // Check uniqueness
      const existing = await Student.findOne({ srvNumber });
      if (existing) {
        return res.status(400).json({ message: `SRV number ${srvNumber} is already assigned to another student.` });
      }
    } else {
      // Auto-generate sequential SRV number (e.g., SRV26001)
      const year = new Date().getFullYear().toString().slice(-2);
      const prefix = `SRV${year}`;
      const lastStudent = await Student.findOne({ 
        srvNumber: { $regex: `^${prefix}` } 
      }).sort({ srvNumber: -1 });

      let sequence = '001';
      if (lastStudent && lastStudent.srvNumber) {
        const lastSequence = parseInt(lastStudent.srvNumber.replace(prefix, ''), 10);
        if (!isNaN(lastSequence)) {
          sequence = (lastSequence + 1).toString().padStart(3, '0');
        }
      }
      srvNumber = `${prefix}${sequence}`;
    }

    // 2. Create the Student record
    const student = await Student.create({
      name,
      srvNumber,
      grade,
      section,
      group,
      dateOfBirth,
      contactNumber,
      address,
      facultyId: null
    });

    // 3. Automatically create the Parent login account
    const salt = await bcrypt.genSalt(10);
    const defaultPassword = dateOfBirth ? dateOfBirth : 'parent123';
    const hashedPassword = await bcrypt.hash(defaultPassword, salt);

    const parentUser = await User.create({
      name: `Parent of ${name}`,
      srvNumber: student.srvNumber,
      password: hashedPassword,
      role: 'parent',
      studentId: student._id
    });

    res.status(201).json({
      message: 'Student and Parent account created successfully',
      student,
      parentLogin: {
        srvNumber: parentUser.srvNumber,
        defaultPassword
      }
    });

  } catch (error) {
    console.error(error);
    if (error.code === 11000) {
      return res.status(400).json({ message: 'This SRV number is already in use. Please choose a different admission number.' });
    }
    res.status(500).json({ message: 'Server error adding student' });
  }
});

// @route   GET /api/admin/stats
// @desc    Get dashboard aggregated stats
// @access  Private (Admin only)
router.get('/stats', protect, adminOnly, async (req, res) => {
  try {
    const totalStudents = await Student.countDocuments();
    const totalFaculty = await User.countDocuments({ role: 'faculty' });
    
    // Aggregations could go here
    res.json({
      totalStudents,
      totalFaculty
    });
  } catch (error) {
    res.status(500).json({ message: 'Server errors fetching stats' });
  }
});

// @route   GET /api/admin/food
// @desc    Get the entire weekly food menu
// @access  Private (Admin only)
router.get('/food', protect, adminOnly, async (req, res) => {
  try {
    const menu = await FoodMenu.find();
    res.json(menu);
  } catch (error) {
    res.status(500).json({ message: 'Error fetching food menu' });
  }
});

// @route   POST /api/admin/food
// @desc    Update food menu for a specific day
// @access  Private (Admin only)
router.post('/food', protect, adminOnly, async (req, res) => {
  const { day, breakfast, lunch, snacks } = req.body;
  try {
    let menu = await FoodMenu.findOne({ day });
    if (menu) {
      menu.breakfast = breakfast;
      menu.lunch = lunch;
      menu.snacks = snacks;
      await menu.save();
    } else {
      menu = await FoodMenu.create({ day, breakfast, lunch, snacks });
    }
    res.status(200).json({ message: 'Menu updated successfully', menu });
  } catch (error) {
    res.status(500).json({ message: 'Server error updating menu' });
  }
});

// @route   GET /api/admin/students
// @desc    Get all students sorted by numeric SRV portion
// @access  Private (Admin only)
router.get('/students', protect, adminOnly, async (req, res) => {
  try {
    const students = await Student.find().populate('facultyId', 'name srvNumber');
    // Sort by numeric portion of srvNumber ascending
    students.sort((a, b) => {
      const numA = parseInt((a.srvNumber || '').replace(/\D/g, ''), 10) || 0;
      const numB = parseInt((b.srvNumber || '').replace(/\D/g, ''), 10) || 0;
      return numA - numB;
    });
    res.json(students);
  } catch (error) {
    res.status(500).json({ message: 'Error fetching students' });
  }
});

// @route   GET /api/admin/faculty
// @desc    Get all faculty members
// @access  Private (Admin only)
router.get('/faculty', protect, adminOnly, async (req, res) => {
  try {
    const faculty = await User.find({ role: 'faculty' }).select('-password');
    res.json(faculty);
  } catch (error) {
    res.status(500).json({ message: 'Error fetching faculty' });
  }
});

// @route   PUT /api/admin/faculty/:id
// @desc    Update faculty assignment and/or password
// @access  Private (Admin only)
router.put('/faculty/:id', protect, adminOnly, async (req, res) => {
  const { assignedGrade, assignedSection, maxStudents, handledClasses, password } = req.body;
  try {
    const faculty = await User.findById(req.params.id);
    if (!faculty || faculty.role !== 'faculty') {
      return res.status(404).json({ message: 'Faculty not found' });
    }

    if (assignedGrade !== undefined) faculty.assignedGrade = assignedGrade;
    if (assignedSection !== undefined) faculty.assignedSection = assignedSection;
    if (maxStudents !== undefined) faculty.maxStudents = maxStudents;
    if (handledClasses !== undefined) faculty.handledClasses = handledClasses;

    if (password) {
      const salt = await bcrypt.genSalt(10);
      faculty.password = await bcrypt.hash(password, salt);
    }

    await faculty.save();

    res.json({ message: 'Faculty updated successfully', faculty });
  } catch (error) {
    res.status(500).json({ message: 'Error updating faculty' });
  }
});

// @route   POST /api/admin/faculty/:id/assign-students
// @desc    Manually assign students to a faculty (up to their maxStudents limit)
// @access  Private (Admin only)
router.post('/faculty/:id/assign-students', protect, adminOnly, async (req, res) => {
  const { studentIds } = req.body; // array of string IDs
  try {
    const faculty = await User.findById(req.params.id);
    if (!faculty || faculty.role !== 'faculty') {
      return res.status(404).json({ message: 'Faculty not found' });
    }

    // Replace their assignment completely
    // First, unassign anyone currently assigned to them
    await Student.updateMany({ facultyId: faculty._id }, { $set: { facultyId: null } });

    // Ensure we aren't assigning more than maxStudents
    const idsToAssign = Array.isArray(studentIds) ? studentIds.slice(0, faculty.maxStudents) : [];

    // Assign the new list
    if (idsToAssign.length > 0) {
      await Student.updateMany({ _id: { $in: idsToAssign } }, { $set: { facultyId: faculty._id } });
    }
    
    res.json({ message: `Successfully synced ${idsToAssign.length} students` });
  } catch (error) {
    res.status(500).json({ message: 'Error assigning students' });
  }
});

// @route   DELETE /api/admin/faculty/:id
// @desc    Delete a faculty member
// @access  Private (Admin only)
router.delete('/faculty/:id', protect, adminOnly, async (req, res) => {
  try {
    const faculty = await User.findById(req.params.id);
    if (!faculty || faculty.role !== 'faculty') {
      return res.status(404).json({ message: 'Faculty not found' });
    }

    await User.findByIdAndDelete(req.params.id);

    // Unassign their students safely
    await Student.updateMany({ facultyId: req.params.id }, { $set: { facultyId: null } });

    res.json({ message: 'Faculty deleted successfully' });
  } catch (error) {
    res.status(500).json({ message: 'Error deleting faculty' });
  }
});

// @route   PUT /api/admin/student/:id/fees
// @desc    Update a student's fee details
// @access  Private (Admin only)
router.put('/student/:id/fees', protect, adminOnly, async (req, res) => {
  const { term1, term1Amount, term1Paid, term2, term2Amount, term2Paid, term3, term3Amount, term3Paid, overall, additionalFees, additionalPaid } = req.body;
  try {
    const student = await Student.findById(req.params.id);
    if (!student) {
      return res.status(404).json({ message: 'Student not found' });
    }

    if (!student.fees) student.fees = {};
    if (term1) student.fees.term1 = term1;
    if (term1Amount !== undefined) student.fees.term1Amount = Number(term1Amount);
    if (term1Paid !== undefined) student.fees.term1Paid = Number(term1Paid);
    if (term2) student.fees.term2 = term2;
    if (term2Amount !== undefined) student.fees.term2Amount = Number(term2Amount);
    if (term2Paid !== undefined) student.fees.term2Paid = Number(term2Paid);
    if (term3) student.fees.term3 = term3;
    if (term3Amount !== undefined) student.fees.term3Amount = Number(term3Amount);
    if (term3Paid !== undefined) student.fees.term3Paid = Number(term3Paid);
    if (overall) student.fees.overall = overall;
    if (additionalFees !== undefined) student.fees.additionalFees = Number(additionalFees);
    if (additionalPaid !== undefined) student.fees.additionalPaid = Number(additionalPaid);

    await student.save();
    res.json({ message: 'Fees updated successfully', student });
  } catch (error) {
    res.status(500).json({ message: 'Error updating fees' });
  }
});

// @route   PUT /api/admin/student/:id
// @desc    Edit student details (name, grade, section, group)
// @access  Private (Admin only)
router.put('/student/:id', protect, adminOnly, async (req, res) => {
  const { name, grade, section, group } = req.body;
  try {
    const student = await Student.findById(req.params.id);
    if (!student) return res.status(404).json({ message: 'Student not found' });

    if (name !== undefined) student.name = name;
    if (grade !== undefined) student.grade = grade;
    if (section !== undefined) student.section = section;
    if (group !== undefined) student.group = group;

    await student.save();

    // Also update parent user name if student name changed
    if (name !== undefined) {
      await User.updateOne(
        { role: 'parent', studentId: student._id },
        { $set: { name: `Parent of ${name}` } }
      );
    }

    res.json({ message: 'Student updated successfully', student });
  } catch (error) {
    console.error('[Edit Student Error]', error);
    res.status(500).json({ message: 'Error updating student' });
  }
});

// @route   POST /api/admin/students/promote
// @desc    Bulk promote students from one grade to the next
// @access  Private (Admin only)
router.post('/students/promote', protect, adminOnly, async (req, res) => {
  const { fromGrade, toGrade } = req.body;
  try {
    if (!fromGrade || !toGrade) {
      return res.status(400).json({ message: 'Both fromGrade and toGrade are required.' });
    }

    const result = await Student.updateMany(
      { grade: fromGrade },
      { $set: { grade: toGrade } }
    );

    res.json({
      message: `Successfully promoted ${result.modifiedCount} student(s) from Grade ${fromGrade} to Grade ${toGrade}.`,
      promoted: result.modifiedCount
    });
  } catch (error) {
    console.error('[Promote Error]', error);
    res.status(500).json({ message: 'Error promoting students' });
  }
});

// @route   PUT /api/admin/student/:id/srv
// @desc    Edit a student's SRV number (admin enters numeric part only)
// @access  Private (Admin only)
router.put('/student/:id/srv', protect, adminOnly, async (req, res) => {
  const { admissionNumber } = req.body;
  try {
    const student = await Student.findById(req.params.id);
    if (!student) return res.status(404).json({ message: 'Student not found' });

    const numStr = (admissionNumber || '').toString().trim();
    if (!/^\d+$/.test(numStr)) {
      return res.status(400).json({ message: 'Admission number must contain only digits (e.g., 1695)' });
    }
    const newSrvNumber = `SRV${numStr}`;

    // Skip if it's the same
    if (newSrvNumber === student.srvNumber) {
      return res.json({ message: 'No change needed', student });
    }

    // Uniqueness check
    const existing = await Student.findOne({ srvNumber: newSrvNumber });
    if (existing) {
      return res.status(400).json({ message: `SRV number ${newSrvNumber} is already assigned to another student.` });
    }

    const oldSrvNumber = student.srvNumber;
    student.srvNumber = newSrvNumber;
    await student.save();

    // Also update the parent User account's srvNumber so login still works
    await User.updateOne({ srvNumber: oldSrvNumber, role: 'parent' }, { $set: { srvNumber: newSrvNumber } });

    res.json({ message: `SRV number updated to ${newSrvNumber}`, student });
  } catch (error) {
    console.error('[Edit SRV Error]', error);
    if (error.code === 11000) {
      return res.status(400).json({ message: 'This SRV number is already in use.' });
    }
    res.status(500).json({ message: 'Error updating SRV number' });
  }
});

// @route   DELETE /api/admin/student/:id
// @desc    Delete a student and their associated parent account
// @access  Private (Admin only)
router.delete('/student/:id', protect, adminOnly, async (req, res) => {
  try {
    const student = await Student.findByIdAndDelete(req.params.id);
    if (!student) {
      return res.status(404).json({ message: 'Student not found' });
    }

    // Cascade delete: remove the parent's login account associated with this student
    await User.findOneAndDelete({ role: 'parent', studentId: req.params.id });

    res.json({ message: 'Student and associated parent account deleted successfully' });
  } catch (error) {
    console.error('[Delete Student Route Error]', error);
    res.status(500).json({ message: 'Error deleting student' });
  }
});

// @route   GET /api/admin/settings/fee-toggle
// @desc    Get the online fee setting
// @access  Private (Admin only)
router.get('/settings/fee-toggle', protect, adminOnly, async (req, res) => {
  try {
    let setting = await Setting.findOne({ key: 'onlineFeePayment' });
    if (!setting) setting = await Setting.create({ key: 'onlineFeePayment', value: false });
    res.json({ isOnlineFeeEnabled: setting.value });
  } catch (error) {
    res.status(500).json({ message: 'Error fetching setting' });
  }
});

// @route   PUT /api/admin/settings/fee-toggle
// @desc    Toggle online fee setting
// @access  Private (Admin only)
router.put('/settings/fee-toggle', protect, adminOnly, async (req, res) => {
  const { isEnabled } = req.body;
  try {
    let setting = await Setting.findOne({ key: 'onlineFeePayment' });
    if (!setting) {
      setting = await Setting.create({ key: 'onlineFeePayment', value: isEnabled });
    } else {
      setting.value = isEnabled;
      await setting.save();
    }
    res.json({ message: 'Setting updated successfully', isOnlineFeeEnabled: setting.value });
  } catch (error) {
    res.status(500).json({ message: 'Error updating setting' });
  }
});

// @route   GET /api/admin/notifications
// @desc    Get system notifications (FEE_ALERTs)
// @access  Private (Admin only)
router.get('/notifications', protect, adminOnly, async (req, res) => {
  try {
    const notifications = await Notification.find({ type: 'FEE_ALERT' }).sort({ createdAt: -1 }).limit(20);
    res.json(notifications);
  } catch (error) {
    res.status(500).json({ message: 'Error fetching admin notifications' });
  }
});

// @route   GET /api/admin/password-requests
// @desc    Get all pending password reset requests
// @access  Private (Admin only)
router.get('/password-requests', protect, adminOnly, async (req, res) => {
  try {
    const requests = await PasswordReset.find({ status: 'Pending' }).sort({ createdAt: -1 });
    res.json(requests);
  } catch (error) {
    res.status(500).json({ message: 'Error fetching password requests' });
  }
});

// @route   POST /api/admin/password-requests/:id/approve
// @desc    Approve and process a password reset
// @access  Private (Admin only)
router.post('/password-requests/:id/approve', protect, adminOnly, async (req, res) => {
  const { newPassword } = req.body;
  try {
    if (!newPassword) return res.status(400).json({ message: 'New password is required.' });

    const request = await PasswordReset.findById(req.params.id);
    if (!request) return res.status(404).json({ message: 'Request not found.' });

    const user = await User.findOne({ srvNumber: request.srvNumber });
    if (!user) return res.status(404).json({ message: 'User account no longer exists.' });

    // Hash new password
    const salt = await bcrypt.genSalt(10);
    user.password = await bcrypt.hash(newPassword, salt);
    await user.save();

    // Update request
    request.status = 'Reset';
    request.newPassword = newPassword;
    await request.save();

    res.json({ message: 'Password successfully reset.', request });
  } catch (error) {
    res.status(500).json({ message: 'Error approving password request' });
  }
});

// @route   POST /api/admin/announcements
// @desc    Create a global announcement
// @access  Private (Admin only)
router.post('/announcements', protect, adminOnly, async (req, res) => {
  const { title, message, priority, targetGrade, targetSection } = req.body;

  try {
    if (!title || !message) {
      return res.status(400).json({ message: 'Title and message are required' });
    }

    const announcement = await Announcement.create({
      title,
      message,
      priority: priority || 'MEDIUM',
      type: targetGrade && targetSection ? 'CLASS' : 'GLOBAL',
      targetGrade,
      targetSection,
      createdBy: req.user.id,
      createdByRole: 'admin',
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

// @route   GET /api/admin/announcements
// @desc    Get all announcements created by admin
// @access  Private (Admin only)
router.get('/announcements', protect, adminOnly, async (req, res) => {
  try {
    const announcements = await Announcement.find({ createdBy: req.user.id }).sort({ createdAt: -1 });
    res.json(announcements);
  } catch (error) {
    res.status(500).json({ message: 'Error fetching announcements' });
  }
});

// @route   DELETE /api/admin/announcements/:id
// @desc    Delete an announcement
// @access  Private (Admin only)
router.delete('/announcements/:id', protect, adminOnly, async (req, res) => {
  try {
    const announcement = await Announcement.findByIdAndDelete(req.params.id);
    if (!announcement) return res.status(404).json({ message: 'Announcement not found' });
    res.json({ message: 'Announcement deleted' });
  } catch (error) {
    res.status(500).json({ message: 'Error deleting announcement' });
  }
});

export default router;
