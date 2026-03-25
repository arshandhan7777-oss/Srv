import jwt from 'jsonwebtoken';

// Protect routes: Verify JWT token
export const protect = (req, res, next) => {
  let token;

  if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
    try {
      token = req.headers.authorization.split(' ')[1];
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      
      req.user = decoded; // { id, role, srvNumber }
      return next();
    } catch (error) {
      console.error(`[AUTH FAIL] ${new Date().toISOString()} | IP: ${req.ip} | Invalid token`);
      return res.status(401).json({ message: 'Not authorized, token failed' });
    }
  }

  if (!token) {
    console.error(`[AUTH FAIL] ${new Date().toISOString()} | IP: ${req.ip} | No token provided | ${req.method} ${req.originalUrl}`);
    return res.status(401).json({ message: 'Not authorized, no token' });
  }
};

// Admin only middleware
export const adminOnly = (req, res, next) => {
  if (req.user && req.user.role === 'admin') {
    return next();
  }
  return res.status(403).json({ message: 'Not authorized as an admin' });
};

// Faculty or Admin middleware
export const facultyOrAdmin = (req, res, next) => {
  if (req.user && (req.user.role === 'faculty' || req.user.role === 'admin')) {
    return next();
  }
  return res.status(403).json({ message: 'Not authorized to perform this action' });
};
