import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useState, useEffect } from 'react';

// material-ui
import Grid from '@mui/material/Grid2';
import Stack from '@mui/material/Stack';
import Typography from '@mui/material/Typography';
import TextField from '@mui/material/TextField';
import Button from '@mui/material/Button';
import Alert from '@mui/material/Alert';

// project imports
import AuthWrapper from 'sections/auth/AuthWrapper';

export default function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    const queryParams = new URLSearchParams(location.search);
    const token = queryParams.get('token');
    if (token) {
      console.log('Token from URL:', token);
      localStorage.setItem('token', token);
    }
  }, [location]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    try {
      const res = await fetch('http://localhost:8080/api/v1/userDetail/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      });
      const data = await res.json();
      console.log('Login response:', data);

      if (data.status === 'SUCCESS') {
        const token = data.data.token;
        const user = data.data.user;

        localStorage.setItem('token', token);
        localStorage.setItem('userId', user.id);
        localStorage.setItem('user', JSON.stringify(user));

        const roleName = `ROLE_${user?.role?.name?.toUpperCase()}`;

        if (roleName === 'ROLE_ADMIN') {
          console.log('Redirecting to admin dashboard...');
          window.location.href = `http://localhost:3003?token=${token}`;
        } else if (roleName === 'ROLE_STAFF') {
          console.log('Redirecting to staff dashboard...');
          window.location.href = `http://localhost:3002?token=${token}`;
        } else {
          console.log('Invalid role, clearing session...');
          localStorage.removeItem('token');
          localStorage.removeItem('userId');
          localStorage.removeItem('user');
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