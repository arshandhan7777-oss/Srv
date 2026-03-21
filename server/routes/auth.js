import express from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import User from '../models/User.js';

const router = express.Router();

// Generate JWT token
const generateToken = (id, role, srvNumber) => {
  return jwt.sign({ id, role, srvNumber }, process.env.JWT_SECRET, {
    expiresIn: '30d',
  });
};

// @route   POST /api/auth/login
// @desc    Auth user & get token (Faculty, Parent)
// @access  Public
router.post('/login', async (req, res) => {
  const { srvNumber, password } = req.body;

  try {
    const user = await User.findOne({ srvNumber });

    if (user && (await bcrypt.compare(password, user.password))) {
      // Reject admin logins on the public portal
      if (user.role === 'admin') {
        return res.status(403).json({ message: 'Admins must use the dedicated Admin Portal to log in.' });
      }

      res.json({
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
      res.status(401).json({ message: 'Invalid SRV Number or Password' });
    }
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Database Error', details: error.message, stack: error.stack });
  }
});

// @route   POST /api/auth/admin-login
// @desc    Auth admin & get token
// @access  Public
router.post('/admin-login', async (req, res) => {
  const { srvNumber, password } = req.body;

  try {
    const user = await User.findOne({ srvNumber });

    if (user && (await bcrypt.compare(password, user.password))) {
      // Reject non-admin logins on the admin portal
      if (user.role !== 'admin') {
        return res.status(403).json({ message: 'Access restricted to administrators only.' });
      }

      res.json({
        _id: user._id,
        name: user.name,
        srvNumber: user.srvNumber,
        role: user.role,
        token: generateToken(user._id, user.role, user.srvNumber),
      });
    } else {
      res.status(401).json({ message: 'Invalid Admin SRV Number or Password' });
    }
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Database Error', details: error.message, stack: error.stack });
  }
});

// @route   POST /api/auth/setup-admin
// @desc    One-time setup for the first admin (Hidden route usually disabled in production)
// @access  Public
router.post('/setup-admin', async (req, res) => {
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

    res.status(201).json({ message: 'Admin created successfully', srvNumber: admin.srvNumber });
  } catch (error) {
    res.status(500).json({ message: 'Server error setup admin', error: error.message, stack: error.stack });
  }
});

export default router;
