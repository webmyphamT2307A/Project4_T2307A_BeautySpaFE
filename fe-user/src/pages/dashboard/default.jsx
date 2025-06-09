// material-ui
import axios from 'axios';
import Badge from '@mui/material/Badge';
import Box from '@mui/material/Box';
import Chip from '@mui/material/Chip';
import CircularProgress from '@mui/material/CircularProgress';
import Grid from '@mui/material/Grid2';
import Paper from '@mui/material/Paper';
import Stack from '@mui/material/Stack';
import Table from '@mui/material/Table';
import TableBody from '@mui/material/TableBody';
import TableCell from '@mui/material/TableCell';
import TableContainer from '@mui/material/TableContainer';
import TableRow from '@mui/material/TableRow';
import Tooltip from '@mui/material/Tooltip';
import Typography from '@mui/material/Typography';
import { LineChart } from '@mui/x-charts/LineChart';
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns';
import { DateCalendar } from '@mui/x-date-pickers/DateCalendar';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { format, getDate, getDaysInMonth, parse, getYear } from 'date-fns';
import { useEffect, useState } from 'react';
import Cookies from 'js-cookie';

// assets
import BarChartOutlined from '@ant-design/icons/BarChartOutlined';
import CalendarOutlined from '@ant-design/icons/CalendarOutlined';
import CheckCircleOutlined from '@ant-design/icons/CheckCircleOutlined';
import ClockCircleOutlined from '@ant-design/icons/ClockCircleOutlined';
import StarOutlined from '@ant-design/icons/StarOutlined';
import UserOutlined from '@ant-design/icons/UserOutlined';

// =================================================================
// CẤU HÌNH API CLIENT THEO ĐÚNG BACKEND CỦA BẤN
// =================================================================
const apiClient = axios.create({
  baseURL: 'http://localhost:8080/api/v1',
  headers: {
    'Content-Type': 'application/json'
  }
});

// styles
import './dashboard.css';

export default function DashboardDefault() {
  const [loading, setLoading] = useState(true);
  const [userData, setUserData] = useState(null);
  const [workSchedule, setWorkSchedule] = useState([]);
  const [dashboardSummary, setDashboardSummary] = useState({
    waiting: 0,
    served: 0,
    revenue: 0,
    monthlyServices: 0,
    avgRating: 0
  });
  const [chartData, setChartData] = useState({ xAxis: [], series: [] });
  const [calendarDate, setCalendarDate] = useState(new Date());
  const [userId, setUserId] = useState(null);

  // Lấy token và user ID lúc đầu
  useEffect(() => {
    const bootstrapUser = async () => {
      const token = Cookies.get('staff_token');
      const userIdFromCookie = Cookies.get('staff_userId');

      if (token && userIdFromCookie) {
        // Set Authorization header cho tất cả request
        apiClient.defaults.headers.common['Authorization'] = `Bearer ${token}`;
        setUserId(userIdFromCookie);
        
        try {
          // Gọi API lấy thông tin user từ UserController
          const response = await apiClient.get('/userDetail/me');
          if (response.data.status === 'SUCCESS') {
            setUserData(response.data.data);
          }
        } catch (error) {
          console.error('Failed to fetch initial user data:', error);
        }
      } else {
        console.error('Token or User ID not found in cookies');
        setLoading(false);
      }
    };
    bootstrapUser();
  }, []);

  // Lấy dữ liệu dashboard sau khi có userId
  useEffect(() => {
    if (!userId) return;

    const fetchDashboardData = async () => {
      setLoading(true);
      try {
        const today = new Date();
        const todayStr = format(today, 'yyyy-MM-dd');
        const currentYear = getYear(today);

        // =================================================================
        // SỬ DỤNG CHÍNH XÁC CÁC API TỪ 4 MODULE BACKEND CỦA BẤN
        // =================================================================
        const requests = [
          // 1. Lịch làm việc từ UsersScheduleController
          apiClient.get(`/users-schedules/user/${userId}`, {
            params: { startDate: todayStr, endDate: todayStr }
          }),
          
          // 2. Thống kê tổng quan từ StatisticController
          apiClient.get('/statistics/summary', {
            params: { userId: userId }
          }),
          
          // 3. Dữ liệu rating hàng tháng cho biểu đồ từ StatisticController
          apiClient.get('/statistics/my-monthly-ratings', {
            params: { userId: userId, year: currentYear }
          })
        ];

        const [scheduleRes, summaryRes, ratingsRes] = await Promise.allSettled(requests);

        // Xử lý kết quả lịch làm việc
        if (scheduleRes.status === 'fulfilled' && scheduleRes.value.data.status === 'SUCCESS') {
          setWorkSchedule(scheduleRes.value.data.data);
        } else if (scheduleRes.status === 'rejected') {
          console.error('Error fetching schedule:', scheduleRes.reason);
        }

        // Xử lý kết quả thống kê tổng quan (DashboardSummaryDto)
        if (summaryRes.status === 'fulfilled' && summaryRes.value.data.status === 'SUCCESS') {
          const summaryData = summaryRes.value.data.data;
          setDashboardSummary({
            waiting: summaryData.waiting || 0,
            served: summaryData.served || 0,
            revenue: summaryData.revenue || 0,
            monthlyServices: summaryData.monthlyServices || 0,
            avgRating: summaryData.avgRating || 0
          });
        } else if (summaryRes.status === 'rejected') {
          console.error('Error fetching summary:', summaryRes.reason);
        }
        
        // Xử lý kết quả rating hàng tháng cho biểu đồ (List<ChartDataDto>)
        if (ratingsRes.status === 'fulfilled' && ratingsRes.value.data.status === 'SUCCESS') {
          const ratingsData = ratingsRes.value.data.data; // List<ChartDataDto>
          if (Array.isArray(ratingsData) && ratingsData.length > 0) {
            const xAxisData = ratingsData.map(item => item.label); // ChartDataDto.label
            const seriesData = ratingsData.map(item => parseFloat(item.value) || 0); // ChartDataDto.value
            
            setChartData({
              xAxis: [{ data: xAxisData, scaleType: 'band' }],
              series: [{ data: seriesData, label: 'Rating' }]
            });
          } else {
            console.log("No rating data available for this period");
            setChartData({ xAxis: [], series: [{ data: [], label: 'Rating' }] });
          }
        } else if (ratingsRes.status === 'rejected') {
          console.error('Error fetching ratings for chart:', ratingsRes.reason);
        }

        console.log('✅ All API responses:');
        console.log('📅 Schedule:', scheduleRes);
        console.log('📊 Summary:', summaryRes);
        console.log('⭐ Monthly Ratings:', ratingsRes);

      } catch (error) {
        console.error('Error fetching dashboard data:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchDashboardData();
  }, [userId]);

  const getStatusChip = (status) => {
    let color = 'default';
    if (status === 'On Time') color = 'success';
    if (status === 'Late') color = 'warning';  
    if (status === 'Working') color = 'primary';
    if (status === 'Present') color = 'success';
    if (status === 'Absent') color = 'error';
    
    return <Chip label={status || 'N/A'} color={color} size="small" sx={{ fontWeight: 600 }} />;
  };

  const parseTime = (timeStr) => {
    if (!timeStr) return null;
    // Backend có thể trả về array [hour, minute, second] hoặc string "HH:mm:ss"
    if (Array.isArray(timeStr)) {
        return new Date(1970, 0, 1, timeStr[0] || 0, timeStr[1] || 0, timeStr[2] || 0);
    }
    return parse(timeStr, 'HH:mm:ss', new Date());
  };

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('vi-VN', {
      style: 'currency',
      currency: 'VND'
    }).format(amount);
  };

  if (loading && !userId) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh', flexDirection: 'column', gap: 2 }}>
        <CircularProgress size={60} />
        <Typography variant="h6" color="primary">Loading your dashboard...</Typography>
      </Box>
    );
  }

  const displayAverageRating = (dashboardSummary.avgRating || 0).toFixed(1);

  const statCards = [
    { 
      title: 'Waiting Customers', 
      count: dashboardSummary.waiting, 
      extra: 'Today', 
      icon: <UserOutlined />, 
      color: '#2962ff', 
      bg: '#e3f2fd' 
    },
    { 
      title: 'Served Customers', 
      count: dashboardSummary.served, 
      extra: 'Today', 
      icon: <CheckCircleOutlined />, 
      color: '#2e7d32', 
      bg: '#e8f5e9' 
    },
    { 
      title: 'Monthly Services', 
      count: dashboardSummary.monthlyServices, 
      extra: 'This Month', 
      icon: <BarChartOutlined />, 
      color: '#ed6c02', 
      bg: '#fff3e0' 
    },
    { 
      title: 'Average Rating', 
      count: `${displayAverageRating}/10`, 
      extra: 'Overall', 
      icon: <StarOutlined />, 
      color: '#f57c00', 
      bg: '#fff8e1' 
    }
  ];

  return (
    <Box sx={{ background: '#f8f9fa', minHeight: '100vh', p: 3 }}>
      {/* Header */}
      <Paper elevation={0} sx={{ 
        mb: 3, 
        p: 3, 
        borderRadius: 3, 
        background: 'linear-gradient(135deg, #0061ff 0%, #60efff 100%)', 
        color: 'white',
        position: 'relative',
        overflow: 'hidden'
      }}>
        <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ position: 'relative', zIndex: 2 }}>
          <Box>
            <Typography variant="h4" fontWeight={700}>
              👋 Hello, {userData?.fullName || 'Staff'}!
            </Typography>
            <Typography sx={{ opacity: 0.9, fontWeight: 500 }}>
              Welcome to your performance overview.
            </Typography>
          </Box>
          <Box sx={{ textAlign: 'right' }}>
            <Typography variant="h6" fontWeight={600}>{format(new Date(), 'EEEE')}</Typography>
            <Typography sx={{ opacity: 0.9 }}>{format(new Date(), 'MMMM d, yyyy')}</Typography>
          </Box>
        </Stack>
        
        {/* Decorative elements */}
        <Box sx={{
          position: 'absolute',
          width: '200px',
          height: '200px', 
          borderRadius: '50%',
          background: 'rgba(255, 255, 255, 0.1)',
          top: '-50px',
          right: '-50px'
        }} />
      </Paper>

      {/* Stats Cards */}
      <Grid container spacing={3} sx={{ mb: 3 }}>
        {statCards.map((stat) => (
          <Grid item xs={12} sm={6} md={3} key={stat.title}>
            <Paper elevation={0} sx={{ 
              p: 3, 
              borderRadius: 3, 
              background: 'white',
              border: `1px solid ${stat.bg}`,
              position: 'relative',
              overflow: 'hidden',
              transition: 'all 0.3s ease',
              '&:hover': {
                transform: 'translateY(-4px)',
                boxShadow: '0 8px 25px rgba(0,0,0,0.15)'
              }
            }}>
              {/* Background decoration */}
              <Box sx={{
                position: 'absolute',
                right: -20,
                top: -20,
                width: '100px',
                height: '100px',
                borderRadius: '50%',
                background: stat.bg,
                opacity: 0.6,
                zIndex: 0
              }} />
              
              <Stack spacing={2} sx={{ position: 'relative', zIndex: 1 }}>
                <Stack direction="row" justifyContent="space-between" alignItems="center">
                  <Typography fontWeight={600} color="text.secondary" variant="body2" sx={{ textTransform: 'uppercase', letterSpacing: 0.5 }}>
                    {stat.title}
                  </Typography>
                  <Box sx={{ 
                    bgcolor: stat.bg, 
                    color: stat.color, 
                    borderRadius: '12px', 
                    width: 48, 
                    height: 48, 
                    display: 'flex', 
                    alignItems: 'center', 
                    justifyContent: 'center', 
                    fontSize: 24,
                    boxShadow: `0 4px 12px ${stat.bg}`
                  }}>
                    {stat.icon}
                  </Box>
                </Stack>
                <Typography variant="h4" fontWeight={700} sx={{ color: stat.color }}>
                  {stat.count}
                </Typography>
                <Typography variant="caption" color="text.secondary" fontWeight={500}>
                  {stat.extra}
                </Typography>
              </Stack>
            </Paper>
          </Grid>
        ))}
      </Grid>

      {/* Main Content */}
      <Grid container spacing={3}>
        {/* Left Side */}
        <Grid item xs={12} lg={5}>
          {/* Schedule */}
          <Paper elevation={0} sx={{ p: 3, borderRadius: 3, mb: 3, border: '1px solid #f0f0f0' }}>
            <Stack direction="row" alignItems="center" spacing={2} sx={{ mb: 3 }}>
              <Box sx={{
                bgcolor: '#e3f2fd',
                borderRadius: '12px',
                width: 40,
                height: 40,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center'
              }}>
                <ClockCircleOutlined style={{ fontSize: '20px', color: '#2962ff' }} />
              </Box>
              <Typography variant="h6" fontWeight={700} color="#2962ff">
                Today's Schedule
              </Typography>
            </Stack>
            
            {workSchedule.length > 0 ? (
              <TableContainer>
                <Table size="small">
                  <TableBody>
                    {workSchedule.map((schedule) => (
                      <TableRow key={schedule.id || Math.random()} sx={{ '&:hover': { backgroundColor: '#f8f9fa' } }}>
                        <TableCell>
                          <Typography fontWeight={600}>{schedule.shift}</Typography>
                          <Typography variant="caption" color="text.secondary">
                            {schedule.checkInTime && schedule.checkOutTime ? 
                              `${format(parseTime(schedule.checkInTime), 'HH:mm')} - ${format(parseTime(schedule.checkOutTime), 'HH:mm')}` : 
                              'Full Day'
                            }
                          </Typography>
                        </TableCell>
                        <TableCell align="right">
                          {getStatusChip(schedule.status)}
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
                p: 4, 
                bgcolor: '#f8f9fa', 
                borderRadius: 3,
                border: '1px dashed #e0e0e0'
              }}>
                <ClockCircleOutlined style={{ fontSize: '48px', color: '#90caf9', marginBottom: '16px' }} />
                <Typography variant="h6" color="text.secondary" gutterBottom>No schedule for today</Typography>
                <Typography variant="body2" color="text.secondary">Enjoy your free time! 🌟</Typography>
              </Box>
            )}
          </Paper>
          
          {/* Calendar */}
          <Paper elevation={0} sx={{ p: 2, borderRadius: 3, border: '1px solid #f0f0f0' }}>
            <Typography variant="h6" fontWeight={700} sx={{ mb: 2, px: 1, color: '#2962ff' }}>
              Calendar
            </Typography>
            <LocalizationProvider dateAdapter={AdapterDateFns}>
              <DateCalendar 
                value={calendarDate} 
                onChange={setCalendarDate} 
                sx={{ 
                  width: '100%',
                  '.MuiPickersDay-root.Mui-selected': {
                    backgroundColor: '#2962ff',
                    '&:hover': { backgroundColor: '#1e4ec7' }
                  }
                }} 
              />
            </LocalizationProvider>
          </Paper>
        </Grid>
        
        {/* Right Side - Chart */}
        <Grid item xs={12} lg={7}>
          <Paper elevation={0} sx={{ 
            p: 3, 
            borderRadius: 3, 
            height: '100%', 
            display: 'flex', 
            flexDirection: 'column',
            border: '1px solid #f0f0f0'
          }}>
            <Stack direction="row" alignItems="center" spacing={2} sx={{ mb: 3 }}>
              <Box sx={{
                bgcolor: '#e3f2fd',
                borderRadius: '12px',
                width: 40,
                height: 40,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center'
              }}>
                <StarOutlined style={{ fontSize: '20px', color: '#2962ff' }} />
              </Box>
              <Typography variant="h6" fontWeight={700} color="#2962ff">
                Monthly Rating Chart
              </Typography>
            </Stack>
            
            <Box sx={{ 
              flex: 1, 
              display: 'flex', 
              alignItems: 'center', 
              justifyContent: 'center',
              bgcolor: '#fafafa',
              borderRadius: 2,
              border: '1px solid #f0f0f0',
              p: 2
            }}>
              {chartData.series[0]?.data.length > 0 ? (
                <Box sx={{ width: '100%', height: '350px' }}>
                  <LineChart
                    series={[{ 
                      data: chartData.series[0].data, 
                      area: true, 
                      showMark: true, 
                      color: '#f57c00',
                      label: 'Monthly Rating'
                    }]}
                    xAxis={chartData.xAxis}
                    yAxis={[{ 
                      min: 0,
                      max: 10,
                      label: 'Rating (out of 10)'
                    }]}
                    sx={{ 
                      '.MuiLineElement-root': { strokeWidth: 3 },
                      '.MuiMarkElement-root': { 
                        stroke: '#f57c00', 
                        fill: '#fff', 
                        strokeWidth: 2, 
                        r: 6 
                      },
                      '.MuiAreaElement-root': { 
                        fill: 'url(#gradient)' 
                      }
                    }}
                  />
                  <svg width="0" height="0">
                    <defs>
                      <linearGradient id="gradient" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#f57c00" stopOpacity={0.4} />
                        <stop offset="95%" stopColor="#f57c00" stopOpacity={0} />
                      </linearGradient>
                    </defs>
                  </svg>
                </Box>
              ) : (
                <Box sx={{ 
                  display: 'flex', 
                  flexDirection: 'column', 
                  alignItems: 'center', 
                  color: 'text.secondary',
                  p: 4
                }}>
                  <StarOutlined style={{ fontSize: '64px', marginBottom: '16px', color: '#f57c00' }} />
                  <Typography variant="h6" gutterBottom>No Rating Data Available</Typography>
                  <Typography variant="body2" textAlign="center">
                    There is no rating data recorded for this period.<br/>
                    Complete some services to get customer ratings! ⭐
                  </Typography>
                </Box>
              )}
            </Box>
            
            {/* Rating Summary */}
            <Box sx={{ mt: 3, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <Typography fontWeight={600} color="text.secondary">
                Overall Average Rating
              </Typography>
              <Box sx={{
                display: 'flex',
                alignItems: 'center',
                bgcolor: '#fff8e1',
                borderRadius: 2,
                px: 2,
                py: 1
              }}>
                <StarOutlined style={{ color: '#f57c00', fontSize: '20px', marginRight: '8px' }} />
                <Typography fontWeight={700} color="#f57c00" fontSize="1.1rem">
                  {displayAverageRating}/10
                </Typography>
              </Box>
            </Box>
          </Paper>
        </Grid>
      </Grid>
    </Box>
  );
}