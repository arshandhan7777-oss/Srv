/**
 * Admin Panel Application — Centralized Portals 
 * Hosts the Admin, Faculty, and Parent portals.
 * Communicates with the backend via secure API endpoints.
 */

import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';

/* Portals */
import { Login as GeneralLogin } from './portal/Login';
import { AdminLogin } from './portal/AdminLogin';
import { AdminDashboard } from './portal/AdminDashboard';
import { FacultyDashboard } from './portal/FacultyDashboard';
import { ParentDashboard } from './portal/ParentDashboard';

/* Security Guard */
import { ProtectedRoute } from './components/ProtectedRoute';

export default function App() {
  return (
    <Router>
      <Routes>
        {/* Redirect root to general login by default */}
        <Route path="/" element={<Navigate to="/login" replace />} />
        <Route path="/portal/login" element={<Navigate to="/login" replace />} />
        
        {/* Public Login Routes */}
        <Route path="/login" element={<GeneralLogin />} />
        <Route path="/admin-login" element={<AdminLogin />} />

        {/* Protected Admin Routes */}
        <Route element={<ProtectedRoute allowedRole="admin" redirectTo="/admin-login" />}>
          <Route path="/admin/dashboard" element={<AdminDashboard />} />
          <Route path="/admin/faculty" element={<AdminDashboard section="faculty" />} />
          <Route path="/admin/students" element={<AdminDashboard section="students" />} />
          <Route path="/admin/promote" element={<AdminDashboard section="promote" />} />
          <Route path="/admin/events" element={<AdminDashboard section="events" />} />
          <Route path="/admin/polls" element={<AdminDashboard section="polls" />} />
          <Route path="/admin/feedback" element={<AdminDashboard section="feedback" />} />
          <Route path="/admin/cafeteria" element={<AdminDashboard section="cafeteria" />} />
          <Route path="/admin/announcements" element={<AdminDashboard section="announcements" />} />
        </Route>

        {/* Protected Faculty Routes */}
        <Route element={<ProtectedRoute allowedRole="faculty" redirectTo="/login" />}>
          <Route path="/faculty/dashboard" element={<FacultyDashboard />} />
        </Route>

        {/* Protected Parent Routes */}
        <Route element={<ProtectedRoute allowedRole="parent" redirectTo="/login" />}>
          <Route path="/parent/dashboard" element={<ParentDashboard />} />
        </Route>

        {/* Catch-all redirect */}  
        <Route path="*" element={<Navigate to="/login" replace />} />
      </Routes>
    </Router>
  );
}
