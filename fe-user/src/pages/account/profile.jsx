import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
    Box,
    Button,
    Card,
    CardContent,
    CardHeader,
    Divider,
    Grid,
    TextField,
    Typography,
    Alert,
    FormControl,
    InputLabel,
    Select,
    MenuItem,
    Dialog,
    DialogActions,
    DialogContent,
    DialogContentText,
    DialogTitle,
    Snackbar,
    Avatar,
    Chip
} from '@mui/material';
import { LoadingButton } from '@mui/lab';
import MainCard from 'components/MainCard';
import { useAuth } from 'contexts/AuthContext';
import SaveOutlined from '@ant-design/icons/SaveOutlined';
import DeleteOutlined from '@ant-design/icons/DeleteOutlined';
import LockOutlined from '@mui/icons-material/LockOutlined';
import HomeOutlined from '@mui/icons-material/HomeOutlined';
import PersonOutline from '@mui/icons-material/PersonOutline';
import EmailOutlined from '@mui/icons-material/EmailOutlined';
import PhoneOutlined from '@mui/icons-material/PhoneOutlined';
import VpnKeyOutlined from '@mui/icons-material/VpnKeyOutlined';
import AddCircleOutline from '@mui/icons-material/AddCircleOutline';
import EditOutlined from '@ant-design/icons/EditOutlined';
import PhotoCamera from '@mui/icons-material/PhotoCamera';
import Breadcrumbs from '@mui/material/Breadcrumbs';
import Link from '@mui/material/Link';

// ==============================|| PROFILE PAGE ||============================== //

const ProfilePage = () => {
    const navigate = useNavigate();
    const { user, checkAuthSession } = useAuth();

    const [loading, setLoading] = useState(false);
    const [deleteLoading, setDeleteLoading] = useState(false);
    const [profileData, setProfileData] = useState({
        id: '',
        fullName: '',
        email: '',
        phone: '',
        role: '',
        status: 1,
        address: '',
        joinedDate: '',
        skills: []
    });
    const [originalData, setOriginalData] = useState({});
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');
    const [deleteDialog, setDeleteDialog] = useState(false);
    const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'success' });
    const [editMode, setEditMode] = useState(false);
    const [showPasswordDialog, setShowPasswordDialog] = useState(false);
    const [showSkillDialog, setShowSkillDialog] = useState(false);
    const [passwordForm, setPasswordForm] = useState({ oldPassword: '', newPassword: '', confirm: '' });
    const [passwordError, setPasswordError] = useState('');
    const [skillInput, setSkillInput] = useState('');
    const [skills, setSkills] = useState([]);
    const [avatarFile, setAvatarFile] = useState(null);
    const [avatarPreview, setAvatarPreview] = useState('');

    // Check user permissions
    const isAdmin = user?.role === 'ADMIN';
    const canEditRole = isAdmin;
    const canEditStatus = isAdmin;
    const canDeleteAccount = isAdmin;

    // Fetch user profile data on component mount
    useEffect(() => {
        if (user?.id) {
            fetchUserProfile(user.id);
        } else if (user?.userId) {
            fetchUserProfile(user.userId);
        }
    }, [user]);

    useEffect(() => {
        setSkills(profileData.skills || []);
        setAvatarPreview(profileData.avatar || '');
    }, [profileData.skills, profileData.avatar]);

    const fetchUserProfile = async (userId) => {
        setLoading(true);
        try {
            const response = await fetch(`http://localhost:8080/api/v1/admin/accounts/find-by-id/${userId}`, {
                method: 'GET',
                credentials: 'include',
                headers: {
                    'Content-Type': 'application/json',
                },
            });

            if (response.ok) {
                const res = await response.json();
                const data = res.data || {};
                const userData = {
                    id: data.id || '',
                    fullName: data.fullName || '',
                    email: data.email || '',
                    phone: data.phone || '',
                    role: (data.role && data.role.name) ? data.role.name : '',
                    status: typeof data.isActive === 'number' ? data.isActive : (data.isActive ? 1 : 0),
                    address: data.address || '',
                    joinedDate: data.createdAt ? new Date(data.createdAt).toLocaleDateString('vi-VN') : '',
                    avatar: data.imageUrl || '',
                    skills: Array.isArray(data.skills) ? data.skills.map(s => s.skillName) : [],
                    description: data.description || '',
                };
                setProfileData(userData);
                setOriginalData(userData);
            } else {
                setError('Không thể tải thông tin hồ sơ');
            }
        } catch (err) {
            setError('Lỗi kết nối mạng');
        } finally {
            setLoading(false);
        }
    };

    const handleInputChange = (field) => (event) => {
        setProfileData(prev => ({
            ...prev,
            [field]: event.target.value
        }));
        // Clear error when user starts typing
        if (error) setError('');
    };

    const validateForm = () => {
        if (!profileData.fullName.trim()) {
            setError('Họ tên không được để trống');
            return false;
        }
        if (!profileData.email.trim()) {
            setError('Email không được để trống');
            return false;
        }
        if (!profileData.phone.trim()) {
            setError('Số điện thoại không được để trống');
            return false;
        }

        // Email validation
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(profileData.email)) {
            setError('Email không hợp lệ');
            return false;
        }

        // Phone validation
        const phoneRegex = /^[0-9]{10,11}$/;
        if (!phoneRegex.test(profileData.phone)) {
            setError('Số điện thoại phải có 10-11 chữ số');
            return false;
        }

        return true;
    };

    const handleSave = async () => {
        if (!validateForm()) return;

        setLoading(true);
        setError('');

        try {
            // Build update payload based on user permissions
            const updatePayload = {
                fullName: profileData.fullName,
                email: profileData.email,
                phone: profileData.phone,
                address: profileData.address
            };

            // Only include role and status if user is admin
            if (canEditRole) {
                updatePayload.role = profileData.role;
            }
            if (canEditStatus) {
                updatePayload.status = profileData.status;
            }

            const response = await fetch(`http://localhost:8080/api/v1/admin/accounts/update/${profileData.id}`, {
                method: 'PUT',
                credentials: 'include',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(updatePayload),
            });

            if (response.ok) {
                setSuccess('Cập nhật hồ sơ thành công!');
                setOriginalData(profileData);
                setSnackbar({
                    open: true,
                    message: 'Cập nhật hồ sơ thành công!',
                    severity: 'success'
                });
            } else {
                const errorData = await response.json();
                setError(errorData.message || 'Cập nhật thất bại');
            }
        } catch (err) {
            setError('Lỗi kết nối mạng');
        } finally {
            setLoading(false);
        }
    };

    const handleDelete = async () => {
        setDeleteLoading(true);

        try {
            const response = await fetch(`http://localhost:8080/api/v1/admin/accounts/delete/${profileData.id}`, {
                method: 'PUT',
                credentials: 'include',
                headers: {
                    'Content-Type': 'application/json',
                },
            });

            if (response.ok) {
                setSnackbar({
                    open: true,
                    message: 'Xóa tài khoản thành công!',
                    severity: 'success'
                });
                // Redirect to login after successful deletion
                setTimeout(() => {
                    navigate('/login');
                }, 2000);
            } else {
                const errorData = await response.json();
                setError(errorData.message || 'Xóa tài khoản thất bại');
            }
        } catch (err) {
            setError('Lỗi kết nối mạng');
        } finally {
            setDeleteLoading(false);
            setDeleteDialog(false);
        }
    };

    const hasChanges = () => {
        return JSON.stringify(profileData) !== JSON.stringify(originalData);
    };

    const handleReset = () => {
        setProfileData(originalData);
        setError('');
        setSuccess('');
    };

    const handleCloseSnackbar = () => {
        setSnackbar({ ...snackbar, open: false });
    };

    const handleEditClick = () => setEditMode(true);
    const handleCancelEdit = () => { setEditMode(false); setProfileData(originalData); setError(''); };

    // Đổi mật khẩu
    const handlePasswordChange = async () => {
        setPasswordError('');
        if (!passwordForm.oldPassword || !passwordForm.newPassword || !passwordForm.confirm) {
            setPasswordError('Vui lòng nhập đầy đủ thông tin');
            return;
        }
        if (passwordForm.newPassword !== passwordForm.confirm) {
            setPasswordError('Mật khẩu xác nhận không khớp');
            return;
        }
        // Gọi API đổi mật khẩu (giả lập)
        setShowPasswordDialog(false);
        setSnackbar({ open: true, message: 'Đổi mật khẩu thành công!', severity: 'success' });
        setPasswordForm({ oldPassword: '', newPassword: '', confirm: '' });
    };

    // Kỹ năng
    const handleAddSkill = () => {
        if (skillInput.trim() && !skills.includes(skillInput.trim())) {
            const newSkills = [...skills, skillInput.trim()];
            setSkills(newSkills);
            setSkillInput('');
            setProfileData(prev => ({ ...prev, skills: newSkills }));
        }
    };
    const handleRemoveSkill = (skill) => {
        const newSkills = skills.filter(s => s !== skill);
        setSkills(newSkills);
        setProfileData(prev => ({ ...prev, skills: newSkills }));
    };
    const handleSaveSkills = () => {
        setShowSkillDialog(false);
        setSnackbar({ open: true, message: 'Cập nhật kỹ năng thành công!', severity: 'success' });
    };

    const handleAvatarChange = (e) => {
        const file = e.target.files[0];
        if (file) {
            setAvatarFile(file);
            setAvatarPreview(URL.createObjectURL(file));
        }
    };

    const handleUploadAvatar = async () => {
        if (!avatarFile) return;
        setLoading(true);
        try {
            const formData = new FormData();
            formData.append('file', avatarFile);
            const res = await fetch(`http://localhost:8080/api/v1/admin/accounts/upload-avatar/${profileData.id}`, {
                method: 'POST',
                credentials: 'include',
                body: formData
            });
            if (res.ok) {
                const data = await res.json();
                setProfileData(prev => ({ ...prev, avatar: data.imageUrl }));
                setAvatarPreview(data.imageUrl || '');
                setSnackbar({ open: true, message: 'Cập nhật ảnh đại diện thành công!', severity: 'success' });
                setAvatarFile(null);
                if (typeof checkAuthSession === 'function') {
                    checkAuthSession(); // reload lại user context nếu cần
                }
            } else {
                setSnackbar({ open: true, message: 'Cập nhật ảnh đại diện thất bại!', severity: 'error' });
            }
        } catch (err) {
            setSnackbar({ open: true, message: 'Lỗi kết nối khi upload ảnh!', severity: 'error' });
        } finally {
            setLoading(false);
        }
    };

    return (
        <Box>
            <Box mb={2}>
                <Breadcrumbs aria-label="breadcrumb">
                    <Link underline="hover" color="inherit" href="/">
                        Home
                    </Link>
                    <Typography color="text.primary">Hồ Sơ Của Tôi</Typography>
                </Breadcrumbs>
            </Box>
            <Typography variant="h4" gutterBottom>
                Hồ Sơ Của Tôi
            </Typography>
            <MainCard>
                <CardHeader title="Hồ Sơ Của Tôi" action={
                    editMode ? (
                        <>
                            <Button variant="contained" color="primary" startIcon={<SaveOutlined />} onClick={handleSave} disabled={!hasChanges() || loading}>
                                Lưu
                            </Button>
                            <Button variant="outlined" onClick={handleCancelEdit} sx={{ ml: 1 }}>
                                Hủy
                            </Button>
                        </>
                    ) : (
                        <Button variant="contained" startIcon={<EditOutlined />} onClick={handleEditClick}>
                            Chỉnh Sửa
                        </Button>
                    )
                } />
                <Divider />
                <CardContent>
                    <Grid container spacing={3}>
                        <Grid item xs={12} md={4}>
                            <Card sx={{ mb: 2, textAlign: 'center', p: 2 }}>
                                <Box display="flex" flexDirection="column" alignItems="center" gap={2}>
                                    <Box position="relative">
                                        <Avatar sx={{ width: 100, height: 100, fontSize: 40, mb: 1 }} src={avatarPreview || ''}>
                                            {profileData.fullName ? profileData.fullName[0] : ''}
                                        </Avatar>
                                        {editMode && (
                                            <>
                                                <input
                                                    accept="image/*"
                                                    style={{ display: 'none' }}
                                                    id="avatar-upload"
                                                    type="file"
                                                    onChange={handleAvatarChange}
                                                />
                                                <label htmlFor="avatar-upload">
                                                    <Button
                                                        component="span"
                                                        size="small"
                                                        variant="outlined"
                                                        startIcon={<PhotoCamera fontSize="small" />}
                                                        sx={{ mt: 1, minWidth: 0 }}
                                                    >
                                                        Thay đổi ảnh
                                                    </Button>
                                                </label>
                                            </>
                                        )}
                                    </Box>
                                    {editMode && avatarFile && (
                                        <Button size="small" variant="contained" onClick={handleUploadAvatar} sx={{ mt: 1 }} disabled={loading}>
                                            Lưu ảnh
                                        </Button>
                                    )}
                                    <Typography variant="h6">{profileData.fullName}</Typography>
                                    <Chip label={profileData.role === 'ADMIN' ? 'ADMIN' : profileData.role === 'STAFF' ? 'STAFF' : 'USER'} color={profileData.role === 'ADMIN' ? 'primary' : 'default'} size="small" />
                                    <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>Thành viên từ: {profileData.joinedDate || '--'}</Typography>
                                </Box>
                            </Card>
                            <Card sx={{ mt: 2 }}>
                                <CardContent>
                                    <Typography variant="h6" gutterBottom>
                                        Thao Tác Nhanh
                                    </Typography>
                                    <Button
                                        fullWidth
                                        variant="outlined"
                                        startIcon={<LockOutlined />}
                                        onClick={() => setShowPasswordDialog(true)}
                                        sx={{ mb: 1 }}
                                    >
                                        Đổi Mật Khẩu
                                    </Button>
                                </CardContent>
                            </Card>
                        </Grid>
                        <Grid item xs={12} md={8}>
                            <Card>
                                <CardHeader title="Thông Tin Cá Nhân" />
                                <Divider />
                                <CardContent>
                                    <Grid container spacing={2}>
                                        <Grid item xs={12} md={6}>
                                            <TextField
                                                fullWidth
                                                label="Họ và Tên"
                                                value={profileData.fullName}
                                                onChange={handleInputChange('fullName')}
                                                InputProps={{ startAdornment: <PersonOutline sx={{ mr: 1 }} /> }}
                                                variant="outlined"
                                                required
                                                disabled={!editMode}
                                            />
                                        </Grid>
                                        <Grid item xs={12} md={6}>
                                            <TextField
                                                fullWidth
                                                label="Email"
                                                type="email"
                                                value={profileData.email}
                                                onChange={handleInputChange('email')}
                                                InputProps={{ startAdornment: <EmailOutlined sx={{ mr: 1 }} /> }}
                                                variant="outlined"
                                                required
                                                disabled={!editMode}
                                            />
                                        </Grid>
                                        <Grid item xs={12} md={6}>
                                            <TextField
                                                fullWidth
                                                label="Số Điện Thoại"
                                                value={profileData.phone}
                                                onChange={handleInputChange('phone')}
                                                InputProps={{ startAdornment: <PhoneOutlined sx={{ mr: 1 }} /> }}
                                                variant="outlined"
                                                required
                                                disabled={!editMode}
                                            />
                                        </Grid>
                                        <Grid item xs={12} md={6}>
                                            <FormControl fullWidth>
                                                <InputLabel>Trạng Thái</InputLabel>
                                                <Select
                                                    value={profileData.status}
                                                    onChange={handleInputChange('status')}
                                                    label="Trạng Thái"
                                                    disabled={!canEditStatus || !editMode}
                                                >
                                                    <MenuItem value={1}>Hoạt động</MenuItem>
                                                    <MenuItem value={0}>Tạm khóa</MenuItem>
                                                </Select>
                                            </FormControl>
                                        </Grid>
                                        <Grid item xs={12} md={12}>
                                            <TextField
                                                fullWidth
                                                label="Địa Chỉ"
                                                value={profileData.address}
                                                onChange={handleInputChange('address')}
                                                InputProps={{ startAdornment: <HomeOutlined sx={{ mr: 1 }} /> }}
                                                variant="outlined"
                                                disabled={!editMode}
                                            />
                                        </Grid>
                                    </Grid>
                                </CardContent>
                            </Card>
                            <Card sx={{ mt: 2 }}>
                                <CardHeader title="Kỹ Năng" />
                                <Divider />
                                <CardContent>
                                    {skills && skills.length > 0 ? (
                                        <Box display="flex" flexWrap="wrap" gap={1}>
                                            {skills.map((skill, idx) => (
                                                <Chip key={idx} label={skill} />
                                            ))}
                                        </Box>
                                    ) : (
                                        <Typography color="text.secondary">Chưa có kỹ năng nào được thêm</Typography>
                                    )}
                                </CardContent>
                            </Card>
                        </Grid>
                    </Grid>
                    {error && (
                        <Alert severity="error" sx={{ mt: 2 }}>
                            {error}
                        </Alert>
                    )}
                    {success && (
                        <Alert severity="success" sx={{ mt: 2 }}>
                            {success}
                        </Alert>
                    )}
                </CardContent>
            </MainCard>

            {/* Đổi mật khẩu */}
            <Dialog open={showPasswordDialog} onClose={() => setShowPasswordDialog(false)}>
                <DialogTitle>Đổi Mật Khẩu</DialogTitle>
                <DialogContent>
                    <TextField
                        margin="dense"
                        label="Mật khẩu cũ"
                        type="password"
                        fullWidth
                        value={passwordForm.oldPassword}
                        onChange={e => setPasswordForm({ ...passwordForm, oldPassword: e.target.value })}
                    />
                    <TextField
                        margin="dense"
                        label="Mật khẩu mới"
                        type="password"
                        fullWidth
                        value={passwordForm.newPassword}
                        onChange={e => setPasswordForm({ ...passwordForm, newPassword: e.target.value })}
                    />
                    <TextField
                        margin="dense"
                        label="Xác nhận mật khẩu mới"
                        type="password"
                        fullWidth
                        value={passwordForm.confirm}
                        onChange={e => setPasswordForm({ ...passwordForm, confirm: e.target.value })}
                    />
                    {passwordError && <Alert severity="error" sx={{ mt: 1 }}>{passwordError}</Alert>}
                </DialogContent>
                <DialogActions>
                    <Button onClick={() => setShowPasswordDialog(false)}>Hủy</Button>
                    <Button onClick={handlePasswordChange} variant="contained">Đổi mật khẩu</Button>
                </DialogActions>
            </Dialog>

            {/* Quản lý kỹ năng */}
            {isAdmin && (
                <Dialog open={showSkillDialog} onClose={() => setShowSkillDialog(false)}>
                    <DialogTitle>Quản Lý Kỹ Năng</DialogTitle>
                    <DialogContent>
                        <Box display="flex" gap={1} mb={2}>
                            <TextField
                                label="Thêm kỹ năng"
                                value={skillInput}
                                onChange={e => setSkillInput(e.target.value)}
                                onKeyDown={e => { if (e.key === 'Enter') { e.preventDefault(); handleAddSkill(); } }}
                                fullWidth
                            />
                            <Button onClick={handleAddSkill} variant="contained">Thêm</Button>
                        </Box>
                        <Box display="flex" flexWrap="wrap" gap={1}>
                            {skills.map((skill, idx) => (
                                <Chip key={idx} label={skill} onDelete={() => handleRemoveSkill(skill)} />
                            ))}
                        </Box>
                    </DialogContent>
                    <DialogActions>
                        <Button onClick={() => setShowSkillDialog(false)}>Hủy</Button>
                        <Button onClick={handleSaveSkills} variant="contained">Lưu</Button>
                    </DialogActions>
                </Dialog>
            )}

            {/* Xóa tài khoản */}
            <Dialog open={deleteDialog} onClose={() => setDeleteDialog(false)} aria-labelledby="delete-dialog-title" aria-describedby="delete-dialog-description">
                <DialogTitle id="delete-dialog-title">
                    Xác nhận xóa tài khoản
                </DialogTitle>
                <DialogContent>
                    <DialogContentText id="delete-dialog-description">
                        Bạn có chắc chắn muốn xóa tài khoản này không? Hành động này không thể hoàn tác.
                    </DialogContentText>
                </DialogContent>
                <DialogActions>
                    <Button onClick={() => setDeleteDialog(false)} disabled={deleteLoading}>
                        Hủy
                    </Button>
                    <LoadingButton onClick={handleDelete} loading={deleteLoading} color="error" variant="contained">
                        Xóa
                    </LoadingButton>
                </DialogActions>
            </Dialog>

            <Snackbar open={snackbar.open} autoHideDuration={6000} onClose={handleCloseSnackbar} anchorOrigin={{ vertical: 'top', horizontal: 'right' }}>
                <Alert onClose={handleCloseSnackbar} severity={snackbar.severity}>
                    {snackbar.message}
                </Alert>
            </Snackbar>
        </Box>
    );
};

export default ProfilePage;
