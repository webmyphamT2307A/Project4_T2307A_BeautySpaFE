import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

const usePrivateRoute = (allowedRoles) => {
  const navigate = useNavigate();

  useEffect(() => {
    const user = JSON.parse(localStorage.getItem('user'));
    const roleName = `ROLE_${user?.role?.name?.toUpperCase()}`;

    if (!allowedRoles.includes(roleName)) {
      navigate('/login', { replace: true });
    }
  }, [allowedRoles, navigate]);
};

export default usePrivateRoute;