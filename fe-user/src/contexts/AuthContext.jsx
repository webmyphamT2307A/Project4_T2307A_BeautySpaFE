import React, { createContext, useState, useContext, useEffect, useCallback } from 'react';
import PropTypes from 'prop-types';
import Cookies from 'js-cookie';

const AuthContext = createContext(null);

export const useAuth = () => useContext(AuthContext);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [loading, setLoading] = useState(true);

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
        } else {
          throw new Error(data.message || 'Failed to verify session.');
        }
      } else {
        // Clear invalid auth data
        Cookies.remove('staff_token');
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        setIsAuthenticated(false);
        setUser(null);
      }
    } catch (error) {
      console.error('Authentication check failed:', error);
      setIsAuthenticated(false);
      setUser(null);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    checkAuthSession();
  }, [checkAuthSession]);

  const value = {
    user,
    isAuthenticated,
    loading,
    checkAuthSession
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

AuthProvider.propTypes = {
  children: PropTypes.node.isRequired
}; 