import React, { useState, useEffect, useRef } from 'react';
import axios from 'axios';
// Import thêm Link, useNavigate và useLocation từ react-router-dom
import { Link, useNavigate, useLocation } from 'react-router-dom';
import sessionManager from '../../utils/sessionManager';
import SessionTimer from './SessionTimer';

const Header = () => {
    // Khởi tạo hook useNavigate và useLocation
    const navigate = useNavigate();
    const location = useLocation();

    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [registerInfo, setRegisterInfo] = useState({
        fullName: '',
        email: '',
        password: '',
        phone: '',
        address: ''
    });
    const [registerMessage, setRegisterMessage] = useState('');
    const [userInfo, setUserInfo] = useState(null);

    useEffect(() => {
        const storedUser = localStorage.getItem('userInfo');
        if (storedUser) {
            setUserInfo(JSON.parse(storedUser));
        }

        // Fetch services data for search
        fetchServicesData();

        // Listen for localStorage changes to update userInfo immediately
        const handleStorageChange = (e) => {
            if (e.key === 'userInfo') {
                if (e.newValue) {
                    setUserInfo(JSON.parse(e.newValue));
                } else {
                    setUserInfo(null);
                }
            }
        };

        // Listen for custom userInfo update events
        const handleUserInfoUpdate = (e) => {
            const updatedUser = localStorage.getItem('userInfo');
            if (updatedUser) {
                setUserInfo(JSON.parse(updatedUser));
            }
        };

        window.addEventListener('storage', handleStorageChange);
        window.addEventListener('userInfoUpdated', handleUserInfoUpdate);

        return () => {
            window.removeEventListener('storage', handleStorageChange);
            window.removeEventListener('userInfoUpdated', handleUserInfoUpdate);
        };
    }, []);

    // Fetch services data
    const fetchServicesData = async () => {
        try {
            const response = await axios.get('http://localhost:8080/api/v1/services');
            if (response.data.status === 'SUCCESS') {
                setServicesData(response.data.data);
            }
        } catch (error) {
            console.error('Error fetching services:', error);
        }
    };

    const handleAvatarClick = () => {
        // Dùng navigate thay vì window.location.href
        navigate("/CustomerDetail");
    };

    const [showSearch, setShowSearch] = useState(false);
    const searchRef = useRef(null);

    // Search functionality states
    const [searchTerm, setSearchTerm] = useState('');
    const [servicesData, setServicesData] = useState([]);
    const [filteredServices, setFilteredServices] = useState([]);
    const [showSuggestions, setShowSuggestions] = useState(false);
    const [selectedSuggestionIndex, setSelectedSuggestionIndex] = useState(-1);

    useEffect(() => {
        const handleClickOutside = (event) => {
            if (searchRef.current && !searchRef.current.contains(event.target)) {
                setShowSearch(false);
                setShowSuggestions(false);
            }
        };

        if (showSearch) {
            document.addEventListener('mousedown', handleClickOutside);
        } else {
            document.removeEventListener('mousedown', handleClickOutside);
        }

        return () => {
            document.removeEventListener('mousedown', handleClickOutside);
        };
    }, [showSearch]);

    // Search functionality
    const handleSearchChange = (e) => {
        const value = e.target.value;
        setSearchTerm(value);
        setSelectedSuggestionIndex(-1);

        // Clean and validate search term
        const cleanedValue = value.trim();

        // Don't search if:
        // 1. Empty after trim
        // 2. Only special characters (dots, spaces, etc.)
        // 3. Less than 2 meaningful characters
        const meaningfulChars = cleanedValue.replace(/[^\w\sÀ-ỹ]/g, ''); // Keep only letters, numbers, spaces, Vietnamese

        if (!cleanedValue || meaningfulChars.length < 2) {
            setFilteredServices([]);
            setShowSuggestions(false);
            return;
        }

        // Search with cleaned term
        const filtered = servicesData.filter(service => {
            const serviceName = service.name.toLowerCase().trim();
            const serviceDesc = service.description.toLowerCase().trim();
            const searchTermLower = cleanedValue.toLowerCase();

            // More precise matching - avoid partial matches with special chars
            return serviceName.includes(searchTermLower) ||
                serviceDesc.includes(searchTermLower);
        });

        // Limit results to prevent overwhelming UI
        const limitedResults = filtered.slice(0, 6);
        setFilteredServices(limitedResults);
        setShowSuggestions(limitedResults.length > 0);
    };

    const handleSearchSubmit = (serviceId = null) => {
        // Validate search term before submitting
        const cleanedValue = searchTerm.trim();
        const meaningfulChars = cleanedValue.replace(/[^\w\sÀ-ỹ]/g, '');

        if (!cleanedValue || meaningfulChars.length < 2) {
            // Don't submit invalid search terms
            return;
        }

        if (serviceId) {
            // Navigate to specific service
            navigate(`/ServicePage/${serviceId}`);
        } else if (filteredServices.length > 0) {
            // Navigate to first search result
            navigate(`/ServicePage/${filteredServices[0].id}`);
        }
        setShowSuggestions(false);
        setSearchTerm('');
        setShowSearch(false);
    };

    const handleKeyDown = (e) => {
        if (!showSuggestions || filteredServices.length === 0) return;

        switch (e.key) {
            case 'ArrowDown':
                e.preventDefault();
                setSelectedSuggestionIndex(prev =>
                    prev < filteredServices.length - 1 ? prev + 1 : prev
                );
                break;
            case 'ArrowUp':
                e.preventDefault();
                setSelectedSuggestionIndex(prev => prev > 0 ? prev - 1 : prev);
                break;
            case 'Enter':
                e.preventDefault();
                if (selectedSuggestionIndex >= 0) {
                    handleSearchSubmit(filteredServices[selectedSuggestionIndex].id);
                } else {
                    handleSearchSubmit();
                }
                break;
            case 'Escape':
                setShowSuggestions(false);
                setSelectedSuggestionIndex(-1);
                break;
        }
    };

    const handleSuggestionClick = (serviceId) => {
        handleSearchSubmit(serviceId);
    };

    const handleLogin = async (e) => {
        e.preventDefault();
        try {
            const response = await axios.post('http://localhost:8080/api/v1/customer/login', {
                email,
                password
            });
            const responseData = response.data;
            if (responseData.status === 'SUCCESS') {
                const customerData = responseData.data.customer;
                let token = responseData.data.token;

                if (!token || token.split('.').length !== 3) {
                    alert('Token không hợp lệ từ server!');
                    return;
                }
                token = token.trim();

                localStorage.setItem('userInfo', JSON.stringify({
                    ...customerData,
                    token: token
                }));
                localStorage.setItem('token', token);

                // Kích hoạt session manager khi đăng nhập thành công
                sessionManager.onUserLogin();

                // Cập nhật state userInfo ngay lập tức
                setUserInfo({
                    ...customerData,
                    token: token
                });

                // Clear form
                setEmail('');
                setPassword('');

                // Đóng modal
                const modalElement = document.getElementById('loginModal');
                const modal = window.bootstrap.Modal.getInstance(modalElement);
                if (modal) {
                    modal.hide();
                }

                // Trigger sự kiện để các component khác cập nhật
                window.dispatchEvent(new CustomEvent('userInfoUpdated'));
                // window.location.href = '/CustomerDetail';
            }
        } catch (error) {
            console.error('Error logging in:', error);
            alert('Email hoặc mật khẩu không chính xác!');
        }
    };

    const handleRegisterChange = (e) => {
        setRegisterInfo({
            ...registerInfo,
            [e.target.name]: e.target.value
        });
    };

    const handleRegister = async (e) => {
        e.preventDefault();
        setRegisterMessage('');
        try {
            const response = await axios.post('http://localhost:8080/api/v1/customer/register', registerInfo);
            if (response.data.status === 'SUCCESS') {
                setRegisterMessage('Đăng ký thành công! Vui lòng đăng nhập.');
                setRegisterInfo({ fullName: '', email: '', password: '', phone: '', address: '' });
            } else {
                setRegisterMessage(response.data.message || 'Đăng ký thất bại!');
            }
        } catch (error) {
            setRegisterMessage(error.response?.data?.message || 'Đăng ký thất bại!');
        }
    };

    const handleLogout = () => {
        // IMMEDIATE logout - no waiting, no delays
        // Clear all user data instantly
        localStorage.removeItem('userInfo');
        localStorage.removeItem('token');
        localStorage.removeItem('user');

        // Update state immediately
        setUserInfo(null);

        // Redirect immediately to home page
        window.location.href = '/';

        // Call logout API in background after redirect (fire and forget)
        setTimeout(() => {
            const token = localStorage.getItem('token');
            if (token) {
                fetch('http://localhost:8080/api/v1/customer/logout', {
                    method: 'POST',
                    headers: {
                        'Authorization': `Bearer ${token}`,
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify({})
                }).catch(error => {
                    console.error('Background logout API call failed:', error);
                });
            }
        }, 100);
    };

    return (
        <div>
            <div className="container-fluid sticky-top px-0">
                <div className="container-fluid topbar d-none d-lg-block">
                    <div className="container px-0">
                        <div className="row align-items-center">
                            <div className="col-lg-8">
                                <div className="d-flex flex-wrap">
                                    <a href="#" className="me-4"><i className="fas fa-map-marker-alt me-2" />Tìm Địa Điểm</a>
                                    <a href="#" className="me-4"><i className="fas fa-phone-alt me-2" />+3668888940</a>
                                    <a href="#"><i className="fas fa-envelope me-2" />info@sparlex.com</a>
                                </div>
                            </div>
                            <div className="col-lg-4">
                                <div className="d-flex align-items-center justify-content-end">
                                    <a href="#" className="me-3 btn-square border rounded-circle nav-fill"><i className="fab fa-facebook-f" /></a>
                                    <a href="#" className="me-3 btn-square border rounded-circle nav-fill"><i className="fab fa-twitter" /></a>
                                    <a href="#" className="me-3 btn-square border rounded-circle nav-fill"><i className="fab fa-instagram" /></a>
                                    <a href="#" className="btn-square border rounded-circle nav-fill"><i className="fab fa-linkedin-in" /></a>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                <div className="container-fluid bg-light">
                    <div className="container px-0">
                        <nav className="navbar navbar-light navbar-expand-xl p-0">

                            <Link to="/" className="navbar-brand d-flex align-items-center text-decoration-none">
                                <img
                                    src="/assets/img/logo.png"
                                    alt="Sparlex Logo"
                                    className="img-fluid me-2"
                                    style={{
                                        maxHeight: '80px',
                                        width: 'auto',
                                        objectFit: 'contain',
                                        transition: 'all 0.3s ease'
                                    }}
                                    onMouseEnter={(e) => {
                                        e.target.style.transform = 'scale(1.05)';
                                    }}
                                    onMouseLeave={(e) => {
                                        e.target.style.transform = 'scale(1)';
                                    }}
                                />
                                <h1
                                    className="text-primary mb-0 fw-bold"
                                    style={{
                                        fontSize: '2rem',
                                        fontFamily: '"Poppins", sans-serif',
                                        letterSpacing: '1px',
                                        textShadow: '2px 2px 4px rgba(0,0,0,0.1)',
                                        color: '#FDB5B9',
                                        transition: 'all 0.3s ease'
                                    }}
                                    onMouseEnter={(e) => {
                                        e.target.style.color = '#F7A8B8';
                                        e.target.style.textShadow = '2px 2px 6px rgba(0,0,0,0.15)';
                                    }}
                                    onMouseLeave={(e) => {
                                        e.target.style.color = '#FDB5B9';
                                        e.target.style.textShadow = '2px 2px 4px rgba(0,0,0,0.1)';
                                    }}
                                >
                                </h1>
                            </Link>


                            <button className="navbar-toggler py-2 px-3" type="button" data-bs-toggle="collapse" data-bs-target="#navbarCollapse">
                                <span className="fa fa-bars text-primary" />
                            </button>
                            <div className="collapse navbar-collapse bg-light py-3" id="navbarCollapse">
                                <div className="navbar-nav mx-auto border-top">
                                    <Link to="/" className={`nav-item nav-link ${location.pathname === '/' ? 'active' : ''}`}>Trang Chủ</Link>
                                    <Link to="/AboutPage" className={`nav-item nav-link ${location.pathname === '/AboutPage' ? 'active' : ''}`}>Về Chúng Tôi</Link>
                                    <Link to="/ServicePage" className={`nav-item nav-link ${location.pathname === '/ServicePage' ? 'active' : ''}`}>Dịch Vụ</Link>
                                    <Link to="/ContactPage" className={`nav-item nav-link ${location.pathname === '/ContactPage' ? 'active' : ''}`}>Liên Hệ</Link>
                                    <Link to="/service-history" className={`nav-item nav-link ${location.pathname === '/service-history' ? 'active' : ''}`}>Lịch Sử Dịch Vụ</Link>
                                </div>
                                <div className="d-flex align-items-center flex-nowrap pt-xl-0">
                                    <button className="btn-search btn btn-primary  rounded-circle btn-lg-square"
                                        onClick={() => setShowSearch(!showSearch)}
                                        onMouseLeave={(e) => {
                                            e.target.style.background = '#FDB5B9';
                                            e.target.style.color = 'white';
                                            e.target.style.boxShadow = '0 2px 6px rgba(253, 181, 185, 0.3)';
                                            // Đảm bảo icon hiển thị
                                            const icon = e.target.querySelector('i');
                                            if (icon) {
                                                icon.style.color = 'white';
                                                icon.style.background = 'transparent';
                                            };
                                        }}
                                        onMouseEnter={(e) => {
                                            e.target.style.background = 'transparent';
                                            e.target.style.color = '#FDB5B9';
                                            e.target.style.boxShadow = 'none';
                                            e.target.style.border = '2px solid #FDB5B9';
                                            // Khôi phục màu icon
                                            const icon = e.target.querySelector('i');
                                            if (icon) {
                                                icon.style.color = '#FDB5B9';
                                                icon.style.background = 'transparent';
                                            }
                                        }}
                                        style={{
                                            background: '#FDB5B9', color: 'white', border: '2px solid #FDB5B9', padding: '10px 15px', transition: 'all 0.3s ease', width: "50px",
                                            height: "50px"
                                        }}
                                    >
                                        <i className="fas fa-search" />
                                    </button>
                                    {!userInfo ? (
                                        <button
                                            className="btn btn-outline-primary rounded-pill ms-3"
                                            data-bs-toggle="modal"
                                            data-bs-target="#loginModal"
                                            style={{
                                                padding: '10px 20px',
                                                fontWeight: '600',
                                                fontSize: '1rem',
                                                border: '2px solid #FDB5B9',
                                                transition: 'all 0.3s ease',
                                                minWidth: '100px'
                                            }}
                                            onMouseEnter={(e) => {
                                                e.target.style.background = '#FDB5B9';
                                                e.target.style.color = 'white';
                                                e.target.style.boxShadow = '0 2px 6px rgba(253, 181, 185, 0.3)';
                                                // Đảm bảo icon hiển thị
                                                const icon = e.target.querySelector('i');
                                                if (icon) {
                                                    icon.style.color = 'white';
                                                    icon.style.background = 'transparent';
                                                };
                                            }}
                                            onMouseLeave={(e) => {
                                                e.target.style.background = 'transparent';
                                                e.target.style.color = '#FDB5B9';
                                                e.target.style.boxShadow = 'none';
                                                // Khôi phục màu icon
                                                const icon = e.target.querySelector('i');
                                                if (icon) {
                                                    icon.style.color = '#FDB5B9';
                                                    icon.style.background = 'transparent';
                                                }
                                            }}
                                        >
                                            <i className="fas fa-user me-2" style={{ background: "transparent" }}></i>
                                            Đăng Nhập
                                        </button>
                                    ) : (
                                        <div className="nav-item dropdown ms-3">
                                            <a href="#" className="nav-link dropdown-toggle d-flex align-items-center p-2 rounded-pill" data-bs-toggle="dropdown" style={{
                                                border: '2px solid #FDB5B9',
                                                transition: 'all 0.3s ease',
                                                background: 'rgba(253, 181, 185, 0.1)'
                                            }}
                                                onMouseEnter={(e) => {
                                                    e.target.style.background = 'rgba(253, 181, 185, 0.2)';
                                                    e.target.style.borderColor = '#F7A8B8';
                                                    e.target.style.transform = 'translateY(-2px)';
                                                    e.target.style.boxShadow = '0 4px 12px rgba(253, 181, 185, 0.3)';
                                                }}
                                                onMouseLeave={(e) => {
                                                    e.target.style.background = 'rgba(253, 181, 185, 0.1)';
                                                    e.target.style.borderColor = '#FDB5B9';
                                                    e.target.style.transform = 'translateY(0)';
                                                    e.target.style.boxShadow = 'none';
                                                }}
                                            >
                                                <img
                                                    src={
                                                        userInfo.imageUrl
                                                            ? userInfo.imageUrl.startsWith('http')
                                                                ? userInfo.imageUrl
                                                                : `http://localhost:8080/${userInfo.imageUrl.replace(/^\/?/, '')}`
                                                            : "/assets/img/default-avatar.jpg"
                                                    }
                                                    alt="avatar"
                                                    style={{ width: 40, height: 40, borderRadius: "50%", objectFit: "cover", marginRight: 10, border: '2px solid white' }}
                                                />
                                                <span style={{ fontWeight: '600', color: '#d6336c' }}>
                                                    {userInfo.fullName?.split(' ').slice(-1)[0] || 'User'}
                                                </span>
                                            </a>
                                            <div className="dropdown-menu m-0 bg-white rounded-3 shadow-lg border-0" style={{ minWidth: '200px', marginTop: '10px !important' }}>
                                                <Link to="/CustomerDetail" className="dropdown-item py-2 px-3 d-flex align-items-center" style={{ fontWeight: '500' }}>
                                                    <i className="fas fa-user-circle me-2" style={{ color: '#FDB5B9' }}></i>
                                                    Thông tin cá nhân
                                                </Link>
                                                <hr className="dropdown-divider my-1" />
                                                <button onClick={handleLogout} className="dropdown-item py-2 px-3 d-flex align-items-center" style={{ fontWeight: '500', color: '#e74c3c' }}>
                                                    <i className="fas fa-sign-out-alt me-2" style={{ color: '#e74c3c' }}></i>
                                                    Đăng xuất
                                                </button>
                                            </div>
                                        </div>
                                    )}
                                </div>
                            </div>
                        </nav>
                    </div>
                </div>
            </div>

            {/* Search functionality */}
            {showSearch && (
                <div ref={searchRef} className="search-bar-wrapper position-absolute w-100 d-flex justify-content-center" style={{ top: "170px", zIndex: 1050 }}>
                    <div className="position-relative " style={{ maxWidth: "600px", width: "100%" }}>
                        <div className="input-group shadow rounded-pill">
                            <input
                                type="search"
                                className="form-control p-3"
                                placeholder="Tìm kiếm dịch vụ..."
                                value={searchTerm}
                                onChange={handleSearchChange}
                                onKeyDown={handleKeyDown}
                                onFocus={() => searchTerm && setShowSuggestions(true)}
                                style={{ fontSize: '1rem' }}
                            />
                            <span
                                className="input-group-text p-3 btn-primary"
                                style={{ cursor: 'pointer', border: 'none' }}
                                onClick={() => handleSearchSubmit()}
                            >
                                <i className="fa fa-search" />
                            </span>
                        </div>

                        {/* Search Suggestions Dropdown */}
                        {showSuggestions && filteredServices.length > 0 && (
                            <div
                                className="position-absolute w-100 bg-white border rounded shadow-lg mt-1"
                                style={{
                                    zIndex: 1051,
                                    maxHeight: '400px',
                                    overflowY: 'auto'
                                }}
                            >
                                {filteredServices.slice(0, 8).map((service, index) => (
                                    <div
                                        key={service.id}
                                        className={`p-3 border-bottom cursor-pointer search-suggestion ${index === selectedSuggestionIndex ? 'bg-light' : ''
                                            }`}
                                        onClick={() => handleSuggestionClick(service.id)}
                                        style={{
                                            cursor: 'pointer',
                                            transition: 'background-color 0.2s ease',
                                            backgroundColor: index === selectedSuggestionIndex ? '#f8f9fa' : 'transparent'
                                        }}
                                        onMouseEnter={(e) => {
                                            if (index !== selectedSuggestionIndex) {
                                                e.target.style.backgroundColor = '#f1f3f4';
                                            }
                                        }}
                                        onMouseLeave={(e) => {
                                            if (index !== selectedSuggestionIndex) {
                                                e.target.style.backgroundColor = 'transparent';
                                            }
                                        }}
                                    >
                                        <div className="d-flex align-items-center">
                                            <img
                                                src={service.imageUrl || service.image_url || '/default-image.jpg'}
                                                alt={service.name}
                                                style={{
                                                    width: '50px',
                                                    height: '50px',
                                                    objectFit: 'cover',
                                                    borderRadius: '8px',
                                                    marginRight: '15px'
                                                }}
                                            />
                                            <div className="flex-grow-1">
                                                <div className="fw-bold text-dark" style={{ fontSize: '1rem' }}>
                                                    {service.name}
                                                </div>
                                                <div className="text-muted small" style={{ fontSize: '0.85rem' }}>
                                                    {service.description.length > 60
                                                        ? service.description.substring(0, 60) + '...'
                                                        : service.description}
                                                </div>
                                                <div className="text-primary small fw-bold">
                                                    {service.price ? `${service.price.toLocaleString()}₫` : 'Liên hệ'}
                                                </div>
                                            </div>
                                            <div className="ms-auto">
                                                <i className="fas fa-arrow-right text-primary"></i>
                                            </div>
                                        </div>
                                    </div>
                                ))}

                                {filteredServices.length > 8 && (
                                    <div className="p-2 text-center text-muted small">
                                        Và {filteredServices.length - 8} kết quả khác...
                                    </div>
                                )}
                            </div>
                        )}

                        {/* No results message */}
                        {showSuggestions && searchTerm && filteredServices.length === 0 && (() => {
                            const cleanedValue = searchTerm.trim();
                            const meaningfulChars = cleanedValue.replace(/[^\w\sÀ-ỹ]/g, '');

                            // Don't show "no results" for invalid search terms
                            if (!cleanedValue || meaningfulChars.length < 2) {
                                return (
                                    <div
                                        className="position-absolute w-100 bg-white border rounded shadow-lg p-3 text-center text-muted mt-1"
                                        style={{ zIndex: 1051 }}
                                    >
                                        <i className="fas fa-info-circle mb-2"></i>
                                        <div>Vui lòng nhập ít nhất 2 ký tự để tìm kiếm</div>
                                    </div>
                                );
                            }

                            return (
                                <div
                                    className="position-absolute w-100 bg-white border rounded shadow-lg p-3 text-center text-muted mt-1"
                                    style={{ zIndex: 1051 }}
                                >
                                    <i className="fas fa-search-minus mb-2"></i>
                                    <div>Không tìm thấy dịch vụ nào cho "{cleanedValue}"</div>
                                </div>
                            );
                        })()}
                    </div>
                </div>
            )}

            {/* Login Modal */}
            <div className="modal fade" id="loginModal" tabIndex={-1} aria-labelledby="loginModalLabel" aria-hidden="true">
                <div className="modal-dialog modal-dialog-centered">
                    <div className="modal-content">
                        <div className="modal-header">
                            <h5 className="modal-title" id="loginModalLabel">Đăng Nhập</h5>
                            <button type="button" className="btn-close" data-bs-dismiss="modal" aria-label="Đóng" />
                        </div>
                        <div className="modal-body">
                            <form onSubmit={handleLogin}>
                                <div className="mb-3">
                                    <label className="form-label">Địa chỉ Email</label>
                                    <input
                                        type="email"
                                        className="form-control"
                                        placeholder="Nhập email của bạn"
                                        value={email}
                                        onChange={(e) => setEmail(e.target.value)}
                                    />
                                </div>
                                <div className="mb-3">
                                    <label className="form-label">Mật khẩu</label>
                                    <input
                                        type="password"
                                        className="form-control"
                                        placeholder="Nhập mật khẩu"
                                        value={password}
                                        onChange={(e) => setPassword(e.target.value)}
                                    />
                                </div>
                                <button type="submit" className="btn btn-primary w-100">Đăng Nhập</button>
                            </form>
                        </div>
                        <div className="modal-footer justify-content-center">
                            <p className="text-center mb-0">
                                Chưa có tài khoản?
                                <a
                                    href="#"
                                    data-bs-toggle="modal"
                                    data-bs-target="#registerModal"
                                    data-bs-dismiss="modal"
                                    className="text-decoration-none ms-1"
                                    style={{
                                        color: '#FDB5B9',
                                        fontWeight: '600',
                                        transition: 'all 0.3s ease'
                                    }}
                                    onMouseEnter={(e) => {
                                        e.target.style.color = '#B76E79';
                                        e.target.style.textDecoration = 'underline';
                                        e.target.style.transform = 'translateY(-1px)';
                                    }}
                                    onMouseLeave={(e) => {
                                        e.target.style.color = '#FDB5B9';
                                        e.target.style.textDecoration = 'none';
                                        e.target.style.transform = 'translateY(0)';
                                    }}
                                >
                                    Đăng ký ngay
                                </a>
                            </p>
                        </div>
                    </div>
                </div>
            </div>

            {/* Register Modal */}
            <div className="modal fade" id="registerModal" tabIndex={-1} aria-labelledby="registerModalLabel" aria-hidden="true">
                <div className="modal-dialog modal-dialog-centered">
                    <div className="modal-content">
                        <div className="modal-header">
                            <h5 className="modal-title" id="registerModalLabel">Đăng Ký Tài Khoản</h5>
                            <button type="button" className="btn-close" data-bs-dismiss="modal" aria-label="Đóng" />
                        </div>
                        <div className="modal-body">
                            {registerMessage && (
                                <div className="alert alert-info">{registerMessage}</div>
                            )}
                            <form onSubmit={handleRegister}>
                                <div className="mb-3">
                                    <label className="form-label">Họ và tên</label>
                                    <input
                                        type="text"
                                        className="form-control"
                                        name="fullName"
                                        placeholder="Nhập họ và tên của bạn"
                                        value={registerInfo.fullName}
                                        onChange={handleRegisterChange}
                                        required
                                    />
                                </div>
                                <div className="mb-3">
                                    <label className="form-label">Địa chỉ Email</label>
                                    <input
                                        type="email"
                                        className="form-control"
                                        name="email"
                                        placeholder="Nhập email của bạn"
                                        value={registerInfo.email}
                                        onChange={handleRegisterChange}
                                        required
                                    />
                                </div>
                                <div className="mb-3">
                                    <label className="form-label">Mật khẩu</label>
                                    <input
                                        type="password"
                                        className="form-control"
                                        name="password"
                                        placeholder="Tạo mật khẩu mới"
                                        value={registerInfo.password}
                                        onChange={handleRegisterChange}
                                        required
                                    />
                                </div>

                                <button type="submit" className="btn btn-primary w-100">Đăng Ký Ngay</button>
                            </form>
                        </div>
                        <div className="modal-footer justify-content-center">
                            <p className="text-center mb-0">
                                Đã có tài khoản?
                                <a
                                    href="#"
                                    data-bs-toggle="modal"
                                    data-bs-target="#loginModal"
                                    data-bs-dismiss="modal"
                                    className="text-decoration-none ms-1"
                                    style={{
                                        color: '#FDB5B9',
                                        fontWeight: '600',
                                        transition: 'all 0.3s ease'
                                    }}
                                    onMouseEnter={(e) => {
                                        e.target.style.color = '	#B76E79';
                                        e.target.style.textDecoration = 'underline';
                                        e.target.style.transform = 'translateY(-1px)';
                                    }}
                                    onMouseLeave={(e) => {
                                        e.target.style.color = '#FDB5B9';
                                        e.target.style.textDecoration = 'none';
                                        e.target.style.transform = 'translateY(0)';
                                    }}
                                >
                                    Đăng nhập
                                </a>
                            </p>
                        </div>
                    </div>
                </div>
            </div>

            {/* CSS for Search Functionality */}
            <style jsx>{`
    .search-suggestion:hover {
        background-color: #f8f9fa !important;
    }
    
    .search-bar-wrapper::-webkit-scrollbar {
        width: 6px;
    }
    
    .search-bar-wrapper::-webkit-scrollbar-track {
        background: #f1f1f1;
        border-radius: 3px;
    }
    
    .search-bar-wrapper::-webkit-scrollbar-thumb {
        background: #c1c1c1;
        border-radius: 3px;
    }
    
    .search-bar-wrapper::-webkit-scrollbar-thumb:hover {
        background: #a8a8a8;
    }
    
    .input-group-text.btn-primary:hover {
        opacity: 0.85;
        transform: scale(1.05);
        transition: all 0.2s ease;
    }
    
    .search-suggestion {
        transition: all 0.2s ease;
    }
    
    .search-suggestion:last-child {
        border-bottom: none !important;
    }
    
    /* Modal footer links hover effects */
    .modal-footer a {
        transition: all 0.3s ease !important;
    }
    
    .modal-footer a:hover {
        text-shadow: 0 1px 2px rgba(0,0,0,0.1);
    }
    
    /* Smooth transitions for modal elements */
    .modal-content {
        transition: all 0.3s ease;
    }
    
    .modal-header, .modal-body, .modal-footer {
        transition: all 0.2s ease;
    }
    
    /* Button hover improvements */
    .btn-primary:hover {
        transform: translateY(-1px);
        box-shadow: 0 4px 12px rgba(253, 181, 185, 0.3);
        transition: all 0.3s ease;
    }
    
    .btn-outline-primary:hover {
        transform: translateY(-1px);
        box-shadow: 0 4px 12px rgba(253, 181, 185, 0.3);
    }
`}</style>

            {/* Session Timer - chỉ hiển thị khi user đăng nhập */}
            {userInfo && <SessionTimer />}
        </div>
    );
};

export default Header;