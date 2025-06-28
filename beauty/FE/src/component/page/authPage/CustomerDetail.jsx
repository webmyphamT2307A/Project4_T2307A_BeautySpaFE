import React, { useState, useEffect } from 'react';
import { Tab } from 'react-bootstrap';
import axios from 'axios';
import Header from "../../shared/header";
import Footer from "../../shared/footer";

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
        // eslint-disable-next-line react-hooks/exhaustive-deps
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

    if (loading) {
        return <div className="text-center p-5">Đang tải...</div>;
    }

    return (
        <>
            <Header />
            <style jsx>{`
                .profile-container {
                    background: url('/assets/img/user-bg.jpg') no-repeat center center fixed;
                    min-height: 100vh;
                    padding: 2rem 0;
                    // backdrop-filter: blur(5px);
                }
                
                .profile-breadcrumb {
                    // background: rgba(253, 181, 185, 0.1);
                    // backdrop-filter: blur(10px);
                    border-radius: 15px;
                    padding: 1.5rem;
                    margin-bottom: 2rem;
                }
                
                .profile-card {
                    padding: 2.7rem 1rem !important;
                    background: white;
                    border-radius: 20px;
                    box-shadow: 0 10px 30px rgba(253, 181, 185, 0.3);
                    border: none;
                    overflow: hidden;
                    transition: all 0.3s ease;
                }
                
                .profile-card:hover {
                    transform: translateY(-5px);
                    box-shadow: 0 20px 40px rgba(253, 181, 185, 0.4);
                }
                
                .sidebar-card {
                    background: white;
                    border-radius: 20px;
                    box-shadow: 0 10px 30px rgba(253, 181, 185, 0.2);
                    padding: 2.27rem;
                    border: none;
                }
                
                .avatar-container {
                    position: relative;
                    display: inline-block;
                    margin-bottom: 1.5rem;
                }
                
                .avatar-image {
                    width: 120px;
                    height: 120px;
                    border-radius: 50%;
                    object-fit: cover;
                    border: 4px solid #FDB5B9;
                    box-shadow: 0 8px 25px rgba(253, 181, 185, 0.3);
                    transition: all 0.3s ease;
                }
                
                .avatar-image:hover {
                    transform: scale(1.05);
                    box-shadow: 0 12px 35px rgba(253, 181, 185, 0.5);
                }
                
                .navs-item {
                    margin-bottom: 0.5rem;
                    border-radius: 12px;
                    overflow: hidden;
                    transition: all 0.3s ease;
                }
                
                .navs-link {
                    color: #666;
                    border: none;
                    background: none;
                    padding: 1rem 1.5rem;
                    border-radius: 12px;
                    font-weight: 500;
                    transition: all 0.3s ease;
                    display: flex;
                    align-items: center;
                    text-decoration: none;
                    width: 100%;
                    text-align: left;
                }
                
                .navs-link i {
                    margin-right: 0.75rem;
                    font-size: 1.1rem;
                    width: 20px;
                }
                
                .navs-link:hover {
                    background: linear-gradient(135deg,rgb(255, 152, 157),rgb(251, 150, 155));
                    color: white;
                    transform: translateX(5px);
                }
                
                .navs-link.active {
                    background: linear-gradient(135deg,rgb(250, 162, 166),rgb(254, 168, 173));
                    color: white;
                    box-shadow: 0 5px 15px rgba(253, 181, 185, 0.4);
                }
                
                .logout-link {
                    color: #dc3545;
                    border: 1px solid #dc3545;
                    background: white;
                }
                
                .logout-link:hover {
                    background: #dc3545;
                    color: white;
                }
                
                .form-floating {
                    margin-bottom: 2.7rem;
                }
                
                .form-floating .form-control {
                    border: 2px solid #f0f0f0;
                    border-radius: 12px;
                    padding: 1rem 0.75rem;
                    height: calc(3.5rem + 2px);
                    transition: all 0.3s ease;
                }
                
                .form-floating .form-control:focus {
                    border-color: #FDB5B9;
                    box-shadow: 0 0 0 0.2rem rgba(253, 181, 185, 0.25);
                }
                
                .form-floating label {
                    color: #999;
                    font-weight: 500;
                }
                
                .btn-primarys {
                    background: linear-gradient(135deg,rgb(250, 162, 166),rgb(254, 168, 173));
                    border: none;
                    color: black;
                    border-radius: 12px;
                    padding: 0.75rem 2rem;
                    font-weight: 600;
                    transition: all 0.3s ease;
                }
                
                .btn-primarys:hover {
                    background: linear-gradient(135deg,rgb(255, 152, 157),rgb(251, 150, 155));              
                    color: black;
                    transform: translateY(-2px);
                    box-shadow: 0 8px 25px rgba(253, 181, 185, 0.4);
                }
                
                .alert {
                    border: none;
                    border-radius: 12px;
                    padding: 1rem 1.5rem;
                    margin-bottom: 1.5rem;
                }
                
                .alert-success {
                    background: linear-gradient(135deg, #d4edda, #c3e6cb);
                    color: #155724;
                }
                
                .alert-danger {
                    background: linear-gradient(135deg, #f8d7da, #f5c6cb);
                    color: #721c24;
                }
                
                .content-header {
                    color: #333;
                    font-weight: 700;
                    margin-bottom: 2rem;
                    position: relative;
                    padding-bottom: 0.5rem;
                }
                
                .content-header::after {
                    content: '';
                    position: absolute;
                    bottom: 0;
                    left: 0;
                    width: 50px;
                    height: 3px;
                    background: linear-gradient(135deg, #FDB5B9,rgb(254, 176, 181));
                    border-radius: 2px;
                }
                
                .file-upload-wrapper {
                    position: relative;
                    overflow: hidden;
                    display: inline-block;
                    width: 100%;
                    margin-bottom: 1.5rem;
                }
                
                .file-upload-input {
                    position: absolute;
                    left: -9999px;
                }
                
                .file-upload-label {
                    display: block;
                    padding: 0.75rem 1rem;
                    border: 2px dashed #FDB5B9;
                    border-radius: 12px;
                    text-align: center;
                    cursor: pointer;
                    transition: all 0.3s ease;
                    background: rgba(253, 181, 185, 0.05);
                }
                
                .file-upload-label:hover {
                    background: rgba(253, 181, 185, 0.1);
                    border-color: #FF9CA3;
                }
                
                .username-display {
                    color: #333;
                    font-weight: 600;
                    font-size: 1.2rem;
                    margin-top: 1rem;
                }
                
                .breadcrumb-text {
                    color: black;
                    text-shadow: 0 2px 4px rgba(0,0,0,0.3);
                }
            `}</style>

            <div className="profile-container">
                <div className="container">
                    <div className="profile-breadcrumb text-center">
                        <h2 className="breadcrumb-text mb-3">
                            <i className="fas fa-user-circle me-2"></i>
                            Thông tin tài khoản
                        </h2>
                        <nav>
                            <ol className="breadcrumb justify-content-center mb-0">
                                <li className="breadcrumb-item">
                                    <a href="/" className="text-">
                                        <i className="fas fa-home me-1"></i>Trang chủ
                                    </a>
                                </li>
                                <li className="breadcrumb-item active breadcrumb-text">Thông tin cá nhân</li>
                            </ol>
                        </nav>
                    </div>

                    <div className="row g-4">
                        <div className="col-lg-4 col-md-12">
                            <div className="sidebar-card">
                                <div className="text-center mb-4">
                                    <div className="avatar-container">
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
                                            className="avatar-image"
                                        />
                                    </div>
                                    <h4 className="username-display">{userInfo.fullName || userInfo.email}</h4>
                                    <p className="text-muted mb-0">
                                        <i className="fas fa-envelope me-2"></i>
                                        {userInfo.email}
                                    </p>
                                </div>

                                <nav className="navs flex-column">
                                    <div className="navs-item">
                                        <button
                                            type="button"
                                            className={`navs-link ${key === 'profile' ? 'active' : ''}`}
                                            onClick={() => setKey('profile')}
                                        >
                                            <i className="fas fa-user"></i>
                                            Thông tin cá nhân
                                        </button>
                                    </div>
                                    <div className="navs-item">
                                        <button
                                            type="button"
                                            className={`navs-link ${key === 'password' ? 'active' : ''}`}
                                            onClick={() => setKey('password')}
                                        >
                                            <i className="fas fa-lock"></i>
                                            Đổi mật khẩu
                                        </button>
                                    </div>
                                    <div className="navs-item mt-3">
                                        <button
                                            type="button"
                                            className={`navs-link logout-link ${isLoggingOut ? 'disabled' : ''}`}
                                            onClick={handleLogout}
                                            disabled={isLoggingOut}
                                            style={{
                                                opacity: isLoggingOut ? 0.6 : 1,
                                                cursor: isLoggingOut ? 'not-allowed' : 'pointer'
                                            }}
                                        >
                                            {isLoggingOut ? (
                                                <>
                                                    <i className="fas fa-spinner fa-spin"></i>
                                                    Đang đăng xuất...
                                                </>
                                            ) : (
                                                <>
                                                    <i className="fas fa-sign-out-alt"></i>
                                                    Đăng xuất
                                                </>
                                            )}
                                        </button>
                                    </div>
                                </nav>
                            </div>
                        </div>

                        <div className="col-lg-8 col-md-12">
                            <div className="profile-card p-4">
                                {message.content && (
                                    <div className={`alert alert-${message.type}`} role="alert">
                                        <i className={`fas ${message.type === 'success' ? 'fa-check-circle' : 'fa-exclamation-circle'} me-2`}></i>
                                        {message.content}
                                    </div>
                                )}

                                <Tab.Container activeKey={key} onSelect={(k) => setKey(k)}>
                                    <Tab.Content>
                                        <Tab.Pane eventKey="profile">
                                            <h3 className="content-header">
                                                <i className="fas fa-user-edit me-2"></i>
                                                Thông tin cá nhân
                                            </h3>
                                            <form onSubmit={handleProfileSubmit}>
                                                <div className="row">
                                                    <div className="col-md-6">
                                                        <div className="form-floating">
                                                            <input
                                                                type="text"
                                                                className="form-control"
                                                                id="fullName"
                                                                name="fullName"
                                                                value={userInfo.fullName}
                                                                onChange={handleProfileChange}
                                                                placeholder="Họ tên"
                                                            />
                                                            <label htmlFor="fullName">
                                                                <i className="fas fa-user me-2"></i>Họ tên
                                                            </label>
                                                        </div>
                                                    </div>
                                                    <div className="col-md-6">
                                                        <div className="form-floating">
                                                            <input
                                                                type="email"
                                                                className="form-control"
                                                                id="email"
                                                                name="email"
                                                                value={userInfo.email}
                                                                onChange={handleProfileChange}
                                                                placeholder="Email"
                                                            />
                                                            <label htmlFor="email">
                                                                <i className="fas fa-envelope me-2"></i>Email
                                                            </label>
                                                        </div>
                                                    </div>
                                                </div>
                                                <div className="row">
                                                    <div className="col-md-6">
                                                        <div className="form-floating">
                                                            <input
                                                                type="tel"
                                                                className="form-control"
                                                                id="phone"
                                                                name="phone"
                                                                value={userInfo.phone}
                                                                onChange={handleProfileChange}
                                                                placeholder="Số điện thoại"
                                                            />
                                                            <label htmlFor="phone">
                                                                <i className="fas fa-phone me-2"></i>Số điện thoại
                                                            </label>
                                                        </div>
                                                    </div>
                                                    <div className="col-md-6">
                                                        <div className="form-floating">
                                                            <input
                                                                type="text"
                                                                className="form-control"
                                                                id="address"
                                                                name="address"
                                                                value={userInfo.address}
                                                                onChange={handleProfileChange}
                                                                placeholder="Địa chỉ"
                                                            />
                                                            <label htmlFor="address">
                                                                <i className="fas fa-map-marker-alt me-2"></i>Địa chỉ
                                                            </label>
                                                        </div>
                                                    </div>
                                                </div>
                                                <div className="file-upload-wrapper">
                                                    <input
                                                        type="file"
                                                        className="file-upload-input"
                                                        id="imageFile"
                                                        name="imageFile"
                                                        onChange={handleProfileChange}
                                                        accept="image/*"
                                                    />
                                                    <label htmlFor="imageFile" className="file-upload-label">
                                                        <i className="fas fa-camera me-2"></i>
                                                        Chọn ảnh đại diện mới
                                                        <small className="d-block text-muted mt-1">
                                                            Định dạng: JPG, PNG, GIF (Tối đa 5MB)
                                                        </small>
                                                    </label>
                                                </div>
                                                <div className="d-grid">
                                                    <button type="submit" className="btn btn-primarys">
                                                        <i className="fas fa-save me-2"></i>
                                                        Cập nhật thông tin
                                                    </button>
                                                </div>
                                            </form>
                                        </Tab.Pane>

                                        <Tab.Pane eventKey="password">
                                            <h3 className="content-header">
                                                <i className="fas fa-key me-2"></i>
                                                Đổi mật khẩu
                                            </h3>
                                            <form onSubmit={handlePasswordSubmit}>
                                                <div className="form-floating">
                                                    <input
                                                        type="password"
                                                        className="form-control"
                                                        id="oldPassword"
                                                        name="oldPassword"
                                                        value={passwordInfo.oldPassword}
                                                        onChange={handlePasswordChange}
                                                        placeholder="Mật khẩu hiện tại"
                                                        required
                                                    />
                                                    <label htmlFor="oldPassword">
                                                        <i className="fas fa-lock me-2"></i>Mật khẩu hiện tại
                                                    </label>
                                                </div>
                                                <div className="form-floating">
                                                    <input
                                                        type="password"
                                                        className="form-control"
                                                        id="newPassword"
                                                        name="newPassword"
                                                        value={passwordInfo.newPassword}
                                                        onChange={handlePasswordChange}
                                                        placeholder="Mật khẩu mới"
                                                        required
                                                    />
                                                    <label htmlFor="newPassword">
                                                        <i className="fas fa-key me-2"></i>Mật khẩu mới
                                                    </label>
                                                </div>
                                                <div className="form-floating">
                                                    <input
                                                        type="password"
                                                        className="form-control"
                                                        id="confirmPassword"
                                                        name="confirmPassword"
                                                        value={passwordInfo.confirmPassword}
                                                        onChange={handlePasswordChange}
                                                        placeholder="Xác nhận mật khẩu mới"
                                                        required
                                                    />
                                                    <label htmlFor="confirmPassword">
                                                        <i className="fas fa-check me-2"></i>Xác nhận mật khẩu mới
                                                    </label>
                                                </div>
                                                <div className="d-grid">
                                                    <button type="submit" className="btn btn-primarys">
                                                        <i className="fas fa-shield-alt me-2"></i>
                                                        Đổi mật khẩu
                                                    </button>
                                                </div>
                                            </form>
                                        </Tab.Pane>
                                    </Tab.Content>
                                </Tab.Container>
                            </div>
                        </div>
                    </div>
                </div>
            </div>


            <Footer />
        </>
    );
};

export default CustomerDetail;