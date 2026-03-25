import { Navigate, Outlet } from 'react-router-dom';

/**
 * ProtectedRoute — JWT + Role-Based Access Guard
 *
 * Wraps portal routes to:
 * 1. Redirect unauthenticated users (no token) to login
 * 2. Redirect users with the wrong role to the appropriate login page
 * 3. Render the child route (<Outlet />) only if both checks pass
 *
 * Usage in App.js:
 *   <Route element={<ProtectedRoute allowedRole="admin" redirectTo="/portal/admin-login" />}>
 *     <Route path="admin" element={<AdminDashboard />} />
 *   </Route>
 */
export function ProtectedRoute({ allowedRole, redirectTo }) {
  const token = localStorage.getItem('schoolToken');

  // No token at all → not logged in
  if (!token) {
    return <Navigate to={redirectTo} replace />;
  }

  // Parse stored user safely
  let user = {};
  try {
    user = JSON.parse(localStorage.getItem('schoolUser') || '{}');
  } catch {
    // Corrupted data — clear and redirect
    localStorage.removeItem('schoolToken');
    localStorage.removeItem('schoolUser');
    return <Navigate to={redirectTo} replace />;
  }

  // Role mismatch → redirect
  if (!user.role || user.role !== allowedRole) {
    return <Navigate to={redirectTo} replace />;
  }

  // All checks passed — render the protected child route
  return <Outlet />;
}
