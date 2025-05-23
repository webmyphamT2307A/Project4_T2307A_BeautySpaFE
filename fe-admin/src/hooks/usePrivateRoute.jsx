import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

const usePrivateRoute = (allowedRoles) => {
  const navigate = useNavigate();

  useEffect(() => {
  const user = JSON.parse(localStorage.getItem('user'));
  const roleName = `ROLE_${user?.role?.name?.toUpperCase()}`;

  console.log('User from localStorage:', user);
  console.log('RoleName:', roleName);

  if (!allowedRoles.includes(roleName)) {
    console.log('Role not allowed, redirecting to login...');
    navigate('/login', { replace: true });
  }
}, [allowedRoles, navigate]);
};

export default usePrivateRoute;