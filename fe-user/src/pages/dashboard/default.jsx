// material-ui
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
import { format, getDate, getDaysInMonth, parse } from 'date-fns';
import { useEffect, useState } from 'react';

// assets
import BarChartOutlined from '@ant-design/icons/BarChartOutlined';
import CalendarOutlined from '@ant-design/icons/CalendarOutlined';
import CheckCircleOutlined from '@ant-design/icons/CheckCircleOutlined';
import ClockCircleOutlined from '@ant-design/icons/ClockCircleOutlined';
import StarOutlined from '@ant-design/icons/StarOutlined';
import UserOutlined from '@ant-design/icons/UserOutlined';

// styles
import './dashboard.css';

export default function DashboardDefault() {
  const [loading, setLoading] = useState(true);
  const [userData, setUserData] = useState(null);
  const [workSchedule, setWorkSchedule] = useState([]);
  const [waitingCustomers, setWaitingCustomers] = useState(0);
  const [completedCustomers, setCompletedCustomers] = useState(0);
  const [dailyCustomers, setDailyCustomers] = useState({});
  const [monthlyServices, setMonthlyServices] = useState(0);
  const [averageRating, setAverageRating] = useState(0);
  const [monthlyRatings, setMonthlyRatings] = useState([]);
  const [chartData, setChartData] = useState({ xAxis: [], series: [] });
  const [calendarDate, setCalendarDate] = useState(new Date());

  useEffect(() => {
    const fetchDashboardData = async () => {
      setLoading(true);
      try {
        // Mock API calls
        const userDataResponse = await fakeApiCall('/api/users/profile', {
          user_id: 1,
          fullName: 'John Smith',
          username: 'john.smith',
          role: 'staff'
        });
        setUserData(userDataResponse);
        
        const scheduleResponse = await fakeApiCall('/api/users/schedule', [
          {
            us_id: 1,
            user_id: 1,
            shift: 'Morning (8:00 - 12:00)',
            work_date: '2025-05-31',
            check_in_time: '08:00:00',
            check_out_time: '12:00:00',
            status: 'On Time',
            is_last_task: 0,
            is_active: 1
          },
          {
            us_id: 2,
            user_id: 1,
            shift: 'Afternoon (13:00 - 17:00)',
            work_date: '2025-05-31',
            check_in_time: '13:00:00',
            check_out_time: '17:00:00',
            status: 'Working',
            is_last_task: 0,
            is_active: 1
          }
        ]);
        setWorkSchedule(scheduleResponse);
        
        const waitingResponse = await fakeApiCall('/api/customers/waiting-today', { count: 12 });
        setWaitingCustomers(waitingResponse.count);
        
        const completedResponse = await fakeApiCall('/api/customers/completed-today', { count: 28 });
        setCompletedCustomers(completedResponse.count);
        
        const currentMonth = format(new Date(), 'yyyy-MM');
        const dailyResponse = await fakeApiCall('/api/customers/daily', generateCalendarData(currentMonth));
        
        const dailyData = {};
        dailyResponse.forEach(item => {
          dailyData[item.date] = {
            count: item.count,
            shifts: item.shifts
          };
        });
        setDailyCustomers(dailyData);
        
        const monthlyResponse = await fakeApiCall('/api/services/monthly-stats', {
          count: 145,
          averageRating: 8.7
        });
        setMonthlyServices(monthlyResponse.count);
        setAverageRating(monthlyResponse.averageRating);
        
        const ratingsResponse = await fakeApiCall('/api/services/monthly-ratings', generateMonthlyRatings());
        setMonthlyRatings(ratingsResponse);
        
        const xAxisData = ratingsResponse.map(item => item.month);
        const seriesData = ratingsResponse.map(item => parseFloat(item.rating));
        
        setChartData({
          xAxis: [{ data: xAxisData, scaleType: 'band' }],
          series: [{ data: seriesData, label: 'Rating' }]
        });
        
      } catch (error) {
        console.error('Error fetching dashboard data:', error);
      } finally {
        setLoading(false);
      }
    };
    
    fetchDashboardData();
  }, []);

  const fakeApiCall = (url, mockData) => {
    return new Promise((resolve) => {
      setTimeout(() => {
        console.log(`Fake API call to: ${url}`);
        resolve(mockData);
      }, 600);
    });
  };

  const generateCalendarData = (monthStr) => {
    const [year, month] = monthStr.split('-');
    const daysInMonth = getDaysInMonth(new Date(parseInt(year), parseInt(month) - 1));
    const result = [];
    
    for (let i = 1; i <= daysInMonth; i++) {
      if (Math.random() > 0.3) {
        const date = `${monthStr}-${i.toString().padStart(2, '0')}`;
        const count = Math.floor(Math.random() * 30) + 5;
        
        const morningCount = Math.floor(count * 0.4);
        const afternoonCount = Math.floor(count * 0.3);
        const eveningCount = count - morningCount - afternoonCount;
        
        result.push({
          date,
          count,
          shifts: [
            { name: 'Morning', count: morningCount },
            { name: 'Afternoon', count: afternoonCount },
            { name: 'Evening', count: eveningCount }
          ]
        });
      }
    }
    
    return result;
  };

  const generateMonthlyRatings = () => {
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    return months.map(month => ({
      month,
      rating: (Math.random() * 2 + 7).toFixed(1)
    }));
  };

  const renderDay = (day) => {
    const dateStr = format(day, 'yyyy-MM-dd');
    const dailyData = dailyCustomers[dateStr];
    
    if (!dailyData) return null;
    
    const tooltipContent = (
      <div>
        <div><strong>Customers by Shift:</strong></div>
        {dailyData.shifts.map(shift => (
          <div key={shift.name}>
            {shift.name}: {shift.count} customers
          </div>
        ))}
      </div>
    );
    
    return (
      <Tooltip title={tooltipContent} arrow>
        <Badge 
          badgeContent={dailyData.count} 
          color="primary"
          sx={{ 
            '.MuiBadge-badge': { 
              fontSize: '0.65rem', 
              height: '18px', 
              minWidth: '18px',
              fontWeight: 600
            } 
          }}
        >
          <Box component="span" sx={{ mx: 1 }}>{getDate(day)}</Box>
        </Badge>
      </Tooltip>
    );
  };

  const getStatusChip = (status) => {
    let color = 'default';
    if (status === 'On Time') color = 'success';
    if (status === 'Late') color = 'warning';
    if (status === 'Working') color = 'primary';
    
    return (
      <Chip 
        label={status} 
        color={color} 
        size="small"
        sx={{ 
          fontWeight: 600,
          boxShadow: '0 2px 8px rgba(0, 0, 0, 0.06)',
          '&:hover': {
            transform: 'scale(1.05)',
            transition: 'transform 0.2s ease'
          }
        }} 
      />
    );
  };

  const parseTime = (timeStr) => {
    if (!timeStr) return null;
    return parse(timeStr, 'HH:mm:ss', new Date());
  };

  if (loading) {
    return (
      <Box sx={{
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        height: '100vh',
        background: '#ffffff',
        flexDirection: 'column',
        gap: 2
      }}>
        <CircularProgress size={60} sx={{ color: '#1976d2' }} />
        <Typography variant="h6" color="primary" sx={{ fontWeight: 500, letterSpacing: 0.5 }}>
          Loading your dashboard...
        </Typography>
      </Box>
    );
  }
  const renderCalendarDay = (day, _value, DayComponentProps) => {
    const dateStr = format(day, 'yyyy-MM-dd');
    const dailyData = dailyCustomers[dateStr];
    
    const isSelected = DayComponentProps.selected;
    
    // Style for days with data
    if (dailyData) {
      return (
        <Box className="calendar-day-with-data">
          <Tooltip 
            title={
              <div>
                <div><strong>Customers by Shift:</strong></div>
                {dailyData.shifts.map(shift => (
                  <div key={shift.name}>
                    {shift.name}: {shift.count} customers
                  </div>
                ))}
                <div style={{marginTop: '5px'}}><strong>Total: {dailyData.count}</strong></div>
              </div>
            } 
            arrow
          >
            <Box
              component="div"
              className={`calendar-day-bg ${isSelected ? 'calendar-day-bg-selected' : 'calendar-day-bg-data'}`}
            />
          </Tooltip>
          <Typography 
            className={`calendar-day-text ${isSelected ? 'calendar-day-text-selected' : 'calendar-day-text-data'}`}
          >
            {getDate(day)}
          </Typography>
        </Box>
      );
    }
    
    return null; // Use default rendering for other days
  };

  const selectedDateStr = format(calendarDate, 'yyyy-MM-dd');
  const selectedDateData = dailyCustomers[selectedDateStr];

  return (
    <Box sx={{
      background: '#f8f9fa',
      minHeight: '100vh',
      py: { xs: 2, md: 3 },
      px: { xs: 1, md: 3 },
      transition: 'background 0.3s'
    }}>
      {/* Header */}
      <Paper
        elevation={0}
        className="dashboard-header"
        sx={{
          mb: 4,
          p: { xs: 2.5, md: 3 },
          borderRadius: 4,
          background: 'linear-gradient(135deg, #0061ff 0%, #60efff 100%)',
          color: 'white',
          position: 'relative',
          overflow: 'hidden',
          border: 'none',
          boxShadow: '0 10px 40px -10px rgba(0, 97, 255, 0.3)'
        }}
      >
        <Box sx={{
          display: 'flex',
          flexDirection: { xs: 'column', md: 'row' },
          alignItems: { xs: 'flex-start', md: 'center' },
          justifyContent: 'space-between',
          position: 'relative',
          zIndex: 2
        }}>
          <Box>
            <Typography variant="h4" fontWeight={700} sx={{ mb: 1, letterSpacing: 0.5 }}>
              <span className="wave-emoji">👋</span> Hello, {userData?.fullName || userData?.username}!
            </Typography>
            <Typography variant="body1" sx={{ opacity: 0.9, fontWeight: 500 }}>
              Welcome to your dashboard. Here's your performance overview.
            </Typography>
          </Box>
          <Box sx={{ textAlign: { xs: 'left', md: 'right' }, mt: { xs: 2, md: 0 } }}>
            <Typography variant="h6" fontWeight={600} sx={{ letterSpacing: 0.5 }}>
              {format(new Date(), 'EEEE')}
            </Typography>
            <Typography variant="body2" sx={{ opacity: 0.9 }}>
              {format(new Date(), 'MMMM d, yyyy')}
            </Typography>
          </Box>
        </Box>
        
        {/* Decorative elements */}
        <Box className="header-circle header-circle-1" sx={{
          position: 'absolute',
          width: '200px',
          height: '200px',
          borderRadius: '50%',
          background: 'rgba(255, 255, 255, 0.1)',
          top: '-50px',
          right: '-50px'
        }} />
        <Box className="header-circle header-circle-2" sx={{
          position: 'absolute',
          width: '120px',
          height: '120px',
          borderRadius: '50%',
          background: 'rgba(255, 255, 255, 0.1)',
          bottom: '-30px',
          left: '10%'
        }} />
      </Paper>

      {/* Stats Cards */}
      <Grid container spacing={3} sx={{ mb: 3 }}>
        {[
          {
            title: "Waiting Customers",
            count: waitingCustomers,
            extra: "Today",
            icon: <UserOutlined />,
            color: "#2962ff",
            bg: "#e3f2fd"
          },
          {
            title: "Served Customers",
            count: completedCustomers,
            extra: "Today",
            icon: <CheckCircleOutlined />,
            color: "#2e7d32",
            bg: "#e8f5e9"
          },
          {
            title: "Total Services",
            count: monthlyServices,
            extra: "This Month",
            icon: <BarChartOutlined />,
            color: "#ed6c02",
            bg: "#fff3e0"
          },
          {
            title: "Average Rating",
            count: `${averageRating.toFixed(1)}/10`,
            extra: "This Month",
            icon: <StarOutlined />,
            color: "#f57c00",
            bg: "#fff8e1"
          }
        ].map((stat, idx) => (
          <Grid xs={12} sm={6} md={3} key={stat.title}>
            <Paper
              elevation={0}
              className="stat-card"
              sx={{
                p: 3,
                borderRadius: 3,
                background: 'white',
                border: `1px solid ${stat.bg}`,
                minHeight: 140,
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'space-between',
                boxShadow: '0 4px 20px rgba(0, 0, 0, 0.05)',
                transition: 'all 0.3s cubic-bezier(0.25, 0.8, 0.25, 1)',
                overflow: 'hidden',
                position: 'relative'
              }}
            >
              <Box sx={{
                position: 'absolute',
                right: 0,
                top: 0,
                width: '100px',
                height: '100px',
                borderRadius: '0 0 0 100%',
                background: stat.bg,
                opacity: 0.7,
                zIndex: 0
              }} />
              
              <Box sx={{ position: 'relative', zIndex: 1 }}>
                <Stack direction="row" alignItems="center" spacing={2} sx={{ mb: 2 }}>
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
                    boxShadow: `0 4px 12px rgba(0, 0, 0, 0.1)`
                  }}>
                    {stat.icon}
                  </Box>
                  <Typography variant="body2" fontWeight={600} color="text.secondary" sx={{ textTransform: 'uppercase', letterSpacing: 0.5 }}>
                    {stat.extra}
                  </Typography>
                </Stack>
                
                <Typography variant="h4" fontWeight={700} sx={{ mb: 0.5, color: stat.color }}>
                  {stat.count}
                </Typography>
                <Typography variant="subtitle1" fontWeight={600} color="text.secondary">
                  {stat.title}
                </Typography>
              </Box>
            </Paper>
          </Grid>
        ))}
      </Grid>

      {/* Main Content */}
      <Grid container alignItems="stretch">
        {/* Left Side */}
        <Grid sx={{ width: { xs: '100%', sm: '50%', md: '40%', lg: '40%'}, 
        marginRight:  {xs: '0%', sm: '0.5%', md: '1%', lg: '1%'}
        }} item>
          {/* Schedule */}
          <Paper
            elevation={0}
            className="content-card"
            sx={{
              mb: 3,
              p: { xs: 2, md: 3 },
              borderRadius: 3,
              bgcolor: 'white',
              minHeight: 260,
              display: 'flex',
              flexDirection: 'column',
              boxShadow: '0 4px 20px rgba(0, 0, 0, 0.05)',
              border: '1px solid #f0f0f0'
            }}
          >
            <Box sx={{
              display: 'flex',
              alignItems: 'center',
              mb: 3
            }}>
              <Box sx={{
                bgcolor: '#e3f2fd',
                borderRadius: '12px',
                width: 40,
                height: 40,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                mr: 2
              }}>
                <ClockCircleOutlined style={{ fontSize: '20px', color: '#2962ff' }} />
              </Box>
              <Typography variant="h6" fontWeight={700} color="#2962ff">
                Today's Schedule
              </Typography>
            </Box>
            
            {workSchedule.length > 0 ? (
              <TableContainer sx={{ borderRadius: 2, overflow: 'hidden' }}>
                <Table size="medium">
                  <TableBody>
                    {workSchedule.map((schedule) => (
                      <TableRow
                        key={schedule.us_id}
                        className="schedule-row"
                        sx={{
                          '&:last-child td, &:last-child th': { border: 0 },
                          transition: 'background 0.2s',
                          '&:hover': { backgroundColor: '#f8f9fa' },
                          borderBottom: '1px solid #f0f0f0'
                        }}
                      >
                        <TableCell>
                          <Stack direction="row" spacing={2} alignItems="center">
                            <Box sx={{
                              bgcolor: '#e3f2fd',
                              borderRadius: '10px',
                              width: 40,
                              height: 40,
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center'
                            }}>
                              <ClockCircleOutlined style={{ fontSize: '18px', color: '#2962ff' }} />
                            </Box>
                            <Box>
                              <Typography variant="subtitle1" fontWeight={600}>
                                {schedule.shift}
                              </Typography>
                              <Typography variant="caption" color="text.secondary">
                                {format(parse(schedule.work_date, 'yyyy-MM-dd', new Date()), 'EEEE, MMM d')}
                              </Typography>
                            </Box>
                          </Stack>
                        </TableCell>
                        <TableCell>
                          <Stack spacing={0.5}>
                            <Typography variant="body2" color="text.secondary">
                              <strong>Check-in:</strong> {schedule.check_in_time ? format(parseTime(schedule.check_in_time), 'HH:mm') : 'N/A'}
                            </Typography>
                            <Typography variant="body2" color="text.secondary">
                              <strong>Check-out:</strong> {schedule.check_out_time ? format(parseTime(schedule.check_out_time), 'HH:mm') : 'N/A'}
                            </Typography>
                          </Stack>
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
                justifyContent: 'center',
                alignItems: 'center',
                height: 180,
                flexDirection: 'column',
                bgcolor: '#f8f9fa',
                borderRadius: 2,
                border: '1px dashed #e0e0e0',
                flex: 1
              }}>
                <Box sx={{
                  width: 60,
                  height: 60,
                  borderRadius: '50%',
                  bgcolor: '#e3f2fd',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  mb: 2
                }}>
                  <ClockCircleOutlined style={{ fontSize: '28px', color: '#2962ff' }} />
                </Box>
                <Typography variant="h6" color="text.secondary" gutterBottom>
                  No schedule for today
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Enjoy your free time! 🌟
                </Typography>
              </Box>
            )}
          </Paper>

          {/* Calendar */}
          <Paper elevation={0} className="calendar-card">
            {/* Card header with gradient */}
            <Box className="calendar-header">
              <Box className="calendar-icon-container">
                <CalendarOutlined style={{ fontSize: '22px', color: '#2962ff' }} />
              </Box>
              <Typography variant="h6" className="calendar-title">
                Customer Calendar
              </Typography>
              <Box className="calendar-decorator" />
            </Box>
            
            <Box className="calendar-container">
              {/* Calendar */}
              <Box className="calendar-half">
                <LocalizationProvider dateAdapter={AdapterDateFns}>
                  <Box className="calendar-side">
                    <DateCalendar
                      value={calendarDate}
                      onChange={setCalendarDate}
                      renderDay={renderCalendarDay}
                      views={['day']}
                      sx={{
                        width: '100%',
                        flex: 1,
                        '.MuiPickersDay-root.Mui-selected': {
                          color: '#fff',
                          fontWeight: 600,
                          '&:hover': {
                            backgroundColor: '#1e4ec7',
                          }
                        },
                        '.MuiPickersDay-root': {
                          transition: 'all 0.2s ease',
                          borderRadius: 2,
                          fontWeight: 500,
                          margin: '2px',
                          height: '36px',
                          width: '36px',
                          '&:hover': {
                            backgroundColor: '#e3f2fd',
                            transform: 'scale(1.1)'
                          }
                        },
                        '.MuiDayCalendar-weekDayLabel': {
                          color: '#2962ff',
                          fontWeight: 600,
                          fontSize: '0.875rem'
                        },
                        '.MuiDayCalendar-header': {
                          '.MuiTypography-root': {
                            color: '#2962ff',
                            fontWeight: 600
                          }
                        },
                        '.MuiPickersCalendarHeader-label': {
                          fontWeight: 700,
                          fontSize: '1rem',
                          color: '#2962ff',
                          textTransform: 'uppercase',
                          letterSpacing: '1px'
                        },
                        '.MuiPickersCalendarHeader-switchViewButton': {
                          color: '#2962ff'
                        },
                        '.MuiPickersArrowSwitcher-button': {
                          color: '#2962ff',
                          '&:hover': {
                            backgroundColor: '#e3f2fd'
                          }
                        }
                      }}
                    />
                    <Box className="calendar-legend">
                      <Box className="legend-item">
                        <span className="legend-dot legend-dot-filled"></span>
                        Has customers
                      </Box>
                      <Box className="legend-item">
                        <span className="legend-dot legend-dot-empty"></span>
                        No data
                      </Box>
                    </Box>
                  </Box>
                </LocalizationProvider>
              </Box>
              
              {/* Date Details */}
              <Box className="calendar-half">
                {selectedDateData ? (
                  <Box className="date-details-card">
                    <Box className="details-header">
                      <Typography variant="h6" className="details-header-title">
                        {format(calendarDate, 'EEEE, MMMM d, yyyy')}
                      </Typography>
                      <Box className="header-circle-right" />
                      <Box className="header-circle-left" />
                    </Box>
                    
                    <Box className="details-content">
                      <Box className="shift-list">
                        {selectedDateData.shifts.map(shift => (
                          <Box 
                            key={shift.name} 
                            className={`shift-item ${shift.name === 'Morning' ? 'shift-morning' : shift.name === 'Afternoon' ? 'shift-afternoon' : 'shift-evening'}`}
                          >
                            <Box className="shift-info">
                              <Box className="shift-icon">
                                {shift.name === 'Morning' ? '🌅' : shift.name === 'Afternoon' ? '☀️' : '🌙'}
                              </Box>
                              <Box className="shift-details">
                                <Typography className="shift-title" variant="body1">
                                  {shift.name}
                                </Typography>
                                <Typography className="shift-time" variant="caption">
                                  {shift.name === 'Morning' ? '8:00 AM - 12:00 PM' : 
                                  shift.name === 'Afternoon' ? '1:00 PM - 5:00 PM' : 
                                  '6:00 PM - 10:00 PM'}
                                </Typography>
                              </Box>
                            </Box>
                            <Box className={`shift-count ${shift.name === 'Morning' ? 'shift-count-morning' : shift.name === 'Afternoon' ? 'shift-count-afternoon' : 'shift-count-evening'}`}>
                              <UserOutlined className="shift-count-icon" />
                              <span>{shift.count}</span>
                            </Box>
                          </Box>
                        ))}
                      </Box>
                    </Box>
                    
                    <Box className="total-section">
                      <Box className="total-container">
                        <Typography className="total-label">
                          Total Customers
                        </Typography>
                        <Box className="total-badge">
                          <UserOutlined className="total-icon" />
                          <Typography className="total-count">
                            {selectedDateData.count}
                          </Typography>
                        </Box>
                      </Box>
                    </Box>
                  </Box>
                ) : (
                  <Box className="date-details-card">
                    {/* Giữ lại header giống như khi có dữ liệu */}
                    <Box className="details-header">
                      <Typography variant="h6" className="details-header-title">
                        {format(calendarDate, 'EEEE, MMMM d, yyyy')}
                      </Typography>
                      <Box className="header-circle-right" />
                      <Box className="header-circle-left" />
                    </Box>
                    
                    {/* Content với thông báo không có dữ liệu */}
                    <Box className="details-content" sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                      <Box sx={{ 
                        display: 'flex', 
                        flexDirection: 'column', 
                        alignItems: 'center', 
                        justifyContent: 'center',
                        py: 3
                      }}>
                        <Box className="empty-icon-container">
                          <CalendarOutlined style={{ fontSize: '36px', color: '#2962ff' }} />
                        </Box>
                        <Typography variant="h6" className="empty-title">
                          No Data Available
                        </Typography>
                        <Typography variant="body2" className="empty-subtitle" sx={{ textAlign: 'center' }}>
                          No customer appointments scheduled for the selected date
                        </Typography>
                        <Typography variant="body2" className="empty-hint" sx={{ textAlign: 'center' }}>
                          Select another date from the calendar
                        </Typography>
                      </Box>
                    </Box>
                    
                    {/* Giữ footer giống như khi có dữ liệu */}
                    <Box className="total-section">
                      <Box className="total-container">
                        <Typography className="total-label">
                          Total Customers
                        </Typography>
                        <Box className="total-badge" sx={{ bgcolor: '#f5f5f5', boxShadow: 'none', color: 'text.secondary' }}>
                          <UserOutlined className="total-icon" style={{ color: '#9e9e9e' }} />
                          <Typography sx={{ fontWeight: 700, color: '#9e9e9e', fontSize: '1.1rem' }}>
                            0
                          </Typography>
                        </Box>
                      </Box>
                    </Box>
                  </Box>
                )}
              </Box>
            </Box>
          </Paper>
        </Grid>

        {/* Right Side - Chart */}
        <Grid sx={{ width: { xs: '100%', sm: '49.5%', md: '59%', lg: '59%'} }} item>
          <Paper
            elevation={0}
            className="content-card"
            sx={{
              p: { xs: 2, md: 3 },
              borderRadius: 3,
              bgcolor: 'white',
              height: '100%',
              minHeight: 400,
              display: 'flex',
              flexDirection: 'column',
              boxShadow: '0 4px 20px rgba(0, 0, 0, 0.05)',
              border: '1px solid #f0f0f0'
            }}
          >
            <Box sx={{
              display: 'flex',
              alignItems: 'center',
              mb: 3
            }}>
              <Box sx={{
                bgcolor: '#e3f2fd',
                borderRadius: '12px',
                width: 40,
                height: 40,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                mr: 2
              }}>
                <StarOutlined style={{ fontSize: '20px', color: '#2962ff' }} />
              </Box>
              <Typography variant="h6" fontWeight={700} color="#2962ff">
                Monthly Rating Chart
              </Typography>
            </Box>
            
            <Box sx={{ 
              flex: 1, 
              display: 'flex', 
              flexDirection: 'column', 
              justifyContent: 'center',
              border: '1px solid #f0f0f0',
              borderRadius: 3,
              overflow: 'hidden',
              p: 2,
              bgcolor: '#fafafa'
            }}>
              <LineChart
                height={350}
                series={[{
                  ...chartData.series[0],
                  area: true,
                  showMark: true,
                  color: '#2962ff'
                }]}
                xAxis={chartData.xAxis}
                yAxis={[{
                  min: 0,
                  max: 10,
                  label: 'Rating (out of 10)'
                }]}
                sx={{
                  '.MuiLineElement-root': {
                    strokeWidth: 3
                  },
                  '.MuiMarkElement-root': {
                    stroke: '#2962ff',
                    fill: '#fff',
                    strokeWidth: 2,
                    r: 5
                  },
                  '.MuiAreaElement-root': {
                    fill: 'url(#gradient)'
                  }
                }}
              />
              <svg width="0" height="0">
                <defs>
                  <linearGradient id="gradient" x1="0%" y1="0%" x2="0%" y2="100%">
                    <stop offset="0%" stopColor="#2962ff" stopOpacity="0.3" />
                    <stop offset="100%" stopColor="#2962ff" stopOpacity="0" />
                  </linearGradient>
                </defs>
              </svg>
            </Box>
            
            <Box sx={{ mt: 3, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <Typography fontWeight={600} color="text.secondary">
                Average Rating
              </Typography>
              <Box sx={{
                display: 'flex',
                alignItems: 'center',
                bgcolor: '#e3f2fd',
                borderRadius: 2,
                px: 2,
                py: 1
              }}>
                <StarOutlined style={{ color: '#ffc107', fontSize: '20px', marginRight: '8px' }} />
                <Typography fontWeight={700} color="#2962ff" fontSize="1.1rem">
                  {averageRating.toFixed(1)}/10
                </Typography>
              </Box>
            </Box>
          </Paper>
        </Grid>
      </Grid>
    </Box>
  );
}