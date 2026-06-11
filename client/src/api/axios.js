import axios from 'axios';

// One shared axios instance for the whole app.
// - baseURL '/api' works in dev because Vite proxies /api -> http://localhost:5000
//   (see vite.config.js). In production, set VITE_API_URL to the deployed API URL.
// - withCredentials tells the browser to send/receive the HTTP-only auth cookie.
const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || '/api',
  withCredentials: true,
});

export default api;
