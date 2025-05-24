import React from 'react';
import { Typography, Box, Button } from '@mui/material';

const AttendancePage = () => {
  const handleCheckIn = () => {
    const now = new Date().toLocaleString();
    alert(`Điểm danh thành công lúc: ${now}`);
    // TODO: Gửi API điểm danh hoặc lưu trạng thái
  };

  return (
    <Box sx={{ p: 3 }}>
      <Typography variant="h4" gutterBottom>Điểm danh nhân viên</Typography>
      <Typography variant="body1" gutterBottom>
        Vui lòng nhấn nút bên dưới để điểm danh vào ca làm việc hôm nay.
      </Typography>
      <Button variant="contained" color="primary" onClick={handleCheckIn}>
        Điểm danh ngay
      </Button>
    </Box>
  );
};

export default AttendancePage;
