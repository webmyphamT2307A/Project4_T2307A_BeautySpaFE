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
  Switch,
  FormControlLabel,
  Box,
  Avatar,
  Chip,
  Typography,
  Tooltip
} from '@mui/material';
import MainCard from 'components/MainCard';
import {
  PlusOutlined,
  EditOutlined,
  DeleteOutlined,
  SearchOutlined,
  CloseOutlined,
  UploadOutlined,
  CheckCircleOutlined,
  CloseCircleOutlined,
  EyeOutlined
} from '@ant-design/icons';
import { toast } from 'react-toastify';

const API_URL = 'http://localhost:8080/api/v1/services';

// Hàm tiện ích để định dạng tiền tệ
const formatCurrency = (value) => {
  if (!value) return '';
  return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(value);
};

const ServiceManagement = () => {
  // States
  const [services, setServices] = useState([]);
  const [open, setOpen] = useState(false);
  const [viewOpen, setViewOpen] = useState(false);
  const [currentService, setCurrentService] = useState(null);
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    price: '',
    duration: '',
    is_active: true,
    image_url: ''
  });
  const [searchQuery, setSearchQuery] = useState('');
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [imagePreview, setImagePreview] = useState(null);

  // Load real data from BE
  useEffect(() => {
    fetch(API_URL)
      .then(res => res.json())
      .then(data => {
        if (data.status === 'SUCCESS' && Array.isArray(data.data)) {
          const services = data.data.map(item => ({
            service_id: item.id,
            name: item.name,
            description: item.description,
            price: item.price,
            duration: item.duration,
            created_at: item.createdAt,
            is_active: item.isActive,
            image_url: item.imageUrl
          }));
          setServices(services);
        } else {
          setServices([]);
        }
      })
      .catch(() => setServices([]));
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

  const handleOpen = (service = null) => {
    if (service) {
      setCurrentService(service);
      setFormData({
        name: service.name,
        description: service.description,
        price: service.price.toString().replace(/[^0-9]/g, ''), // Chỉ giữ lại số
        duration: service.duration.toString(),
        is_active: service.is_active,
        image_url: service.image_url
      });
      setImagePreview(service.image_url);
    } else {
      setCurrentService(null);
      setFormData({
        name: '',
        description: '',
        price: '',
        duration: '',
        is_active: true,
        image_url: ''
      });
      setImagePreview(null);
    }
    setOpen(true);
  };

  const handleViewOpen = (service) => {
    setCurrentService(service);
    setViewOpen(true);
  };

  const handleViewClose = () => {
    setViewOpen(false);
  };

  const handleClose = () => {
    setOpen(false);
  };

  const handleChange = (event) => {
    const { name, value, checked } = event.target;
    setFormData({
      ...formData,
      [name]: name === 'is_active' ? checked : value
    });
  };

  const handleImageChange = async (event) => {
    const file = event.target.files[0];
    if (file) {
      const formDataUpload = new FormData();
      formDataUpload.append('file', file);

      try {
        const res = await fetch('http://localhost:8080/api/v1/upload', {
          method: 'POST',
          body: formDataUpload
        });
        const data = await res.json();
        if (res.ok && data.url) {
          setFormData({
            ...formData,
            image_url: data.url
          });
          setImagePreview(data.url);
          toast.success('Upload ảnh thành công!');
        } else {
          toast.error('Upload ảnh thất bại!');
        }
      } catch (err) {
        toast.error('Lỗi khi upload ảnh!');
      }
    }
  };

  const handleClearField = (fieldName) => {
    if (fieldName === 'image_url') {
      setImagePreview(null);
    }
    setFormData({ ...formData, [fieldName]: '' });
  };

  // Save (edit) service
  const handleSave = () => {
    // Loại bỏ các ký tự không phải số trước khi gửi
    const priceAsNumber = parseFloat(formData.price.replace(/[^0-9]/g, ''));

    if (currentService) {
      // Edit
      fetch(`${API_URL}/${currentService.service_id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: formData.name,
          description: formData.description,
          price: priceAsNumber,
          duration: parseInt(formData.duration, 10),
          imageUrl: formData.image_url
        })
      })
        .then(res => res.json())
        .then(data => {
          if (data.status === 'SUCCESS') {
            setServices(services.map(service =>
              service.service_id === currentService.service_id
                ? {
                  ...service,
                  ...formData,
                  price: priceAsNumber,
                  duration: parseInt(formData.duration, 10),
                  image_url: formData.image_url
                }
                : service
            ));
            toast.success('Cập nhật dịch vụ thành công');
          } else {
            toast.error('Cập nhật thất bại');
          }
          setOpen(false);
        })
        .catch(() => {
          toast.error('Lỗi khi cập nhật dịch vụ');
          setOpen(false);
        });
    } else {
      // Add mới: Gọi API POST
      fetch(API_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: formData.name,
          description: formData.description,
          price: priceAsNumber,
          duration: parseInt(formData.duration, 10),
          imageUrl: formData.image_url
        })
      })
        .then(res => res.json())
        .then(data => {
          if (data.status === 'SUCCESS') {
            // Thêm vào danh sách FE luôn
            const newService = {
              service_id: data.data.id,
              name: data.data.name,
              description: data.data.description,
              price: data.data.price,
              duration: data.data.duration,
              is_active: data.data.isActive,
              image_url: data.data.imageUrl,
              created_at: data.data.createdAt
            };
            setServices([newService, ...services]);
            toast.success('Thêm dịch vụ thành công');
          } else {
            toast.error('Thêm dịch vụ thất bại');
          }
          setOpen(false);
        })
        .catch(() => {
          toast.error('Lỗi khi thêm dịch vụ');
          setOpen(false);
        });
    }
  };

  // Xóa mềm dịch vụ
  const handleDelete = (serviceId) => {
    if (confirm('Bạn có chắc chắn muốn xóa dịch vụ này?')) {
      fetch(`${API_URL}/delete/${serviceId}`, {
        method: 'PUT'
      })
        .then(res => res.json())
        .then(data => {
          if (data.status === 'SUCCESS') {
            setServices(services.filter(service => service.service_id !== serviceId));
            toast.success('Xóa dịch vụ thành công');
          } else {
            toast.error('Xóa thất bại');
          }
        })
        .catch(() => toast.error('Lỗi khi xóa dịch vụ'));
    }
  };

  // Đổi trạng thái (active/inactive)
  const handleStatusChange = (serviceId, newStatus) => {
    const service = services.find(s => s.service_id === serviceId);
    if (!service) return;
    fetch(`${API_URL}/${serviceId}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        ...service,
        isActive: newStatus,
        imageUrl: service.image_url
      })
    })
      .then(res => res.json())
      .then(data => {
        if (data.status === 'SUCCESS') {
          setServices(services.map(s =>
            s.service_id === serviceId ? { ...s, is_active: newStatus } : s
          ));
          toast.success('Cập nhật trạng thái thành công');
        } else {
          toast.error('Cập nhật trạng thái thất bại');
        }
      })
      .catch(() => toast.error('Lỗi khi cập nhật trạng thái'));
  };

  // Filter services based on search query
  const filteredServices = services.filter(service =>
    service.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    service.description.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <MainCard title="Quản Lý Dịch Vụ" secondary={
      <Button
        variant="contained"
        startIcon={<PlusOutlined />}
        onClick={() => handleOpen()}
      >
        Thêm Dịch Vụ
      </Button>
    }>
      <Box sx={{ mb: 3 }}>
        <TextField
          fullWidth
          size="small"
          placeholder="Tìm kiếm dịch vụ theo tên hoặc mô tả..."
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
            <TableRow sx={{ backgroundColor: '#f8f9fa' }}>
              <TableCell sx={{ fontWeight: 600 }}>STT</TableCell>
              <TableCell sx={{ fontWeight: 600 }}>Hình Ảnh</TableCell>
              <TableCell sx={{ fontWeight: 600 }}>Tên</TableCell>
              <TableCell sx={{ fontWeight: 600 }}>Giá</TableCell>
              <TableCell sx={{ fontWeight: 600 }}>Thời Gian</TableCell>
              <TableCell sx={{ fontWeight: 600 }}>Trạng Thái</TableCell>
              <TableCell sx={{ fontWeight: 600 }}>Ngày Tạo</TableCell>
              <TableCell align="center" sx={{ fontWeight: 600 }}>Thao Tác</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {filteredServices
              .slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage)
              .map((service, index) => (
                <TableRow
                  key={service.service_id}
                  hover
                >
                  <TableCell>{page * rowsPerPage + index + 1}</TableCell>
                  <TableCell>
                    <Avatar
                      src={service.image_url}
                      alt={service.name}
                      variant="rounded"
                      sx={{ width: 60, height: 60 }}
                    />
                  </TableCell>
                  <TableCell>
                    <Typography variant="subtitle2" sx={{ fontWeight: 500 }}>
                      {service.name}
                    </Typography>
                    <Typography variant="caption" color="textSecondary">
                      {service.description.length > 50
                        ? service.description.substring(0, 50) + '...'
                        : service.description}
                    </Typography>
                  </TableCell>
                  <TableCell>
                    <Typography variant="body2" color="primary" sx={{ fontWeight: 600 }}>
                      {formatCurrency(service.price)}
                    </Typography>
                  </TableCell>
                  <TableCell>{service.duration} phút</TableCell>
                  <TableCell>
                    <Chip
                      label={service.is_active ? 'Hoạt Động' : 'Không Hoạt Động'}
                      size="small"
                      color={service.is_active ? 'success' : 'default'}
                      icon={service.is_active ? <CheckCircleOutlined /> : <CloseCircleOutlined />}
                      onClick={() => handleStatusChange(service.service_id, !service.is_active)}
                      sx={{ cursor: 'pointer' }}
                    />
                  </TableCell>
                  <TableCell>
                    {service.created_at ? new Date(service.created_at).toLocaleDateString() : ''}
                  </TableCell>
                  <TableCell align="center">
                    <Tooltip title="Xem Chi Tiết">
                      <IconButton size="small" color="info" onClick={() => handleViewOpen(service)}>
                        <EyeOutlined />
                      </IconButton>
                    </Tooltip>
                    <Tooltip title="Chỉnh Sửa">
                      <IconButton size="small" color="primary" onClick={() => handleOpen(service)}>
                        <EditOutlined />
                      </IconButton>
                    </Tooltip>
                    <Tooltip title="Xóa">
                      <IconButton size="small" color="error" onClick={() => handleDelete(service.service_id)}>
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
        count={filteredServices.length}
        rowsPerPage={rowsPerPage}
        page={page}
        onPageChange={handleChangePage}
        onRowsPerPageChange={handleChangeRowsPerPage}
        sx={{ borderTop: '1px solid #e0e0e0' }}
      />

      {/* Add/Edit Service Dialog */}
      <Dialog open={open} onClose={handleClose} maxWidth="sm" fullWidth>
        <DialogTitle sx={{ borderBottom: '1px solid #e0e0e0', pb: 2 }}>
          {currentService ? 'Chỉnh Sửa Dịch Vụ' : 'Thêm Dịch Vụ'}
        </DialogTitle>
        <DialogContent sx={{ pt: 2 }}>
          <Box sx={{ mt: 2, mb: 3, display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
            {imagePreview && (
              <Box sx={{ mb: 2 }}>
                <Avatar
                  src={imagePreview}
                  alt="Service preview"
                  variant="rounded"
                  sx={{ width: 150, height: 150 }}
                />
              </Box>
            )}
            <Button
              variant="outlined"
              component="label"
              startIcon={<UploadOutlined />}
              sx={{ borderRadius: '4px' }}
            >
              {imagePreview ? 'Thay Đổi Hình Ảnh' : 'Tải Hình Ảnh'}
              <input
                type="file"
                hidden
                accept="image/*"
                onChange={handleImageChange}
              />
            </Button>
            {formData.image_url && (
              <Button
                color="error"
                size="small"
                onClick={() => handleClearField('image_url')}
                sx={{ mt: 1 }}
              >
                Xóa Hình Ảnh
              </Button>
            )}
          </Box>
          <TextField
            margin="dense"
            name="name"
            label="Tên Dịch Vụ"
            type="text"
            fullWidth
            value={formData.name}
            onChange={handleChange}
            InputProps={{
              endAdornment: formData.name ? (
                <InputAdornment position="end">
                  <IconButton
                    size="small"
                    onClick={() => handleClearField('name')}
                  >
                    <CloseOutlined style={{ fontSize: 16 }} />
                  </IconButton>
                </InputAdornment>
              ) : null
            }}
            required
          />
          <TextField
            margin="dense"
            name="description"
            label="Mô Tả"
            type="text"
            fullWidth
            multiline
            rows={3}
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
          <Box sx={{ display: 'flex', gap: 2, mt: 2 }}>
            <TextField
              margin="dense"
              name="price"
              label="Giá (VND)"
              type="text"
              fullWidth
              value={new Intl.NumberFormat('vi-VN').format(formData.price.replace(/[^0-9]/g, ''))}
              onChange={(e) => {
                const val = e.target.value.replace(/[^0-9]/g, '');
                setFormData({ ...formData, price: val });
              }}
            />
            <TextField
              margin="dense"
              name="duration"
              label="Thời Gian (phút)"
              type="number"
              fullWidth
              value={formData.duration}
              onChange={handleChange}
              InputProps={{
                endAdornment: formData.duration ? (
                  <InputAdornment position="end">
                    <IconButton
                      size="small"
                      onClick={() => handleClearField('duration')}
                    >
                      <CloseOutlined style={{ fontSize: 16 }} />
                    </IconButton>
                  </InputAdornment>
                ) : null
              }}
              required
            />
          </Box>
          <FormControlLabel
            control={
              <Switch
                checked={formData.is_active}
                onChange={handleChange}
                name="is_active"
                color="primary"
              />
            }
            label="Dịch Vụ Hoạt Động"
            sx={{ mt: 1 }}
          />
        </DialogContent>
        <DialogActions sx={{ p: 2, borderTop: '1px solid #e0e0e0' }}>
          <Button onClick={handleClose} variant="outlined" color="inherit">Hủy</Button>
          <Button onClick={handleSave} variant="contained" color="primary">Lưu</Button>
        </DialogActions>
      </Dialog>

      {/* View Service Dialog */}
      <Dialog open={viewOpen} onClose={handleViewClose} maxWidth="sm" fullWidth>
        <DialogTitle sx={{ borderBottom: '1px solid #e0e0e0', pb: 2 }}>
          Chi Tiết Dịch Vụ
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
          {currentService && (
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
              <Box sx={{ display: 'flex', justifyContent: 'center', mb: 2 }}>
                <Avatar
                  src={currentService.image_url}
                  alt={currentService.name}
                  variant="rounded"
                  sx={{ width: 200, height: 200 }}
                />
              </Box>

              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
                <Typography variant="overline" color="textSecondary">Tên Dịch Vụ</Typography>
                <Typography variant="h6">{currentService.name}</Typography>
              </Box>

              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
                <Typography variant="overline" color="textSecondary">Mô Tả</Typography>
                <Typography variant="body2">{currentService.description}</Typography>
              </Box>

              <Box sx={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 3 }}>
                <Box>
                  <Typography variant="overline" color="textSecondary">Giá</Typography>
                  <Typography variant="h6" color="primary">{formatCurrency(currentService.price)}</Typography>
                </Box>
                <Box>
                  <Typography variant="overline" color="textSecondary">Thời Gian</Typography>
                  <Typography variant="h6">{currentService.duration} phút</Typography>
                </Box>
              </Box>

              <Box sx={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 3 }}>
                <Box>
                  <Typography variant="overline" color="textSecondary">Trạng Thái</Typography>
                  <Box sx={{ mt: 0.5 }}>
                    <Chip
                      label={currentService.is_active ? 'Hoạt Động' : 'Không Hoạt Động'}
                      size="small"
                      color={currentService.is_active ? 'success' : 'default'}
                      icon={currentService.is_active ? <CheckCircleOutlined /> : <CloseCircleOutlined />}
                    />
                  </Box>
                </Box>
                <Box>
                  <Typography variant="overline" color="textSecondary">Ngày Tạo</Typography>
                  <Typography variant="body2">
                    {currentService.created_at ? new Date(currentService.created_at).toLocaleDateString() : ''}
                  </Typography>
                </Box>
              </Box>
            </Box>
          )}
        </DialogContent>
        <DialogActions sx={{ p: 2, borderTop: '1px solid #e0e0e0' }}>
          <Button onClick={() => {
            handleViewClose();
            handleOpen(currentService);
          }} startIcon={<EditOutlined />} color="primary">
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

export default ServiceManagement;