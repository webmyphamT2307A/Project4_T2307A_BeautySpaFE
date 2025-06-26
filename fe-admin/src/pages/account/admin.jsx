import { useState, useEffect, useRef } from 'react';
import {
  Grid, Button, Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Paper,
  Dialog, DialogTitle, DialogContent, DialogActions, TextField, MenuItem, Select, FormControl,
  InputLabel, Switch, FormControlLabel, IconButton, TablePagination, Box, InputAdornment, Chip,
  Avatar, Typography, Divider, Tooltip
} from '@mui/material';
import {
  PlusOutlined,
  EditOutlined,
  DeleteOutlined,
  SearchOutlined,
  CloseOutlined,
  EyeOutlined,
  EyeInvisibleOutlined,
  UserOutlined,
  UploadOutlined
} from '@ant-design/icons';
import MainCard from 'components/MainCard';
import Cookies from 'js-cookie';
import { toast } from 'react-toastify';

const API_URL = 'http://localhost:8080/api/v1/admin/accounts';
const ROLE_URL = 'http://localhost:8080/api/v1/roles';
const SKILL_URL = 'http://localhost:8080/api/v1/user/accounts/skill';

const AdminAccount = () => {
  const [users, setUsers] = useState([]);
  const [filteredUsers, setFilteredUsers] = useState([]);
  const [loading, setLoading] = useState(false);
  const [open, setOpen] = useState(false);
  const [viewOpen, setViewOpen] = useState(false);
  const [currentUser, setCurrentUser] = useState(null);
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [roleFilter, setRoleFilter] = useState('all');
  const [showPassword, setShowPassword] = useState(false);
  const [roles, setRoles] = useState([]);
  const [skills, setSkills] = useState([]);
  const [imagePreview, setImagePreview] = useState(null);
  const fileInputRef = useRef(null);
  const [formData, setFormData] = useState({
    fullName: '',
    phone: '',
    email: '',
    password: '',
    imageUrl: '',
    address: '',
    role: null,
    skills: [],
    isActive: 1
  });

  const fetchUsers = () => {
        setLoading(true);
        fetch(`${API_URL}/find-all`)
          .then(res => res.json())
          .then(data => {
            const usersData = data.data || [];
            const sortedUsers = usersData.sort((a, b) => new Date(b.createdAt || b.created_at) - new Date(a.createdAt || a.created_at));
            setUsers(sortedUsers);
          })
          .catch(err => {
            console.error("Failed to fetch users:", err);
            toast.error("Failed to load user data.");
          })
          .finally(() => setLoading(false));
      };


  useEffect(() => {
    fetch(`${ROLE_URL}`).then(res => res.json()).then(data => setRoles(data.data || []));
    fetch(`${SKILL_URL}`).then(res => res.json()).then(data => setSkills(data.data || []));
    fetchUsers();
  }, []);

  useEffect(() => {
    setLoading(true);

    const endpoint = statusFilter === -1
      ? `${API_URL}/find-all-deleted`
      : `${API_URL}/find-all`;

    fetch(endpoint)
      .then(res => res.json())
      .then(data => {
        const usersData = data.data || [];
        const sortedUsers = usersData.sort((a, b) => new Date(b.createdAt || b.created_at) - new Date(a.createdAt || a.created_at));

        setUsers(sortedUsers);
      })
      .catch(err => {
        console.error("Failed to fetch users:", err);
        toast.error("Không thể tải dữ liệu người dùng.");
      })
      .finally(() => setLoading(false));

  }, [statusFilter]);

  useEffect(() => {
    let results = [...users];

    if (statusFilter !== 'all') {
      results = results.filter(user => user.isActive === Number(statusFilter));
    }

    if (roleFilter !== 'all') {
      results = results.filter(user => (user.role?.id === Number(roleFilter)) || (user.roleId === Number(roleFilter)));
    }

    if (searchQuery) {
      const lower = searchQuery.toLowerCase();
      results = results.filter(
        user =>
          user.id?.toString().includes(lower) ||
          user.fullName?.toLowerCase().includes(lower) ||
          user.phone?.toLowerCase().includes(lower) ||
          user.email?.toLowerCase().includes(lower)
      );
    }
    setFilteredUsers(results);
    setPage(0);
  }, [searchQuery, statusFilter, roleFilter, users]);

  const handleOpen = (user = null) => {
    if (user) {
      const selectedRole = roles.find(r => r.id === (user.role?.id || user.roleId));
      setCurrentUser(user);
      setFormData({
        fullName: user.fullName || '',
        phone: user.phone || '',
        email: user.email || '',
        password: '',
        imageUrl: user.imageUrl || '',
        address: user.address || '',
        role: selectedRole || null,
        skills: user.skills || [],
        isActive: user.isActive
      });
      setImagePreview(user.imageUrl || null);
    } else {
      setCurrentUser(null);
      setFormData({
        fullName: '', phone: '', email: '', password: '', imageUrl: '', address: '',
        role: roles.length > 0 ? roles[0] : null,
        skills: [],
        isActive: 1
      });
      setImagePreview(null);
    }
    setOpen(true);
  };

  const handleViewOpen = (user) => {
    setCurrentUser(user);
    setViewOpen(true);
  };

  const handleViewClose = () => setViewOpen(false);

  const handleOpenEditFromView = () => {
    handleViewClose();
    handleOpen(currentUser);
  };

  const handleClose = () => setOpen(false);

  const handleChange = (e) => {
    const { name, value, checked } = e.target;
    
    // Luôn dùng functional update `prev => ({ ...prev, ... })` để đảm bảo state không bao giờ cũ
    if (name === 'isActive') {
      setFormData(prev => ({ ...prev, isActive: checked ? 1 : 0 }));
    } else if (name === 'role') {
      const roleObj = roles.find(r => r.id === Number(value));
      setFormData(prev => ({ ...prev, role: roleObj }));
    } else {
      setFormData(prev => ({ ...prev, [name]: value }));
    }
  };

  const uploadImageToServer = async (file) => {
    const formData = new FormData();
    formData.append('file', file);

    const res = await fetch('http://localhost:8080/api/v1/upload', {
      method: 'POST',
      body: formData,
    });
    if (!res.ok) throw new Error('Upload failed');
    const data = await res.json();
    return data.url;
  };

  const handleImageChange = async (event) => {
    const file = event.target.files[0];
    if (file) {
      setImagePreview(URL.createObjectURL(file));
      try {
        const url = await uploadImageToServer(file);

        // THÊM DÒNG NÀY VÀO
        console.log('1. URL trả về từ ImageKit:', url);

        setFormData(prevFormData => ({
          ...prevFormData,
          imageUrl: url
        }));
        toast.success("Tải ảnh lên thành công, hãy nhấn Lưu để cập nhật.");
      } catch (err) {
        toast.error("Upload ảnh thất bại!");
        setImagePreview(formData.imageUrl || null);
      }
    }
  };

  const handleUploadClick = () => fileInputRef.current.click();
  const handleClearField = (fieldName) => {
    if (fieldName === 'imageUrl') setImagePreview(null);
    setFormData({ ...formData, [fieldName]: '' });
  };

  const handleSave = async () => {
    const isUpdate = !!currentUser;
    const url = isUpdate ? `${API_URL}/update/${currentUser.id}` : `${API_URL}/create`;
    const method = isUpdate ? 'PUT' : 'POST';
  
    // Đảm bảo payload luôn lấy dữ liệu mới nhất từ formData
    const payload = {
      fullName: formData.fullName,
      email: formData.email,
      phone: formData.phone,
      address: formData.address,
      roleId: formData.role?.id,
      imageUrl: formData.imageUrl, // Lấy trực tiếp từ formData
      skills: formData.skills,
      isActive: formData.isActive
    };
  
    if (isUpdate) {
      if (formData.password) {
        payload.password = formData.password;
      }
    } else {
      payload.password = formData.password;
    }
    
    console.log('DỮ LIỆU GỬI ĐI KHI NHẤN LƯU:', payload);

    try {
      const res = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${Cookies.get('token')}`,
        },
        body: JSON.stringify(payload)
      });
      const data = await res.json();
      if (data.status === "SUCCESS") {
        toast.success(isUpdate ? 'Cập nhật tài khoản thành công!' : 'Tạo tài khoản thành công!');
        handleClose();
        fetchUsers();
      } else {
        toast.error(data.message || `Đã xảy ra lỗi khi ${isUpdate ? 'cập nhật' : 'tạo'} tài khoản.`);
      }
    } catch (err) {
      toast.error('Không thể kết nối đến máy chủ.');
    }
  };

  const handleDelete = async (id) => {
    if (!confirm('Bạn có chắc chắn muốn xóa tài khoản này?')) {
      toast.info('Đã hủy xóa tài khoản.');
      return;
    }

    try {
      const res = await fetch(`${API_URL}/delete/${id}`, { method: 'PUT' });
      const result = await res.json();

      if (res.ok) {
        toast.success(result.message || 'Xóa thành công!');
        setUsers(prevUsers => prevUsers.filter(user => user.id !== id));
      } else {
        toast.error(result.message || 'Xóa thất bại!');
      }
    } catch (err) {
      toast.error("An error occurred. Please try again.");
    }
  };

  const handleChangePage = (event, newPage) => setPage(newPage);
  const handleChangeRowsPerPage = (event) => {
    setRowsPerPage(parseInt(event.target.value, 10));
    setPage(0);
  };
  const handleSearchChange = (e) => setSearchQuery(e.target.value);
  const handleStatusFilterChange = (e) => setStatusFilter(e.target.value);
  const handleRoleFilterChange = (e) => setRoleFilter(e.target.value);

  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    const date = new Date(dateString);
    return date.toLocaleString('vi-VN', { timeZone: 'Asia/Ho_Chi_Minh' });
  };

  const getRoleName = (user) => {
    if (user.role?.name) return user.role.name;
    const found = roles.find(r => Number(r.id) === Number(user.role?.id || user.roleId));
    return found ? found.name : 'N/A';
  };



  const currentUsers = filteredUsers.slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage);


  return (
    <MainCard title="Quản Lý Admin">
      <Grid container spacing={3}>
        <Grid item xs={12} display="flex" justifyContent="space-between" alignItems="center" mb={2}>
          <Box display="flex" alignItems="center" gap={2}>
            <TextField
              placeholder="Tìm kiếm theo ID, tên, số điện thoại hoặc email"
              variant="outlined"
              size="small"
              value={searchQuery}
              onChange={handleSearchChange}
              sx={{ width: '300px' }}
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <SearchOutlined />
                  </InputAdornment>
                )
              }}
            />
            <FormControl size="small" sx={{ minWidth: 120 }}>
              <InputLabel id="status-filter-label">Trạng Thái</InputLabel>
              <Select
                labelId="status-filter-label"
                id="status-filter"
                value={statusFilter}
                label="Trạng Thái"
                onChange={handleStatusFilterChange}
              >
                <MenuItem value="all">Tất Cả Trạng Thái</MenuItem>
                <MenuItem value={1}>Hoạt Động</MenuItem>
                <MenuItem value={0}>Không Hoạt Động</MenuItem>
                <MenuItem value={-1}>Đã Xóa</MenuItem>
              </Select>
            </FormControl>
            <FormControl size="small" sx={{ minWidth: 120 }}>
              <InputLabel id="role-filter-label">Vai Trò</InputLabel>
              <Select
                labelId="role-filter-label"
                id="role-filter"
                value={roleFilter}
                label="Vai Trò"
                onChange={handleRoleFilterChange}
              >
                <MenuItem value="all">Tất Cả Vai Trò</MenuItem>
                {roles.map(role => (
                  <MenuItem key={role.id} value={role.id}>
                    {role.name}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          </Box>
          <Button
            variant="contained"
            color="primary"
            startIcon={<PlusOutlined />}
            onClick={() => handleOpen()}
          >
            Thêm Admin
          </Button>
        </Grid>
        <Grid item xs={12}>
          <Box sx={{ width: '100%', overflow: 'hidden' }}>
            <TableContainer component={Paper} sx={{ maxHeight: 440, '& .MuiTableHead-root': { position: 'sticky', top: 0, zIndex: 10 } }}>
              <Table stickyHeader>
                <TableHead>
                  <TableRow>
                    <TableCell align={'left'}>STT</TableCell>
                    <TableCell align={'left'}>Họ Tên</TableCell>
                    <TableCell align={'left'}>Số Điện Thoại</TableCell>
                    <TableCell align={'left'}>Email</TableCell>
                    <TableCell align={'left'}>Vai Trò</TableCell>
                    <TableCell align={'left'}>Trạng Thái</TableCell>
                    <TableCell align={'left'}>Thao Tác</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {currentUsers.length > 0 ? (
                    currentUsers.map((user, index) => (
                      <TableRow key={user.id} hover>
                        <TableCell>{page * rowsPerPage + index + 1}</TableCell>
                        <TableCell>
                          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                            <Avatar
                              src={user.imageUrl}
                              alt={user.fullName}
                            >
                              {!user.imageUrl && <UserOutlined />}
                            </Avatar>
                            {user.fullName}
                          </Box>
                        </TableCell>
                        <TableCell>{user.phone}</TableCell>
                        <TableCell>{user.email}</TableCell>
                        <TableCell>
                          <Chip
                            label={getRoleName(user)}
                            size="small"
                            color="primary"
                            variant="outlined"
                            sx={{ borderRadius: '16px' }}
                          />
                        </TableCell>
                        <TableCell>
                          <Chip
                            label={
                              user.isActive === 1 ? "Hoạt Động" :
                                user.isActive === 0 ? "Không Hoạt Động" :
                                  user.isActive === -1 ? "Đã Xóa" :
                                    ""
                            }
                            size="small"
                            color={
                              user.isActive === 1 ? "success" :
                                user.isActive === 0 ? "default" :
                                  user.isActive === -1 ? "error" :
                                    "default"
                            }
                            sx={{
                              borderRadius: '16px',
                              fontWeight: 500,
                              fontSize: '0.75rem',
                              color: user.isActive === 1 ? '#fff' : undefined
                            }}
                          />
                        </TableCell>
                        <TableCell>
                          <Tooltip title="Xem Chi Tiết">
                            <IconButton onClick={() => handleViewOpen(user)} color="info" size="small">
                              <EyeOutlined />
                            </IconButton>
                          </Tooltip>
                          <Tooltip title="Chỉnh Sửa">
                            <IconButton onClick={() => handleOpen(user)} color="primary" size="small">
                              <EditOutlined />
                            </IconButton>
                          </Tooltip>
                          <Tooltip title="Xóa">
                            <IconButton onClick={() => handleDelete(user.id)} color="error" size="small">
                              <DeleteOutlined />
                            </IconButton>
                          </Tooltip>
                        </TableCell>
                      </TableRow>
                    ))
                  ) :
                    (
                      <TableRow>
                        <TableCell colSpan={7} align="center">Không tìm thấy admin nào</TableCell>
                      </TableRow>
                    )}
                </TableBody>
              </Table>
            </TableContainer>
            <TablePagination
              rowsPerPageOptions={[10, 15, 20]}
              component="div"
              count={filteredUsers.length}
              rowsPerPage={rowsPerPage}
              page={page}
              onPageChange={handleChangePage}
              onRowsPerPageChange={handleChangeRowsPerPage}
            />
          </Box>
        </Grid>
      </Grid>

      <Dialog open={open} onClose={handleClose} maxWidth="sm" fullWidth>
        <DialogTitle sx={{ borderBottom: '1px solid #e0e0e0', pb: 2 }}>
          {currentUser ? 'Chỉnh Sửa Admin' : 'Thêm Admin'}
        </DialogTitle>
        <DialogContent sx={{ pt: 3 }}>
          <Box sx={{ mb: 3, display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
            {imagePreview ? (
              <Box sx={{ position: 'relative', mb: 2 }}>
                <Avatar
                  src={imagePreview}
                  alt="Admin avatar"
                  sx={{ width: 100, height: 100, borderRadius: '50%' }}
                />
                <IconButton
                  size="small"
                  sx={{
                    position: 'absolute',
                    top: -8,
                    right: -8,
                    bgcolor: 'background.paper',
                    boxShadow: 1
                  }}
                  onClick={() => handleClearField('imageUrl')}
                >
                  <CloseOutlined />
                </IconButton>
              </Box>
            ) : (
              <Avatar
                sx={{ width: 100, height: 100, bgcolor: 'primary.main', mb: 2 }}
              >
                <UserOutlined style={{ fontSize: 40 }} />
              </Avatar>
            )}
            <input
              type="file"
              ref={fileInputRef}
              style={{ display: 'none' }}
              accept="image/*"
              onChange={handleImageChange}
            />
            <Button
              variant="outlined"
              color="primary"
              startIcon={<UploadOutlined />}
              onClick={handleUploadClick}
            >
              Tải Ảnh Đại Diện
            </Button>
          </Box>

          <TextField
            margin="dense"
            name="fullName"
            label="Họ Tên"
            type="text"
            fullWidth
            value={formData.fullName}
            onChange={handleChange}
            InputProps={{
              endAdornment: formData.fullName ? (
                <InputAdornment position="end">
                  <IconButton size="small" onClick={() => handleClearField('fullName')}>
                    <CloseOutlined style={{ fontSize: 16 }} />
                  </IconButton>
                </InputAdornment>
              ) : null
            }}
          />
          <TextField
            margin="dense"
            name="phone"
            label="Số Điện Thoại"
            type="text"
            fullWidth
            value={formData.phone}
            onChange={handleChange}
            InputProps={{
              endAdornment: formData.phone ? (
                <InputAdornment position="end">
                  <IconButton size="small" onClick={() => handleClearField('phone')}>
                    <CloseOutlined style={{ fontSize: 16 }} />
                  </IconButton>
                </InputAdornment>
              ) : null
            }}
          />
          <TextField
            margin="dense"
            name="email"
            label="Email"
            type="email"
            fullWidth
            value={formData.email}
            onChange={handleChange}
            InputProps={{
              endAdornment: formData.email ? (
                <InputAdornment position="end">
                  <IconButton size="small" onClick={() => handleClearField('email')}>
                    <CloseOutlined style={{ fontSize: 16 }} />
                  </IconButton>
                </InputAdornment>
              ) : null
            }}
          />
          <TextField
            margin="dense"
            name="password"
            label={currentUser ? "Mật Khẩu Mới (để trống nếu không thay đổi)" : "Mật Khẩu"}
            type={showPassword ? "text" : "password"}
            fullWidth
            value={formData.password}
            onChange={handleChange}
            InputProps={{
              endAdornment: (
                <InputAdornment position="end">
                  {formData.password && (
                    <IconButton size="small" onClick={() => handleClearField('password')}>
                      <CloseOutlined style={{ fontSize: 16 }} />
                    </IconButton>
                  )}
                  <IconButton
                    size="small"
                    onClick={() => setShowPassword(!showPassword)}
                  >
                    {showPassword ? <EyeInvisibleOutlined /> : <EyeOutlined />}
                  </IconButton>
                </InputAdornment>
              )
            }}
          />
          <FormControl fullWidth margin="dense">
            <InputLabel>Vai Trò</InputLabel>
            <Select
              name="role"
              value={formData.role?.id || ''}
              label="Vai Trò"
              onChange={handleChange}
            >
              {roles.map(role => (
                <MenuItem key={role.id} value={role.id}>
                  {role.name}
                </MenuItem>
              ))}
            </Select>
          </FormControl>

          <TextField
            margin="dense"
            name="address"
            label="Địa Chỉ"
            type="text"
            fullWidth
            multiline
            rows={2}
            value={formData.address}
            onChange={handleChange}
            InputProps={{
              endAdornment: formData.address ? (
                <InputAdornment position="end">
                  <IconButton size="small" onClick={() => handleClearField('address')}>
                    <CloseOutlined style={{ fontSize: 16 }} />
                  </IconButton>
                </InputAdornment>
              ) : null
            }}
          />
          <FormControlLabel
            control={
              <Switch
                checked={formData.isActive}
                onChange={handleChange}
                name="isActive"
              />
            }
            label="Hoạt Động"
            margin="dense"
          />
        </DialogContent>
        <DialogActions sx={{ p: 2, borderTop: '1px solid #e0e0e0' }}>
          <Button onClick={handleClose} variant="outlined" color="inherit">Hủy</Button>
          <Button onClick={handleSave} variant="contained" color="primary">Lưu</Button>
        </DialogActions>
      </Dialog>

      <Dialog open={viewOpen} onClose={handleViewClose} maxWidth="sm" fullWidth>
        <DialogTitle sx={{ borderBottom: '1px solid #e0e0e0', pb: 2 }}>
          Chi Tiết Admin
          <IconButton
            aria-label="close"
            onClick={handleViewClose}
            sx={{
              position: 'absolute',
              right: 8,
              top: 8
            }}
          >
            <CloseOutlined />
          </IconButton>
        </DialogTitle>
        <DialogContent sx={{ pt: 3 }}>
          {currentUser && (
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                <Avatar
                  src={currentUser.imageUrl}
                  sx={{ width: 80, height: 80 }}
                >
                  {!currentUser.imageUrl && <UserOutlined style={{ fontSize: 40 }} />}
                </Avatar>
                <Box>
                  <Typography variant="h5">{currentUser.fullName}</Typography>
                  <Typography variant="body2" color="text.secondary">
                    {getRoleName(currentUser)}
                  </Typography>
                  <Chip
                    label={
                      currentUser.isActive === 1 ? "Hoạt Động" :
                        currentUser.isActive === 0 ? "Không Hoạt Động" :
                          currentUser.isActive === -1 ? "Đã Xóa" :
                            ""
                    }
                    size="small"
                    color={
                      currentUser.isActive === 1 ? "success" :
                        currentUser.isActive === 0 ? "default" :
                          currentUser.isActive === -1 ? "error" :
                            "default"
                    }
                    sx={{ mt: 0.5, borderRadius: '16px' }}
                  />
                </Box>
              </Box>

              <Divider />

              <Box>
                <Typography variant="subtitle1" gutterBottom fontWeight="bold">
                  Thông Tin Liên Hệ
                </Typography>
                <Grid container spacing={2}>
                  <Grid item xs={12} sm={6}>
                    <Typography variant="caption" color="text.secondary">Email</Typography>
                    <Typography>{currentUser.email}</Typography>
                  </Grid>
                  <Grid item xs={12} sm={6}>
                    <Typography variant="caption" color="text.secondary">Số Điện Thoại</Typography>
                    <Typography>{currentUser.phone || 'Chưa cung cấp'}</Typography>
                  </Grid>
                  <Grid item xs={12}>
                    <Typography variant="caption" color="text.secondary">Địa Chỉ</Typography>
                    <Typography>{currentUser.address || 'Chưa cung cấp'}</Typography>
                  </Grid>
                </Grid>
              </Box>

              <Divider />

              <Box>
                <Typography variant="subtitle1" gutterBottom fontWeight="bold">
                  Kỹ Năng
                </Typography>
                {currentUser.skills && currentUser.skills.length > 0 ? (
                  <TableContainer component={Paper}>
                    <Table>
                      <TableHead>
                        <TableRow>
                          <TableCell align="left">#</TableCell>
                          <TableCell align="left">Tên Kỹ Năng</TableCell>
                          <TableCell align="left">Mô Tả</TableCell>
                        </TableRow>
                      </TableHead>
                      <TableBody>
                        {currentUser.skills.map((skill, index) => (
                          <TableRow key={skill.id}>
                            <TableCell>{index + 1}</TableCell>
                            <TableCell>{skill.skillName}</TableCell>
                            <TableCell>{skill.description || 'Không có mô tả'}</TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </TableContainer>
                ) : (
                  <Typography variant="body2" color="text.secondary">
                    Chưa có kỹ năng được gán
                  </Typography>
                )}
              </Box>

              <Divider />

              <Box>
                <Typography variant="subtitle1" gutterBottom fontWeight="bold">
                  Thông Tin Bổ Sung
                </Typography>
                <Grid container spacing={2}>
                  <Grid item xs={12} sm={6}>
                    <Typography variant="caption" color="text.secondary">ID Người Dùng</Typography>
                    <Typography>#{currentUser.id}</Typography>
                  </Grid>
                  <Grid item xs={12} sm={6}>
                    <Typography variant="caption" color="text.secondary">Vai Trò</Typography>
                    <Typography>{getRoleName(currentUser)}</Typography>
                  </Grid>
                  <Grid item xs={12} sm={6}>
                    <Typography variant="caption" color="text.secondary">Ngày Tạo</Typography>
                    <Typography>{formatDate(currentUser.createdAt || currentUser.created_at)}</Typography>
                  </Grid>
                </Grid>
              </Box>
            </Box>
          )}
        </DialogContent>
        <DialogActions sx={{ p: 2, borderTop: '1px solid #e0e0e0' }}>
          <Button
            onClick={handleOpenEditFromView}
            startIcon={<EditOutlined />}
            variant="contained"
            color="primary"
          >
            Chỉnh Sửa
          </Button>
          <Button onClick={handleViewClose} variant="outlined">
            Đóng
          </Button>
        </DialogActions>
      </Dialog>
    </MainCard>
  );
};

export default AdminAccount;