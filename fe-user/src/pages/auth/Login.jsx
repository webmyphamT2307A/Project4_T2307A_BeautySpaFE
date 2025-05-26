import { Link, useNavigate } from 'react-router-dom';
import { useState } from 'react';

// material-ui
import Grid from '@mui/material/Grid2';
import Stack from '@mui/material/Stack';
import Typography from '@mui/material/Typography';
import TextField from '@mui/material/TextField';
import Button from '@mui/material/Button';
import Alert from '@mui/material/Alert';

// project imports
import AuthWrapper from 'sections/auth/AuthWrapper';

// ================================|| JWT - LOGIN ||================================ //

export default function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const navigate = useNavigate();

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
    if (data.status === 'SUCCESS') {
  const token = data.data.token;
  const user = data.data.user;

  localStorage.setItem('token', token); 
  localStorage.setItem('user', JSON.stringify(user)); 
  localStorage.setItem('role', user.role.name); 
  // Chuyển hướng đến trang chính
  navigate('/');
} else {
  setError(data.message || 'Đăng nhập thất bại');
}
  } catch (err) {
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
                onChange={e => setEmail(e.target.value)}
                required
              />
              <TextField
                label="Mật khẩu"
                type="password"
                value={password}
                onChange={e => setPassword(e.target.value)}
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