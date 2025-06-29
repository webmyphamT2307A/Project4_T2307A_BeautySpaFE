import { Link, useNavigate } from 'react-router-dom';
import { useState } from 'react';
import Cookies from 'js-cookie';

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
  const [branchId, setBranchId] = useState('');
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
        })
      });
      const data = await res.json();
      if (data.status === 'SUCCESS') {
        // Nếu backend trả về token và user sau đăng ký, thực hiện lưu cookie và redirect
        const token = data.data?.token;
        const user = data.data?.user;
        if (token && user && user.role?.name) {
          const roleName = `ROLE_${user.role.name.toUpperCase()}`;
          if (roleName === 'ROLE_ADMIN') {
            Cookies.set('admin_token', token, { path: '/admin', sameSite: 'Strict', expires: 7 });
            Cookies.set('admin_role', roleName, { path: '/admin', sameSite: 'Strict', expires: 7 });
            window.location.href = 'http://localhost:3003';
          } else if (roleName === 'ROLE_STAFF') {
            Cookies.set('staff_token', token, { path: '/staff', sameSite: 'Strict', expires: 7 });
            Cookies.set('staff_role', roleName, { path: '/staff', sameSite: 'Strict', expires: 7 });
            Cookies.set('staff_userId', user.id, { path: '/staff', sameSite: 'Strict', expires: 7 });
            window.location.href = 'http://localhost:3002';
          } else if (roleName === 'ROLE_MANAGER' || roleName === 'ROLE_MANAGE') {
            Cookies.set('manager_token', token, { path: '/manager', sameSite: 'Strict', expires: 7 });
            Cookies.set('manager_role', roleName, { path: '/manager', sameSite: 'Strict', expires: 7 });
            Cookies.set('manager_userId', user.id, { path: '/manager', sameSite: 'Strict', expires: 7 });
            window.location.href = 'http://localhost:3002';
          } else {
            Cookies.remove('admin_token', { path: '/admin' });
            Cookies.remove('admin_role', { path: '/admin' });
            Cookies.remove('staff_token', { path: '/staff' });
            Cookies.remove('staff_role', { path: '/staff' });
            Cookies.remove('manager_token', { path: '/manager' });
            Cookies.remove('manager_role', { path: '/manager' });
            setError('Vai trò không hợp lệ');
          }
        } else {
          setSuccess('Đăng ký thành công! Vui lòng đăng nhập.');
          setTimeout(() => navigate('/login'), 1500);
        }
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
            <Typography variant="h3">Đăng ký</Typography>
            <Typography component={Link} to="/login" variant="body1" sx={{ textDecoration: 'none' }} color="primary">
              Đã có tài khoản?
            </Typography>
          </Stack>
        </Grid>
        <Grid size={12}>
          <form onSubmit={handleSubmit}>
            <Stack spacing={2}>
              {error && <Alert severity="error">{error}</Alert>}
              {success && <Alert severity="success">{success}</Alert>}
              <TextField label="Họ tên" value={fullName} onChange={(e) => setFullName(e.target.value)} required />
              <TextField label="Email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} required />
              <TextField label="Mật khẩu" type="password" value={password} onChange={(e) => setPassword(e.target.value)} required />
              <TextField label="Số điện thoại" value={phone} onChange={(e) => setPhone(e.target.value)} required />
              <TextField label="Địa chỉ" value={address} onChange={(e) => setAddress(e.target.value)} required />
              <TextField label="Mã chi nhánh" value={branchId} onChange={(e) => setBranchId(e.target.value)} required />
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
