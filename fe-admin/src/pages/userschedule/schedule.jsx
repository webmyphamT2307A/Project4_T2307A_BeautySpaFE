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

const UserScheduleManager = () => {
  const [schedules, setSchedules] = useState([]);
  const [users, setUsers] = useState([]);
  const [openDialog, setOpenDialog] = useState(false);
  const [currentSchedule, setCurrentSchedule] = useState(null);
  const [formData, setFormData] = useState({
    userId: '',
    shift: '',
    workDate: '',
    checkInTime: '',
    checkOutTime: '',
    status: 'pending',
    isLastTask: false,
    isActive: true
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
      setFormData({
        userId: schedule.userId || '',
        shift: schedule.shift || '',
        workDate: schedule.workDate || '',
        checkInTime: schedule.checkInTime || '',
        checkOutTime: schedule.checkOutTime || '',
        status: schedule.status || 'pending',
        isLastTask: schedule.isLastTask || false,
        isActive: schedule.isActive === undefined ? true : schedule.isActive,
      });
    } else {
      setCurrentSchedule(null);
      setFormData({
        userId: '',
        shift: '',
        workDate: '',
        checkInTime: '',
        checkOutTime: '',
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

  const handleSaveSchedule = () => {
    if (!formData.userId || !formData.workDate || !formData.shift) {
        toast.error("Please enter Employee, Work Date, and Shift.");
        return;
    }
    if (!formData.status || !statusOptions.find(opt => opt.value === formData.status)) {
        toast.error("Please select a valid status.");
        return;
    }

    const requestBody = {
        ...formData,
        userId: parseInt(formData.userId, 10),
        isLastTask: formData.isLastTask || false,
        isActive: formData.isActive === undefined ? true : formData.isActive,
        checkInTime: formData.checkInTime || null,
        checkOutTime: formData.checkOutTime || null,
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
            toast.success(response.message ||'Schedule updated successfully.');
          } else {
            toast.error(response.message || 'Failed to update schedule.');
          }
          setOpenDialog(false);
        })
        .catch(() => {
          toast.error('Error updating schedule.');
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
            toast.success(response.message || 'Schedule created successfully.');
            fetchSchedules();
          } else {
            toast.error(response.message || 'Failed to create schedule.');
          }
          setOpenDialog(false);
        })
        .catch(() => {
          toast.error('Error creating schedule.');
          setOpenDialog(false);
        });
    }
  };

  const handleDeleteSchedule = (scheduleId) => {
    if (window.confirm('Are you sure you want to delete (deactivate) this schedule?')) {
      fetch(`${SCHEDULE_API_URL}/${scheduleId}`, {
        method: 'PUT',
      })
        .then(res => res.json())
        .then(response => {
          if (response.status === 'SUCCESS') {
            fetchSchedules();
            toast.success(response.message || 'Schedule deleted successfully.');
          } else {
            toast.error(response.message || 'Failed to delete schedule.');
          }
        })
        .catch(() => toast.error('Error deleting schedule.'));
    }
  };

  const handleCheckIn = (scheduleId) => {
    if (window.confirm('Confirm check-in for this schedule?')) {
      fetch(`${SCHEDULE_API_URL}/check-in/${scheduleId}`, {
        method: 'PUT',
      })
        .then(res => res.json())
        .then(response => {
          if (response.status === 'SUCCESS') {
            fetchSchedules();
            toast.success(response.message || 'Check-in successful.');
          } else {
            toast.error(response.message || 'Failed to check-in.');
          }
        })
        .catch(() => toast.error('Error during check-in.'));
    }
  };

  const handleCheckOut = (scheduleId) => {
    if (window.confirm('Confirm check-out for this schedule?')) {
      fetch(`${SCHEDULE_API_URL}/check-out/${scheduleId}`, {
        method: 'PUT',
      })
        .then(res => res.json())
        .then(response => {
          if (response.status === 'SUCCESS') {
            fetchSchedules();
            toast.success(response.message || 'Check-out successful.');
          } else {
            toast.error(response.message || 'Failed to check-out.');
          }
        })
        .catch(() => toast.error('Error during check-out.'));
    }
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
    (schedule.roleName && schedule.roleName.toLowerCase().includes(searchQuery.toLowerCase())) ||
    (schedule.branchName && schedule.branchName.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  // Generate year options (current year ± 2)
  const currentYear = new Date().getFullYear();
  const yearOptions = [];
  for (let i = currentYear - 2; i <= currentYear + 2; i++) {
    yearOptions.push(i);
  }

  return (
    <MainCard title="User Schedule Management" secondary={
      <Button
        variant="contained"
        startIcon={<PlusOutlined />}
        onClick={() => handleOpenDialog()}
      >
        Add Schedule
      </Button>
    }>
      {/* Enhanced Filter Section */}
      <Box sx={{ mb: 3 }}>
        <Grid container spacing={2} alignItems="center">
          <Grid item xs={12} md={3}>
            <TextField
              size="small"
              placeholder="Search by Employee, Shift, Status, Role, Branch..."
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
              <InputLabel>Employee</InputLabel>
              <Select
                value={filterByUserId}
                label="Employee"
                onChange={(e) => handleFilterChange('userId', e.target.value)}
              >
                <MenuItem value="">All Employees</MenuItem>
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
              <InputLabel>Status</InputLabel>
              <Select
                value={filterStatus}
                label="Status"
                onChange={(e) => handleFilterChange('status', e.target.value)}
              >
                <MenuItem value="">All Status</MenuItem>
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
              <InputLabel>Month</InputLabel>
              <Select
                value={filterMonth}
                label="Month"
                onChange={(e) => handleFilterChange('month', e.target.value)}
              >
                <MenuItem value="">All</MenuItem>
                {Array.from({length: 12}, (_, i) => (
                  <MenuItem key={i+1} value={i+1}>{i+1}</MenuItem>
                ))}
              </Select>
            </FormControl>
          </Grid>

          <Grid item xs={6} md={1}>
            <FormControl size="small" fullWidth>
              <InputLabel>Year</InputLabel>
              <Select
                value={filterYear}
                label="Year"
                onChange={(e) => handleFilterChange('year', e.target.value)}
              >
                <MenuItem value="">All</MenuItem>
                {yearOptions.map((year) => (
                  <MenuItem key={year} value={year}>{year}</MenuItem>
                ))}
              </Select>
            </FormControl>
          </Grid>

          <Grid item xs={6} md={1.5}>
            <TextField
              size="small"
              label="Start Date"
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
              label="End Date"
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
            Clear Filters
          </Button>
        </Box>
      </Box>

      <TableContainer component={Paper} sx={{ boxShadow: 'none', borderRadius: '10px', maxHeight: 'calc(100vh - 400px)', overflow: 'auto' }}>
        <Table sx={{ minWidth: 650 }} stickyHeader>
          <TableHead>
            <TableRow>
              <TableCell>#</TableCell>
              <TableCell>Employee</TableCell>
              <TableCell>Role & Branch</TableCell>
              <TableCell>Work Date</TableCell>
              <TableCell>Shift</TableCell>
              <TableCell>Check-In</TableCell>
              <TableCell>Check-Out</TableCell>
              <TableCell>Status</TableCell>
              <TableCell>Active</TableCell>
              <TableCell align="center">Actions</TableCell>
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
                        {schedule.branchName}
                      </Typography>
                    </Box>
                  </TableCell>
                  <TableCell>{schedule.workDate}</TableCell>
                  <TableCell>{schedule.shift}</TableCell>
                  <TableCell>{schedule.checkInTime || '-'}</TableCell>
                  <TableCell>{schedule.checkOutTime || '-'}</TableCell>
                  <TableCell>{getStatusChip(schedule.status)}</TableCell>
                  <TableCell>
                    <Chip 
                      label={schedule.isActive ? 'Active' : 'Inactive'} 
                      size="small"
                      color={schedule.isActive ? 'success' : 'default'}
                      variant="outlined"
                    />
                  </TableCell>
                  <TableCell align="center">
                    <Box sx={{ display: 'flex', gap: 0.5 }}>
                      <Tooltip title="Edit">
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
                      
                      <Tooltip title="Delete (Deactivate)">
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
                            No schedule data available.
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
          {currentSchedule ? 'Edit Schedule' : 'Add New Schedule'}
        </DialogTitle>
        <DialogContent>
          <FormControl fullWidth margin="dense" required>
            <InputLabel id="userId-label">Employee (STAFF)</InputLabel>
            <Select
              labelId="userId-label"
              name="userId"
              value={formData.userId}
              label="Employee (STAFF)"
              onChange={handleFormChange}
            >
              <MenuItem value=""><em>Select Employee</em></MenuItem>
              {users.map((user) => (
                <MenuItem key={user.id} value={user.id}>
                  {user.fullName || user.username}
                </MenuItem>
              ))}
            </Select>
          </FormControl>
          <TextField margin="dense" name="workDate" label="Work Date" type="date" fullWidth value={formData.workDate} onChange={handleFormChange} InputLabelProps={{ shrink: true }} required/>
          <TextField margin="dense" name="shift" label="Shift" type="text" fullWidth value={formData.shift} onChange={handleFormChange} required/>
          <TextField margin="dense" name="checkInTime" label="Check-In Time" type="time" fullWidth value={formData.checkInTime} onChange={handleFormChange} InputLabelProps={{ shrink: true }} />
          <TextField margin="dense" name="checkOutTime" label="Check-Out Time" type="time" fullWidth value={formData.checkOutTime} onChange={handleFormChange} InputLabelProps={{ shrink: true }} />
          <FormControl fullWidth margin="dense" required>
            <InputLabel id="status-label">Status</InputLabel>
            <Select
              labelId="status-label"
              name="status"
              value={formData.status}
              label="Status"
              onChange={handleFormChange}
            >
              {statusOptions.map((option) => (
                <MenuItem key={option.value} value={option.value}>
                  {option.label}
                </MenuItem>
              ))}
            </Select>
          </FormControl>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseDialog} variant="outlined" color="inherit">Cancel</Button>
          <Button onClick={handleSaveSchedule} variant="contained" color="primary">Save</Button>
        </DialogActions>
      </Dialog>
    </MainCard>
  );
};

export default UserScheduleManager;
