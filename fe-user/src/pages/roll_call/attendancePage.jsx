import React, { useState } from 'react';
import {
  Typography, Box, Button, Alert, CircularProgress,
} from '@mui/material';

const AttendancePage = () => {
  const [statusMessage, setStatusMessage] = useState('');
  const [loading, setLoading] = useState(false);

  const handleCheckIn = async () => {
    setLoading(true);
    setStatusMessage('');

    try {
      const now = new Date().toISOString();

      // Gửi dữ liệu điểm danh
      const response = await fetch('http://localhost:8080/api/v1/attendance/check-in', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          checkIn: now,
          status: 'on_time', // hoặc tính toán tự động nếu cần
          userId: 1, // Thay bằng user hiện tại (hoặc lấy từ login context)
        }),
      });

      const json = await response.json();

      if (json.status === 'SUCCESS') {
        setStatusMessage(`✅ Điểm danh thành công lúc: ${new Date(now).toLocaleString()}`);
      } else {
        throw new Error(json.message || 'Điểm danh thất bại');
      }
    } catch (err) {
      setStatusMessage(`❌ Lỗi: ${err.message}`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Box sx={{ p: 3, maxWidth: 600, mx: 'auto', mt: 5 }}>
      <Typography variant="h4" gutterBottom>Điểm danh hôm nay</Typography>
      <Typography variant="body1" gutterBottom>
        Vui lòng nhấn nút bên dưới để điểm danh bắt đầu ca làm việc của bạn.
      </Typography>

      <Button
        variant="contained"
        color="primary"
        onClick={handleCheckIn}
        disabled={loading}
        sx={{ mt: 2 }}
      >
        {loading ? <CircularProgress size={24} color="inherit" /> : 'Điểm danh ngay'}
      </Button>

      {statusMessage && (
        <Alert severity={statusMessage.startsWith('✅') ? 'success' : 'error'} sx={{ mt: 3 }}>
          {statusMessage}
        </Alert>
      )}
    </Box>
  );
};

export default AttendancePage;
