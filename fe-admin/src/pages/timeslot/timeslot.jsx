import React, { useState, useEffect } from 'react';
import {
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  TextField,
  IconButton,
  Box,
  CircularProgress,
  Alert,
  Chip,
  Tooltip,
  FormControl,
  InputLabel,
  Select,
  MenuItem
} from '@mui/material';
import { EditOutlined, DeleteOutlined, PlusOutlined } from '@ant-design/icons';
import MainCard from 'components/MainCard';
import { toast } from 'react-toastify';

const API_URL = 'http://localhost:8080/api/v1/timeslot';

const TimeSlotManagement = () => {
  const [timeslots, setTimeslots] = useState([]);
  const [filteredTimeslots, setFilteredTimeslots] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [openDialog, setOpenDialog] = useState(false);
  const [isEditMode, setIsEditMode] = useState(false);
  const [currentTimeslot, setCurrentTimeslot] = useState({
    slotId: null,
    startTime: '',
    endTime: '',
    shift: ''
  });
  const [shiftFilter, setShiftFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState('active');

  // Function to format time to 24h format (HH:MM)
  const formatTime24h = (timeString) => {
    if (!timeString) return '';
    
    // If already in HH:MM format, return as is
    if (timeString.match(/^\d{2}:\d{2}$/)) {
      return timeString;
    }
    
    // If in HH:MM:SS format, return HH:MM
    if (timeString.match(/^\d{2}:\d{2}:\d{2}$/)) {
      return timeString.substring(0, 5);
    }
    
    return timeString;
  };

  // Function to display time in 24h format
  const displayTime = (timeString) => {
    return formatTime24h(timeString);
  };

  useEffect(() => {
    fetchTimeSlots();
  }, []);

  useEffect(() => {
    let results = [...timeslots];
    if (shiftFilter !== 'all') {
      results = results.filter((ts) => ts.shift === shiftFilter);
    }
    if (statusFilter !== 'all') {
      results = results.filter((ts) => ts.isActive === (statusFilter === 'active'));
    }
    setFilteredTimeslots(results);
  }, [timeslots, shiftFilter, statusFilter]);

  const fetchTimeSlots = () => {
    setLoading(true);
    setError(null);
    fetch(API_URL)
      .then((res) => {
        if (!res.ok) {
          throw new Error('Network response was not ok');
        }
        return res.json();
      })
      .then((data) => {
        if (data.status === 'SUCCESS') {
          // Format time to 24h when receiving data
          const formattedData = data.data.map(slot => ({
            ...slot,
            startTime: formatTime24h(slot.startTime),
            endTime: formatTime24h(slot.endTime)
          }));
          setTimeslots(formattedData.sort((a, b) => a.slotId - b.slotId));
        } else {
          throw new Error(data.message || 'Failed to fetch timeslots');
        }
      })
      .catch((err) => {
        setError(err.message);
        toast.error(`Lỗi tải dữ liệu: ${err.message}`);
      })
      .finally(() => {
        setLoading(false);
      });
  };

  const handleOpenCreateDialog = () => {
    setIsEditMode(false);
    setCurrentTimeslot({
      slotId: null,
      startTime: '',
      endTime: '',
      shift: ''
    });
    setOpenDialog(true);
  };

  const handleOpenEditDialog = (timeslot) => {
    setIsEditMode(true);
    setCurrentTimeslot({
        ...timeslot,
        startTime: formatTime24h(timeslot.startTime) || '',
        endTime: formatTime24h(timeslot.endTime) || '',
        shift: timeslot.shift || ''
    });
    setOpenDialog(true);
  };

  const handleCloseDialog = () => {
    setOpenDialog(false);
  };

  const handleDelete = (id) => {
    if (window.confirm('Bạn có chắc chắn muốn xóa khung giờ này? Hành động này sẽ chỉ ẩn nó đi (xóa mềm).')) {
      fetch(`${API_URL}/delete/${id}`, { method: 'DELETE' })
        .then((res) => res.json())
        .then((data) => {
          if (data.status === 'SUCCESS') {
            toast.success('Xóa khung giờ thành công!');
            fetchTimeSlots();
          } else {
            throw new Error(data.message || 'Không thể xóa khung giờ');
          }
        })
        .catch((err) => toast.error(err.message));
    }
  };

  const handleSubmit = () => {
    const url = isEditMode ? `${API_URL}/update/${currentTimeslot.slotId}` : `${API_URL}/create`;
    const method = isEditMode ? 'PUT' : 'POST';

    // Ensure time is in 24h format before sending to backend
    const timeSlotDTO = {
      startTime: formatTime24h(currentTimeslot.startTime),
      endTime: formatTime24h(currentTimeslot.endTime),
      shift: currentTimeslot.shift
    };

    fetch(url, {
      method: method,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(timeSlotDTO)
    })
      .then((res) => res.json())
      .then((data) => {
        if (data.status === 'SUCCESS') {
          toast.success(`Khung giờ đã được ${isEditMode ? 'cập nhật' : 'tạo'} thành công!`);
          handleCloseDialog();
          fetchTimeSlots();
        } else {
          throw new Error(data.message || `Không thể ${isEditMode ? 'cập nhật' : 'tạo'} khung giờ`);
        }
      })
      .catch((err) => toast.error(err.message));
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setCurrentTimeslot((prev) => ({ ...prev, [name]: value }));
  };

  return (
    <MainCard title="Quản Lý Khung Giờ">
      <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 2 }}>
        <Button variant="contained" startIcon={<PlusOutlined />} onClick={handleOpenCreateDialog}>
          Tạo Khung Giờ Mới
        </Button>
        <Box sx={{ display: 'flex', gap: 2 }}>
            <FormControl size="small" sx={{ minWidth: 150 }}>
                <InputLabel>Ca làm việc</InputLabel>
                <Select value={shiftFilter} label="Ca làm việc" onChange={(e) => setShiftFilter(e.target.value)}>
                    <MenuItem value="all">Tất cả</MenuItem>
                    <MenuItem value="Sáng">Sáng</MenuItem>
                    <MenuItem value="Chiều">Chiều</MenuItem>
                </Select>
            </FormControl>
            <FormControl size="small" sx={{ minWidth: 150 }}>
                <InputLabel>Trạng thái</InputLabel>
                <Select value={statusFilter} label="Trạng thái" onChange={(e) => setStatusFilter(e.target.value)}>
                    <MenuItem value="all">Tất cả</MenuItem>
                    <MenuItem value="active">Đang hoạt động</MenuItem>
                    <MenuItem value="inactive">Đã xóa</MenuItem>
                </Select>
            </FormControl>
        </Box>
      </Box>
      {loading ? (
        <Box sx={{ display: 'flex', justifyContent: 'center', my: 3 }}>
          <CircularProgress />
        </Box>
      ) : error ? (
        <Alert severity="error">{error}</Alert>
      ) : (
        <TableContainer component={Paper}>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell>ID</TableCell>
                <TableCell>Ca làm việc</TableCell>
                <TableCell>Thời gian bắt đầu</TableCell>
                <TableCell>Thời gian kết thúc</TableCell>
                <TableCell>Trạng thái</TableCell>
                <TableCell align="center">Hành động</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {filteredTimeslots.map((timeslot) => (
                <TableRow key={timeslot.slotId} hover sx={{ '&:last-child td, &:last-child th': { border: 0 } }}>
                  <TableCell>#{timeslot.slotId}</TableCell>
                  <TableCell>
                    <Chip 
                      label={timeslot.shift} 
                      color={timeslot.shift === 'Sáng' ? 'primary' : 'secondary'} 
                      size="small" 
                    />
                  </TableCell>
                  <TableCell>
                    <strong>{displayTime(timeslot.startTime)}</strong>
                  </TableCell>
                  <TableCell>
                    <strong>{displayTime(timeslot.endTime)}</strong>
                  </TableCell>
                  <TableCell>
                    {timeslot.isActive ? (
                      <Chip label="Đang hoạt động" color="success" size="small" />
                    ) : (
                      <Chip label="Đã xóa" color="error" size="small" />
                    )}
                  </TableCell>
                  <TableCell align="center">
                    <Tooltip title="Chỉnh sửa">
                        <IconButton onClick={() => handleOpenEditDialog(timeslot)} color="primary">
                            <EditOutlined />
                        </IconButton>
                    </Tooltip>
                    {timeslot.isActive && (
                        <Tooltip title="Xóa (mềm)">
                            <IconButton onClick={() => handleDelete(timeslot.slotId)} color="error">
                                <DeleteOutlined />
                            </IconButton>
                        </Tooltip>
                    )}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
      )}

      <Dialog open={openDialog} onClose={handleCloseDialog} maxWidth="sm" fullWidth>
        <DialogTitle>{isEditMode ? 'Chỉnh Sửa Khung Giờ' : 'Tạo Khung Giờ Mới'}</DialogTitle>
        <DialogContent>
          <FormControl fullWidth margin="dense" sx={{ mt: 2, mb: 2 }}>
            <InputLabel id="shift-select-label">Ca làm việc</InputLabel>
            <Select
              labelId="shift-select-label"
              id="shift-select"
              name="shift"
              value={currentTimeslot.shift || ''}
              label="Ca làm việc"
              onChange={handleChange}
            >
              <MenuItem value={'Sáng'}>🌅 Ca Sáng</MenuItem>
              <MenuItem value={'Chiều'}>🌆 Ca Chiều</MenuItem>
            </Select>
          </FormControl>
          
          <TextField
            margin="dense"
            name="startTime"
            label="Thời gian bắt đầu (24h)"
            type="time"
            fullWidth
            variant="outlined"
            value={currentTimeslot.startTime}
            onChange={handleChange}
            InputLabelProps={{ shrink: true }}
            inputProps={{ 
              step: 300, // 5 min steps
              min: "00:00",
              max: "23:59"
            }}
            sx={{ mb: 2 }}
          />
          
          <TextField
            margin="dense"
            name="endTime"
            label="Thời gian kết thúc (24h)"
            type="time"
            fullWidth
            variant="outlined"
            value={currentTimeslot.endTime}
            onChange={handleChange}
            InputLabelProps={{ shrink: true }}
            inputProps={{ 
              step: 300, // 5 min steps
              min: "00:00",
              max: "23:59"
            }}
          />

          {/* Preview */}
          {currentTimeslot.startTime && currentTimeslot.endTime && (
            <Box sx={{ mt: 2, p: 2, bgcolor: 'grey.100', borderRadius: 1 }}>
              <strong>Xem trước:</strong> {currentTimeslot.shift} ({displayTime(currentTimeslot.startTime)} - {displayTime(currentTimeslot.endTime)})
            </Box>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseDialog}>Hủy</Button>
          <Button onClick={handleSubmit} variant="contained">
            {isEditMode ? 'Lưu Thay Đổi' : 'Tạo Mới'}
          </Button>
        </DialogActions>
      </Dialog>
    </MainCard>
  );
};

export default TimeSlotManagement; 