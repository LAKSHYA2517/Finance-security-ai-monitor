import axios from 'axios';

// 🧠 SMART SWITCH:
// If deployed on Vercel, this uses the Environment Variable.
// If running 'npm run dev', this falls back to Localhost.
const baseURL = import.meta.env.VITE_API_URL || 'http://127.0.0.1:8000';

const apiClient = axios.create({
  baseURL: baseURL,
  headers: {
    'Content-Type': 'application/json',
    'ngrok-skip-browser-warning': 'true' // Keeps Ngrok happy
  },
});

export default apiClient;