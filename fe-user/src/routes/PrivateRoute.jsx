import React from 'react';
import { Navigate, Outlet } from 'react-router-dom';
import { useAuth } from 'contexts/AuthContext';
import Loader from 'components/Loader';

const PrivateRoute = () => {
  const { isAuthenticated, loading } = useAuth();

  if (loading) {
    // Hiển thị loader trong khi AuthContext đang kiểm tra phiên đăng nhập
    return <Loader />;
  }

  // Nếu đã xác thực, cho phép truy cập. Nếu không, chuyển hướng về trang login.
  return isAuthenticated ? <Outlet /> : <Navigate to="/login" replace />;
};

export default PrivateRoute;