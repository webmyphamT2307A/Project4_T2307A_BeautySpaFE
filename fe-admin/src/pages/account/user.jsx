import { useState, useEffect, useRef, useCallback } from 'react';
import {
  Grid,
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
  FormControlLabel,
  Switch,
  TablePagination,
  Box,
  Chip,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  InputAdornment,
  Avatar,
  Typography,
  Divider,
  CircularProgress // Thêm CircularProgress để hiển thị loading
} from '@mui/material';
import {
  PlusOutlined,
  EditOutlined,
  DeleteOutlined,
  SearchOutlined,
  CloseOutlined,
  EyeOutlined,
  EyeInvisibleOutlined,
  UploadOutlined,
  UserOutlined
} from '@ant-design/icons';
import MainCard from 'components/MainCard';
import { toast, ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

// REFACTOR: API URL đã được cập nhật để khớp với backend controller mới
const API_URL = 'http://localhost:8080/api/v1/customers';

// ==============================|| USER ACCOUNT PAGE ||============================== //

const UserAccount = () => {
  const [users, setUsers] = useState([]);
  const [filteredUsers, setFilteredUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [open, setOpen] = useState(false);
  const [viewOpen, setViewOpen] = useState(false);
  const [currentUser, setCurrentUser] = useState(null);
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [showPassword, setShowPassword] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  
  // REFACTOR: Tách state cho file và preview
  const [avatarFile, setAvatarFile] = useState(null); // State để giữ File object
  const [avatarPreview, setAvatarPreview] = useState(''); // State để giữ URL preview (base64 hoặc http link)

  const fileInputRef = useRef(null);

  // REFACTOR: State formData giờ sử dụng camelCase để đồng bộ với backend DTO
  const [formData, setFormData] = useState({
    fullName: '',
    phone: '',
    email: '',
    password: '',
    address: '',
    isActive: true,
    imageUrl: '' // Chỉ dùng để giữ URL ảnh cũ khi edit
  });

  // REFACTOR: Tạo hàm fetch tập trung để tránh lặp code
  const fetchAndSetUsers = useCallback(async () => {
    setLoading(true);
    try {
      const response = await fetch(API_URL);
      const result = await response.json();
      if (result.status === 'SUCCESS' && Array.isArray(result.data)) {
        // Backend trả về camelCase, không cần map lại nhiều
        const sortedUsers = result.data.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
        setUsers(sortedUsers);
        setFilteredUsers(sortedUsers); // Cập nhật cả filteredUsers
      }
    } catch (error) {
      console.error('Failed to fetch users:', error);
      toast.error('Không thể tải danh sách khách hàng!');
    } finally {
      setLoading(false);
    }
  }, []);

  // Lần đầu tải component thì fetch dữ liệu
  useEffect(() => {
    fetchAndSetUsers();
  }, [fetchAndSetUsers]);
  
  // Lọc và tìm kiếm
  useEffect(() => {
    let results = [...users];

    if (statusFilter !== 'all') {
      const isActive = statusFilter === 'active';
      results = results.filter(user => user.isActive === isActive);
    }

    if (searchQuery) {
      const lowercasedQuery = searchQuery.toLowerCase();
      results = results.filter(
        user =>
          (user.fullName && user.fullName.toLowerCase().includes(lowercasedQuery)) ||
          (user.phone && user.phone.toLowerCase().includes(lowercasedQuery)) ||
          (user.email && user.email.toLowerCase().includes(lowercasedQuery))
      );
    }

    setFilteredUsers(results);
    setPage(0); // Reset về trang đầu tiên khi filter
  }, [searchQuery, statusFilter, users]);


  const handleOpen = (user = null) => {
    setShowPassword(false);
    setAvatarFile(null); // Reset file

    if (user) {
      setCurrentUser(user);
      // Map dữ liệu từ user (camelCase) vào formData (camelCase)
      setFormData({
        fullName: user.fullName || '',
        phone: user.phone || '',
        email: user.email || '',
        password: '', // Không hiển thị password cũ
        address: user.address || '',
        isActive: user.isActive,
        imageUrl: user.imageUrl || '' // Giữ lại URL ảnh cũ
      });
      setAvatarPreview(user.imageUrl || ''); // Set preview cho ảnh cũ
    } else {
      setCurrentUser(null);
      // Reset form cho việc tạo mới
      setFormData({
        fullName: '',
        phone: '',
        email: '',
        password: '',
        address: '',
        isActive: true,
        imageUrl: ''
      });
      setAvatarPreview('');
    }
    setOpen(true);
  };

  const handleClose = () => {
    setOpen(false);
    setCurrentUser(null);
  };
  
  const handleViewOpen = (user) => {
    setCurrentUser(user);
    setViewOpen(true);
  };

  const handleViewClose = () => {
    setViewOpen(false);
  };

  const handleOpenEditFromView = () => {
    handleViewClose();
    handleOpen(currentUser);
  };
  
  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
  };

  // REFACTOR: Xử lý file ảnh, giữ lại File object và tạo URL preview
  const handleImageChange = (event) => {
    const file = event.target.files[0];
    if (file) {
      setAvatarFile(file); // Lưu File object để gửi đi
      setAvatarPreview(URL.createObjectURL(file)); // Tạo URL tạm thời để xem trước
    }
  };
  
  const handleClearImage = () => {
    setAvatarFile(null);
    setAvatarPreview('');
    setFormData(prev => ({ ...prev, imageUrl: '' }));
    if(fileInputRef.current) {
        fileInputRef.current.value = null;
    }
  };


  // REFACTOR: Hàm Save sử dụng FormData để upload file
  const handleSave = async () => {
    const formPayload = new FormData();
    
    // 1. Chuẩn bị customer DTO
    const customerDto = {
        fullName: formData.fullName,
        email: formData.email,
        phone: formData.phone,
        address: formData.address,
        isActive: formData.isActive
    };
    
    // Nếu là update, gửi cả imageUrl cũ (nếu không có ảnh mới)
    if (currentUser) {
        customerDto.imageUrl = formData.imageUrl;
    }
    // Chỉ thêm password nếu có giá trị (cho cả create và update)
    if (formData.password) {
        customerDto.password = formData.password;
    }

    // 2. Append DTO và file vào FormData
    formPayload.append('customer', new Blob([JSON.stringify(customerDto)], { type: "application/json" }));
    
    if (avatarFile) {
      formPayload.append('file', avatarFile);
    }
    
    // 3. Gửi request
    setLoading(true);
    try {
      const url = currentUser ? `${API_URL}/${currentUser.id}` : API_URL;
      const method = currentUser ? 'PUT' : 'POST';

      const response = await fetch(url, {
        method: method,
        body: formPayload
        // KHÔNG set 'Content-Type', trình duyệt sẽ tự làm khi gửi FormData
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || `Failed to ${method === 'POST' ? 'create' : 'update'} customer.`);
      }

      handleClose();
      await fetchAndSetUsers(); // Tải lại dữ liệu
      
      // Hiển thị thông báo thành công
      const action = currentUser ? 'cập nhật' : 'tạo';
      toast.success(`${action} khách hàng thành công!`);

    } catch (error) {
      console.error("Error saving user:", error);
      const action = currentUser ? 'cập nhật' : 'tạo';
      toast.error(`Lỗi khi ${action} khách hàng: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  // REFACTOR: Sử dụng method DELETE
  const handleDelete = async (id) => {
    if (confirm('Bạn có chắc chắn muốn xóa khách hàng này?')) {
      setLoading(true);
      try {
        const response = await fetch(`${API_URL}/${id}`, { method: 'DELETE' });
        if(!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.message || 'Failed to delete customer.');
        }
        await fetchAndSetUsers(); // Tải lại dữ liệu
        toast.success('Xóa khách hàng thành công!');
      } catch (error) {
        console.error("Error deleting user:", error);
        toast.error(`Lỗi khi xóa khách hàng: ${error.message}`);
      } finally {
        setLoading(false);
      }
    }
  };

  const handleChangePage = (event, newPage) => setPage(newPage);
  const handleChangeRowsPerPage = (event) => {
    setRowsPerPage(parseInt(event.target.value, 10));
    setPage(0);
  };
  const handleSearchChange = (e) => setSearchQuery(e.target.value);
  const handleStatusFilterChange = (e) => setStatusFilter(e.target.value);
  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    return new Date(dateString).toLocaleString('vi-VN', {
      year: 'numeric', month: 'short', day: 'numeric',
      hour: '2-digit', minute: '2-digit'
    });
  };

  const currentUsers = filteredUsers.slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage);

  return (
    <>
      <MainCard title="Quản lý Khách hàng">
        <Grid container spacing={3}>
        {/* Search and Filter */}
        <Grid item xs={12} display="flex" justifyContent="space-between" alignItems="center" mb={2}>
            <Box display="flex" alignItems="center" gap={2}>
                <TextField
                placeholder="Tìm theo tên, SĐT, email..."
                variant="outlined" size="small" value={searchQuery}
                onChange={handleSearchChange} sx={{ width: '300px' }}
                InputProps={{ startAdornment: (<InputAdornment position="start"><SearchOutlined /></InputAdornment>) }}
                />
                <FormControl size="small" sx={{ minWidth: 120 }}>
                    <InputLabel>Trạng thái</InputLabel>
                    <Select value={statusFilter} label="Trạng thái" onChange={handleStatusFilterChange}>
                        <MenuItem value="all">Tất cả</MenuItem>
                        <MenuItem value="active">Hoạt động</MenuItem>
                        <MenuItem value="inactive">Tạm ngưng</MenuItem>
                    </Select>
                </FormControl>
            </Box>
            <Button variant="contained" color="primary" startIcon={<PlusOutlined />} onClick={() => handleOpen()}>
                Thêm Khách hàng
            </Button>
        </Grid>
        
        {/* Table */}
        <Grid item xs={12}>
            <TableContainer component={Paper} sx={{ maxHeight: 600 }}>
              {loading && <Box sx={{ display: 'flex', justifyContent: 'center', p: 3 }}><CircularProgress /></Box>}
              {!loading && (
                <>
                    <Table stickyHeader>
                        <TableHead>
                            <TableRow>
                                <TableCell align={'left'} width="5%">#</TableCell>
                                <TableCell align={'left'} width="25%">Tên</TableCell>
                                <TableCell align={'left'} width="15%">Số điện thoại</TableCell>
                                <TableCell align={'left'} width="20%">Email</TableCell>
                                <TableCell align={'center'} width="10%">Trạng thái</TableCell>
                                <TableCell width="15%" align="center">Hành động</TableCell>
                            </TableRow>
                        </TableHead>
                        <TableBody>
                        {currentUsers.length > 0 ? (
                            currentUsers.map((user, index) => (
                            <TableRow key={user.id} hover>
                                <TableCell>{page * rowsPerPage + index + 1}</TableCell>
                                <TableCell>
                                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                                    <Avatar src={user.imageUrl} alt={user.fullName}>
                                        {!user.imageUrl && <UserOutlined />}
                                    </Avatar>
                                    {user.fullName}
                                </Box>
                                </TableCell>
                                <TableCell>{user.phone}</TableCell>
                                <TableCell>{user.email}</TableCell>
                                <TableCell align="center">
                                    <Chip
                                        label={user.isActive ? "active" : "non active"}
                                        size="small"
                                        color={user.isActive ? "success" : "default"}
                                    />
                                </TableCell>
                                <TableCell align="center">
                                    <IconButton onClick={() => handleViewOpen(user)} color="info" size="small"><EyeOutlined /></IconButton>
                                    <IconButton onClick={() => handleOpen(user)} color="primary" size="small"><EditOutlined /></IconButton>
                                    <IconButton onClick={() => handleDelete(user.id)} color="error" size="small"><DeleteOutlined /></IconButton>
                                </TableCell>
                            </TableRow>
                            ))
                        ) : (
                            <TableRow><TableCell colSpan={6} align="center">Không tìm thấy khách hàng nào</TableCell></TableRow>
                        )}
                        </TableBody>
                    </Table>
                    <TablePagination
                        rowsPerPageOptions={[10, 15, 20]}
                        component="div"
                        count={filteredUsers.length}
                        rowsPerPage={rowsPerPage}
                        page={page}
                        onPageChange={handleChangePage}
                        onRowsPerPageChange={handleChangeRowsPerPage}
                    />
                </>
              )}
            </TableContainer>
        </Grid>
      </Grid>

      {/* Add/Edit Dialog */}
      <Dialog open={open} onClose={handleClose} maxWidth="sm" fullWidth>
        <DialogTitle>{currentUser ? 'Chỉnh sửa Khách hàng' : 'Thêm Khách hàng'}</DialogTitle>
        <DialogContent dividers>
          <Box sx={{ mb: 3, display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
            <Box sx={{ position: 'relative', mb: 2 }}>
                <Avatar src={avatarPreview} sx={{ width: 100, height: 100, border: '1px solid #e0e0e0' }}>
                    {!avatarPreview && <UserOutlined style={{ fontSize: 50 }} />}
                </Avatar>
                {avatarPreview && (
                    <IconButton size="small" onClick={handleClearImage} sx={{ position: 'absolute', top: -8, right: -8, backgroundColor: 'white', border: '1px solid #e0e0e0' }}>
                        <CloseOutlined style={{ fontSize: 14 }} />
                    </IconButton>
                )}
            </Box>
            <input type="file" ref={fileInputRef} style={{ display: 'none' }} accept="image/*" onChange={handleImageChange} />
            <Button variant="outlined" startIcon={<UploadOutlined />} onClick={() => fileInputRef.current.click()} size="small">
              Tải ảnh lên
            </Button>
          </Box>
          <TextField margin="dense" name="fullName" label="Họ và Tên" type="text" fullWidth value={formData.fullName} onChange={handleChange} />
          <TextField margin="dense" name="phone" label="Số điện thoại" type="text" fullWidth value={formData.phone} onChange={handleChange} />
          <TextField margin="dense" name="email" label="Email" type="email" fullWidth value={formData.email} onChange={handleChange} />
          <TextField
            margin="dense" name="password" label={currentUser ? "Mật khẩu mới (để trống nếu không đổi)" : "Mật khẩu"}
            type={showPassword ? "text" : "password"} fullWidth value={formData.password} onChange={handleChange}
            InputProps={{
              endAdornment: (
                <InputAdornment position="end">
                  <IconButton onClick={() => setShowPassword(!showPassword)} edge="end">
                    {showPassword ? <EyeOutlined /> : <EyeInvisibleOutlined />}
                  </IconButton>
                </InputAdornment>
              )
            }}
          />
          <TextField margin="dense" name="address" label="Địa chỉ" type="text" fullWidth multiline rows={2} value={formData.address} onChange={handleChange} />
          <FormControlLabel
            control={<Switch checked={formData.isActive} onChange={handleChange} name="isActive" />}
            label="Hoạt động"
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={handleClose}>Hủy</Button>
          <Button onClick={handleSave} variant="contained" disabled={loading}>
            {loading ? <CircularProgress size={24} /> : 'Lưu'}
          </Button>
        </DialogActions>
      </Dialog>
      
      {/* View Details Dialog */}
      <Dialog open={viewOpen} onClose={handleViewClose} maxWidth="sm" fullWidth>
        <DialogTitle>
          Chi tiết Khách hàng
          <IconButton aria-label="close" onClick={handleViewClose} sx={{ position: 'absolute', right: 8, top: 8 }}>
            <CloseOutlined />
          </IconButton>
        </DialogTitle>
        <DialogContent dividers>
          {currentUser && (
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                <Avatar src={currentUser.imageUrl} sx={{ width: 80, height: 80 }}><UserOutlined style={{ fontSize: 40 }} /></Avatar>
                <Box>
                  <Typography variant="h5">{currentUser.fullName}</Typography>
                  <Chip label={currentUser.isActive ? "Active" : "No active"} size="small" color={currentUser.isActive ? "success" : "default"} sx={{ mt: 0.5 }} />
                </Box>
              </Box>
              <Divider />
              <Typography variant="subtitle1" fontWeight="bold">Thông tin liên hệ</Typography>
              <Grid container spacing={1}>
                <Grid item xs={4}><Typography variant="body2" color="text.secondary">Email:</Typography></Grid>
                <Grid item xs={8}><Typography>{currentUser.email}</Typography></Grid>
                <Grid item xs={4}><Typography variant="body2" color="text.secondary">Điện thoại:</Typography></Grid>
                <Grid item xs={8}><Typography>{currentUser.phone}</Typography></Grid>
                <Grid item xs={4}><Typography variant="body2" color="text.secondary">Địa chỉ:</Typography></Grid>
                <Grid item xs={8}><Typography>{currentUser.address || 'Chưa cung cấp'}</Typography></Grid>
                <Grid item xs={4}><Typography variant="body2" color="text.secondary">Ngày tạo:</Typography></Grid>
                <Grid item xs={8}><Typography>{formatDate(currentUser.createdAt)}</Typography></Grid>
              </Grid>
            </Box>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={handleViewClose}>Đóng</Button>
          <Button onClick={handleOpenEditFromView} variant="contained" startIcon={<EditOutlined />}>Chỉnh sửa</Button>
        </DialogActions>
      </Dialog>
      </MainCard>
      
      {/* Toast Notifications */}
      <ToastContainer
        position="top-right"
        autoClose={5000}
        hideProgressBar={false}
        newestOnTop={false}
        closeOnClick
        rtl={false}
        pauseOnFocusLoss
        draggable
        pauseOnHover
        theme="light"
      />
    </>
  );
};

export default UserAccount;