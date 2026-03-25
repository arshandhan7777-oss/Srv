import express from 'express';
import mongoose from 'mongoose';
import cors from 'cors';
import dotenv from 'dotenv';
import dns from 'dns';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import mongoSanitize from 'express-mongo-sanitize';
import hpp from 'hpp';

// Force Node.js to use public DNS for SRV records, bypassing faulty local Windows adapters
dns.setServers(['8.8.8.8', '8.8.4.4']);

dotenv.config();

import authRoutes from './routes/auth.js';
import adminRoutes from './routes/admin.js';
import facultyRoutes from './routes/faculty.js';
import parentRoutes from './routes/parent.js';

const app = express();

// ──────────────────────────────────────────────
// 1. SECURITY MIDDLEWARE
// ──────────────────────────────────────────────

// CORS — restrict to trusted origins only
const allowedOrigins = [
  process.env.CORS_ORIGIN || 'http://localhost:3000',
  'http://localhost:3001',                // admin panel (local dev)
  'http://localhost:3002',                // frontend (local dev)
  'https://srv-lyart.vercel.app',         // production frontend
  'https://srv-admin-gamma.vercel.app'    // production admin
].filter(Boolean);

// Explicitly handle preflight OPTIONS requests for all routes
app.use(cors({
  origin: function (origin, callback) {
    // Allow requests with no origin (mobile apps, curl, server-to-server)
    if (!origin) return callback(null, true);
    if (allowedOrigins.includes(origin)) {
      return callback(null, true);
    }
    return callback(new Error('Not allowed by CORS'));
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With', 'Accept']
}));

app.use(cors({
  origin: function (origin, callback) {
    // Allow requests with no origin (mobile apps, curl, server-to-server)
    if (!origin) return callback(null, true);
    if (allowedOrigins.includes(origin)) {
      return callback(null, true);
    }
    return callback(new Error('Not allowed by CORS'));
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With', 'Accept']
}));

// Set secure HTTP headers (XSS filter, HSTS, noSniff, etc.)
app.use(helmet());

// Limit JSON body size to prevent large payload attacks
app.use(express.json({ limit: '10kb' }));

// Prevent NoSQL injection (Incompatible with Express 5 as it tries to re-assign req.query)
// app.use(mongoSanitize());

// Prevent HTTP Parameter Pollution (Currently incompatible with Express 5)
// app.use(hpp());

// Global rate limiter — 100 requests per 15 minutes per IP
const globalLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 100,
  standardHeaders: true,
  legacyHeaders: false,
  message: { message: 'Too many requests, please try again later.' }
});
app.use(globalLimiter);

// ──────────────────────────────────────────────
// 2. ROUTES
// ──────────────────────────────────────────────
app.use('/api/auth', authRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/faculty', facultyRoutes);
app.use('/api/parent', parentRoutes);

app.get('/', (req, res) => {
    res.send('SRV School Management API is running');
});

// ──────────────────────────────────────────────
// 3. CENTRALIZED ERROR HANDLER
// ──────────────────────────────────────────────
// Catches any unhandled errors — NEVER expose internal details to the client
app.use((err, req, res, next) => {
  console.error(`[ERROR] ${new Date().toISOString()} | ${req.method} ${req.originalUrl} | ${err.message}`);
  
  // CORS errors
  if (err.message === 'Not allowed by CORS') {
    return res.status(403).json({ message: 'CORS policy: Origin not allowed.' });
  }

  res.status(err.status || 500).json({
    message: process.env.NODE_ENV === 'production'
      ? 'An unexpected error occurred.'
      : err.message || 'Internal Server Error'
  });
});

// ──────────────────────────────────────────────
// 4. DATABASE & SERVER STARTUP
// ──────────────────────────────────────────────
const PORT = process.env.PORT || 5000;

if (process.env.MONGODB_URI) {
  mongoose.connect(process.env.MONGODB_URI)
    .then(() => {
      console.log('Connected to MongoDB successfully');
    })
    .catch((err) => {
      console.error('MongoDB connection error. Please check your network/IP whitelist in MongoDB Atlas:');
      console.error(err.message);
    });
} else {
  console.warn('MONGODB_URI is not defined in the environment. Skipping database connection.');
}

// Always start the Express server, even if DB fails initially
app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
    console.log(`CORS allowed origins: ${allowedOrigins.join(', ')}`);
    console.log(`Environment: ${process.env.NODE_ENV || 'development'}`);
});
