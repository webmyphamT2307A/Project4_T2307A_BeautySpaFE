import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useState, useEffect, useContext } from 'react';

// material-ui
import Grid from '@mui/material/Grid2';
import Stack from '@mui/material/Stack';
import Typography from '@mui/material/Typography';
import TextField from '@mui/material/TextField';
import Button from '@mui/material/Button';
import Alert from '@mui/material/Alert';
import Cookies from 'js-cookie';
// project imports
import AuthWrapper from 'sections/auth/AuthWrapper';

export default function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const navigate = useNavigate();
  const location = useLocation();
  useEffect(() => {
    const adminToken = Cookies.get('admin_token');
    const adminRole = Cookies.get('admin_role');
    const staffToken = Cookies.get('staff_token');
    const staffRole = Cookies.get('staff_role');

    if (adminToken && adminRole === 'ROLE_ADMIN') {
      console.log('Admin token and role found in cookies:', adminToken, adminRole);
      navigate('/admin');
    } else if (staffToken && staffRole === 'ROLE_STAFF') {
      
      console.log('Staff token and role found in cookies:', staffToken, staffRole);
      navigate('/staff');
    } else {
      console.error('No valid token or role found in cookies');
      navigate('/login');
    }
  }, [navigate]);
  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    try {
      const res = await fetch('http://localhost:8080/api/v1/userDetail/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      });

      if (!res.ok) {
        throw new Error(`HTTP error! status: ${res.status}`);
      }

      const data = await res.json();
      console.log('Login response:', data);

      if (data.status === 'SUCCESS') {
        const token = data.data.token;
        const user = data.data.user;

        const roleName = `ROLE_${user?.role?.name?.toUpperCase()}`;
        console.log('Role from API:', roleName);

        localStorage.setItem('token', JSON.stringify(token));
        localStorage.setItem('user', JSON.stringify(user));

        if (roleName === 'ROLE_ADMIN') {
          // Lưu cookie admin
          Cookies.set('admin_token', token, { path: '/admin', sameSite: 'Strict', expires: 7 });
          Cookies.set('admin_role', roleName, { path: '/admin', sameSite: 'Strict', expires: 7 });
          console.log('Admin cookie set:', Cookies.get('admin_token'), Cookies.get('admin_role'));
          window.location.href = 'http://localhost:3003/admin';
        } else if (roleName === 'ROLE_STAFF') {
          Cookies.set('staff_token', token, { path: '/staff', sameSite: 'Strict', expires: 7 });
          Cookies.set('staff_role', roleName, { path: '/staff', sameSite: 'Strict', expires: 7 });
          Cookies.set('staff_userId', user.id, { path: '/staff', sameSite: 'Strict', expires: 7 }); // Lưu userId
          console.log('Staff cookie set:', Cookies.get('staff_token'), Cookies.get('staff_role'), Cookies.get('staff_userId'));
          window.location.href = 'http://localhost:3002/staff';
        } else {
          console.log('Invalid role, clearing cookies...');
          Cookies.remove('admin_token', { path: '/admin' });
          Cookies.remove('admin_role', { path: '/admin' });
          Cookies.remove('staff_token', { path: '/staff' });
          Cookies.remove('staff_role', { path: '/staff' });
          setError('Vai trò không hợp lệ');
        }
      } else {
        setError(data.message || 'Đăng nhập thất bại');
      }
    } catch (err) {
      console.error('Error during login:', err);
      setError('Lỗi kết nối server');
    }
  };

  return (
    <AuthWrapper>
      <Grid container spacing={3}>
        <Grid size={12}>
          <Stack direction="row" sx={{ alignItems: 'baseline', justifyContent: 'space-between', mb: { xs: -0.5, sm: 0.5 } }}>
            <Typography variant="h3">Login</Typography>
            <Typography component={Link} to={'/register'} variant="body1" sx={{ textDecoration: 'none' }} color="primary">
              Don&apos;t have an account?
            </Typography>
          </Stack>
        </Grid>
        <Grid size={12}>
          <form onSubmit={handleSubmit}>
            <Stack spacing={2}>
              {error && <Alert severity="error">{error}</Alert>}
              <TextField
                label="Email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
              <TextField
                label="Mật khẩu"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />
              <Button type="submit" variant="contained" color="primary">
                Đăng nhập
              </Button>
            </Stack>
          </form>
        </Grid>
      </Grid>
    </AuthWrapper>
  );
}