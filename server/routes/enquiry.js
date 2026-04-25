import express from 'express';
import bcrypt from 'bcryptjs';
import Enquiry from '../models/Enquiry.js';
import Student from '../models/Student.js';
import User from '../models/User.js';
import { protect, adminOnly } from '../middleware/auth.js';
import { buildParentDisplayName } from '../utils/parentProfile.js';
import { normalizeParentMobileNumber, hasParentMobileNumber } from '../utils/parentContact.js';

const router = express.Router();

// ────────────────────────────────────────────────────
// Lead Scoring Engine (static thresholds, not LLM)
// ────────────────────────────────────────────────────
const calculateLeadScore = (enquiry) => {
  let score = 0;

  // Interest level based on status
  const interestMap = { Interested: 30, Contacted: 20, New: 15, 'Not Interested': 5, Converted: 0 };
  score += interestMap[enquiry.status] || 10;

  // Program demand bonus
  const demandBonus = { CDC: 10, SUITS: 10, 'SRV Skill Development': 8, General: 5 };
  score += demandBonus[enquiry.programInterest] || 5;

  // Responsiveness — how quickly did we follow up?
  if (enquiry.interactions && enquiry.interactions.length > 0) {
    const firstInteraction = enquiry.interactions[0];
    const hoursAfterCreation = (new Date(firstInteraction.createdAt) - new Date(enquiry.createdAt)) / (1000 * 60 * 60);
    if (hoursAfterCreation <= 24) score += 15;
    else if (hoursAfterCreation <= 48) score += 10;
    else score += 5;

    // More interactions = more engaged
    score += Math.min(enquiry.interactions.length * 3, 15);
  }

  // Referral bonus
  if (enquiry.referredBy) score += 10;

  // Complete data bonus (name + phone + grade all present)
  if (enquiry.studentName && enquiry.parentMobile && enquiry.grade) score += 10;

  // Cap at 100
  score = Math.min(100, score);

  // Temperature
  let temperature = 'Cold';
  if (score >= 65) temperature = 'Hot';
  else if (score >= 40) temperature = 'Warm';

  return { score, temperature };
};

// ────────────────────────────────────────────────────
// POST /api/enquiry — Create new enquiry
// ────────────────────────────────────────────────────
router.post('/', protect, adminOnly, async (req, res) => {
  const {
    studentName, parentName, parentMobile, email,
    grade, section, dateOfBirth, address,
    motherName, fatherName, guardianName,
    source, programInterest, remarks, referredBy, nextFollowUp
  } = req.body;

  if (!studentName || !studentName.trim()) {
    return res.status(400).json({ message: 'Student name is required.' });
  }

  try {
    const enquiryData = {
      studentName: studentName.trim(),
      parentName: parentName?.trim() || '',
      parentMobile: parentMobile?.trim() || '',
      email: email?.trim() || '',
      grade: grade?.trim() || '',
      section: section?.trim() || '',
      dateOfBirth: dateOfBirth || undefined,
      address: address?.trim() || '',
      motherName: motherName?.trim() || '',
      fatherName: fatherName?.trim() || '',
      guardianName: guardianName?.trim() || '',
      source: source || 'Walk-in',
      programInterest: programInterest || 'General',
      remarks: remarks?.trim() || '',
      referredBy: referredBy || null,
      nextFollowUp: nextFollowUp || undefined,
      createdBy: req.user.id,
      status: 'New'
    };

    // Calculate initial lead score
    const { score, temperature } = calculateLeadScore(enquiryData);
    enquiryData.leadScore = score;
    enquiryData.leadTemperature = temperature;

    const enquiry = await Enquiry.create(enquiryData);

    res.status(201).json({ message: 'Enquiry recorded successfully.', enquiry });
  } catch (error) {
    console.error('[Create Enquiry Error]', error);
    res.status(500).json({ message: 'Error creating enquiry.' });
  }
});

// ────────────────────────────────────────────────────
// GET /api/enquiry — List enquiries (with filters)
// ────────────────────────────────────────────────────
router.get('/', protect, adminOnly, async (req, res) => {
  try {
    const { status, source, programInterest, search } = req.query;
    const query = {};

    if (status) query.status = status;
    if (source) query.source = source;
    if (programInterest) query.programInterest = programInterest;
    if (search) {
      query.$or = [
        { studentName: { $regex: search, $options: 'i' } },
        { parentName: { $regex: search, $options: 'i' } },
        { parentMobile: { $regex: search, $options: 'i' } }
      ];
    }

    const enquiries = await Enquiry.find(query)
      .populate('referredBy', 'name srvNumber')
      .populate('createdBy', 'name')
      .populate('convertedStudentId', 'name srvNumber')
      .sort({ createdAt: -1 });

    res.json(enquiries);
  } catch (error) {
    console.error('[List Enquiries Error]', error);
    res.status(500).json({ message: 'Error fetching enquiries.' });
  }
});

// ────────────────────────────────────────────────────
// GET /api/enquiry/stats — Analytics data
// ────────────────────────────────────────────────────
router.get('/stats', protect, adminOnly, async (req, res) => {
  try {
    const total = await Enquiry.countDocuments();
    const converted = await Enquiry.countDocuments({ status: 'Converted' });
    const newCount = await Enquiry.countDocuments({ status: 'New' });
    const contacted = await Enquiry.countDocuments({ status: 'Contacted' });
    const interested = await Enquiry.countDocuments({ status: 'Interested' });
    const notInterested = await Enquiry.countDocuments({ status: 'Not Interested' });

    const conversionRate = total > 0 ? Math.round((converted / total) * 100) : 0;

    // Program-wise interest
    const programBreakdown = await Enquiry.aggregate([
      { $group: { _id: '$programInterest', count: { $sum: 1 } } }
    ]);

    // Source breakdown
    const sourceBreakdown = await Enquiry.aggregate([
      { $group: { _id: '$source', count: { $sum: 1 } } }
    ]);

    // Monthly trends (last 6 months)
    const sixMonthsAgo = new Date();
    sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6);
    const monthlyTrends = await Enquiry.aggregate([
      { $match: { createdAt: { $gte: sixMonthsAgo } } },
      {
        $group: {
          _id: { $dateToString: { format: '%Y-%m', date: '$createdAt' } },
          total: { $sum: 1 },
          converted: { $sum: { $cond: [{ $eq: ['$status', 'Converted'] }, 1, 0] } }
        }
      },
      { $sort: { _id: 1 } }
    ]);

    // Lead temperature breakdown
    const temperatureBreakdown = await Enquiry.aggregate([
      { $match: { status: { $nin: ['Converted', 'Not Interested'] } } },
      { $group: { _id: '$leadTemperature', count: { $sum: 1 } } }
    ]);

    res.json({
      total, converted, newCount, contacted, interested, notInterested,
      conversionRate,
      programBreakdown,
      sourceBreakdown,
      monthlyTrends,
      temperatureBreakdown
    });
  } catch (error) {
    console.error('[Enquiry Stats Error]', error);
    res.status(500).json({ message: 'Error fetching stats.' });
  }
});

// ────────────────────────────────────────────────────
// GET /api/enquiry/alerts — Stale enquiries for Admin Alerts
// ────────────────────────────────────────────────────
router.get('/alerts', protect, adminOnly, async (req, res) => {
  try {
    const now = new Date();
    const fortyEightHoursAgo = new Date(now - 48 * 60 * 60 * 1000);
    const sevenDaysAgo = new Date(now - 7 * 24 * 60 * 60 * 1000);

    // Stale: no follow-up in 48 hours and not closed
    const staleEnquiries = await Enquiry.find({
      status: { $in: ['New', 'Contacted'] },
      $or: [
        { lastFollowUp: { $lt: fortyEightHoursAgo } },
        { lastFollowUp: null, createdAt: { $lt: fortyEightHoursAgo } }
      ]
    }).select('studentName parentMobile grade status createdAt lastFollowUp leadScore leadTemperature').sort({ createdAt: 1 });

    // Hot leads with no contact yet
    const hotUncontacted = await Enquiry.find({
      status: 'New',
      leadScore: { $gte: 50 },
      'interactions.0': { $exists: false }
    }).select('studentName parentMobile grade leadScore leadTemperature createdAt').sort({ leadScore: -1 });

    // Aging: active enquiries older than 7 days
    const aging = await Enquiry.find({
      status: { $in: ['New', 'Contacted', 'Interested'] },
      createdAt: { $lt: sevenDaysAgo }
    }).select('studentName grade status createdAt leadScore').sort({ createdAt: 1 });

    res.json({
      staleEnquiries,
      hotUncontacted,
      aging,
      totalAlerts: staleEnquiries.length + hotUncontacted.length + aging.length
    });
  } catch (error) {
    console.error('[Enquiry Alerts Error]', error);
    res.status(500).json({ message: 'Error fetching alerts.' });
  }
});

// ────────────────────────────────────────────────────
// PUT /api/enquiry/:id — Update enquiry
// ────────────────────────────────────────────────────
router.put('/:id', protect, adminOnly, async (req, res) => {
  try {
    const enquiry = await Enquiry.findById(req.params.id);
    if (!enquiry) return res.status(404).json({ message: 'Enquiry not found.' });

    const updatable = [
      'studentName', 'parentName', 'parentMobile', 'email',
      'grade', 'section', 'dateOfBirth', 'address',
      'motherName', 'fatherName', 'guardianName',
      'source', 'programInterest', 'remarks', 'referredBy',
      'status', 'nextFollowUp'
    ];

    updatable.forEach(field => {
      if (req.body[field] !== undefined) {
        enquiry[field] = req.body[field];
      }
    });

    // Recalculate lead score
    const { score, temperature } = calculateLeadScore(enquiry);
    enquiry.leadScore = score;
    enquiry.leadTemperature = temperature;

    await enquiry.save();
    await enquiry.populate('referredBy', 'name srvNumber');

    res.json({ message: 'Enquiry updated.', enquiry });
  } catch (error) {
    console.error('[Update Enquiry Error]', error);
    res.status(500).json({ message: 'Error updating enquiry.' });
  }
});

// ────────────────────────────────────────────────────
// POST /api/enquiry/:id/interaction — Log interaction
// ────────────────────────────────────────────────────
router.post('/:id/interaction', protect, adminOnly, async (req, res) => {
  const { type, notes } = req.body;

  if (!type) return res.status(400).json({ message: 'Interaction type is required.' });

  try {
    const enquiry = await Enquiry.findById(req.params.id);
    if (!enquiry) return res.status(404).json({ message: 'Enquiry not found.' });

    enquiry.interactions.push({
      type,
      notes: notes?.trim() || '',
      by: req.user.id
    });

    enquiry.lastFollowUp = new Date();
    enquiry.followUpCount = (enquiry.followUpCount || 0) + 1;

    // Auto-advance from New → Contacted if first interaction
    if (enquiry.status === 'New') {
      enquiry.status = 'Contacted';
    }

    // Recalculate lead score
    const { score, temperature } = calculateLeadScore(enquiry);
    enquiry.leadScore = score;
    enquiry.leadTemperature = temperature;

    await enquiry.save();

    res.json({ message: 'Interaction logged.', enquiry });
  } catch (error) {
    console.error('[Log Interaction Error]', error);
    res.status(500).json({ message: 'Error logging interaction.' });
  }
});

// ────────────────────────────────────────────────────
// POST /api/enquiry/:id/convert — Convert to Admission
// Reuses the same logic as POST /api/admin/student
// ────────────────────────────────────────────────────
router.post('/:id/convert', protect, adminOnly, async (req, res) => {
  try {
    const enquiry = await Enquiry.findById(req.params.id);
    if (!enquiry) return res.status(404).json({ message: 'Enquiry not found.' });

    if (enquiry.status === 'Converted') {
      return res.status(400).json({ message: 'This enquiry has already been converted.' });
    }

    if (!enquiry.studentName || !enquiry.grade) {
      return res.status(400).json({ message: 'Student name and grade are required to convert.' });
    }

    // Build family details
    const motherName = enquiry.motherName || '';
    const fatherName = enquiry.fatherName || '';
    const guardianName = enquiry.guardianName || enquiry.parentName || '';
    const hasParents = Boolean(motherName && fatherName);
    const hasGuardian = Boolean(guardianName);

    if (!hasParents && !hasGuardian) {
      return res.status(400).json({ message: 'Family details required. Add mother+father names or a guardian name before converting.' });
    }

    const parentMobileNumber = normalizeParentMobileNumber(enquiry.parentMobile);

    // Generate SRV number (same logic as admin student route)
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
    const srvNumber = `${prefix}${sequence}`;

    // Create Student record
    const student = await Student.create({
      name: enquiry.studentName,
      srvNumber,
      grade: enquiry.grade,
      section: enquiry.section || 'A',
      motherName,
      fatherName,
      guardianName,
      parentMobileNumber,
      dateOfBirth: enquiry.dateOfBirth,
      address: enquiry.address,
      facultyId: null
    });

    // Create Parent login
    const salt = await bcrypt.genSalt(10);
    const defaultPassword = Math.random().toString(36).substring(2, 10) + Math.random().toString(36).substring(2, 6);
    const hashedPassword = await bcrypt.hash(defaultPassword, salt);

    const parentUser = await User.create({
      name: buildParentDisplayName(student, `Parent of ${enquiry.studentName}`),
      srvNumber: student.srvNumber,
      password: hashedPassword,
      role: 'parent',
      studentId: student._id,
      mobileNumber: parentMobileNumber
    });

    // Mark enquiry as converted
    enquiry.status = 'Converted';
    enquiry.convertedStudentId = student._id;
    enquiry.convertedAt = new Date();
    enquiry.leadScore = 0;
    enquiry.leadTemperature = 'Hot';
    await enquiry.save();

    res.json({
      message: 'Enquiry converted to admission successfully!',
      student,
      parentLogin: {
        srvNumber: parentUser.srvNumber,
        defaultPassword
      }
    });
  } catch (error) {
    console.error('[Convert Enquiry Error]', error);
    if (error.code === 11000) {
      return res.status(400).json({ message: 'SRV number conflict. Please retry.' });
    }
    res.status(500).json({ message: 'Error converting enquiry to admission.' });
  }
});

// ────────────────────────────────────────────────────
// DELETE /api/enquiry/:id — Delete enquiry
// ────────────────────────────────────────────────────
router.delete('/:id', protect, adminOnly, async (req, res) => {
  try {
    const enquiry = await Enquiry.findByIdAndDelete(req.params.id);
    if (!enquiry) return res.status(404).json({ message: 'Enquiry not found.' });
    res.json({ message: 'Enquiry deleted.' });
  } catch (error) {
    console.error('[Delete Enquiry Error]', error);
    res.status(500).json({ message: 'Error deleting enquiry.' });
  }
});

export default router;
