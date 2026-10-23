import axios from 'axios';

const API_URL = import.meta.env.VITE_API_URL || (import.meta.env.PROD
  ? 'https://new-regent-backend.vercel.app/api'
  : 'http://localhost:5000/api');

const api = axios.create({
  baseURL: API_URL,
  headers: { 'Content-Type': 'application/json' }
});

api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

api.interceptors.response.use(
  (response) => response,
  (error) => {
    const isAuthSubmission = /\/auth\/(login|register)/.test(error.config?.url || '');
    if (error.response?.status === 401 && !isAuthSubmission) {
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      window.dispatchEvent(new Event('auth:session-expired'));
    }
    return Promise.reject(error);
  }
);

export const authAPI = {
  register: async (userData) => (await api.post('/auth/register', userData)).data,
  login: async (credentials) => (await api.post('/auth/login', credentials)).data,
  getMe: async () => (await api.get('/auth/me')).data,
  updateProfile: async (updates) => (await api.put('/auth/profile', updates)).data
};

export const roomAPI = {
  getAll: async (filters = {}) => (await api.get('/rooms', { params: filters })).data,
  getById: async (id) => (await api.get(`/rooms/${id}`)).data,
  getUpcomingBookings: async (id) => (await api.get(`/rooms/${id}/upcoming-bookings`)).data,
  uploadImage: async (file) => {
    const formData = new FormData();
    formData.append('image', file);
    return (await api.post('/rooms/images/upload', formData, { headers: { 'Content-Type': 'multipart/form-data' } })).data;
  },
  create: async (data) => (await api.post('/rooms', data)).data,
  update: async (id, data) => (await api.put(`/rooms/${id}`, data)).data,
  delete: async (id) => (await api.delete(`/rooms/${id}`)).data
};

export const bookingAPI = {
  create: async (data) => (await api.post('/bookings', data)).data,
  getMyBookings: async () => (await api.get('/bookings/my-bookings')).data,
  cancel: async (id, reason) => (await api.put(`/bookings/${id}/cancel`, { reason })).data,
  getAll: async () => (await api.get('/bookings')).data,
  updateStatus: async (id, status) => (await api.put(`/bookings/${id}/status`, { status })).data
};

export const paymentAPI = {
  create: async (data) => (await api.post('/payments/create', data)).data,
  getMyPayments: async () => (await api.get('/payments/my-payments')).data,
  getAll: async () => (await api.get('/payments')).data
};

export const adminAPI = {
  getDashboard: async () => (await api.get('/admin/dashboard')).data,
  getUsers: async () => (await api.get('/admin/users')).data,
  deleteUser: async (id) => (await api.delete(`/admin/users/${id}`)).data
};

export const contactAPI = {
  submit: async (data) => (await api.post('/contact', data)).data
};

export default api;
