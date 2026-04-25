import express from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import User from '../models/User.js';
import PasswordReset from '../models/PasswordReset.js';
import loginLimiter from '../middleware/loginLimiter.js';
import Student from '../models/Student.js';
import { buildParentDisplayName } from '../utils/parentProfile.js';

const router = express.Router();
const normalizeRecoveryAnswer = (value) => String(value || '').trim().toLowerCase();

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
        token: generateToken(user._id, user.role, user.srvNumber),
      });
    } else {
      return res.status(401).json({ message: 'Invalid ID or password.' });
    }
  } catch (error) {
    console.error(`[LOGIN ERROR] ${new Date().toISOString()} | ${error.message}`);
    return res.status(500).json({ message: 'Server error during login.' });
  }
});

// @route   POST /api/auth/admin-login
// @desc    Auth admin & get token
// @access  Public (Rate limited)
router.post('/admin-login', loginLimiter, async (req, res) => {
  const { srvNumber, password } = req.body;

  const validationError = validateLoginInput(srvNumber, password);
  if (validationError) {
    return res.status(400).json({ message: validationError });
  }

  try {
    const normalizedSrvNumber = srvNumber.trim();
    const adminCandidates = normalizedSrvNumber === normalizedSrvNumber.toUpperCase()
      ? [normalizedSrvNumber]
      : [normalizedSrvNumber, normalizedSrvNumber.toUpperCase()];

    const user = await User.findOne({
      srvNumber: { $in: adminCandidates },
      role: 'admin'
    });

    if (!user || !(await bcrypt.compare(password, user.password))) {
      return res.status(401).json({ message: 'Invalid admin ID or password.' });
    }

    return res.json({
      _id: user._id,
      name: user.name,
      srvNumber: user.srvNumber,
      role: user.role,
      token: generateToken(user._id, user.role, user.srvNumber),
    });
  } catch (error) {
    console.error(`[ADMIN LOGIN ERROR] ${new Date().toISOString()} | ${error.message}`);
    return res.status(500).json({ message: 'Server error during admin login.' });
  }
});

// @route   GET /api/auth/recovery-question/:srvNumber
// @desc    Get recovery question for a login ID
// @access  Public
router.get('/recovery-question/:srvNumber', async (req, res) => {
  try {
    const srvNumber = String(req.params.srvNumber || '').trim();
    if (!srvNumber || srvNumber.length > 50) {
      return res.status(400).json({ message: 'Invalid ID.' });
    }

    const user = await User.findOne({ srvNumber }).select('srvNumber role recoveryQuestion');
    if (!user) {
      return res.status(404).json({ message: 'User not found.' });
    }

    if (!user.recoveryQuestion) {
      return res.status(404).json({ message: 'No recovery question is set for this account. Please contact admin.' });
    }

    return res.json({
      srvNumber: user.srvNumber,
      role: user.role,
      recoveryQuestion: user.recoveryQuestion
    });
  } catch (error) {
    console.error(`[RECOVERY-QUESTION ERROR] ${new Date().toISOString()} | ${error.message}`);
    return res.status(500).json({ message: 'Server error loading recovery question.' });
  }
});

// @route   POST /api/auth/reset-password-with-answer
// @desc    Reset password using a security answer
// @access  Public
router.post('/reset-password-with-answer', async (req, res) => {
  const { srvNumber, answer, newPassword } = req.body;

  if (!srvNumber || typeof srvNumber !== 'string' || srvNumber.trim().length === 0) {
    return res.status(400).json({ message: 'ID is required.' });
  }
  if (!answer || typeof answer !== 'string' || answer.trim().length === 0) {
    return res.status(400).json({ message: 'Recovery answer is required.' });
  }
  if (!newPassword || typeof newPassword !== 'string' || newPassword.trim().length < 4) {
    return res.status(400).json({ message: 'New password must be at least 4 characters.' });
  }

  try {
    const user = await User.findOne({ srvNumber: srvNumber.trim() });
    if (!user) {
      return res.status(404).json({ message: 'User not found.' });
    }

    if (!user.recoveryQuestion || !user.recoveryAnswerHash) {
      return res.status(400).json({ message: 'Recovery question is not configured for this account. Please contact admin.' });
    }

    const isAnswerValid = await bcrypt.compare(
      normalizeRecoveryAnswer(answer),
      user.recoveryAnswerHash
    );

    if (!isAnswerValid) {
      return res.status(401).json({ message: 'Recovery answer is incorrect.' });
    }

    const salt = await bcrypt.genSalt(10);
    user.password = await bcrypt.hash(newPassword, salt);
    await user.save();

    await PasswordReset.deleteMany({ srvNumber: user.srvNumber });

    return res.json({ message: 'Password reset successful. Please log in with your new password.' });
  } catch (error) {
    console.error(`[RESET-WITH-ANSWER ERROR] ${new Date().toISOString()} | ${error.message}`);
    return res.status(500).json({ message: 'Server error resetting password.' });
  }
});

export default router;
