import axios from 'axios';

const API_BASE_URL = 'http://localhost:5001/api';

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

api.interceptors.response.use(
  (response) => {
    return response;
  },
  (error) => {
    if (error.response && error.response.status === 401) {
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      window.location.href = '/login';
    }
    
    return Promise.reject(error);
  }
);

export const authAPI = {
  login: (credentials) => api.post('/auth/login', credentials),
  register: (userData) => api.post('/auth/register', userData),
};

export const eventsAPI = {
  getAll: (params) => api.get('/events', { params }),
  getById: (id) => api.get(`/events/${id}`),
  create: (formData) => api.post('/events', formData, {
    headers: { 'Content-Type': 'multipart/form-data' }
  }),
  update: (id, formData) => api.put(`/events/${id}`, formData, {
    headers: { 'Content-Type': 'multipart/form-data' }
  }),
  delete: (id) => api.delete(`/events/${id}`),
};

export const ticketsAPI = {
  purchase: (ticketData) => api.post('/tickets', ticketData),
  getUserTickets: () => api.get('/tickets/user'),
  getById: (id) => api.get(`/tickets/${id}`),
};

export const categoriesAPI = {
  getAll: () => api.get('/categories'),
  create: (categoryData) => api.post('/categories', categoryData),
  update: (id, categoryData) => api.put(`/categories/${id}`, categoryData),
  delete: (id) => api.delete(`/categories/${id}`),
};

export const usersAPI = {
  getAll: () => api.get('/users'),
  getProfile: () => api.get('/users/profile'),
  updateProfile: (userData) => api.put('/users/profile', userData),
  changeRole: (userId, roleData) => api.put(`/users/${userId}/role`, roleData),
  getStats: () => api.get('/users/stats'),
};

export const adminAPI = {
  getDashboard: () => api.get('/admin/dashboard'),
  getSalesReport: (params) => api.get('/admin/reports/sales', { params }),
  getAttendeesReport: (eventId) => api.get(`/admin/reports/attendees/${eventId}`),
};

export default api;
