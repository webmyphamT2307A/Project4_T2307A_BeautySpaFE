import { authUtils } from 'utils/auth';

const API_BASE_URL = 'http://localhost:8080/api/v1';

export const authApi = {
  // Admin/Staff login
  signin: async (email, password) => {
    const response = await fetch(`${API_BASE_URL}/auth/signin`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ email, password }),
    });
    return response.json();
  },

  // Admin/Staff register
  signup: async (userData) => {
    const response = await fetch(`${API_BASE_URL}/auth/signup`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(userData),
    });
    return response.json();
  },

  // Create admin/staff account through admin controller
  createAdminAccount: async (userData) => {
    const response = await fetch(`${API_BASE_URL}/admin/accounts/create`, {
      method: 'POST',
      headers: authUtils.getAuthHeaders(),
      body: JSON.stringify(userData),
    });
    return response.json();
  },

  // Find user by email
  findByEmail: async (email) => {
    const response = await fetch(`${API_BASE_URL}/admin/accounts/find-by-email/${email}`, {
      method: 'GET',
      headers: authUtils.getAuthHeaders(),
    });
    return response.json();
  },

  // Find user by phone
  findByPhone: async (phone) => {
    const response = await fetch(`${API_BASE_URL}/admin/accounts/find-by-phone/${phone}`, {
      method: 'GET',
      headers: authUtils.getAuthHeaders(),
    });
    return response.json();
  }
};

export default authApi; 