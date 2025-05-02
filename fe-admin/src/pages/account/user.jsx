import { useState, useEffect, useRef } from 'react';
import {
  Grid, Button, Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Paper,
  Dialog, DialogTitle, DialogContent, DialogActions, TextField, IconButton, FormControlLabel,
  Switch, TablePagination, Box, Chip, Select, MenuItem, FormControl, InputLabel, InputAdornment, Avatar
} from '@mui/material';
import { PlusOutlined, EditOutlined, DeleteOutlined, SearchOutlined, CloseOutlined, EyeOutlined, EyeInvisibleOutlined } from '@ant-design/icons';
import MainCard from 'components/MainCard';

const API_URL = 'http://localhost:8080/api/v1/customer';

const UserAccount = () => {
  const fileInputRef = useRef();
  const [users, setUsers] = useState([]);
  const [avatarFile, setAvatarFile] = useState(null);
  const [avatarPreview, setAvatarPreview] = useState('');
  const [filteredUsers, setFilteredUsers] = useState([]);
  const [loading, setLoading] = useState(false);
  const [open, setOpen] = useState(false);
  const [currentUser, setCurrentUser] = useState(null);
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [showPassword, setShowPassword] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [formData, setFormData] = useState({
    full_name: '',
    phone: '',
    email: '',
    password: '',
    image_url: '',
    address: '',
    is_active: true
  });

  useEffect(() => {
    loadCustomers();
    // eslint-disable-next-line
  }, []);

  useEffect(() => {
    const delaySearch = setTimeout(() => {
      let results = [...users];
      if (statusFilter !== 'all') {
        const isActive = statusFilter === 'active';
        results = results.filter(user => user.is_active === isActive);
      }
      if (searchQuery) {
        const lowercasedQuery = searchQuery.toLowerCase();
        results = results.filter(
          user =>
            user.customer_id?.toString().includes(lowercasedQuery) ||
            user.full_name?.toLowerCase().includes(lowercasedQuery) ||
            user.phone?.toLowerCase().includes(lowercasedQuery) ||
            (user.email && user.email.toLowerCase().includes(lowercasedQuery))
        );
      }
      setFilteredUsers(results);
      setPage(0);
    }, 300);
    return () => clearTimeout(delaySearch);
  }, [searchQuery, statusFilter, users]);

  const handleClearField = (fieldName) => {
    setFormData({ ...formData, [fieldName]: '' });
  };

  const handleOpen = (user = null) => {
    if (user) {
      setCurrentUser(user);
      setFormData({
        full_name: user.full_name,
        phone: user.phone,
        email: user.email,
        password: '',
        image_url: user.image_url || '',
        address: user.address || '',
        is_active: user.is_active
      });
      setAvatarFile(null);
      setAvatarPreview('');
    } else {
      setCurrentUser(null);
      setFormData({
        full_name: '',
        phone: '',
        email: '',
        password: '',
        image_url: '',
        address: '',
        is_active: true
      });
      setAvatarFile(null);
      setAvatarPreview('');
    }
    setOpen(true);
  };

  const handleClose = () => {
    setOpen(false);
  };

  const handleChange = (e) => {
    const { name, value, checked } = e.target;
    const newValue = name === 'is_active' ? checked : value;
    setFormData({
      ...formData,
      [name]: newValue
    });
  };

  const handleAvatarChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setAvatarFile(file);
      setAvatarPreview(URL.createObjectURL(file));
    }
  };

  // Hàm tải lại danh sách khách hàng
  const loadCustomers = () => {
    setLoading(true);
    fetch(API_URL)
      .then(res => res.json())
      .then(data => {
        const usersData = (data.data || []).map(u => ({
          ...u,
          customer_id: u.customer_id || u.id,
          full_name: u.full_name || u.fullName,
          image_url: u.image_url || u.imageUrl || '',
          is_active:
            u.is_active === true ||
            u.is_active === 1 ||
            u.is_active === 'true' ||
            u.is_active === '1' ||
            u.isActive === true ||
            u.isActive === 1 ||
            u.isActive === 'true' ||
            u.isActive === '1'
              ? true
              : false
        }));
        setUsers(usersData);
        setFilteredUsers(usersData);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  };

  const handleSave = async () => {
    const data = new FormData();
    const customerObj = {
      fullName: formData.full_name,
      email: formData.email,
      phone: formData.phone,
      address: formData.address,
      isActive: formData.is_active,
      password: !currentUser ? formData.password : undefined
    };
    if (!avatarFile && formData.image_url) {
      customerObj.imageUrl = formData.image_url;
    }
    // Sử dụng Blob để đảm bảo đúng content-type cho phần customer
    data.append('customer', new Blob([JSON.stringify(customerObj)], { type: 'application/json' }));
    if (avatarFile) {
      data.append('file', avatarFile);
    }
  
    const url = currentUser
      ? `${API_URL}/update/${currentUser.customer_id}`
      : `${API_URL}/created`;
  
    try {
      const response = await fetch(url, {
        method: 'POST',
        body: data
        // KHÔNG set headers!
      });
      const result = await response.json();
      if (result.status === 'SUCCESS') {
        loadCustomers();
      } else {
        alert(result.message || 'Có lỗi xảy ra!');
      }
    } catch (error) {
      console.error('Error saving customer:', error);
      alert('Có lỗi xảy ra khi lưu thông tin khách hàng');
    }
    setOpen(false);
  };
  const handleDelete = async (id) => {
    await fetch(`${API_URL}/delete/${id}`, { method: 'PUT' });
    loadCustomers();
  };

  const handleChangePage = (event, newPage) => {
    setPage(newPage);
  };

  const handleChangeRowsPerPage = (event) => {
    setRowsPerPage(parseInt(event.target.value, 10));
    setPage(0);
  };

  const handleSearchChange = (e) => {
    setSearchQuery(e.target.value);
  };

  const handleStatusFilterChange = (e) => {
    setStatusFilter(e.target.value);
  };

  const currentUsers = filteredUsers.slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage);

  return (
    <MainCard title="Customer Management">
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
                <MenuItem value="active">Active</MenuItem>
                <MenuItem value="inactive">Inactive</MenuItem>
              </Select>
            </FormControl>
          </Box>
          <Button
            variant="contained"
            color="primary"
            startIcon={<PlusOutlined />}
            onClick={() => handleOpen()}
          >
            Add Customer
          </Button>
        </Grid>
        <Grid item xs={12}>
          <Box sx={{ width: '100%', overflow: 'hidden' }}>
            <TableContainer
              component={Paper}
              sx={{
                maxHeight: 440,
                '& .MuiTableHead-root': {
                  position: 'sticky',
                  top: 0,
                  zIndex: 10
                }
              }}
            >
              <Table stickyHeader>
                <TableHead>
                  <TableRow>
                    <TableCell width="5%" sx={{ backgroundColor: '#f8f8f8' }}>#</TableCell>
                    <TableCell width="10%" sx={{ backgroundColor: '#f8f8f8' }}>Avatar</TableCell>
                    <TableCell width="15%" sx={{ backgroundColor: '#f8f8f8' }}>Full Name</TableCell>
                    <TableCell width="12%" sx={{ backgroundColor: '#f8f8f8' }}>Phone</TableCell>
                    <TableCell width="15%" sx={{ backgroundColor: '#f8f8f8' }}>Email</TableCell>
                    <TableCell width="18%" sx={{ backgroundColor: '#f8f8f8' }}>Address</TableCell>
                    <TableCell width="10%" sx={{ backgroundColor: '#f8f8f8' }}>Status</TableCell>
                    <TableCell width="10%" align="right" sx={{ backgroundColor: '#f8f8f8' }}>Actions</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {currentUsers.length > 0 ? (
                    currentUsers.map((user, index) => (
                      <TableRow key={user.customer_id} hover>
                        <TableCell>{page * rowsPerPage + index + 1}</TableCell>
                        <TableCell>
                          <Avatar
                            src={user.image_url}
                            alt={user.full_name}
                            sx={{ width: 40, height: 40, margin: 'auto', bgcolor: '#eee' }}
                          />
                        </TableCell>
                        <TableCell>{user.full_name}</TableCell>
                        <TableCell>{user.phone}</TableCell>
                        <TableCell>{user.email}</TableCell>
                        <TableCell>{user.address}</TableCell>
                        <TableCell>
                          <Chip
                            label={user.is_active ? "Active" : "Inactive"}
                            size="small"
                            color={user.is_active ? "success" : "default"}
                            sx={{
                              borderRadius: '16px',
                              fontWeight: 500,
                              fontSize: '0.75rem',
                              color: user.is_active ? '#fff' : '#555',
                            }}
                          />
                        </TableCell>
                        <TableCell align="right">
                          <IconButton onClick={() => handleOpen(user)} color="primary" size="small">
                            <EditOutlined />
                          </IconButton>
                          <IconButton onClick={() => handleDelete(user.customer_id)} color="error" size="small">
                            <DeleteOutlined />
                          </IconButton>
                        </TableCell>
                      </TableRow>
                    ))
                  ) : (
                    <TableRow>
                      <TableCell colSpan={8} align="center">No customers found</TableCell>
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
        <DialogTitle>{currentUser ? 'Edit Customer' : 'Add Customer'}</DialogTitle>
        <DialogContent>
          <Box display="flex" justifyContent="center" mb={2} flexDirection="column" alignItems="center">
            <Avatar
              src={avatarPreview || formData.image_url}
              alt="Avatar"
              sx={{ width: 80, height: 80, border: '1px solid #eee', bgcolor: '#fff', mb: 1 }}
            />
            <Button
              variant="outlined"
              size="small"
              component="label"
              sx={{ mb: 1 }}
            >
              Upload Image
              <input
                type="file"
                accept="image/*"
                hidden
                ref={fileInputRef}
                onChange={handleAvatarChange}
              />
            </Button>
          </Box>
          <TextField
            margin="dense"
            name="image_url"
            label="Image URL"
            type="text"
            fullWidth
            value={formData.image_url}
            onChange={handleChange}
            InputProps={{
              endAdornment: formData.image_url ? (
                <InputAdornment position="end">
                  <IconButton
                    size="small"
                    onClick={() => handleClearField('image_url')}
                  >
                    <CloseOutlined style={{ fontSize: 16 }} />
                  </IconButton>
                </InputAdornment>
              ) : null
            }}
          />
          <TextField
            margin="dense"
            name="full_name"
            label="Full Name"
            type="text"
            fullWidth
            value={formData.full_name}
            onChange={handleChange}
            InputProps={{
              endAdornment: formData.full_name ? (
                <InputAdornment position="end">
                  <IconButton
                    size="small"
                    onClick={() => handleClearField('full_name')}
                  >
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
                  <IconButton
                    size="small"
                    onClick={() => handleClearField('phone')}
                  >
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
                  <IconButton
                    size="small"
                    onClick={() => handleClearField('email')}
                  >
                    <CloseOutlined style={{ fontSize: 16 }} />
                  </IconButton>
                </InputAdornment>
              ) : null
            }}
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
                      <IconButton
                        size="small"
                        onClick={() => handleClearField('password')}
                      >
                        <CloseOutlined style={{ fontSize: 16 }} />
                      </IconButton>
                    )}
                    <IconButton
                      size="small"
                      onClick={() => setShowPassword(!showPassword)}
                      edge="end"
                    >
                      {showPassword ? <EyeOutlined /> : <EyeInvisibleOutlined />}
                    </IconButton>
                  </InputAdornment>
                )
              }}
            />
          )}
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
                  <IconButton
                    size="small"
                    onClick={() => handleClearField('address')}
                  >
                    <CloseOutlined style={{ fontSize: 16 }} />
                  </IconButton>
                </InputAdornment>
              ) : null
            }}
          />
          <FormControlLabel
            control={
              <Switch
                checked={formData.is_active}
                onChange={handleChange}
                name="is_active"
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

export default UserAccount;