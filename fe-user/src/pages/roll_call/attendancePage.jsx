import React, { useState, useEffect } from 'react';
import { Typography, Box, Button, Alert, CircularProgress } from '@mui/material';
import Cookies from 'js-cookie';

const AttendancePage = () => {
  const [statusMessage, setStatusMessage] = useState('');
  const [loading, setLoading] = useState(false);
  const [scheduleLoading, setScheduleLoading] = useState(true);
  const [todaysSchedule, setTodaysSchedule] = useState(null);

  useEffect(() => {
    const fetchTodaysSchedule = async () => {
      setScheduleLoading(true);
      try {
        const token = Cookies.get('staff_token');
        const userId = Cookies.get('staff_userId');

        if (!token || !userId) {
          throw new Error('Người dùng chưa đăng nhập hoặc không tìm thấy thông tin.');
        }

        const response = await fetch(`http://localhost:8080/api/v1/users-schedules/user/${userId}/schedule`, {
          headers: { Authorization: `Bearer ${token}` }
        });

        if (!response.ok) {
          const errorData = await response.json().catch(() => ({ message: 'Không thể tải lịch làm việc.' }));
          throw new Error(errorData.message || 'Lỗi không xác định từ server.');
        }

        const schedules = await response.json();
        const today = new Date().toISOString().split('T')[0];
        const scheduleForToday = schedules.find((s) => s.date === today);

        if (scheduleForToday) {
          setTodaysSchedule(scheduleForToday);
          let statusText = scheduleForToday.status;
          if (statusText === 'pending') statusText = 'Chưa bắt đầu';
          if (statusText === 'confirmed') statusText = 'Đã vào ca';
          if (statusText === 'completed') statusText = 'Đã hoàn thành';
          setStatusMessage(`Hôm nay bạn có lịch làm việc ca: ${scheduleForToday.shift}. Trạng thái: ${statusText}`);
        } else {
          setStatusMessage('ℹ️ Bạn không có lịch làm việc được xếp cho ngày hôm nay.');
        }
      } catch (err) {
        setStatusMessage(`❌ Lỗi: ${err.message}`);
      } finally {
        setScheduleLoading(false);
      }
    };

    fetchTodaysSchedule();
  }, []);

  const handleCheckIn = async () => {
    if (!todaysSchedule) {
      setStatusMessage('❌ Không có lịch làm việc để check-in.');
      return;
    }

    setLoading(true);
    setStatusMessage('');

    try {
      const token = Cookies.get('staff_token');
      const response = await fetch(`http://localhost:8080/api/v1/users-schedules/check-in/${todaysSchedule.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        }
      });

      const json = await response.json();

      if (response.ok && json.status === 'SUCCESS') {
        setStatusMessage(`✅ Check-in thành công lúc: ${json.data.checkInTime}`);
        setTodaysSchedule((prev) => ({ ...prev, status: 'confirmed', checkInTime: json.data.checkInTime }));
      } else {
        throw new Error(json.message || 'Check-in thất bại.');
      }
    } catch (err) {
      setStatusMessage(`❌ Lỗi: ${err.message}`);
    } finally {
      setLoading(false);
    }
  };

  const handleCheckOut = async () => {
    if (!todaysSchedule) {
      setStatusMessage('❌ Không có lịch làm việc để check-out.');
      return;
    }

    setLoading(true);
    setStatusMessage('');

    try {
      const token = Cookies.get('staff_token');
      const response = await fetch(`http://localhost:8080/api/v1/users-schedules/check-out/${todaysSchedule.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        }
      });

      const json = await response.json();

      if (response.ok && json.status === 'SUCCESS') {
        setStatusMessage(`✅ Check-out thành công lúc: ${json.data.checkOutTime}`);
        setTodaysSchedule((prev) => ({ ...prev, status: 'completed', checkOutTime: json.data.checkOutTime }));
      } else {
        throw new Error(json.message || 'Check-out thất bại.');
      }
    } catch (err) {
      setStatusMessage(`❌ Lỗi: ${err.message}`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Box sx={{ p: 3, maxWidth: 800, mx: 'auto', mt: 5 }}>
      <Typography variant="h4" gutterBottom>
        Điểm danh hôm nay
      </Typography>

      {scheduleLoading ? (
        <CircularProgress />
      ) : (
        <>
          <Typography variant="body1" gutterBottom>
            Vui lòng nhấn nút bên dưới để điểm danh bắt đầu hoặc kết thúc ca làm việc của bạn.
          </Typography>
          <Box sx={{ display: 'flex', gap: 2, mt: 2 }}>
            <Button variant="contained" color="primary" onClick={handleCheckIn} disabled={loading || !todaysSchedule}>
              {loading ? <CircularProgress size={24} color="inherit" /> : 'Vào ca'}
            </Button>
            <Button variant="contained" color="secondary" onClick={handleCheckOut} disabled={loading || !todaysSchedule}>
              {loading ? <CircularProgress size={24} color="inherit" /> : 'Kết thúc ca'}
            </Button>
          </Box>
        </>
      )}

      {statusMessage && (
        <Alert severity={statusMessage.startsWith('✅') ? 'success' : statusMessage.startsWith('❌') ? 'error' : 'info'} sx={{ mt: 3 }}>
          {statusMessage}
        </Alert>
      )}
    </Box>
  );
};

export default AttendancePage;
