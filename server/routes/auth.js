import express from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import User from '../models/User.js';
import PasswordReset from '../models/PasswordReset.js';
import loginLimiter from '../middleware/loginLimiter.js';
import Student from '../models/Student.js';
import { buildParentDisplayName } from '../utils/parentProfile.js';

const router = express.Router();

// Generate JWT token — uses env secret, shorter expiry
const generateToken = (id, role, srvNumber) => {
  return jwt.sign({ id, role, srvNumber }, process.env.JWT_SECRET, {
    expiresIn: '4h',
  });
};

// Input validation helper
const validateLoginInput = (srvNumber, password) => {
  if (!srvNumber || typeof srvNumber !== 'string' || srvNumber.trim().length === 0) {
    return 'SRV Number is required.';
  }
  if (srvNumber.length > 50) {
    return 'SRV Number is too long.';
  }
  if (!password || typeof password !== 'string' || password.trim().length === 0) {
    return 'Password is required.';
  }
  if (password.length > 128) {
    return 'Password is too long.';
  }
  return null;
};

// @route   POST /api/auth/login
// @desc    Auth user & get token (Faculty, Parent)
// @access  Public (Rate limited)
router.post('/login', loginLimiter, async (req, res) => {
  const { srvNumber, password } = req.body;

  // Validate input
  const validationError = validateLoginInput(srvNumber, password);
  if (validationError) {
    return res.status(400).json({ message: validationError });
  }

  try {
    const user = await User.findOne({ srvNumber: srvNumber.trim() });

    if (user && (await bcrypt.compare(password, user.password))) {
      // Reject admin logins on the public portal
      if (user.role === 'admin') {
        return res.status(403).json({ message: 'Admins must use the dedicated Admin Portal to log in.' });
      }

      let displayName = user.name;
      if (user.role === 'parent' && user.studentId) {
        const student = await Student.findById(user.studentId).select('name motherName fatherName guardianName');
        displayName = buildParentDisplayName(student, user.name);

        if (displayName !== user.name) {
          user.name = displayName;
          await user.save();
        }
      }

      return res.json({
        _id: user._id,
        name: displayName,
        srvNumber: user.srvNumber,
        role: user.role,

  if (!srvNumber || typeof srvNumber !== 'string' || srvNumber.trim().length === 0) {
    return res.status(400).json({ message: 'SRV Number is required.' });
  }

  try {
    const user = await User.findOne({ srvNumber: srvNumber.trim() });
    if (!user) return res.status(404).json({ message: 'User not found.' });

    const existingRequest = await PasswordReset.findOne({ srvNumber: srvNumber.trim(), status: 'Pending' });
    if (existingRequest) {
      return res.status(400).json({ message: 'A reset request is already pending for this ID.' });
    }

    await PasswordReset.create({
      srvNumber: user.srvNumber,
      role: user.role
    });

    return res.json({ message: 'Password reset request sent to Admin.' });
  } catch (error) {
    console.error(`[FORGOT-PWD ERROR] ${new Date().toISOString()} | ${error.message}`);
    return res.status(500).json({ message: 'Server error processing reset request.' });
  }
});

// @route   GET /api/auth/reset-status/:srvNumber
// @desc    Check status and get new password when approved
// @access  Public
router.get('/reset-status/:srvNumber', async (req, res) => {
  try {
    const srvNumber = req.params.srvNumber;
    
    if (!srvNumber || srvNumber.length > 50) {
      return res.status(400).json({ message: 'Invalid SRV Number.' });
    }

    const requests = await PasswordReset.find({ srvNumber }).sort({ createdAt: -1 });

    if (!requests || requests.length === 0) {
      return res.status(404).json({ message: 'No reset requests found for this ID.' });
    }

    const latest = requests[0];
    if (latest.status === 'Reset') {
      const p = latest.newPassword;
      await PasswordReset.deleteMany({ srvNumber });
      return res.json({ status: 'Reset', newPassword: p });
    } else {
      return res.json({ status: 'Pending' });
    }
  } catch (error) {
    console.error(`[RESET-STATUS ERROR] ${new Date().toISOString()} | ${error.message}`);
    return res.status(500).json({ message: 'Server error checking status.' });
  }
});

export default router;
