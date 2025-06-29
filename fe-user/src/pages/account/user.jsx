import { useState, useEffect, useRef } from 'react';
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
  Divider
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

// project imports
import MainCard from 'components/MainCard';

const API_URL = 'http://localhost:8080/api/v1/customer';

// ==============================|| USER ACCOUNT PAGE ||============================== //

const UserAccount = () => {
  const [users, setUsers] = useState([]);
  const [avatarFile, setAvatarFile] = useState(null);
  const [avatarPreview, setAvatarPreview] = useState('');
  const [filteredUsers, setFilteredUsers] = useState([]);
  const [loading, setLoading] = useState(false);
  const [open, setOpen] = useState(false);
  const [viewOpen, setViewOpen] = useState(false);
  const [currentUser, setCurrentUser] = useState(null);
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [showPassword, setShowPassword] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [imagePreview, setImagePreview] = useState(null);
  const fileInputRef = useRef(null);
  const [formData, setFormData] = useState({
    full_name: '',
    phone: '',
    email: '',
    password: '',
    image_url: '',
    address: '',
    is_active: true
  });

  // Fetch users from BE
  useEffect(() => {
    setLoading(true);
    fetch(API_URL)
      .then((res) => res.json())
      .then((data) => {
        const usersData = (data.data || []).map((u) => ({
          ...u,
          customer_id: u.customer_id || u.id, // fallback if BE returns id
          full_name: u.full_name || u.fullName || '',
          phone: u.phone || '',
          email: u.email || '',
          image_url: u.image_url || u.imageUrl || '',
          address: u.address || '',
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
              : false,
          created_at: u.created_at || u.createdAt || new Date().toISOString()
        }));

        // Sort by newest first
        const sortedUsers = usersData.sort((a, b) => new Date(b.created_at) - new Date(a.created_at));

        setUsers(sortedUsers);
        setFilteredUsers(sortedUsers);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, []);

  // Handle search and filter functionality
  useEffect(() => {
    const delaySearch = setTimeout(() => {
      let results = [...users];

      // Apply status filter
      if (statusFilter !== 'all') {
        const isActive = statusFilter === 'active';
        results = results.filter((user) => user.is_active === isActive);
      }

      // Apply search query
      if (searchQuery) {
        const lowercasedQuery = searchQuery.toLowerCase();
        results = results.filter(
          (user) =>
            (user.full_name && user.full_name.toLowerCase().includes(lowercasedQuery)) ||
            (user.phone && user.phone.toLowerCase().includes(lowercasedQuery)) ||
            (user.email && user.email.toLowerCase().includes(lowercasedQuery))
        );
      }

      // Maintain sort order (newest first)
      results = results.sort((a, b) => new Date(b.created_at) - new Date(a.created_at));

      setFilteredUsers(results);
      setPage(0);
    }, 300);

    return () => clearTimeout(delaySearch);
  }, [searchQuery, statusFilter, users]);

  const handleClearField = (fieldName) => {
    if (fieldName === 'image_url') {
      setImagePreview(null);
    }
    setFormData({ ...formData, [fieldName]: '' });
  };

  const handleOpen = (user = null) => {
    if (user) {
      setCurrentUser(user);
      setFormData({
        full_name: user.full_name,
        phone: user.phone,
        email: user.email,
        password: '', // Don't show existing password
        image_url: user.image_url || '',
        address: user.address || '',
        is_active: user.is_active
      });
      setImagePreview(user.image_url || null);
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
      setImagePreview(null);
    }
    setOpen(true);
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

  // Image upload handler
  const handleImageChange = (event) => {
    const file = event.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (e) => {
        const imageUrl = e.target.result;
        setFormData({
          ...formData,
          image_url: imageUrl
        });
        setImagePreview(imageUrl);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleUploadClick = () => {
    fileInputRef.current.click();
  };

  // Save (create or update) user
  const handleSave = async () => {
    try {
      if (currentUser) {
        // Update existing user
        const updateBody = {
          fullName: formData.full_name,
          email: formData.email,
          phone: formData.phone,
          address: formData.address,
          imageUrl: formData.image_url,
          isActive: formData.is_active
        };
        if (formData.password && formData.password.trim() !== '') {
          updateBody.password = formData.password;
        }
        await fetch(`${API_URL}/update/${currentUser.customer_id}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(updateBody)
        });
      } else {
        // Create new user
        await fetch(`${API_URL}/created`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            fullName: formData.full_name,
            password: formData.password,
            email: formData.email,
            phone: formData.phone,
            address: formData.address,
            imageUrl: formData.image_url
          })
        });
      }
      // Reload users
      setLoading(true);
      fetch(API_URL)
        .then((res) => res.json())
        .then((data) => {
          const usersData = (data.data || []).map((u) => ({
            ...u,
            customer_id: u.customer_id || u.id,
            full_name: u.full_name || u.fullName || '',
            phone: u.phone || '',
            email: u.email || '',
            image_url: u.image_url || u.imageUrl || '',
            address: u.address || '',
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
                : false,
            created_at: u.created_at || u.createdAt || new Date().toISOString()
          }));

          // Sort by newest first
          const sortedUsers = usersData.sort((a, b) => new Date(b.created_at) - new Date(a.created_at));

          setUsers(sortedUsers);
          setFilteredUsers(sortedUsers);
          setLoading(false);
        })
        .catch(() => setLoading(false));
      setOpen(false);
    } catch (error) {
      console.error('Error saving user:', error);
    }
  };

  const handleDelete = async (id) => {
    try {
      await fetch(`${API_URL}/delete/${id}`, { method: 'PUT' });
      // Reload users
      setLoading(true);
      fetch(API_URL)
        .then((res) => res.json())
        .then((data) => {
          const usersData = (data.data || []).map((u) => ({
            ...u,
            customer_id: u.customer_id || u.id,
            full_name: u.full_name || u.fullName || '',
            phone: u.phone || '',
            email: u.email || '',
            image_url: u.image_url || u.imageUrl || '',
            address: u.address || '',
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
                : false,
            created_at: u.created_at || u.createdAt || new Date().toISOString()
          }));

          // Sort by newest first
          const sortedUsers = usersData.sort((a, b) => new Date(b.created_at) - new Date(a.created_at));

          setUsers(sortedUsers);
          setFilteredUsers(sortedUsers);
          setLoading(false);
        })
        .catch(() => setLoading(false));
    } catch (error) {
      console.error('Error deleting user:', error);
    }
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

  // Format date for display
  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    const date = new Date(dateString);
    return date.toLocaleString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  // Get current page users
  const currentUsers = filteredUsers.slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage);

  return (
    <MainCard title="Customer Management">
      <Grid container spacing={3}>
        <Grid item xs={12} display="flex" justifyContent="space-between" alignItems="center" mb={2}>
          <Box display="flex" alignItems="center" gap={2}>
            <TextField
              placeholder="Search by name, phone or email"
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
          <Button variant="contained" color="primary" startIcon={<PlusOutlined />} onClick={() => handleOpen()}>
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
                    <TableCell align={'left'} width="5%" sx={{ backgroundColor: '#f8f8f8' }}>
                      STT
                    </TableCell>
                    <TableCell align={'left'} width="15%" sx={{ backgroundColor: '#f8f8f8' }}>
                      Full Name
                    </TableCell>
                    <TableCell align={'left'} width="12%" sx={{ backgroundColor: '#f8f8f8' }}>
                      Phone
                    </TableCell>
                    <TableCell align={'left'} width="15%" sx={{ backgroundColor: '#f8f8f8' }}>
                      Email
                    </TableCell>
                    <TableCell align={'left'} width="18%" sx={{ backgroundColor: '#f8f8f8' }}>
                      Address
                    </TableCell>
                    <TableCell align={'left'} width="10%" sx={{ backgroundColor: '#f8f8f8' }}>
                      Status
                    </TableCell>
                    <TableCell width="15%" align="left" sx={{ backgroundColor: '#f8f8f8' }}>
                      Actions
                    </TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {currentUsers.length > 0 ? (
                    currentUsers.map((user, index) => (
                      <TableRow key={user.customer_id} hover>
                        <TableCell>{page * rowsPerPage + index + 1}</TableCell>
                        <TableCell>
                          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                            <Avatar src={user.image_url} alt={user.full_name} sx={{ width: 32, height: 32 }}>
                              {!user.image_url && <UserOutlined />}
                            </Avatar>
                            {user.full_name}
                          </Box>
                        </TableCell>
                        <TableCell>{user.phone}</TableCell>
                        <TableCell>{user.email}</TableCell>
                        <TableCell>{user.address}</TableCell>
                        <TableCell>
                          <Chip
                            label={user.is_active ? 'Active' : 'Inactive'}
                            size="small"
                            color={user.is_active ? 'success' : 'default'}
                            sx={{
                              borderRadius: '16px',
                              fontWeight: 500,
                              fontSize: '0.75rem',
                              color: user.is_active ? '#fff' : '#555'
                            }}
                          />
                        </TableCell>
                        <TableCell>
                          {/* Actions */}
                          <IconButton onClick={() => handleViewOpen(user)} color="info" size="small">
                            <EyeOutlined />
                          </IconButton>
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
                      <TableCell colSpan={6} align="center">
                        No customers found
                      </TableCell>
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

      {/* Add/Edit Customer Dialog */}
      <Dialog open={open} onClose={handleClose} maxWidth="sm" fullWidth>
        <DialogTitle sx={{ borderBottom: '1px solid #e0e0e0', pb: 2 }}>{currentUser ? 'Edit Customer' : 'Add Customer'}</DialogTitle>
        <DialogContent sx={{ pt: 3 }}>
          {/* Image Upload Section */}
          <Box sx={{ mb: 3, display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
            {imagePreview ? (
              <Box sx={{ position: 'relative', mb: 2 }}>
                <Avatar
                  src={imagePreview}
                  alt="User Avatar"
                  sx={{
                    width: 100,
                    height: 100,
                    border: '1px solid #e0e0e0'
                  }}
                />
                <IconButton
                  size="small"
                  sx={{
                    position: 'absolute',
                    top: -8,
                    right: -8,
                    backgroundColor: '#fff',
                    border: '1px solid #e0e0e0',
                    '&:hover': { backgroundColor: '#f5f5f5' }
                  }}
                  onClick={() => handleClearField('image_url')}
                >
                  <CloseOutlined style={{ fontSize: 14 }} />
                </IconButton>
              </Box>
            ) : (
              <Avatar
                sx={{
                  width: 100,
                  height: 100,
                  mb: 2,
                  backgroundColor: '#f0f0f0'
                }}
              >
                <UserOutlined style={{ fontSize: 50, color: '#bdbdbd' }} />
              </Avatar>
            )}
            <input type="file" ref={fileInputRef} style={{ display: 'none' }} accept="image/*" onChange={handleImageChange} />
            <Button variant="outlined" startIcon={<UploadOutlined />} onClick={handleUploadClick} size="small">
              Upload Avatar
            </Button>
          </Box>

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
                  <IconButton size="small" onClick={() => handleClearField('full_name')}>
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
          />
          {!currentUser && (
            <TextField
              margin="dense"
              name="password"
              label="Password"
              type={showPassword ? 'text' : 'password'}
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
            control={<Switch checked={formData.is_active} onChange={handleChange} name="is_active" />}
            label="Active"
            margin="dense"
          />
        </DialogContent>
        <DialogActions sx={{ p: 2, borderTop: '1px solid #e0e0e0' }}>
          <Button onClick={handleClose} variant="outlined" color="inherit">
            Cancel
          </Button>
          <Button onClick={handleSave} variant="contained" color="primary">
            Save
          </Button>
        </DialogActions>
      </Dialog>

      {/* View Customer Details Dialog */}
      <Dialog open={viewOpen} onClose={handleViewClose} maxWidth="sm" fullWidth>
        <DialogTitle sx={{ borderBottom: '1px solid #e0e0e0', pb: 2 }}>
          Customer Details
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
                <Avatar src={currentUser.image_url} sx={{ width: 80, height: 80 }}>
                  {!currentUser.image_url && <UserOutlined style={{ fontSize: 40 }} />}
                </Avatar>
                <Box>
                  <Typography variant="h5">{currentUser.full_name}</Typography>
                  <Typography variant="body2" color="text.secondary">
                    Customer
                  </Typography>
                  <Chip
                    label={currentUser.is_active ? 'Active' : 'Inactive'}
                    size="small"
                    color={currentUser.is_active ? 'success' : 'default'}
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
                    <Typography variant="caption" color="text.secondary">
                      Email
                    </Typography>
                    <Typography>{currentUser.email}</Typography>
                  </Grid>
                  <Grid item xs={12} sm={6}>
                    <Typography variant="caption" color="text.secondary">
                      Phone
                    </Typography>
                    <Typography>{currentUser.phone || 'Not provided'}</Typography>
                  </Grid>
                  <Grid item xs={12}>
                    <Typography variant="caption" color="text.secondary">
                      Address
                    </Typography>
                    <Typography>{currentUser.address || 'Not provided'}</Typography>
                  </Grid>
                </Grid>
              </Box>

              <Divider />

              {/* Other details */}
              <Box>
                <Typography variant="subtitle1" gutterBottom fontWeight="bold">
                  Additional Information
                </Typography>
                <Grid container spacing={2}>
                  <Grid item xs={12} sm={6}>
                    <Typography variant="caption" color="text.secondary">
                      Customer ID
                    </Typography>
                    <Typography>#{currentUser.customer_id}</Typography>
                  </Grid>
                  <Grid item xs={12} sm={6}>
                    <Typography variant="caption" color="text.secondary">
                      Created On
                    </Typography>
                    <Typography>{formatDate(currentUser.created_at)}</Typography>
                  </Grid>
                </Grid>
              </Box>
            </Box>
          )}
        </DialogContent>
        <DialogActions sx={{ p: 2, borderTop: '1px solid #e0e0e0' }}>
          <Button onClick={handleOpenEditFromView} startIcon={<EditOutlined />} variant="contained" color="primary">
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

export default UserAccount;
