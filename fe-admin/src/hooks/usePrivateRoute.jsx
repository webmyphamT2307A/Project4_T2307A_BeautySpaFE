import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify';

const usePrivateRoute = (allowedRoles) => {
  const navigate = useNavigate();

  useEffect(() => {
    const userString = localStorage.getItem('user');
    
    // 1. Kiểm tra nếu người dùng chưa đăng nhập
    if (!userString) {
      console.log('No user found in localStorage, redirecting to login...');
      navigate('/login', { replace: true });
      return; // Dừng thực thi ngay lập tức
    }

    // 2. Parse và kiểm tra vai trò một cách an toàn
    try {
      const user = JSON.parse(userString);
      const roleName = user?.role?.name; // Lấy tên vai trò

      console.log('User from localStorage:', user);
      console.log('User Role Name:', roleName);

      // Thêm tiền tố 'ROLE_' để so sánh (nếu cần) hoặc kiểm tra trực tiếp
      // Giả sử allowedRoles là một mảng các tên vai trò không có tiền tố, ví dụ ['ADMIN', 'STAFF']
      // Nếu allowedRoles của bạn là ['ROLE_ADMIN'], hãy dùng: `const userRoleForCheck = `ROLE_${roleName?.toUpperCase()}`;`
      
      if (!roleName || !allowedRoles.includes(roleName.toUpperCase())) {
        console.log(`Role '${roleName}' is not in allowed roles [${allowedRoles.join(', ')}], redirecting to login...`);
        toast.warn('Bạn không có quyền truy cập trang này.');
        navigate('/login', { replace: true });
      }
    } catch (error) {
      console.error('Failed to parse user from localStorage, redirecting to login...', error);
      toast.error('Phiên đăng nhập không hợp lệ, vui lòng đăng nhập lại.');
      // Xóa user data bị hỏng để tránh lặp lại lỗi
      localStorage.removeItem('user');
      navigate('/login', { replace: true });
    }
  }, [allowedRoles, navigate]);
};

export default usePrivateRoute;