import Cookies from 'js-cookie';

const API_BASE_URL = 'http://localhost:8080/api/v1/users-schedules';

// Helper function to get auth headers
const getAuthHeaders = () => {
  const token = Cookies.get('staff_token');
  return {
    'Authorization': `Bearer ${token}`,
    'Content-Type': 'application/json'
  };
};

// Get schedules with filters
export const getSchedules = async (filters = {}) => {
  try {
    const params = new URLSearchParams();
    
    Object.keys(filters).forEach(key => {
      if (filters[key] !== null && filters[key] !== undefined && filters[key] !== '') {
        params.append(key, filters[key]);
      }
    });

    const response = await fetch(`${API_BASE_URL}?${params}`, {
      method: 'GET',
      headers: getAuthHeaders()
    });

    if (!response.ok) {
      throw new Error('Network response was not ok');
    }

    return await response.json();
  } catch (error) {
    console.error('Error fetching schedules:', error);
    throw error;
  }
};

// Get schedules by user ID
export const getSchedulesByUserId = async (userId, filters = {}) => {
  try {
    const params = new URLSearchParams();
    
    Object.keys(filters).forEach(key => {
      if (filters[key] !== null && filters[key] !== undefined && filters[key] !== '') {
        params.append(key, filters[key]);
      }
    });

    const response = await fetch(`${API_BASE_URL}/user/${userId}?${params}`, {
      method: 'GET',
      headers: getAuthHeaders()
    });

    if (!response.ok) {
      throw new Error('Network response was not ok');
    }

    return await response.json();
  } catch (error) {
    console.error('Error fetching user schedules:', error);
    throw error;
  }
};

// Get schedule by ID
export const getScheduleById = async (scheduleId) => {
  try {
    const response = await fetch(`${API_BASE_URL}/find/${scheduleId}`, {
      method: 'GET',
      headers: getAuthHeaders()
    });

    if (!response.ok) {
      throw new Error('Network response was not ok');
    }

    return await response.json();
  } catch (error) {
    console.error('Error fetching schedule:', error);
    throw error;
  }
};

// Create new schedule
export const createSchedule = async (scheduleData) => {
  try {
    const response = await fetch(`${API_BASE_URL}/created`, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify(scheduleData)
    });

    if (!response.ok) {
      throw new Error('Network response was not ok');
    }

    return await response.json();
  } catch (error) {
    console.error('Error creating schedule:', error);
    throw error;
  }
};

// Update schedule
export const updateSchedule = async (scheduleId, scheduleData) => {
  try {
    const response = await fetch(`${API_BASE_URL}/update/${scheduleId}`, {
      method: 'PUT',
      headers: getAuthHeaders(),
      body: JSON.stringify(scheduleData)
    });

    if (!response.ok) {
      throw new Error('Network response was not ok');
    }

    return await response.json();
  } catch (error) {
    console.error('Error updating schedule:', error);
    throw error;
  }
};

// Delete schedule (soft delete)
export const deleteSchedule = async (scheduleId) => {
  try {
    const response = await fetch(`${API_BASE_URL}/${scheduleId}`, {
      method: 'PUT',
      headers: getAuthHeaders()
    });

    if (!response.ok) {
      throw new Error('Network response was not ok');
    }

    return await response.json();
  } catch (error) {
    console.error('Error deleting schedule:', error);
    throw error;
  }
};

// Check-in
export const checkIn = async (scheduleId) => {
  try {
    const response = await fetch(`${API_BASE_URL}/check-in/${scheduleId}`, {
      method: 'PUT',
      headers: getAuthHeaders()
    });

    if (!response.ok) {
      throw new Error('Network response was not ok');
    }

    return await response.json();
  } catch (error) {
    console.error('Error checking in:', error);
    throw error;
  }
};

// Check-out
export const checkOut = async (scheduleId) => {
  try {
    const response = await fetch(`${API_BASE_URL}/check-out/${scheduleId}`, {
      method: 'PUT',
      headers: getAuthHeaders()
    });

    if (!response.ok) {
      throw new Error('Network response was not ok');
    }

    return await response.json();
  } catch (error) {
    console.error('Error checking out:', error);
    throw error;
  }
};

// Helper functions for status and formatting
export const getStatusLabel = (status) => {
  const statusMap = {
    'pending': 'Chờ xử lý',
    'confirmed': 'Đã xác nhận', 
    'completed': 'Hoàn thành',
    'cancelled': 'Đã hủy'
  };
  return statusMap[status] || status || 'N/A';
};

export const getStatusColor = (status) => {
  const colorMap = {
    'pending': 'warning',
    'confirmed': 'primary',
    'completed': 'success', 
    'cancelled': 'error'
  };
  return colorMap[status] || 'default';
};

// Date and time utilities
export const formatWorkDate = (dateStr) => {
  try {
    const date = new Date(dateStr);
    return date.toLocaleDateString('vi-VN', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit'
    });
  } catch (error) {
    return dateStr;
  }
};

export const formatTime = (timeStr) => {
  if (!timeStr) return '-';
  try {
    // Handle both HH:mm and HH:mm:ss formats
    const parts = timeStr.split(':');
    return `${parts[0]}:${parts[1]}`;
  } catch (error) {
    return timeStr;
  }
};

export default {
  getSchedules,
  getSchedulesByUserId,
  getScheduleById,
  createSchedule,
  updateSchedule,
  deleteSchedule,
  checkIn,
  checkOut,
  getStatusLabel,
  getStatusColor,
  formatWorkDate,
  formatTime
}; 