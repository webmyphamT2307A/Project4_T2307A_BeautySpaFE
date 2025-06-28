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
  Tooltip,
  CircularProgress
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
  const [loading, setLoading] = useState(false);
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
    setLoading(true);
    fetch(API_URL)
      .then(res => res.json())
      .then(data => {
        if (data.status === 'SUCCESS' && Array.isArray(data.data)) {
          setRoles(data.data);
        } else {
          setRoles([]);
        }
      })
      .catch(() => setRoles([]))
      .finally(() => setLoading(false));
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
    <MainCard title="Quản Lý Vai Trò" secondary={
      <Button
        variant="contained"
        startIcon={<PlusOutlined />}
        onClick={() => handleOpen()}
      >
        Thêm Vai Trò
      </Button>
    }>
      <Box sx={{ mb: 3 }}>
        <TextField
          fullWidth
          size="small"
          placeholder="Tìm kiếm vai trò theo tên..."
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
          maxHeight: '800px',
          overflow: 'auto'
        }}
      >
        <Table sx={{ minWidth: 650 }} stickyHeader>
          <TableHead>
            <TableRow>
              <TableCell>#</TableCell>
              <TableCell>Tên Vai Trò</TableCell>
              <TableCell align="center">Thao Tác</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {loading ? (
              <TableRow>
                <TableCell colSpan={3} align="center" sx={{ py: 3 }}>
                  <CircularProgress />
                  <Typography sx={{ mt: 1 }}>Đang tải dữ liệu vai trò...</Typography>
                </TableCell>
              </TableRow>
            ) : filteredRoles.length > 0 ? (
              filteredRoles
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
                ))
            ) : (
              <TableRow>
                <TableCell colSpan={3} align="center">
                  Không tìm thấy vai trò nào.
                </TableCell>
              </TableRow>
            )}
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
          {currentRole ? 'Chỉnh Sửa Vai Trò' : 'Thêm Vai Trò'}
        </DialogTitle>
        <DialogContent>
          <TextField
            margin="dense"
            name="name"
            label="Tên Vai Trò"
            type="text"
            fullWidth
            value={formData.name}
            onChange={handleChange}
            required
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={handleClose} variant="outlined" color="inherit">Hủy</Button>
          <Button onClick={handleSave} variant="contained" color="primary">Lưu</Button>
        </DialogActions>
      </Dialog>
    </MainCard>
  );
};

export default RoleManager;