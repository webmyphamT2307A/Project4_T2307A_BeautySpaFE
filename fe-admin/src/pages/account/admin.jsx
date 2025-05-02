import { useState, useEffect } from 'react';
import {
  Grid, Button, Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Paper,
  Dialog, DialogTitle, DialogContent, DialogActions, TextField, MenuItem, Select, FormControl,
  InputLabel, Switch, FormControlLabel, IconButton, TablePagination, Box, InputAdornment, Chip, Avatar
} from '@mui/material';
import { PlusOutlined, EditOutlined, DeleteOutlined, SearchOutlined, CloseOutlined, EyeOutlined, EyeInvisibleOutlined } from '@ant-design/icons';
import MainCard from 'components/MainCard';
import { toast } from 'react-toastify';

const API_URL = 'http://localhost:8080/api/v1/admin/accounts';
const ROLE_URL = 'http://localhost:8080/api/v1/roles';
const BRANCH_URL = 'http://localhost:8080/api/v1/branch';

const AdminAccount = () => {
  const [users, setUsers] = useState([]);
  const [filteredUsers, setFilteredUsers] = useState([]);
  const [loading, setLoading] = useState(false);
  const [open, setOpen] = useState(false);
  const [currentUser, setCurrentUser] = useState(null);
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [showPassword, setShowPassword] = useState(false);
  const [roles, setRoles] = useState([]);
  const [branches, setBranches] = useState([]);
  const [formData, setFormData] = useState({
    fullName: '',
    phone: '',
    email: '',
    password: '',
    imageUrl: '',
    address: '',
    role: null,
    branch: null,
    isActive: true
  });

  useEffect(() => {
    fetch(`${ROLE_URL}`)
      .then(res => res.json())
      .then(data => setRoles(data.data || []));
    fetch(`${BRANCH_URL}`)
      .then(res => res.json())
      .then(data => setBranches(data.data || []));
  }, []);

  // Lấy danh sách user từ BE
  useEffect(() => {
    setLoading(true);
    fetch(`${API_URL}/find-all`)
      .then(res => res.json())
      .then(data => {
        const usersData = (data.data || []).map(u => ({
          ...u,
          isActive: u.isActive === true || u.isActive === 1 || u.isActive === 'true',
          imageUrl: u.imageUrl || u.avatar || '' // fallback cho trường ảnh
        }));
        setUsers(usersData);
        setFilteredUsers(usersData);
        setLoading(false);
      });
  }, []);

  useEffect(() => {
    let results = [...users];
    if (statusFilter !== 'all') {
      results = results.filter(user => user.isActive === Boolean(Number(statusFilter)));
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
  }, [searchQuery, statusFilter, users]);

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
        isActive: user.isActive
      });
    } else {
      setCurrentUser(null);
      setFormData({
        fullName: '',
        phone: '',
        email: '',
        password: '',
        imageUrl: '',
        address: '',
        role: roles[0] || null,
        branch: branches[0] || null,
        isActive: true
      });
    }
    setOpen(true);
  };
  const handleClose = () => setOpen(false);

  const handleChange = (e) => {
    const { name, value, checked } = e.target;
    if (name === 'isActive') {
      setFormData({ ...formData, isActive: checked });
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

  const handleClearField = (fieldName) => setFormData({ ...formData, [fieldName]: '' });

  // Thêm hoặc cập nhật user
  const handleSave = async () => {
    if (currentUser) {
      const res = await fetch(`${API_URL}/update/${currentUser.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          fullName: formData.fullName,
          password: formData.password || null,
          email: formData.email,
          phone: formData.phone,
          address: formData.address,
          imageUrl: formData.imageUrl,
          roleId: formData.role?.id,
          branchId: formData.branch?.id,
          isActive: formData.isActive,
          description: ""
        })
      });
      if (res.ok) {
        toast.success('Cập nhật thành công!');
      } else {
        toast.error('Cập nhật thất bại!');
      }
    } else {
      const res = await fetch(`${API_URL}/create`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          fullName: formData.fullName,
          password: formData.password,
          email: formData.email,
          phone: formData.phone,
          address: formData.address,
          imageUrl: formData.imageUrl,
          roleId: formData.role?.id,
          branchId: formData.branch?.id
        })
      });
      if (res.ok) {
        toast.success('Tạo mới thành công!');
      } else {
        toast.error('Tạo mới thất bại!');
      }
    }
    fetch(`${API_URL}/find-all`)
      .then(res => res.json())
      .then(data => {
        const usersData = (data.data || []).map(u => ({
          ...u,
          isActive: u.isActive === true || u.isActive === 1 || u.isActive === 'true',
          imageUrl: u.imageUrl || u.avatar || ''
        }));
        setUsers(usersData);
        setFilteredUsers(usersData);
      });
    setOpen(false);
  };

  // Xóa user
  const handleDelete = async (id) => {
    if (!window.confirm('Bạn có chắc chắn muốn xóa tài khoản này?')) return;
    const res = await fetch(`${API_URL}/delete/${id}`, { method: 'PUT' });
    if (res.ok) {
      toast.success('Xóa thành công!');
    } else {
      toast.error('Xóa thất bại!');
    }
    fetch(`${API_URL}/find-all`)
      .then(res => res.json())
      .then(data => {
        const usersData = (data.data || []).map(u => ({
          ...u,
          isActive: u.isActive === true || u.isActive === 1 || u.isActive === 'true',
          imageUrl: u.imageUrl || u.avatar || ''
        }));
        setUsers(usersData);
        setFilteredUsers(usersData);
      });
  };

  const handleChangePage = (event, newPage) => setPage(newPage);
  const handleChangeRowsPerPage = (event) => {
    setRowsPerPage(parseInt(event.target.value, 10));
    setPage(0);
  };
  const handleSearchChange = (e) => setSearchQuery(e.target.value);
  const handleStatusFilterChange = (e) => {
    const value = e.target.value;
    setStatusFilter(value === 'all' ? 'all' : Number(value));
  };

  // Hiển thị tên role
  const getRoleName = (user) => {
    if (user.role && user.role.name) return user.role.name;
    if (user.role && user.role.id && roles.length > 0) {
      const found = roles.find(r => Number(r.id) === Number(user.role.id));
      return found ? found.name : 'Unknown Role';
    }
    return 'Unknown Role';
  };
  // Hiển thị tên branch
  const getBranchName = (user) => {
    if (user.branch && user.branch.name) return user.branch.name;
    if (user.branchId && branches.length > 0) {
      const found = branches.find(b => b.id === user.branchId);
      return found ? found.name : '-';
    }
    return '-';
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
                    <TableCell>#</TableCell>
                    <TableCell>Avatar</TableCell>
                    <TableCell>Full Name</TableCell>
                    <TableCell>Phone</TableCell>
                    <TableCell>Email</TableCell>
                    <TableCell>Role</TableCell>
                    <TableCell>Branch</TableCell>
                    <TableCell>Status</TableCell>
                    <TableCell>Actions</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {currentUsers.length > 0 ? (
                    currentUsers.map((user, index) => (
                      <TableRow key={user.id} hover>
                        <TableCell>{page * rowsPerPage + index + 1}</TableCell>
                        <TableCell>
                          <Avatar
                            src={user.imageUrl}
                            alt={user.fullName}
                            sx={{ width: 40, height: 40, margin: 'auto', bgcolor: '#eee' }}
                          />
                        </TableCell>
                        <TableCell>{user.fullName}</TableCell>
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
                            label={user.isActive ? "Active" : "Inactive"}
                            size="small"
                            color={user.isActive ? "success" : "default"}
                            sx={{
                              borderRadius: '16px',
                              fontWeight: 500,
                              fontSize: '0.75rem',
                              color: user.isActive ? '#fff' : '#555',
                            }}
                          />
                        </TableCell>
                        <TableCell>
                          <IconButton onClick={() => handleOpen(user)} color="primary" size="small">
                            <EditOutlined />
                          </IconButton>
                          <IconButton onClick={() => handleDelete(user.id)} color="error" size="small">
                            <DeleteOutlined />
                          </IconButton>
                        </TableCell>
                      </TableRow>
                    ))
                  ) : (
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

      <Dialog open={open} onClose={handleClose} maxWidth="sm" fullWidth>
        <DialogTitle>{currentUser ? 'Edit Admin' : 'Add Admin'}</DialogTitle>
        <DialogContent>
          {/* Hiển thị ảnh đại diện nếu có */}
          {formData.imageUrl && (
            <Box display="flex" justifyContent="center" mb={2}>
              <Avatar
                src={formData.imageUrl}
                alt="Avatar"
                sx={{ width: 80, height: 80, border: '1px solid #eee', bgcolor: '#fff' }}
              />
            </Box>
          )}
          <TextField
            margin="dense"
            name="imageUrl"
            label="Avatar URL"
            type="text"
            fullWidth
            value={formData.imageUrl}
            onChange={handleChange}
            InputProps={{
              endAdornment: formData.imageUrl ? (
                <InputAdornment position="end">
                  <IconButton size="small" onClick={() => handleClearField('imageUrl')}>
                    <CloseOutlined style={{ fontSize: 16 }} />
                  </IconButton>
                </InputAdornment>
              ) : null
            }}
          />
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
        <DialogActions>
          <Button onClick={handleClose}>Cancel</Button>
          <Button onClick={handleSave} color="primary">Save</Button>
        </DialogActions>
      </Dialog>
    </MainCard>
  );
};

export default AdminAccount;