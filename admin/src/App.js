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
import { NotFound } from './portal/NotFound';

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
          <Route path="/faculty/homework" element={<FacultyDashboard section="homework" />} />
          <Route path="/faculty/attendance" element={<FacultyDashboard section="attendance" />} />
          <Route path="/faculty/behavior" element={<FacultyDashboard section="behavior" />} />
          <Route path="/faculty/announcements" element={<FacultyDashboard section="announcements" />} />
          <Route path="/faculty/events" element={<FacultyDashboard section="events" />} />
          <Route path="/faculty/polls" element={<FacultyDashboard section="polls" />} />
          <Route path="/faculty/feedback" element={<FacultyDashboard section="feedback" />} />
        </Route>

        {/* Protected Parent Routes */}
        <Route element={<ProtectedRoute allowedRole="parent" redirectTo="/login" />}>
          <Route path="/parent/dashboard" element={<ParentDashboard />} />
          <Route path="/parent/skills" element={<ParentDashboard section="skills" />} />
          <Route path="/parent/homework" element={<ParentDashboard section="homework" />} />
          <Route path="/parent/homework/:subject" element={<ParentDashboard section="homework" />} />
          <Route path="/parent/events" element={<ParentDashboard section="events" />} />
          <Route path="/parent/polls" element={<ParentDashboard section="polls" />} />
          <Route path="/parent/feedback" element={<ParentDashboard section="feedback" />} />
          <Route path="/parent/fees" element={<ParentDashboard section="fees" />} />
        </Route>

        {/* Catch-all redirect */}  
        <Route path="*" element={<NotFound />} />
      </Routes>
    </Router>
  );
}
