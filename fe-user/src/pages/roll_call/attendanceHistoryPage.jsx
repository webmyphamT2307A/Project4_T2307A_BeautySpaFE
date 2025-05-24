import React, { useEffect, useState } from 'react';
import {
  Typography, Box, Paper, Table, TableBody, TableCell, TableContainer,
  TableHead, TableRow, CircularProgress, Alert, TextField, MenuItem, Pagination,
} from '@mui/material';

const AttendanceHistoryPage = () => {
  const [records, setRecords] = useState([]);
  const [filteredRecords, setFilteredRecords] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // Lọc
  const [nameFilter, setNameFilter] = useState('');
  const [dateFilter, setDateFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('');

  // Phân trang
  const itemsPerPage = 5;
  const [page, setPage] = useState(1);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const res = await fetch('http://localhost:8080/api/v1/admin/attendance/find-all');
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

  // Xử lý lọc
  useEffect(() => {
    let result = [...records];

    if (nameFilter) {
      result = result.filter(r =>
        r.user?.fullName?.toLowerCase().includes(nameFilter.toLowerCase())
      );
    }

    if (dateFilter) {
      result = result.filter(r =>
        new Date(r.checkIn).toISOString().startsWith(dateFilter)
      );
    }

    if (statusFilter) {
      result = result.filter(r => r.status === statusFilter);
    }

    setFilteredRecords(result);
    setPage(1);
  }, [nameFilter, dateFilter, statusFilter, records]);

  const paginatedData = filteredRecords.slice(
    (page - 1) * itemsPerPage,
    page * itemsPerPage
  );

  return (
    <Box sx={{ width: '100%', px: 4, mt: 5 }}>
      <Typography variant="h4" gutterBottom>Lịch sử điểm danh</Typography>

      {/* Bộ lọc */}
      <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 2, mb: 3 }}>
        <TextField
          label="Tên nhân viên"
          value={nameFilter}
          onChange={(e) => setNameFilter(e.target.value)}
          sx={{ flex: 1, minWidth: 200 }}
        />
        <TextField
          type="date"
          label="Ngày"
          value={dateFilter}
          onChange={(e) => setDateFilter(e.target.value)}
          InputLabelProps={{ shrink: true }}
          sx={{ flex: 1, minWidth: 200 }}
        />
        <TextField
          label="Trạng thái"
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
                  <TableCell>Nhân viên</TableCell>
                  <TableCell>Check In</TableCell>
                  <TableCell>Check Out</TableCell>
                  <TableCell>Trạng thái</TableCell>
                  <TableCell>Ngày tạo</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {paginatedData.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={5}>Không có dữ liệu phù hợp.</TableCell>
                  </TableRow>
                ) : (
                  paginatedData.map((r) => (
                    <TableRow key={r.attendanceId}>
                      <TableCell>{r.user?.fullName || 'N/A'}</TableCell>
                      <TableCell>{new Date(r.checkIn).toLocaleString()}</TableCell>
                      <TableCell>{r.checkOut ? new Date(r.checkOut).toLocaleString() : '---'}</TableCell>
                      <TableCell>{r.status}</TableCell>
                      <TableCell>{new Date(r.createdAt).toLocaleDateString()}</TableCell>
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
