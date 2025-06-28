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

// ================================|| JWT - REGISTER ||================================ //

export default function Register() {
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [phone, setPhone] = useState('');
  const [address, setAddress] = useState('');
  const [branchId, setBranchId] = useState(''); // Nếu có chi nhánh
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    try {
      const res = await fetch('http://localhost:8080/api/v1/userDetail/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          fullName,
          email,
          password,
          phone,
          address,
          branchId: branchId ? Number(branchId) : null
        }),
      });
      const data = await res.json();
      if (data.status === 'SUCCESS') {
        setSuccess('Đăng ký thành công! Vui lòng đăng nhập.');
        setTimeout(() => navigate('/login'), 1500);
      } else {
        setError(data.message || 'Đăng ký thất bại');
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
            <Typography variant="h3">Sign up</Typography>
            <Typography component={Link} to="/login" variant="body1" sx={{ textDecoration: 'none' }} color="primary">
              Already have an account?
            </Typography>
          </Stack>
        </Grid>
        <Grid size={12}>
          <form onSubmit={handleSubmit}>
            <Stack spacing={2}>
              {error && <Alert severity="error">{error}</Alert>}
              {success && <Alert severity="success">{success}</Alert>}
              <TextField
                label="Họ tên"
                value={fullName}
                onChange={e => setFullName(e.target.value)}
                required
              />
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
              <TextField
                label="Số điện thoại"
                value={phone}
                onChange={e => setPhone(e.target.value)}
                required
              />
              <TextField
                label="Địa chỉ"
                value={address}
                onChange={e => setAddress(e.target.value)}
                required
              />
          
              <Button type="submit" variant="contained" color="primary">
                Đăng ký
              </Button>
            </Stack>
          </form>
        </Grid>
      </Grid>
    </AuthWrapper>
  );
}