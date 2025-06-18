// material-ui
import {
  Box,
  Button,
  Card,
  CardContent,
  Chip,
  CircularProgress,
  Grid,
  Paper,
  Stack,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Typography,
  Alert,
  MenuItem,
  Select,
  FormControl,
  InputLabel
} from '@mui/material';
import { format } from 'date-fns';
import { useEffect, useState } from 'react';
import axios from 'axios';
import Cookies from 'js-cookie';

// icons
import MoneyCollectOutlined from '@ant-design/icons/MoneyCollectOutlined';
import CalendarOutlined from '@ant-design/icons/CalendarOutlined';
import FileTextOutlined from '@ant-design/icons/FileTextOutlined';
import SearchOutlined from '@ant-design/icons/SearchOutlined';

// API client configuration
const apiClient = axios.create({
  baseURL: 'http://localhost:8080/api/v1',
  headers: {
    'Content-Type': 'application/json'
  }
});

export default function SalaryHistory() {
  const [loading, setLoading] = useState(true);
  const [salaryData, setSalaryData] = useState([]);
  const [error, setError] = useState('');
  const [userId, setUserId] = useState(null);
  const [userData, setUserData] = useState(null);
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());
  const [selectedMonth, setSelectedMonth] = useState('');

  useEffect(() => {
    const initializeUser = async () => {
      try {
        const token = Cookies.get('staff_token');
        const userIdFromCookie = Cookies.get('staff_userId');

        if (!token || !userIdFromCookie) {
          setError('Không tìm thấy thông tin đăng nhập');
          setLoading(false);
          return;
        }

        apiClient.defaults.headers.common['Authorization'] = `Bearer ${token}`;
        setUserId(userIdFromCookie);

        const userResponse = await apiClient.get('/userDetail/me');
        if (userResponse.data.status === 'SUCCESS') {
          setUserData(userResponse.data.data);
        }
      } catch (error) {
        console.error('Error initializing user:', error);
        setError('Có lỗi xảy ra khi lấy thông tin người dùng');
      }
    };

    initializeUser();
  }, []);

  const fetchSalaryData = async () => {
    if (!userId) return;

    setLoading(true);
    setError('');

    try {
      const params = { userId: userId };
      if (selectedYear) params.year = selectedYear;
      if (selectedMonth) params.month = selectedMonth;

      const response = await apiClient.get('/salaries/findSalary', { params });

      if (response.data.status === 'SUCCESS') {
        const salaries = response.data.data || [];
        setSalaryData(salaries);
      } else {
        setError('Không thể tải dữ liệu lương');
        setSalaryData([]);
      }
    } catch (error) {
      console.error('Error fetching salary data:', error);
      setError('Có lỗi xảy ra khi tải dữ liệu lương');
      setSalaryData([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSalaryData();
  }, [userId, selectedYear, selectedMonth]);

  const formatCurrency = (amount) => {
    if (!amount) return '0 ₫';
    return new Intl.NumberFormat('vi-VN', {
      style: 'currency',
      currency: 'VND'
    }).format(amount);
  };

  const formatDate = (dateString) => {
    try {
      const date = new Date(dateString);
      return date.toLocaleDateString('vi-VN');
    } catch {
      return 'N/A';
    }
  };

  const handleSearch = () => {
    fetchSalaryData();
  };

  const handleReset = () => {
    setSelectedYear(new Date().getFullYear());
    setSelectedMonth('');
  };

  const currentYear = new Date().getFullYear();
  const yearOptions = Array.from({ length: 5 }, (_, i) => currentYear - i);

  const monthOptions = [
    { value: 1, label: 'Tháng 1' },
    { value: 2, label: 'Tháng 2' },
    { value: 3, label: 'Tháng 3' },
    { value: 4, label: 'Tháng 4' },
    { value: 5, label: 'Tháng 5' },
    { value: 6, label: 'Tháng 6' },
    { value: 7, label: 'Tháng 7' },
    { value: 8, label: 'Tháng 8' },
    { value: 9, label: 'Tháng 9' },
    { value: 10, label: 'Tháng 10' },
    { value: 11, label: 'Tháng 11' },
    { value: 12, label: 'Tháng 12' }
  ];

  const getPaymentStatusChip = (paymentDate) => {
    const today = new Date();
    const payment = new Date(paymentDate);
    
    if (payment <= today) {
      return <Chip label="Đã thanh toán" color="success" size="small" />;
    } else {
      return <Chip label="Chưa thanh toán" color="warning" size="small" />;
    }
  };

  if (loading && !userId) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '60vh', flexDirection: 'column', gap: 2 }}>
        <CircularProgress size={60} />
        <Typography variant="h6" color="primary">Đang tải dữ liệu...</Typography>
      </Box>
    );
  }

  return (
    <Box sx={{ p: 3 }}>
      {/* Header */}
      <Paper elevation={0} sx={{ 
        mb: 3, 
        p: 3, 
        borderRadius: 3, 
        background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)', 
        color: 'white' 
      }}>
        <Stack direction="row" alignItems="center" spacing={2}>
          <Box sx={{
            bgcolor: 'rgba(255, 255, 255, 0.2)',
            borderRadius: '12px',
            width: 60,
            height: 60,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center'
          }}>
            <MoneyCollectOutlined style={{ fontSize: '32px' }} />
          </Box>
          <Box>
            <Typography variant="h4" fontWeight={700}>
              Lịch sử thu nhập
            </Typography>
            <Typography sx={{ opacity: 0.9, fontWeight: 500 }}>
              Xem chi tiết thu nhập và lương thưởng của bạn
            </Typography>
          </Box>
        </Stack>
      </Paper>

      {/* User Info */}
      {userData && (
        <Card sx={{ mb: 3, borderRadius: 3, border: '1px solid #f0f0f0' }}>
          <CardContent>
            <Typography variant="h6" gutterBottom color="primary" fontWeight={600}>
              Thông tin cá nhân
            </Typography>
            <Grid container spacing={2}>
              <Grid item xs={12} sm={6}>
                <Typography variant="body2" color="text.secondary">Họ và tên:</Typography>
                <Typography variant="body1" fontWeight={600}>{userData.fullName}</Typography>
              </Grid>
              <Grid item xs={12} sm={6}>
                <Typography variant="body2" color="text.secondary">Email:</Typography>
                <Typography variant="body1" fontWeight={600}>{userData.email}</Typography>
              </Grid>
            </Grid>
          </CardContent>
        </Card>
      )}

      {/* Filters */}
      <Card sx={{ mb: 3, borderRadius: 3, border: '1px solid #f0f0f0' }}>
        <CardContent>
          <Typography variant="h6" gutterBottom color="primary" fontWeight={600} sx={{ mb: 2 }}>
            Bộ lọc tìm kiếm
          </Typography>
          <Grid container spacing={3} alignItems="center">
            <Grid item xs={12} sm={4}>
              <FormControl fullWidth>
                <InputLabel>Năm</InputLabel>
                <Select
                  value={selectedYear}
                  label="Năm"
                  onChange={(e) => setSelectedYear(e.target.value)}
                >
                  {yearOptions.map(year => (
                    <MenuItem key={year} value={year}>{year}</MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12} sm={4}>
              <FormControl fullWidth>
                <InputLabel>Tháng</InputLabel>
                <Select
                  value={selectedMonth}
                  label="Tháng"
                  onChange={(e) => setSelectedMonth(e.target.value)}
                >
                  <MenuItem value="">Tất cả</MenuItem>
                  {monthOptions.map(month => (
                    <MenuItem key={month.value} value={month.value}>{month.label}</MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12} sm={4}>
              <Stack direction="row" spacing={1}>
                <Button
                  variant="contained"
                  startIcon={<SearchOutlined />}
                  onClick={handleSearch}
                  sx={{ borderRadius: 2 }}
                >
                  Tìm kiếm
                </Button>
                <Button
                  variant="outlined"
                  onClick={handleReset}
                  sx={{ borderRadius: 2 }}
                >
                  Đặt lại
                </Button>
              </Stack>
            </Grid>
          </Grid>
        </CardContent>
      </Card>

      {/* Error Alert */}
      {error && (
        <Alert severity="error" sx={{ mb: 3, borderRadius: 2 }}>
          {error}
        </Alert>
      )}

      {/* Salary Table */}
      <Card sx={{ borderRadius: 3, border: '1px solid #f0f0f0' }}>
        <CardContent>
          <Typography variant="h6" gutterBottom color="primary" fontWeight={600} sx={{ mb: 2 }}>
            Danh sách thu nhập
          </Typography>
          
          {loading ? (
            <Box sx={{ display: 'flex', justifyContent: 'center', p: 4 }}>
              <CircularProgress />
            </Box>
          ) : salaryData.length > 0 ? (
            <TableContainer>
              <Table>
                <TableHead>
                  <TableRow sx={{ backgroundColor: '#f8f9fa' }}>
                    <TableCell sx={{ fontWeight: 600 }}>Kỳ lương</TableCell>
                    <TableCell sx={{ fontWeight: 600 }}>Lương cơ bản</TableCell>
                    <TableCell sx={{ fontWeight: 600 }}>Thưởng</TableCell>
                    <TableCell sx={{ fontWeight: 600 }}>Khấu trừ</TableCell>
                    <TableCell sx={{ fontWeight: 600 }}>Lương thực nhận</TableCell>
                    <TableCell sx={{ fontWeight: 600 }}>Ngày thanh toán</TableCell>
                    <TableCell sx={{ fontWeight: 600 }}>Trạng thái</TableCell>
                    <TableCell sx={{ fontWeight: 600 }}>Ghi chú</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {salaryData.map((salary) => (
                    <TableRow key={salary.id} sx={{ '&:hover': { backgroundColor: '#f8f9fa' } }}>
                      <TableCell>
                        <Box>
                          <Typography variant="body2" fontWeight={600}>
                            {salary.month}/{salary.year}
                          </Typography>
                          <Typography variant="caption" color="text.secondary">
                            <CalendarOutlined style={{ marginRight: 4 }} />
                            {formatDate(salary.createdAt)}
                          </Typography>
                        </Box>
                      </TableCell>
                      <TableCell>
                        <Typography variant="body2" fontWeight={600} color="primary">
                          {formatCurrency(salary.baseSalary)}
                        </Typography>
                      </TableCell>
                      <TableCell>
                        <Typography variant="body2" fontWeight={600} color="success.main">
                          {formatCurrency(salary.bonus)}
                        </Typography>
                      </TableCell>
                      <TableCell>
                        <Typography variant="body2" fontWeight={600} color="error.main">
                          {formatCurrency(salary.deductions)}
                        </Typography>
                      </TableCell>
                      <TableCell>
                        <Typography variant="body1" fontWeight={700} color="primary">
                          {formatCurrency(salary.totalSalary)}
                        </Typography>
                      </TableCell>
                      <TableCell>
                        <Typography variant="body2">
                          {formatDate(salary.paymentDate)}
                        </Typography>
                      </TableCell>
                      <TableCell>
                        {getPaymentStatusChip(salary.paymentDate)}
                      </TableCell>
                      <TableCell>
                        {salary.notes ? (
                          <Typography variant="body2" color="text.secondary" sx={{ maxWidth: 150 }}>
                            {salary.notes}
                          </Typography>
                        ) : (
                          <Typography variant="body2" color="text.disabled" fontStyle="italic">
                            Không có ghi chú
                          </Typography>
                        )}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
          ) : (
            <Box sx={{ 
              display: 'flex', 
              flexDirection: 'column', 
              alignItems: 'center', 
              p: 6,
              bgcolor: '#f8f9fa',
              borderRadius: 2,
              border: '1px dashed #e0e0e0'
            }}>
              <FileTextOutlined style={{ fontSize: '64px', color: '#90caf9', marginBottom: '16px' }} />
              <Typography variant="h6" color="text.secondary" gutterBottom>
                Chưa có dữ liệu lương
              </Typography>
              <Typography variant="body2" color="text.secondary" textAlign="center">
                Hiện tại chưa có bản ghi lương nào cho kỳ này.<br/>
                Vui lòng liên hệ phòng nhân sự để biết thêm chi tiết.
              </Typography>
            </Box>
          )}
        </CardContent>
      </Card>

      {/* Summary */}
      {salaryData.length > 0 && (
        <Card sx={{ mt: 3, borderRadius: 3, border: '1px solid #f0f0f0' }}>
          <CardContent>
            <Typography variant="h6" gutterBottom color="primary" fontWeight={600}>
              Tổng kết
            </Typography>
            <Grid container spacing={3}>
              <Grid item xs={12} sm={3}>
                <Box sx={{ textAlign: 'center', p: 2, bgcolor: '#e3f2fd', borderRadius: 2 }}>
                  <Typography variant="h5" fontWeight={700} color="primary">
                    {salaryData.length}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Số kỳ lương
                  </Typography>
                </Box>
              </Grid>
              <Grid item xs={12} sm={3}>
                <Box sx={{ textAlign: 'center', p: 2, bgcolor: '#e8f5e9', borderRadius: 2 }}>
                  <Typography variant="h6" fontWeight={700} color="success.main">
                    {formatCurrency(salaryData.reduce((sum, item) => sum + (item.baseSalary || 0), 0))}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Tổng lương cơ bản
                  </Typography>
                </Box>
              </Grid>
              <Grid item xs={12} sm={3}>
                <Box sx={{ textAlign: 'center', p: 2, bgcolor: '#fff3e0', borderRadius: 2 }}>
                  <Typography variant="h6" fontWeight={700} color="warning.main">
                    {formatCurrency(salaryData.reduce((sum, item) => sum + (item.bonus || 0), 0))}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Tổng thưởng
                  </Typography>
                </Box>
              </Grid>
              <Grid item xs={12} sm={3}>
                <Box sx={{ textAlign: 'center', p: 2, bgcolor: '#f3e5f5', borderRadius: 2 }}>
                  <Typography variant="h6" fontWeight={700} color="secondary.main">
                    {formatCurrency(salaryData.reduce((sum, item) => sum + (item.totalSalary || 0), 0))}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Tổng thực nhận
                  </Typography>
                </Box>
              </Grid>
            </Grid>
          </CardContent>
        </Card>
      )}
    </Box>
  );
}