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
const BRANCH_URL = 'http://localhost:8080/api/v1/branch';
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
  const [branches, setBranches] = useState([]);
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
    branch: null,
    skills: [],
    isActive: 1 // <-- SỬA ĐỔI: Giá trị mặc định là 1 (Active)
  });

  const fetchUsers = () => {
    setLoading(true);
    fetch(`${API_URL}/find-all`)
      .then(res => res.json())
      .then(data => {
        const usersData = data.data || [];
        const sortedUsers = usersData.sort((a, b) => new Date(b.createdAt || b.created_at) - new Date(a.createdAt || a.created_at));
        setUsers(sortedUsers);
        setFilteredUsers(sortedUsers); 
      })
      .catch(err => {
        console.error("Failed to fetch users:", err);
        toast.error("Failed to load user data.");
      })
      .finally(() => setLoading(false));
  };


  useEffect(() => {
    fetch(`${ROLE_URL}`).then(res => res.json()).then(data => setRoles(data.data || []));
    fetch(`${BRANCH_URL}`).then(res => res.json()).then(data => setBranches(data.data || []));
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
      const selectedBranch = branches.find(b => b.id === (user.branch?.id || user.branchId));
      setCurrentUser(user);
      setFormData({
        fullName: user.fullName || '',
        phone: user.phone || '',
        email: user.email || '',
        password: '',
        imageUrl: user.imageUrl || '',
        address: user.address || '',
        role: selectedRole || null,
        branch: selectedBranch || null,
        skills: user.skills || [],
        isActive: user.isActive 
      });
      setImagePreview(user.imageUrl || null);
    } else {
      setCurrentUser(null);
      setFormData({
        fullName: '', phone: '', email: '', password: '', imageUrl: '', address: '',
        role: roles.length > 0 ? roles[0] : null,
        branch: branches.length > 0 ? branches[0] : null,
        skills: [],
        isActive: 1 // <-- SỬA ĐỔI: Mặc định là 1 (Active)
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
    if (name === 'isActive') {
      setFormData({ ...formData, isActive: checked ? 1 : 0 }); // <-- SỬA ĐỔI: Cập nhật thành 1 hoặc 0
    } else if (name === 'role') {
      const roleObj = roles.find(r => r.id === Number(value));
      setFormData({ ...formData, role: roleObj });
    } else if (name === 'branch') {
      const branchObj = branches.find(b => b.id === Number(value));
      setFormData({ ...formData, branch: branchObj });
    } else {
      setFormData({ ...formData, [name]: value });
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
      setFormData({ ...formData, imageUrl: url });
    } catch (err) {
      toast.error("Upload ảnh thất bại!");
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

  const payload = {
    fullName: formData.fullName,
    email: formData.email,
    phone: formData.phone,
    address: formData.address,
    roleId: formData.role?.id,
    branchId: formData.branch?.id,
    imageUrl: formData.imageUrl,
    skills: formData.skills,
  };

  if (isUpdate) {
    payload.isActive = formData.isActive;
    if (formData.password) payload.password = formData.password;
  } else {
    payload.password = formData.password;
  }
  
  try {
    const res = await fetch(url, {
      method,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });
    
    const result = await res.json();
    if (res.ok) {
      toast.success(result.message || (isUpdate ? 'Cập nhật thành công!' : 'Tạo mới thành công!'));
      fetchUsers();
      handleClose();

      if (!isUpdate && result.token && result.user && result.roleName) {
        const { token, user, roleName } = result;
        if (roleName === 'ROLE_ADMIN') {
          Cookies.set('admin_token', token, { path: '/admin', sameSite: 'Strict', expires: 7 });
          Cookies.set('admin_role', roleName, { path: '/admin', sameSite: 'Strict', expires: 7 });
          Cookies.set('admin_userId', user.id, { path: '/admin', sameSite: 'Strict', expires: 7 });
          console.log('Admin cookie set:', Cookies.get('admin_token'), Cookies.get('admin_role'));
        } else if (roleName === 'ROLE_STAFF') {
          Cookies.set('staff_token', token, { path: '/staff', sameSite: 'Strict', expires: 7 });
          Cookies.set('staff_role', roleName, { path: '/staff', sameSite: 'Strict', expires: 7 });
          Cookies.set('staff_userId', user.id, { path: '/staff', sameSite: 'Strict', expires: 7 });
          console.log('Staff cookie set:', Cookies.get('staff_token'), Cookies.get('staff_role'), Cookies.get('staff_userId'));
        } else if (roleName === 'ROLE_MANAGER') {
          Cookies.set('manager_token', token, { path: '/manager', sameSite: 'Strict', expires: 7 });
          Cookies.set('manager_role', roleName, { path: '/manager', sameSite: 'Strict', expires: 7 });
          Cookies.set('manager_userId', user.id, { path: '/manager', sameSite: 'Strict', expires: 7 });
          console.log('Manager cookie set:', Cookies.get('manager_token'), Cookies.get('manager_role'), Cookies.get('manager_userId'));
        }
      }
      // --- end ---
    } else {
      toast.error(result.message || (isUpdate ? 'Cập nhật thất bại!' : 'Tạo mới thất bại!'));
    }
  } catch(err) {
    toast.error("An error occurred. Please try again.");
  }
};
  
  // <-- TỐI ƯU: Xóa user và cập nhật UI ngay lập tức
  const handleDelete = async (id) => {
    if (!window.confirm('Bạn có chắc chắn muốn xóa tài khoản này?')) return;

    try {
      const res = await fetch(`${API_URL}/delete/${id}`, { method: 'PUT' });
      const result = await res.json();
      
      if (res.ok) {
        toast.success(result.message || 'Xóa thành công!');
        setUsers(prevUsers => prevUsers.filter(user => user.id !== id));
      } else {
        toast.error(result.message || 'Xóa thất bại!');
      }
    } catch(err) {
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
  
  const getBranchName = (user) => {
    if (user.branch?.name) return user.branch.name;
    const found = branches.find(b => b.id === (user.branch?.id || user.branchId));
    return found ? found.name : '-';
  };

  const currentUsers = filteredUsers.slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage);


  return (
    <MainCard title="Admin Management">
      <Grid container spacing={3}>
        <Grid item xs={12} display="flex" justifyContent="space-between" alignItems="center" mb={2}>
          <Box display="flex" alignItems="center" gap={2}>
            <TextField
              placeholder="Search by ID, name, phone or email"
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
              <InputLabel id="status-filter-label">Status</InputLabel>
              <Select
                labelId="status-filter-label"
                id="status-filter"
                value={statusFilter}
                label="Status"
                onChange={handleStatusFilterChange}
              >
                <MenuItem value="all">All Status</MenuItem>
                <MenuItem value={1}>Active</MenuItem>
                <MenuItem value={0}>Inactive</MenuItem>
                <MenuItem value={-1}>Deleted</MenuItem> 
              </Select>
            </FormControl>
            <FormControl size="small" sx={{ minWidth: 120 }}>
              <InputLabel id="role-filter-label">Role</InputLabel>
              <Select
                labelId="role-filter-label"
                id="role-filter"
                value={roleFilter}
                label="Role"
                onChange={handleRoleFilterChange}
              >
                <MenuItem value="all">All Roles</MenuItem>
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
            Add Admin
          </Button>
        </Grid>
        <Grid item xs={12}>
          <Box sx={{ width: '100%', overflow: 'hidden' }}>
            <TableContainer component={Paper} sx={{ maxHeight: 440, '& .MuiTableHead-root': { position: 'sticky', top: 0, zIndex: 10 } }}>
              <Table stickyHeader>
                <TableHead>
                  <TableRow>
                    <TableCell align={'left'}>STT</TableCell>
                    <TableCell align={'left'}>Full Name</TableCell>
                    <TableCell align={'left'}>Phone</TableCell>
                    <TableCell align={'left'}>Email</TableCell>
                    <TableCell align={'left'}>Role</TableCell>
                    <TableCell align={'left'}>Branch</TableCell>
                    <TableCell align={'left'}>Status</TableCell>
                    <TableCell align={'left'}>Actions</TableCell>
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
                              src={user.imageUrl && !user.imageUrl.startsWith('http') ? `http://localhost:8080${user.imageUrl}` : user.imageUrl}
                              alt={user.fullName}
                              sx={{ width: 32, height: 32 }}
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
                        <TableCell>{getBranchName(user)}</TableCell>
                        <TableCell>
                          <Chip
                            label={
                              user.isActive === 1   ? "Active" :
                              user.isActive === 0   ? "Inactive" :
                              user.isActive === -1  ? "Deleted" :
                              ""
                            }
                            size="small"
                            color={
                              user.isActive === 1   ? "success" :
                              user.isActive === 0   ? "default" :
                              user.isActive === -1  ? "error" :
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
                          <Tooltip title="View Details">
                            <IconButton onClick={() => handleViewOpen(user)} color="info" size="small">
                              <EyeOutlined />
                            </IconButton>
                          </Tooltip>
                          <Tooltip title="Edit">
                            <IconButton onClick={() => handleOpen(user)} color="primary" size="small">
                              <EditOutlined />
                            </IconButton>
                          </Tooltip>
                          <Tooltip title="Delete">
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
                      <TableCell colSpan={9} align="center">No admins found</TableCell>
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

      {/* Add/Edit Admin Dialog */}
      <Dialog open={open} onClose={handleClose} maxWidth="sm" fullWidth>
        <DialogTitle sx={{ borderBottom: '1px solid #e0e0e0', pb: 2 }}>
          {currentUser ? 'Edit Admin' : 'Add Admin'}
        </DialogTitle>
        <DialogContent sx={{ pt: 3 }}>
          {/* Image Upload Section */}
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
              Upload Avatar
            </Button>
          </Box>

          <TextField
            margin="dense"
            name="fullName"
            label="Full Name"
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
            label="Phone"
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
            disabled={!!currentUser}
          />
          {!currentUser && (
            <TextField
              margin="dense"
              name="password"
              label="Password"
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
                    <IconButton size="small" onClick={() => setShowPassword(!showPassword)} edge="end">
                      {showPassword ? <EyeOutlined /> : <EyeInvisibleOutlined />}
                    </IconButton>
                  </InputAdornment>
                )
              }}
            />
          )}
          <FormControl fullWidth margin="dense">
            <InputLabel>Role</InputLabel>
            <Select
              name="role"
              value={formData.role?.id || ''}
              label="Role"
              onChange={handleChange}
            >
              {roles.map(role => (
                <MenuItem key={role.id} value={role.id}>
                  {role.name}
                </MenuItem>
              ))}
            </Select>
          </FormControl>
          <FormControl fullWidth margin="dense">
            <InputLabel>Branch</InputLabel>
            <Select
              name="branch"
              value={formData.branch?.id || ''}
              label="Branch"
              onChange={handleChange}
            >
              {branches.map(branch => (
                <MenuItem key={branch.id} value={branch.id}>
                  {branch.name}
                </MenuItem>
              ))}
            </Select>
          </FormControl>

          <TextField
            margin="dense"
            name="address"
            label="Address"
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
            label="Active"
            margin="dense"
          />
        </DialogContent>
        <DialogActions sx={{ p: 2, borderTop: '1px solid #e0e0e0' }}>
          <Button onClick={handleClose} variant="outlined" color="inherit">Cancel</Button>
          <Button onClick={handleSave} variant="contained" color="primary">Save</Button>
        </DialogActions>
      </Dialog>

      {/* View Admin Details Dialog */}
      <Dialog open={viewOpen} onClose={handleViewClose} maxWidth="sm" fullWidth>
        <DialogTitle sx={{ borderBottom: '1px solid #e0e0e0', pb: 2 }}>
          Admin Details
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
              {/* Avatar and basic info */}
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
                      currentUser.isActive === 1   ? "Active" :
                      currentUser.isActive === 0   ? "Inactive" :
                      currentUser.isActive === -1  ? "Deleted" :
                      ""
                    }
                    size="small"
                    color={
                      currentUser.isActive === 1   ? "success" :
                      currentUser.isActive === 0   ? "default" :
                      currentUser.isActive === -1  ? "error" :
                      "default"
                    }
                    sx={{ mt: 0.5, borderRadius: '16px' }}
                  />
                </Box>
              </Box>

              <Divider />

              {/* Contact information */}
              <Box>
                <Typography variant="subtitle1" gutterBottom fontWeight="bold">
                  Contact Information
                </Typography>
                <Grid container spacing={2}>
                  <Grid item xs={12} sm={6}>
                    <Typography variant="caption" color="text.secondary">Email</Typography>
                    <Typography>{currentUser.email}</Typography>
                  </Grid>
                  <Grid item xs={12} sm={6}>
                    <Typography variant="caption" color="text.secondary">Phone</Typography>
                    <Typography>{currentUser.phone || 'Not provided'}</Typography>
                  </Grid>
                  <Grid item xs={12}>
                    <Typography variant="caption" color="text.secondary">Address</Typography>
                    <Typography>{currentUser.address || 'Not provided'}</Typography>
                  </Grid>
                </Grid>
              </Box>

              <Divider />

              {/* Skills */}
              <Box>
                <Typography variant="subtitle1" gutterBottom fontWeight="bold">
                  Skills
                </Typography>
                {currentUser.skills && currentUser.skills.length > 0 ? (
                  <TableContainer component={Paper}>
                    <Table>
                      <TableHead>
                        <TableRow>
                          <TableCell align="left">#</TableCell>
                          <TableCell align="left">Skill Name</TableCell>
                          <TableCell align="left">Description</TableCell>
                        </TableRow>
                      </TableHead>
                      <TableBody>
                        {currentUser.skills.map((skill, index) => (
                          <TableRow key={skill.id}>
                            <TableCell>{index + 1}</TableCell>
                            <TableCell>{skill.skillName}</TableCell>
                            <TableCell>{skill.description || 'No description'}</TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </TableContainer>
                ) : (
                  <Typography variant="body2" color="text.secondary">
                    No skills assigned
                  </Typography>
                )}
              </Box>

              <Divider />

              {/* Other details */}
              <Box>
                <Typography variant="subtitle1" gutterBottom fontWeight="bold">
                  Additional Information
                </Typography>
                <Grid container spacing={2}>
                  <Grid item xs={12} sm={6}>
                    <Typography variant="caption" color="text.secondary">Branch</Typography>
                    <Typography>{getBranchName(currentUser)}</Typography>
                  </Grid>
                  <Grid item xs={12} sm={6}>
                    <Typography variant="caption" color="text.secondary">Role</Typography>
                    <Typography>{getRoleName(currentUser)}</Typography>
                  </Grid>
                  <Grid item xs={12} sm={6}>
                    <Typography variant="caption" color="text.secondary">User ID</Typography>
                    <Typography>#{currentUser.id}</Typography>
                  </Grid>
                  <Grid item xs={12} sm={6}>
                    <Typography variant="caption" color="text.secondary">Created On</Typography>
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
            Edit
          </Button>
          <Button onClick={handleViewClose} variant="outlined">
            Close
          </Button>
        </DialogActions>
      </Dialog>
    </MainCard>
  );
};

export default AdminAccount;