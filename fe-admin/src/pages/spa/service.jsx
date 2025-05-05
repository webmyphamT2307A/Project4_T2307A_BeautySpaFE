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

  // Fake data generator
  useEffect(() => {
    const serviceNames = [
      'Haircut', 'Hair Styling', 'Hair Coloring', 'Hair Treatment',
      'Manicure', 'Pedicure', 'Facial', 'Body Massage',
      'Hot Stone Therapy', 'Aromatherapy', 'Deep Cleansing',
      'Anti-Aging Treatment', 'Hair Removal', 'Makeup Application',
      'Bridal Package', 'Men\'s Grooming', 'Kids Haircut',
      'Hair Extension', 'Scalp Treatment', 'Nail Art'
    ];

    const descriptions = [
      'Professional styling for all hair types',
      'Customized treatment for your specific needs',
      'Relaxing experience with premium products',
      'Quick service with expert technicians',
      'Luxury treatment for special occasions',
      'Therapeutic session for stress relief',
      'Deep cleansing with organic products',
      'Perfect finishing touch for any occasion'
    ];

    const imageUrls = [
      'https://images.unsplash.com/photo-1560066984-138dadb4c035',
      'https://images.unsplash.com/photo-1580618672591-eb180b1a973f',
      'https://images.unsplash.com/photo-1522337660859-02fbefca4702',
      'https://images.unsplash.com/photo-1595475207225-428b62bda831',
      'https://images.unsplash.com/photo-1562322140-8baeececf3df',
      'https://images.unsplash.com/photo-1508184964240-ee96bb9677a7',
      'https://images.unsplash.com/photo-1580087336611-29b3b33dad18',
      'https://images.unsplash.com/photo-1607008829749-c8051e687f40'
    ];

    const fakeServices = Array(20).fill().map((_, idx) => ({
      service_id: idx + 1,
      name: serviceNames[idx % serviceNames.length],
      description: descriptions[idx % descriptions.length],
      price: Math.floor(Math.random() * 200) + 20,
      duration: (Math.floor(Math.random() * 6) + 1) * 15,
      created_at: new Date(Date.now() - Math.random() * 10000000000).toISOString(),
      is_active: Math.random() > 0.2,
      image_url: imageUrls[idx % imageUrls.length]
    }));

    // Sort by newest first (based on created_at)
    const sortedServices = fakeServices.sort((a, b) =>
      new Date(b.created_at) - new Date(a.created_at)
    );

    setServices(sortedServices);
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
        price: service.price.toString(),
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

  const handleImageChange = (event) => {
    const file = event.target.files[0];
    if (file) {
      // In a real app, you'd upload to server/cloud storage
      // For this demo, we'll use a local URL
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

  const handleClearField = (fieldName) => {
    if (fieldName === 'image_url') {
      setImagePreview(null);
    }
    setFormData({...formData, [fieldName]: ''});
  };

  const handleSave = () => {
    if (currentService) {
      // Edit
      setServices(services.map(service =>
        service.service_id === currentService.service_id ?
          { ...service, ...formData, price: parseFloat(formData.price), duration: parseInt(formData.duration, 10) } :
          service
      ));
    } else {
      // Add
      const newService = {
        service_id: services.length > 0 ? Math.max(...services.map(s => s.service_id)) + 1 : 1,
        ...formData,
        price: parseFloat(formData.price),
        duration: parseInt(formData.duration, 10),
        created_at: new Date().toISOString()
      };
      // Add new service and sort by newest first
      const updatedServices = [...services, newService].sort((a, b) =>
        new Date(b.created_at) - new Date(a.created_at)
      );
      setServices(updatedServices);
    }
    setOpen(false);
  };

  const handleDelete = (serviceId) => {
    if (window.confirm('Are you sure you want to delete this service?')) {
      setServices(services.filter(service => service.service_id !== serviceId));
    }
  };

  const handleStatusChange = (serviceId, newStatus) => {
    setServices(services.map(service =>
      service.service_id === serviceId ? {...service, is_active: newStatus} : service
    ));
  };

  // Filter services based on search query
  const filteredServices = services.filter(service =>
    service.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    service.description.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <MainCard title="Service Management" secondary={
      <Button
        variant="contained"
        startIcon={<PlusOutlined />}
        onClick={() => handleOpen()}
      >
        Add Service
      </Button>
    }>
      <Box sx={{ mb: 3 }}>
        <TextField
          fullWidth
          size="small"
          placeholder="Search services by name or description..."
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
          height: '400px', // Fixed height for table container
          overflow: 'auto'  // Enable scrolling
        }}
      >
        <Table sx={{ minWidth: 650 }} stickyHeader>
          <TableHead>
            <TableRow sx={{ backgroundColor: '#f8f9fa' }}>
              <TableCell sx={{ fontWeight: 600 }}>STT</TableCell>
              <TableCell sx={{ fontWeight: 600 }}>Image</TableCell>
              <TableCell sx={{ fontWeight: 600 }}>Name</TableCell>
              <TableCell sx={{ fontWeight: 600 }}>Price</TableCell>
              <TableCell sx={{ fontWeight: 600 }}>Duration</TableCell>
              <TableCell sx={{ fontWeight: 600 }}>Status</TableCell>
              <TableCell sx={{ fontWeight: 600 }}>Created</TableCell>
              <TableCell align="center" sx={{ fontWeight: 600 }}>Actions</TableCell>
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
                      ${service.price.toFixed(2)}
                    </Typography>
                  </TableCell>
                  <TableCell>{service.duration} min</TableCell>
                  <TableCell>
                    <Chip
                      label={service.is_active ? 'Active' : 'Inactive'}
                      size="small"
                      color={service.is_active ? 'success' : 'default'}
                      icon={service.is_active ? <CheckCircleOutlined /> : <CloseCircleOutlined />}
                      onClick={() => handleStatusChange(service.service_id, !service.is_active)}
                      sx={{ cursor: 'pointer' }}
                    />
                  </TableCell>
                  <TableCell>
                    {new Date(service.created_at).toLocaleDateString()}
                  </TableCell>
                  <TableCell align="center">
                    <Tooltip title="View Details">
                      <IconButton size="small" color="info" onClick={() => handleViewOpen(service)}>
                        <EyeOutlined />
                      </IconButton>
                    </Tooltip>
                    <Tooltip title="Edit">
                      <IconButton size="small" color="primary" onClick={() => handleOpen(service)}>
                        <EditOutlined />
                      </IconButton>
                    </Tooltip>
                    <Tooltip title="Delete">
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
          {currentService ? 'Edit Service' : 'Add Service'}
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
              {imagePreview ? 'Change Image' : 'Upload Image'}
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
                Remove Image
              </Button>
            )}
          </Box>
          <TextField
            margin="dense"
            name="name"
            label="Service Name"
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
            label="Description"
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
              label="Price ($)"
              type="number"
              fullWidth
              value={formData.price}
              onChange={handleChange}
              InputProps={{
                endAdornment: formData.price ? (
                  <InputAdornment position="end">
                    <IconButton
                      size="small"
                      onClick={() => handleClearField('price')}
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
              name="duration"
              label="Duration (minutes)"
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
            label="Service Active"
            sx={{ mt: 1 }}
          />
        </DialogContent>
        <DialogActions sx={{ p: 2, borderTop: '1px solid #e0e0e0' }}>
          <Button onClick={handleClose} variant="outlined" color="inherit">Cancel</Button>
          <Button onClick={handleSave} variant="contained" color="primary">Save</Button>
        </DialogActions>
      </Dialog>

      {/* View Service Dialog */}
      <Dialog open={viewOpen} onClose={handleViewClose} maxWidth="sm" fullWidth>
        <DialogTitle sx={{ borderBottom: '1px solid #e0e0e0', pb: 2 }}>
          Service Details
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
                <Typography variant="overline" color="textSecondary">Service Name</Typography>
                <Typography variant="h6">{currentService.name}</Typography>
              </Box>

              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
                <Typography variant="overline" color="textSecondary">Description</Typography>
                <Typography variant="body2">{currentService.description}</Typography>
              </Box>

              <Box sx={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 3 }}>
                <Box>
                  <Typography variant="overline" color="textSecondary">Price</Typography>
                  <Typography variant="h6" color="primary">${currentService.price.toFixed(2)}</Typography>
                </Box>
                <Box>
                  <Typography variant="overline" color="textSecondary">Duration</Typography>
                  <Typography variant="h6">{currentService.duration} minutes</Typography>
                </Box>
              </Box>

              <Box sx={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 3 }}>
                <Box>
                  <Typography variant="overline" color="textSecondary">Status</Typography>
                  <Box sx={{ mt: 0.5 }}>
                    <Chip
                      label={currentService.is_active ? 'Active' : 'Inactive'}
                      size="small"
                      color={currentService.is_active ? 'success' : 'default'}
                      icon={currentService.is_active ? <CheckCircleOutlined /> : <CloseCircleOutlined />}
                    />
                  </Box>
                </Box>
                <Box>
                  <Typography variant="overline" color="textSecondary">Created</Typography>
                  <Typography variant="body2">
                    {new Date(currentService.created_at).toLocaleDateString()}
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

export default ServiceManagement;