// Centralized API configuration
// Uses Vite environment variable VITE_API_URL, falling back to production URL
const API_URL = import.meta.env.VITE_API_URL || 'https://srv-backend-psi.vercel.app';

export default API_URL;
