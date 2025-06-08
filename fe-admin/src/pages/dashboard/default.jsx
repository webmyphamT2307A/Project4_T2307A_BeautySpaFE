import React, { useState, useEffect } from 'react';
import {
  Grid, Typography, Box, Avatar, Chip, Table, TableBody, TableCell,
  TableContainer, TableHead, TableRow, ButtonGroup, Button,
  Divider, List, ListItem, ListItemText,
  LinearProgress, IconButton, Dialog, DialogTitle, DialogContent,
  DialogActions
} from '@mui/material';
import {
  CalendarOutlined, TeamOutlined, UserOutlined, ClockCircleOutlined,
  DollarOutlined, StarOutlined, ScheduleOutlined, ShopOutlined, EyeOutlined,
  LeftOutlined, RightOutlined
} from '@ant-design/icons';
import MainCard from 'components/MainCard';
import AnalyticEcommerce from 'components/cards/statistics/AnalyticEcommerce';
import ReportAreaChart from 'sections/dashboard/default/ReportAreaChart';
import MonthlyBarChart from 'sections/dashboard/default/MonthlyBarChart';
import { format, isToday, parseISO, startOfMonth, endOfMonth,subDays } from 'date-fns';
import './dashboard.css';

// ĐỊA CHỈ API BACKEND CỦA BẠN
const API_BASE_URL = 'http://localhost:8080/api/v1';

const DashboardDefault = () => {
  // States
  const [currentTime, setCurrentTime] = useState(new Date());
  const [scheduleData, setScheduleData] = useState([]);
  const [waitingCustomers, setWaitingCustomers] = useState(0);
  const [servedCustomers, setServedCustomers] = useState(0);
  const [calendarData, setCalendarData] = useState([]);
  const [totalServices, setTotalServices] = useState(0);
  const [ratingData, setRatingData] = useState([]);
  const [ratingPeriod, setRatingPeriod] = useState(0);
  const [customerChartData, setCustomerChartData] = useState([]);
  const [revenueChartData, setRevenueChartData] = useState([]);
  const [currentShift, setCurrentShift] = useState('');
  const [todayAppointments, setTodayAppointments] = useState([]);
  const [selectedMonth, setSelectedMonth] = useState(new Date());
  const [customerGrowth, setCustomerGrowth] = useState('+0%');
  const [revenueGrowth, setRevenueGrowth] = useState('+0%');
  const [totalMonthlyRevenue, setTotalMonthlyRevenue] = useState(0);
  const [totalMonthlyCustomers, setTotalMonthlyCustomers] = useState(0);
  const [revenueTimeFrame, setRevenueTimeFrame] = useState('month');
  const [customerTimeFrame, setCustomerTimeFrame] = useState('month');
  const [revenueLoading, setRevenueLoading] = useState(false);
  const [customerLoading, setCustomerLoading] = useState(false);
  const [selectedDay, setSelectedDay] = useState(null);
  const [dayModalOpen, setDayModalOpen] = useState(false);
  const [scheduleTitle, setScheduleTitle] = useState('Staff Schedule');
  const [overallAverageRating, setOverallAverageRating] = useState('N/A');
  const [todayRevenue, setTodayRevenue] = useState('$0');

  const username = localStorage.getItem('username') || 'Admin';

  // Hàm gọi API chung, giúp mã sạch sẽ hơn
  const apiCall = async (endpoint, errorMessage) => {
    try {
      const response = await fetch(`${API_BASE_URL}${endpoint}`);
      if (!response.ok) throw new Error(`Network response error: ${response.statusText}`);
      const result = await response.json();
      if (result.status === 'SUCCESS') return result.data;
      throw new Error(result.message || errorMessage);
    } catch (error) {
      console.error(`API call failed for ${endpoint}:`, error);
      // Có thể thêm state để hiển thị lỗi trên UI nếu muốn
      return null;
    }
  };

  const determineShift = (time) => {
    const hour = time.getHours();
    if (hour >= 8 && hour < 12) return 'Morning (8:00-12:00)';
    if (hour >= 12 && hour < 17) return 'Afternoon (12:00-17:00)';
    if (hour >= 17 && hour < 21) return 'Evening (17:00-21:00)';
    return 'Closed (21:00-8:00)';
  };

  const formatApiDate = (date) => format(date, 'yyyy-MM-dd');

  // --- CÁC HÀM GỌI API ĐẦY ĐỦ ---

  const fetchDashboardSummary = async () => {
    const summary = await apiCall('/statistics/summary', 'Failed to fetch dashboard summary');
    if (summary) {
      setWaitingCustomers(summary.waitingCustomers || 0);
      setServedCustomers(summary.servedCustomersToday || 0);
      setTotalServices(summary.servicesPerformedThisMonth || 0);
      setOverallAverageRating(summary.overallAverageRating?.toFixed(1) || 'N/A');
      setTodayRevenue(`$${summary.todayRevenue?.toLocaleString('en-US') || 0}`);
    }
  };

  const fetchScheduleData = async () => {
    let dataFound = false;
    // Vòng lặp tìm kiếm, tối đa 7 ngày về trước để tránh lặp vô hạn
    for (let i = 0; i < 7; i++) {
      const dateToFetch = subDays(new Date(), i);
      const dateStr = formatApiDate(dateToFetch);

      const schedules = await apiCall(`/users-schedules?startDate=${dateStr}&endDate=${dateStr}`, `Failed to fetch schedule for ${dateStr}`);

      if (schedules && schedules.length > 0) {
        // ĐÃ TÌM THẤY DỮ LIỆU!
        dataFound = true;

        // Cập nhật tiêu đề để người dùng biết đang xem ngày nào
        if (i === 0) {
          setScheduleTitle('Staff Schedule (Today)');
        } else {
          setScheduleTitle(`Staff Schedule (${format(dateToFetch, 'MMM d')})`);
        }

        const mappedSchedules = schedules.map(item => ({
          user_id: item.userId,
          full_name: item.userName,
          role_name: item.roleName || 'N/A',
          branch: item.branchName || 'N/A',
          check_in_time: item.checkInTime,
          status: item.status || 'On Time',
          shift: item.shift,
          image_url: item.userImageUrl
        }));

        // Nếu là lịch của hôm nay, thì lọc theo ca hiện tại
        // Nếu là lịch của ngày cũ, thì hiển thị ca cuối cùng có người làm
        let dataToShow = [];
        if (i === 0) {
          const shiftNameToFilter = determineShift(new Date()).split(' ')[0];
          dataToShow = mappedSchedules.filter(staff => staff.shift?.toLowerCase().includes(shiftNameToFilter.toLowerCase()));
        }

        // Fallback logic (nếu ca hiện tại trống hoặc xem ngày cũ)
        if (dataToShow.length === 0) {
          if (mappedSchedules.some(s => s.shift?.toLowerCase().includes('evening'))) {
            dataToShow = mappedSchedules.filter(staff => staff.shift?.toLowerCase().includes('evening'));
          } else if (mappedSchedules.some(s => s.shift?.toLowerCase().includes('afternoon'))) {
            dataToShow = mappedSchedules.filter(staff => staff.shift?.toLowerCase().includes('afternoon'));
          } else {
            dataToShow = mappedSchedules; // Lấy tất cả nếu không có ca chiều/tối
          }
        }

        setScheduleData(dataToShow);
        break; // Thoát khỏi vòng lặp khi đã tìm thấy dữ liệu
      }
    }

    // Nếu sau 7 ngày tìm kiếm vẫn không có dữ liệu
    if (!dataFound) {
      setScheduleTitle('Staff Schedule (No recent data)');
      setScheduleData([]);
    }
  };

  const fetchCalendarData = async () => {
    const start = formatApiDate(startOfMonth(selectedMonth));
    const end = formatApiDate(endOfMonth(selectedMonth));
    const appointments = await apiCall(`/admin/appointment?startDate=${start}&endDate=${end}`, 'Failed to fetch appointments for calendar');
    if (appointments) {
      const customerCountsByDay = {};
      appointments.forEach(app => {
        const appDate = format(parseISO(app.appointmentDate), 'yyyy-MM-dd');
        customerCountsByDay[appDate] = (customerCountsByDay[appDate] || 0) + 1;
      });
      const monthDays = [];
      for (let day = new Date(startOfMonth(selectedMonth)); day <= endOfMonth(selectedMonth); day.setDate(day.getDate() + 1)) {
        const dateStr = format(day, 'yyyy-MM-dd');
        monthDays.push({ date: dateStr, dayOfMonth: day.getDate(), isWeekend: [0, 6].includes(day.getDay()), totalCustomers: customerCountsByDay[dateStr] || 0, shifts: {} });
      }
      setCalendarData(monthDays);
    }
  };

  const fetchRatingData = async () => {

    const periodParam = ratingPeriod === 0 ? 'this_month' : 'last_month';
    const ratings = await apiCall(`/statistics/role-ratings?period=${periodParam}`, 'Failed to fetch rating data');
    if (ratings) {
      const mappedRatings = ratings.map(item => ({ role_id: item.roleName, role_name: item.roleName, average_rating: item.averageRating.toFixed(1), total_reviews: item.totalReviews }));
      setRatingData(mappedRatings);
    }
  };

  const fetchRevenueChartData = async () => {
    setRevenueLoading(true);
    const endpoint = revenueTimeFrame === 'month' ? `/statistics/revenue-by-month?year=${new Date().getFullYear()}` : '/statistics/revenue-by-year';
    const data = await apiCall(endpoint, 'Failed to get revenue data');
    if (data) {
      const formattedData = data.map(item => ({ name: item.label, data: item.value }));
      setRevenueChartData(formattedData);
      if (revenueTimeFrame === 'month') {
        setTotalMonthlyRevenue(formattedData.reduce((sum, item) => sum + item.data, 0));
      }
    }
    setRevenueLoading(false);
  };

  const fetchCustomerChartData = async () => {
    setCustomerLoading(true);
    const endpoint = customerTimeFrame === 'month' ? `/statistics/customers-by-month?year=${new Date().getFullYear()}` : '/statistics/customers-by-year';
    const data = await apiCall(endpoint, 'Failed to get customer data');
    if (data) {
      const formattedData = data.map(item => ({ name: item.label, data: item.value }));
      setCustomerChartData(formattedData);
      if (customerTimeFrame === 'month') {
        setTotalMonthlyCustomers(formattedData.reduce((sum, item) => sum + item.data, 0));
      }
    }
    setCustomerLoading(false);
  };

  const fetchTodayAppointments = async () => {
    const todayStr = formatApiDate(new Date());
    // API sẽ trả về tất cả lịch hẹn của hôm nay
    const appointments = await apiCall(`/admin/appointment?date=${todayStr}`, 'Failed to fetch today\'s appointments');

    if (appointments) {
      const todayApps = appointments
        .map(app => ({
          appointment_id: app.id,
          customer_name: app.fullName,
          appointment_time: parseISO(app.appointmentDate), // Giữ lại object Date để so sánh
          service_name: app.serviceName,
          staff_name: app.userName,
          status: app.status
        }))
        // Sắp xếp tất cả lịch hẹn trong ngày theo thứ tự từ muộn nhất đến sớm nhất
        .sort((a, b) => b.appointment_time - a.appointment_time)

        // Lấy 5 cái đầu tiên (tức 5 cái mới nhất)
        .slice(0, 5)

        // Sắp xếp lại 5 cái này theo thứ tự từ sớm đến muộn để hiển thị cho đẹp
        .sort((a, b) => a.appointment_time - b.appointment_time);

      setTodayAppointments(todayApps);
    }
  };

  // --- USEEFFECT HOOKS ---
  useEffect(() => {
    fetchDashboardSummary();
    fetchScheduleData();
    fetchTodayAppointments();
    fetchRevenueChartData();
    fetchCustomerChartData();
    fetchRatingData();
  }, []);

  useEffect(() => {
    const timer = setInterval(() => {
      const now = new Date();
      setCurrentTime(now);
      const newShift = determineShift(now);
      if (newShift !== currentShift) {
        setCurrentShift(newShift);
        fetchScheduleData();
      }
    }, 60000);
    setCurrentShift(determineShift(new Date()));
    return () => clearInterval(timer);
  }, [currentShift]);

  useEffect(() => { fetchRevenueChartData(); }, [revenueTimeFrame]);
  useEffect(() => { fetchCustomerChartData(); }, [customerTimeFrame]);
  useEffect(() => { fetchCalendarData(); }, [selectedMonth]);
  useEffect(() => { fetchRatingData(); }, [ratingPeriod]);


  // Toàn bộ phần JSX trả về không thay đổi, vì nó chỉ đọc từ state.
  // ...
  // Dán toàn bộ phần `return (<Grid container...>);` của bạn vào đây.
  // ...

  const getStatusChip = (status) => {
    switch (status) {
      case 'On Time':
        return <Chip size="small" label={status} color="success" />;
      case 'Late':
        return <Chip size="small" label={status} color="warning" />;
      case 'Working':
        return <Chip size="small" label={status} color="info" />;
      default:
        return <Chip size="small" label={status || 'Unknown'} color="default" />;
    }
  };

  const getAppointmentStatusChip = (status) => {
    switch (status) {
      case 'pending':
        return <Chip size="small" label="Pending" color="warning" />;
      case 'confirmed':
        return <Chip size="small" label="Confirmed" color="primary" />;
      case 'completed':
        return <Chip size="small" label="Completed" color="success" />;
      case 'cancelled':
        return <Chip size="small" label="Cancelled" color="error" />;
      default:
        return <Chip size="small" label={status} color="default" />;
    }
  };

  const formatTime = (date) => {
    return format(date, 'h:mm a');
  };

  const RevenueChart = () => (
    <MainCard
      title={
        <Box display="flex" justifyContent="space-between" alignItems="center" width="100%">
          <Box display="flex" alignItems="center">
            <DollarOutlined style={{ marginRight: 8 }} />
            <Typography variant="h5">Revenue Trends</Typography>
          </Box>
          <ButtonGroup variant="outlined" size="small">
            <Button variant={revenueTimeFrame === 'month' ? 'contained' : 'outlined'} onClick={() => setRevenueTimeFrame('month')}>Monthly</Button>
            <Button variant={revenueTimeFrame === 'year' ? 'contained' : 'outlined'} onClick={() => setRevenueTimeFrame('year')}>Yearly</Button>
          </ButtonGroup>
        </Box>
      }
    >
      <Box p={2}>
        <Typography variant="subtitle1" mb={1} color="textSecondary">
          {revenueTimeFrame === 'month' ? `Monthly revenue breakdown for ${new Date().getFullYear()}` : 'Revenue comparison for the last 5 years'}
        </Typography>
        <Typography variant="h4" mb={2}>
          {revenueTimeFrame === 'month' ? `$${(totalMonthlyRevenue / 1000).toFixed(1)}K` : `${revenueGrowth} year-over-year growth`}
        </Typography>
        <Box className="chart-container" sx={{ position: 'relative' }}>
          {revenueLoading && <LinearProgress sx={{ position: 'absolute', width: '100%', top: '50%' }} />}
          <ReportAreaChart timeFrame={revenueTimeFrame} chartData={revenueChartData} />
        </Box>
      </Box>
    </MainCard>
  );

  const CustomerChart = () => (
    <MainCard
      title={
        <Box display="flex" justifyContent="space-between" alignItems="center" width="100%">
          <Box display="flex" alignItems="center">
            <TeamOutlined style={{ marginRight: 8 }} />
            <Typography variant="h5">Customer Trends</Typography>
          </Box>
          <ButtonGroup variant="outlined" size="small">
            <Button variant={customerTimeFrame === 'month' ? 'contained' : 'outlined'} onClick={() => setCustomerTimeFrame('month')}>Monthly</Button>
            <Button variant={customerTimeFrame === 'year' ? 'contained' : 'outlined'} onClick={() => setCustomerTimeFrame('year')}>Yearly</Button>
          </ButtonGroup>
        </Box>
      }
    >
      <Box p={2}>
        <Typography variant="subtitle1" mb={1} color="textSecondary">
          {customerTimeFrame === 'month' ? `Monthly customer count for ${new Date().getFullYear()}` : 'Customer growth over the last 5 years'}
        </Typography>
        <Typography variant="h4" mb={2}>
          {customerTimeFrame === 'month' ? `${totalMonthlyCustomers.toLocaleString()} customers` : `${customerGrowth} year-over-year growth`}
        </Typography>
        <Box className="chart-container" sx={{ position: 'relative' }}>
          {customerLoading && <LinearProgress sx={{ position: 'absolute', width: '100%', top: '50%' }} />}
          <MonthlyBarChart timeFrame={customerTimeFrame} chartData={customerChartData} />
        </Box>
      </Box>
    </MainCard>
  );

  return (
    <Grid container spacing={3}>
      <Grid item xs={12}>
        <Box className="greeting-card">
          <Box className="greeting-content">
            <Typography variant="h3" className="greeting-title">
              Good {currentTime.getHours() < 12 ? 'Morning' : currentTime.getHours() < 18 ? 'Afternoon' : 'Evening'}, {username}!
            </Typography>
            <Typography variant="body1" className="greeting-subtitle">
              Welcome to your Beauty Spa management dashboard
            </Typography>
            <Box className="greeting-info">
              <Chip icon={<ClockCircleOutlined />} label={`${format(currentTime, 'EEEE, MMMM d')} | ${format(currentTime, 'h:mm a')}`} variant="outlined" color="primary" />
              <Chip icon={<ScheduleOutlined />} label={`Current Shift: ${currentShift}`} variant="outlined" />
            </Box>
          </Box>
          <Box className="greeting-image" />
        </Box>
      </Grid>

      <Grid item xs={12} sm={6} md={3}>
        <AnalyticEcommerce title="Waiting Customers" count={waitingCustomers} extra={`${servedCustomers} served today`} color="warning" icon={<UserOutlined />} />
      </Grid>
      <Grid item xs={12} sm={6} md={3}>
        <AnalyticEcommerce title="Services This Month" count={totalServices} extra="Completed" icon={<ShopOutlined />} />
      </Grid>
      <Grid item xs={12} sm={6} md={3}>
        <AnalyticEcommerce title="Average Rating" count={overallAverageRating} extra="Overall staff rating" color="success" icon={<StarOutlined />} />
      </Grid>
      <Grid item xs={12} sm={6} md={3}>
        <AnalyticEcommerce title="Today's Revenue" count={todayRevenue} extra="From completed services" color="primary" icon={<DollarOutlined />} />
      </Grid>

      <Grid item xs={12} md={8}>
        <Grid container spacing={3}>
          <Grid item xs={12}>
            <MainCard title={<Box display="flex" alignItems="center"><ScheduleOutlined style={{ marginRight: 8 }} /><Typography variant="h5">{scheduleTitle}</Typography> </Box>}>
              <TableContainer>
                <Table size="small">
                  <TableHead><TableRow><TableCell>Staff</TableCell><TableCell>Role</TableCell><TableCell>Check In</TableCell><TableCell>Branch</TableCell><TableCell>Status</TableCell></TableRow></TableHead>
                  <TableBody>
                    {scheduleData.map((staff) => (
                      <TableRow key={staff.user_id}>
                        <TableCell><Box display="flex" alignItems="center"><Avatar src={staff.image_url} sx={{ width: 28, height: 28, mr: 1 }} />{staff.full_name}</Box></TableCell>
                        <TableCell>{staff.role_name}</TableCell>
                        <TableCell>{staff.check_in_time}</TableCell>
                        <TableCell>{staff.branch}</TableCell>
                        <TableCell>{getStatusChip(staff.status)}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </TableContainer>
            </MainCard>
          </Grid>
          <Grid item xs={12}><RevenueChart /></Grid>
          <Grid item xs={12}><CustomerChart /></Grid>
        </Grid>
      </Grid>

      <Grid item xs={12} md={4}>
        <Grid container spacing={3}>
          <Grid item xs={12}>{/* CustomerCalendar component would go here */}</Grid>
          <Grid item xs={12}>
            <MainCard title={<Box display="flex" justifyContent="space-between" alignItems="center" width="100%"><Box display="flex" alignItems="center"><StarOutlined style={{ marginRight: 8 }} /><Typography variant="h5">Staff Rating</Typography></Box><ButtonGroup variant="outlined" size="small"><Button variant={ratingPeriod === 0 ? 'contained' : 'outlined'} onClick={() => setRatingPeriod(0)}>This Month</Button><Button variant={ratingPeriod === 1 ? 'contained' : 'outlined'} onClick={() => setRatingPeriod(1)}>Last Month</Button></ButtonGroup></Box>}>
              <TableContainer>
                <Table size="small">
                  <TableHead><TableRow><TableCell>Role</TableCell><TableCell>Rating</TableCell><TableCell align="right">Reviews</TableCell></TableRow></TableHead>
                  <TableBody>
                    {ratingData.map((item) => (
                      <TableRow key={item.role_id}>
                        <TableCell>{item.role_name}</TableCell>
                        <TableCell><Box display="flex" alignItems="center" fontWeight="600">{item.average_rating}<LinearProgress variant="determinate" value={parseFloat(item.average_rating) * 10} sx={{ width: '50px', ml: 1, height: 6, borderRadius: 2 }} /></Box></TableCell>
                        <TableCell align="right">{item.total_reviews}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </TableContainer>
            </MainCard>
          </Grid>
          <Grid item xs={12}>
            <MainCard title={<Box display="flex" alignItems="center"><CalendarOutlined style={{ marginRight: 8 }} /><Typography variant="h5">Today's Appointments</Typography></Box>}>
              <List>
                {todayAppointments.map((appointment, index) => (
                  <React.Fragment key={appointment.appointment_id}>
                    <ListItem>
                      <ListItemText primary={appointment.customer_name} secondary={`${appointment.service_name} • ${appointment.staff_name}`} />
                      <Typography variant="body2" color="textSecondary">{formatTime(appointment.appointment_time)}</Typography>
                      <Box ml={2}>{getAppointmentStatusChip(appointment.status)}</Box>
                    </ListItem>
                    {index < todayAppointments.length - 1 && <Divider />}
                  </React.Fragment>
                ))}
              </List>
            </MainCard>
          </Grid>
        </Grid>
      </Grid>
    </Grid>
  );
};

export default DashboardDefault;