import { useState, useEffect } from 'react';
import {
  Grid, Button, Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Paper,
  Dialog, DialogTitle, DialogContent, DialogActions, TextField, Select, FormControl,
  InputLabel, IconButton, TablePagination, Box, InputAdornment, Chip, MenuItem,
  Typography, Divider, Avatar, Tooltip
} from '@mui/material';
import Cookies from 'js-cookie';
import {
  SearchOutlined,
  CloseOutlined,
  EyeOutlined,
  EditOutlined,
  CalendarOutlined,
  UserOutlined,
  CheckOutlined,
  ClockCircleOutlined,
  FilterOutlined
} from '@ant-design/icons';
import MainCard from 'components/MainCard';
import { toast } from 'react-toastify';

const API_URL = 'http://localhost:8080/api/v1/admin/appointment';

const AppointmentManagement = () => {
  // States
  const [appointments, setAppointments] = useState([]);
  const [filteredAppointments, setFilteredAppointments] = useState([]);
   const [userRole, setUserRole] = useState('');
  const [loading, setLoading] = useState(false);
  const [viewOpen, setViewOpen] = useState(false);
  const [statusDialogOpen, setStatusDialogOpen] = useState(false);
  const [currentAppointment, setCurrentAppointment] = useState(null);
  const [newStatus, setNewStatus] = useState('');
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [dateFilter, setDateFilter] = useState({
    startDate: '',
    endDate: ''
  });

 const fetchAppointments = async () => {
  const token = Cookies.get('staff_token');
  const role = Cookies.get('staff_role');
  setUserRole(role);

  if (!token || role !== 'ROLE_STAFF' && role !== 'ROLE_MANAGE') {
    console.error('Người dùng chưa đăng nhập hoặc không có quyền truy cập');
    toast.error('Vui lòng đăng nhập lại.');
    return;
  }

  try {
    const userId = Cookies.get('staff_userId');
    const response = await fetch(`${API_URL}/byUser?userId=${userId}`, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });

    if (response.status === 401) {
      throw new Error('Token không hợp lệ hoặc đã hết hạn. Vui lòng đăng nhập lại.');
    }

    const data = await response.json();
    if (data.status === 'SUCCESS') {
      const mappedAppointments = data.data.map((item) => ({
        appointment_id: item.id,
        full_name: item.fullName,
        phone_number: item.phoneNumber,
        status: item.status,
        slot: item.slot,
        notes: item.notes,
        appointment_date: item.appointmentDate,
        end_time: item.endTime,
        price: item.price,
        service: { name: item.serviceName },
        branch: { name: item.branchName },
        customer: {
          name: item.customerName,
          image: item.customerImageUrl,
        },
        user: {
          name: item.userName,
          image: item.userImageUrl,
        },
      }));
      setAppointments(mappedAppointments);
    } else {
      console.error('Lỗi khi lấy danh sách lịch hẹn:', data.message);
    }
  } catch (error) {
    console.error('Lỗi khi gọi API:', error.message);
    toast.error(error.message);
    Cookies.remove('staff_token', { path: '/staff' });
    Cookies.remove('staff_role', { path: '/staff' });
    window.location.href = '/login';
  }
};

  useEffect(() => {
    fetchAppointments();
  }, []);
  // Filter appointments when search query or status filter changes
  useEffect(() => {
    let results = [...appointments];

    // Apply status filter
    if (statusFilter !== 'all') {
      results = results.filter(appointment => appointment.status === statusFilter);
      console.log('Dữ liệu từ API:', appointments);
    }

    // Apply date range filter
    if (dateFilter.startDate && dateFilter.endDate) {
      const start = new Date(dateFilter.startDate);
      const end = new Date(dateFilter.endDate);
      end.setHours(23, 59, 59); // Include the entire end day

      results = results.filter(appointment => {
        const appointmentDate = new Date(appointment.appointment_date);
        return appointmentDate >= start && appointmentDate <= end;
      });
    }

    // Apply search filter (search by name, phone, or service name)
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      results = results.filter(
        appointment =>
          appointment.full_name.toLowerCase().includes(query) ||
          appointment.phone_number.includes(query) ||
          appointment.service?.name?.toLowerCase().includes(query)
      );
    }

    setFilteredAppointments(results);
    setPage(0);
  }, [searchQuery, statusFilter, dateFilter, appointments]);

  // Handlers
  const handleChangePage = (event, newPage) => {
    setPage(newPage);
  };

  const handleChangeRowsPerPage = (event) => {
    setRowsPerPage(parseInt(event.target.value, 10));
    setPage(0);
  };

  const handleSearchChange = (event) => {
    setSearchQuery(event.target.value);
  };

  const handleStatusFilterChange = (event) => {
    setStatusFilter(event.target.value);
  };

  const handleDateFilterChange = (event) => {
    setDateFilter({
      ...dateFilter,
      [event.target.name]: event.target.value
    });
  };

  const clearDateFilter = () => {
    setDateFilter({
      startDate: '',
      endDate: ''
    });
  };

  const handleViewOpen = (appointment) => {
    setCurrentAppointment(appointment);
    setViewOpen(true);
  };

  const handleViewClose = () => {
    setViewOpen(false);
  };

  const handleStatusDialogOpen = (appointment) => {
    setCurrentAppointment(appointment);
    setNewStatus(appointment.status);
    setStatusDialogOpen(true);
  };

  const handleStatusDialogClose = () => {
    setStatusDialogOpen(false);
  };

  const handleStatusChange = () => {
    setLoading(true);

    const dateObj = new Date(currentAppointment.appointment_date);
    const day = String(dateObj.getDate()).padStart(2, '0');
    const month = String(dateObj.getMonth() + 1).padStart(2, '0');
    const year = dateObj.getFullYear();
    const formattedDate = `${day}/${month}/${year}`;

    const updatePayload = {
      fullName: currentAppointment.full_name,
      phoneNumber: currentAppointment.phone_number,
      status: newStatus,
      slot: currentAppointment.slot,
      notes: currentAppointment.notes,
      appointmentDate: formattedDate,
    };

    fetch(`${API_URL}/update?AiD=${currentAppointment.appointment_id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(updatePayload)
    })
      .then(res => res.json())
      .then(data => {
        if (data.status === 'SUCCESS') {
          toast.success('Cập nhật trạng thái thành công');
          setAppointments(prev =>
            prev.map(a =>
              a.appointment_id === currentAppointment.appointment_id
                ? { ...a, status: newStatus }
                : a
            )
          );
          setFilteredAppointments(prev =>
            prev.map(a =>
              a.appointment_id === currentAppointment.appointment_id
                ? { ...a, status: newStatus }
                : a
            )
          );
        } else {
          toast.error('Cập nhật thất bại');
        }
        setLoading(false);
        handleStatusDialogClose();
      })
      .catch(() => {
        toast.error('Lỗi khi cập nhật trạng thái');
        setLoading(false);
        handleStatusDialogClose();
      });
  };

  // Helper functions
  const formatDateTime = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  const formatTime = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getStatusChipProps = (status) => {
    switch (status) {
      case 'pending':
        return {
          label: 'Pending',
          color: 'warning',
          icon: <ClockCircleOutlined />
        };
      case 'confirmed':
        return {
          label: 'Confirmed',
          color: 'info',
          icon: <CheckOutlined />
        };
      case 'completed':
        return {
          label: 'Completed',
          color: 'success',
          icon: <CheckOutlined />
        };
      case 'cancelled':
        return {
          label: 'Cancelled',
          color: 'error',
          icon: <CloseOutlined />
        };
      default:
        return {
          label: status,
          color: 'default',
          icon: <ClockCircleOutlined />
        };
    }
  };

  // // Mock data generator function
  // function generateMockAppointments(count) {
  //   const statuses = ['pending', 'confirmed', 'completed', 'cancelled'];
  //   const serviceNames = ['Haircut', 'Massage', 'Facial', 'Manicure', 'Pedicure', 'Hair Coloring', 'Spa Treatment'];
  //   const branchNames = ['Main Branch', 'Downtown', 'Eastside', 'Westside'];
  //   const slots = ['Morning', 'Afternoon', 'Evening'];
  //   const customers = [
  //     { id: 1, name: 'John Smith', phone: '555-123-4567', email: 'john@example.com', image: null },
  //     { id: 2, name: 'Jane Doe', phone: '555-234-5678', email: 'jane@example.com', image: 'https://randomuser.me/api/portraits/women/43.jpg' },
  //     { id: 3, name: 'Robert Johnson', phone: '555-345-6789', email: 'robert@example.com', image: 'https://randomuser.me/api/portraits/men/22.jpg' },
  //     { id: 4, name: 'Emily Davis', phone: '555-456-7890', email: 'emily@example.com', image: 'https://randomuser.me/api/portraits/women/57.jpg' },
  //     { id: 5, name: 'Michael Wilson', phone: '555-567-8901', email: 'michael@example.com', image: null }
  //   ];

  //   const staffMembers = [
  //     { id: 1, name: 'Dr. Sarah Parker', image: 'https://randomuser.me/api/portraits/women/22.jpg' },
  //     { id: 2, name: 'Thomas Lee', image: 'https://randomuser.me/api/portraits/men/33.jpg' },
  //     { id: 3, name: 'Amanda Rodriguez', image: null }
  //   ];

  //   // Generate appointments
  //   const appointments = [];
  //   const now = new Date();

  //   for (let i = 1; i <= count; i++) {
  //     const randomDays = Math.floor(Math.random() * 30) - 15; // -15 to +14 days from now
  //     const appointmentDate = new Date(now);
  //     appointmentDate.setDate(now.getDate() + randomDays);
  //     appointmentDate.setHours(8 + Math.floor(Math.random() * 8), Math.floor(Math.random() * 4) * 15, 0); // Between 8am and 4pm

  //     const duration = Math.floor(Math.random() * 4 + 1) * 30; // 30, 60, 90, or 120 minutes
  //     const endTime = new Date(appointmentDate);
  //     endTime.setMinutes(appointmentDate.getMinutes() + duration);

  //     const randomCustomer = customers[Math.floor(Math.random() * customers.length)];
  //     const randomStaff = staffMembers[Math.floor(Math.random() * staffMembers.length)];
  //     const serviceName = serviceNames[Math.floor(Math.random() * serviceNames.length)];
  //     const price = Math.floor(Math.random() * 180) + 20; // $20 to $200

  //     const appointment = {
  //       appointment_id: i,
  //       service_id: Math.floor(Math.random() * 10) + 1,
  //       service: {
  //         name: serviceName,
  //         price: price,
  //         duration: duration
  //       },
  //       user_id: randomStaff.id,
  //       user: randomStaff,
  //       customer_id: randomCustomer.id,
  //       customer: randomCustomer,
  //       appointment_date: appointmentDate.toISOString(),
  //       end_time: endTime.toISOString(),
  //       status: statuses[Math.floor(Math.random() * statuses.length)],
  //       slot: slots[Math.floor(Math.random() * slots.length)],
  //       notes: Math.random() > 0.7 ? "Special requests: " + serviceName + " with extra care" : "",
  //       phone_number: randomCustomer.phone,
  //       full_name: randomCustomer.name,
  //       branch_id: Math.floor(Math.random() * 4) + 1,
  //       branch: {
  //         name: branchNames[Math.floor(Math.random() * branchNames.length)]
  //       },
  //       price: price,
  //       created_at: new Date(appointmentDate.getTime() - Math.random() * 86400000 * 7).toISOString(), // Up to 7 days before appointment
  //       is_active: true
  //     };

  //     appointments.push(appointment);
  //   }

  //   // Sort by appointment date (newest first)
  //   return appointments.sort((a, b) =>
  //     new Date(b.appointment_date) - new Date(a.appointment_date)
  //   );
  // }

  // Get current page appointments
  const currentAppointments = filteredAppointments.slice(
    page * rowsPerPage,
    page * rowsPerPage + rowsPerPage
  );

  return (
    <MainCard title="Appointment Management">
      <Grid container spacing={3}>
        {/* Search and Filter Controls */}
        <Grid item xs={12} display="flex" flexWrap="wrap" gap={2} alignItems="center" mb={2}>
          <TextField
            placeholder="Search by name, phone or service"
            variant="outlined"
            size="small"
            value={searchQuery}
            onChange={handleSearchChange}
            sx={{ width: { xs: '100%', sm: '280px' } }}
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <SearchOutlined />
                </InputAdornment>
              ),
              endAdornment: searchQuery ? (
                <InputAdornment position="end">
                  <IconButton size="small" onClick={() => setSearchQuery('')}>
                    <CloseOutlined style={{ fontSize: 14 }} />
                  </IconButton>
                </InputAdornment>
              ) : null
            }}
          />

          <FormControl size="small" sx={{ minWidth: 150 }}>
            <InputLabel id="status-filter-label">Status</InputLabel>
            <Select
              labelId="status-filter-label"
              id="status-filter"
              value={statusFilter}
              label="Status"
              onChange={handleStatusFilterChange}
            >
              <MenuItem value="all">All Status</MenuItem>
              <MenuItem value="pending">Pending</MenuItem>
              <MenuItem value="confirmed">Confirmed</MenuItem>
              <MenuItem value="completed">Completed</MenuItem>
              <MenuItem value="cancelled">Cancelled</MenuItem>
            </Select>
          </FormControl>

          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, flexWrap: 'wrap' }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <TextField
                label="From Date"
                type="date"
                size="small"
                name="startDate"
                value={dateFilter.startDate}
                onChange={handleDateFilterChange}
                InputLabelProps={{ shrink: true }}
                sx={{ width: 150 }}
              />
              <Typography variant="body2">to</Typography>
              <TextField
                label="To Date"
                type="date"
                size="small"
                name="endDate"
                value={dateFilter.endDate}
                onChange={handleDateFilterChange}
                InputLabelProps={{ shrink: true }}
                sx={{ width: 150 }}
              />
            </Box>

            {(dateFilter.startDate || dateFilter.endDate) && (
              <IconButton size="small" onClick={clearDateFilter}>
                <CloseOutlined style={{ fontSize: 14 }} />
              </IconButton>
            )}
          </Box>
        </Grid>

        {/* Appointments Table */}
        <Grid item xs={12}>
          <TableContainer component={Paper} sx={{ maxHeight: 440, '& .MuiTableHead-root': { position: 'sticky', top: 0, zIndex: 10 } }}>
            <Table stickyHeader>
              <TableHead>
                <TableRow>
                  <TableCell sx={{ backgroundColor: '#f8f8f8', fontWeight: 600 }}>ID</TableCell>
                  <TableCell sx={{ backgroundColor: '#f8f8f8', fontWeight: 600 }}>Customer</TableCell>
                  <TableCell sx={{ backgroundColor: '#f8f8f8', fontWeight: 600 }}>Service</TableCell>
                  <TableCell sx={{ backgroundColor: '#f8f8f8', fontWeight: 600 }}>Date & Time</TableCell>
                  <TableCell sx={{ backgroundColor: '#f8f8f8', fontWeight: 600 }}>Staff</TableCell>
                  <TableCell sx={{ backgroundColor: '#f8f8f8', fontWeight: 600 }}>Branch</TableCell>
                  <TableCell sx={{ backgroundColor: '#f8f8f8', fontWeight: 600 }}>Status</TableCell>
                  <TableCell sx={{ backgroundColor: '#f8f8f8', fontWeight: 600 }}>Actions</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {loading ? (
                  <TableRow>
                    <TableCell colSpan={8} align="center">Loading...</TableCell>
                  </TableRow>
                ) : currentAppointments.length > 0 ? (
                  currentAppointments.map((appointment) => {
                    const statusProps = getStatusChipProps(appointment.status);

                    return (
                      <TableRow key={appointment.appointment_id} hover>
                        <TableCell>#{appointment.appointment_id}</TableCell>
                        <TableCell>
                          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                            <Avatar
                              src={appointment.customer?.image}
                              alt={appointment.full_name}
                              sx={{ width: 32, height: 32 }}
                            >
                              {!appointment.customer?.image && <UserOutlined />}
                            </Avatar>
                            <Box>
                              <Typography variant="body2" sx={{ fontWeight: 500 }}>
                                {appointment.full_name}
                              </Typography>
                              <Typography variant="caption" color="textSecondary">
                                {appointment.phone_number}
                              </Typography>
                            </Box>
                          </Box>
                        </TableCell>
                        <TableCell>
                          <Typography variant="body2" sx={{ fontWeight: 500 }}>
                            {appointment.service?.name}
                          </Typography>
                          <Typography variant="caption" color="primary">
                            ${appointment.price.toFixed(2)} • {appointment.service?.duration} min
                          </Typography>
                        </TableCell>
                        <TableCell>
                          <Typography variant="body2" sx={{ fontWeight: 500 }}>
                            {formatDate(appointment.appointment_date)}
                          </Typography>
                          <Typography variant="caption" color="textSecondary">
                            {formatTime(appointment.appointment_date)} - {formatTime(appointment.end_time)}
                          </Typography>
                        </TableCell>
                        <TableCell>
                          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                            <Avatar
                              src={appointment.user?.image}
                              alt={appointment.user?.name}
                              sx={{ width: 32, height: 32 }}
                            >
                              {!appointment.user?.image && <UserOutlined />}
                            </Avatar>
                            <Typography variant="body2">
                              {appointment.user?.name || 'Unassigned'}
                            </Typography>
                          </Box>
                        </TableCell>
                        <TableCell>{appointment.branch?.name}</TableCell>
                        <TableCell>
                          <Chip
                            icon={statusProps.icon}
                            label={statusProps.label}
                            size="small"
                            color={statusProps.color}
                            sx={{
                              borderRadius: '16px',
                              fontWeight: 500,
                              fontSize: '0.75rem'
                            }}
                          />
                        </TableCell>
                        <TableCell>
  <Tooltip title="View Details">
    <IconButton
      onClick={() => handleViewOpen(appointment)}
      color="info"
      size="small"
    >
      <EyeOutlined />
    </IconButton>
  </Tooltip>

  {userRole === 'ROLE_MANAGE' && (
    <Tooltip title="Update Status">
      <IconButton
        onClick={() => handleStatusDialogOpen(appointment)}
        color="primary"
        size="small"
      >
        <EditOutlined />
      </IconButton>
    </Tooltip>
  )}
</TableCell>
                      </TableRow>
                    );
                  })
                ) : (
                  <TableRow>
                    <TableCell colSpan={8} align="center">No appointments found</TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </TableContainer>
          <TablePagination
            rowsPerPageOptions={[10, 15, 25]}
            component="div"
            count={filteredAppointments.length}
            rowsPerPage={rowsPerPage}
            page={page}
            onPageChange={handleChangePage}
            onRowsPerPageChange={handleChangeRowsPerPage}
          />
        </Grid>
      </Grid>

      {/* View Appointment Details Dialog */}
      <Dialog open={viewOpen} onClose={handleViewClose} maxWidth="md" fullWidth>
        <DialogTitle sx={{ borderBottom: '1px solid #e0e0e0', pb: 2 }}>
          Appointment Details
          <IconButton
            aria-label="close"
            onClick={handleViewClose}
            sx={{
              position: 'absolute',
              right: 8,
              top: 8
            }}
          >
            <CloseOutlined />
          </IconButton>
        </DialogTitle>
        <DialogContent sx={{ pt: 3 }}>
          {currentAppointment && (
            <Grid container spacing={3}>
              <Grid item xs={12} sm={6}>
                <Box sx={{ mb: 3 }}>
                  <Typography variant="h6" gutterBottom>
                    Customer Information
                  </Typography>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 2 }}>
                    <Avatar
                      src={currentAppointment.customer?.image}
                      alt={currentAppointment.full_name}
                      sx={{ width: 64, height: 64 }}
                    >
                      {!currentAppointment.customer?.image && <UserOutlined style={{ fontSize: 32 }} />}
                    </Avatar>
                    <Box>
                      <Typography variant="h5">{currentAppointment.full_name}</Typography>
                      <Typography variant="body2" color="textSecondary">
                        {currentAppointment.phone_number}
                      </Typography>
                      {currentAppointment.customer?.email && (
                        <Typography variant="body2" color="textSecondary">
                          {currentAppointment.customer.email}
                        </Typography>
                      )}
                    </Box>
                  </Box>
                </Box>

                <Box sx={{ mb: 3 }}>
                  <Typography variant="h6" gutterBottom>
                    Appointment Details
                  </Typography>
                  <Grid container spacing={2}>
                    <Grid item xs={6}>
                      <Typography variant="caption" color="textSecondary">Date</Typography>
                      <Typography variant="body2" sx={{ fontWeight: 500 }}>
                        {formatDate(currentAppointment.appointment_date)}
                      </Typography>
                    </Grid>
                    <Grid item xs={6}>
                      <Typography variant="caption" color="textSecondary">Time</Typography>
                      <Typography variant="body2" sx={{ fontWeight: 500 }}>
                        {formatTime(currentAppointment.appointment_date)} - {formatTime(currentAppointment.end_time)}
                      </Typography>
                    </Grid>
                    <Grid item xs={6}>
                      <Typography variant="caption" color="textSecondary">Branch</Typography>
                      <Typography variant="body2">{currentAppointment.branch.name}</Typography>
                    </Grid>
                    <Grid item xs={6}>
                      <Typography variant="caption" color="textSecondary">Status</Typography>
                      <Box sx={{ mt: 0.5 }}>
                        <Chip
                          icon={getStatusChipProps(currentAppointment.status).icon}
                          label={getStatusChipProps(currentAppointment.status).label}
                          size="small"
                          color={getStatusChipProps(currentAppointment.status).color}
                        />
                      </Box>
                    </Grid>
                    <Grid item xs={12}>
                      <Typography variant="caption" color="textSecondary">Staff Assigned</Typography>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mt: 0.5 }}>
                        <Avatar
                          src={currentAppointment.user?.image}
                          alt={currentAppointment.user?.name}
                          sx={{ width: 24, height: 24 }}
                        >
                          {!currentAppointment.user?.image && <UserOutlined style={{ fontSize: 14 }} />}
                        </Avatar>
                        <Typography variant="body2">
                          {currentAppointment.user?.name || 'Unassigned'}
                        </Typography>
                      </Box>
                    </Grid>
                    {currentAppointment.notes && (
                      <Grid item xs={12}>
                        <Typography variant="caption" color="textSecondary">Notes</Typography>
                        <Typography variant="body2">{currentAppointment.notes}</Typography>
                      </Grid>
                    )}
                  </Grid>
                </Box>
              </Grid>

              <Grid item xs={12} sm={6}>
                <Box sx={{ mb: 3 }}>
                  <Typography variant="h6" gutterBottom>
                    Service Information
                  </Typography>
                  <Paper variant="outlined" sx={{ p: 2, borderRadius: 2 }}>
                    <Typography variant="subtitle1" sx={{ fontWeight: 600, mb: 1 }}>
                      {currentAppointment.service?.name}
                    </Typography>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                      <Typography variant="body2">Price:</Typography>
                      <Typography variant="body2" color="primary" sx={{ fontWeight: 600 }}>
                        ${currentAppointment.price.toFixed(2)}
                      </Typography>
                    </Box>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                      <Typography variant="body2">Duration:</Typography>
                      <Typography variant="body2">
                        {currentAppointment.service.duration} minutes
                      </Typography>
                    </Box>
                  </Paper>
                </Box>

                <Box>
                  <Typography variant="h6" gutterBottom>
                    Booking Information
                  </Typography>
                  <Grid container spacing={2}>
                    <Grid item xs={6}>
                      <Typography variant="caption" color="textSecondary">Booking ID</Typography>
                      <Typography variant="body2">#{currentAppointment.appointment_id}</Typography>
                    </Grid>
                    <Grid item xs={6}>
                      <Typography variant="caption" color="textSecondary">Created On</Typography>
                      <Typography variant="body2">{formatDate(currentAppointment.created_at)}</Typography>
                    </Grid>
                    <Grid item xs={12}>
                      <Divider sx={{ my: 1 }} />
                      <Box sx={{ display: 'flex', justifyContent: 'flex-end', mt: 2 }}>
  
  {/* --- BỌC NÚT UPDATE TRONG ĐIỀU KIỆN --- */}
  {userRole === 'ROLE_MANAGE' && (
    <Button
      variant="contained"
      color="primary"
      onClick={() => handleStatusDialogOpen(currentAppointment)}
    >
      Update Status
    </Button>
  )}
</Box>
                    </Grid>
                  </Grid>
                </Box>
              </Grid>
            </Grid>
          )}
        </DialogContent>
      </Dialog>

      {/* Update Status Dialog */}
      <Dialog open={statusDialogOpen} onClose={handleStatusDialogClose} maxWidth="xs" fullWidth>
        <DialogTitle>
          Update Appointment Status
        </DialogTitle>
        <DialogContent>
          <Typography variant="body2" color="textSecondary" sx={{ mb: 2 }}>
            Change the status for appointment #{currentAppointment?.appointment_id}
          </Typography>
          <FormControl fullWidth>
            <InputLabel id="status-select-label">Status</InputLabel>
            <Select
              labelId="status-select-label"
              id="status-select"
              value={newStatus}
              label="Status"
              onChange={(e) => setNewStatus(e.target.value)}
            >
              <MenuItem value="pending">
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  <Chip
                    size="small"
                    label="Pending"
                    color="warning"
                    sx={{ minWidth: 80 }}
                  />
                  <Typography variant="body2">Waiting for confirmation</Typography>
                </Box>
              </MenuItem>
              <MenuItem value="confirmed">
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  <Chip
                    size="small"
                    label="Confirmed"
                    color="info"
                    sx={{ minWidth: 80 }}
                  />
                  <Typography variant="body2">Appointment is confirmed</Typography>
                </Box>
              </MenuItem>
              <MenuItem value="completed">
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  <Chip
                    size="small"
                    label="Completed"
                    color="success"
                    sx={{ minWidth: 80 }}
                  />
                  <Typography variant="body2">Service has been provided</Typography>
                </Box>
              </MenuItem>
              <MenuItem value="cancelled">
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  <Chip
                    size="small"
                    label="Cancelled"
                    color="error"
                    sx={{ minWidth: 80 }}
                  />
                  <Typography variant="body2">Appointment was cancelled</Typography>
                </Box>
              </MenuItem>
            </Select>
          </FormControl>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleStatusDialogClose} color="inherit">Cancel</Button>
          <Button onClick={handleStatusChange} variant="contained" color="primary">
            Update Status
          </Button>
        </DialogActions>
      </Dialog>
    </MainCard>
  );
};

export default AppointmentManagement;