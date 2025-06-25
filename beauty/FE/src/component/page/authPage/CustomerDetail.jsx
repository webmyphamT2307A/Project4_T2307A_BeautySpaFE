import React, { useState, useEffect } from 'react';
import { Tab, Nav } from 'react-bootstrap';
import axios from 'axios';
import Header from "../../shared/header";
import Footer from "../../shared/footer";
import sessionManager from '../../../utils/sessionManager';
import { toast } from 'react-toastify';

const CustomerDetail = () => {
    const [key, setKey] = useState('profile');
    const [user, setUser] = useState({});
    const [loading, setLoading] = useState(true);

    const [userInfo, setUserInfo] = useState({
        fullName: '',
        email: '',
        phone: '',
        address: '',
        imageUrl: null
    });

    const [passwordInfo, setPasswordInfo] = useState({
        oldPassword: '',
        newPassword: '',
        confirmPassword: ''
    });

    const [serviceHistory, setServiceHistory] = useState([]);
    const [selectedHistory, setSelectedHistory] = useState(null);
    
    // Pagination states for service history
    const [currentHistoryPage, setCurrentHistoryPage] = useState(1);
    const historyPerPage = 5;

    const [message, setMessage] = useState({ type: '', content: '' });
    const [isLoggingOut, setIsLoggingOut] = useState(false);

    // Loading states
    const [isUpdatingProfile, setIsUpdatingProfile] = useState(false);
    const [isChangingPassword, setIsChangingPassword] = useState(false);

    useEffect(() => {
        const storedUser = localStorage.getItem('userInfo');
        if (storedUser) {
            try {
                const parsedUser = JSON.parse(storedUser);
                if (!parsedUser.token) {
                    localStorage.removeItem('userInfo');
                    window.location.href = '/';
                    return;
                }
                setUser(parsedUser);
                fetchUserDetails(parsedUser.id, parsedUser.token);
                fetchServiceHistory(parsedUser.id, parsedUser.token);
            } catch (error) {
                localStorage.removeItem('userInfo');
                window.location.href = '/';
            }
        } else {
            window.location.href = '/';
        }
        
        return () => {
            if (userInfo.imagePreview) {
                URL.revokeObjectURL(userInfo.imagePreview);
            }
        };
    }, []);

    const fetchUserDetails = async (userId, token) => {
        try {
            const response = await axios.get(`http://localhost:8080/api/v1/customer/detail/${userId}`, {
                headers: { 'Authorization': `Bearer ${token}` },
                timeout: 10000
            });
            if (response.data && response.data.status === 'SUCCESS') {
                const customerData = response.data.data;
                setUserInfo({
                    fullName: customerData.fullName || '',
                    email: customerData.email || '',
                    phone: customerData.phone || '',
                    address: customerData.address || '',
                    imageUrl: customerData.imageUrl || ''
                });
            }
        } catch (error) {
            toast.error('Không thể tải thông tin người dùng!');
        } finally {
            setLoading(false);
        }
    };

    const fetchServiceHistory = async (customerId, token) => {
        try {
            const response = await axios.get(`http://localhost:8080/api/v1/serviceHistory/customer/${customerId}`, {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            setServiceHistory(response.data.data || []);
        } catch (error) {
            console.error('Error fetching service history:', error);
        }
    };

    const handleProfileChange = (e) => {
        const { name, value, files } = e.target;
        if (name === "imageFile") {
            const file = files[0];
            if (file) {
                const previewUrl = URL.createObjectURL(file);
                setUserInfo({ ...userInfo, imageFile: file, imagePreview: previewUrl });
            }
        } else {
            setUserInfo({ ...userInfo, [name]: value });
        }
    };

    const handlePasswordChange = (e) => {
        const { name, value } = e.target;
        setPasswordInfo({ ...passwordInfo, [name]: value });
    };

    const handleProfileSubmit = async (e) => {
        e.preventDefault();
        setIsUpdatingProfile(true);
        
        const loadingToast = toast.loading('Đang cập nhật thông tin...');

        try {
            const formData = new FormData();
            const customerDetail = {
                fullName: userInfo.fullName,
                phone: userInfo.phone,
                address: userInfo.address,
                email: userInfo.email
            };
            formData.append('info', new Blob([JSON.stringify(customerDetail)], { type: 'application/json' }));
            if (userInfo.imageFile) {
                formData.append('file', userInfo.imageFile);
            }
            
            const response = await axios.put(
                `http://localhost:8080/api/v1/customer/update-info/${user.id}`,
                formData,
                { headers: { 'Authorization': `Bearer ${user.token}` } }
            );
            
            if (response.data && response.data.status === 'SUCCESS') {
                const updatedUserInfo = { ...user, ...userInfo, imageUrl: response.data.data.imageUrl || userInfo.imageUrl };
                localStorage.setItem('userInfo', JSON.stringify(updatedUserInfo));
                
                window.dispatchEvent(new CustomEvent('userInfoUpdated'));
                
                toast.update(loadingToast, {
                    render: 'Cập nhật thông tin thành công! 🎉',
                    type: "success",
                    isLoading: false,
                    autoClose: 3000,
                });
                
                setUserInfo(prev => ({ ...prev, imageUrl: response.data.data.imageUrl || prev.imageUrl }));
            } else {
                toast.update(loadingToast, {
                    render: 'Có lỗi xảy ra khi cập nhật!',
                    type: "error",
                    isLoading: false,
                    autoClose: 3000,
                });
            }
        } catch (error) {
            toast.update(loadingToast, {
                render: 'Có lỗi xảy ra khi cập nhật thông tin!',
                type: "error",
                isLoading: false,
                autoClose: 3000,
            });
        } finally {
            setIsUpdatingProfile(false);
        }
    };

    const handlePasswordSubmit = async (e) => {
        e.preventDefault();
        
        if (passwordInfo.newPassword !== passwordInfo.confirmPassword) {
            toast.error('Mật khẩu mới và xác nhận mật khẩu không khớp!');
            return;
        }

        setIsChangingPassword(true);
        const loadingToast = toast.loading('Đang đổi mật khẩu...');

        try {
            const response = await axios.put(
                `http://localhost:8080/api/v1/customer/change-password/${user.id}`,
                passwordInfo,
                { headers: { 'Authorization': `Bearer ${user.token}` } }
            );
            
            if (response.data && response.data.status === 'SUCCESS') {
                toast.update(loadingToast, {
                    render: 'Đổi mật khẩu thành công! 🔒',
                    type: "success",
                    isLoading: false,
                    autoClose: 3000,
                });
                setPasswordInfo({ oldPassword: '', newPassword: '', confirmPassword: '' });
            } else {
                toast.update(loadingToast, {
                    render: 'Đổi mật khẩu thất bại!',
                    type: "error",
                    isLoading: false,
                    autoClose: 3000,
                });
            }
        } catch (error) {
            toast.update(loadingToast, {
                render: 'Có lỗi xảy ra khi đổi mật khẩu!',
                type: "error",
                isLoading: false,
                autoClose: 3000,
            });
        } finally {
            setIsChangingPassword(false);
        }
    };

    const handleLogout = () => {
        if (isLoggingOut) return;
        
        setIsLoggingOut(true);
        toast.info('Đang đăng xuất...');
        
        localStorage.removeItem('userInfo');
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        
        setTimeout(() => {
            toast.success('Đã đăng xuất thành công! 👋');
            window.location.href = '/';
        }, 1000);
    };

    if (loading) {
        return (
            <div className="d-flex justify-content-center align-items-center" style={{ minHeight: '100vh' }}>
                <div className="text-center">
                    <div className="spinner-border text-primary mb-3" style={{ width: '3rem', height: '3rem' }}>
                        <span className="visually-hidden">Loading...</span>
                    </div>
                    <h5 className="text-muted">Đang tải thông tin...</h5>
                </div>
            </div>
        );
    }

    return (
        <>
            <Header />
            {/* Hero Section với gradient đẹp */}
            <div className="container-fluid py-5" style={{
                background: 'linear-gradient(135deg,#FCB2B9 0%,rgb(192, 112, 136) 100%)',
                position: 'relative',
                overflow: 'hidden'
            }}>
                {/* Decorative elements */}
                <div className="position-absolute top-0 start-0 w-100 h-100" style={{
                    background: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23ffffff' fill-opacity='0.1'%3E%3Ccircle cx='7' cy='7' r='7'/%3E%3Ccircle cx='53' cy='53' r='7'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`,
                    opacity: 0.3
                }}></div>
                
                <div className="container text-center py-5 position-relative">
                    <div className="row justify-content-center">
                        <div className="col-lg-8">
                            <h1 className="display-4 mb-4 fw-bold" style={{
                                color: ' rgba(26, 26, 26)',
                                textShadow: '2px 2px 4px rgba(0,0,0,0.3)'
                            }}>
                                <i className="fas fa-user-circle me-3"></i>
                                Thông Tin Tài Khoản
                            </h1>
                            <p className="text-white-50 fs-5 mb-4">
                                Quản lý thông tin cá nhân và bảo mật tài khoản của bạn
                            </p>
                            <nav aria-label="breadcrumb">
                                <ol className="breadcrumb justify-content-center mb-0">
                                    <li className="breadcrumb-item">
                                        <a href="/" className="text-white-50 text-decoration-none">
                                            <i className="fas fa-home me-1"></i>Trang chủ
                                        </a>
                                    </li>
                                    <li className="breadcrumb-item active text-white">Thông tin cá nhân</li>
                                </ol>
                            </nav>
                        </div>
                    </div>
                </div>
            </div>

            <div className="container py-5">
                <div className="row g-4">
                    {/* Sidebar với thiết kế card đẹp */}
                    <div className="col-lg-4 col-xl-3">
                        <div className="card border-0 shadow-lg rounded-4 overflow-hidden" style={{
                            background: 'linear-gradient(135deg, rgba(255,255,255,0.9) 0%, rgba(248,249,250,0.95) 100%)',
                            backdropFilter: 'blur(20px)'
                        }}>
                            {/* Profile Header */}
                            <div className="card-header border-0 text-center py-4" style={{
                                background: 'linear-gradient(135deg, #FDB5B9 0%, #F7A8B8 100%)'
                            }}>
                                <div className="position-relative d-inline-block mb-3">
                                    <img
                                        src={
                                            userInfo.imagePreview || (
                                                userInfo.imageUrl
                                                    ? userInfo.imageUrl.startsWith('http')
                                                        ? userInfo.imageUrl
                                                        : `http://localhost:8080/${userInfo.imageUrl.replace(/^\/?/, '')}`
                                                    : "/assets/img/default-avatar.jpg"
                                            )
                                        }
                                        alt="Ảnh đại diện"
                                        className="img-fluid rounded-circle border border-4 border-white shadow"
                                        style={{ width: "120px", height: "120px", objectFit: "cover" }}
                                    />
                                    <div className="position-absolute bottom-0 end-0 bg-success rounded-circle border border-3 border-white" style={{
                                        width: '24px',
                                        height: '24px'
                                    }}></div>
                                </div>
                                <h5 className="text-white fw-bold mb-1" style={{
                                    textShadow: '1px 1px 2px rgba(0,0,0,0.3)'
                                }}>
                                    {userInfo.fullName || userInfo.email}
                                </h5>
                                <p className="text-white-50 mb-0 small">
                                    <i className="fas fa-crown me-1"></i>Khách hàng
                                </p>
                            </div>

                            {/* Navigation Menu */}
                            <div className="card-body p-0">
                                <div className="list-group list-group-flush">
                                    <button
                                        className={`list-group-item list-group-item-action border-0 py-3 px-4 ${key === 'profile' ? 'active' : ''}`}
                                        onClick={() => setKey('profile')}
                                        style={{
                                            background: key === 'profile' ? 'linear-gradient(135deg, rgba(253, 181, 185, 0.2) 0%, rgba(247, 168, 184, 0.1) 100%)' : 'transparent',
                                            borderLeft: key === 'profile' ? '4px solid #FDB5B9' : '4px solid transparent',
                                            transition: 'all 0.3s ease'
                                        }}
                                    >
                                        <i className="fas fa-user me-3 text-" style={{ color: '#FDB5B9', width: '20px' }}></i>
                                        <span className="fw-medium text-dark">Thông tin cá nhân</span>
                                    </button>
                                    <button
                                        className={`list-group-item list-group-item-action border-0 py-3 px-4 ${key === 'password' ? 'active' : ''}`}
                                        onClick={() => setKey('password')}
                                        style={{
                                            background: key === 'password' ? 'linear-gradient(135deg, rgba(253, 181, 185, 0.2) 0%, rgba(247, 168, 184, 0.1) 100%)' : 'transparent',
                                            borderLeft: key === 'password' ? '4px solid #FDB5B9' : '4px solid transparent',
                                            transition: 'all 0.3s ease'
                                        }}
                                    >
                                        <i className="fas fa-lock me-3" style={{ color: '#FDB5B9', width: '20px' }}></i>
                                        <span className="fw-medium text-dark">Đổi mật khẩu</span>
                                    </button>
                                </div>
                            </div>

                            {/* Logout Button */}
                            <div className="card-footer border-0 p-4" style={{
                                background: 'linear-gradient(135deg, rgba(248,249,250,0.8) 0%, rgba(233,236,239,0.6) 100%)'
                            }}>
                                <button
                                    className={`btn w-100 py-3 rounded-3 border-0 fw-medium ${isLoggingOut ? 'disabled' : ''}`}
                                    onClick={handleLogout}
                                    disabled={isLoggingOut}
                                    style={{
                                        background: 'linear-gradient(135deg, #dc3545 0%, #c82333 100%)',
                                        color: 'white',
                                        transition: 'all 0.3s ease',
                                        opacity: isLoggingOut ? 0.6 : 1,
                                        transform: isLoggingOut ? 'scale(0.98)' : 'scale(1)'
                                    }}
                                    onMouseEnter={(e) => {
                                        if (!isLoggingOut) {
                                            e.target.style.transform = 'translateY(-2px)';
                                            e.target.style.boxShadow = '0 8px 25px rgba(220, 53, 69, 0.3)';
                                        }
                                    }}
                                    onMouseLeave={(e) => {
                                        e.target.style.transform = 'translateY(0)';
                                        e.target.style.boxShadow = 'none';
                                    }}
                                >
                                    {isLoggingOut ? (
                                        <>
                                            <div className="spinner-border spinner-border-sm me-2" role="status">
                                                <span className="visually-hidden">Loading...</span>
                                            </div>
                                            Đang đăng xuất...
                                        </>
                                    ) : (
                                        <>
                                            <i className="fas fa-sign-out-alt me-2"></i>
                                            Đăng xuất
                                        </>
                                    )}
                                </button>
                            </div>
                        </div>
                    </div>

                    {/* Main Content */}
                    <div className="col-lg-8 col-xl-9">
                        <div className="card border-0 shadow-lg rounded-4 overflow-hidden">
                            <Tab.Container activeKey={key} onSelect={(k) => setKey(k)}>
                                <Tab.Content>
                                    {/* Profile Tab */}
                                    <Tab.Pane eventKey="profile">
                                        <div className="card-header border-0 py-4" style={{
                                            background: 'linear-gradient(135deg, rgba(253, 181, 185, 0.1) 0%, rgba(247, 168, 184, 0.05) 100%)'
                                        }}>
                                            <h4 className="mb-0 fw-bold d-flex align-items-center">
                                                <i className="fas fa-user-edit me-3" style={{ color: '#FDB5B9' }}></i>
                                                Thông tin cá nhân
                                            </h4>
                                            <p className="text-muted mb-0 mt-2">Cập nhật thông tin cá nhân của bạn</p>
                                        </div>
                                        <div className="card-body p-5">
                                            <form onSubmit={handleProfileSubmit}>
                                                <div className="row g-4">
                                                    <div className="col-md-6">
                                                        <label className="form-label fw-bold mb-3">
                                                            <i className="fas fa-signature me-2" style={{ color: '#FDB5B9' }}></i>
                                                            Họ và tên
                                                        </label>
                                                        <input
                                                            type="text"
                                                            className="form-control form-control-lg rounded-3 border-2"
                                                            name="fullName"
                                                            value={userInfo.fullName}
                                                            onChange={handleProfileChange}
                                                            placeholder="Nhập họ và tên"
                                                            style={{
                                                                borderColor: '#e9ecef',
                                                                fontSize: '1rem',
                                                                transition: 'all 0.3s ease'
                                                            }}
                                                            onFocus={(e) => {
                                                                e.target.style.borderColor = '#FDB5B9';
                                                                e.target.style.boxShadow = '0 0 0 0.2rem rgba(253, 181, 185, 0.25)';
                                                            }}
                                                            onBlur={(e) => {
                                                                e.target.style.borderColor = '#e9ecef';
                                                                e.target.style.boxShadow = 'none';
                                                            }}
                                                        />
                                                    </div>
                                                    <div className="col-md-6">
                                                        <label className="form-label fw-bold mb-3">
                                                            <i className="fas fa-envelope me-2" style={{ color: '#FDB5B9' }}></i>
                                                            Email
                                                        </label>
                                                        <input
                                                            type="email"
                                                            className="form-control form-control-lg rounded-3 border-2"
                                                            name="email"
                                                            value={userInfo.email}
                                                            onChange={handleProfileChange}
                                                            placeholder="Nhập email"
                                                            style={{
                                                                borderColor: '#e9ecef',
                                                                fontSize: '1rem',
                                                                transition: 'all 0.3s ease'
                                                            }}
                                                            onFocus={(e) => {
                                                                e.target.style.borderColor = '#FDB5B9';
                                                                e.target.style.boxShadow = '0 0 0 0.2rem rgba(253, 181, 185, 0.25)';
                                                            }}
                                                            onBlur={(e) => {
                                                                e.target.style.borderColor = '#e9ecef';
                                                                e.target.style.boxShadow = 'none';
                                                            }}
                                                        />
                                                    </div>
                                                    <div className="col-md-6">
                                                        <label className="form-label fw-bold mb-3">
                                                            <i className="fas fa-phone me-2" style={{ color: '#FDB5B9' }}></i>
                                                            Số điện thoại
                                                        </label>
                                                        <input
                                                            type="tel"
                                                            className="form-control form-control-lg rounded-3 border-2"
                                                            name="phone"
                                                            value={userInfo.phone}
                                                            onChange={handleProfileChange}
                                                            placeholder="Nhập số điện thoại"
                                                            style={{
                                                                borderColor: '#e9ecef',
                                                                fontSize: '1rem',
                                                                transition: 'all 0.3s ease'
                                                            }}
                                                            onFocus={(e) => {
                                                                e.target.style.borderColor = '#FDB5B9';
                                                                e.target.style.boxShadow = '0 0 0 0.2rem rgba(253, 181, 185, 0.25)';
                                                            }}
                                                            onBlur={(e) => {
                                                                e.target.style.borderColor = '#e9ecef';
                                                                e.target.style.boxShadow = 'none';
                                                            }}
                                                        />
                                                    </div>
                                                    <div className="col-md-6">
                                                        <label className="form-label fw-bold mb-3">
                                                            <i className="fas fa-map-marker-alt me-2" style={{ color: '#FDB5B9' }}></i>
                                                            Địa chỉ
                                                        </label>
                                                        <input
                                                            type="text"
                                                            className="form-control form-control-lg rounded-3 border-2"
                                                            name="address"
                                                            value={userInfo.address}
                                                            onChange={handleProfileChange}
                                                            placeholder="Nhập địa chỉ"
                                                            style={{
                                                                borderColor: '#e9ecef',
                                                                fontSize: '1rem',
                                                                transition: 'all 0.3s ease'
                                                            }}
                                                            onFocus={(e) => {
                                                                e.target.style.borderColor = '#FDB5B9';
                                                                e.target.style.boxShadow = '0 0 0 0.2rem rgba(253, 181, 185, 0.25)';
                                                            }}
                                                            onBlur={(e) => {
                                                                e.target.style.borderColor = '#e9ecef';
                                                                e.target.style.boxShadow = 'none';
                                                            }}
                                                        />
                                                    </div>
                                                    <div className="col-12">
                                                        <label className="form-label fw-bold mb-3">
                                                            <i className="fas fa-camera me-2" style={{ color: '#FDB5B9' }}></i>
                                                            Ảnh đại diện
                                                        </label>
                                                        <input
                                                            type="file"
                                                            className="form-control form-control-lg rounded-3 border-2"
                                                            name="imageFile"
                                                            onChange={handleProfileChange}
                                                            accept="image/*"
                                                            style={{
                                                                borderColor: '#e9ecef',
                                                                fontSize: '1rem',
                                                                transition: 'all 0.3s ease'
                                                            }}
                                                            onFocus={(e) => {
                                                                e.target.style.borderColor = '#FDB5B9';
                                                                e.target.style.boxShadow = '0 0 0 0.2rem rgba(253, 181, 185, 0.25)';
                                                            }}
                                                            onBlur={(e) => {
                                                                e.target.style.borderColor = '#e9ecef';
                                                                e.target.style.boxShadow = 'none';
                                                            }}
                                                        />
                                                        <small className="text-muted d-block mt-2">
                                                            <i className="fas fa-info-circle me-1"></i>
                                                            Chọn file ảnh (JPG, PNG, GIF) tối đa 5MB
                                                        </small>
                                                    </div>
                                                </div>
                                                <div className="mt-5 d-flex justify-content-end">
                                                    <button 
                                                        type="submit" 
                                                        className="btn btn-lg px-5 py-3 rounded-3 border-0 fw-bold"
                                                        disabled={isUpdatingProfile}
                                                        style={{
                                                            background: 'linear-gradient(135deg, #FDB5B9 0%, #F7A8B8 100%)',
                                                            color: 'white',
                                                            fontSize: '1.1rem',
                                                            transition: 'all 0.3s ease',
                                                            opacity: isUpdatingProfile ? 0.7 : 1
                                                        }}
                                                        onMouseEnter={(e) => {
                                                            if (!isUpdatingProfile) {
                                                                e.target.style.transform = 'translateY(-2px)';
                                                                e.target.style.boxShadow = '0 8px 25px rgba(253, 181, 185, 0.4)';
                                                            }
                                                        }}
                                                        onMouseLeave={(e) => {
                                                            e.target.style.transform = 'translateY(0)';
                                                            e.target.style.boxShadow = 'none';
                                                        }}
                                                    >
                                                        {isUpdatingProfile ? (
                                                            <>
                                                                <div className="spinner-border spinner-border-sm me-2" role="status">
                                                                    <span className="visually-hidden">Loading...</span>
                                                                </div>
                                                                Đang cập nhật...
                                                            </>
                                                        ) : (
                                                            <>
                                                                <i className="fas fa-save me-2"></i>
                                                                Cập nhật thông tin
                                                            </>
                                                        )}
                                                    </button>
                                                </div>
                                            </form>
                                        </div>
                                    </Tab.Pane>

                                    {/* Password Tab */}
                                    <Tab.Pane eventKey="password">
                                        <div className="card-header border-0 py-4" style={{
                                            background: 'linear-gradient(135deg, rgba(253, 181, 185, 0.1) 0%, rgba(247, 168, 184, 0.05) 100%)'
                                        }}>
                                            <h4 className="mb-0 fw-bold d-flex align-items-center">
                                                <i className="fas fa-key me-3" style={{ color: '#FDB5B9' }}></i>
                                                Đổi mật khẩu
                                            </h4>
                                            <p className="text-muted mb-0 mt-2">Cập nhật mật khẩu để bảo mật tài khoản</p>
                                        </div>
                                        <div className="card-body p-5">
                                            <form onSubmit={handlePasswordSubmit}>
                                                <div className="row g-4">
                                                    <div className="col-12">
                                                        <label className="form-label fw-bold mb-3">
                                                            <i className="fas fa-lock me-2" style={{ color: '#FDB5B9' }}></i>
                                                            Mật khẩu hiện tại
                                                        </label>
                                                        <input
                                                            type="password"
                                                            className="form-control form-control-lg rounded-3 border-2"
                                                            name="oldPassword"
                                                            value={passwordInfo.oldPassword}
                                                            onChange={handlePasswordChange}
                                                            placeholder="Nhập mật khẩu hiện tại"
                                                            required
                                                            style={{
                                                                borderColor: '#e9ecef',
                                                                fontSize: '1rem',
                                                                transition: 'all 0.3s ease'
                                                            }}
                                                            onFocus={(e) => {
                                                                e.target.style.borderColor = '#FDB5B9';
                                                                e.target.style.boxShadow = '0 0 0 0.2rem rgba(253, 181, 185, 0.25)';
                                                            }}
                                                            onBlur={(e) => {
                                                                e.target.style.borderColor = '#e9ecef';
                                                                e.target.style.boxShadow = 'none';
                                                            }}
                                                        />
                                                    </div>
                                                    <div className="col-md-6">
                                                        <label className="form-label fw-bold mb-3">
                                                            <i className="fas fa-key me-2" style={{ color: '#FDB5B9' }}></i>
                                                            Mật khẩu mới
                                                        </label>
                                                        <input
                                                            type="password"
                                                            className="form-control form-control-lg rounded-3 border-2"
                                                            name="newPassword"
                                                            value={passwordInfo.newPassword}
                                                            onChange={handlePasswordChange}
                                                            placeholder="Nhập mật khẩu mới"
                                                            required
                                                            style={{
                                                                borderColor: '#e9ecef',
                                                                fontSize: '1rem',
                                                                transition: 'all 0.3s ease'
                                                            }}
                                                            onFocus={(e) => {
                                                                e.target.style.borderColor = '#FDB5B9';
                                                                e.target.style.boxShadow = '0 0 0 0.2rem rgba(253, 181, 185, 0.25)';
                                                            }}
                                                            onBlur={(e) => {
                                                                e.target.style.borderColor = '#e9ecef';
                                                                e.target.style.boxShadow = 'none';
                                                            }}
                                                        />
                                                    </div>
                                                    <div className="col-md-6">
                                                        <label className="form-label fw-bold mb-3">
                                                            <i className="fas fa-check-circle me-2" style={{ color: '#FDB5B9' }}></i>
                                                            Xác nhận mật khẩu mới
                                                        </label>
                                                        <input
                                                            type="password"
                                                            className="form-control form-control-lg rounded-3 border-2"
                                                            name="confirmPassword"
                                                            value={passwordInfo.confirmPassword}
                                                            onChange={handlePasswordChange}
                                                            placeholder="Nhập lại mật khẩu mới"
                                                            required
                                                            style={{
                                                                borderColor: '#e9ecef',
                                                                fontSize: '1rem',
                                                                transition: 'all 0.3s ease'
                                                            }}
                                                            onFocus={(e) => {
                                                                e.target.style.borderColor = '#FDB5B9';
                                                                e.target.style.boxShadow = '0 0 0 0.2rem rgba(253, 181, 185, 0.25)';
                                                            }}
                                                            onBlur={(e) => {
                                                                e.target.style.borderColor = '#e9ecef';
                                                                e.target.style.boxShadow = 'none';
                                                            }}
                                                        />
                                                    </div>
                                                </div>
                                                
                                                {/* Password requirements */}
                                                <div className="alert alert-info bg-transparent border-info mt-4">
                                                    <div className="d-flex align-items-start">
                                                        <i className="fas fa-info-circle me-2 mt-1 text-info"></i>
                                                        <div>
                                                            <strong>Yêu cầu mật khẩu:</strong>
                                                            <ul className="mb-0 mt-2" style={{ fontSize: '0.9rem' }}>
                                                                <li>Ít nhất 8 ký tự</li>
                                                                <li>Bao gồm chữ hoa và chữ thường</li>
                                                                <li>Ít nhất 1 số và 1 ký tự đặc biệt</li>
                                                            </ul>
                                                        </div>
                                                    </div>
                                                </div>

                                                <div className="mt-5 d-flex justify-content-end">
                                                    <button 
                                                        type="submit" 
                                                        className="btn btn-lg px-5 py-3 rounded-3 border-0 fw-bold"
                                                        disabled={isChangingPassword}
                                                        style={{
                                                            background: 'linear-gradient(135deg, #28a745 0%, #20c997 100%)',
                                                            color: 'white',
                                                            fontSize: '1.1rem',
                                                            transition: 'all 0.3s ease',
                                                            opacity: isChangingPassword ? 0.7 : 1
                                                        }}
                                                        onMouseEnter={(e) => {
                                                            if (!isChangingPassword) {
                                                                e.target.style.transform = 'translateY(-2px)';
                                                                e.target.style.boxShadow = '0 8px 25px rgba(40, 167, 69, 0.4)';
                                                            }
                                                        }}
                                                        onMouseLeave={(e) => {
                                                            e.target.style.transform = 'translateY(0)';
                                                            e.target.style.boxShadow = 'none';
                                                        }}
                                                    >
                                                        {isChangingPassword ? (
                                                            <>
                                                                <div className="spinner-border spinner-border-sm me-2" role="status">
                                                                    <span className="visually-hidden">Loading...</span>
                                                                </div>
                                                                Đang đổi mật khẩu...
                                                            </>
                                                        ) : (
                                                            <>
                                                                <i className="fas fa-shield-alt me-2"></i>
                                                                Đổi mật khẩu
                                                            </>
                                                        )}
                                                    </button>
                                                </div>
                                            </form>
                                        </div>
                                    </Tab.Pane>
                                </Tab.Content>
                            </Tab.Container>
                        </div>
                    </div>
                </div>
            </div>

            <Footer />
        </>
    );
};

export default CustomerDetail;