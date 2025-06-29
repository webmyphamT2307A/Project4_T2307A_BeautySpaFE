import { useState, useEffect, useRef } from 'react';
import {
  Grid, Button, TextField, Paper, Box, Typography, Avatar, CircularProgress,
  Card, CardContent, Divider, InputAdornment, IconButton, Dialog, DialogTitle,
  DialogContent, DialogActions, FormControl, InputLabel, Select, MenuItem,
  Chip, List, ListItem, ListItemText, ListItemSecondaryAction
} from '@mui/material';
import {
  EditOutlined,
  SaveOutlined,
  CloseOutlined,
  UploadOutlined,
  UserOutlined,
  MailOutlined,
  PhoneOutlined,
  HomeOutlined,
  EyeOutlined,
  EyeInvisibleOutlined,
  LockOutlined,
  PlusOutlined,
  DeleteOutlined
} from '@ant-design/icons';
import MainCard from 'components/MainCard';
import Breadcrumbs from 'components/@extended/Breadcrumbs';
import { toast } from 'react-toastify';
import Cookies from 'js-cookie';

const API_URL = 'http://localhost:8080/api/v1/admin/accounts';
const USER_DETAIL_URL = 'http://localhost:8080/api/v1/userDetail';

const ProfilePage = () => {
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [imagePreview, setImagePreview] = useState(null);
  const [showPassword, setShowPassword] = useState(false);
  const [changePasswordOpen, setChangePasswordOpen] = useState(false);
  const [manageSkillsOpen, setManageSkillsOpen] = useState(false);
  const fileInputRef = useRef(null);

  const [formData, setFormData] = useState({
    fullName: '',
    phone: '',
    email: '',
    address: '',
    imageUrl: '',
    skills: []
  });

  const [passwordData, setPasswordData] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: ''
  });

  const [formErrors, setFormErrors] = useState({
    email: '',
    phone: '',
    fullName: ''
  });

  // Fetch current user profile
  const fetchProfile = async () => {
    try {
      setLoading(true);
      
      // Get current user ID from localStorage or token
      const user = JSON.parse(localStorage.getItem('user') || '{}');
      const userId = user.id;
      
      if (!userId) {
        toast.error('Không tìm thấy thông tin người dùng');
        return;
      }

      // Fetch detailed profile using admin API with find-by-id endpoint
      const profileResponse = await fetch(`${API_URL}/find-by-id/${userId}`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${Cookies.get('admin_token') || Cookies.get('staff_token')}`,
          'Content-Type': 'application/json'
        }
      });

      if (profileResponse.ok) {
        const profileData = await profileResponse.json();
        if (profileData.status === 'SUCCESS') {
          setProfile(profileData.data);
          setFormData({
            fullName: profileData.data.fullName || '',
            phone: profileData.data.phone || '',
            email: profileData.data.email || '',
            address: profileData.data.address || '',
            imageUrl: profileData.data.imageUrl || '',
            skills: profileData.data.skills || []
          });
          setImagePreview(profileData.data.imageUrl);
        } else {
          toast.error('Không thể tải thông tin hồ sơ chi tiết');
        }
      } else {
        toast.error('Lỗi khi tải thông tin hồ sơ chi tiết');
      }
    } catch (error) {
      console.error('Profile fetch error:', error);
      toast.error('Lỗi kết nối khi tải hồ sơ');
    } finally {
      setLoading(false);
    }
  };

  // Check if email is already in use by another user
  const checkEmailExists = async (email) => {
    if (!email || email === profile?.email) return false;
    
    try {
      const response = await fetch(`${API_URL}/find-by-email/${encodeURIComponent(email)}`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${Cookies.get('admin_token') || Cookies.get('staff_token')}`,
          'Content-Type': 'application/json'
        }
      });

      if (response.ok) {
        const data = await response.json();
        return data.status === 'SUCCESS' && data.data && data.data.id !== profile?.id;
      }
    } catch (error) {
      console.error('Error checking email:', error);
    }
    return false;
  };

  // Check if phone is already in use by another user
  const checkPhoneExists = async (phone) => {
    if (!phone || phone === profile?.phone) return false;
    
    try {
      const response = await fetch(`${API_URL}/find-by-phone/${encodeURIComponent(phone)}`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${Cookies.get('admin_token') || Cookies.get('staff_token')}`,
          'Content-Type': 'application/json'
        }
      });

      if (response.ok) {
        const data = await response.json();
        return data.status === 'SUCCESS' && data.data && data.data.id !== profile?.id;
      }
    } catch (error) {
      console.error('Error checking phone:', error);
    }
    return false;
  };

  // Validation functions
  const validateEmail = (email) => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  };

  const validatePhone = (phone) => {
    const phoneRegex = /^[0-9]{10,11}$/;
    return phoneRegex.test(phone);
  };

  useEffect(() => {
    fetchProfile();
  }, []);

  // Enhanced input change handler with validation
  const handleInputChange = (field, value) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));

    // Real-time validation
    if (field === 'email' && value) {
      if (!validateEmail(value)) {
        setFormErrors(prev => ({
          ...prev,
          email: 'Địa chỉ email không hợp lệ'
        }));
      } else {
        setFormErrors(prev => ({
          ...prev,
          email: ''
        }));
      }
    }
    
    if (field === 'phone' && value) {
      if (!validatePhone(value)) {
        setFormErrors(prev => ({
          ...prev,
          phone: 'Số điện thoại phải có 10-11 chữ số'
        }));
      } else {
        setFormErrors(prev => ({
          ...prev,
          phone: ''
        }));
      }
    }

    if (field === 'fullName' && value) {
      if (value.trim().length === 0) {
        setFormErrors(prev => ({
          ...prev,
          fullName: 'Họ tên không được để trống'
        }));
      } else {
        setFormErrors(prev => ({
          ...prev,
          fullName: ''
        }));
      }
    }
  };

  const handleImageChange = async (event) => {
    const file = event.target.files[0];
    if (file) {
      // Validate file type
      const allowedTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];
      if (!allowedTypes.includes(file.type)) {
        toast.error('Chỉ cho phép tải lên file ảnh (JPEG, PNG, GIF, WebP)');
        return;
      }

      // Validate file size (max 5MB)
      const maxSize = 5 * 1024 * 1024; // 5MB in bytes
      if (file.size > maxSize) {
        toast.error('Kích thước file không được vượt quá 5MB');
        return;
      }

      try {
        // Create preview
        const reader = new FileReader();
        reader.onload = (e) => {
          setImagePreview(e.target.result);
        };
        reader.readAsDataURL(file);

        // Upload to server
        const formData = new FormData();
        formData.append('file', file);

        const uploadResponse = await fetch('http://localhost:8080/api/v1/upload', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${Cookies.get('admin_token') || Cookies.get('staff_token')}`
          },
          body: formData
        });

        if (uploadResponse.ok) {
          const uploadData = await uploadResponse.json();
          if (uploadData.status === 'SUCCESS' && uploadData.data?.url) {
            setFormData(prev => ({
              ...prev,
              imageUrl: uploadData.data.url
            }));
            toast.success('Tải ảnh lên thành công');
          } else {
            throw new Error('Upload response invalid');
          }
        } else {
          throw new Error('Upload failed');
        }
      } catch (error) {
        console.error('Image upload error:', error);
        toast.error('Lỗi khi tải ảnh lên');
        setImagePreview(formData.imageUrl || null);
      }
    }
  };

  const handleSave = async () => {
    try {
      setSaving(true);
      
      // Validate required fields
      if (!formData.fullName.trim()) {
        toast.error('Vui lòng nhập họ tên');
        return;
      }
      
      if (!formData.email.trim()) {
        toast.error('Vui lòng nhập email');
        return;
      }

      if (!validateEmail(formData.email)) {
        toast.error('Định dạng email không hợp lệ');
        return;
      }
      
      if (!formData.phone.trim()) {
        toast.error('Vui lòng nhập số điện thoại');
        return;
      }

      if (!validatePhone(formData.phone)) {
        toast.error('Số điện thoại phải có 10-11 chữ số');
        return;
      }

      // Check for duplicate email and phone
      const [emailExists, phoneExists] = await Promise.all([
        checkEmailExists(formData.email),
        checkPhoneExists(formData.phone)
      ]);

      if (emailExists) {
        toast.error('Email này đã được sử dụng bởi tài khoản khác');
        return;
      }

      if (phoneExists) {
        toast.error('Số điện thoại này đã được sử dụng bởi tài khoản khác');
        return;
      }
      
      const updatePayload = {
        id: profile.id,
        fullName: formData.fullName.trim(),
        phone: formData.phone.trim(),
        email: formData.email.trim(),
        password: profile.password, // Keep existing password
        imageUrl: formData.imageUrl,
        address: formData.address.trim(),
        roleId: profile.role?.id || profile.roleId,
        description: profile.description || '',
        isActive: profile.isActive,
        skillIds: formData.skills.map(skill => skill.id || skill),
        averageRating: profile.averageRating || 0,
        totalReviews: profile.totalReviews || 0
      };

      const response = await fetch(`${API_URL}/update/${profile.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${Cookies.get('admin_token') || Cookies.get('staff_token')}`
        },
        body: JSON.stringify(updatePayload)
      });

      const data = await response.json();
      
      if (response.ok && data.status === 'SUCCESS') {
        toast.success('Cập nhật hồ sơ thành công!');
        setEditing(false);
        await fetchProfile(); // Refresh profile data
      } else {
        toast.error(data.message || 'Cập nhật hồ sơ thất bại');
      }
    } catch (error) {
      console.error('Profile update error:', error);
      toast.error('Lỗi khi cập nhật hồ sơ');
    } finally {
      setSaving(false);
    }
  };

  const handleChangePassword = async () => {
    if (passwordData.newPassword !== passwordData.confirmPassword) {
      toast.error('Mật khẩu xác nhận không khớp');
      return;
    }

    if (passwordData.newPassword.length < 6) {
      toast.error('Mật khẩu mới phải có ít nhất 6 ký tự');
      return;
    }

    try {
      // Use the same update endpoint but with new password
      const updatePayload = {
        id: profile.id,
        fullName: profile.fullName,
        phone: profile.phone,
        email: profile.email,
        password: passwordData.newPassword, // Update with new password
        imageUrl: profile.imageUrl,
        address: profile.address,
        roleId: profile.role?.id || profile.roleId,
        description: profile.description || '',
        isActive: profile.isActive,
        skillIds: profile.skills?.map(skill => skill.id) || [],
        averageRating: profile.averageRating || 0,
        totalReviews: profile.totalReviews || 0
      };

      const response = await fetch(`${API_URL}/update/${profile.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${Cookies.get('admin_token') || Cookies.get('staff_token')}`
        },
        body: JSON.stringify(updatePayload)
      });

      const data = await response.json();
      
      if (response.ok && data.status === 'SUCCESS') {
        toast.success('Đổi mật khẩu thành công!');
        setChangePasswordOpen(false);
        setPasswordData({
          currentPassword: '',
          newPassword: '',
          confirmPassword: ''
        });
      } else {
        toast.error(data.message || 'Đổi mật khẩu thất bại');
      }
    } catch (error) {
      console.error('Password change error:', error);
      toast.error('Lỗi khi đổi mật khẩu');
    }
  };

  if (loading) {
    return (
      <>
        {/* <Breadcrumbs /> */}
        <MainCard title="Hồ Sơ Của Tôi">
          <Box display="flex" justifyContent="center" alignItems="center" minHeight="400px">
            <CircularProgress />
            <Typography sx={{ ml: 2 }}>Đang tải thông tin hồ sơ...</Typography>
          </Box>
        </MainCard>
      </>
    );
  }

  if (!profile) {
    return (
      <>
        {/* <Breadcrumbs /> */}
        <MainCard title="Hồ Sơ Của Tôi">
          <Box display="flex" justifyContent="center" alignItems="center" minHeight="400px">
            <Typography variant="h6" color="error">
              Không thể tải thông tin hồ sơ
            </Typography>
          </Box>
        </MainCard>
      </>
    );
  }

  return (
    <>
      {/* <Breadcrumbs /> */}
      <MainCard 
      title="Hồ Sơ Của Tôi"
      secondary={
        <Box display="flex" gap={1}>
          {!editing ? (
            <Button
              variant="contained"
              startIcon={<EditOutlined />}
              onClick={() => setEditing(true)}
            >
              Chỉnh Sửa
            </Button>
          ) : (
            <>
              <Button
                variant="contained"
                startIcon={<SaveOutlined />}
                onClick={handleSave}
                disabled={saving || !(
                  formData.fullName !== (profile.fullName || '') ||
                  formData.phone !== (profile.phone || '') ||
                  formData.email !== (profile.email || '') ||
                  formData.address !== (profile.address || '') ||
                  formData.imageUrl !== (profile.imageUrl || '')
                )}
              >
                {saving ? 'Đang lưu...' : 'Lưu'}
              </Button>
              <Button
                variant="outlined"
                startIcon={<CloseOutlined />}
                onClick={() => {
                  setEditing(false);
                  setFormData({
                    fullName: profile.fullName || '',
                    phone: profile.phone || '',
                    email: profile.email || '',
                    address: profile.address || '',
                    imageUrl: profile.imageUrl || '',
                    skills: profile.skills || []
                  });
                  setImagePreview(profile.imageUrl);
                }}
              >
                Hủy
              </Button>
            </>
          )}
        </Box>
      }
    >
      <Grid container spacing={3}>
        {/* Avatar Section */}
        <Grid item xs={12} md={4}>
          <Card>
            <CardContent>
              <Box display="flex" flexDirection="column" alignItems="center">
                <Avatar
                  src={imagePreview || profile.imageUrl}
                  sx={{ width: 150, height: 150, mb: 2 }}
                >
                  <UserOutlined style={{ fontSize: '60px' }} />
                </Avatar>
                
                {editing && (
                  <Button
                    variant="outlined"
                    startIcon={<UploadOutlined />}
                    onClick={() => fileInputRef.current?.click()}
                    sx={{ mb: 2 }}
                  >
                    Thay Đổi Ảnh
                  </Button>
                )}
                
                <input
                  type="file"
                  ref={fileInputRef}
                  onChange={handleImageChange}
                  accept="image/*"
                  style={{ display: 'none' }}
                />

                <Typography variant="h5" gutterBottom>
                  {profile.fullName}
                </Typography>
                
                <Chip 
                  label={profile.role?.name || 'Chưa có vai trò'} 
                  color="primary"
                  sx={{ mb: 2 }}
                />

                <Typography variant="body2" color="textSecondary" align="center">
                  Thành viên từ: {new Date(profile.createdAt).toLocaleDateString('vi-VN')}
                </Typography>
              </Box>
            </CardContent>
          </Card>

          {/* Quick Actions */}
          <Card sx={{ mt: 2 }}>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Thao Tác Nhanh
              </Typography>
              <Button
                fullWidth
                variant="outlined"
                startIcon={<LockOutlined />}
                onClick={() => setChangePasswordOpen(true)}
                sx={{ mb: 1 }}
              >
                Đổi Mật Khẩu
              </Button>
            </CardContent>
          </Card>
        </Grid>

        {/* Profile Information */}
        <Grid item xs={12} md={8}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Thông Tin Cá Nhân
              </Typography>
              <Divider sx={{ mb: 3 }} />

              <Grid container spacing={3}>
                <Grid item xs={12} sm={6}>
                  <TextField
                    fullWidth
                    label="Họ và Tên"
                    value={editing ? formData.fullName : profile.fullName}
                    onChange={(e) => handleInputChange('fullName', e.target.value)}
                    disabled={!editing}
                    error={!!formErrors.fullName}
                    helperText={formErrors.fullName}
                    InputProps={{
                      startAdornment: (
                        <InputAdornment position="start">
                          <UserOutlined />
                        </InputAdornment>
                      )
                    }}
                  />
                </Grid>

                <Grid item xs={12} sm={6}>
                  <TextField
                    fullWidth
                    label="Email"
                    value={editing ? formData.email : profile.email}
                    onChange={(e) => handleInputChange('email', e.target.value)}
                    disabled={!editing}
                    type="email"
                    error={!!formErrors.email}
                    helperText={formErrors.email}
                    InputProps={{
                      startAdornment: (
                        <InputAdornment position="start">
                          <MailOutlined />
                        </InputAdornment>
                      )
                    }}
                  />
                </Grid>

                <Grid item xs={12} sm={6}>
                  <TextField
                    fullWidth
                    label="Số Điện Thoại"
                    value={editing ? formData.phone : profile.phone}
                    onChange={(e) => handleInputChange('phone', e.target.value)}
                    disabled={!editing}
                    error={!!formErrors.phone}
                    helperText={formErrors.phone}
                    InputProps={{
                      startAdornment: (
                        <InputAdornment position="start">
                          <PhoneOutlined />
                        </InputAdornment>
                      )
                    }}
                  />
                </Grid>

                <Grid item xs={12} sm={6}>
                  <TextField
                    fullWidth
                    label="Trạng Thái"
                    value={profile.isActive ? 'Hoạt động' : 'Không hoạt động'}
                    disabled
                    InputProps={{
                      startAdornment: (
                        <InputAdornment position="start">
                          <UserOutlined />
                        </InputAdornment>
                      )
                    }}
                  />
                </Grid>

                <Grid item xs={12}>
                  <TextField
                    fullWidth
                    label="Địa Chỉ"
                    value={editing ? formData.address : (profile.address || '')}
                    onChange={(e) => handleInputChange('address', e.target.value)}
                    disabled={!editing}
                    multiline
                    rows={2}
                    InputProps={{
                      startAdornment: (
                        <InputAdornment position="start">
                          <HomeOutlined />
                        </InputAdornment>
                      )
                    }}
                  />
                </Grid>
              </Grid>
            </CardContent>
          </Card>

          {/* Skills Section */}
          <Card sx={{ mt: 3 }}>
            <CardContent>
              <Box display="flex" alignItems="center" justifyContent="space-between">
                <Typography variant="h6" gutterBottom>
                  Kỹ Năng
                </Typography>
                {/* {editing && (
                  <IconButton color="primary" onClick={() => setManageSkillsOpen(true)}>
                    <EditOutlined />
                  </IconButton>
                )} */}
              </Box>
              <Divider sx={{ mb: 3 }} />
              <Box display="flex" flexWrap="wrap" gap={1}>
                {/* {(editing ? formData.skills : profile.skills || []).map((skill) => (
                  <Chip
                    key={skill.id}
                    label={skill.skillName || skill.name}
                    color="primary"
                    variant="outlined"
                    onDelete={editing ? () => handleRemoveSkill(skill.id) : undefined}
                  />
                ))} */}
                {(!profile.skills || profile.skills.length === 0) && (
                  <Typography variant="body2" color="textSecondary">
                    Chưa có kỹ năng nào được thêm
                  </Typography>
                )}
              </Box>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Change Password Dialog */}
      <Dialog open={changePasswordOpen} onClose={() => setChangePasswordOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Đổi Mật Khẩu</DialogTitle>
        <DialogContent>
          <Box sx={{ pt: 2 }}>
            <TextField
              fullWidth
              label="Mật khẩu hiện tại"
              type={showPassword ? 'text' : 'password'}
              value={passwordData.currentPassword}
              onChange={(e) => setPasswordData(prev => ({ ...prev, currentPassword: e.target.value }))}
              sx={{ mb: 2 }}
              InputProps={{
                endAdornment: (
                  <InputAdornment position="end">
                    <IconButton onClick={() => setShowPassword(!showPassword)}>
                      {showPassword ? <EyeInvisibleOutlined /> : <EyeOutlined />}
                    </IconButton>
                  </InputAdornment>
                )
              }}
            />
            <TextField
              fullWidth
              label="Mật khẩu mới"
              type={showPassword ? 'text' : 'password'}
              value={passwordData.newPassword}
              onChange={(e) => setPasswordData(prev => ({ ...prev, newPassword: e.target.value }))}
              sx={{ mb: 2 }}
            />
            <TextField
              fullWidth
              label="Xác nhận mật khẩu mới"
              type={showPassword ? 'text' : 'password'}
              value={passwordData.confirmPassword}
              onChange={(e) => setPasswordData(prev => ({ ...prev, confirmPassword: e.target.value }))}
            />
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setChangePasswordOpen(false)}>Hủy</Button>
          <Button onClick={handleChangePassword} variant="contained">
            Đổi Mật Khẩu
          </Button>
        </DialogActions>
      </Dialog>
    </MainCard>
    </>
  );
};

export default ProfilePage;
