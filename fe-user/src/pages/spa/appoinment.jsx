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
  FormOutlined,
  MailOutlined,
  ReloadOutlined,
  ClearOutlined
} from '@ant-design/icons';
import MainCard from 'components/MainCard';
import { useSearchParams } from 'react-router-dom';
import { toast } from 'react-toastify';
import Cookies from 'js-cookie';
import { useAppointmentFilter } from 'contexts/AppointmentFilterContext';

const API_URL = 'http://localhost:8080/api/v1/admin/appointment';
const API_STAFF_URL = 'http://localhost:8080/api/v1/admin/accounts/find-all';
const API_SERVICE_URL = 'http://localhost:8080/api/v1/services/findAll';
const EMAIL_API_URL = 'http://localhost:8080/api/v1/email/send-appointment-confirmation';

const AppointmentManagement = () => {
  // States
  const { filter, setFilter } = useAppointmentFilter();
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
  const [serviceFilter, setServiceFilter] = useState('all');
  const [staffFilter, setStaffFilter] = useState('all');
  const [dateFilter, setDateFilter] = useState({
    startDate: '',
    endDate: ''
  });

  // Áp dụng filter từ Context khi nó thay đổi
  useEffect(() => {
    if (filter) {
      if (filter.status) {
        setStatusFilter(filter.status);
      }
      if (filter.dateFilter) {
        setDateFilter(filter.dateFilter);
      }
      if (filter.serviceId) {
        setServiceFilter(filter.serviceId);
      }
      if (filter.staffId) {
        setStaffFilter(filter.staffId);
      }
      // Xóa filter trong context sau khi đã áp dụng để không bị lọc lại ở lần sau
      setFilter(null);
    }
  }, [filter, setFilter]);

  const [staffList, setStaffList] = useState([]);
  const [serviceList, setServiceList] = useState([]);
  const [editDetailDialogOpen, setEditDetailDialogOpen] = useState(false);
  const [appointmentToEditDetails, setAppointmentToEditDetails] = useState(null);
  const [selectedStaffId, setSelectedStaffId] = useState(null);
  const [strictSkillMatching, setStrictSkillMatching] = useState(false);
  const [emailConfirmationOpen, setEmailConfirmationOpen] = useState(false);
  const [appointmentToSendEmail, setAppointmentToSendEmail] = useState(null);
  const [emailSending, setEmailSending] = useState(false);

  // Handlers cho Email
  const handleOpenEmailConfirmation = (appointment) => {
    setAppointmentToSendEmail(appointment);
    setEmailConfirmationOpen(true);
  };

  const handleCloseEmailConfirmation = () => {
    setEmailConfirmationOpen(false);
    setAppointmentToSendEmail(null);
  };

  // Hàm gửi email xác nhận appointment
  const handleSendConfirmationEmail = async () => {
    if (!appointmentToSendEmail) return;
    
    setEmailSending(true);

    try {
      const emailPayload = {
        appointmentId: appointmentToSendEmail.appointment_id,
        customerEmail: appointmentToSendEmail.customer?.email || '',
        customerName: appointmentToSendEmail.full_name,
        serviceName: appointmentToSendEmail.service.name,
        appointmentDate: appointmentToSendEmail.appointment_date,
        appointmentTime: formatTime(appointmentToSendEmail.appointment_date),
        endTime: formatTime(appointmentToSendEmail.end_time),
        staffName: appointmentToSendEmail.user?.name || 'Staff will be assigned',
        branchName: appointmentToSendEmail.branch.name,
        price: appointmentToSendEmail.price,
        notes: appointmentToSendEmail.notes || ''
      };

      const response = await fetch(EMAIL_API_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(emailPayload)
      });

      const result = await response.json();

      if (response.ok && result.status === 'SUCCESS') {
        toast.success('Confirmation email sent successfully!');
        handleCloseEmailConfirmation();
      } else {
        toast.error(result.message || 'Failed to send confirmation email');
      }
    } catch (error) {
      console.error('Error sending email:', error);
      toast.error('Error sending confirmation email');
    } finally {
      setEmailSending(false);
    }
  };

  const fetchFilterData = async () => {
    const token = Cookies.get('staff_token');
    try {
      // Fetch staff
      const staffRes = await fetch(API_STAFF_URL, { headers: { Authorization: `Bearer ${token}` } });
      const staffData = await staffRes.json();
      if (staffData.status === 'SUCCESS') setStaffList(staffData.data);

      // Fetch services
      const serviceRes = await fetch(API_SERVICE_URL, { headers: { Authorization: `Bearer ${token}` } });
      const serviceData = await serviceRes.json();
      if (serviceData.status === 'SUCCESS') setServiceList(serviceData.data);
    } catch (error) {
      toast.error("Lỗi khi tải dữ liệu cho bộ lọc.");
    }
  };

  useEffect(() => {
    fetchFilterData();
  }, []);

  const fetchAppointments = async (silent = false) => {
    const token = Cookies.get('staff_token');
    const role = Cookies.get('staff_role');
    setUserRole(role);

    let url = API_URL;
    if (role === 'ROLE_STAFF') {
      const userId = Cookies.get('staff_userId');
      url += `/byUser?userId=${userId}`;
    } else if (role === 'ROLE_MANAGE') {
      url;
    }

    if (!token || (role !== 'ROLE_STAFF' && role !== 'ROLE_MANAGE')) {
      console.error('Người dùng chưa đăng nhập hoặc không có quyền truy cập');
      if (!silent) toast.error('Vui lòng đăng nhập lại.');
      return;
    }

    if (!silent) setLoading(true);
    try {
      const response = await fetch(url, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (response.status === 401) {
        throw new Error('Token không hợp lệ hoặc đã hết hạn. Vui lòng đăng nhập lại.');
      }

      const data = await response.json();
      console.log('🔍 Raw API Data:', data.data); // Debug log
      if (data.status === 'SUCCESS' && Array.isArray(data.data)) {
        let mappedAppointments;
        if (role === 'ROLE_MANAGE') {
          mappedAppointments = data.data.map(item => ({
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
              id: item.branchId,
              name: item.branchName
            },
            customer: {
              name: item.customerName,
              image: item.customerImageUrl || item.customerImage || '',
              email: item.customerEmail || item.email || item.userEmail || ''
            },
            user: { id: item.userId, name: item.userName, image: item.userImageUrl || '' },
            created_at: item.appointmentDate,
          }));
        } else {
          mappedAppointments = data.data.map(item => ({
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
              email: item.customerEmail || item.email || item.userEmail || ''
            },
            user: {
              name: item.userName,
              image: item.userImageUrl,
            },
          }));
        }
        console.log('📧 Mapped Appointments with emails:', mappedAppointments.map(a => ({ 
          id: a.appointment_id, 
          customerName: a.customer.name, 
          customerEmail: a.customer.email 
        }))); // Debug log
        setAppointments(mappedAppointments);
        setFilteredAppointments(mappedAppointments);
      } else {
        setAppointments([]);
        setFilteredAppointments([]);
        toast.error(data.message || 'Lỗi khi tải dữ liệu lịch hẹn');
      }
    } catch (error) {
      if (!silent) toast.error(error.message || 'Lỗi khi tải dữ liệu lịch hẹn');
    }
    if (!silent) setLoading(false);
  };

  // Auto refresh appointments every 30 seconds to get real-time updates
  useEffect(() => {
    fetchAppointments();
    
    // Set up auto refresh interval for silent updates  
    const interval = setInterval(() => {
      fetchAppointments(true); // Silent refresh to avoid loading indicators
    }, 30000); // Refresh every 30 seconds

    // Cleanup interval on unmount
    return () => {
      clearInterval(interval);
    };
  }, []);
  // Filter appointments when search query or status filter changes
  useEffect(() => {
    let results = [...appointments];

    if (statusFilter !== 'all') {
      results = results.filter(appointment => appointment.status === statusFilter);
    }

    if (serviceFilter !== 'all') {
        results = results.filter(appointment => appointment.service?.id === serviceFilter);
    }

    if (staffFilter !== 'all') {
        results = results.filter(appointment => appointment.user?.id === staffFilter);
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

    // Sort by appointment date (newest first - reverse order)
    results = results.sort((a, b) =>
      new Date(b.appointment_date) - new Date(a.appointment_date)
    );

    setFilteredAppointments(results);
    setPage(0);
  }, [searchQuery, statusFilter, dateFilter, appointments, serviceFilter, staffFilter]);

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

  const handleClearFilters = () => {
    setStatusFilter('all');
    setServiceFilter('all');
    setStaffFilter('all');
    setDateFilter({ startDate: '', endDate: '' });
    setSearchQuery('');
    toast.info("Đã xóa tất cả bộ lọc.");
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
          label: 'Chờ xử lý',
          color: 'warning',
          icon: <ClockCircleOutlined />
        };
      case 'confirmed':
        return {
          label: 'Đã xác nhận',
          color: 'info',
          icon: <CheckOutlined />
        };
      case 'completed':
        return {
          label: 'Hoàn thành',
          color: 'success',
          icon: <CheckOutlined />
        };
      case 'cancelled':
        return {
          label: 'Đã hủy',
          color: 'error',
          icon: <CloseOutlined />
        };
      default:
        return {
          label: status || 'Không xác định',
          color: 'default',
          icon: <ClockCircleOutlined />
        };
    }
  };

  // Get current page appointments
  const currentAppointments = filteredAppointments.slice(
    page * rowsPerPage,
    page * rowsPerPage + rowsPerPage
  );

  return (
    <MainCard title="Quản lý lịch hẹn">
      <Grid container spacing={3}>
        {/* Search and Filter Controls */}
        <Grid item xs={12} display="flex" flexWrap="wrap" gap={2} alignItems="center" mb={2}>
          <TextField
            placeholder="Tìm kiếm theo tên, số điện thoại hoặc dịch vụ"
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

          <Tooltip title="Tải lại dữ liệu">
            <IconButton
              onClick={() => fetchAppointments()}
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

          <FormControl size="small" sx={{ minWidth: 150 }}>
            <InputLabel id="status-filter-label">Trạng thái</InputLabel>
            <Select
              labelId="status-filter-label"
              id="status-filter"
              value={statusFilter}
              label="Trạng thái"
              onChange={handleStatusFilterChange}
            >
              <MenuItem value="all">Tất cả trạng thái</MenuItem>
              <MenuItem value="pending">Chờ xử lý</MenuItem>
              <MenuItem value="confirmed">Đã xác nhận</MenuItem>
              <MenuItem value="completed">Hoàn thành</MenuItem>
              <MenuItem value="cancelled">Đã hủy</MenuItem>
            </Select>
          </FormControl>

          <FormControl size="small" sx={{ minWidth: 150 }}>
            <InputLabel>Dịch vụ</InputLabel>
            <Select value={serviceFilter} label="Dịch vụ" onChange={(e) => setServiceFilter(e.target.value)}>
              <MenuItem value="all">Tất cả dịch vụ</MenuItem>
              {serviceList.map(service => (
                <MenuItem key={service.id} value={service.id}>{service.name}</MenuItem>
              ))}
            </Select>
          </FormControl>

          <FormControl size="small" sx={{ minWidth: 150 }}>
            <InputLabel>Nhân viên</InputLabel>
            <Select value={staffFilter} label="Nhân viên" onChange={(e) => setStaffFilter(e.target.value)}>
              <MenuItem value="all">Tất cả nhân viên</MenuItem>
              {staffList.map(staff => (
                <MenuItem key={staff.id} value={staff.id}>{staff.fullName}</MenuItem>
              ))}
            </Select>
          </FormControl>

          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, flexWrap: 'wrap' }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <TextField
                label="Từ ngày"
                type="date"
                size="small"
                name="startDate"
                value={dateFilter.startDate}
                onChange={handleDateFilterChange}
                InputLabelProps={{ shrink: true }}
                sx={{ width: 150 }}
              />
              <Typography variant="body2">đến</Typography>
              <TextField
                label="Đến ngày"
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

          <Tooltip title="Xóa tất cả bộ lọc">
            <IconButton onClick={handleClearFilters}>
              <ClearOutlined />
            </IconButton>
          </Tooltip>
        </Grid>

        {/* Appointments Table */}
        <Grid item xs={12}>
          <TableContainer component={Paper} sx={{ maxHeight: 440, '& .MuiTableHead-root': { position: 'sticky', top: 0, zIndex: 10 } }}>
            <Table stickyHeader>
              <TableHead>
                <TableRow>
                  <TableCell sx={{ backgroundColor: '#f8f8f8', fontWeight: 600 }}>ID</TableCell>
                  <TableCell sx={{ backgroundColor: '#f8f8f8', fontWeight: 600 }}>Khách hàng</TableCell>
                  <TableCell sx={{ backgroundColor: '#f8f8f8', fontWeight: 600 }}>Dịch vụ</TableCell>
                  <TableCell sx={{ backgroundColor: '#f8f8f8', fontWeight: 600 }}>Ngày & Giờ</TableCell>
                  <TableCell sx={{ backgroundColor: '#f8f8f8', fontWeight: 600 }}>Nhân viên</TableCell>
                  <TableCell sx={{ backgroundColor: '#f8f8f8', fontWeight: 600 }}>Chi nhánh</TableCell>
                  <TableCell sx={{ backgroundColor: '#f8f8f8', fontWeight: 600 }}>Trạng thái</TableCell>
                  <TableCell sx={{ backgroundColor: '#f8f8f8', fontWeight: 600 }}>Thao tác</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {loading ? (
                  <TableRow>
                    <TableCell colSpan={8} align="center">Đang tải...</TableCell>
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
                            {new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(appointment.price * 10000)} • {appointment.service?.duration} phút
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
                              {appointment.user?.name || 'Chưa phân công'}
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
                          <Tooltip title="Xem chi tiết">
                            <IconButton
                              onClick={() => handleViewOpen(appointment)}
                              color="info"
                              size="small"
                            >
                              <EyeOutlined />
                            </IconButton>
                          </Tooltip>

                          {/* Hiện nút Update cho cả STAFF và MANAGE nếu chưa completed/cancelled */}
                          {(userRole === 'ROLE_MANAGE' || userRole === 'ROLE_STAFF') && appointment.status !== 'completed' && appointment.status !== 'cancelled' && (
                            <>
                              <Tooltip title="Cập nhật trạng thái">
                                <IconButton
                                  onClick={() => handleStatusDialogOpen(appointment)}
                                  color="primary"
                                  size="small"
                                >
                                  <EditOutlined />
                                </IconButton>
                              </Tooltip>
                              <Tooltip title={!appointment.customer?.email ? "Không có email khách hàng" : "Gửi email xác nhận"}>
                                <span>
                                  <IconButton 
                                    onClick={() => handleOpenEmailConfirmation(appointment)} 
                                    color="success" 
                                    size="small"
                                    disabled={!appointment.customer?.email}
                                  >
                                    <MailOutlined />
                                  </IconButton>
                                </span>
                              </Tooltip>
                            </>
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

                        {/* --- BỌC NÚT UPDATE TRONG ĐIỀU KIỆN CHO CẢ STAFF VÀ MANAGE --- */}
                        {(userRole === 'ROLE_MANAGE' || userRole === 'ROLE_STAFF') && (
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

      {/* Email Confirmation Dialog */}
      <Dialog open={emailConfirmationOpen} onClose={handleCloseEmailConfirmation} maxWidth="md" fullWidth>
        <DialogTitle>
          Send Confirmation Email
          <IconButton aria-label="close" onClick={handleCloseEmailConfirmation} sx={{ position: 'absolute', right: 8, top: 8 }}>
            <CloseOutlined />
          </IconButton>
        </DialogTitle>
        <DialogContent sx={{ pt: 3 }}>
          {appointmentToSendEmail && (
            <Grid container spacing={2}>
              <Grid item xs={12}>
                <Box sx={{ p: 2, backgroundColor: '#f5f5f5', borderRadius: 1, mb: 2 }}>
                  <Typography variant="h6" gutterBottom>
                    <MailOutlined style={{ marginRight: 8, color: '#1976d2' }} />
                    Email Preview
                  </Typography>
                  <Typography variant="body2" color="textSecondary">
                    This email will be sent to confirm the appointment details.
                  </Typography>
                </Box>
              </Grid>
              
              <Grid item xs={12} sm={6}>
                <Typography variant="subtitle2" color="textSecondary">To:</Typography>
                <Typography variant="body1" sx={{ fontWeight: 500 }}>
                  {appointmentToSendEmail.customer?.email || 'No email available'}
                </Typography>
              </Grid>
              
              <Grid item xs={12} sm={6}>
                <Typography variant="subtitle2" color="textSecondary">Customer:</Typography>
                <Typography variant="body1" sx={{ fontWeight: 500 }}>
                  {appointmentToSendEmail.full_name}
                </Typography>
              </Grid>

              <Grid item xs={12}>
                <Divider sx={{ my: 1 }} />
                <Typography variant="h6" gutterBottom>Appointment Details</Typography>
              </Grid>

              <Grid item xs={12} sm={6}>
                <Typography variant="subtitle2" color="textSecondary">Service:</Typography>
                <Typography variant="body1">{appointmentToSendEmail.service.name}</Typography>
              </Grid>

              <Grid item xs={12} sm={6}>
                <Typography variant="subtitle2" color="textSecondary">Price:</Typography>
                <Typography variant="body1" color="primary" sx={{ fontWeight: 600 }}>
                  ${appointmentToSendEmail.price?.toFixed(2)}
                </Typography>
              </Grid>

              <Grid item xs={12} sm={6}>
                <Typography variant="subtitle2" color="textSecondary">Date:</Typography>
                <Typography variant="body1">{formatDate(appointmentToSendEmail.appointment_date)}</Typography>
              </Grid>

              <Grid item xs={12} sm={6}>
                <Typography variant="subtitle2" color="textSecondary">Time:</Typography>
                <Typography variant="body1">
                  {formatTime(appointmentToSendEmail.appointment_date)} - {formatTime(appointmentToSendEmail.end_time)}
                </Typography>
              </Grid>

              <Grid item xs={12} sm={6}>
                <Typography variant="subtitle2" color="textSecondary">Staff:</Typography>
                <Typography variant="body1">
                  {appointmentToSendEmail.user?.name || 'Staff will be assigned'}
                </Typography>
              </Grid>

              <Grid item xs={12} sm={6}>
                <Typography variant="subtitle2" color="textSecondary">Branch:</Typography>
                <Typography variant="body1">{appointmentToSendEmail.branch.name}</Typography>
              </Grid>

              {appointmentToSendEmail.notes && (
                <Grid item xs={12}>
                  <Typography variant="subtitle2" color="textSecondary">Notes:</Typography>
                  <Typography variant="body1">{appointmentToSendEmail.notes}</Typography>
                </Grid>
              )}

              <Grid item xs={12}>
                <Box sx={{ mt: 2, p: 2, backgroundColor: '#e3f2fd', borderRadius: 1 }}>
                  <Typography variant="body2" color="primary">
                    📧 The customer will receive a professional email with all appointment details, 
                    confirmation instructions, and contact information.
                  </Typography>
                </Box>
              </Grid>
            </Grid>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseEmailConfirmation} color="inherit">
            Cancel
          </Button>
          <Button 
            onClick={handleSendConfirmationEmail} 
            variant="contained" 
            color="primary"
            disabled={emailSending || !appointmentToSendEmail?.customer?.email}
            startIcon={emailSending ? null : <MailOutlined />}
          >
            {emailSending ? 'Sending...' : 'Send Confirmation Email'}
          </Button>
        </DialogActions>
      </Dialog>
    </MainCard>
  );
};

export default AppointmentManagement;