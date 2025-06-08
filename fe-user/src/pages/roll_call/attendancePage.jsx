import React, { useState, useEffect } from 'react';
import {
  Typography, Box, Button, Alert, CircularProgress, Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Paper,
} from '@mui/material';

const AttendancePage = () => {
  const [statusMessage, setStatusMessage] = useState('');
  const [loading, setLoading] = useState(false);

 
 const handleCheckIn = async () => {
  setLoading(true);
  setStatusMessage('');

  try {
    const now = new Date();
    const token = localStorage.getItem('token');
    const userId = JSON.parse(localStorage.getItem('user'))?.id;

    if (!token || !userId) {
      throw new Error('Người dùng chưa đăng nhập');
    }

    const checkInHour = now.getHours();
    const checkInMinute = now.getMinutes();
    let status = 'on_time'; 

    if (checkInHour > 8 || (checkInHour === 8 && checkInMinute > 0)) {
      status = 'late'; 
    }

    const response = await fetch('http://localhost:8080/api/v1/admin/attendance/check-in', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({
        userId: userId,
        status: status,
        checkIn: now.toISOString(), 
      }),
    });

    const json = await response.json();

    if (json.status === 'SUCCESS') {
      setStatusMessage(`✅ Điểm danh thành công lúc: ${now.toLocaleString()} (${status === 'on_time' ? 'Đúng giờ' : 'Trễ'})`);
    } else {
      throw new Error(json.message || 'Điểm danh thất bại');
    }
  } catch (err) {
    setStatusMessage(`❌ Lỗi: ${err.message}`);
  } finally {
    setLoading(false);
  }
};

  const handleCheckOut = async () => {
  setLoading(true);
  setStatusMessage('');

  try {
    const now = new Date().toISOString();
    const token = localStorage.getItem('token');
    const userId = JSON.parse(localStorage.getItem('user'))?.id;

    if (!token || !userId) {
      throw new Error('Người dùng chưa đăng nhập');
    }

    const response = await fetch('http://localhost:8080/api/v1/admin/attendance/check-out', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({
        userId: userId,
        checkIn: now, 
      }),
    });

    const json = await response.json();

    if (json.status === 'SUCCESS') {
      setStatusMessage(`✅ Check-out thành công lúc: ${new Date(now).toLocaleString()}`);
    } else {
      throw new Error(json.message || 'Check-out thất bại');
    }
  } catch (err) {
    setStatusMessage(`❌ Lỗi: ${err.message}`);
  } finally {
    setLoading(false);
  }
};

  return (
    <Box sx={{ p: 3, maxWidth: 800, mx: 'auto', mt: 5 }}>
      <Typography variant="h4" gutterBottom>Điểm danh hôm nay</Typography>
      <Typography variant="body1" gutterBottom>
        Vui lòng nhấn nút bên dưới để điểm danh bắt đầu hoặc kết thúc ca làm việc của bạn.
      </Typography>

      <Box sx={{ display: 'flex', gap: 2, mt: 2 }}>
        <Button
          variant="contained"
          color="primary"
          onClick={handleCheckIn}
          disabled={loading}
        >
          {loading ? <CircularProgress size={24} color="inherit" /> : 'Check-in'}
        </Button>
        <Button
          variant="contained"
          color="secondary"
          onClick={handleCheckOut}
          disabled={loading}
        >
          {loading ? <CircularProgress size={24} color="inherit" /> : 'Check-out'}
        </Button>
      </Box>

      {statusMessage && (
        <Alert severity={statusMessage.startsWith('✅') ? 'success' : 'error'} sx={{ mt: 3 }}>
          {statusMessage}
        </Alert>
      )}

     
    </Box>
  );
};

export default AttendancePage;