import React, { useState, useEffect, useRef } from 'react';
import axios from 'axios';
// Import thêm Link và useNavigate từ react-router-dom
import { Link, useNavigate } from 'react-router-dom';

const Header = () => {
    // Khởi tạo hook useNavigate
    const navigate = useNavigate(); 

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
    }, []);

    const handleAvatarClick = () => {
        // Dùng navigate thay vì window.location.href
        navigate("/CustomerDetail"); 
    };

    const [showSearch, setShowSearch] = useState(false);
    const searchRef = useRef(null);

    useEffect(() => {
        const handleClickOutside = (event) => {
            if (searchRef.current && !searchRef.current.contains(event.target)) {
                setShowSearch(false);
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
                
                // Dùng window.location.href để tải lại toàn bộ trang, cập nhật trạng thái login
                window.location.href = "/CustomerDetail";

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
        localStorage.removeItem('userInfo');
        localStorage.removeItem('token');
        setUserInfo(null);
        // Tải lại trang chủ để cập nhật trạng thái logout
        window.location.href = "/";
    };

    return (
        <div>
            <div className="container-fluid sticky-top px-0">
                 <div className="container-fluid topbar d-none d-lg-block">
                     <div className="container px-0">
                         <div className="row align-items-center">
                             <div className="col-lg-8">
                                 <div className="d-flex flex-wrap">
                                     <a href="#" className="me-4"><i className="fas fa-map-marker-alt me-2" />Find A Location</a>
                                     <a href="#" className="me-4"><i className="fas fa-phone-alt me-2" />+01234567890</a>
                                     <a href="#"><i className="fas fa-envelope me-2" />Example@gmail.com</a>
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
                        <nav className="navbar navbar-light navbar-expand-xl">
                            <Link to="/" className="navbar-brand">
                                <h1 className="text-primary display-4">Sparlex</h1>
                            </Link>
                            <button className="navbar-toggler py-2 px-3" type="button" data-bs-toggle="collapse" data-bs-target="#navbarCollapse">
                                <span className="fa fa-bars text-primary" />
                            </button>
                            <div className="collapse navbar-collapse bg-light py-3" id="navbarCollapse">
                                <div className="navbar-nav mx-auto border-top">
                                    <Link to="/" className="nav-item nav-link active">Home</Link>
                                    <Link to="/AboutPage" className="nav-item nav-link">About</Link>
                                    <Link to="/ServicePage" className="nav-item nav-link">Services</Link>

                                    {!userInfo ? (
                                        <a href="#" className="nav-item nav-link" data-bs-toggle="modal" data-bs-target="#loginModal">Login</a>
                                    ) : (
                                        <div className="nav-item dropdown">
                                            <a href="#" className="nav-link dropdown-toggle" data-bs-toggle="dropdown" style={{ display: "flex", alignItems: "center" }}>
                                                <img
                                                    src={
                                                        userInfo.imageUrl
                                                            ? userInfo.imageUrl.startsWith('http')
                                                                ? userInfo.imageUrl
                                                                : `http://localhost:8080/${userInfo.imageUrl.replace(/^\/?/, '')}`
                                                            : "/assets/img/default-avatar.jpg"
                                                    }
                                                    alt="avatar"
                                                    style={{ width: 32, height: 32, borderRadius: "50%", objectFit: "cover", marginRight: 8 }}
                                                />
                                            </a>
                                            <div className="dropdown-menu m-0 bg-secondary rounded-0">
                                                <Link to="/CustomerDetail" className="dropdown-item">Thông tin cá nhân</Link>
                                                <button onClick={handleLogout} className="dropdown-item">Đăng xuất</button>
                                            </div>
                                        </div>
                                    )}

                                    <div className="nav-item dropdown">
                                        <a href="#" className="nav-link dropdown-toggle" data-bs-toggle="dropdown">Pages</a>
                                        <div className="dropdown-menu m-0 bg-secondary rounded-0">
                                            <Link to="/TeamPage" className="dropdown-item">Team</Link>
                                            <Link to="/TerminalPage" className="dropdown-item">Testimonial</Link>
                                            <Link to="/GaleryPage" className="dropdown-item">Gallery</Link>
                                            <Link to="/AppointmentPage" className="dropdown-item">Appointment</Link>
                                            <Link to="/ErrorPage" className="dropdown-item">404 page</Link>
                                        </div>
                                    </div>
                                    <Link to="/ContactPage" className="nav-item nav-link">Contact Us</Link>
                                </div>
                                <div className="d-flex align-items-center flex-nowrap pt-xl-0">
                                    <button className="btn-search btn btn-primary btn-primary-outline-0 rounded-circle btn-lg-square" onClick={() => setShowSearch(!showSearch)}>
                                        <i className="fas fa-search" />
                                    </button>
                                    <Link to="/AppointmentPage" className="btn btn-primary btn-primary-outline-0 rounded-pill py-3 px-4 ms-4">Book Appointment</Link>
                                </div>
                            </div>
                        </nav>
                    </div>
                </div>
            </div>

            {/* Modals không thay đổi */}
          {showSearch && (
                <div ref={searchRef} className="search-bar-wrapper position-absolute w-100 d-flex justify-content-center" style={{ top: "170px", zIndex: 1050 }}>
                    <div className="input-group shadow" style={{ maxWidth: "600px" }}>
                        <input type="search" className="form-control p-3" placeholder="keywords" />
                        <span className="input-group-text p-3"><i className="fa fa-search" /></span>
                    </div>
                </div>
            )}




            {/* Login Modal */}
            <div className="modal fade" id="loginModal" tabIndex={-1} aria-labelledby="loginModalLabel" aria-hidden="true">
                <div className="modal-dialog modal-dialog-centered">
                    <div className="modal-content">
                        <div className="modal-header">
                            <h5 className="modal-title" id="loginModalLabel">Login</h5>
                            <button type="button" className="btn-close" data-bs-dismiss="modal" aria-label="Close" />
                        </div>
                        <div className="modal-body">
                            <form onSubmit={handleLogin}>
                                <div className="mb-3">
                                    <label className="form-label">Email address</label>
                                    <input
                                        type="email"
                                        className="form-control"
                                        placeholder="Enter email"
                                        value={email}
                                        onChange={(e) => setEmail(e.target.value)}
                                    />
                                </div>
                                <div className="mb-3">
                                    <label className="form-label">Password</label>
                                    <input
                                        type="password"
                                        className="form-control"
                                        placeholder="Password"
                                        value={password}
                                        onChange={(e) => setPassword(e.target.value)}
                                    />
                                </div>
                                <button type="submit" className="btn btn-primary w-100">Login</button>
                            </form>
                        </div>
                        <div className="modal-footer justify-content-center">
                            <p className="text-center mb-0">
                                Don't have an account? <a href="#" data-bs-toggle="modal" data-bs-target="#registerModal" data-bs-dismiss="modal">Register</a>
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
                            <h5 className="modal-title" id="registerModalLabel">Register</h5>
                            <button type="button" className="btn-close" data-bs-dismiss="modal" aria-label="Close" />
                        </div>
                        <div className="modal-body">
                            {registerMessage && (
                                <div className="alert alert-info">{registerMessage}</div>
                            )}
                            <form onSubmit={handleRegister}>
                                <div className="mb-3">
                                    <label className="form-label">Họ tên</label>
                                    <input
                                        type="text"
                                        className="form-control"
                                        name="fullName"
                                        value={registerInfo.fullName}
                                        onChange={handleRegisterChange}
                                        required
                                    />
                                </div>
                                <div className="mb-3">
                                    <label className="form-label">Email</label>
                                    <input
                                        type="email"
                                        className="form-control"
                                        name="email"
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
                                        value={registerInfo.password}
                                        onChange={handleRegisterChange}
                                        required
                                    />
                                </div>

                                <button type="submit" className="btn btn-primary w-100">Đăng ký</button>
                            </form>
                        </div>
                        <div className="modal-footer justify-content-center">
                            <p className="text-center mb-0">
                                Đã có tài khoản? <a href="#" data-bs-toggle="modal" data-bs-target="#loginModal" data-bs-dismiss="modal">Đăng nhập</a>
                            </p>
                        </div>
                    </div>
                </div>
            </div>
            <div className="modal fade" id="loginModal" tabIndex={-1}>{/* ... */}</div>
            <div className="modal fade" id="registerModal" tabIndex={-1}>{/* ... */}</div>
        </div>
    );
};

export default Header;