import React, { useEffect, useState } from 'react';
import Cookies from 'js-cookie';
import {
  Typography, Box, Paper, Table, TableBody, TableCell, TableContainer,
  TableHead, TableRow, CircularProgress, Alert, TextField, MenuItem, Pagination,
} from '@mui/material';

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
            'Authorization': `Bearer ${token}`
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
      result = result.filter(r => r.date.startsWith(dateFilter));
    }

    if (statusFilter) {
      result = result.filter(r => r.status === statusFilter);
    }

    setFilteredRecords(result);
    setPage(1);
  }, [dateFilter, statusFilter, records]);

  const paginatedData = filteredRecords.slice(
    (page - 1) * itemsPerPage,
    page * itemsPerPage
  );

  return (
    <Box sx={{ width: '100%', px: 4, mt: 5 }}>
      <Typography variant="h4" gutterBottom>Lịch sử điểm danh của bạn</Typography>

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
                      <TableCell>{r.status}</TableCell>
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