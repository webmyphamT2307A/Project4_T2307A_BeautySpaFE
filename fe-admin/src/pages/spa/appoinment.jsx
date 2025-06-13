import { useState, useEffect } from 'react';
import {
  Grid, Button, Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Paper,
  Dialog, DialogTitle, DialogContent, DialogActions, TextField, Select, FormControl,
  InputLabel, IconButton, TablePagination, Box, InputAdornment, Chip, MenuItem,
  Typography, Divider, Avatar, Tooltip
} from '@mui/material';
import {
  SearchOutlined,
  CloseOutlined,
  EyeOutlined,
  EditOutlined, 
  CalendarOutlined,
  UserOutlined,
  CheckOutlined,
  ClockCircleOutlined,
  FilterOutlined,
  FormOutlined  
} from '@ant-design/icons';
import MainCard from 'components/MainCard';
import { useSearchParams } from 'react-router-dom';
import { toast } from 'react-toastify';

const API_URL = 'http://localhost:8080/api/v1/admin/appointment';
const API_STAFF_URL = 'http://localhost:8080/api/v1/admin/accounts/find-all';

const AppointmentManagement = () => {
  // States
  const [searchParams] = useSearchParams();
  const [appointments, setAppointments] = useState([]);
  const [filteredAppointments, setFilteredAppointments] = useState([]);
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

  const [staffList, setStaffList] = useState([]);
  const [editDetailDialogOpen, setEditDetailDialogOpen] = useState(false);
  const [appointmentToEditDetails, setAppointmentToEditDetails] = useState(null);
  const [selectedStaffId, setSelectedStaffId] = useState(null); 
    useEffect(() => {
        const dateFromUrl = searchParams.get('date');
        if (dateFromUrl) {
            // Tự động gán ngày từ URL vào bộ lọc
            setDateFilter({
                startDate: dateFromUrl,
                endDate: dateFromUrl
            });
            // Bảng sẽ tự động cập nhật vì useEffect theo dõi `dateFilter` đã có sẵn
        }
    }, [searchParams]);

  // Fetch danh sách lịch hẹn ban đầu
  useEffect(() => {
    setLoading(true);
    fetch(API_URL)
      .then(res => res.json())
      .then(data => {
        if (data.status === 'SUCCESS' && Array.isArray(data.data)) {
          const mappedAppointments = data.data.map(item => ({
            appointment_id: item.id,
            full_name: item.fullName,
            phone_number: item.phoneNumber,
            status: item.status,
            slot: item.slot,
            notes: item.notes,
            appointment_date: item.appointmentDate,
            end_time: item.endTime,
            price: item.price,
            service: {
              id: item.serviceId, 
              name: item.serviceName,
              duration: item.serviceDuration || 60, 
              price: item.price
            },
            branch: {
              id: item.branchId, // Giả sử BE trả về branchId
              name: item.branchName
            },
            customer: {
              name: item.customerName,
              image: item.customerImageUrl || item.customerImage || '',
              email: item.customerEmail || ''
            },
            user: { name: item.userName, image: item.userImageUrl || '' },
            created_at: item.appointmentDate, 
          }));
          setAppointments(mappedAppointments);
          setFilteredAppointments(mappedAppointments);
        } else {
          setAppointments([]);
          setFilteredAppointments([]);
          toast.error(data.message || 'Lỗi khi tải dữ liệu lịch hẹn');
        }
        setLoading(false);
      })
      .catch(() => {
        setLoading(false);
        toast.error('Lỗi khi tải dữ liệu lịch hẹn');
      });
  }, []);

  // Fetch danh sách nhân viên
   useEffect(() => {
    fetch(API_STAFF_URL)
      .then(res => {
        if (!res.ok) {
          throw new Error(`HTTP error! status: ${res.status}`);
        }
        return res.json();
      })
      .then(data => {
        console.log('Dữ liệu nhân viên thô từ API:', data);

        if (data.status === 'SUCCESS' && Array.isArray(data.data)) {
        
          const filteredStaff = data.data.filter(user =>
            user.role &&  user.role.id === 3 && user.isActive 
          );
          
          console.log('Danh sách nhân viên đã lọc:', filteredStaff);

          setStaffList(filteredStaff);

          if (filteredStaff.length === 0) {
            toast.info('Không tìm thấy nhân viên/admin nào phù hợp (đang hoạt động) từ API.');
          }

        } else {
          setStaffList([]);
          toast.error(data.message || 'Không tải được danh sách nhân viên (dữ liệu không hợp lệ).');
        }
      })
      .catch(error => {
        setStaffList([]);
        toast.error(`Lỗi khi tải danh sách nhân viên: ${error.message}`);
        console.error("Lỗi khi fetch nhân viên:", error);
      });
  }, []);



  // Filter appointments
  useEffect(() => {
    let results = [...appointments];
    if (statusFilter !== 'all') {
      results = results.filter(appointment => appointment.status === statusFilter);
    }
    if (dateFilter.startDate && dateFilter.endDate) {
      const start = new Date(dateFilter.startDate);
      const end = new Date(dateFilter.endDate);
      end.setHours(23, 59, 59);
      results = results.filter(appointment => {
        const appointmentDate = new Date(appointment.appointment_date);
        return appointmentDate >= start && appointmentDate <= end;
      });
    }
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      results = results.filter(
        appointment =>
          appointment.full_name.toLowerCase().includes(query) ||
          appointment.phone_number.includes(query) ||
          appointment.service.name.toLowerCase().includes(query)
      );
    }
    setFilteredAppointments(results);
    setPage(0);
  }, [searchQuery, statusFilter, dateFilter, appointments]);

  // Handlers
  const handleChangePage = (event, newPage) => setPage(newPage);
  const handleChangeRowsPerPage = (event) => {
    setRowsPerPage(parseInt(event.target.value, 10));
    setPage(0);
  };
  const handleSearchChange = (event) => setSearchQuery(event.target.value);
  const handleStatusFilterChange = (event) => setStatusFilter(event.target.value);
  const handleDateFilterChange = (event) => setDateFilter({ ...dateFilter, [event.target.name]: event.target.value });
  const clearDateFilter = () => setDateFilter({ startDate: '', endDate: '' });

  const handleViewOpen = (appointment) => {
    setCurrentAppointment(appointment);
    setViewOpen(true);
  };
  const handleViewClose = () => setViewOpen(false);

  const handleStatusDialogOpen = (appointment) => {
    setCurrentAppointment(appointment);
    setNewStatus(appointment.status);
    setStatusDialogOpen(true);
  };
  const handleStatusDialogClose = () => setStatusDialogOpen(false);

  // Hàm xử lý cập nhật trạng thái
  const handleStatusChange = () => {
    if (!currentAppointment) return;
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
      price: currentAppointment.price,
      userId: currentAppointment.user?.id || null, 
      serviceId: currentAppointment.service?.id,
      branchId: currentAppointment.branch?.id,
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
          const updatedAppointments = appointments.map(a =>
            a.appointment_id === currentAppointment.appointment_id
              ? { ...a, status: newStatus }
              : a
          );
          setAppointments(updatedAppointments);
          handleStatusDialogClose();
        } else {
          toast.error(data.message || 'Cập nhật thất bại');
        }
        setLoading(false);
      })
      .catch(() => {
        toast.error('Lỗi khi cập nhật trạng thái');
        setLoading(false);
        handleStatusDialogClose();
      });
  };

  // Handlers cho Edit Detail Dialog (bao gồm gán nhân viên)
  const handleOpenEditDetailDialog = (appointment) => {
    setAppointmentToEditDetails(appointment);
    setSelectedStaffId(appointment.user?.id || null);
    setEditDetailDialogOpen(true);
  };

  const handleCloseEditDetailDialog = () => {
    setEditDetailDialogOpen(false);
    setAppointmentToEditDetails(null);
    setSelectedStaffId(null);
  };

  const handleSelectedStaffChange = (event) => {
    setSelectedStaffId(event.target.value === '' ? null : event.target.value);
  };

  const handleSaveAppointmentDetails = () => {
    if (!appointmentToEditDetails) return;
    setLoading(true);

    const dateObj = new Date(appointmentToEditDetails.appointment_date);
    const day = String(dateObj.getDate()).padStart(2, '0');
    const month = String(dateObj.getMonth() + 1).padStart(2, '0');
    const year = dateObj.getFullYear();
    const formattedAppDate = `${day}/${month}/${year}`;

    // Payload này nên bao gồm tất cả các trường mà BE AppointmentDto cho phép cập nhật
    // hoặc yêu cầu khi gọi API update.
    const updatePayload = {
      fullName: appointmentToEditDetails.full_name,
      phoneNumber: appointmentToEditDetails.phone_number,
      status: appointmentToEditDetails.status, 
      slot: appointmentToEditDetails.slot,
      notes: appointmentToEditDetails.notes, 
      appointmentDate: formattedAppDate,
      price: appointmentToEditDetails.price,
      serviceId: appointmentToEditDetails.service?.id,
      branchId: appointmentToEditDetails.branch?.id,
      userId: selectedStaffId 
    };

    fetch(`${API_URL}/update?AiD=${appointmentToEditDetails.appointment_id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(updatePayload)
    })
      .then(res => res.json())
      .then(data => {
        if (data.status === 'SUCCESS') {
          toast.success('Cập nhật lịch hẹn thành công!');
          // Cập nhật lại danh sách appointments trên FE
          const newStaffMemberInfo = staffList.find(staff => staff.id === selectedStaffId);

          const updatedAppointments = appointments.map(app =>
            app.appointment_id === appointmentToEditDetails.appointment_id
              ? {
                  ...app,
                  user: newStaffMemberInfo
                    ? { id: newStaffMemberInfo.id, name: newStaffMemberInfo.fullName, image: newStaffMemberInfo.imageUrl || '', email: newStaffMemberInfo.email || '' }
                    : null,
                  notes: updatePayload.notes 
                }
              : app
          );
          setAppointments(updatedAppointments);
          handleCloseEditDetailDialog();
        } else {
          toast.error(data.message || 'Cập nhật lịch hẹn thất bại');
        }
        setLoading(false);
      })
      .catch(() => {
        toast.error('Lỗi khi cập nhật lịch hẹn');
        setLoading(false);
      });
  };


  // Helper functions
  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    const date = new Date(dateString);
    return date.toLocaleDateString('en-GB', { year: 'numeric', month: 'short', day: 'numeric' });
  };

  const formatTime = (dateString) => {
    if (!dateString) return 'N/A';
    const date = new Date(dateString);
    return date.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: true });
  };
  const getStatusChipProps = (status) => {
    switch (status) {
      case 'pending': return { label: 'Pending', color: 'warning', icon: <ClockCircleOutlined /> };
      case 'confirmed': return { label: 'Confirmed', color: 'info', icon: <CheckOutlined /> };
      case 'completed': return { label: 'Completed', color: 'success', icon: <CheckOutlined /> };
      case 'cancelled': return { label: 'Cancelled', color: 'error', icon: <CloseOutlined /> };
      default: return { label: status, color: 'default', icon: <ClockCircleOutlined /> };
    }
  };

  const currentAppointments = filteredAppointments.slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage);

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
              startAdornment: (<InputAdornment position="start"><SearchOutlined /></InputAdornment>),
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
            <InputLabel>Status</InputLabel>
            <Select value={statusFilter} label="Status" onChange={handleStatusFilterChange}>
              <MenuItem value="all">All Status</MenuItem>
              <MenuItem value="pending">Pending</MenuItem>
              <MenuItem value="confirmed">Confirmed</MenuItem>
              <MenuItem value="completed">Completed</MenuItem>
              <MenuItem value="cancelled">Cancelled</MenuItem>
            </Select>
          </FormControl>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, flexWrap: 'wrap' }}>
            <TextField label="From Date" type="date" size="small" name="startDate" value={dateFilter.startDate} onChange={handleDateFilterChange} InputLabelProps={{ shrink: true }} sx={{ width: 150 }} />
            <Typography variant="body2">to</Typography>
            <TextField label="To Date" type="date" size="small" name="endDate" value={dateFilter.endDate} onChange={handleDateFilterChange} InputLabelProps={{ shrink: true }} sx={{ width: 150 }} />
            {(dateFilter.startDate || dateFilter.endDate) && (
              <IconButton size="small" onClick={clearDateFilter}><CloseOutlined style={{ fontSize: 14 }} /></IconButton>
            )}
          </Box>
        </Grid>

        {/* Appointments Table */}
        <Grid item xs={12}>
          <TableContainer component={Paper} sx={{ maxHeight: 440, '& .MuiTableHead-root': { position: 'sticky', top: 0, zIndex: 10, backgroundColor: '#f8f8f8' } }}>
            <Table stickyHeader>
              <TableHead>
                <TableRow>
                  <TableCell sx={{ fontWeight: 600 }}>ID</TableCell>
                  <TableCell sx={{ fontWeight: 600 }}>Customer</TableCell>
                  <TableCell sx={{ fontWeight: 600 }}>Service</TableCell>
                  <TableCell sx={{ fontWeight: 600 }}>Date & Time</TableCell>
                  <TableCell sx={{ fontWeight: 600 }}>Staff</TableCell>
                  <TableCell sx={{ fontWeight: 600 }}>Branch</TableCell>
                  <TableCell sx={{ fontWeight: 600 }}>Status</TableCell>
                  <TableCell sx={{ fontWeight: 600, textAlign: 'center' }}>Actions</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {loading ? (
                  <TableRow><TableCell colSpan={8} align="center">Loading...</TableCell></TableRow>
                ) : currentAppointments.length > 0 ? (
                  currentAppointments.map((appointment) => {
                    const statusProps = getStatusChipProps(appointment.status);
                    return (
                      <TableRow key={appointment.appointment_id} hover>
                        <TableCell>#{appointment.appointment_id}</TableCell>
                        <TableCell>
                          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                            <Avatar src={appointment.customer?.image} alt={appointment.full_name} sx={{ width: 32, height: 32 }}>
                              {!appointment.customer?.image && <UserOutlined />}
                            </Avatar>
                            <Box>
                              <Typography variant="body2" sx={{ fontWeight: 500 }}>{appointment.full_name}</Typography>
                              <Typography variant="caption" color="textSecondary">{appointment.phone_number}</Typography>
                            </Box>
                          </Box>
                        </TableCell>
                        <TableCell>
                          <Typography variant="body2" sx={{ fontWeight: 500 }}>{appointment.service.name}</Typography>
                          <Typography variant="caption" color="primary">${appointment.price?.toFixed(2)} • {appointment.service.duration} min</Typography>
                        </TableCell>
                        <TableCell>
                          <Typography variant="body2" sx={{ fontWeight: 500 }}>{formatDate(appointment.appointment_date)}</Typography>
                          <Typography variant="caption" color="textSecondary">{formatTime(appointment.appointment_date)} - {formatTime(appointment.end_time)}</Typography>
                        </TableCell>
                        <TableCell>
                          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                            <Avatar src={appointment.user?.image} alt={appointment.user?.name} sx={{ width: 32, height: 32 }}>
                              {!(appointment.user?.image) && <UserOutlined />}
                            </Avatar>
                            <Typography variant="body2">{appointment.user?.name || 'Unassigned'}</Typography>
                          </Box>
                        </TableCell>
                        <TableCell>{appointment.branch.name}</TableCell>
                        <TableCell>
                          <Chip icon={statusProps.icon} label={statusProps.label} size="small" color={statusProps.color} sx={{ borderRadius: '16px', fontWeight: 500, fontSize: '0.75rem' }} />
                        </TableCell>
                        <TableCell sx={{ textAlign: 'center' }}>
                          <Tooltip title="View Details">
                            <IconButton onClick={() => handleViewOpen(appointment)} color="info" size="small"><EyeOutlined /></IconButton>
                          </Tooltip>
                          <Tooltip title={appointment.status === 'completed' ? `Status is 'completed'. Cannot update.` : "Update Status"}>
                            <span>
                              <IconButton onClick={() => handleStatusDialogOpen(appointment)} color="primary" size="small" disabled={appointment.status === 'completed'} >
                                <EditOutlined />
                              </IconButton>
                            </span>
                          </Tooltip>
                          {/* Nút chỉnh sửa chi tiết (bao gồm gán nhân viên) */}
                          <Tooltip title="Edit Details / Assign Staff">
                            <IconButton onClick={() => handleOpenEditDetailDialog(appointment)} color="secondary" size="small">
                               <FormOutlined  />
                            </IconButton>
                          </Tooltip>
                        </TableCell>
                      </TableRow>
                    );
                  })
                ) : (
                  <TableRow><TableCell colSpan={8} align="center">No appointments found</TableCell></TableRow>
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
          <IconButton aria-label="close" onClick={handleViewClose} sx={{ position: 'absolute', right: 8, top: 8 }}><CloseOutlined /></IconButton>
        </DialogTitle>
        <DialogContent sx={{ pt: 3 }}>
          {currentAppointment && (
            <Grid container spacing={3}>
              <Grid item xs={12} sm={6}>
                <Box sx={{ mb: 3 }}>
                  <Typography variant="h6" gutterBottom>Customer Information</Typography>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 2 }}>
                    <Avatar src={currentAppointment.customer?.image} alt={currentAppointment.full_name} sx={{ width: 64, height: 64 }}>
                      {!currentAppointment.customer?.image && <UserOutlined style={{ fontSize: 32 }} />}
                    </Avatar>
                    <Box>
                      <Typography variant="h5">{currentAppointment.full_name}</Typography>
                      <Typography variant="body2" color="textSecondary">{currentAppointment.phone_number}</Typography>
                      {currentAppointment.customer?.email && (<Typography variant="body2" color="textSecondary">{currentAppointment.customer.email}</Typography>)}
                    </Box>
                  </Box>
                </Box>
                <Box sx={{ mb: 3 }}>
                  <Typography variant="h6" gutterBottom>Appointment Details</Typography>
                  <Grid container spacing={2}>
                    <Grid item xs={6}><Typography variant="caption" color="textSecondary">Date</Typography><Typography variant="body2" sx={{ fontWeight: 500 }}>{formatDate(currentAppointment.appointment_date)}</Typography></Grid>
                    <Grid item xs={6}><Typography variant="caption" color="textSecondary">Time</Typography><Typography variant="body2" sx={{ fontWeight: 500 }}>{formatTime(currentAppointment.appointment_date)} - {formatTime(currentAppointment.end_time)}</Typography></Grid>
                    <Grid item xs={6}><Typography variant="caption" color="textSecondary">Branch</Typography><Typography variant="body2">{currentAppointment.branch.name}</Typography></Grid>
                    <Grid item xs={6}><Typography variant="caption" color="textSecondary">Status</Typography><Box sx={{ mt: 0.5 }}><Chip {...getStatusChipProps(currentAppointment.status)} size="small" /></Box></Grid>
                    <Grid item xs={12}>
                      <Typography variant="caption" color="textSecondary">Staff Assigned</Typography>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mt: 0.5 }}>
                        <Avatar src={currentAppointment.user?.image} alt={currentAppointment.user?.name} sx={{ width: 24, height: 24 }}>
                          {!(currentAppointment.user?.image) && <UserOutlined style={{ fontSize: 14 }} />}
                        </Avatar>
                        <Box>
                          <Typography variant="body2">{currentAppointment.user?.name || 'Unassigned'}</Typography>
                          {currentAppointment.user?.email && (<Typography variant="caption" color="textSecondary">{currentAppointment.user.email}</Typography>)}
                        </Box>
                      </Box>
                    </Grid>
                    {currentAppointment.notes && (<Grid item xs={12}><Typography variant="caption" color="textSecondary">Notes</Typography><Typography variant="body2">{currentAppointment.notes}</Typography></Grid>)}
                  </Grid>
                </Box>
              </Grid>
              <Grid item xs={12} sm={6}>
                <Box sx={{ mb: 3 }}>
                  <Typography variant="h6" gutterBottom>Service Information</Typography>
                  <Paper variant="outlined" sx={{ p: 2, borderRadius: 2 }}>
                    <Typography variant="subtitle1" sx={{ fontWeight: 600, mb: 1 }}>{currentAppointment.service.name}</Typography>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}><Typography variant="body2">Price:</Typography><Typography variant="body2" color="primary" sx={{ fontWeight: 600 }}>${currentAppointment.price?.toFixed(2)}</Typography></Box>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between' }}><Typography variant="body2">Duration:</Typography><Typography variant="body2">{currentAppointment.service.duration} minutes</Typography></Box>
                  </Paper>
                </Box>
                <Box>
                  <Typography variant="h6" gutterBottom>Booking Information</Typography>
                  <Grid container spacing={2}>
                    <Grid item xs={6}><Typography variant="caption" color="textSecondary">Booking ID</Typography><Typography variant="body2">#{currentAppointment.appointment_id}</Typography></Grid>
                    <Grid item xs={6}><Typography variant="caption" color="textSecondary">Created On</Typography><Typography variant="body2">{formatDate(currentAppointment.created_at)}</Typography></Grid>
                    <Grid item xs={12}>
                      <Divider sx={{ my: 1 }} />
                      <Box sx={{ display: 'flex', justifyContent: 'flex-end', mt: 2, gap: 1 }}>
                        <Tooltip title={currentAppointment.status === 'completed' ? `Status is 'completed'. Cannot update.` : "Update Status"}>
                          <span>
                            <Button variant="outlined" color="primary" onClick={() => handleStatusDialogOpen(currentAppointment)} disabled={currentAppointment.status === 'completed'}>Update Status</Button>
                          </span>
                        </Tooltip>
                        <Tooltip title="Edit Details / Assign Staff">
                           <Button variant="contained" color="secondary" onClick={() => { handleViewClose(); handleOpenEditDetailDialog(currentAppointment);}}>Edit Details</Button>
                        </Tooltip>
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
        <DialogTitle>Update Appointment Status</DialogTitle>
        <DialogContent>
          <Typography variant="body2" color="textSecondary" sx={{ mb: 2 }}>Change the status for appointment #{currentAppointment?.appointment_id}</Typography>
          <FormControl fullWidth>
            <InputLabel>Status</InputLabel>
            <Select value={newStatus} label="Status" onChange={(e) => setNewStatus(e.target.value)}>
              <MenuItem value="pending"><Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}><Chip size="small" label="Pending" color="warning" sx={{ minWidth: 80 }} /><Typography variant="body2">Waiting for confirmation</Typography></Box></MenuItem>
              <MenuItem value="confirmed"><Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}><Chip size="small" label="Confirmed" color="info" sx={{ minWidth: 80 }} /><Typography variant="body2">Appointment is confirmed</Typography></Box></MenuItem>
              <MenuItem value="completed"><Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}><Chip size="small" label="Completed" color="success" sx={{ minWidth: 80 }} /><Typography variant="body2">Service has been provided</Typography></Box></MenuItem>
              <MenuItem value="cancelled"><Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}><Chip size="small" label="Cancelled" color="error" sx={{ minWidth: 80 }} /><Typography variant="body2">Appointment was cancelled</Typography></Box></MenuItem>
            </Select>
          </FormControl>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleStatusDialogClose} color="inherit">Cancel</Button>
          <Button onClick={handleStatusChange} variant="contained" color="primary" disabled={loading}>{loading ? 'Updating...' : 'Update Status'}</Button>
        </DialogActions>
      </Dialog>

      {/* Edit Appointment Details Dialog (bao gồm gán nhân viên) */}
      <Dialog open={editDetailDialogOpen} onClose={handleCloseEditDetailDialog} maxWidth="sm" fullWidth>
        <DialogTitle>Edit Appointment Details #{appointmentToEditDetails?.appointment_id}</DialogTitle>
        <DialogContent>
          {appointmentToEditDetails && (
            <Grid container spacing={2} sx={{ pt: 1 }}>
              <Grid item xs={12}>
                <Typography variant="body1" gutterBottom>
                  Customer: <strong>{appointmentToEditDetails.full_name}</strong>
                </Typography>
                <Typography variant="body2" color="textSecondary" gutterBottom>
                  Service: {appointmentToEditDetails.service.name} on {formatDate(appointmentToEditDetails.appointment_date)} at {formatTime(appointmentToEditDetails.appointment_date)}
                </Typography>
              </Grid>
              <Grid item xs={12}>
                <FormControl fullWidth margin="normal">
                  <InputLabel id="staff-select-label-edit">Assign Staff</InputLabel>
                  <Select
                    labelId="staff-select-label-edit"
                    value={selectedStaffId === null ? '' : selectedStaffId}
                    label="Assign Staff"
                    onChange={handleSelectedStaffChange}
                  >
                    <MenuItem value="">
                      <em>-- Unassign Staff --</em>
                    </MenuItem>
                    {staffList.map((staff) => (
                      <MenuItem key={staff.id} value={staff.id}>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                          <Avatar src={staff.imageUrl} sx={{ width: 24, height: 24}} />
                          {staff.fullName}
                        </Box>
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
              </Grid>
              <Grid item xs={12}>
                 <TextField
                   fullWidth
                   label="Notes"
                   multiline
                   rows={3}
                   defaultValue={appointmentToEditDetails.notes}
                   // Cập nhật notes trực tiếp vào state appointmentToEditDetails nếu cần
                   // Hoặc lấy giá trị từ một state riêng cho notes trong form này
                   onChange={(e) => setAppointmentToEditDetails(prev => ({...prev, notes: e.target.value}))}
                   margin="normal"
                 />
              </Grid>
              {/* Bạn có thể thêm các trường khác ở đây nếu muốn cho phép Admin sửa */}
            </Grid>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseEditDetailDialog} color="inherit">Cancel</Button>
          <Button onClick={handleSaveAppointmentDetails} variant="contained" color="primary" disabled={loading}>
            {loading ? 'Saving...' : 'Save Changes'}
          </Button>
        </DialogActions>
      </Dialog>

    </MainCard>
  );
};

export default AppointmentManagement;