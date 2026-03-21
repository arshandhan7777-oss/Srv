import express from 'express';
import mongoose from 'mongoose';
import cors from 'cors';
import dotenv from 'dotenv';
import dns from 'dns';

// Force Node.js to use public DNS for SRV records, bypassing faulty local Windows adapters
dns.setServers(['8.8.8.8', '8.8.4.4']);

import authRoutes from './routes/auth.js';
import adminRoutes from './routes/admin.js';
import facultyRoutes from './routes/faculty.js';
import parentRoutes from './routes/parent.js';

dotenv.config();

const app = express();
app.use(express.json());
app.use(cors());

// Future routes will go here
app.use('/api/auth', authRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/faculty', facultyRoutes);
app.use('/api/parent', parentRoutes);

app.get('/', (req, res) => {
    res.send('SRV School Management API is running');
});

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
});
