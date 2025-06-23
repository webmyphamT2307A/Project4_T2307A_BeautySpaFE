import React, { useState, useEffect } from 'react';
import { Tab, Nav } from 'react-bootstrap';
import axios from 'axios';
import Header from "../../shared/header";
import Footer from "../../shared/footer";
import sessionManager from '../../../utils/sessionManager';

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
                fetchServiceHistory(parsedUser.id, parsedUser.token); // Sử dụng customerId
            } catch (error) {
                localStorage.removeItem('userInfo');
                window.location.href = '/';
            }
        } else {
            window.location.href = '/';
        }
        
        // Cleanup function to revoke preview URLs
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
            setMessage({ type: 'danger', content: 'Không thể tải thông tin người dùng!' });
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
                // Create preview URL for immediate display
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
        setMessage({ type: '', content: '' });

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
                
                // Dispatch custom event to notify Header component
                window.dispatchEvent(new CustomEvent('userInfoUpdated'));
                
                setMessage({ type: 'success', content: 'Cập nhật thông tin thành công!' });
                
                // Update local state to show new image immediately
                setUserInfo(prev => ({ ...prev, imageUrl: response.data.data.imageUrl || prev.imageUrl }));
            } else {
                setMessage({ type: 'danger', content: 'Có lỗi xảy ra!' });
            }
        } catch (error) {
            setMessage({ type: 'danger', content: 'Có lỗi xảy ra khi cập nhật thông tin!' });
        }
    };

    const handlePasswordSubmit = async (e) => {
        e.preventDefault();
        setMessage({ type: '', content: '' });

        if (passwordInfo.newPassword !== passwordInfo.confirmPassword) {
            setMessage({ type: 'danger', content: 'Mật khẩu mới và xác nhận mật khẩu không khớp!' });
            return;
        }

        try {
            const response = await axios.put(
                `http://localhost:8080/api/v1/customer/change-password/${user.id}`,
                passwordInfo,
                { headers: { 'Authorization': `Bearer ${user.token}` } }
            );
            if (response.data && response.data.status === 'SUCCESS') {
                setMessage({ type: 'success', content: 'Đổi mật khẩu thành công!' });
                setPasswordInfo({ oldPassword: '', newPassword: '', confirmPassword: '' });
            } else {
                setMessage({ type: 'danger', content: 'Đổi mật khẩu thất bại!' });
            }
        } catch (error) {
            setMessage({ type: 'danger', content: 'Có lỗi xảy ra khi đổi mật khẩu!' });
        }
    };

    const handleLogout = () => {
        if (isLoggingOut) return; // Prevent multiple clicks
        
        setIsLoggingOut(true);
        
        // IMMEDIATE logout - no waiting, no async
        // Clear all user data instantly
        localStorage.removeItem('userInfo');
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        
        // Redirect immediately
        window.location.href = '/';
        
        // Call logout API in background after redirect (fire and forget)
        setTimeout(() => {
            if (user.token) {
                fetch('http://localhost:8080/api/v1/customer/logout', {
                    method: 'POST',
                    headers: { 
                        'Authorization': `Bearer ${user.token}`,
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify({})
                }).catch(error => {
                    console.error('Background logout API call failed:', error);
                });
            }
        }, 100);
    };

    const handleViewDetails = (history) => {
        setSelectedHistory(history);
    };

    const handleCloseDetails = () => {
        setSelectedHistory(null);
    };

    // Pagination calculations for service history
    const totalHistoryPages = Math.ceil(serviceHistory.length / historyPerPage);
    const startHistoryIndex = (currentHistoryPage - 1) * historyPerPage;
    const endHistoryIndex = startHistoryIndex + historyPerPage;
    const currentHistoryItems = serviceHistory.slice(startHistoryIndex, endHistoryIndex);

    // Handle history page change
    const handleHistoryPageChange = (pageNumber) => {
        setCurrentHistoryPage(pageNumber);
    };

    if (loading) {
        return <div className="text-center p-5">Đang tải...</div>;
    }

    return (
        <>
            <Header />
            <div className="container-fluid bg-breadcrumb py-5">
                <div className="container text-center py-5">
                    <h3 className="text-white display-3 mb-4">Thông tin tài khoản</h3>
                    <ol className="breadcrumb justify-content-center mb-0">
                        <li className="breadcrumb-item"><a href="/">Trang chủ</a></li>
                        <li className="breadcrumb-item active text-white">Thông tin cá nhân</li>
                    </ol>
                </div>
            </div>

            <div className="container py-5">
                <div className="row">
                    <div className="col-lg-3 mb-5">
                        <div className="bg-light p-4 rounded">
                            <div className="text-center mb-4">
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
                                    className="img-fluid rounded-circle"
                                    style={{ width: "150px", height: "150px", objectFit: "cover" }}
                                />
                                <h4 className="mt-3">{userInfo.fullName || userInfo.email}</h4>
                            </div>
                            <div className="list-group">
                                <a
                                    href="#"
                                    className={`list-group-item list-group-item-action ${key === 'profile' ? 'active' : ''}`}
                                    onClick={(e) => { e.preventDefault(); setKey('profile') }}
                                >
                                    Thông tin cá nhân
                                </a>
                                <a
                                    href="#"
                                    className={`list-group-item list-group-item-action ${key === 'password' ? 'active' : ''}`}
                                    onClick={(e) => { e.preventDefault(); setKey('password') }}
                                >
                                    Đổi mật khẩu
                                </a>
                               
                                <a
                                    href="#"
                                    className={`list-group-item list-group-item-action ${isLoggingOut ? 'disabled' : ''}`}
                                    onClick={(e) => { e.preventDefault(); handleLogout() }}
                                    style={{ 
                                        opacity: isLoggingOut ? 0.6 : 1,
                                        cursor: isLoggingOut ? 'not-allowed' : 'pointer'
                                    }}
                                >
                                    {isLoggingOut ? (
                                        <>
                                            <i className="fas fa-spinner fa-spin me-2"></i>
                                            Đang đăng xuất...
                                        </>
                                    ) : (
                                        <>
                                            <i className="fas fa-sign-out-alt me-2"></i>
                                            Đăng xuất
                                        </>
                                    )}
                                </a>
                            </div>
                        </div>
                    </div>
                    <div className="col-lg-9">
                        <div className="bg-light p-4 rounded">
                            {message.content && (
                                <div className={`alert alert-${message.type}`} role="alert">
                                    {message.content}
                                </div>
                            )}

                            <Tab.Container activeKey={key} onSelect={(k) => setKey(k)}>
                                <Tab.Content>
                                    <Tab.Pane eventKey="profile">
                                        <h4 className="mb-4">Thông tin cá nhân</h4>
                                        <form onSubmit={handleProfileSubmit}>
                                            <div className="row mb-3">
                                                <div className="col-md-6">
                                                    <label className="form-label">Họ tên</label>
                                                    <input
                                                        type="text"
                                                        className="form-control"
                                                        name="fullName"
                                                        value={userInfo.fullName}
                                                        onChange={handleProfileChange}
                                                    />
                                                </div>
                                                <div className="col-md-6">
                                                    <label className="form-label">Email</label>
                                                    <input
                                                        type="email"
                                                        className="form-control"
                                                        name="email"
                                                        value={userInfo.email}
                                                        onChange={handleProfileChange}
                                                    />
                                                </div>
                                            </div>
                                            <div className="row mb-3">
                                                <div className="col-md-6">
                                                    <label className="form-label">Số điện thoại</label>
                                                    <input
                                                        type="tel"
                                                        className="form-control"
                                                        name="phone"
                                                        value={userInfo.phone}
                                                        onChange={handleProfileChange}
                                                    />
                                                </div>
                                                <div className="col-md-6">
                                                    <label className="form-label">Địa chỉ</label>
                                                    <input
                                                        type="text"
                                                        className="form-control"
                                                        name="address"
                                                        value={userInfo.address}
                                                        onChange={handleProfileChange}
                                                    />
                                                </div>
                                            </div>
                                            <div className="mb-3">
                                                <label className="form-label">Link ảnh đại diện</label>
                                                <input
                                                    type="file"
                                                    className="form-control"
                                                    name="imageFile"
                                                    onChange={handleProfileChange}
                                                    accept="image/*"
                                                />
                                            </div>
                                            <button type="submit" className="btn btn-primary">Cập nhật thông tin</button>
                                        </form>
                                    </Tab.Pane>
                                    <Tab.Pane eventKey="password">
                                        <h4 className="mb-4">Đổi mật khẩu</h4>
                                        <form onSubmit={handlePasswordSubmit}>
                                            <div className="mb-3">
                                                <label className="form-label">Mật khẩu hiện tại</label>
                                                <input
                                                    type="password"
                                                    className="form-control"
                                                    name="oldPassword"
                                                    value={passwordInfo.oldPassword}
                                                    onChange={handlePasswordChange}
                                                    required
                                                />
                                            </div>
                                            <div className="mb-3">
                                                <label className="form-label">Mật khẩu mới</label>
                                                <input
                                                    type="password"
                                                    className="form-control"
                                                    name="newPassword"
                                                    value={passwordInfo.newPassword}
                                                    onChange={handlePasswordChange}
                                                    required
                                                />
                                            </div>
                                            <div className="mb-3">
                                                <label className="form-label">Xác nhận mật khẩu mới</label>
                                                <input
                                                    type="password"
                                                    className="form-control"
                                                    name="confirmPassword"
                                                    value={passwordInfo.confirmPassword}
                                                    onChange={handlePasswordChange}
                                                    required
                                                />
                                            </div>
                                            <button type="submit" className="btn btn-primary">Đổi mật khẩu</button>
                                        </form>
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