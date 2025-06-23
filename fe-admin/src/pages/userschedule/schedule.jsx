/* eslint-disable react-hooks/rules-of-hooks */
import { useState, useEffect } from 'react';
import {
  Button,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TablePagination,
  TextField,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  IconButton,
  InputAdornment,
  Box,
  Typography,
  Tooltip,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  Chip,
  Avatar,
  Grid
} from '@mui/material';
import MainCard from 'components/MainCard';
import {
  PlusOutlined,
  EditOutlined,
  DeleteOutlined,
  SearchOutlined,
  CloseOutlined,
  ClockCircleOutlined,
  CheckCircleOutlined
} from '@ant-design/icons';
import { toast } from 'react-toastify';

const API_BASE_URL = 'http://localhost:8080/api/v1';
const SCHEDULE_API_URL = `${API_BASE_URL}/users-schedules`;
const USER_API_URL = `${API_BASE_URL}/admin/accounts/find-all`;
const TIMESLOT_API_URL = `${API_BASE_URL}/timeslot`;
const STAFF_ROLE_NAME = "STAFF";

// Updated status options to match backend
const statusOptions = [
  // DB trả về 'pending' -> Dịch thành 'Pending' (hoặc 'Chờ xác nhận')
  { value: 'pending', label: 'Pending', color: 'warning' },

  // DB trả về 'confirmed' -> Dịch thành 'Working' (hoặc 'Đang làm việc')
  { value: 'confirmed', label: 'Working', color: 'primary' }, 

  // DB trả về 'completed' -> Dịch thành 'Completed' (hoặc 'Đã hoàn thành')
  { value: 'completed', label: 'Completed', color: 'success' },

  // Giữ lại các trạng thái khác nếu bạn có dùng (ví dụ: cho admin set tay)
  { value: 'cancelled', label: 'Cancelled', color: 'error' },
];

// Shift options for dropdown - Chỉ Sáng và Chiều với thời gian mặc định
const shiftOptions = [
  { value: 'Sáng', label: 'Sáng', defaultStart: '08:00', defaultEnd: '12:00' },
  { value: 'Chiều', label: 'Chiều', defaultStart: '13:00', defaultEnd: '17:00' }
];

const UserScheduleManager = () => {
  const [schedules, setSchedules] = useState([]);
  const [users, setUsers] = useState([]);
  const [timeslots, setTimeslots] = useState([]);
  const [openDialog, setOpenDialog] = useState(false);
  const [currentSchedule, setCurrentSchedule] = useState(null);
  const [formData, setFormData] = useState({
    userId: '',
    shift: '',
    workDate: '',
    timeSlotId: '',
    status: 'pending',
    isLastTask: false,
    isActive: true
  });
  
  // New state for flexible shift selection
  const [shiftForm, setShiftForm] = useState({
    shiftType: '',
    startTime: '',
    endTime: ''
  });
  
  // State for check-in/check-out times
  const [timeForm, setTimeForm] = useState({
    checkInTime: '',
    checkOutTime: ''
  });
  
  const [searchQuery, setSearchQuery] = useState('');
  const [filterByUserId, setFilterByUserId] = useState('');
  const [filterStatus, setFilterStatus] = useState('');
  const [filterMonth, setFilterMonth] = useState('');
  const [filterYear, setFilterYear] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);

  // Function to parse shift string into components
  const parseShift = (shiftString) => {
    if (!shiftString) return { shiftType: '', startTime: '', endTime: '' };
    
    // Parse format like "Sáng (09:00 - 11:00)" or "Chiều (14:00 - 18:00)"
    const regex = /^(.+?)\s*\((\d{2}:\d{2})\s*-\s*(\d{2}:\d{2})\)$/;
    const match = shiftString.match(regex);
    
    if (match) {
      return {
        shiftType: match[1].trim(),
        startTime: match[2],
        endTime: match[3]
      };
    }
    
    // Fallback for old format or unmatched strings
    return {
      shiftType: shiftString,
      startTime: '',
      endTime: ''
    };
  };

  // Function to format shift components into display string
  const formatShift = (shiftType, startTime, endTime) => {
    if (!shiftType) return '';
    if (!startTime || !endTime) return shiftType;
    return `${shiftType} (${startTime} - ${endTime})`;
  };

  // Handle shift form changes
  const handleShiftFormChange = (field, value) => {
    let newShiftForm = { ...shiftForm, [field]: value };
    
    // Auto-fill start and end time when shift type is selected
    if (field === 'shiftType' && value) {
      const selectedShift = shiftOptions.find(option => option.value === value);
      if (selectedShift) {
        newShiftForm = {
          ...newShiftForm,
          startTime: selectedShift.defaultStart,
          endTime: selectedShift.defaultEnd
        };
      }
    }
    
    setShiftForm(newShiftForm);
    
    // Update the main formData.shift field with formatted string
    const formattedShift = formatShift(newShiftForm.shiftType, newShiftForm.startTime, newShiftForm.endTime);
    setFormData(prev => ({ ...prev, shift: formattedShift }));
  };

  // Handle time form changes for check-in/check-out
  const handleTimeFormChange = (field, value) => {
    setTimeForm(prev => ({ ...prev, [field]: value }));
  };

  useEffect(() => {
    fetch(USER_API_URL)
      .then(res => res.json())
      .then(response => {
        if (response && response.status === 'SUCCESS' && Array.isArray(response.data)) {
          const allUsers = response.data;
          const staffUsers = allUsers.filter(user =>
            user.role && user.role.name && user.role.name.toUpperCase() === STAFF_ROLE_NAME.toUpperCase()
          );
          setUsers(staffUsers);
          if (staffUsers.length === 0 && allUsers.length > 0) {
            toast.info("No users found with STAFF role.");
          }
        } else {
          console.error("Failed to load users or invalid format from API:", response);
          setUsers([]);
        }
      })
      .catch(error => {
        console.error("Error fetching users:", error);
        setUsers([]);
        toast.error("Connection error while loading user list.");
      });
  }, []);

  // Fetch timeslots from API
  useEffect(() => {
    fetch(TIMESLOT_API_URL)
      .then(res => res.json())
      .then(response => {
        if (response && response.status === 'SUCCESS' && Array.isArray(response.data)) {
          setTimeslots(response.data);
        } else {
          console.error("Failed to load timeslots from API:", response);
          setTimeslots([]);
        }
      })
      .catch(error => {
        console.error("Error fetching timeslots:", error);
        setTimeslots([]);
        toast.error("Connection error while loading timeslot list.");
      });
  }, []);

  const fetchSchedules = () => {
    let url = SCHEDULE_API_URL;
    const params = new URLSearchParams();
    
    if (filterByUserId) params.append('userId', filterByUserId);
    if (filterStatus) params.append('status', filterStatus);
    if (filterMonth) params.append('month', filterMonth);
    if (filterYear) params.append('year', filterYear);
    if (startDate) params.append('startDate', startDate);
    if (endDate) params.append('endDate', endDate);

    if (params.toString()) {
      url += `?${params.toString()}`;
    }

    fetch(url)
      .then(res => res.json())
      .then(response => {
        if (response.status === 'SUCCESS' && Array.isArray(response.data)) {
          setSchedules(response.data);
        } else {
          setSchedules([]);
        }
      })
      .catch(() => {
        setSchedules([]);
        toast.error('Error loading schedules from server.');
      });
  };

  useEffect(() => {
    fetchSchedules();
  }, [filterByUserId, filterStatus, filterMonth, filterYear, startDate, endDate]);

  const handleChangePage = (event, newPage) => {
    setPage(newPage);
  };

  const handleChangeRowsPerPage = (event) => {
    setRowsPerPage(parseInt(event.target.value, 10));
    setPage(0);
  };

  const handleSearchChange = (event) => {
    setSearchQuery(event.target.value);
    setPage(0);
  };

  const handleFilterChange = (filterType, value) => {
    switch(filterType) {
      case 'userId':
        setFilterByUserId(value);
        break;
      case 'status':
        setFilterStatus(value);
        break;
      case 'month':
        setFilterMonth(value);
        break;
      case 'year':
        setFilterYear(value);
        break;
      case 'startDate':
        setStartDate(value);
        break;
      case 'endDate':
        setEndDate(value);
        break;
      default:
        break;
    }
    setPage(0);
  };

  const clearFilters = () => {
    setFilterByUserId('');
    setFilterStatus('');
    setFilterMonth('');
    setFilterYear('');
    setStartDate('');
    setEndDate('');
    setSearchQuery('');
  };

  const handleOpenDialog = (schedule = null) => {
    if (schedule) {
      setCurrentSchedule(schedule);
      
      // Parse existing shift to populate shift form
      const parsedShift = parseShift(schedule.shift);
      setShiftForm(parsedShift);
      
      // Parse existing check-in/check-out times
      setTimeForm({
        checkInTime: schedule.checkInTime ? formatTime(schedule.checkInTime) : '',
        checkOutTime: schedule.checkOutTime ? formatTime(schedule.checkOutTime) : ''
      });
      
      setFormData({
        userId: schedule.userId || '',
        shift: schedule.shift || '',
        workDate: schedule.workDate || '',
        timeSlotId: '', // Không sử dụng timeslot
        status: schedule.status || 'pending',
        isLastTask: schedule.isLastTask || false,
        isActive: schedule.isActive === undefined ? true : schedule.isActive,
      });
    } else {
      setCurrentSchedule(null);
      setShiftForm({ shiftType: '', startTime: '', endTime: '' });
      setTimeForm({ checkInTime: '', checkOutTime: '' });
      setFormData({
        userId: '',
        shift: '',
        workDate: '',
        timeSlotId: '', // Không sử dụng timeslot
        status: 'pending',
        isLastTask: false,
        isActive: true
      });
    }
    setOpenDialog(true);
  };

  const handleCloseDialog = () => {
    setOpenDialog(false);
  };

  const handleFormChange = (event) => {
    const { name, value, type, checked } = event.target;
    setFormData({
      ...formData,
      [name]: type === 'checkbox' ? checked : value
    });
  };

  // Get timeslot details by ID
  const getTimeslotById = (timeSlotId) => {
    return timeslots.find(slot => slot.slotId === timeSlotId);
  };

  // Format time from LocalTime to display format
  const formatTime = (timeString) => {
    if (!timeString) return '-';
    // Convert from HH:mm:ss to HH:mm format
    return timeString.substring(0, 5);
  };

  const handleSaveSchedule = () => {
    // Validation - Chỉ yêu cầu shift custom
    if (!formData.userId || !formData.workDate) {
      toast.error("Vui lòng chọn Nhân viên và Ngày làm việc.");
      return;
    }

    // Kiểm tra có shift custom
    if (!shiftForm.shiftType || !shiftForm.startTime || !shiftForm.endTime) {
      toast.error('Vui lòng chọn ca làm việc và thời gian.');
      return;
    }

    if (!formData.status || !statusOptions.find(opt => opt.value === formData.status)) {
      toast.error("Vui lòng chọn trạng thái hợp lệ.");
      return;
    }

    // Prepare shift data
    const finalShift = formatShift(shiftForm.shiftType, shiftForm.startTime, shiftForm.endTime);

    const requestBody = {
      ...formData,
      userId: parseInt(formData.userId, 10),
      timeSlotId: null, // Không sử dụng timeslot nữa
      shift: finalShift,
      isLastTask: formData.isLastTask || false,
      isActive: formData.isActive === undefined ? true : formData.isActive,
      checkInTime: timeForm.checkInTime || null,
      checkOutTime: timeForm.checkOutTime || null,
    };

    if (currentSchedule) {
      fetch(`${SCHEDULE_API_URL}/update/${currentSchedule.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(requestBody),
      })
        .then(res => res.json())
        .then(response => {
          if (response.status === 'SUCCESS') {
            fetchSchedules();
            toast.success(response.message ||'Cập nhật lịch trình thành công.');
          } else {
            toast.error(response.message || 'Cập nhật lịch trình thất bại.');
          }
          setOpenDialog(false);
        })
        .catch(() => {
          toast.error('Lỗi khi cập nhật lịch trình.');
          setOpenDialog(false);
        });
    } else {
      fetch(`${SCHEDULE_API_URL}/created`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(requestBody),
      })
        .then(res => res.json())
        .then(response => {
          if (response.status === 'SUCCESS') {
            toast.success(response.message || 'Tạo lịch trình thành công.');
            fetchSchedules();
          } else {
            toast.error(response.message || 'Tạo lịch trình thất bại.');
          }
          setOpenDialog(false);
        })
        .catch(() => {
          toast.error('Lỗi khi tạo lịch trình.');
          setOpenDialog(false);
        });
    }
  };

  const handleDeleteSchedule = (scheduleId) => {
    toast.warning('Đang xóa lịch trình...', { autoClose: 1000 });
      fetch(`${SCHEDULE_API_URL}/${scheduleId}`, {
        method: 'PUT',
      })
        .then(res => res.json())
        .then(response => {
          if (response.status === 'SUCCESS') {
            fetchSchedules();
          toast.success(response.message || 'Đã xóa lịch trình thành công.');
          } else {
          toast.error(response.message || 'Xóa lịch trình thất bại.');
          }
        })
      .catch(() => toast.error('Lỗi khi xóa lịch trình.'));
  };

  const handleCheckIn = (scheduleId) => {
    toast.info('Đang thực hiện check-in...', { autoClose: 1000 });
      fetch(`${SCHEDULE_API_URL}/check-in/${scheduleId}`, {
        method: 'PUT',
      })
        .then(res => res.json())
        .then(response => {
          if (response.status === 'SUCCESS') {
            fetchSchedules();
          toast.success(response.message || 'Check-in thành công.');
          } else {
          toast.error(response.message || 'Check-in thất bại.');
          }
        })
      .catch(() => toast.error('Lỗi khi check-in.'));
  };

  const handleCheckOut = (scheduleId) => {
    toast.info('Đang thực hiện check-out...', { autoClose: 1000 });
      fetch(`${SCHEDULE_API_URL}/check-out/${scheduleId}`, {
        method: 'PUT',
      })
        .then(res => res.json())
        .then(response => {
          if (response.status === 'SUCCESS') {
            fetchSchedules();
          toast.success(response.message || 'Check-out thành công.');
          } else {
          toast.error(response.message || 'Check-out thất bại.');
          }
        })
      .catch(() => toast.error('Lỗi khi check-out.'));
  };

  const getStatusChip = (status) => {
    const statusOption = statusOptions.find(opt => opt.value === status);
    if (!statusOption) return <Chip label={status} size="small" />;
    
    return (
      <Chip 
        label={statusOption.label} 
        size="small"
        color={statusOption.color}
        variant="outlined"
      />
    );
  };

  const filteredSchedules = schedules.filter(schedule =>
    (schedule.userName && schedule.userName.toLowerCase().includes(searchQuery.toLowerCase())) ||
    (schedule.shift && schedule.shift.toLowerCase().includes(searchQuery.toLowerCase())) ||
    (schedule.status && schedule.status.toLowerCase().includes(searchQuery.toLowerCase())) ||
    (schedule.roleName && schedule.roleName.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  // Generate year options (current year ± 2)
  const currentYear = new Date().getFullYear();
  const yearOptions = [];
  for (let i = currentYear - 2; i <= currentYear + 2; i++) {
    yearOptions.push(i);
  }

  return (
    <MainCard title="Quản Lý Lịch Trình Nhân Viên" secondary={
      <Button
        variant="contained"
        startIcon={<PlusOutlined />}
        onClick={() => handleOpenDialog()}
      >
        Thêm Lịch Trình
      </Button>
    }>
      {/* Enhanced Filter Section */}
      <Box sx={{ mb: 3 }}>
        <Grid container spacing={2} alignItems="center">
          <Grid item xs={12} md={3}>
            <TextField
              size="small"
              placeholder="Tìm kiếm theo nhân viên, ca làm, trạng thái, vai trò, chi nhánh..."
              value={searchQuery}
              onChange={handleSearchChange}
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <SearchOutlined />
                  </InputAdornment>
                ),
                endAdornment: searchQuery ? (
                  <InputAdornment position="end">
                    <IconButton size="small" onClick={() => setSearchQuery('')}>
                      <CloseOutlined style={{ fontSize: 16 }} />
                    </IconButton>
                  </InputAdornment>
                ) : null
              }}
              fullWidth
            />
          </Grid>
          
          <Grid item xs={12} md={2}>
            <FormControl size="small" fullWidth>
              <InputLabel>Nhân Viên</InputLabel>
              <Select
                value={filterByUserId}
                label="Nhân Viên"
                onChange={(e) => handleFilterChange('userId', e.target.value)}
              >
                <MenuItem value="">Tất Cả Nhân Viên</MenuItem>
                {users.map((user) => (
                  <MenuItem key={user.id} value={user.id}>
                    {user.fullName || user.username}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          </Grid>

          <Grid item xs={12} md={2}>
            <FormControl size="small" fullWidth>
              <InputLabel>Trạng Thái</InputLabel>
              <Select
                value={filterStatus}
                label="Trạng Thái"
                onChange={(e) => handleFilterChange('status', e.target.value)}
              >
                <MenuItem value="">Tất Cả Trạng Thái</MenuItem>
                {statusOptions.map((option) => (
                  <MenuItem key={option.value} value={option.value}>
                    {option.label}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          </Grid>

          <Grid item xs={6} md={1}>
            <FormControl size="small" fullWidth>
              <InputLabel>Tháng</InputLabel>
              <Select
                value={filterMonth}
                label="Tháng"
                onChange={(e) => handleFilterChange('month', e.target.value)}
              >
                <MenuItem value="">Tất Cả</MenuItem>
                {Array.from({length: 12}, (_, i) => (
                  <MenuItem key={i+1} value={i+1}>{i+1}</MenuItem>
                ))}
              </Select>
            </FormControl>
          </Grid>

          <Grid item xs={6} md={1}>
            <FormControl size="small" fullWidth>
              <InputLabel>Năm</InputLabel>
              <Select
                value={filterYear}
                label="Năm"
                onChange={(e) => handleFilterChange('year', e.target.value)}
              >
                <MenuItem value="">Tất Cả</MenuItem>
                {yearOptions.map((year) => (
                  <MenuItem key={year} value={year}>{year}</MenuItem>
                ))}
              </Select>
            </FormControl>
          </Grid>

          <Grid item xs={6} md={1.5}>
            <TextField
              size="small"
              label="Ngày Bắt Đầu"
              type="date"
              value={startDate}
              onChange={(e) => handleFilterChange('startDate', e.target.value)}
              InputLabelProps={{ shrink: true }}
              fullWidth
            />
          </Grid>

          <Grid item xs={6} md={1.5}>
            <TextField
              size="small"
              label="Ngày Kết Thúc"
              type="date"
              value={endDate}
              onChange={(e) => handleFilterChange('endDate', e.target.value)}
              InputLabelProps={{ shrink: true }}
              fullWidth
            />
          </Grid>
        </Grid>
        
        <Box sx={{ mt: 1, display: 'flex', justifyContent: 'flex-end' }}>
          <Button size="small" onClick={clearFilters} variant="outlined">
            Xóa Bộ Lọc
          </Button>
        </Box>
      </Box>

      <TableContainer component={Paper} sx={{ boxShadow: 'none', borderRadius: '10px', maxHeight: 'calc(100vh - 400px)', overflow: 'auto' }}>
        <Table sx={{ minWidth: 650 }} stickyHeader>
          <TableHead>
            <TableRow>
              <TableCell>#</TableCell>
              <TableCell>Nhân Viên</TableCell>
              <TableCell>Vai Trò & Chi Nhánh</TableCell>
              <TableCell>Ngày Làm Việc</TableCell>
              <TableCell>Ca Làm Việc</TableCell>
              <TableCell>Giờ Vào</TableCell>
              <TableCell>Giờ Ra</TableCell>
              <TableCell>Trạng Thái</TableCell>
              <TableCell>Hoạt Động</TableCell>
              <TableCell align="center">Thao Tác</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {filteredSchedules
              .slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage)
              .map((schedule, index) => (
                <TableRow key={schedule.id}>
                  <TableCell>{page * rowsPerPage + index + 1}</TableCell>
                  <TableCell>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      <Avatar 
                        src={schedule.userImageUrl} 
                        alt={schedule.userName}
                        sx={{ width: 32, height: 32 }}
                      >
                        {schedule.userName?.charAt(0)}
                      </Avatar>
                      <Box>
                        <Typography variant="body2" fontWeight="medium">
                          {schedule.userName}
                        </Typography>
                        <Typography variant="caption" color="text.secondary">
                          {schedule.userEmail}
                        </Typography>
                      </Box>
                    </Box>
                  </TableCell>
                  <TableCell>
                    <Box>
                      <Typography variant="body2" color="primary">
                        {schedule.roleName}
                      </Typography>
                      <Typography variant="caption" color="text.secondary">
                        {schedule.branchName || 'Không xác định'}
                      </Typography>
                    </Box>
                  </TableCell>
                  <TableCell>
                    <Typography variant="body2">
                      {new Date(schedule.workDate).toLocaleDateString('vi-VN')}
                    </Typography>
                  </TableCell>
                  <TableCell>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      <ClockCircleOutlined style={{ color: '#1976d2', fontSize: '14px' }} />
                      <Typography variant="body2" fontWeight="medium">
                        {schedule.shift || 'Không xác định'}
                      </Typography>
                    </Box>
                  </TableCell>
                  <TableCell>
                    <Typography variant="body2" color={schedule.checkInTime ? 'success.main' : 'text.secondary'}>
                      {formatTime(schedule.checkInTime) || '--:--'}
                    </Typography>
                  </TableCell>
                  <TableCell>
                    <Typography variant="body2" color={schedule.checkOutTime ? 'success.main' : 'text.secondary'}>
                      {formatTime(schedule.checkOutTime) || '--:--'}
                    </Typography>
                  </TableCell>
                  <TableCell>{getStatusChip(schedule.status)}</TableCell>
                  <TableCell>
                    <Chip 
                      label={schedule.isActive ? 'Hoạt Động' : 'Không Hoạt Động'} 
                      size="small"
                      color={schedule.isActive ? 'success' : 'default'}
                    />
                  </TableCell>
                  <TableCell align="center">
                    <Box sx={{ display: 'flex', gap: 0.5 }}>
                      <Tooltip title="Chỉnh Sửa">
                        <IconButton size="small" color="primary" onClick={() => handleOpenDialog(schedule)}>
                          <EditOutlined />
                        </IconButton>
                      </Tooltip>
                      
                      {!schedule.checkInTime && (
                        <Tooltip title="Check In">
                          <IconButton 
                            size="small" 
                            color="success" 
                            onClick={() => handleCheckIn(schedule.id)}
                          >
                            <ClockCircleOutlined />
                          </IconButton>
                        </Tooltip>
                      )}
                      
                      {schedule.checkInTime && !schedule.checkOutTime && (
                        <Tooltip title="Check Out">
                          <IconButton 
                            size="small" 
                            color="warning" 
                            onClick={() => handleCheckOut(schedule.id)}
                          >
                            <CheckCircleOutlined />
                          </IconButton>
                        </Tooltip>
                      )}
                      
                      <Tooltip title="Xóa (Vô hiệu hóa)">
                        <IconButton size="small" color="error" onClick={() => handleDeleteSchedule(schedule.id)}>
                          <DeleteOutlined />
                        </IconButton>
                      </Tooltip>
                    </Box>
                  </TableCell>
                </TableRow>
              ))}
            {filteredSchedules.length === 0 && (
                <TableRow>
                    <TableCell colSpan={10} align="center">
                        <Typography variant="subtitle1">
                            Không có dữ liệu lịch trình.
                        </Typography>
                    </TableCell>
                </TableRow>
            )}
          </TableBody>
        </Table>
      </TableContainer>

      <TablePagination
        rowsPerPageOptions={[10, 20, 50]}
        component="div"
        count={filteredSchedules.length}
        rowsPerPage={rowsPerPage}
        page={page}
        onPageChange={handleChangePage}
        onRowsPerPageChange={handleChangeRowsPerPage}
      />

      <Dialog open={openDialog} onClose={handleCloseDialog} maxWidth="sm" fullWidth>
        <DialogTitle>
          {currentSchedule ? 'Chỉnh Sửa Lịch Trình' : 'Thêm Lịch Trình Mới'}
        </DialogTitle>
        <DialogContent>
          <FormControl fullWidth margin="dense" required>
            <InputLabel id="userId-label">Nhân Viên (STAFF)</InputLabel>
            <Select
              labelId="userId-label"
              name="userId"
              value={formData.userId}
              label="Nhân Viên (STAFF)"
              onChange={handleFormChange}
            >
              <MenuItem value=""><em>Chọn Nhân Viên</em></MenuItem>
              {users.map((user) => (
                <MenuItem key={user.id} value={user.id}>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <Avatar src={user.imageUrl} sx={{ width: 24, height: 24 }}>
                      {user.fullName?.charAt(0)}
                    </Avatar>
                    {user.fullName || user.username}
                  </Box>
                </MenuItem>
              ))}
            </Select>
          </FormControl>
          
          <TextField 
            margin="dense" 
            name="workDate" 
            label="Ngày Làm Việc" 
            type="date" 
            fullWidth 
            value={formData.workDate} 
            onChange={handleFormChange} 
            InputLabelProps={{ shrink: true }} 
            required
          />
          
          {/* Custom Shift Selection - Chỉ Sáng và Chiều */}
          <Typography variant="h6" sx={{ mt: 2, mb: 1 }}>
            Thiết Lập Ca Làm Việc
          </Typography>
          
          <Grid container spacing={2}>
            <Grid item xs={12} md={4}>
              <FormControl fullWidth margin="dense" required>
                <InputLabel id="shiftType-label">Loại Ca</InputLabel>
                <Select
                  labelId="shiftType-label"
                  value={shiftForm.shiftType}
                  label="Loại Ca"
                  onChange={(e) => handleShiftFormChange('shiftType', e.target.value)}
                >
                  <MenuItem value=""><em>Chọn Ca</em></MenuItem>
                  {shiftOptions.map((option) => (
                    <MenuItem key={option.value} value={option.value}>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        <ClockCircleOutlined style={{ color: '#1976d2' }} />
                        <Box>
                          <Typography>{option.label}</Typography>
                          <Typography variant="caption" color="text.secondary">
                            {option.defaultStart} - {option.defaultEnd}
                          </Typography>
                        </Box>
                      </Box>
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>
            
            <Grid item xs={12} md={4}>
              <TextField
                margin="dense"
                label="Thời Gian Bắt Đầu"
                type="time"
                fullWidth
                value={shiftForm.startTime}
                onChange={(e) => handleShiftFormChange('startTime', e.target.value)}
                InputLabelProps={{ shrink: true }}
                required
              />
            </Grid>
            
            <Grid item xs={12} md={4}>
              <TextField
                margin="dense"
                label="Thời Gian Kết Thúc"
                type="time"
                fullWidth
                value={shiftForm.endTime}
                onChange={(e) => handleShiftFormChange('endTime', e.target.value)}
                InputLabelProps={{ shrink: true }}
                required
              />
            </Grid>
          </Grid>

          {/* Preview of formatted shift */}
          {formData.shift && (
            <Box sx={{ mt: 2, p: 2, backgroundColor: '#e3f2fd', borderRadius: 1 }}>
              <Typography variant="body2" color="primary">
                <ClockCircleOutlined style={{ marginRight: 8 }} />
                Ca làm việc: {formData.shift}
              </Typography>
              <Typography variant="caption" color="textSecondary">
                Ca làm việc sẽ được lưu với định dạng này
              </Typography>
            </Box>
          )}

          {/* Check-in/Check-out Times */}
          <Typography variant="h6" sx={{ mt: 3, mb: 1 }}>
            Giờ Vào & Giờ Ra (Tùy Chọn)
          </Typography>
          
          <Grid container spacing={2}>
            <Grid item xs={12} md={6}>
              <TextField
                margin="dense"
                label="Giờ Vào"
                type="time"
                fullWidth
                value={timeForm.checkInTime}
                onChange={(e) => handleTimeFormChange('checkInTime', e.target.value)}
                InputLabelProps={{ shrink: true }}
                helperText="Để trống nếu chưa check-in"
              />
            </Grid>
            
            <Grid item xs={12} md={6}>
              <TextField
                margin="dense"
                label="Giờ Ra"
                type="time"
                fullWidth
                value={timeForm.checkOutTime}
                onChange={(e) => handleTimeFormChange('checkOutTime', e.target.value)}
                InputLabelProps={{ shrink: true }}
                helperText="Để trống nếu chưa check-out"
              />
            </Grid>
          </Grid>

          {/* Preview check-in/check-out times */}
          {(timeForm.checkInTime || timeForm.checkOutTime) && (
            <Box sx={{ mt: 2, p: 2, backgroundColor: '#e8f5e8', borderRadius: 1 }}>
              <Typography variant="body2" color="success.main">
                <CheckCircleOutlined style={{ marginRight: 8 }} />
                Thời gian chấm công: 
                {timeForm.checkInTime && ` Vào ${timeForm.checkInTime}`}
                {timeForm.checkInTime && timeForm.checkOutTime && ' |'}
                {timeForm.checkOutTime && ` Ra ${timeForm.checkOutTime}`}
              </Typography>
              <Typography variant="caption" color="textSecondary">
                Thời gian này sẽ được lưu sẵn thay vì cần check-in/check-out sau
              </Typography>
            </Box>
          )}
          
          <FormControl fullWidth margin="dense" required>
            <InputLabel id="status-label">Trạng Thái</InputLabel>
            <Select
              labelId="status-label"
              name="status"
              value={formData.status}
              label="Trạng Thái"
              onChange={handleFormChange}
            >
              {statusOptions.map((option) => (
                <MenuItem key={option.value} value={option.value}>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <Chip 
                      label={option.label} 
                      size="small" 
                      color={option.color} 
                      sx={{ minWidth: 80 }}
                    />
                    <Typography variant="body2">
                      {option.value === 'pending' && 'Chờ xác nhận'}
                      {option.value === 'confirmed' && 'Đang làm việc'}
                      {option.value === 'completed' && 'Đã hoàn thành'}
                      {option.value === 'cancelled' && 'Đã hủy'}
                    </Typography>
                  </Box>
                </MenuItem>
              ))}
            </Select>
          </FormControl>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseDialog} variant="outlined" color="inherit">Hủy</Button>
          <Button onClick={handleSaveSchedule} variant="contained" color="primary">Lưu</Button>
        </DialogActions>
      </Dialog>
    </MainCard>
  );
};

export default UserScheduleManager;
