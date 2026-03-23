import express from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import User from '../models/User.js';
import PasswordReset from '../models/PasswordReset.js';
import loginLimiter from '../middleware/loginLimiter.js';

const router = express.Router();

// Generate JWT token — uses env secret, shorter expiry
const generateToken = (id, role, srvNumber) => {
  return jwt.sign({ id, role, srvNumber }, process.env.JWT_SECRET, {
    expiresIn: '7d',
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

      return res.json({
        _id: user._id,
        name: user.name,
        srvNumber: user.srvNumber,
        role: user.role,
        assignedGrade: user.assignedGrade,
        assignedSection: user.assignedSection,
        studentId: user.studentId,
        token: generateToken(user._id, user.role, user.srvNumber),
      });
    } else {
      // Log failed login attempt for monitoring
      console.warn(`[LOGIN FAIL] ${new Date().toISOString()} | IP: ${req.ip} | SRV: ${srvNumber}`);
      return res.status(401).json({ message: 'Invalid SRV Number or Password' });
    }
  } catch (error) {
    console.error(`[LOGIN ERROR] ${new Date().toISOString()} | ${error.message}`);
    return res.status(500).json({ message: 'Server error. Please try again later.' });
  }
});

// @route   POST /api/auth/admin-login
// @desc    Auth admin & get token
// @access  Public (Rate limited)
router.post('/admin-login', loginLimiter, async (req, res) => {
  const { srvNumber, password } = req.body;

  // Validate input
  const validationError = validateLoginInput(srvNumber, password);
  if (validationError) {
    return res.status(400).json({ message: validationError });
  }

  try {
    const user = await User.findOne({ srvNumber: srvNumber.trim() });

    if (user && (await bcrypt.compare(password, user.password))) {
      // Reject non-admin logins on the admin portal
      if (user.role !== 'admin') {
        return res.status(403).json({ message: 'Access restricted to administrators only.' });
      }

      return res.json({
        _id: user._id,
        name: user.name,
        srvNumber: user.srvNumber,
        role: user.role,
        token: generateToken(user._id, user.role, user.srvNumber),
      });
    } else {
      console.warn(`[ADMIN LOGIN FAIL] ${new Date().toISOString()} | IP: ${req.ip} | SRV: ${srvNumber}`);
      return res.status(401).json({ message: 'Invalid Admin SRV Number or Password' });
    }
  } catch (error) {
    console.error(`[ADMIN LOGIN ERROR] ${new Date().toISOString()} | ${error.message}`);
    return res.status(500).json({ message: 'Server error. Please try again later.' });
  }
});

// @route   POST /api/auth/setup-admin
// @desc    One-time setup for the first admin — DISABLED in production
// @access  Public (Only available in development)
router.post('/setup-admin', async (req, res) => {
  // Block this route in production
  if (process.env.NODE_ENV === 'production') {
    return res.status(404).json({ message: 'Not found' });
  }

  const { password } = req.body;
  
  try {
    const adminExists = await User.findOne({ role: 'admin' });
    if (adminExists) {
      return res.status(400).json({ message: 'Admin already exists' });
    }

    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password || 'qwertyuiop', salt);

    const admin = await User.create({
      name: 'System Admin',
      srvNumber: 'ADMIN',
      password: hashedPassword,
      role: 'admin'
    });

    return res.status(201).json({ message: 'Admin created successfully', srvNumber: admin.srvNumber });
  } catch (error) {
    console.error(`[SETUP-ADMIN ERROR] ${new Date().toISOString()} | ${error.message}`);
    return res.status(500).json({ message: 'Server error during admin setup.' });
  }
});

// @route   POST /api/auth/forgot-password
// @desc    Submit a request to reset a password
// @access  Public
router.post('/forgot-password', loginLimiter, async (req, res) => {
  const { srvNumber } = req.body;

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
