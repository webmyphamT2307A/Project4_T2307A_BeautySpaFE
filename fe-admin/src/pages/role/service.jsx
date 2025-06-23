import { useState, useEffect } from 'react';
import {
  Button,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TablePagination,
  TextField,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  IconButton,
  InputAdornment,
  Box,
  Typography,
  Tooltip
} from '@mui/material';
import MainCard from 'components/MainCard';
import {
  PlusOutlined,
  EditOutlined,
  DeleteOutlined,
  SearchOutlined,
  CloseOutlined
} from '@ant-design/icons';
import { toast } from 'react-toastify';

const API_URL = 'http://localhost:8080/api/v1/roles';

const RoleManager = () => {
  // States
  const [roles, setRoles] = useState([]);
  const [open, setOpen] = useState(false);
  const [currentRole, setCurrentRole] = useState(null);
  const [formData, setFormData] = useState({
    name: ''
  });
  const [searchQuery, setSearchQuery] = useState('');
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);

  // Load roles from backend
  useEffect(() => {
    fetch(API_URL)
      .then(res => res.json())
      .then(data => {
        if (data.status === 'SUCCESS' && Array.isArray(data.data)) {
          setRoles(data.data);
        } else {
          setRoles([]);
        }
      })
      .catch(() => setRoles([]));
  }, []);

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
    setPage(0);
  };

  const handleOpen = (role = null) => {
    if (role) {
      setCurrentRole(role);
      setFormData({ name: role.name });
    } else {
      setCurrentRole(null);
      setFormData({ name: '' });
    }
    setOpen(true);
  };

  const handleClose = () => {
    setOpen(false);
  };

  const handleChange = (event) => {
    const { name, value } = event.target;
    setFormData({ ...formData, [name]: value });
  };

  const handleSave = () => {
    if (currentRole) {
      // Edit role
      fetch(`${API_URL}/update?roleId=${currentRole.id}&newRoleName=${formData.name}`, {
        method: 'PUT'
      })
        .then(res => res.json())
        .then(data => {
          if (data.status === 'SUCCESS') {
            setRoles(roles.map(role =>
              role.id === currentRole.id ? { ...role, name: formData.name } : role
            ));
            toast.success('Role updated successfully');
          } else {
            toast.error('Failed to update role');
          }
          setOpen(false);
        })
        .catch(() => {
          toast.error('Error updating role');
          setOpen(false);
        });
    } else {
      // Add new role
      fetch(`${API_URL}/create?roleName=${formData.name}`, {
        method: 'GET'
      })
        .then(res => res.json())
        .then(data => {
          if (data.status === 'SUCCESS') {
            toast.success('Role created successfully');
            // Reload roles
            fetch(API_URL)
              .then(res => res.json())
              .then(data => {
                if (data.status === 'SUCCESS') {
                  setRoles(data.data);
                }
              });
          } else {
            toast.error('Failed to create role');
          }
          setOpen(false);
        })
        .catch(() => {
          toast.error('Error creating role');
          setOpen(false);
        });
    }
  };

  const handleDelete = (roleId) => {
    if (confirm('Bạn có chắc chắn muốn xóa vai trò này?')) {
      fetch(`${API_URL}/delete?roleId=${roleId}`, {
        method: 'PUT'
      })
        .then(res => res.json())
        .then(data => {
          if (data.status === 'SUCCESS') {
            setRoles(roles.filter(role => role.id !== roleId));
            toast.success('Role deleted successfully');
          } else {
            toast.error('Failed to delete role');
          }
        })
        .catch(() => toast.error('Error deleting role'));
    }
  };

  // Filter roles based on search query
  const filteredRoles = roles.filter(role =>
    role.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <MainCard title="Role Management" secondary={
      <Button
        variant="contained"
        startIcon={<PlusOutlined />}
        onClick={() => handleOpen()}
      >
        Add Role
      </Button>
    }>
      <Box sx={{ mb: 3 }}>
        <TextField
          fullWidth
          size="small"
          placeholder="Search roles by name..."
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
                <IconButton
                  size="small"
                  onClick={() => setSearchQuery('')}
                >
                  <CloseOutlined style={{ fontSize: 16 }} />
                </IconButton>
              </InputAdornment>
            ) : null
          }}
          sx={{ maxWidth: '50%' }}
        />
      </Box>

      <TableContainer
        component={Paper}
        sx={{
          boxShadow: 'none',
          borderRadius: '10px',
          height: '400px',
          overflow: 'auto'
        }}
      >
        <Table sx={{ minWidth: 650 }} stickyHeader>
          <TableHead>
            <TableRow>
              <TableCell>#</TableCell>
              <TableCell>Role Name</TableCell>
              <TableCell align="center">Actions</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {filteredRoles
              .slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage)
              .map((role, index) => (
                <TableRow key={role.id}>
                  <TableCell>{page * rowsPerPage + index + 1}</TableCell>
                  <TableCell>{role.name}</TableCell>
                  <TableCell align="center">
                    <Tooltip title="Edit">
                      <IconButton size="small" color="primary" onClick={() => handleOpen(role)}>
                        <EditOutlined />
                      </IconButton>
                    </Tooltip>
                    <Tooltip title="Delete">
                      <IconButton size="small" color="error" onClick={() => handleDelete(role.id)}>
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
        count={filteredRoles.length}
        rowsPerPage={rowsPerPage}
        page={page}
        onPageChange={handleChangePage}
        onRowsPerPageChange={handleChangeRowsPerPage}
      />

      {/* Add/Edit Role Dialog */}
      <Dialog open={open} onClose={handleClose} maxWidth="sm" fullWidth>
        <DialogTitle>
          {currentRole ? 'Edit Role' : 'Add Role'}
        </DialogTitle>
        <DialogContent>
          <TextField
            margin="dense"
            name="name"
            label="Role Name"
            type="text"
            fullWidth
            value={formData.name}
            onChange={handleChange}
            required
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={handleClose} variant="outlined" color="inherit">Cancel</Button>
          <Button onClick={handleSave} variant="contained" color="primary">Save</Button>
        </DialogActions>
      </Dialog>
    </MainCard>
  );
};

export default RoleManager;