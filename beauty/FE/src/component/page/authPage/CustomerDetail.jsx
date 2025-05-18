import React, { useState, useEffect } from 'react';
import { Tab, Nav } from 'react-bootstrap';
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

    const [serviceHistory, setServiceHistory] = useState([]);
    const [selectedHistory, setSelectedHistory] = useState(null);

    const [message, setMessage] = useState({ type: '', content: '' });

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
            setUserInfo({ ...userInfo, imageFile: files[0] });
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
                localStorage.setItem('userInfo', JSON.stringify({ ...user, ...userInfo }));
                setMessage({ type: 'success', content: 'Cập nhật thông tin thành công!' });
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

    const handleLogout = async () => {
        try {
            await axios.post('http://localhost:8080/api/v1/customer/logout', {}, {
                headers: { 'Authorization': `Bearer ${user.token}` }
            });
        } catch (error) {
            console.error('Error during logout:', error);
        } finally {
            localStorage.removeItem('userInfo');
            window.location.href = '/';
        }
    };

    const handleViewDetails = (history) => {
        setSelectedHistory(history);
    };

    const handleCloseDetails = () => {
        setSelectedHistory(null);
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
                                    src={userInfo.imageUrl || "/assets/img/default-avatar.jpg"}
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
                                    className={`list-group-item list-group-item-action ${key === 'history' ? 'active' : ''}`}
                                    onClick={(e) => { e.preventDefault(); setKey('history') }}
                                >
                                    Lịch sử dịch vụ
                                </a>
                                <a
                                    href="#"
                                    className="list-group-item list-group-item-action"
                                    onClick={(e) => { e.preventDefault(); handleLogout() }}
                                >
                                    Đăng xuất
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
                                    <Tab.Pane eventKey="history">
                                        <h4 className="mb-4">Lịch sử dịch vụ</h4>
                                        {serviceHistory.length === 0 ? (
                                            <p>Không có lịch sử dịch vụ nào.</p>
                                        ) : (
                                            <div className="list-group">
                                                {serviceHistory.map((history) => (
                                                    <div key={history.id} className="list-group-item">
                                                        <div className="d-flex justify-content-between align-items-center">
                                                            <div>
                                                                <h5>Dịch vụ ID: {history.serviceId}</h5>
                                                                <p className="mb-1">Ngày sử dụng: {new Date(history.dateUsed).toLocaleDateString()}</p>
                                                                <p className="mb-1">Ghi chú: {history.notes || 'Không có ghi chú'}</p>
                                                            </div>
                                                            <button
                                                                className="btn btn-primary"
                                                                onClick={() => handleViewDetails(history)}
                                                            >
                                                                Xem chi tiết
                                                            </button>
                                                        </div>
                                                    </div>
                                                ))}
                                            </div>
                                        )}
                                    </Tab.Pane>
                                </Tab.Content>
                            </Tab.Container>
                        </div>
                    </div>
                </div>
            </div>

            {selectedHistory && (
                <div className="modal show d-block" tabIndex="-1">
                    <div className="modal-dialog">
                        <div className="modal-content">
                            <div className="modal-header">
                                <h5 className="modal-title">Chi tiết dịch vụ</h5>
                                <button type="button" className="btn-close" onClick={handleCloseDetails}></button>
                            </div>
                            <div className="modal-body">
                                <p><b>Dịch vụ ID:</b> {selectedHistory.serviceId}</p>
                                <p><b>Ngày sử dụng:</b> {new Date(selectedHistory.dateUsed).toLocaleDateString()}</p>
                                <p><b>Ghi chú:</b> {selectedHistory.notes || 'Không có ghi chú'}</p>
                                <p><b>Ngày tạo:</b> {new Date(selectedHistory.createdAt).toLocaleDateString()}</p>
                                <p><b>Trạng thái:</b> {selectedHistory.isActive ? 'Hoạt động' : 'Không hoạt động'}</p>
                            </div>
                            <div className="modal-footer">
                                <button type="button" className="btn btn-secondary" onClick={handleCloseDetails}>Đóng</button>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            <Footer />
        </>
    );
};

export default CustomerDetail;