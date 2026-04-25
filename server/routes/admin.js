import express from 'express';
import bcrypt from 'bcryptjs';
import User from '../models/User.js';
import Student from '../models/Student.js';
import FoodMenu from '../models/FoodMenu.js';
import Setting from '../models/Setting.js';
import Notification from '../models/Notification.js';
import Announcement from '../models/Announcement.js';
import PasswordReset from '../models/PasswordReset.js';
import Poll from '../models/Poll.js';
import PollResponse from '../models/PollResponse.js';
import Feedback from '../models/Feedback.js';
import Event from '../models/Event.js';
import EventRegistration from '../models/EventRegistration.js';
import Memory from '../models/Memory.js';
import Enquiry from '../models/Enquiry.js';
import { protect, adminOnly } from '../middleware/auth.js';
import { hydratePolls } from '../utils/pollService.js';
import { normalizeClassValue, validateAndNormalizeQuestions } from '../utils/pollUtils.js';
import { hydrateEvents } from '../utils/eventService.js';
import { normalizeEventPayload } from '../utils/eventUtils.js';
import { archivePastEvents } from '../utils/archiveEvents.js';
import { applyStudentFamilyDetails, validateStudentFamilyDetails } from '../utils/studentFamilyDetails.js';
import { buildParentDisplayName, enrichParentLinkedRecord, enrichParentLinkedRecords } from '../utils/parentProfile.js';
import { hasParentMobileNumber, normalizeParentMobileNumber, syncParentAccountDetails } from '../utils/parentContact.js';
import {
  buildCloudinaryUploadConfig,
  buildCloudinaryUploadSignature,
  destroyCloudinaryAsset,
  getCloudinaryGalleryFolder,
  fetchCloudinaryGalleryImages
} from '../utils/cloudinary.js';

const router = express.Router();
const MAX_MEMORY_IMAGE_BYTES = 5 * 1024 * 1024;
const normalizeRecoveryAnswer = (value) => String(value || '').trim().toLowerCase();

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
    const assignedPassword = password || (Math.random().toString(36).substring(2, 10) + Math.random().toString(36).substring(2, 6));
    const hashedPassword = await bcrypt.hash(assignedPassword, salt);

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
        mobileNumber: faculty.mobileNumber,
        initialPassword: assignedPassword // Return only once so admin can share
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
    const familyValidation = validateStudentFamilyDetails(req.body);
    if (!familyValidation.isValid) {
      return res.status(400).json({ message: familyValidation.message });
    }

    const parentMobileNumber = normalizeParentMobileNumber(req.body.parentMobileNumber);

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
      ...familyValidation.familyDetails,
      parentMobileNumber,
      dateOfBirth,
      contactNumber,
      address,
      facultyId: null
    });

    // 3. Automatically create the Parent login account
    const salt = await bcrypt.genSalt(10);
    const defaultPassword = Math.random().toString(36).substring(2, 10) + Math.random().toString(36).substring(2, 6);
    const hashedPassword = await bcrypt.hash(defaultPassword, salt);

    const parentUser = await User.create({
      name: buildParentDisplayName(student, `Parent of ${name}`),
      srvNumber: student.srvNumber,
      password: hashedPassword,
      role: 'parent',
      studentId: student._id,
      mobileNumber: parentMobileNumber
    });

    res.status(201).json({
      message: 'Student and Parent account created successfully',
      student,
      parentMobileMissing: !hasParentMobileNumber(parentMobileNumber),
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
    const totalEvents = await Event.countDocuments();
    const totalPolls = await Poll.countDocuments();
    const totalFeedback = await Feedback.countDocuments();
    const totalAnnouncements = await Announcement.countDocuments();
    const totalEnquiries = await Enquiry.countDocuments({ status: { $ne: 'Converted' } });
    
    res.json({
      totalStudents,
      totalFaculty,
      totalEvents,
      totalPolls,
      totalFeedback,
      totalAnnouncements,
      totalEnquiries
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
    const faculty = await User.find({ role: 'faculty' }).select('-password -recoveryAnswerHash');
    res.json(faculty);
  } catch (error) {
    res.status(500).json({ message: 'Error fetching faculty' });
  }
});

// @route   PUT /api/admin/faculty/:id
// @desc    Update faculty assignment and/or password
// @access  Private (Admin only)
router.put('/faculty/:id', protect, adminOnly, async (req, res) => {
  const { name, mobileNumber, assignedGrade, assignedSection, maxStudents, handledClasses, password, recoveryQuestion, recoveryAnswer } = req.body;
  try {
    const faculty = await User.findById(req.params.id);
    if (!faculty || faculty.role !== 'faculty') {
      return res.status(404).json({ message: 'Faculty not found' });
    }

    if (name !== undefined) faculty.name = String(name).trim();
    if (mobileNumber !== undefined) faculty.mobileNumber = String(mobileNumber).trim();
    if (assignedGrade !== undefined) faculty.assignedGrade = assignedGrade;
    if (assignedSection !== undefined) faculty.assignedSection = assignedSection;
    if (maxStudents !== undefined) faculty.maxStudents = maxStudents;
    if (handledClasses !== undefined) faculty.handledClasses = handledClasses;

    if (password) {
      const salt = await bcrypt.genSalt(10);
      faculty.password = await bcrypt.hash(password, salt);
    }

    if (recoveryQuestion !== undefined) {
      faculty.recoveryQuestion = String(recoveryQuestion || '').trim();
    }
    if (recoveryAnswer !== undefined) {
      const normalizedAnswer = normalizeRecoveryAnswer(recoveryAnswer);
      if (normalizedAnswer) {
        const salt = await bcrypt.genSalt(10);
        faculty.recoveryAnswerHash = await bcrypt.hash(normalizedAnswer, salt);
      } else if (!faculty.recoveryQuestion) {
        faculty.recoveryAnswerHash = '';
      }
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
// @desc    Edit student details
// @access  Private (Admin only)
router.put('/student/:id', protect, adminOnly, async (req, res) => {
  const { name, grade, section, group, parentRecoveryQuestion, parentRecoveryAnswer } = req.body;
  try {
    const student = await Student.findById(req.params.id);
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

    if (parentRecoveryQuestion !== undefined || parentRecoveryAnswer !== undefined) {
      const parentUser = await User.findOne({ role: 'parent', studentId: student._id });
      if (parentUser) {
        if (parentRecoveryQuestion !== undefined) {
          parentUser.recoveryQuestion = String(parentRecoveryQuestion || '').trim();
        }
        if (parentRecoveryAnswer !== undefined) {
          const normalizedAnswer = normalizeRecoveryAnswer(parentRecoveryAnswer);
          if (normalizedAnswer) {
            const salt = await bcrypt.genSalt(10);
            parentUser.recoveryAnswerHash = await bcrypt.hash(normalizedAnswer, salt);
          } else if (!parentUser.recoveryQuestion) {
            parentUser.recoveryAnswerHash = '';
          }
        }
        await parentUser.save();
      }
    }

    res.json({ message: 'Student updated successfully', student });
  } catch (error) {
    console.error('[Edit Student Error]', error);
    res.status(500).json({ message: 'Error updating student' });
  }
});

// @route   GET /api/admin/memories
// @desc    Get uploaded memories for admin management
// @access  Private (Admin only)
router.get('/memories', protect, adminOnly, async (req, res) => {
  try {
    const images = await fetchCloudinaryGalleryImages();
    // Map them to look like the Memory model so the frontend works
    const mappedMemories = images.map(img => ({
      _id: img.publicId.replace(/\//g, '___'), // Encode slashes safely for explicit frontend routing
      title: img.title,
      description: img.description,
      secureUrl: img.secureUrl,
      publicId: img.publicId,
      resourceType: img.resourceType || 'image',
      bytes: img.bytes,
      format: img.format,
      originalFilename: img.originalFilename,
      folder: img.folder,
      createdAt: img.createdAt
    }));
    res.json(mappedMemories);
  } catch (error) {
    res.status(500).json({ message: 'Error fetching memories' });
  }
});

// @route   GET /api/admin/memories/upload-config
// @desc    Get Cloudinary upload configuration for direct browser uploads
// @access  Private (Admin only)
router.get('/memories/upload-config', protect, adminOnly, async (req, res) => {
  try {
    res.json(buildCloudinaryUploadConfig({
      folder: getCloudinaryGalleryFolder()
    }));
  } catch (error) {
    res.status(500).json({ message: 'Error loading upload configuration' });
  }
});

// @route   POST /api/admin/memories/upload-signature
// @desc    Create signed Cloudinary upload params for browser uploads
// @access  Private (Admin only)
router.post('/memories/upload-signature', protect, adminOnly, async (req, res) => {
  try {
    res.json(buildCloudinaryUploadSignature({
      folder: req.body?.folder || getCloudinaryGalleryFolder()
    }));
  } catch (error) {
    res.status(400).json({ message: error.message || 'Unable to create upload signature.' });
  }
});

// @route   POST /api/admin/memories
// @desc    Save uploaded memory metadata
// @access  Private (Admin only)
router.post('/memories', protect, adminOnly, async (req, res) => {
  const {
    title,
    description,
    secureUrl,
    publicId,
    resourceType,
    bytes,
    format,
    originalFilename,
    folder
  } = req.body;

  try {
    const normalizedResourceType = String(resourceType || '').trim().toLowerCase();
    const normalizedTitle = String(title || originalFilename || 'School Memory').trim();

    if (!normalizedTitle) {
      return res.status(400).json({ message: 'Memory title is required.' });
    }

    if (!secureUrl) {
      return res.status(400).json({ message: 'Uploaded media URL is required.' });
    }

    if (!['image', 'video'].includes(normalizedResourceType)) {
      return res.status(400).json({ message: 'Only images and videos are supported.' });
    }

    const fileBytes = Number(bytes) || 0;
    if (normalizedResourceType === 'image' && fileBytes > MAX_MEMORY_IMAGE_BYTES) {
      return res.status(400).json({ message: 'Photo uploads must be under 5 MB.' });
    }

    const memory = await Memory.create({
      title: normalizedTitle,
      description: String(description || '').trim(),
      secureUrl: String(secureUrl).trim(),
      publicId: String(publicId || '').trim(),
      resourceType: normalizedResourceType,
      bytes: fileBytes,
      format: String(format || '').trim(),
      originalFilename: String(originalFilename || '').trim(),
      folder: String(folder || '').trim(),
      uploadedBy: req.user.id,
      createdByRole: 'admin'
    });

    res.status(201).json({ message: 'Memory saved successfully.', memory });
  } catch (error) {
    res.status(500).json({ message: 'Error saving memory.' });
  }
});

// @route   DELETE /api/admin/memories/:id
// @desc    Delete a memory from the portal and Cloudinary when fully configured
// @access  Private (Admin only)
router.delete('/memories/:id', protect, adminOnly, async (req, res) => {
  try {
    const rawId = req.params.id;
    
    // Support either local DB _id or encoded publicId from Cloudinary
    let publicId, memory;
    if (rawId.includes('___')) {
      publicId = rawId.replace(/___/g, '/');
      memory = await Memory.findOne({ publicId });
    } else {
      memory = await Memory.findById(rawId);
      publicId = memory?.publicId;
    }

    if (!publicId && !memory) {
      return res.status(404).json({ message: 'Memory not found.' });
    }

    let remoteDeleted = false;
    if (publicId) {
      try {
        const remoteResult = await destroyCloudinaryAsset({
          publicId: publicId,
          // Since we might not know resourceType if it's completely missing from DB, we try image by default.
          // In a perfect system we'd know or try both.
          resourceType: memory ? memory.resourceType : 'image' 
        });
        remoteDeleted = Boolean(remoteResult?.ok);
      } catch (cloudinaryError) {
        console.warn('[Memory Delete] Cloudinary cleanup skipped:', cloudinaryError.message);
      }
    }

    if (memory) {
      await Memory.findByIdAndDelete(memory._id);
    } else {
      // Just in case there is a rogue document by exact publicID
      await Memory.findOneAndDelete({ publicId });
    }

    res.json({
      message: 'Memory deleted successfully.',
      remoteDeleted
    });
  } catch (error) {
    res.status(500).json({ message: 'Error deleting memory.' });
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

    if (newSrvNumber === student.srvNumber) {
      return res.status(400).json({ message: 'This SRV number is already assigned. Please enter a unique ID.' });
    }

    const existing = await Student.findOne({ srvNumber: newSrvNumber });
    if (existing) {
      return res.status(400).json({ message: `SRV number ${newSrvNumber} is already assigned. Please enter a unique ID.` });
    }

    const oldSrvNumber = student.srvNumber;
    student.srvNumber = newSrvNumber;
    await student.save();

    // Also update the parent User account's srvNumber so login still works
    await User.updateOne({ srvNumber: oldSrvNumber, role: 'parent' }, { $set: { srvNumber: newSrvNumber } });

    res.json({ message: `SRV number updated to ${newSrvNumber}. Parent login ID changed, password unchanged.`, student });
  } catch (error) {
    console.error('[Edit SRV Error]', error);
    if (error.code === 11000) {
      return res.status(400).json({ message: 'This SRV number is already in use. Please enter a unique ID.' });
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
// @desc    Create a global, class, or faculty announcement
// @access  Private (Admin only)
router.post('/announcements', protect, adminOnly, async (req, res) => {
  const { title, message, priority, targetType, targetGrade, targetSection, recipients, selectedFacultyIds } = req.body;

  try {
    if (!title || !message) {
      return res.status(400).json({ message: 'Title and message are required' });
    }

    const normalizedTargetType = String(targetType || '').trim().toUpperCase();
    const facultyRecipients = Array.isArray(recipients) && recipients.length > 0
      ? recipients
      : selectedFacultyIds;

    // Determine announcement type
    let type = 'GLOBAL';
    let announcementData = {
      title,
      message,
      priority: priority || 'MEDIUM',
      createdBy: req.user.id,
      createdByRole: 'admin',
      isPublished: true
    };

    if (normalizedTargetType === 'CLASS') {
      if (!targetGrade || !targetSection) {
        return res.status(400).json({ message: 'Target grade and section are required for CLASS announcements' });
      }
      type = 'CLASS';
      announcementData.targetGrade = targetGrade;
      announcementData.targetSection = targetSection;
    } else if (normalizedTargetType === 'FACULTY') {
      if (!facultyRecipients || facultyRecipients.length === 0) {
        return res.status(400).json({ message: 'Recipients are required for FACULTY announcements' });
      }
      type = 'FACULTY';
      announcementData.recipients = facultyRecipients;
    } else {
      type = 'GLOBAL';
    }

    announcementData.type = type;

    const announcement = await Announcement.create(announcementData);

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

// @route   PUT /api/admin/faculty/:id/srv
// @desc    Edit a faculty FAC number (admin enters numeric part only)
// @access  Private (Admin only)
router.put('/faculty/:id/srv', protect, adminOnly, async (req, res) => {
  const { facultyNumber } = req.body;
  try {
    const faculty = await User.findById(req.params.id);
    if (!faculty || faculty.role !== 'faculty') {
      return res.status(404).json({ message: 'Faculty not found' });
    }

    const numStr = (facultyNumber || '').toString().trim();
    if (!/^\d+$/.test(numStr)) {
      return res.status(400).json({ message: 'Faculty number must contain only digits (e.g., 26001)' });
    }

    const newFacultyNumber = `FAC${numStr}`;

    if (newFacultyNumber === faculty.srvNumber) {
      return res.status(400).json({ message: 'This FAC number is already assigned. Please enter a unique ID.' });
    }

    const existing = await User.findOne({ srvNumber: newFacultyNumber });
    if (existing) {
      return res.status(400).json({ message: `FAC number ${newFacultyNumber} is already assigned. Please enter a unique ID.` });
    }

    faculty.srvNumber = newFacultyNumber;
    await faculty.save();

    res.json({ message: `FAC number updated to ${newFacultyNumber}. Faculty login ID changed, password unchanged.`, faculty });
  } catch (error) {
    console.error('[Edit FAC Error]', error);
    if (error.code === 11000) {
      return res.status(400).json({ message: 'This FAC number is already in use. Please enter a unique ID.' });
    }
    res.status(500).json({ message: 'Error updating FAC number' });
  }
});

// @route   POST /api/admin/polls
// @desc    Create a new opinion poll
// @access  Private (Admin only)
router.post('/polls', protect, adminOnly, async (req, res) => {
  const { title, description, targetType, targetGrade, targetSection, closesAt, questions } = req.body;

  try {
    if (!title || !String(title).trim()) {
      return res.status(400).json({ message: 'Poll title is required.' });
    }

    const normalizedQuestions = validateAndNormalizeQuestions(questions);
    const normalizedTargetType = targetType === 'GLOBAL' ? 'GLOBAL' : 'CLASS';

    const pollData = {
      title: String(title).trim(),
      description: String(description ?? '').trim(),
      targetType: normalizedTargetType,
      createdBy: req.user.id,
      createdByRole: 'admin',
      status: 'ACTIVE',
      isPublished: true,
      questions: normalizedQuestions
    };

    if (closesAt) {
      pollData.closesAt = new Date(closesAt);
    }

    if (normalizedTargetType === 'CLASS') {
      if (!targetGrade || !targetSection) {
        return res.status(400).json({ message: 'Grade and section are required for class polls.' });
      }

      pollData.targetGrade = normalizeClassValue(targetGrade);
      pollData.targetSection = normalizeClassValue(targetSection);
    }

    const poll = await Poll.create(pollData);
    const [hydratedPoll] = await hydratePolls([poll]);

    res.status(201).json({ message: 'Poll created successfully.', poll: hydratedPoll });
  } catch (error) {
    res.status(500).json({ message: error.message || 'Error creating poll' });
  }
});

// @route   GET /api/admin/polls
// @desc    Get all opinion polls with analytics
// @access  Private (Admin only)
router.get('/polls', protect, adminOnly, async (req, res) => {
  try {
    const polls = await Poll.find().sort({ createdAt: -1 });
    res.json(await hydratePolls(polls));
  } catch (error) {
    res.status(500).json({ message: 'Error fetching polls' });
  }
});

// @route   PUT /api/admin/polls/:id
// @desc    Update poll metadata or close a poll
// @access  Private (Admin only)
router.put('/polls/:id', protect, adminOnly, async (req, res) => {
  const { title, description, targetType, targetGrade, targetSection, closesAt, status, questions } = req.body;

  try {
    const poll = await Poll.findById(req.params.id);
    if (!poll) return res.status(404).json({ message: 'Poll not found' });

    if (title !== undefined) poll.title = String(title).trim();
    if (description !== undefined) poll.description = String(description).trim();
    if (status !== undefined) poll.status = status;
    if (closesAt !== undefined) poll.closesAt = closesAt ? new Date(closesAt) : null;

    const nextTargetType = targetType || poll.targetType;
    if (nextTargetType === 'GLOBAL') {
      poll.targetType = 'GLOBAL';
      poll.targetGrade = undefined;
      poll.targetSection = undefined;
    } else {
      const resolvedGrade = normalizeClassValue(targetGrade ?? poll.targetGrade);
      const resolvedSection = normalizeClassValue(targetSection ?? poll.targetSection);

      if (!resolvedGrade || !resolvedSection) {
        return res.status(400).json({ message: 'Grade and section are required for class polls.' });
      }

      poll.targetType = 'CLASS';
      poll.targetGrade = resolvedGrade;
      poll.targetSection = resolvedSection;
    }

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

// @route   DELETE /api/admin/polls/:id
// @desc    Delete a poll and its responses
// @access  Private (Admin only)
router.delete('/polls/:id', protect, adminOnly, async (req, res) => {
  try {
    const poll = await Poll.findByIdAndDelete(req.params.id);
    if (!poll) return res.status(404).json({ message: 'Poll not found' });

    await PollResponse.deleteMany({ pollId: req.params.id });
    res.json({ message: 'Poll deleted successfully.' });
  } catch (error) {
    res.status(500).json({ message: 'Error deleting poll' });
  }
});

// @route   GET /api/admin/feedback
// @desc    Get all parent feedback
// @access  Private (Admin only)
router.get('/feedback', protect, adminOnly, async (req, res) => {
  try {
    const feedback = await Feedback.find()
      .populate('parentId', 'name srvNumber studentId')
      .populate('studentId', 'name srvNumber motherName fatherName guardianName')
      .populate('facultyId', 'name')
      .sort({ createdAt: -1 });

    res.json(enrichParentLinkedRecords(feedback));
  } catch (error) {
    res.status(500).json({ message: 'Error fetching feedback' });
  }
});

// @route   PUT /api/admin/feedback/:id
// @desc    Update feedback review status
// @access  Private (Admin only)
router.put('/feedback/:id', protect, adminOnly, async (req, res) => {
  const { status, staffNote } = req.body;

  try {
    const feedback = await Feedback.findById(req.params.id);
    if (!feedback) return res.status(404).json({ message: 'Feedback not found' });

    if (status !== undefined) feedback.status = status;
    if (staffNote !== undefined) feedback.staffNote = String(staffNote).trim();
    feedback.updatedBy = req.user.id;

    await feedback.save();
    await feedback.populate('parentId', 'name srvNumber studentId');
    await feedback.populate('studentId', 'name srvNumber motherName fatherName guardianName');
    await feedback.populate('facultyId', 'name');

    res.json({ message: 'Feedback updated successfully.', feedback: enrichParentLinkedRecord(feedback) });
  } catch (error) {
    res.status(500).json({ message: 'Error updating feedback' });
  }
});

// @route   POST /api/admin/events
// @desc    Create an upcoming event
// @access  Private (Admin only)
router.post('/events', protect, adminOnly, async (req, res) => {
  const { targetType, targetGrade, targetSection } = req.body;

  try {
    const normalizedEvent = normalizeEventPayload(req.body);
    const normalizedTargetType = String(targetType || '').trim().toUpperCase() === 'GLOBAL' ? 'GLOBAL' : 'CLASS';

    const eventData = {
      ...normalizedEvent,
      targetType: normalizedTargetType,
      createdBy: req.user.id,
      createdByRole: 'admin',
      status: 'ACTIVE',
      isPublished: true
    };

    if (normalizedTargetType === 'CLASS') {
      if (!targetGrade || !targetSection) {
        return res.status(400).json({ message: 'Grade and section are required for class events.' });
      }
      eventData.targetGrade = normalizeClassValue(targetGrade);
      eventData.targetSection = normalizeClassValue(targetSection);
    }

    const event = await Event.create(eventData);
    const [hydratedEvent] = await hydrateEvents([event]);

    res.status(201).json({ message: 'Event created successfully.', event: hydratedEvent });
  } catch (error) {
    res.status(500).json({ message: error.message || 'Error creating event' });
  }
});

// @route   GET /api/admin/events
// @desc    Get all upcoming events with registrations
// @access  Private (Admin only)
router.get('/events', protect, adminOnly, async (req, res) => {
  try {
    await archivePastEvents();
    const events = await Event.find().sort({ eventDate: 1, createdAt: -1 });
    res.json(await hydrateEvents(events));
  } catch (error) {
    res.status(500).json({ message: 'Error fetching events' });
  }
});

// @route   PUT /api/admin/events/:id
// @desc    Update or close an upcoming event
// @access  Private (Admin only)
router.put('/events/:id', protect, adminOnly, async (req, res) => {
  const { status, targetType, targetGrade, targetSection } = req.body;

  try {
    const event = await Event.findById(req.params.id);
    if (!event) return res.status(404).json({ message: 'Event not found' });

    const normalizedPayload = normalizeEventPayload({
      title: req.body.title ?? event.title,
      description: req.body.description ?? event.description,
      venue: req.body.venue ?? event.venue,
      eventDate: req.body.eventDate ?? event.eventDate
    });

    Object.assign(event, normalizedPayload);
    if (status !== undefined) event.status = status;

    const normalizedTargetType = targetType ? String(targetType).trim().toUpperCase() : event.targetType;
    if (normalizedTargetType === 'GLOBAL') {
      event.targetType = 'GLOBAL';
      event.targetGrade = undefined;
      event.targetSection = undefined;
    } else {
      const grade = normalizeClassValue(targetGrade ?? event.targetGrade);
      const section = normalizeClassValue(targetSection ?? event.targetSection);
      if (!grade || !section) {
        return res.status(400).json({ message: 'Grade and section are required for class events.' });
      }
      event.targetType = 'CLASS';
      event.targetGrade = grade;
      event.targetSection = section;
    }

    await event.save();
    const [hydratedEvent] = await hydrateEvents([event]);

    res.json({ message: 'Event updated successfully.', event: hydratedEvent });
  } catch (error) {
    res.status(500).json({ message: error.message || 'Error updating event' });
  }
});

// @route   DELETE /api/admin/events/:id
// @desc    Delete an event and its registrations
// @access  Private (Admin only)
router.delete('/events/:id', protect, adminOnly, async (req, res) => {
  try {
    const event = await Event.findByIdAndDelete(req.params.id);
    if (!event) return res.status(404).json({ message: 'Event not found' });

    await EventRegistration.deleteMany({ eventId: req.params.id });
    res.json({ message: 'Event deleted successfully.' });
  } catch (error) {
    res.status(500).json({ message: 'Error deleting event' });
  }
});

export default router;
