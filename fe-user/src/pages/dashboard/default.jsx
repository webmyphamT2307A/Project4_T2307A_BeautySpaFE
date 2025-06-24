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
import { format, getDate, getDaysInMonth, parse, getYear, isSameDay } from 'date-fns';
import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Cookies from 'js-cookie';
import { useAppointmentFilter } from 'contexts/AppointmentFilterContext';

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
  const navigate = useNavigate();
  const { setFilter } = useAppointmentFilter();
  const [loading, setLoading] = useState(true);
  const [userData, setUserData] = useState(null);
  const [workSchedule, setWorkSchedule] = useState([]);
  const [monthlySchedule, setMonthlySchedule] = useState([]);
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
        console.log('KIỂM TRA: Đang lấy dữ liệu cho userId =', userId); 
        const today = new Date();
        const todayStr = format(today, 'yyyy-MM-dd');
        const currentYear = getYear(today);

        // =================================================================
        // SỬ DỤNG CHÍNH XÁC CÁC API TỪ 4 MODULE BACKEND CỦA BẤN
        // =================================================================
        const currentMonth = today.getMonth() + 1;
        const requests = [
          // 1. Lịch làm việc hôm nay từ UsersScheduleController
          apiClient.get(`/users-schedules/user/${userId}`, {
            params: { startDate: todayStr, endDate: todayStr }
          }),
          
          // 2. Lịch làm việc cả tháng để hiển thị trên calendar
          apiClient.get(`/users-schedules/user/${userId}`, {
            params: { month: currentMonth, year: currentYear }
          }),
          
          // 3. Thống kê tổng quan từ StatisticController
          apiClient.get('/statistics/staff/summary', {
            params: { userId: userId }
          }),
          
          // 4. Dữ liệu rating hàng tháng cho biểu đồ từ StatisticController
          apiClient.get('/statistics/my-monthly-ratings', {
            params: { userId: userId, year: currentYear }
          })
        ];

        const [todayScheduleRes, monthlyScheduleRes, summaryRes, ratingsRes] = await Promise.allSettled(requests);

        // Xử lý kết quả lịch làm việc hôm nay
        if (todayScheduleRes.status === 'fulfilled' && todayScheduleRes.value.data.status === 'SUCCESS') {
          setWorkSchedule(todayScheduleRes.value.data.data);
        } else if (todayScheduleRes.status === 'rejected') {
          console.error('Error fetching today schedule:', todayScheduleRes.reason);
        }

        // Xử lý kết quả lịch làm việc cả tháng
        if (monthlyScheduleRes.status === 'fulfilled' && monthlyScheduleRes.value.data.status === 'SUCCESS') {
          setMonthlySchedule(monthlyScheduleRes.value.data.data);
        } else if (monthlyScheduleRes.status === 'rejected') {
          console.error('Error fetching monthly schedule:', monthlyScheduleRes.reason);
        }

        // Xử lý kết quả thống kê tổng quan (DashboardSummaryDto)
        if (summaryRes.status === 'fulfilled' && summaryRes.value.data.status === 'SUCCESS') {
          const summaryData = summaryRes.value.data.data;
          console.log('DEBUG: ĐỐI TƯỢNG SUMMARY NHẬN ĐƯỢC TỪ BACKEND:', summaryData);
          setDashboardSummary({
            waiting: summaryData.waitingCustomers || 0,
            served: summaryData.servedCustomersToday || 0,
            revenue: summaryData.todayRevenue || 0,
            monthlyServices: summaryData.servicesPerformedThisMonth || 0,
            avgRating: summaryData.overallAverageRating || 0 
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
        console.log('📅 Today Schedule:', todayScheduleRes);
        console.log('📅 Monthly Schedule:', monthlyScheduleRes);
        console.log('📊 Summary:', summaryRes);
        console.log('⭐ Monthly Ratings:', ratingsRes);

      } catch (error) {
        console.error('Error fetching dashboard data:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchDashboardData();
    
    // Set up auto refresh để cập nhật real-time khi có thay đổi appointment
    const interval = setInterval(() => {
      fetchDashboardData();
    }, 60000); // Refresh mỗi 60 giây

    return () => {
      clearInterval(interval);
    };
  }, [userId]);

  const getStatusChip = (status) => {
    let color = 'default';
    let translatedStatus = status;
    
    if (status === 'On Time') {
      color = 'success';
      translatedStatus = 'Đúng giờ';
    }
    if (status === 'Late') {
      color = 'warning';
      translatedStatus = 'Trễ';
    }
    if (status === 'Working') {
      color = 'primary';
      translatedStatus = 'Đang làm việc';
    }
    if (status === 'Present') {
      color = 'success';
      translatedStatus = 'Có mặt';
    }
    if (status === 'Absent') {
      color = 'error';
      translatedStatus = 'Vắng mặt';
    }
    if (status === 'pending') {
      color = 'warning';
      translatedStatus = 'Chờ xử lý';
    }
    if (status === 'confirmed') {
      color = 'primary';
      translatedStatus = 'Đã xác nhận';
    }
    if (status === 'completed') {
      color = 'success';
      translatedStatus = 'Hoàn thành';
    }
    if (status === 'cancelled') {
      color = 'error';
      translatedStatus = 'Đã hủy';
    }
    
    return <Chip label={translatedStatus || 'N/A'} color={color} size="small" sx={{ fontWeight: 600 }} />;
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

  // Kiểm tra ngày có lịch làm việc không
  const hasScheduleOnDate = (date) => {
    return monthlySchedule.some(schedule => 
      isSameDay(new Date(schedule.workDate), date)
    );
  };

  // Xử lý click vào ngày trên calendar
  const handleCalendarDateChange = (newDate) => {
    setCalendarDate(newDate);
    // Nếu ngày có lịch làm việc, chuyển đến trang work schedule
    if (hasScheduleOnDate(newDate)) {
      const dateParam = format(newDate, 'yyyy-MM-dd');
      navigate(`/roll_call/workSchedulePage?date=${dateParam}`);
    }
  };

  if (loading && !userId) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh', flexDirection: 'column', gap: 2 }}>
        <CircularProgress size={60} />
        <Typography variant="h6" color="primary">Đang tải bảng điều khiển của bạn...</Typography>
      </Box>
    );
  }

  const displayAverageRating = (dashboardSummary.avgRating || 0).toFixed(1);

  const statCards = [
    { 
      title: 'Khách hàng chờ', 
      count: dashboardSummary.waiting, 
      extra: 'Hôm nay', 
      icon: <UserOutlined />, 
      color: '#2962ff', 
      bg: '#e3f2fd',
      onClick: () => {
        setFilter({ status: 'pending' });
        navigate('/spa/appointments');
      }
    },
    { 
      title: 'Khách hàng đã phục vụ', 
      count: dashboardSummary.served, 
      extra: 'Hôm nay', 
      icon: <CheckCircleOutlined />, 
      color: '#2e7d32', 
      bg: '#e8f5e9',
      onClick: () => {
        setFilter({ status: 'completed' });
        navigate('/spa/appointments');
      }
    },
    { 
      title: 'Dịch vụ tháng này', 
      count: dashboardSummary.monthlyServices, 
      extra: 'Tháng này', 
      icon: <BarChartOutlined />, 
      color: '#ed6c02', 
      bg: '#fff3e0',
      onClick: () => {
        const today = new Date();
        const startDate = new Date(today.getFullYear(), today.getMonth(), 1).toISOString().split('T')[0];
        const endDate = new Date(today.getFullYear(), today.getMonth() + 1, 0).toISOString().split('T')[0];
        setFilter({ dateFilter: { startDate, endDate } });
        navigate('/spa/appointments');
      }
    },
    { 
      title: 'Đánh giá trung bình', 
      count: `${displayAverageRating}/10`, 
      extra: 'Xếp hạng của bạn', 
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
              👋 Xin chào, {userData?.fullName || 'Staff'}!
            </Typography>
            <Typography sx={{ opacity: 0.9, fontWeight: 500 }}>
              Chào mừng đến với tổng quan hiệu suất của bạn.
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
            <Paper
              elevation={0}
              onClick={stat.onClick}
              sx={{ 
                p: 3, 
                borderRadius: 3, 
                background: 'white',
                border: `1px solid ${stat.bg}`,
                position: 'relative',
                overflow: 'hidden',
                transition: 'all 0.3s ease',
                cursor: stat.onClick ? 'pointer' : 'default',
                '&:hover': stat.onClick ? {
                  transform: 'translateY(-4px)',
                  boxShadow: '0 8px 25px rgba(0,0,0,0.15)',
                  backgroundColor: stat.bg,
                } : {}
              }}
            >
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
                Lịch trình hôm nay
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
            <Stack direction="row" alignItems="center" justifyContent="space-between" sx={{ mb: 2, px: 1 }}>
              <Typography variant="h6" fontWeight={700} color="#2962ff">
                Lịch làm việc
              </Typography>
              <Tooltip title="Click vào ngày có chấm xanh để xem chi tiết lịch làm việc">
                <Box sx={{ 
                  display: 'flex', 
                  alignItems: 'center', 
                  gap: 1,
                  p: 1,
                  borderRadius: 1,
                  bgcolor: '#e3f2fd'
                }}>
                  <Box sx={{
                    width: 6,
                    height: 6,
                    borderRadius: '50%',
                    backgroundColor: '#2962ff'
                  }} />
                  <Typography variant="caption" color="#2962ff" fontWeight={500}>
                    Có lịch làm việc
                  </Typography>
                </Box>
              </Tooltip>
            </Stack>
            <LocalizationProvider dateAdapter={AdapterDateFns}>
              <DateCalendar 
                value={calendarDate} 
                onChange={handleCalendarDateChange}
                sx={{ 
                  width: '100%',
                  '.MuiPickersDay-root': {
                    position: 'relative',
                    '&.Mui-selected': {
                      backgroundColor: '#2962ff',
                      '&:hover': { backgroundColor: '#1e4ec7' }
                    }
                  }
                }}
              />
            </LocalizationProvider>
            
            {/* Hiển thị thông tin lịch làm việc trong tháng */}
            {monthlySchedule.length > 0 && (
              <Box sx={{ mt: 2, p: 2, bgcolor: '#f8f9fa', borderRadius: 2 }}>
                <Typography variant="subtitle2" color="text.secondary" gutterBottom>
                  Lịch làm việc tháng này:
                </Typography>
                <Stack direction="row" spacing={1} flexWrap="wrap">
                  {monthlySchedule
                    .filter(schedule => {
                      const scheduleDate = new Date(schedule.workDate);
                      return scheduleDate.getMonth() === calendarDate.getMonth() && 
                             scheduleDate.getFullYear() === calendarDate.getFullYear();
                    })
                    .map((schedule) => (
                      <Chip
                        key={schedule.id}
                        label={`${format(new Date(schedule.workDate), 'dd/MM')} - ${schedule.shift}`}
                        size="small"
                        color="primary"
                        variant="outlined"
                        onClick={() => {
                          const dateParam = format(new Date(schedule.workDate), 'yyyy-MM-dd');
                          navigate(`/roll_call/workSchedulePage?date=${dateParam}`);
                        }}
                        sx={{ 
                          cursor: 'pointer',
                          '&:hover': { backgroundColor: '#e3f2fd' }
                        }}
                      />
                    ))}
                </Stack>
              </Box>
            )}
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