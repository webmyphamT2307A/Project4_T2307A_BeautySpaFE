import React, { createContext, useState, useContext, useEffect, useCallback } from 'react';
import PropTypes from 'prop-types';
import Cookies from 'js-cookie';
import { useNavigate } from 'react-router-dom';

const AuthContext = createContext(null);

// Thời gian không hoạt động cho phép (30 phút)
const IDLE_TIMEOUT = 30 * 60 * 1000;

export const useAuth = () => useContext(AuthContext);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  let idleTimer = null;

  const logout = useCallback(() => {
    // Xóa tất cả các thông tin xác thực
    Cookies.remove('staff_token');
    Cookies.remove('token');
    Cookies.remove('staff_role');
    Cookies.remove('staff_userId');
    localStorage.removeItem('token');
    localStorage.removeItem('user');

    // Cập nhật trạng thái
    setIsAuthenticated(false);
    setUser(null);

    // Chuyển hướng đến trang đăng nhập
    // Đường dẫn tuyệt đối sẽ được `basename` xử lý đúng
    navigate('/login', { replace: true });
  }, [navigate]);

  const resetIdleTimer = useCallback(() => {
    if (idleTimer) clearTimeout(idleTimer);
    idleTimer = setTimeout(logout, IDLE_TIMEOUT);
  }, [logout]);

  const checkAuthSession = useCallback(async () => {
    setLoading(true);
    const token = Cookies.get('staff_token') || Cookies.get('token') || localStorage.getItem('token');

    if (!token) {
      setIsAuthenticated(false);
      setUser(null);
      setLoading(false);
      return;
    }

    try {
      const response = await fetch('http://localhost:8080/api/v1/userDetail/me', {
        headers: {
          Authorization: `Bearer ${token}`
        }
      });

      if (response.ok) {
        const data = await response.json();
        if (data.status === 'SUCCESS') {
          setUser(data.data);
          setIsAuthenticated(true);
          resetIdleTimer(); // Khởi động lại bộ đếm khi xác thực thành công
        } else {
          throw new Error(data.message || 'Failed to verify session.');
        }
      } else {
        logout(); // Nếu token không hợp lệ, đăng xuất và chuyển hướng
      }
    } catch (error) {
      console.error('Authentication check failed:', error);
      logout(); // Nếu có lỗi, đăng xuất và chuyển hướng
    } finally {
      setLoading(false);
    }
  }, [logout, resetIdleTimer]);

  useEffect(() => {
    checkAuthSession();
  }, [checkAuthSession]);

  // Thiết lập trình theo dõi không hoạt động
  useEffect(() => {
    if (isAuthenticated) {
      const events = ['mousemove', 'keydown', 'scroll', 'click'];

      const listener = () => resetIdleTimer();

      events.forEach((event) => window.addEventListener(event, listener));
      resetIdleTimer(); // Bắt đầu bộ đếm

      return () => {
        clearTimeout(idleTimer);
        events.forEach((event) => window.removeEventListener(event, listener));
      };
    }
  }, [isAuthenticated, resetIdleTimer]);

  const value = {
    user,
    isAuthenticated,
    loading,
    checkAuthSession,
    logout
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

AuthProvider.propTypes = {
  children: PropTypes.node.isRequired
};
