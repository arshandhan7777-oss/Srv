import express from 'express';
import bcrypt from 'bcryptjs';
import User from '../models/User.js';
import Student from '../models/Student.js';
import FoodMenu from '../models/FoodMenu.js';
import { protect, adminOnly } from '../middleware/auth.js';

const router = express.Router();

// Generate a random 4 digit string
const generateRandomDigits = () => Math.floor(1000 + Math.random() * 9000).toString();

// @route   POST /api/admin/faculty
// @desc    Register a new faculty member
// @access  Private (Admin only)
router.post('/faculty', protect, adminOnly, async (req, res) => {
  const { name, assignedGrade, assignedSection, password } = req.body;

  try {
    // Generate a unique SRV number for faculty (e.g., FAC2026)
    const srvNumber = `FAC${generateRandomDigits()}`;
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password || 'faculty123', salt);

    const faculty = await User.create({
      name,
      srvNumber,
      password: hashedPassword,
      role: 'faculty',
      assignedGrade,
      assignedSection
    });

    res.status(201).json({
      message: 'Faculty created successfully',
      faculty: {
        _id: faculty._id,
        name: faculty.name,
        srvNumber: faculty.srvNumber,
        assignedGrade: faculty.assignedGrade,
        assignedSection: faculty.assignedSection
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
  const { name, grade, section, dateOfBirth, contactNumber, address, facultyId } = req.body;

  try {
    // 1. Generate SRV Number for Student (e.g., SRV+Year+Random = SRV249012)
    const year = new Date().getFullYear().toString().slice(-2);
    const srvNumber = `SRV${year}${generateRandomDigits()}`;

    // Find the faculty assigned to this grade and section
    const faculty = await User.findOne({ role: 'faculty', assignedGrade: grade, assignedSection: section });
    const assignedFacultyId = facultyId || (faculty ? faculty._id : null);

    // 2. Create the Student record
    const student = await Student.create({
      name,
      srvNumber,
      grade,
      section,
      dateOfBirth,
      contactNumber,
      address,
      facultyId: assignedFacultyId
    });

    // 3. Automatically create the Parent login account using the SRV number
    const salt = await bcrypt.genSalt(10);
    // Default password is their DOB (DDMMYYYY) string from the form
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
  const { assignedGrade, assignedSection, password } = req.body;
  try {
    const faculty = await User.findById(req.params.id);
    if (!faculty || faculty.role !== 'faculty') {
      return res.status(404).json({ message: 'Faculty not found' });
    }

    if (assignedGrade) faculty.assignedGrade = assignedGrade;
    if (assignedSection) faculty.assignedSection = assignedSection;

    if (password) {
      const salt = await bcrypt.genSalt(10);
      faculty.password = await bcrypt.hash(password, salt);
    }

    await faculty.save();

    // Re-assign matching students to this faculty
    if (assignedGrade && assignedSection) {
      await Student.updateMany(
        { grade: assignedGrade, section: assignedSection },
        { facultyId: faculty._id }
      );
    }

    res.json({ message: 'Faculty updated successfully', faculty: { _id: faculty._id, name: faculty.name, assignedGrade: faculty.assignedGrade, assignedSection: faculty.assignedSection } });
  } catch (error) {
    res.status(500).json({ message: 'Error updating faculty' });
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

    await faculty.deleteOne();

    // Unassign their students
    await Student.updateMany({ facultyId: req.params.id }, { facultyId: null });

    res.json({ message: 'Faculty deleted successfully' });
  } catch (error) {
    res.status(500).json({ message: 'Error deleting faculty' });
  }
});

export default router;
