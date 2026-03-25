/**
 * Admin Panel Application — SRV School Management
 * Standalone admin-only React app. 
 * Communicates with the backend via secure API endpoints.
 */

import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AdminLogin } from './portal/AdminLogin';
import { AdminDashboard } from './portal/AdminDashboard';
import { ProtectedRoute } from './components/ProtectedRoute';

export default function App() {
  return (
    <Router>
      <Routes>
        {/* Redirect root to admin login */}
        <Route path="/" element={<Navigate to="/login" replace />} />
        
        {/* Public admin login */}
        <Route path="/login" element={<AdminLogin />} />

        {/* Protected admin dashboard — only role='admin' */}
        <Route element={<ProtectedRoute allowedRole="admin" redirectTo="/login" />}>
          <Route path="/dashboard" element={<AdminDashboard />} />
        </Route>

        {/* Catch-all redirect */}  
        <Route path="*" element={<Navigate to="/login" replace />} />
      </Routes>
    </Router>
  );
}
