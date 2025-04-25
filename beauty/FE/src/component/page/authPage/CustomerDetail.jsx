import React, { useState, useEffect } from 'react';
import { Tab, Nav } from 'react-bootstrap';
import axios from 'axios';
import Header from "../../shared/header";
import Footer from "../../shared/footer";

const CustomerDetail = () => {
    const [key, setKey] = useState('profile');
    const [user, setUser] = useState({});
    const [loading, setLoading] = useState(true);
    
    // Thông tin người dùng để cập nhật - đảm bảo khớp với CustomerDetailResponseDto
    const [userInfo, setUserInfo] = useState({
        fullName: '',
        email: '',
        phone: '',
        address: '',
        imageUrl: ''
    });
    
    // Thông tin mật khẩu để cập nhật - sửa tên trường để khớp với ChangePasswordCustomerRequestDto
    const [passwordInfo, setPasswordInfo] = useState({
        oldPassword: '',  
        newPassword: '',
        confirmPassword: ''
    });
    
    const [message, setMessage] = useState({ type: '', content: '' });

// Thêm vào useEffect trong CustomerDetail.jsx
useEffect(() => {
    const storedUser = localStorage.getItem('userInfo');
    if (storedUser) {
        try {
            const parsedUser = JSON.parse(storedUser);
            console.log("User data from localStorage:", parsedUser);
            
            // Kiểm tra token
            if (!parsedUser.token) {
                console.error("Token không tồn tại!");
                localStorage.removeItem('userInfo');
                window.location.href = '/';
                return;
            }
            
            // Kiểm tra định dạng token
            const tokenParts = parsedUser.token.split('.');
            if (tokenParts.length !== 3) {
                console.error("Token không đúng định dạng JWT!");
                localStorage.removeItem('userInfo');
                window.location.href = '/';
                return;
            }
            
            setUser(parsedUser);
            fetchUserDetails(parsedUser.id, parsedUser.token);
        } catch (error) {
            console.error("Lỗi khi phân tích dữ liệu:", error);
            localStorage.removeItem('userInfo');
            window.location.href = '/';
        }
    } else {
        window.location.href = '/';
    }
}, []);
    
const fetchUserDetails = async (userId, token) => {
    try {
        console.log("Gửi request với token:", token);
        console.log("Authorization header:", `Bearer ${token}`);
        
        // Thêm timeout để tránh request treo
        const response = await axios.get(`http://localhost:8080/api/v1/customer/detail/${userId}`, {
            headers: {
                'Authorization': `Bearer ${token}`
            },
            timeout: 10000 // 10 giây
        });
        
        console.log("Response từ API:", response.data);
        
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
        console.error('Error fetching user details:', error);
        
        if (error.response) {
            console.error('Status:', error.response.status);
            console.error('Data:', error.response.data);
            console.error('Headers:', error.response.headers);
            
            if (error.response.status === 401) {
                setMessage({ 
                    type: 'danger', 
                    content: 'Phiên đăng nhập hết hạn, vui lòng đăng nhập lại' 
                });
                
                setTimeout(() => {
                    localStorage.removeItem('userInfo');
                    window.location.href = '/';
                }, 3000);
                return;
            } else if (error.response.status === 404) {
                setMessage({ 
                    type: 'danger', 
                    content: 'Không tìm thấy thông tin người dùng' 
                });
            } else {
                setMessage({ 
                    type: 'danger', 
                    content: `Lỗi: ${error.response.data?.message || 'Không thể tải thông tin người dùng'}` 
                });
            }
        } else if (error.request) {
            console.error('Request was sent but no response was received:', error.request);
            setMessage({ 
                type: 'danger', 
                content: 'Máy chủ không phản hồi, vui lòng thử lại sau' 
            });
        } else {
            console.error('Error message:', error.message);
            setMessage({ 
                type: 'danger', 
                content: 'Có lỗi xảy ra khi gửi yêu cầu' 
            });
        }
    } finally {
        setLoading(false);
    }
};
    const handleProfileChange = (e) => {
        const { name, value } = e.target;
        setUserInfo({
            ...userInfo,
            [name]: value
        });
    };

    const handlePasswordChange = (e) => {
        const { name, value } = e.target;
        setPasswordInfo({
            ...passwordInfo,
            [name]: value
        });
    };

    const handleProfileSubmit = async (e) => {
        e.preventDefault();
        setMessage({ type: '', content: '' });
        
        try {
            // Gọi API updateCustomer với đúng cấu trúc dữ liệu
            const response = await axios.put(`http://localhost:8080/api/v1/customer/update-info/${user.id}`, {
                fullName: userInfo.fullName,
                phone: userInfo.phone,
                address: userInfo.address,
                imageUrl: userInfo.imageUrl
            }, {
                headers: {
                    'Authorization': `Bearer ${user.token}`
                }
            });
            
            if (response.data && response.data.status === 'SUCCESS') {
                // Cập nhật thông tin người dùng trong localStorage
                localStorage.setItem('userInfo', JSON.stringify({
                    ...user,
                    ...userInfo
                }));
                
                setMessage({ type: 'success', content: 'Cập nhật thông tin thành công!' });
            } else {
                setMessage({ type: 'danger', content: response.data?.message || 'Có lỗi xảy ra!' });
            }
        } catch (error) {
            console.error('Error updating profile:', error);
            setMessage({ type: 'danger', content: error.response?.data?.message || 'Có lỗi xảy ra khi cập nhật thông tin!' });
        }
    };

    const handlePasswordSubmit = async (e) => {
        e.preventDefault();
        setMessage({ type: '', content: '' });
    
        // Kiểm tra mật khẩu mới và xác nhận
        if (passwordInfo.newPassword !== passwordInfo.confirmPassword) {
            setMessage({ type: 'danger', content: 'Mật khẩu mới và xác nhận mật khẩu không khớp!' });
            return;
        }
    
        // Kiểm tra các trường không được để trống
        if (!passwordInfo.oldPassword || !passwordInfo.newPassword || !passwordInfo.confirmPassword) {
            setMessage({ type: 'danger', content: 'Vui lòng nhập đầy đủ thông tin!' });
            return;
        }
    
        // Log dữ liệu gửi lên để debug
        console.log("Gửi đổi mật khẩu:", {
            oldPassword: passwordInfo.oldPassword,
            newPassword: passwordInfo.newPassword,
            confirmPassword: passwordInfo.confirmPassword,
            userId: user.id,
            token: user.token
        });
    
        try {
            const response = await axios.put(
                `http://localhost:8080/api/v1/customer/change-password/${user.id}`,
                {
                    oldPassword: passwordInfo.oldPassword,
                    newPassword: passwordInfo.newPassword,
                    confirmPassword: passwordInfo.confirmPassword
                },
                {
                    headers: {
                        'Authorization': `Bearer ${user.token}`
                    }
                }
            );
    
            if (response.data && response.data.status === 'SUCCESS') {
                setMessage({ type: 'success', content: 'Đổi mật khẩu thành công!' });
                setPasswordInfo({
                    oldPassword: '',
                    newPassword: '',
                    confirmPassword: ''
                });
            } else {
                setMessage({ type: 'danger', content: response.data?.message || 'Đổi mật khẩu thất bại!' });
            }
        } catch (error) {
            // Log lỗi chi tiết để debug
            console.error('Lỗi đổi mật khẩu:', error);
            setMessage({
                type: 'danger',
                content: error.response?.data?.message || 'Có lỗi xảy ra khi đổi mật khẩu!'
            });
        }
    };

    const handleLogout = async () => {
        try {
            // Gọi API logout (tùy chọn)
            await axios.post('http://localhost:8080/api/v1/customer/logout', {}, {
                headers: {
                    'Authorization': `Bearer ${user.token}`
                }
            });
        } catch (error) {
            console.error('Error during logout:', error);
        } finally {
            // Xóa thông tin người dùng khỏi localStorage
            localStorage.removeItem('userInfo');
            window.location.href = '/';
        }
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
                                    src={userInfo.imageUrl || "assets/img/default-avatar.jpg"} 
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
                                    onClick={(e) => {e.preventDefault(); setKey('profile')}}
                                >
                                    Thông tin cá nhân
                                </a>
                                <a 
                                    href="#" 
                                    className={`list-group-item list-group-item-action ${key === 'password' ? 'active' : ''}`}
                                    onClick={(e) => {e.preventDefault(); setKey('password')}}
                                >
                                    Đổi mật khẩu
                                </a>
                                <a 
                                    href="#" 
                                    className="list-group-item list-group-item-action"
                                    onClick={(e) => {e.preventDefault(); handleLogout()}}
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
                                                        readOnly
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
                                                    type="text" 
                                                    className="form-control" 
                                                    name="imageUrl"
                                                    value={userInfo.imageUrl || ''}
                                                    onChange={handleProfileChange}
                                                    placeholder="http://example.com/image.jpg"
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
                                                    name="oldPassword" // Sửa từ currentPassword thành oldPassword
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
}

export default CustomerDetail;