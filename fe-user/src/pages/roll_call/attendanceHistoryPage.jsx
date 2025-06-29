import React, { useEffect, useState } from 'react';
import Cookies from 'js-cookie';
import {
  Typography,
  Box,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  CircularProgress,
  Alert,
  TextField,
  MenuItem,
  Pagination,
  Chip,
  Avatar
} from '@mui/material';
import {
  CheckCircle as CheckCircleIcon,
  Schedule as ScheduleIcon,
  Cancel as CancelIcon,
  AccessTime as AccessTimeIcon,
  LogoutOutlined as LogoutIcon
} from '@mui/icons-material';

const AttendanceHistoryPage = () => {
  const [records, setRecords] = useState([]);
  const [filteredRecords, setFilteredRecords] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // Simplified filters to match the new API data
  const [dateFilter, setDateFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('');

  const itemsPerPage = 10;
  const [page, setPage] = useState(1);

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      setError('');
      try {
        const token = Cookies.get('staff_token');
        const userId = Cookies.get('staff_userId');

        if (!token) {
          throw new Error('Token xác thực không tìm thấy. Vui lòng đăng nhập lại.');
        }

        // Add validation to ensure userId is a valid number before making the call.
        if (!userId || !/^\d+$/.test(userId)) {
          throw new Error('User ID không hợp lệ. Vui lòng đăng nhập lại.');
        }

        const res = await fetch(`http://localhost:8080/api/v1/admin/attendance/history?userId=${userId}`, {
          headers: {
            Authorization: `Bearer ${token}`
          }
        });

        if (!res.ok) {
          // Provide more context for 400 errors
          if (res.status === 400) {
            const errorData = await res.json().catch(() => ({ message: 'Yêu cầu không hợp lệ. Vui lòng kiểm tra lại các tham số.' }));
            throw new Error(`Lỗi 400: ${errorData.message}`);
          }
          throw new Error(`Lỗi HTTP: ${res.status}`);
        }

        const json = await res.json();
        if (json.status === 'SUCCESS') {
          setRecords(json.data);
          setFilteredRecords(json.data);
        } else {
          throw new Error(json.message || 'Không lấy được dữ liệu');
        }
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  // Updated filter logic
  useEffect(() => {
    let result = [...records];

    if (dateFilter) {
      // The `date` field from API is already in YYYY-MM-DD format
      result = result.filter((r) => r.date.startsWith(dateFilter));
    }

    if (statusFilter) {
      result = result.filter((r) => r.status === statusFilter);
    }

    setFilteredRecords(result);
    setPage(1);
  }, [dateFilter, statusFilter, records]);

  const paginatedData = filteredRecords.slice((page - 1) * itemsPerPage, page * itemsPerPage);

  // Helper function to render status with visual elements
  const renderStatus = (status) => {
    const statusConfig = {
      on_time: {
        label: 'Đúng giờ',
        color: 'success',
        icon: <CheckCircleIcon sx={{ fontSize: 16 }} />
      },
      late: {
        label: 'Trễ',
        color: 'warning',
        icon: <ScheduleIcon sx={{ fontSize: 16 }} />
      },
      absent: {
        label: 'Vắng',
        color: 'error',
        icon: <CancelIcon sx={{ fontSize: 16 }} />
      }
    };

    const config = statusConfig[status] || {
      label: status,
      color: 'default',
      icon: <AccessTimeIcon sx={{ fontSize: 16 }} />
    };

    return <Chip icon={config.icon} label={config.label} color={config.color} variant="outlined" sx={{ fontWeight: 'medium' }} />;
  };

  // Helper function to render time with icon
  const renderTime = (timeString, isCheckOut = false) => {
    if (!timeString) {
      return (
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, color: 'text.secondary' }}>
          <CancelIcon sx={{ fontSize: 16 }} />
          <Typography variant="body2">Chưa check out</Typography>
        </Box>
      );
    }

    const date = new Date(timeString);
    const time = date.toLocaleTimeString('vi-VN', {
      hour: '2-digit',
      minute: '2-digit'
    });
    const dateStr = date.toLocaleDateString('vi-VN');

    return (
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
        {isCheckOut ? (
          <LogoutIcon sx={{ fontSize: 16, color: 'warning.main' }} />
        ) : (
          <AccessTimeIcon sx={{ fontSize: 16, color: 'primary.main' }} />
        )}
        <Box>
          <Typography variant="body2" sx={{ fontWeight: 'medium' }}>
            {time}
          </Typography>
          <Typography variant="caption" sx={{ color: 'text.secondary' }}>
            {dateStr}
          </Typography>
        </Box>
      </Box>
    );
  };

  // Helper function to render session with visual indicator
  const renderSession = (session) => {
    const sessionConfig = {
      morning: { label: 'Sáng', color: '#ff9800', bgcolor: '#fff3e0' },
      afternoon: { label: 'Chiều', color: '#2196f3', bgcolor: '#e3f2fd' },
      evening: { label: 'Tối', color: '#9c27b0', bgcolor: '#f3e5f5' }
    };

    const config = sessionConfig[session?.toLowerCase()] || {
      label: session || 'N/A',
      color: '#757575',
      bgcolor: '#f5f5f5'
    };

    return (
      <Avatar
        sx={{
          width: 32,
          height: 32,
          bgcolor: config.bgcolor,
          color: config.color,
          fontSize: '0.75rem',
          fontWeight: 'bold'
        }}
      >
        {config.label.charAt(0)}
      </Avatar>
    );
  };

  return (
    <Box sx={{ width: '100%', px: 4, mt: 5 }}>
      <Typography variant="h4" gutterBottom>
        Lịch sử điểm danh của bạn
      </Typography>

      {/* Simplified Filters */}
      <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 2, mb: 3 }}>
        <TextField
          type="date"
          label="Lọc theo ngày"
          value={dateFilter}
          onChange={(e) => setDateFilter(e.target.value)}
          InputLabelProps={{ shrink: true }}
          sx={{ flex: 1, minWidth: 200 }}
        />
        <TextField
          label="Lọc theo trạng thái"
          select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          sx={{ flex: 1, minWidth: 200 }}
        >
          <MenuItem value="">Tất cả</MenuItem>
          <MenuItem value="on_time">Đúng giờ</MenuItem>
          <MenuItem value="late">Trễ</MenuItem>
          <MenuItem value="absent">Vắng</MenuItem>
        </TextField>
      </Box>

      {loading && <CircularProgress />}
      {error && <Alert severity="error">{error}</Alert>}

      {!loading && !error && (
        <>
          <TableContainer
            component={Paper}
            sx={{
              borderRadius: 2,
              overflow: 'hidden',
              boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)'
            }}
          >
            <Table>
              <TableHead>
                <TableRow sx={{ backgroundColor: 'grey.50' }}>
                  <TableCell sx={{ fontWeight: 'bold', color: 'text.primary' }}>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      <AccessTimeIcon sx={{ fontSize: 20 }} />
                      Ngày
                    </Box>
                  </TableCell>
                  <TableCell sx={{ fontWeight: 'bold', color: 'text.primary' }}>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      <ScheduleIcon sx={{ fontSize: 20 }} />
                      Ca làm việc
                    </Box>
                  </TableCell>
                  <TableCell sx={{ fontWeight: 'bold', color: 'text.primary' }}>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      <AccessTimeIcon sx={{ fontSize: 20, color: 'primary.main' }} />
                      Check In
                    </Box>
                  </TableCell>
                  <TableCell sx={{ fontWeight: 'bold', color: 'text.primary' }}>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      <LogoutIcon sx={{ fontSize: 20, color: 'warning.main' }} />
                      Check Out
                    </Box>
                  </TableCell>
                  <TableCell sx={{ fontWeight: 'bold', color: 'text.primary' }}>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      <CheckCircleIcon sx={{ fontSize: 20, color: 'success.main' }} />
                      Trạng thái
                    </Box>
                  </TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {paginatedData.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={5}>Không có dữ liệu phù hợp.</TableCell>
                  </TableRow>
                ) : (
                  paginatedData.map((r) => (
                    <TableRow key={r.id} hover>
                      <TableCell>
                        <Typography variant="body2" sx={{ fontWeight: 'medium' }}>
                          {new Date(r.date).toLocaleDateString('vi-VN', {
                            weekday: 'short',
                            year: 'numeric',
                            month: 'short',
                            day: 'numeric'
                          })}
                        </Typography>
                      </TableCell>
                      <TableCell>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                          {renderSession(r.session)}
                          <Typography variant="body2" sx={{ textTransform: 'capitalize' }}>
                            {r.session}
                          </Typography>
                        </Box>
                      </TableCell>
                      <TableCell>{renderTime(r.checkInTime)}</TableCell>
                      <TableCell>{renderTime(r.checkOutTime, true)}</TableCell>
                      <TableCell>{renderStatus(r.status)}</TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </TableContainer>

          {/* Pagination */}
          <Box sx={{ mt: 2, display: 'flex', justifyContent: 'center' }}>
            <Pagination
              count={Math.ceil(filteredRecords.length / itemsPerPage)}
              page={page}
              onChange={(e, value) => setPage(value)}
              color="primary"
            />
          </Box>
        </>
      )}
    </Box>
  );
};

export default AttendanceHistoryPage;
