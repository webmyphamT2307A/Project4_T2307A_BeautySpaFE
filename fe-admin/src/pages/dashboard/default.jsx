import React, { useState, useEffect } from 'react';
import {
  Grid, Typography, Box, Avatar, Chip, Table, TableBody, TableCell,
  TableContainer, TableHead, TableRow, ButtonGroup, Button,
  Divider, List, ListItem, ListItemText,
  LinearProgress, IconButton, Dialog, DialogTitle, DialogContent, DialogActions, Tabs, Tab
} from '@mui/material';
import {
  CalendarOutlined, TeamOutlined, UserOutlined, ClockCircleOutlined,
  DollarOutlined, StarOutlined, ScheduleOutlined, ShopOutlined,
  LeftOutlined, RightOutlined, CloseOutlined
} from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';
import MainCard from 'components/MainCard';
import AnalyticEcommerce from 'components/cards/statistics/AnalyticEcommerce';
import ReportAreaChart from 'sections/dashboard/default/ReportAreaChart';
import MonthlyBarChart from 'sections/dashboard/default/MonthlyBarChart';
import { format, parseISO, startOfMonth, endOfMonth, subDays, getYear, getMonth } from 'date-fns';
import './dashboard.css';

// =================================================================
// CÁC COMPONENT CON (Đã được sửa để nhận đủ props)
// =================================================================

const CustomerCalendar = ({
  selectedMonth,
  setSelectedMonth,
  calendarData,
  handleDayClick,
  isStatsModalOpen,
  handleCloseModal,
  handleNavigateToAppointments,
  selectedDayStats,
  dialogView,
  setDialogView,
  dayAppointments,
  handleViewDetailsClick,
  getAppointmentStatusChip,
  formatTime
}) => {
  const prevMonth = () => {
    setSelectedMonth(prev => { const d = new Date(prev); d.setMonth(d.getMonth() - 1); return d; });
  };

  const nextMonth = () => {
    setSelectedMonth(prev => { const d = new Date(prev); d.setMonth(d.getMonth() + 1); return d; });
  };

  const currentMonth = () => {
    setSelectedMonth(new Date());
  };

  const isCurrentMonth = () => {
    const today = new Date();
    return (
      selectedMonth.getMonth() === today.getMonth() &&
      selectedMonth.getFullYear() === today.getFullYear()
    );
  };

  return (
    <>
      <MainCard
        title={
          <Box display="flex" alignItems="center" justifyContent="space-between">
            <Box display="flex" alignItems="center">
              <CalendarOutlined style={{ marginRight: 8 }} />
              <Typography variant="h5">Lịch Khách Hàng</Typography>
            </Box>
            <Box>
              <IconButton onClick={prevMonth} size="small"><LeftOutlined /></IconButton>
              <Button onClick={currentMonth} disabled={isCurrentMonth()} size="small" sx={{ mx: 1 }}>Hôm Nay</Button>
              <IconButton onClick={nextMonth} disabled={isCurrentMonth()} size="small"><RightOutlined /></IconButton>
            </Box>
          </Box>
        }
      >
        <Box sx={{ p: 1 }}>
          <TableContainer className="calendar-table-container">
            <Table size="small" className="calendar-table">
              <TableHead>
                <TableRow>
                  {['CN', 'T2', 'T3', 'T4', 'T5', 'T6', 'T7'].map((d) => (
                    <TableCell key={d} align="center">{d}</TableCell>
                  ))}
                </TableRow>
              </TableHead>
              <TableBody>
                {(() => {
                  const days = [...calendarData];
                  if (days.length === 0) return null;

                  const firstDay = new Date(selectedMonth.getFullYear(), selectedMonth.getMonth(), 1).getDay();
                  const daysInMonth = new Date(selectedMonth.getFullYear(), selectedMonth.getMonth() + 1, 0).getDate();
                  const totalCells = Math.ceil((firstDay + daysInMonth) / 7) * 7;

                  const rows = [];
                  let currentRowCells = [];

                  // Create all cells for the calendar grid
                  for (let i = 0; i < totalCells; i++) {
                    const dayNumber = i - firstDay + 1;
                    const isValidDay = dayNumber >= 1 && dayNumber <= daysInMonth;

                    if (isValidDay) {
                      // Find the corresponding day data
                      const dayData = days.find(d => d.dayOfMonth === dayNumber) || {
                        dayOfMonth: dayNumber,
                        totalCustomers: 0,
                        date: format(new Date(selectedMonth.getFullYear(), selectedMonth.getMonth(), dayNumber), 'yyyy-MM-dd'),
                        isWeekend: [0, 6].includes(new Date(selectedMonth.getFullYear(), selectedMonth.getMonth(), dayNumber).getDay())
                      };

                      currentRowCells.push(
                        <TableCell
                          key={`day-${dayNumber}`}
                          align="center"
                          onClick={() => handleDayClick(dayData)}
                          sx={{
                            cursor: dayData.totalCustomers > 0 ? 'pointer' : 'default',
                            background: dayData.isWeekend ? '#fafafa' : '#fff',
                            fontWeight: dayData.totalCustomers > 0 ? 600 : 400,
                            color: dayData.totalCustomers > 0 ? 'primary.main' : 'text.primary',
                            borderRadius: 1,
                            border: dayData.date === format(new Date(), 'yyyy-MM-dd') ? '2px solid #1976d2' : '1px solid #f0f0f0',
                            height: 60,
                            minHeight: 60,
                            maxHeight: 60,
                            width: `${100 / 7}%`,
                            position: 'relative',
                            verticalAlign: 'top',
                            '&:hover': {
                              background: dayData.totalCustomers > 0 ? '#e3f2fd' : (dayData.isWeekend ? '#f0f0f0' : '#f5f5f5'),
                              boxShadow: dayData.totalCustomers > 0 ? '0 2px 4px rgba(0,0,0,0.1)' : 'none'
                            },
                            transition: 'all 0.2s'
                          }}
                        >
                          <Box sx={{
                            display: 'flex',
                            flexDirection: 'column',
                            alignItems: 'center',
                            justifyContent: 'flex-start',
                            height: '100%',
                            py: 0.5
                          }}>
                            <Typography variant="body2" sx={{ fontWeight: 'inherit' }}>
                              {dayNumber}
                            </Typography>
                            {dayData.totalCustomers > 0 && (
                              <Chip
                                size="small"
                                color="primary"
                                label={`${dayData.totalCustomers}`}
                                sx={{
                                  mt: 0.5,
                                  fontSize: 10,
                                  height: 18,
                                  '& .MuiChip-label': {
                                    px: 0.5
                                  }
                                }}
                              />
                            )}
                          </Box>
                        </TableCell>
                      );
                    } else {
                      // Empty cell for days outside the current month
                      currentRowCells.push(
                        <TableCell
                          key={`empty-${i}`}
                          sx={{
                            height: 60,
                            width: `${100 / 7}%`,
                            border: '1px solid #f0f0f0',
                            backgroundColor: '#fafafa'
                          }}
                        />
                      );
                    }

                    // When we have 7 cells, create a new row
                    if (currentRowCells.length === 7) {
                      rows.push(
                        <TableRow key={`week-${Math.floor(i / 7)}`}>
                          {currentRowCells}
                        </TableRow>
                      );
                      currentRowCells = [];
                    }
                  }

                  return rows;
                })()}
              </TableBody>
            </Table>
          </TableContainer>
        </Box>
      </MainCard>

      <Dialog open={isStatsModalOpen} onClose={handleCloseModal} maxWidth="sm" fullWidth>
        {selectedDayStats && (
          <>
            <DialogTitle sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', pb: 1 }}>
              <Typography variant="h5" fontWeight={600}>
                {format(parseISO(selectedDayStats.date), 'EEEE, MMMM d, yyyy')}
              </Typography>
              <IconButton onClick={handleCloseModal}><CloseOutlined /></IconButton>
            </DialogTitle>
            <DialogContent dividers>
              {dialogView === 'stats' ? (
                <>
                  <Box mb={3}>
                    <Typography variant="h6" gutterBottom>Thống Kê Khách Hàng</Typography>
                    <Typography variant="body1">
                      Tổng khách hàng: <Chip label={selectedDayStats.totalCustomers} color="primary" sx={{ fontWeight: 600 }} />
                    </Typography>
                    <Typography variant="caption" color="textSecondary">
                      {selectedDayStats.isWeekend ? 'Cuối tuần (thường đông hơn)' : 'Ngày thường'}
                    </Typography>
                  </Box>
                  <Box>
                    <Typography variant="h6" gutterBottom>Phân Bố Theo Ca</Typography>
                    {selectedDayStats.shifts.map(shift => (
                      <Box key={shift.name} sx={{ mb: 2 }}>
                        <Box display="flex" justifyContent="space-between" alignItems="center">
                          <Typography variant="body1">{shift.name}</Typography>
                          <Typography variant="body2" color="textSecondary">{shift.count} khách hàng ({shift.percentage.toFixed(0)}%)</Typography>
                        </Box>
                        <LinearProgress variant="determinate" value={shift.percentage} sx={{ height: 8, borderRadius: 2, mt: 0.5 }} />
                      </Box>
                    ))}
                  </Box>
                </>
              ) : (
                <>
                  <Typography variant="h6" gutterBottom>Danh Sách Lịch Hẹn ({dayAppointments.length})</Typography>
                  <List sx={{ width: '100%', bgcolor: 'background.paper', p: 0 }}>
                    {dayAppointments.length > 0 ? dayAppointments.map((appointment, index) => (
                      <React.Fragment key={appointment.appointment_id}>
                        <ListItem alignItems="flex-start" sx={{ px: 0 }}>
                          <ListItemText
                            primary={<Typography variant="body1" color="text.primary">{appointment.customer_name}</Typography>}
                            secondary={
                              <>
                                <Typography component="span" variant="body2" color="text.secondary">{`Dịch vụ: ${appointment.service_name}`}</Typography><br />
                                <Typography component="span" variant="body2" color="text.secondary">{`Nhân viên: ${appointment.staff_name}`}</Typography>
                              </>
                            }
                          />
                          <Box sx={{ textAlign: 'right' }}>
                            <Typography variant="body2" color="text.primary">{formatTime(appointment.appointment_time)}</Typography>
                            <Box mt={0.5}>{getAppointmentStatusChip(appointment.status)}</Box>
                          </Box>
                        </ListItem>
                        {index < dayAppointments.length - 1 && <Divider component="li" />}
                      </React.Fragment>
                    )) : <ListItem><ListItemText primary="Không tìm thấy lịch hẹn nào cho ngày này." /></ListItem>}
                  </List>
                </>
              )}
            </DialogContent>
            <DialogActions sx={{ p: 2 }}>
              {dialogView === 'stats' ? (
                <>
                  <Button onClick={handleNavigateToAppointments} variant="contained">Xem Chi Tiết</Button>
                  <Button onClick={handleCloseModal} sx={{ ml: 1 }}>Đóng</Button>
                </>
              ) : (
                <>
                  <Button onClick={() => setDialogView('stats')}>Quay Lại Thống Kê</Button>
                  <Button onClick={handleCloseModal} sx={{ ml: 1 }}>Đóng</Button>
                </>
              )}
            </DialogActions>
          </>
        )}
      </Dialog>
    </>
  );
};

const RevenueChart = ({ revenueTimeFrame, setRevenueTimeFrame, totalMonthlyRevenue, revenueGrowth, revenueLoading, revenueChartData }) => (<MainCard title={<Box display="flex" justifyContent="space-between" alignItems="center" width="100%"> <Box display="flex" alignItems="center"> <DollarOutlined style={{ marginRight: 8 }} /> <Typography variant="h5">Xu Hướng Doanh Thu</Typography> </Box> <ButtonGroup variant="outlined" size="small"> <Button variant={revenueTimeFrame === 'month' ? 'contained' : 'outlined'} onClick={() => setRevenueTimeFrame('month')}>Theo Tháng</Button> <Button variant={revenueTimeFrame === 'year' ? 'contained' : 'outlined'} onClick={() => setRevenueTimeFrame('year')}>Theo Năm</Button> </ButtonGroup> </Box>} > <Box p={2}> <Typography variant="subtitle1" mb={1} color="textSecondary"> {revenueTimeFrame === 'month' ? `Phân tích doanh thu hàng tháng năm ${new Date().getFullYear()}` : 'So sánh doanh thu trong 5 năm qua'} </Typography> <Typography variant="h4" mb={2}> {revenueTimeFrame === 'month' ? new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(totalMonthlyRevenue) : `${revenueGrowth} tăng trưởng hàng năm`} </Typography> <Box className="chart-container" sx={{ position: 'relative' }}> {revenueLoading && <LinearProgress sx={{ position: 'absolute', width: '100%', top: '50%' }} />} <ReportAreaChart timeFrame={revenueTimeFrame} chartData={revenueChartData} /> </Box> </Box> </MainCard>);
const CustomerChart = ({ customerTimeFrame, setCustomerTimeFrame, totalMonthlyCustomers, customerGrowth, customerLoading, customerChartData }) => (<MainCard title={<Box display="flex" justifyContent="space-between" alignItems="center" width="100%"> <Box display="flex" alignItems="center"> <TeamOutlined style={{ marginRight: 8 }} /> <Typography variant="h5">Xu Hướng Khách Hàng</Typography> </Box> <ButtonGroup variant="outlined" size="small"> <Button variant={customerTimeFrame === 'month' ? 'contained' : 'outlined'} onClick={() => setCustomerTimeFrame('month')}>Theo Tháng</Button> <Button variant={customerTimeFrame === 'year' ? 'contained' : 'outlined'} onClick={() => setCustomerTimeFrame('year')}>Theo Năm</Button> </ButtonGroup> </Box>} > <Box p={2}> <Typography variant="subtitle1" mb={1} color="textSecondary"> {customerTimeFrame === 'month' ? `Số lượng khách hàng hàng tháng năm ${new Date().getFullYear()}` : 'Tăng trưởng khách hàng trong 5 năm qua'} </Typography> <Typography variant="h4" mb={2}> {customerTimeFrame === 'month' ? `${totalMonthlyCustomers.toLocaleString()} khách hàng` : `${customerGrowth} tăng trưởng hàng năm`} </Typography> <Box className="chart-container" sx={{ position: 'relative' }}> {customerLoading && <LinearProgress sx={{ position: 'absolute', width: '100%', top: '50%' }} />} <MonthlyBarChart timeFrame={customerTimeFrame} chartData={customerChartData} /> </Box> </Box> </MainCard>);

// =================================================================
// COMPONENT CHÍNH
// =================================================================
const DashboardDefault = () => {
  // States
  const [currentTime, setCurrentTime] = useState(new Date());
  const [fullScheduleData, setFullScheduleData] = useState([]);
  const [selectedShift, setSelectedShift] = useState('All');
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
  const [scheduleTitle, setScheduleTitle] = useState('Staff Schedule');
  const [overallAverageRating, setOverallAverageRating] = useState('N/A');
  const [todayRevenue, setTodayRevenue] = useState('$0');
  const [selectedDayStats, setSelectedDayStats] = useState(null);
  const [isStatsModalOpen, setIsStatsModalOpen] = useState(false);
  const [dialogView, setDialogView] = useState('stats');
  const [dayAppointments, setDayAppointments] = useState([]);

  const navigate = useNavigate();
  const username = localStorage.getItem('username') || 'Admin';
  const API_BASE_URL = 'http://localhost:8080/api/v1';

  const apiCall = async (endpoint, errorMessage) => {
    try {
      const response = await fetch(`${API_BASE_URL}${endpoint}`);
      if (!response.ok) throw new Error(`Network response error: ${response.statusText}`);
      const result = await response.json();
      if (result.status === 'SUCCESS') return result.data;
      throw new Error(result.message || errorMessage);
    } catch (error) {
      console.error(`API call failed for ${endpoint}:`, error);
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

  const fetchDashboardSummary = async () => {
    const summary = await apiCall('/statistics/admin/summary', 'Failed to fetch dashboard summary');
    if (summary) {
      setWaitingCustomers(summary.waitingCustomers || 0);
      setServedCustomers(summary.servedCustomersToday || 0);
      setTotalServices(summary.servicesPerformedThisMonth || 0);
      setOverallAverageRating(summary.overallAverageRating?.toFixed(1) || 'N/A');
      setTodayRevenue(`${summary.todayRevenue?.toLocaleString('en-US') || 0}₫`);
    }
  };
  const handleNavigateToAppointments = () => {
    if (selectedDayStats) {
      navigate(`/spa/appointments?date=${selectedDayStats.date}`);
    }
  };

  const fetchScheduleData = async () => {
    let dataFound = false;
    for (let i = 0; i < 7; i++) {
      const dateToFetch = subDays(new Date(), i);
      const dateStr = formatApiDate(dateToFetch);
      const schedules = await apiCall(`/users-schedules?startDate=${dateStr}&endDate=${dateStr}`, `Failed to fetch schedule for ${dateStr}`);
      if (schedules && schedules.length > 0) {
        dataFound = true;
        setScheduleTitle(`Lịch Trình Nhân Viên (${i === 0 ? 'Hôm Nay' : format(dateToFetch, 'MMM d')})`);
        const mappedSchedules = schedules.map(item => ({
          user_id: item.userId,
          full_name: item.userName,
          role_name: item.roleName || 'N/A',
          check_in_time: item.checkInTime,
          status: item.status || 'pending',
          shift: item.shift,
          image_url: item.userImageUrl
        }));
        setFullScheduleData(mappedSchedules);

        const currentShiftName = determineShift(new Date()).split(' ')[0];
        if (i === 0 && mappedSchedules.some(s => s.shift?.toLowerCase().includes(currentShiftName.toLowerCase()))) {
          setSelectedShift(currentShiftName);
        } else {
          setSelectedShift('All');
        }
        break;
      }
    }
    if (!dataFound) {
      setScheduleTitle('Staff Schedule (No recent data)');
      setFullScheduleData([]);
    }
  };

  const fetchCalendarData = async () => {
    const year = getYear(selectedMonth);
    const month = getMonth(selectedMonth) + 1;
    const monthlyReport = await apiCall(`/statistics/daily-customer-report?year=${year}&month=${month}`, 'Failed to fetch calendar data');

    if (monthlyReport) {
      const customerCountsByDay = new Map(monthlyReport.map(report => [report.date, report.count]));
      const monthDays = [];
      for (let day = new Date(startOfMonth(selectedMonth)); day <= endOfMonth(selectedMonth); day.setDate(day.getDate() + 1)) {
        const dateStr = formatApiDate(day);
        monthDays.push({
          date: dateStr,
          dayOfMonth: day.getDate(),
          isWeekend: [0, 6].includes(day.getDay()),
          totalCustomers: customerCountsByDay.get(dateStr) || 0
        });
      }
      setCalendarData(monthDays);
    }
  };

  const fetchRatingData = async () => {
    const periodParam = ratingPeriod === 0 ? 'this_month' : 'last_month';
    const ratings = await apiCall(`/statistics/role-ratings?period=${periodParam}`, 'Failed to fetch rating data');
    if (ratings) {
      setRatingData(ratings.map(item => ({
        role_id: item.roleName,
        role_name: item.roleName,
        average_rating: item.averageRating.toFixed(1),
        total_reviews: item.totalReviews
      })));
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
    const appointments = await apiCall(`/admin/appointment?date=${todayStr}`, 'Failed to fetch today\'s appointments');
    if (appointments) {
      setTodayAppointments(appointments.map(app => ({
        appointment_id: app.id,
        customer_name: app.fullName,
        appointment_time: parseISO(app.appointmentDate),
        service_name: app.serviceName,
        staff_name: app.userName,
        status: app.status
      })).sort((a, b) => a.appointment_time - b.appointment_time).slice(0, 5));
    }
  };

  useEffect(() => {
    fetchDashboardSummary();
    fetchScheduleData();
    fetchTodayAppointments();
    fetchRevenueChartData();
    fetchCustomerChartData();
    fetchRatingData();
  }, []);

  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 60000);
    return () => clearInterval(timer);
  }, []);

  useEffect(() => {
    const newShift = determineShift(new Date());
    if (newShift !== currentShift) {
      setCurrentShift(newShift);
      fetchScheduleData();
    }
  }, [currentTime, currentShift]);

  useEffect(() => { fetchRevenueChartData(); }, [revenueTimeFrame]);
  useEffect(() => { fetchCustomerChartData(); }, [customerTimeFrame]);
  useEffect(() => { fetchCalendarData(); }, [selectedMonth]);
  useEffect(() => { fetchRatingData(); }, [ratingPeriod]);

  const getStatusChip = (status) => {
    const config = {
      'pending': { color: 'default' },
      'confirmed': { color: 'info' },
      'completed': { color: 'success' },
      'cancelled': { color: 'error' },
      'absent': { color: 'error' },
      'On Time': { color: 'success' },
      'Late': { color: 'warning' },
      'Working': { color: 'info' }
    };

    const statusTranslations = {
      'pending': 'Chờ',
      'confirmed': 'Đã Check-in',
      'completed': 'Hoàn Thành',
      'cancelled': 'Đã Hủy',
      'absent': 'Vắng Mặt',
      'On Time': 'Đúng Giờ',
      'Late': 'Trễ',
      'Working': 'Đang Làm'
    };

    const translatedStatus = statusTranslations[status] || status || 'Không Rõ';
    return <Chip size="small" label={translatedStatus} color={config[status]?.color || 'default'} />;
  };

  const getAppointmentStatusChip = (status) => {
    const config = { 'pending': { label: 'Chờ Xử Lý', color: 'warning' }, 'confirmed': { label: 'Đã Xác Nhận', color: 'primary' }, 'completed': { label: 'Hoàn Thành', color: 'success' }, 'cancelled': { label: 'Đã Hủy', color: 'error' } };
    const { label = status, color = 'default' } = config[status] || {};
    return <Chip size="small" label={label} color={color} />;
  };

  const formatTime = (date) => format(date, 'h:mm a');

  const handleDayClick = async (day) => {
    if (day.totalCustomers === 0) return;
    const dailyReport = await apiCall(`/statistics/daily-report?date=${day.date}`, 'Failed to fetch daily report');
    if (dailyReport) {
      setSelectedDayStats(dailyReport);
      setDialogView('stats');
      setDayAppointments([]);
      setIsStatsModalOpen(true);
    }
  };

  const handleViewDetailsClick = async () => {
    if (!selectedDayStats) return;
    const appointments = await apiCall(`/admin/appointment?date=${selectedDayStats.date}`, 'Failed to fetch day appointments');
    if (appointments) {
      const mappedAppointments = appointments.map(app => ({
        appointment_id: app.id,
        customer_name: app.fullName,
        appointment_time: parseISO(app.appointmentDate),
        service_name: app.serviceName,
        staff_name: app.userName,
        status: app.status
      })).sort((a, b) => a.appointment_time - b.appointment_time);
      setDayAppointments(mappedAppointments);
      setDialogView('details');
    }
  };

  const handleCloseModal = () => setIsStatsModalOpen(false);

  const displayedSchedules = fullScheduleData
    .filter(staff => {
      if (selectedShift === 'All') return true;
      return staff.shift?.toLowerCase().includes(selectedShift.toLowerCase());
    })
    .slice(0, 5);

  // Handle click on statistic cards to navigate to appointments with filters
  const handleCardClick = (cardType) => {
    const today = formatApiDate(new Date());
    const startOfCurrentMonth = formatApiDate(startOfMonth(new Date()));
    const endOfCurrentMonth = formatApiDate(endOfMonth(new Date()));

    switch (cardType) {
      case 'waiting':
        // Chuyển đến trang lịch hẹn, lọc theo trạng thái "pending" không giới hạn ngày
        navigate('/spa/appointments', {
          state: {
            filterStatus: 'pending',
            title: 'Khách Hàng Đang Chờ'
          }
        });
        break;
      case 'services':
        // Chuyển đến trang lịch hẹn, lọc theo trạng thái "completed" trong tháng này
        navigate('/spa/appointments', {
          state: {
            filterStatus: 'completed',
            startDate: startOfCurrentMonth,
            endDate: endOfCurrentMonth,
            title: 'Dịch Vụ Đã Hoàn Thành Tháng Này'
          }
        });
        break;
      case 'rating':
        // << ĐÚNG LOGIC: Phải chuyển đến trang ĐÁNH GIÁ >>
        navigate('/review/review');
        break;
      case 'revenue':
        // Chuyển đến trang lịch hẹn, lọc theo trạng thái "completed" của ngày hôm nay
        navigate('/spa/appointments', {
          state: {
            filterStatus: 'completed',
            startDate: today,
            endDate: today,
            title: 'Doanh Thu Hôm Nay'
          }
        });
        break;
      default:
        // Trường hợp không xác định, không làm gì cả
        console.warn(`handleCardClick called with unknown cardType: ${cardType}`);
        break;
    }
  };

  return (
    <>
      <Grid container spacing={3}>
        <Grid item xs={12}>
          <Box className="greeting-card">
            <Box className="greeting-content">
              <Typography variant="h3" className="greeting-title">
                {`Xem được khoảng từ${format(startOfMonth(selectedMonth), 'dd/MM/yyyy')} đến ${format(endOfMonth(selectedMonth), 'dd/MM/yyyy')}`}
              </Typography>
              <Typography variant="body1" className="greeting-subtitle">
                Lịch đặt lịch theo tháng hiện tại
              </Typography>
              <Box className="greeting-info">
                <Chip icon={<CalendarOutlined />} label={`Tháng: ${format(selectedMonth, 'MM/yyyy')}`} variant="outlined" color="primary" />
              </Box>
            </Box>
            <Box className="greeting-image" />
          </Box>
        </Grid>

        <Grid item xs={12} sm={6} md={3}>
          <Box
            onClick={() => handleCardClick('waiting')}
            sx={{
              cursor: 'pointer',
              '&:hover': {
                transform: 'translateY(-2px)',
                boxShadow: '0 4px 20px rgba(0,0,0,0.1)',
                '& .MuiCard-root': {
                  boxShadow: '0 4px 20px rgba(0,0,0,0.15)'
                }
              },
              transition: 'all 0.2s ease-in-out'
            }}
          >
            <AnalyticEcommerce
              title="Khách Chờ"
              count={waitingCustomers}
              extra={`${servedCustomers} đã phục vụ hôm nay`}
              color="warning"
              icon={<UserOutlined />}
            />
          </Box>
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <Box
            onClick={() => handleCardClick('services')}
            sx={{
              cursor: 'pointer',
              '&:hover': {
                transform: 'translateY(-2px)',
                boxShadow: '0 4px 20px rgba(0,0,0,0.1)',
                '& .MuiCard-root': {
                  boxShadow: '0 4px 20px rgba(0,0,0,0.15)'
                }
              },
              transition: 'all 0.2s ease-in-out'
            }}
          >
            <AnalyticEcommerce
              title="Dịch Vụ Tháng Này"
              count={totalServices}
              extra="Đã hoàn thành"
              icon={<ShopOutlined />}
            />
          </Box>
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <Box
            onClick={() => handleCardClick('rating')}
            sx={{
              cursor: 'pointer',
              '&:hover': {
                transform: 'translateY(-2px)',
                boxShadow: '0 4px 20px rgba(0,0,0,0.1)',
                '& .MuiCard-root': {
                  boxShadow: '0 4px 20px rgba(0,0,0,0.15)'
                }
              },
              transition: 'all 0.2s ease-in-out'
            }}
          >
            <AnalyticEcommerce
              title="Đánh Giá Trung Bình"
              count={overallAverageRating}
              extra="Đánh giá tổng thể nhân viên"
              color="success"
              icon={<StarOutlined />}
            />
          </Box>
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <Box
            onClick={() => handleCardClick('revenue')}
            sx={{
              cursor: 'pointer',
              '&:hover': {
                transform: 'translateY(-2px)',
                boxShadow: '0 4px 20px rgba(0,0,0,0.1)',
                '& .MuiCard-root': {
                  boxShadow: '0 4px 20px rgba(0,0,0,0.15)'
                }
              },
              transition: 'all 0.2s ease-in-out'
            }}
          >
            <AnalyticEcommerce
              title="Doanh Thu Hôm Nay"
              count={todayRevenue}
              extra="Từ các dịch vụ đã hoàn thành"
              color="primary"
              icon={<DollarOutlined />}
            />
          </Box>
        </Grid>

        <Grid item xs={12} md={8}>
          <Grid container spacing={3}>
            <Grid item xs={12}>
              <MainCard
                title={<Box display="flex" alignItems="center"><ScheduleOutlined style={{ marginRight: 8 }} /><Typography variant="h5">{scheduleTitle}</Typography></Box>}
                content={false}
              >
                <Box sx={{ borderBottom: 1, borderColor: 'divider', width: '100%' }}>
                  <Tabs
                    value={selectedShift}
                    onChange={(event, newValue) => setSelectedShift(newValue)}
                    variant="scrollable"
                    scrollButtons="auto"
                    aria-label="schedule shift tabs"
                  >
                    <Tab label="Tất Cả" value="All" />
                    <Tab label="Ca Sáng" value="Morning" />
                    <Tab label="Ca Chiều" value="Afternoon" />
                  </Tabs>
                </Box>
                <TableContainer>
                  <Table size="small">
                    <TableHead>
                      <TableRow>
                        <TableCell>Nhân Viên</TableCell>
                        <TableCell>Vai Trò</TableCell>
                        <TableCell>Giờ Vào</TableCell>
                        <TableCell>Trạng Thái</TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {displayedSchedules.map((staff) => (
                        <TableRow key={staff.user_id}>
                          <TableCell>
                            <Box display="flex" alignItems="center">
                              <Avatar src={staff.image_url} sx={{ width: 28, height: 28, mr: 1 }} />
                              {staff.full_name}
                            </Box>
                          </TableCell>
                          <TableCell>{staff.role_name}</TableCell>
                          <TableCell>{staff.check_in_time || 'N/A'}</TableCell>
                          <TableCell>{getStatusChip(staff.status)}</TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </TableContainer>
              </MainCard>
            </Grid>
            <Grid item xs={12}><RevenueChart {...{ revenueTimeFrame, setRevenueTimeFrame, totalMonthlyRevenue, revenueGrowth, revenueLoading, revenueChartData }} /></Grid>
            <Grid item xs={12}><CustomerChart {...{ customerTimeFrame, setCustomerTimeFrame, totalMonthlyCustomers, customerGrowth, customerLoading, customerChartData }} /></Grid>
          </Grid>
        </Grid>

        <Grid item xs={12} md={4}>
          <Grid container spacing={3}>
            {/* --- BƯỚC 2: TRUYỀN TẤT CẢ PROPS CẦN THIẾT XUỐNG ĐÂY --- */}
            <Grid item xs={12}>
              <CustomerCalendar
                selectedMonth={selectedMonth}
                setSelectedMonth={setSelectedMonth}
                calendarData={calendarData}
                handleDayClick={handleDayClick}
                isStatsModalOpen={isStatsModalOpen}
                handleCloseModal={handleCloseModal}
                selectedDayStats={selectedDayStats}
                dialogView={dialogView}
                setDialogView={setDialogView}
                dayAppointments={dayAppointments}
                handleViewDetailsClick={handleViewDetailsClick}
                getAppointmentStatusChip={getAppointmentStatusChip}
                formatTime={formatTime}
                handleNavigateToAppointments={handleNavigateToAppointments}
              />
            </Grid>
            <Grid item xs={12}><MainCard title={<Box display="flex" justifyContent="space-between" alignItems="center" width="100%"><Box display="flex" alignItems="center"><StarOutlined style={{ marginRight: 8 }} /><Typography variant="h5">Đánh Giá Nhân Viên</Typography></Box><ButtonGroup variant="outlined" size="small"><Button variant={ratingPeriod === 0 ? 'contained' : 'outlined'} onClick={() => setRatingPeriod(0)}>Tháng Này</Button><Button variant={ratingPeriod === 1 ? 'contained' : 'outlined'} onClick={() => setRatingPeriod(1)}>Tháng Trước</Button></ButtonGroup></Box>}><TableContainer><Table size="small"><TableHead><TableRow><TableCell>Vai Trò</TableCell><TableCell>Đánh Giá</TableCell><TableCell align="right">Lượt Đánh Giá</TableCell></TableRow></TableHead><TableBody>{ratingData.map((item) => (<TableRow key={item.role_id}><TableCell>{item.role_name}</TableCell><TableCell><Box display="flex" alignItems="center" fontWeight="600">{item.average_rating}<LinearProgress variant="determinate" value={parseFloat(item.average_rating) * 10} sx={{ width: '50px', ml: 1, height: 6, borderRadius: 2 }} /></Box></TableCell><TableCell align="right">{item.total_reviews}</TableCell></TableRow>))}</TableBody></Table></TableContainer></MainCard></Grid>
            <Grid item xs={12}><MainCard title={<Box display="flex" alignItems="center"><CalendarOutlined style={{ marginRight: 8 }} /><Typography variant="h5">Lịch Hẹn Hôm Nay</Typography></Box>}><List>{todayAppointments.map((appointment, index) => (<React.Fragment key={appointment.appointment_id}><ListItem><ListItemText primary={appointment.customer_name} secondary={`${appointment.service_name} • ${appointment.staff_name}`} /><Typography variant="body2" color="textSecondary">{formatTime(appointment.appointment_time)}</Typography><Box ml={2}>{getAppointmentStatusChip(appointment.status)}</Box></ListItem>{index < todayAppointments.length - 1 && <Divider />}</React.Fragment>))}</List></MainCard></Grid>
          </Grid>
        </Grid>
      </Grid>
    </>
  );
};

export default DashboardDefault;