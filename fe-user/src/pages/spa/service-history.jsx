import { useState, useEffect } from 'react';
import {
  Button,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  IconButton,
  TablePagination,
  Box,
  InputAdornment,
  Tooltip
} from '@mui/material';
import { SearchOutlined, CloseOutlined, EditOutlined, DeleteOutlined, PlusOutlined } from '@ant-design/icons';
import MainCard from 'components/MainCard';
import { toast } from 'react-toastify';
import { ToastContainer } from 'react-toastify';

const API_URL = 'http://localhost:8080/api/v1/serviceHistory';

const ServiceHistory = () => {
  // States
  const [serviceHistories, setServiceHistories] = useState([]);
  const [filteredHistories, setFilteredHistories] = useState([]);
  const [loading, setLoading] = useState(false);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [currentHistory, setCurrentHistory] = useState(null);
  const [formData, setFormData] = useState({
    userId: '',
    customerId: '',
    appointmentId: '',
    serviceId: '',
    dateUsed: '',
    notes: '',
    isActive: true
  });
  const [searchQuery, setSearchQuery] = useState('');
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [calculatedTotal, setCalculatedTotal] = useState(0);

  // Load data from BE
  useEffect(() => {
    setLoading(true);
    fetch(API_URL)
      .then((res) => res.json())
      .then((data) => {
        if (data.status === 'SUCCESS' && Array.isArray(data.data)) {
          setServiceHistories(data.data);
          setFilteredHistories(data.data);
        } else {
          setServiceHistories([]);
          setFilteredHistories([]);
        }
        setLoading(false);
      })
      .catch(() => {
        setLoading(false);
        toast.error('Lỗi khi tải dữ liệu lịch sử dịch vụ');
      });
  }, []);

  // Filter service histories
  useEffect(() => {
    let results = [...serviceHistories];

    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      results = results.filter(
        (history) =>
          history.userId.toString().includes(query) ||
          history.customerId.toString().includes(query) ||
          history.serviceId.toString().includes(query)
      );
    }

    setFilteredHistories(results);
    setPage(0);
  }, [searchQuery, serviceHistories]);

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

  const handleOpenDialog = (history = null) => {
    if (history) {
      setCurrentHistory(history);
      setFormData({
        userId: history.userId,
        customerId: history.customerId,
        appointmentId: history.appointmentId,
        serviceId: history.serviceId,
        dateUsed: history.dateUsed,
        notes: history.notes,
        isActive: history.isActive
      });
    } else {
      setCurrentHistory(null);
      setFormData({
        userId: '',
        customerId: '',
        appointmentId: '',
        serviceId: '',
        dateUsed: '',
        notes: '',
        isActive: true
      });
    }
    setDialogOpen(true);
  };

  const handleCloseDialog = () => {
    setDialogOpen(false);
  };

  const handleFormChange = (event) => {
    const { name, value } = event.target;
    setFormData({ ...formData, [name]: value });
  };

  const handleSave = () => {
    const method = currentHistory ? 'PUT' : 'POST';
    const url = currentHistory ? `${API_URL}/${currentHistory.id}` : API_URL;

    fetch(url, {
      method,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(formData)
    })
      .then((res) => res.json())
      .then((data) => {
        if (data.status === 'SUCCESS') {
          toast.success(currentHistory ? 'Cập nhật thành công' : 'Thêm mới thành công');
          if (currentHistory) {
            setServiceHistories((prev) => prev.map((item) => (item.id === currentHistory.id ? data.data : item)));
          } else {
            setServiceHistories((prev) => [...prev, data.data]);
          }
          setDialogOpen(false);
        } else {
          toast.error('Thao tác thất bại');
        }
      })
      .catch(() => toast.error('Lỗi khi thực hiện thao tác'));
  };

  const handleDelete = (id) => {
    if (window.confirm('Bạn có chắc chắn muốn xóa lịch sử dịch vụ này?')) {
      fetch(`${API_URL}/${id}`, { method: 'DELETE' })
        .then((res) => res.json())
        .then((data) => {
          if (data.status === 'SUCCESS') {
            toast.success('Xóa thành công');
            setServiceHistories((prev) => prev.filter((item) => item.id !== id));
          } else {
            toast.error('Xóa thất bại');
          }
        })
        .catch(() => toast.error('Lỗi khi xóa lịch sử dịch vụ'));
    }
  };

  const validateVietnamesePhone = (phone) => {
    // ... existing code ...
    console.warn('⚠️ Không thể tải thống kê khách hàng:', error);
  };

  const processHistoryData = (data) => {
    const appointmentsData = Array.isArray(data) ? data : [data];
    console.log('🔍 Processing data, total items:', appointmentsData.length);

    // ✅ CẢI TIẾN: Lọc những record có dữ liệu hợp lệ
    const filteredData = appointmentsData.filter((app) => {
      console.log(`📋 Item ${app.id || app.appointmentId}:`, {
        serviceName: app.serviceName,
        servicePrice: app.servicePrice,
        userName: app.userName,
        status: app.status,
        appointmentDate: app.appointmentDate,
        fullObject: app
      });

      // ✅ FIX: Luôn hiển thị các lịch hẹn đã bị hủy để người dùng biết.
      if (app.status?.toLowerCase().trim() === 'cancelled') {
        return true;
      }

      // Loại bỏ những record không hợp lệ
      const hasValidId = app.id || app.appointmentId;
      const hasValidPrice = app.servicePrice !== null && app.servicePrice !== undefined && app.servicePrice > 0;
      const hasValidName = app.serviceName && app.serviceName.toLowerCase() !== 'n/a' && app.serviceName.trim() !== '';
      const hasValidUserName = app.userName && app.userName.toLowerCase() !== 'n/a' && app.userName.trim() !== '';

      const isValid = hasValidId && hasValidPrice && hasValidName && hasValidUserName;

      console.log(`🔍 Validation for ${app.id || app.appointmentId}:`, {
        hasValidId,
        hasValidPrice,
        hasValidName,
        hasValidUserName,
        isValid
      });

      return isValid;
    });

    console.log('🎯 After filtering, remaining items:', filteredData.length);

    // ✅ DEBUG: Log tất cả dữ liệu trước khi tính tổng
    const total = filteredData.reduce((sum, app) => sum + app.servicePrice, 0);
    setCalculatedTotal(total);

    return filteredData.map((app) => ({
      ...app,
      id: app.id || app.appointmentId,
      appointmentId: app.appointmentId || app.id
    }));
  };

  const fetchHistoryByCustomerId = async (customerId) => {
    // ... existing code ...
  };

  return (
    <MainCard
      title="Quản lý lịch sử dịch vụ"
      secondary={
        <Button variant="contained" startIcon={<PlusOutlined />} onClick={() => handleOpenDialog()}>
          Thêm lịch sử
        </Button>
      }
    >
      <Box sx={{ mb: 3 }}>
        <TextField
          fullWidth
          size="small"
          placeholder="Tìm kiếm theo người dùng, khách hàng hoặc dịch vụ..."
          value={searchQuery}
          onChange={handleSearchChange}
          InputProps={{
            startAdornment: (
              <InputAdornment position="start">
                <SearchOutlined />
              </InputAdornment>
            ),
            endAdornment: searchQuery ? (
              <InputAdornment position="end">
                <IconButton size="small" onClick={() => setSearchQuery('')}>
                  <CloseOutlined />
                </IconButton>
              </InputAdornment>
            ) : null
          }}
        />
      </Box>

      <TableContainer component={Paper}>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell>ID</TableCell>
              <TableCell>User ID</TableCell>
              <TableCell>Customer ID</TableCell>
              <TableCell>Appointment ID</TableCell>
              <TableCell>Service ID</TableCell>
              <TableCell>Date Used</TableCell>
              <TableCell>Notes</TableCell>
              <TableCell>Actions</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {filteredHistories.slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage).map((history) => (
              <TableRow key={history.id}>
                <TableCell>{history.id}</TableCell>
                <TableCell>{history.userId}</TableCell>
                <TableCell>{history.customerId}</TableCell>
                <TableCell>{history.appointmentId}</TableCell>
                <TableCell>{history.serviceId}</TableCell>
                <TableCell>{history.dateUsed}</TableCell>
                <TableCell>{history.notes}</TableCell>
                <TableCell>
                  <Tooltip title="Edit">
                    <IconButton onClick={() => handleOpenDialog(history)} color="primary">
                      <EditOutlined />
                    </IconButton>
                  </Tooltip>
                  <Tooltip title="Delete">
                    <IconButton onClick={() => handleDelete(history.id)} color="error">
                      <DeleteOutlined />
                    </IconButton>
                  </Tooltip>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>
      <TablePagination
        rowsPerPageOptions={[10, 20, 50]}
        component="div"
        count={filteredHistories.length}
        rowsPerPage={rowsPerPage}
        page={page}
        onPageChange={handleChangePage}
        onRowsPerPageChange={handleChangeRowsPerPage}
      />

      {/* Add/Edit Dialog */}
      <Dialog open={dialogOpen} onClose={handleCloseDialog} maxWidth="sm" fullWidth>
        <DialogTitle>{currentHistory ? 'Chỉnh sửa lịch sử' : 'Thêm lịch sử'}</DialogTitle>
        <DialogContent>
          <TextField margin="dense" name="userId" label="User ID" fullWidth value={formData.userId} onChange={handleFormChange} />
          <TextField
            margin="dense"
            name="customerId"
            label="Customer ID"
            fullWidth
            value={formData.customerId}
            onChange={handleFormChange}
          />
          <TextField
            margin="dense"
            name="appointmentId"
            label="Appointment ID"
            fullWidth
            value={formData.appointmentId}
            onChange={handleFormChange}
          />
          <TextField margin="dense" name="serviceId" label="Service ID" fullWidth value={formData.serviceId} onChange={handleFormChange} />
          <TextField
            margin="dense"
            name="dateUsed"
            label="Date Used"
            type="datetime-local"
            fullWidth
            InputLabelProps={{ shrink: true }}
            value={formData.dateUsed}
            onChange={handleFormChange}
          />
          <TextField
            margin="dense"
            name="notes"
            label="Notes"
            fullWidth
            multiline
            rows={3}
            value={formData.notes}
            onChange={handleFormChange}
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseDialog} color="inherit">
            Cancel
          </Button>
          <Button onClick={handleSave} variant="contained" color="primary">
            {currentHistory ? 'Update' : 'Save'}
          </Button>
        </DialogActions>
      </Dialog>

      <ToastContainer position="top-right" autoClose={3000} hideProgressBar={false} />
    </MainCard>
  );
};

export default ServiceHistory;
