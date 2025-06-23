import React, { useState, useEffect } from 'react';
import {
  Box, Paper, Typography, Grid, Button, Dialog, DialogTitle, DialogContent, DialogActions,
  Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Chip, Alert,
  CircularProgress, FormControl, InputLabel, Select, MenuItem, TextField, Avatar,
  IconButton, Tooltip, Stack, Card, CardContent
} from '@mui/material';
import { DateCalendar, LocalizationProvider } from '@mui/x-date-pickers';
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns';
import { format, isToday, isSameDay } from 'date-fns';
import { vi } from 'date-fns/locale';
import {
  CalendarOutlined, ClockCircleOutlined, UserOutlined, CheckCircleOutlined,
  CloseCircleOutlined, EditOutlined, DeleteOutlined, PlusOutlined,
  CheckOutlined, LoginOutlined, LogoutOutlined, ReloadOutlined
} from '@ant-design/icons';
import MainCard from 'components/MainCard';
import { toast } from 'react-toastify';
import { useSearchParams } from 'react-router-dom';
import Cookies from 'js-cookie';

const API_BASE_URL = 'http://localhost:8080/api/v1/users-schedules';

const WorkSchedulePage = () => {
  const [searchParams] = useSearchParams();
  const [schedules, setSchedules] = useState([]);
  const [selectedDate, setSelectedDate] = useState(() => {
    // Kiểm tra nếu có date parameter từ URL
    const dateParam = searchParams.get('date');
    return dateParam ? new Date(dateParam) : new Date();
  });
  const [loading, setLoading] = useState(false);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [selectedSchedule, setSelectedSchedule] = useState(null);
  const [userId, setUserId] = useState(null);
  const [userRole, setUserRole] = useState('');
  const [filterMonth, setFilterMonth] = useState(() => {
    const dateParam = searchParams.get('date');
    const targetDate = dateParam ? new Date(dateParam) : new Date();
    return targetDate.getMonth() + 1;
  });
  const [filterYear, setFilterYear] = useState(() => {
    const dateParam = searchParams.get('date');
    const targetDate = dateParam ? new Date(dateParam) : new Date();
    return targetDate.getFullYear();
  });
  const [statusFilter, setStatusFilter] = useState('');

  // Initialize user
  useEffect(() => {
    const token = Cookies.get('staff_token');
    const userIdFromCookie = Cookies.get('staff_userId');
    const role = Cookies.get('staff_role');
    
    if (token && userIdFromCookie) {
      setUserId(userIdFromCookie);
      setUserRole(role);
    }
  }, []);

  // Fetch schedules
  const fetchSchedules = async () => {
    if (!userId) return;
    
    setLoading(true);
    try {
      const token = Cookies.get('staff_token');
      const params = new URLSearchParams({
        userId: userId,
        month: filterMonth,
        year: filterYear
      });
      
      if (statusFilter) {
        params.append('status', statusFilter);
      }

      const response = await fetch(`${API_BASE_URL}?${params}`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      const data = await response.json();
      if (data.status === 'SUCCESS') {
        setSchedules(data.data || []);
      } else {
        toast.error(data.message || 'Không thể tải lịch làm việc');
      }
    } catch (error) {
      console.error('Error fetching schedules:', error);
      toast.error('Lỗi kết nối server');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSchedules();
  }, [userId, filterMonth, filterYear, statusFilter]);

  // Check-in
  const handleCheckIn = async (scheduleId) => {
    try {
      const token = Cookies.get('staff_token');
      const response = await fetch(`${API_BASE_URL}/check-in/${scheduleId}`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      const data = await response.json();
      if (data.status === 'SUCCESS') {
        toast.success('Vào ca thành công!');
        fetchSchedules();
      } else {
        toast.error(data.message || 'Vào ca thất bại');
      }
    } catch (error) {
      toast.error('Lỗi khi vào ca');
    }
  };

  // Check-out
  const handleCheckOut = async (scheduleId) => {
    try {
      const token = Cookies.get('staff_token');
      const response = await fetch(`${API_BASE_URL}/check-out/${scheduleId}`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      const data = await response.json();
      if (data.status === 'SUCCESS') {
        toast.success('Kết thúc ca thành công!');
        fetchSchedules();
      } else {
        toast.error(data.message || 'Kết thúc ca thất bại');
      }
    } catch (error) {
      toast.error('Lỗi khi kết thúc ca');
    }
  };

  // Get schedules for selected date
  const getSchedulesForDate = (date) => {
    return schedules.filter(schedule => 
      isSameDay(new Date(schedule.workDate), date)
    );
  };

  // Get status chip
  const getStatusChip = (status, schedule) => {
    const today = new Date();
    const workDate = new Date(schedule.workDate);
    
    let color = 'default';
    let label = status;
    
    switch (status) {
      case 'pending':
        color = 'warning';
        label = 'Chờ xử lý';
        break;
      case 'confirmed':
        color = 'primary';
        label = 'Đã xác nhận';
        break;
      case 'completed':
        color = 'success';
        label = 'Hoàn thành';
        break;
      case 'cancelled':
        color = 'error';
        label = 'Đã hủy';
        break;
      default:
        label = status || 'N/A';
    }
    
    return <Chip label={label} color={color} size="small" sx={{ fontWeight: 600 }} />;
  };

  // Check if can check-in/out
  const canCheckIn = (schedule) => {
    const today = new Date();
    const workDate = new Date(schedule.workDate);
    return isToday(workDate) && !schedule.checkInTime && schedule.status === 'confirmed';
  };

  const canCheckOut = (schedule) => {
    const today = new Date();
    const workDate = new Date(schedule.workDate);
    return isToday(workDate) && schedule.checkInTime && !schedule.checkOutTime;
  };

  // Custom day renderer for calendar
  const renderDay = (day, selectedDays, pickersDayProps) => {
    const daySchedules = getSchedulesForDate(day);
    const hasSchedule = daySchedules.length > 0;
    const hasCompletedSchedule = daySchedules.some(s => s.status === 'completed');
    
    return (
      <Box
        {...pickersDayProps}
        sx={{
          position: 'relative',
          '&::after': hasSchedule ? {
            content: '""',
            position: 'absolute',
            bottom: 2,
            left: '50%',
            transform: 'translateX(-50%)',
            width: 6,
            height: 6,
            borderRadius: '50%',
            backgroundColor: hasCompletedSchedule ? '#4caf50' : '#2196f3'
          } : {}
        }}
      />
    );
  };

  const selectedDateSchedules = getSchedulesForDate(selectedDate);

  return (
    <MainCard title="Lịch làm việc">
      <Grid container spacing={3}>
        {/* Filter Controls */}
        <Grid item xs={12}>
          <Card sx={{ mb: 3 }}>
            <CardContent>
              <Stack direction="row" spacing={2} alignItems="center" flexWrap="wrap">
                <FormControl size="small" sx={{ minWidth: 120 }}>
                  <InputLabel>Tháng</InputLabel>
                  <Select
                    value={filterMonth}
                    label="Tháng"
                    onChange={(e) => setFilterMonth(e.target.value)}
                  >
                    {Array.from({ length: 12 }, (_, i) => (
                      <MenuItem key={i + 1} value={i + 1}>
                        Tháng {i + 1}
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
                
                <FormControl size="small" sx={{ minWidth: 120 }}>
                  <InputLabel>Năm</InputLabel>
                  <Select
                    value={filterYear}
                    label="Năm"
                    onChange={(e) => setFilterYear(e.target.value)}
                  >
                    {Array.from({ length: 5 }, (_, i) => {
                      const year = new Date().getFullYear() - 2 + i;
                      return (
                        <MenuItem key={year} value={year}>
                          {year}
                        </MenuItem>
                      );
                    })}
                  </Select>
                </FormControl>
                
                <FormControl size="small" sx={{ minWidth: 150 }}>
                  <InputLabel>Trạng thái</InputLabel>
                  <Select
                    value={statusFilter}
                    label="Trạng thái"
                    onChange={(e) => setStatusFilter(e.target.value)}
                  >
                    <MenuItem value="">Tất cả</MenuItem>
                    <MenuItem value="pending">Chờ xử lý</MenuItem>
                    <MenuItem value="confirmed">Đã xác nhận</MenuItem>
                    <MenuItem value="completed">Hoàn thành</MenuItem>
                    <MenuItem value="cancelled">Đã hủy</MenuItem>
                  </Select>
                </FormControl>

                <Tooltip title="Tải lại dữ liệu">
                  <IconButton
                    onClick={fetchSchedules}
                    disabled={loading}
                    sx={{
                      bgcolor: 'primary.lighter',
                      color: 'primary.main',
                      '&:hover': {
                        bgcolor: 'primary.main',
                        color: 'white'
                      }
                    }}
                  >
                    <ReloadOutlined />
                  </IconButton>
                </Tooltip>
              </Stack>
            </CardContent>
          </Card>
        </Grid>

        {/* Calendar */}
        <Grid item xs={12} md={6}>
          <Paper elevation={0} sx={{ p: 3, borderRadius: 3, border: '1px solid #f0f0f0' }}>
            <Stack direction="row" alignItems="center" spacing={2} sx={{ mb: 3 }}>
              <CalendarOutlined style={{ fontSize: '24px', color: '#2962ff' }} />
              <Typography variant="h6" fontWeight={700} color="#2962ff">
                Lịch làm việc tháng {filterMonth}/{filterYear}
              </Typography>
            </Stack>
            
            <LocalizationProvider dateAdapter={AdapterDateFns} adapterLocale={vi}>
              <DateCalendar
                value={selectedDate}
                onChange={setSelectedDate}
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

        {/* Schedule Details */}
        <Grid item xs={12} md={6}>
          <Paper elevation={0} sx={{ p: 3, borderRadius: 3, border: '1px solid #f0f0f0' }}>
            <Stack direction="row" alignItems="center" spacing={2} sx={{ mb: 3 }}>
              <ClockCircleOutlined style={{ fontSize: '24px', color: '#2962ff' }} />
              <Typography variant="h6" fontWeight={700} color="#2962ff">
                Lịch ngày {format(selectedDate, 'dd/MM/yyyy', { locale: vi })}
              </Typography>
            </Stack>
            
            {loading ? (
              <Box sx={{ display: 'flex', justifyContent: 'center', p: 4 }}>
                <CircularProgress />
              </Box>
            ) : selectedDateSchedules.length > 0 ? (
              <Stack spacing={2}>
                {selectedDateSchedules.map((schedule) => (
                  <Paper
                    key={schedule.id}
                    variant="outlined"
                    sx={{
                      p: 2,
                      borderRadius: 2,
                      bgcolor: isToday(new Date(schedule.workDate)) ? '#f3f4f6' : 'transparent'
                    }}
                  >
                    <Stack direction="row" justifyContent="space-between" alignItems="center">
                      <Box>
                        <Typography variant="subtitle1" fontWeight={600}>
                          {schedule.shift}
                        </Typography>
                        <Typography variant="caption" color="text.secondary">
                          {schedule.checkInTime && schedule.checkOutTime
                            ? `${schedule.checkInTime} - ${schedule.checkOutTime}`
                            : schedule.checkInTime
                            ? `Bắt đầu: ${schedule.checkInTime}`
                            : 'Chưa vào ca'
                          }
                        </Typography>
                        <Box sx={{ mt: 1 }}>
                          {getStatusChip(schedule.status, schedule)}
                        </Box>
                      </Box>
                      
                      <Stack direction="row" spacing={1}>
                        {canCheckIn(schedule) && (
                          <Tooltip title="Vào ca">
                            <IconButton
                              size="small"
                              color="primary"
                              onClick={() => handleCheckIn(schedule.id)}
                            >
                              <LoginOutlined />
                            </IconButton>
                          </Tooltip>
                        )}
                        
                        {canCheckOut(schedule) && (
                          <Tooltip title="Kết thúc ca">
                            <IconButton
                              size="small"
                              color="success"
                              onClick={() => handleCheckOut(schedule.id)}
                            >
                              <LogoutOutlined />
                            </IconButton>
                          </Tooltip>
                        )}
                      </Stack>
                    </Stack>
                  </Paper>
                ))}
              </Stack>
            ) : (
              <Box sx={{
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                p: 4,
                bgcolor: '#f8f9fa',
                borderRadius: 2,
                border: '1px dashed #e0e0e0'
              }}>
                <CalendarOutlined style={{ fontSize: '48px', color: '#90caf9', marginBottom: '16px' }} />
                <Typography variant="h6" color="text.secondary" gutterBottom>
                  Không có lịch làm việc
                </Typography>
                <Typography variant="body2" color="text.secondary" textAlign="center">
                  Không có lịch làm việc nào cho ngày này
                </Typography>
              </Box>
            )}
          </Paper>
        </Grid>

        {/* Schedule Table */}
        <Grid item xs={12}>
          <Paper elevation={0} sx={{ borderRadius: 3, border: '1px solid #f0f0f0' }}>
            <Box sx={{ p: 3 }}>
              <Typography variant="h6" fontWeight={700} color="#2962ff" sx={{ mb: 3 }}>
                Danh sách lịch làm việc
              </Typography>
              
              {loading ? (
                <Box sx={{ display: 'flex', justifyContent: 'center', p: 4 }}>
                  <CircularProgress />
                </Box>
              ) : schedules.length > 0 ? (
                <TableContainer>
                  <Table>
                    <TableHead>
                      <TableRow sx={{ backgroundColor: '#f8f9fa' }}>
                        <TableCell sx={{ fontWeight: 600 }}>Ngày làm việc</TableCell>
                        <TableCell sx={{ fontWeight: 600 }}>Ca làm việc</TableCell>
                        <TableCell sx={{ fontWeight: 600 }}>Giờ vào ca</TableCell>
                        <TableCell sx={{ fontWeight: 600 }}>Giờ tan ca</TableCell>
                        <TableCell sx={{ fontWeight: 600 }}>Trạng thái</TableCell>
                        <TableCell align="center" sx={{ fontWeight: 600 }}>Thao tác</TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {schedules.map((schedule) => (
                        <TableRow key={schedule.id} hover>
                          <TableCell>
                            <Typography variant="body2" fontWeight={600}>
                              {format(new Date(schedule.workDate), 'dd/MM/yyyy', { locale: vi })}
                            </Typography>
                            {isToday(new Date(schedule.workDate)) && (
                              <Chip label="Hôm nay" size="small" color="primary" sx={{ mt: 0.5 }} />
                            )}
                          </TableCell>
                          <TableCell>
                            <Typography variant="body2" fontWeight={500}>
                              {schedule.shift}
                            </Typography>
                          </TableCell>
                          <TableCell>
                            {schedule.checkInTime || '-'}
                          </TableCell>
                          <TableCell>
                            {schedule.checkOutTime || '-'}
                          </TableCell>
                          <TableCell>
                            {getStatusChip(schedule.status, schedule)}
                          </TableCell>
                          <TableCell align="center">
                            <Stack direction="row" spacing={1} justifyContent="center">
                              {canCheckIn(schedule) && (
                                <Tooltip title="Vào ca">
                                  <Button
                                    size="small"
                                    variant="contained"
                                    color="primary"
                                    startIcon={<LoginOutlined />}
                                    onClick={() => handleCheckIn(schedule.id)}
                                  >
                                    Vào ca
                                  </Button>
                                </Tooltip>
                              )}
                              
                              {canCheckOut(schedule) && (
                                <Tooltip title="Kết thúc ca">
                                  <Button
                                    size="small"
                                    variant="contained"
                                    color="success"
                                    startIcon={<LogoutOutlined />}
                                    onClick={() => handleCheckOut(schedule.id)}
                                  >
                                    Kết thúc ca
                                  </Button>
                                </Tooltip>
                              )}
                            </Stack>
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
                  <CalendarOutlined style={{ fontSize: '64px', color: '#90caf9', marginBottom: '16px' }} />
                  <Typography variant="h6" color="text.secondary" gutterBottom>
                    Chưa có lịch làm việc
                  </Typography>
                  <Typography variant="body2" color="text.secondary" textAlign="center">
                    Hiện tại chưa có lịch làm việc nào được giao.<br />
                    Vui lòng liên hệ quản lý để được sắp xếp lịch làm việc.
                  </Typography>
                </Box>
              )}
            </Box>
          </Paper>
        </Grid>
      </Grid>
    </MainCard>
  );
};

export default WorkSchedulePage; 