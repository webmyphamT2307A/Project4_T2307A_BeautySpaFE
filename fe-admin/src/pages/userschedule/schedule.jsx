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
  InputLabel
} from '@mui/material';
import MainCard from 'components/MainCard';
import {
  PlusOutlined,
  EditOutlined,
  DeleteOutlined,
  SearchOutlined,
  CloseOutlined
} from '@ant-design/icons';
import { toast } from 'react-toastify';

const API_BASE_URL = 'http://localhost:8080/api/v1';
const SCHEDULE_API_URL = `${API_BASE_URL}/users-schedules`;
const USER_API_URL = `${API_BASE_URL}/admin/accounts/find-all`;
const STAFF_ROLE_NAME = "STAFF";

// Define status options based on your ENUM
const statusOptions = [
  { value: 'pending', label: 'Pending' },
  { value: 'confirmed', label: 'Confirmed' },
  { value: 'completed', label: 'Completed' },
  { value: 'cancelled', label: 'Cancelled' },
  // You can add other statuses if your ENUM is more extensive
  // or if you want to allow other temporary client-side statuses
  // that might be mapped to the ENUM on the backend or before saving.
  // For now, we'll stick to the database ENUM.
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
    status: 'pending', // Default to a valid ENUM value
    isLastTask: false,
    isActive: true
  });
  const [searchQuery, setSearchQuery] = useState('');
  const [filterByUserId, setFilterByUserId] = useState('');
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
    if (filterByUserId) {
      params.append('userId', filterByUserId);
    }

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
  }, [filterByUserId]);

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

  const handleFilterUserIdChange = (event) => {
    setFilterByUserId(event.target.value);
    setPage(0);
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
        status: schedule.status || 'pending', // Ensure status is one of the ENUM values
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
        status: 'pending', // Default to 'pending'
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
        method: 'DELETE',
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

  const filteredSchedules = schedules.filter(schedule =>
    (schedule.userName && schedule.userName.toLowerCase().includes(searchQuery.toLowerCase())) ||
    (schedule.shift && schedule.shift.toLowerCase().includes(searchQuery.toLowerCase())) ||
    (schedule.status && schedule.status.toLowerCase().includes(searchQuery.toLowerCase()))
  );

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
      <Box sx={{ mb: 3, display: 'flex', gap: 2 }}>
        <TextField
          size="small"
          placeholder="Search by Employee, Shift, Status..."
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
          sx={{ maxWidth: '40%' }}
        />
        <FormControl size="small" sx={{ minWidth: 200 }}>
          <InputLabel>Filter by Employee (STAFF)</InputLabel>
          <Select
            value={filterByUserId}
            label="Filter by Employee (STAFF)"
            onChange={handleFilterUserIdChange}
          >
            <MenuItem value="">
              <em>All Employees (STAFF)</em>
            </MenuItem>
            {users.map((user) => (
              <MenuItem key={user.id} value={user.id}>
                {user.fullName || user.username}
              </MenuItem>
            ))}
          </Select>
        </FormControl>
      </Box>

      <TableContainer component={Paper} sx={{ boxShadow: 'none', borderRadius: '10px', maxHeight: 'calc(100vh - 400px)', overflow: 'auto' }}>
        <Table sx={{ minWidth: 650 }} stickyHeader>
          <TableHead>
            <TableRow>
              <TableCell>#</TableCell>
              <TableCell>Employee</TableCell>
              <TableCell>Email</TableCell>
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
                  <TableCell>{schedule.userName}</TableCell>
                  <TableCell>{schedule.userEmail}</TableCell>
                  <TableCell>{schedule.workDate}</TableCell>
                  <TableCell>{schedule.shift}</TableCell>
                  <TableCell>{schedule.checkInTime || '-'}</TableCell>
                  <TableCell>{schedule.checkOutTime || '-'}</TableCell>
                  <TableCell>{schedule.status}</TableCell>
                  <TableCell>{schedule.isActive ? 'Active' : 'Inactive'}</TableCell>
                  <TableCell align="center">
                    <Tooltip title="Edit">
                      <IconButton size="small" color="primary" onClick={() => handleOpenDialog(schedule)}>
                        <EditOutlined />
                      </IconButton>
                    </Tooltip>
                    <Tooltip title="Delete (Deactivate)">
                      <IconButton size="small" color="error" onClick={() => handleDeleteSchedule(schedule.id)}>
                        <DeleteOutlined />
                      </IconButton>
                    </Tooltip>
                  </TableCell>
                </TableRow>
              ))}
            {filteredSchedules.length === 0 && (
                <TableRow>
                    <TableCell colSpan={10} align="center">
                        <Typography variant="subtitle1">
                            {filterByUserId ? "No schedules found for this employee." : "No schedule data available."}
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
          {/* Replace TextField for status with Select */}
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
