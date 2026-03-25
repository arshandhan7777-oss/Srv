import { Navigate, Outlet } from 'react-router-dom';

/**
 * ProtectedRoute — JWT + Role-Based Access Guard (Admin Panel)
 *
 * Security layers:
 * 1. Checks for presence of a JWT token in localStorage
 * 2. Decodes the JWT payload and validates it hasn't expired
 * 3. Verifies the user's role matches the required 'admin' role
 * 4. Clears corrupted/expired auth data and redirects to login
 *
 * NOTE: This is a client-side guard for UX. The backend MUST also
 * validate tokens on every API request — never trust the client alone.
 */

function decodeJwtPayload(token) {
  try {
    const base64Url = token.split('.')[1];
    if (!base64Url) return null;
    const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
    const jsonPayload = decodeURIComponent(
      atob(base64)
        .split('')
        .map((c) => '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2))
        .join('')
    );
    return JSON.parse(jsonPayload);
  } catch {
    return null;
  }
}

function isTokenExpired(payload) {
  if (!payload || !payload.exp) return true;
  // exp is in seconds, Date.now() is in milliseconds
  return Date.now() >= payload.exp * 1000;
}

function clearAuthData() {
  localStorage.removeItem('schoolToken');
  localStorage.removeItem('schoolUser');
}

export function ProtectedRoute({ allowedRole, redirectTo }) {
  const token = localStorage.getItem('schoolToken');

  // 1. No token → not logged in
  if (!token) {
    return <Navigate to={redirectTo} replace />;
  }

  // 2. Decode the JWT and verify it's structurally valid
  const payload = decodeJwtPayload(token);
  if (!payload) {
    clearAuthData();
    return <Navigate to={redirectTo} replace />;
  }

  // 3. Check token expiry
  if (isTokenExpired(payload)) {
    clearAuthData();
    return <Navigate to={redirectTo} replace />;
  }

  // 4. Verify role from the JWT payload itself (not just localStorage)
  if (payload.role !== allowedRole) {
    clearAuthData();
    return <Navigate to={redirectTo} replace />;
  }

  // 5. Cross-check with stored user data
  let user = {};
  try {
    user = JSON.parse(localStorage.getItem('schoolUser') || '{}');
  } catch {
    clearAuthData();
    return <Navigate to={redirectTo} replace />;
  }

  if (!user.role || user.role !== allowedRole) {
    clearAuthData();
    return <Navigate to={redirectTo} replace />;
  }

  // All checks passed — render the protected child route
  return <Outlet />;
}
