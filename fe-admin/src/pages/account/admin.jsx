import { useState, useEffect } from 'react';
import {
  Grid,
  Typography,
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
  MenuItem,
  Select,
  FormControl,
  InputLabel,
  Switch,
  FormControlLabel,
  IconButton,
  TablePagination,
  Box,
  InputAdornment,
  Chip,
} from '@mui/material';
import { PlusOutlined, EditOutlined, DeleteOutlined, SearchOutlined, CloseOutlined, EyeOutlined, EyeInvisibleOutlined } from '@ant-design/icons';
// project imports
import MainCard from 'components/MainCard';

// ==============================|| ADMIN ACCOUNT PAGE ||============================== //

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
    full_name: '',
    phone: '',
    email: '',
    password: '',
    image_url: '',
    address: '',
    role_id: 3, // Default to Staff role
    branch_id: '',
    description: '',
    is_active: true
  });

  // Mock data for roles and branches
  useEffect(() => {
    setRoles([
      { role_id: 1, name: 'Super Admin' },
      { role_id: 2, name: 'Manager' },
      { role_id: 3, name: 'Staff' },
      { role_id: 4, name: 'Accountant' }
    ]);

    setBranches([
      { branch_id: 1, name: 'Hanoi Branch', address: '123 Hai Ba Trung, Hanoi' },
      { branch_id: 2, name: 'HCMC Branch', address: '456 Nguyen Hue, District 1, Ho Chi Minh City' },
      { branch_id: 3, name: 'Da Nang Branch', address: '789 Bach Dang, Da Nang' }
    ]);
  }, []);

  // Mock data for admin users
  useEffect(() => {
    const mockUsers = [
      { user_id: 1, full_name: 'John Admin', phone: '0901234567', email: 'john@admin.com', password: '********', image_url: '', address: 'Hanoi, Vietnam', role_id: 1, branch_id: 1, description: 'Main administrator', is_active: true, created_at: '2023-05-01', updated_at: '2023-05-01' },
      { user_id: 2, full_name: 'Jane Manager', phone: '0909876543', email: 'jane@admin.com', password: '********', image_url: '', address: 'Ho Chi Minh City, Vietnam', role_id: 2, branch_id: 2, description: 'Branch manager', is_active: true, created_at: '2023-05-05', updated_at: '2023-05-05' },
      { user_id: 3, full_name: 'Robert Staff', phone: '0908765432', email: 'robert@admin.com', password: '********', image_url: '', address: 'Da Nang, Vietnam', role_id: 3, branch_id: 3, description: 'Sales staff', is_active: false, created_at: '2023-05-10', updated_at: '2023-05-15' },
      { user_id: 4, full_name: 'Maria Garcia', phone: '0907654321', email: 'maria@admin.com', password: '********', image_url: '', address: 'Nha Trang, Vietnam', role_id: 4, branch_id: 2, description: 'Financial operations', is_active: true, created_at: '2023-05-12', updated_at: '2023-05-12' },
      { user_id: 5, full_name: 'David Lee', phone: '0906543210', email: 'david@admin.com', password: '********', image_url: '', address: 'Hue, Vietnam', role_id: 2, branch_id: 1, description: 'Operations manager', is_active: true, created_at: '2023-05-15', updated_at: '2023-05-20' },
      { user_id: 6, full_name: 'Sarah Johnson', phone: '0905432109', email: 'sarah@admin.com', password: '********', image_url: '', address: 'Hai Phong, Vietnam', role_id: 3, branch_id: 1, description: 'Customer service', is_active: true, created_at: '2023-05-18', updated_at: '2023-05-18' },
      { user_id: 7, full_name: 'Michael Wang', phone: '0904321098', email: 'michael@admin.com', password: '********', image_url: '', address: 'Can Tho, Vietnam', role_id: 3, branch_id: 2, description: 'Inventory manager', is_active: false, created_at: '2023-05-20', updated_at: '2023-05-25' },
      { user_id: 8, full_name: 'Linda Kim', phone: '0903210987', email: 'linda@admin.com', password: '********', image_url: '', address: 'Vung Tau, Vietnam', role_id: 4, branch_id: 3, description: 'Accounting specialist', is_active: true, created_at: '2023-05-22', updated_at: '2023-05-22' }
    ];
    setUsers(mockUsers);
    setFilteredUsers(mockUsers);
  }, []);

  // Handle search and filter functionality
  useEffect(() => {
    const delaySearch = setTimeout(() => {
      let results = [...users];

      // Apply status filter
      if (statusFilter !== 'all') {
        const isActive = statusFilter === 'active';
        results = results.filter(user => user.is_active === isActive);
      }

      // Apply search query
      if (searchQuery) {
        const lowercasedQuery = searchQuery.toLowerCase();
        results = results.filter(
          user =>
            user.user_id.toString().includes(lowercasedQuery) ||
            user.full_name.toLowerCase().includes(lowercasedQuery) ||
            user.phone.toLowerCase().includes(lowercasedQuery) ||
            (user.email && user.email.toLowerCase().includes(lowercasedQuery))
        );
      }

      setFilteredUsers(results);
      setPage(0);
    }, 300);

    return () => clearTimeout(delaySearch);
  }, [searchQuery, statusFilter, users]);

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
        role_id: user.role_id,
        branch_id: user.branch_id || '',
        description: user.description || '',
        is_active: user.is_active
      });
    } else {
      setCurrentUser(null);
      // Set default role to Staff (role_id: 3)
      setFormData({
        full_name: '',
        phone: '',
        email: '',
        password: '',
        image_url: '',
        address: '',
        role_id: 3, // Default to Staff role
        branch_id: '',
        description: '',
        is_active: true
      });
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
  const handleClearField = (fieldName) => {
    setFormData({...formData, [fieldName]: ''});
  };
  const handleSave = () => {
    if (currentUser) {
      // Update existing user
      const updatedUsers = users.map(user =>
        user.user_id === currentUser.user_id
          ? {
            ...user,
            ...formData,
            updated_at: new Date().toISOString().split('T')[0]
          }
          : user
      );
      setUsers(updatedUsers);
    } else {
      // Create new user
      const newUser = {
        user_id: Math.max(...users.map(u => u.user_id), 0) + 1,
        ...formData,
        created_at: new Date().toISOString().split('T')[0],
        updated_at: new Date().toISOString().split('T')[0]
      };
      setUsers([...users, newUser]);
    }
    setOpen(false);
  };

  const handleDelete = (id) => {
    setUsers(users.filter(user => user.user_id !== id));
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

  // Clear branch selection
  const handleClearBranch = (e) => {
    e.stopPropagation();
    setFormData({...formData, branch_id: ''});
  };

  // Get current page users
  const currentUsers = filteredUsers.slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage);

  // Helper function to get role name by id
  const getRoleName = (roleId) => {
    const role = roles.find(r => r.role_id === roleId);
    return role ? role.name : 'Unknown Role';
  };

  // Helper function to get branch name by id
  const getBranchName = (branchId) => {
    const branch = branches.find(b => b.branch_id === branchId);
    return branch ? branch.name : 'Unknown Branch';
  };

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
            Add Admin
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
                    <TableCell width="15%" sx={{ backgroundColor: '#f8f8f8' }}>Full Name</TableCell>
                    <TableCell width="10%" sx={{ backgroundColor: '#f8f8f8' }}>Phone</TableCell>
                    <TableCell width="15%" sx={{ backgroundColor: '#f8f8f8' }}>Email</TableCell>
                    <TableCell width="12%" sx={{ backgroundColor: '#f8f8f8' }}>Role</TableCell>
                    <TableCell width="13%" sx={{ backgroundColor: '#f8f8f8' }}>Branch</TableCell>
                    <TableCell width="10%" sx={{ backgroundColor: '#f8f8f8' }}>Status</TableCell>
                    <TableCell width="10%" sx={{ backgroundColor: '#f8f8f8' }}>Created</TableCell>
                    <TableCell width="10%" align="right" sx={{ backgroundColor: '#f8f8f8' }}>Actions</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {currentUsers.length > 0 ? (
                    currentUsers.map((user, index) => (
                      <TableRow key={user.user_id} hover>
                        <TableCell>{page * rowsPerPage + index + 1}</TableCell>
                        <TableCell>{user.full_name}</TableCell>
                        <TableCell>{user.phone}</TableCell>
                        <TableCell>{user.email}</TableCell>
                        <TableCell>
                          <Chip
                            label={getRoleName(user.role_id)}
                            size="small"
                            color="primary"
                            variant="outlined"
                            sx={{ borderRadius: '16px' }}
                          />
                        </TableCell>
                        <TableCell>{user.branch_id ? getBranchName(user.branch_id) : '-'}</TableCell>
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
                        <TableCell>{user.created_at}</TableCell>
                        <TableCell align="right">
                          <IconButton onClick={() => handleOpen(user)} color="primary" size="small">
                            <EditOutlined />
                          </IconButton>
                          <IconButton onClick={() => handleDelete(user.user_id)} color="error" size="small">
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
          <FormControl fullWidth margin="dense">
            <InputLabel>Role</InputLabel>
            <Select
              name="role_id"
              value={formData.role_id}
              label="Role"
              onChange={handleChange}
              endAdornment={
                <InputAdornment position="end" sx={{ mr: 2 }}>
                  <IconButton
                    size="small"
                    onClick={(e) => {
                      e.stopPropagation();
                      setFormData({...formData, role_id: 3}); // Reset to default Staff role
                    }}
                  >
                    <CloseOutlined style={{ fontSize: 16 }} />
                  </IconButton>
                </InputAdornment>
              }
            >
              {roles.map(role => (
                <MenuItem key={role.role_id} value={role.role_id}>
                  {role.name}
                </MenuItem>
              ))}
            </Select>
          </FormControl>
          <FormControl fullWidth margin="dense">
            <InputLabel>Branch</InputLabel>
            <Select
              name="branch_id"
              value={formData.branch_id}
              label="Branch"
              onChange={handleChange}
              displayEmpty
              renderValue={(selected) => {
                if (!selected) {
                  return "No branch selected";
                }
                return getBranchName(selected);
              }}
              endAdornment={
                formData.branch_id ? (
                  <InputAdornment position="end" sx={{ mr: 2 }}>
                    <IconButton
                      size="small"
                      onClick={handleClearBranch}
                    >
                      <CloseOutlined style={{ fontSize: 16 }} />
                    </IconButton>
                  </InputAdornment>
                ) : null
              }
            >
              <MenuItem value="">
                No branch selected
              </MenuItem>
              {branches.map(branch => (
                <MenuItem key={branch.branch_id} value={branch.branch_id}>
                  {branch.name}
                </MenuItem>
              ))}
            </Select>
          </FormControl>
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
          <TextField
            margin="dense"
            name="description"
            label="Description"
            type="text"
            fullWidth
            multiline
            rows={2}
            value={formData.description}
            onChange={handleChange}
            InputProps={{
              endAdornment: formData.description ? (
                <InputAdornment position="end">
                  <IconButton
                    size="small"
                    onClick={() => handleClearField('description')}
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

export default AdminAccount;