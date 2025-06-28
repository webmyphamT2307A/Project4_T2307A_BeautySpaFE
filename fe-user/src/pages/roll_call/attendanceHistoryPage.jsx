import React, { useEffect, useState } from 'react';
import Cookies from 'js-cookie';
import {
  Typography, Box, Paper, Table, TableBody, TableCell, TableContainer,
  TableHead, TableRow, CircularProgress, Alert, TextField, MenuItem, Pagination, Chip
} from '@mui/material';

// Helper to generate year list
const generateYears = (startYear = new Date().getFullYear() - 5) => {
  const currentYear = new Date().getFullYear();
  const years = [];
  for (let year = currentYear; year >= startYear; year--) {
    years.push(year);
  }
  return years;
};

const AttendanceHistoryPage = () => {
  const [records, setRecords] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // Filters to match backend API params - Default to current year and month
  const [yearFilter, setYearFilter] = useState(new Date().getFullYear());
  const [monthFilter, setMonthFilter] = useState(new Date().getMonth() + 1);
  const [statusFilter, setStatusFilter] = useState('');

  const itemsPerPage = 10;
  const [page, setPage] = useState(1);
  const years = generateYears();

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

        if (!userId || !/^\d+$/.test(userId)) {
          throw new Error('User ID không hợp lệ. Vui lòng đăng nhập lại.');
        }

        const params = new URLSearchParams({ userId });
        if (yearFilter) params.append('year', yearFilter);
        if (monthFilter) params.append('month', monthFilter);
        if (statusFilter) params.append('status', statusFilter);

        const res = await fetch(`http://localhost:8080/api/v1/admin/attendance/history?${params.toString()}`, {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        });
        
        if (!res.ok) {
           if (res.status === 400) {
              const errorData = await res.json().catch(() => ({ message: 'Yêu cầu không hợp lệ. Vui lòng kiểm tra lại các tham số.' }));
              throw new Error(`Lỗi 400: ${errorData.message}`);
           }
           throw new Error(`Lỗi HTTP: ${res.status}`);
        }

        const json = await res.json();
        if (json.status === 'SUCCESS') {
          setRecords(json.data);
          setPage(1); // Reset page whenever filters change
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
  }, [yearFilter, monthFilter, statusFilter]); // Refetch when any filter changes

  const getStatusChip = (status) => {
    let color = 'default';
    let label = status;

    switch (status?.toLowerCase()) {
      case 'on_time':
        color = 'success';
        label = 'Đúng giờ';
        break;
      case 'late':
        color = 'warning';
        label = 'Trễ';
        break;
      case 'absent':
        color = 'error';
        label = 'Vắng';
        break;
      default:
        break;
    }
    return <Chip label={label} color={color} size="small" />;
  };

  const paginatedData = records.slice(
    (page - 1) * itemsPerPage,
    page * itemsPerPage
  );

  return (
    <Box sx={{ width: '100%', px: 4, mt: 5 }}>
      <Typography variant="h4" gutterBottom>Lịch sử điểm danh của bạn</Typography>

      <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 2, mb: 3 }}>
        <TextField
          label="Lọc theo năm"
          select
          value={yearFilter}
          onChange={(e) => setYearFilter(e.target.value)}
          sx={{ flex: 1, minWidth: 150 }}
        >
          <MenuItem value="">Tất cả các năm</MenuItem>
          {years.map(year => <MenuItem key={year} value={year}>{year}</MenuItem>)}
        </TextField>

        <TextField
          label="Lọc theo tháng"
          select
          value={monthFilter}
          onChange={(e) => setMonthFilter(e.target.value)}
          sx={{ flex: 1, minWidth: 150 }}
        >
          <MenuItem value="">Tất cả các tháng</MenuItem>
          {Array.from({ length: 12 }, (_, i) => (
            <MenuItem key={i + 1} value={i + 1}>Tháng {i + 1}</MenuItem>
          ))}
        </TextField>

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
          <TableContainer component={Paper}>
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell>Ngày</TableCell>
                  <TableCell>Ca</TableCell>
                  <TableCell>Check In</TableCell>
                  <TableCell>Check Out</TableCell>
                  <TableCell>Trạng thái</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {paginatedData.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={5}>Không có dữ liệu phù hợp.</TableCell>
                  </TableRow>
                ) : (
                  paginatedData.map((r) => (
                    <TableRow key={r.id}>
                      <TableCell>{r.date}</TableCell>
                      <TableCell>{r.session}</TableCell>
                      <TableCell>{new Date(r.checkInTime).toLocaleString()}</TableCell>
                      <TableCell>{r.checkOutTime ? new Date(r.checkOutTime).toLocaleString() : '---'}</TableCell>
                      <TableCell>{getStatusChip(r.status)}</TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </TableContainer>

          {/* Pagination */}
          <Box sx={{ mt: 2, display: 'flex', justifyContent: 'center' }}>
            <Pagination
              count={Math.ceil(records.length / itemsPerPage)}
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