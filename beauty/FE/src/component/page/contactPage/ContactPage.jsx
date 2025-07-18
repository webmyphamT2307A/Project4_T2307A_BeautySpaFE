import React, { useState, useEffect } from "react";
import axios from "axios";
import Header from "../../shared/header";
import Footer from "../../shared/footer";

const ContactPage = () => {
    // Form state
    const [formData, setFormData] = useState({
        firstName: '',
        email: '',
        phone: '',
        subject: '',
        message: ''
    });

    // UI state
    const [loading, setLoading] = useState(false);
    const [message, setMessage] = useState('');
    const [messageType, setMessageType] = useState('');
    const [userInfo, setUserInfo] = useState(null);

    // Field validation state
    const [validFields, setValidFields] = useState({
        firstName: false,
        email: false,
        phone: false,
        subject: false,
        message: false
    });

    // Check if user is logged in
    useEffect(() => {
        const storedUser = localStorage.getItem('userInfo');
        if (storedUser) {
            const user = JSON.parse(storedUser);
            setUserInfo(user);
            // Pre-fill form for logged in users
            setFormData(prev => ({
                ...prev,
                firstName: user.fullName || '',
                email: user.email || '',
                phone: user.phone || ''
            }));
        }
    }, []);

    // Handle form input changes
    const handleInputChange = (e) => {
        const { name, value } = e.target;
        
        // Format phone number for Vietnamese format
        let formattedValue = value;
        if (name === 'phone') {
            formattedValue = value.replace(/[^0-9\s+()-]/g, '');
        }
        
        setFormData(prev => ({
            ...prev,
            [name]: formattedValue
        }));

        // Validate field
        let isValid = false;
        switch (name) {
            case 'firstName':
                isValid = value.trim().length >= 2;
                break;
            case 'email':
                isValid = isValidEmail(value);
                break;
            case 'phone':
                isValid = !value.trim() || isValidPhone(value);
                break;
            case 'subject':
                isValid = value.trim().length >= 5 && value.trim().length <= 500;
                break;
            case 'message':
                isValid = value.trim().length >= 10 && value.trim().length <= 1000;
                break;
            default:
                break;
        }

        setValidFields(prev => ({
            ...prev,
            [name]: isValid
        }));
    };

    // Email validation
    const isValidEmail = (email) => {
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        return emailRegex.test(email);
    };

    // Phone validation (Vietnamese phone format)
    const isValidPhone = (phone) => {
        if (!phone.trim()) return true; // Phone is optional
        const phoneRegex = /^[0-9\s+()-]+$/;
        if (!phoneRegex.test(phone.trim())) return false;
        // Loại bỏ các ký tự không phải số để kiểm tra độ dài
        const digitsOnly = phone.replace(/\D/g, '');
        return digitsOnly.length >= 9 && digitsOnly.length <= 15;
    };

    // Form validation
    const validateForm = () => {
        // Tên
        if (!formData.firstName.trim()) {
            setMessage('Vui lòng nhập họ và tên của bạn');
            setMessageType('error');
            return false;
        }
        if (formData.firstName.trim().length < 2) {
            setMessage('Họ và tên phải có ít nhất 2 ký tự');
            setMessageType('error');
            return false;
        }

        // Email
        if (!formData.email.trim()) {
            setMessage('Vui lòng nhập email');
            setMessageType('error');
            return false;
        }
        if (!isValidEmail(formData.email)) {
            setMessage('Email không hợp lệ. Vui lòng nhập đúng định dạng email');
            setMessageType('error');
            return false;
        }

        // Phone (optional but validate if provided)
        if (formData.phone.trim() && !isValidPhone(formData.phone)) {
            setMessage('Số điện thoại không hợp lệ. Vui lòng chỉ nhập số và các ký tự +, -, (, )');
            setMessageType('error');
            return false;
        }

        // Subject
        if (!formData.subject.trim()) {
            setMessage('Vui lòng nhập chủ đề');
            setMessageType('error');
            return false;
        }
        if (formData.subject.trim().length < 5) {
            setMessage('Chủ đề phải có ít nhất 5 ký tự');
            setMessageType('error');
            return false;
        }
        if (formData.subject.trim().length > 500) {
            setMessage('Chủ đề không được quá 500  ký tự');
            setMessageType('error');
            return false;
        }

        // Message
        if (!formData.message.trim()) {
            setMessage('Vui lòng nhập nội dung tin nhắn');
            setMessageType('error');
            return false;
        }
        if (formData.message.trim().length < 10) {
            setMessage('Nội dung tin nhắn phải có ít nhất 10 ký tự');
            setMessageType('error');
            return false;
        }

        return true;
    };

    // Handle form submission
    const handleSubmit = async (e) => {
        e.preventDefault();
        setMessage('');

        if (!validateForm()) {
            return;
        }

        setLoading(true);

        try {
            const token = localStorage.getItem('token');
            const headers = {
                'Content-Type': 'application/json'
            };

            // Add authorization header if user is logged in
            if (token) {
                headers['Authorization'] = `Bearer ${token}`;
            }

            const response = await axios.post(
                'http://localhost:8080/api/v1/feedbacks/created',
                {
                    guestName: formData.firstName, // Đồng bộ với Contact.jsx
                    firstName: formData.firstName,
                    email: formData.email,
                    phone: formData.phone,
                    subject: formData.subject,
                    message: formData.message
                },
                { headers }
            );

            if (response.data.status === 'SUCCESS') {
                setMessage('Tin nhắn của bạn đã được gửi thành công! Chúng tôi sẽ liên hệ lại trong thời gian sớm nhất.');
                setMessageType('success');

                // Reset form if user is not logged in
                if (!userInfo) {
                    setFormData({
                        firstName: '',
                        email: '',
                        phone: '',
                        subject: '',
                        message: ''
                    });
                } else {
                    // For logged in users, only reset subject and message
                    setFormData(prev => ({
                        ...prev,
                        subject: '',
                        message: ''
                    }));
                }
            }
        } catch (error) {
            console.error('Error sending feedback:', error);
            const errorMessage = error.response?.data?.message || 'Đã xảy ra lỗi. Vui lòng thử lại sau.';
            setMessage(errorMessage);
            setMessageType('error');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div>
            <Header />
            <div className="container-fluid bg-breadcrumb py-5">
                <div className="container text-center py-5">
                    <h3 className="text-white display-3 mb-4">Liên Hệ</h3>
                    <ol className="breadcrumb justify-content-center mb-0">
                        <li className="breadcrumb-item"><a href="/">Trang Chủ</a></li>
                        <li className="breadcrumb-item"><button className="btn p-0 text-decoration-none">Trang</button></li>
                        <li className="breadcrumb-item active text-white">Liên Hệ</li>
                    </ol>
                </div>
            </div>

            <div className="container-fluid contact py-5" style={{
                background: 'linear-gradient(135deg, #fee2e2 0%, #fecaca 50%, #fdb5b9 100%)',
                position: 'relative',
            }}>
                <div className="container pt-5">
                    <div className="row g-4 align-items-center">
                        <div className="col-lg-6">
                            <div className="text-center">
                                <h1 className="display-3 text-dark mb-4">Liên Hệ Với Chúng Tôi</h1>
                                <p className="text-dark fs-4 bg-transparent">
                                    Chúng tôi luôn sẵn sàng lắng nghe ý kiến từ bạn.
                                    Hãy để lại tin nhắn và chúng tôi sẽ phản hồi trong thời gian sớm nhất.
                                    {userInfo && (
                                        <span className="d-block mt-3 fs-5 bg-light p-3 rounded" style={{ border: '1px solid rgba(253, 181, 185, 0.3)' }}>
                                            <i className="fas fa-user-check me-2 text-success"></i>
                                            Xin chào, {userInfo.fullName}!
                                            <small className="d-block mt-1 text-muted">
                                                Thông tin cá nhân đã được điền tự động từ tài khoản của bạn
                                            </small>
                                        </span>
                                    )}
                                </p>
                            </div>
                        </div>
                        <div className="col-lg-6">
                            <div className="contact-form rounded p-5" style={{
                                backgroundColor: 'rgba(255, 255, 255, 0.95)',
                                backdropFilter: 'blur(10px)',
                                boxShadow: '0 15px 35px rgba(255, 45, 55, 0.2), 0 5px 15px rgba(255, 25, 36, 0.1)',
                                border: '1px solid rgba(253, 181, 185, 0.3)'
                            }}>
                                <form onSubmit={handleSubmit}>
                                    <h1 className="display-6 mb-4">Bạn Có Câu Hỏi Nào Không?</h1>

                                    {/* Success/Error Message */}
                                    {message && (
                                        <div className={`alert ${messageType === 'success' ? 'alert-success' : 'alert-danger'} mb-4`}>
                                            <i className={`fas ${messageType === 'success' ? 'fa-check-circle' : 'fa-exclamation-triangle'} me-2`}></i>
                                            {message}
                                        </div>
                                    )}

                                    <div className="row gx-4 gy-3">
                                        <div className="col-xl-6">
                                            <div className="position-relative">
                                                <input
                                                    type="text"
                                                    name="firstName"
                                                    value={formData.firstName}
                                                    onChange={handleInputChange}
                                                    className={`form-control bg-white py-3 px-4 border rounded ${validFields.firstName ? 'is-valid' : ''}`}
                                                    placeholder="Họ và tên của bạn"
                                                    required
                                                    readOnly={userInfo !== null}
                                                />
                                                {validFields.firstName && (
                                                    <div className="valid-feedback d-block position-absolute" style={{ right: '10px', top: '50%', transform: 'translateY(-50%)' }}>
                                                        <i className="fas fa-check text-success"></i>
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                        <div className="col-xl-6">
                                            <div className="position-relative">
                                                <input
                                                    type="email"
                                                    name="email"
                                                    value={formData.email}
                                                    onChange={handleInputChange}
                                                    className={`form-control bg-white py-3 px-4 border rounded ${validFields.email ? 'is-valid' : ''}`}
                                                    placeholder="Email của bạn"
                                                    required
                                                    readOnly={userInfo !== null}
                                                />
                                                {validFields.email && (
                                                    <div className="valid-feedback d-block position-absolute" style={{ right: '10px', top: '50%', transform: 'translateY(-50%)' }}>
                                                        <i className="fas fa-check text-success"></i>
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                        <div className="col-xl-6">
                                            <div className="position-relative">
                                                <input
                                                    type="text"
                                                    name="phone"
                                                    value={formData.phone}
                                                    onChange={handleInputChange}
                                                    className={`form-control bg-white py-3 px-4 border rounded ${validFields.phone ? 'is-valid' : ''}`}
                                                    placeholder="Số điện thoại (tùy chọn)"
                                                    // readOnly={userInfo !== null}
                                                />
                                                {validFields.phone && formData.phone.trim() && (
                                                    <div className="valid-feedback d-block position-absolute" style={{ right: '10px', top: '50%', transform: 'translateY(-50%)' }}>
                                                        <i className="fas fa-check text-success"></i>
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                        <div className="col-xl-6">
                                            <div className="position-relative">
                                                <input
                                                    type="text"
                                                    name="subject"
                                                    value={formData.subject}
                                                    onChange={handleInputChange}
                                                    className={`form-control bg-white py-3 px-4 border rounded ${validFields.subject ? 'is-valid' : ''}`}
                                                    placeholder="Chủ đề"
                                                    required
                                                />
                                                {validFields.subject && (
                                                    <div className="valid-feedback d-block position-absolute" style={{ right: '10px', top: '50%', transform: 'translateY(-50%)' }}>
                                                        <i className="fas fa-check text-success"></i>
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                        <div className="col-12">
                                            <div className="position-relative">
                                                <textarea
                                                    name="message"
                                                    value={formData.message}
                                                    onChange={handleInputChange}
                                                    className={`form-control py-3 px-4 border rounded ${validFields.message ? 'is-valid' : ''}`}
                                                    rows={4}
                                                    cols={10}
                                                    placeholder="Nội dung tin nhắn của bạn"
                                                    required
                                                />
                                                <small className="text-muted d-block mt-1">
                                                    {formData.message.length}/1000 ký tự
                                                </small>
                                                {validFields.message && (
                                                    <div className="valid-feedback d-block position-absolute" style={{ right: '10px', top: '20px' }}>
                                                        <i className="fas fa-check text-success"></i>
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                        <div className="col-12">
                                            <button
                                                className="btn w-100 py-3 px-5 "
                                                type="submit"
                                                disabled={loading}
                                                style={{
                                                    background: 'linear-gradient(135deg, #fdb5b9 0%, #fecaca 50%)',
                                                    border: 'none',
                                                    color: 'black',
                                                    fontWeight: '600',
                                                    borderRadius: '25px',
                                                    transition: 'all 0.3s ease',
                                                    opacity: loading ? 0.7 : 1,
                                                    cursor: loading ? 'not-allowed' : 'pointer',
                                                    boxShadow: '0 8px 20px rgba(253, 181, 185, 0.3)'
                                                }}
                                                onMouseEnter={(e) => {
                                                    if (!e.target.disabled) {
                                                        e.target.style.background = 'linear-gradient(135deg,rgb(255, 172, 176),rgb(250, 144, 149))';
                                                        e.target.style.transform = 'translateY(-2px)';
                                                    }
                                                }}
                                                onMouseLeave={(e) => {
                                                    e.target.style.background = 'linear-gradient(135deg, #FDB5B9, #f89ca0)';
                                                    e.target.style.transform = 'translateY(0)';
                                                }}
                                            >
                                                {loading ? (
                                                    <>
                                                        <i className="fas fa-spinner fa-spin me-2"></i>
                                                        Đang gửi...
                                                    </>
                                                ) : (
                                                    <>
                                                        <i className="fas fa-paper-plane me-2"></i>
                                                        Gửi tin nhắn
                                                    </>
                                                )}
                                            </button>
                                        </div>
                                    </div>
                                </form>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Contact Info Section */}
            <div className="container-fluid pb-5">
                <div className="container py-5">
                    <div className="row g-4 align-items-center">
                        <div className="col-12">
                            <div className="row g-4">
                                <div className="col-lg-4">
                                    <div className="d-inline-flex bg-light w-100 p-4 rounded" style={{
                                        border: '2px solid #fdb5b9',
                                        boxShadow: '0 5px 15px rgba(253, 181, 185, 0.15)'
                                    }}>
                                        <i className="fas fa-map-marker-alt fa-2x me-4" style={{ color: '#fdb5b9' }} />
                                        <div>
                                            <h4>Địa Chỉ</h4>
                                            <p className="mb-0">22 Đ. Giải Phóng, Phương Mai, Đống Đa</p>
                                        </div>
                                    </div>
                                </div>
                                <div className="col-lg-4">
                                    <div className="d-inline-flex bg-light w-100 p-4 rounded" style={{
                                        border: '2px solid #fdb5b9',
                                        boxShadow: '0 5px 15px rgba(253, 181, 185, 0.15)'
                                    }}>
                                        <i className="fas fa-envelope fa-2x me-4" style={{ color: '#fdb5b9' }} />
                                        <div>
                                            <h4>Email</h4>
                                            <p className="mb-0">info@beautyspa.vn</p>
                                        </div>
                                    </div>
                                </div>
                                <div className="col-lg-4">
                                    <div className="d-inline-flex bg-light w-100 p-4 rounded" style={{
                                        border: '2px solid #fdb5b9',
                                        boxShadow: '0 5px 15px rgba(253, 181, 185, 0.15)'
                                    }}>
                                        <i className="fa fa-phone-alt fa-2x me-4" style={{ color: '#fdb5b9' }} />
                                        <div>
                                            <h4>Điện Thoại</h4>
                                            <p className="mb-0">(+84) 366888894</p>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                        <div className="col-12">
                            <div className="rounded shadow-lg border border-2 border-primary">
                                <iframe
                                    className="rounded-top w-100"
                                    style={{
                                        height: 450,
                                        marginBottom: '-6px',
                                        filter: 'brightness(1.1) contrast(1.1) saturate(1.2)',
                                    }}
                                    title="Bản đồ địa chỉ Beauty Spa"
                                    src="https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d3724.6703376889236!2d105.83851277531139!3d21.00584778063775!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x3135ac778d04e3e1%3A0xd211a8690f6ae0d1!2zMjIgxJAuIEdp4bqjaSBQaMOzbmcsIFBoxrDGoW5nIE1haSwgxJDhu5FuZyDEkGEsIEjDoCBO4buZaSwgVmlldG5hbQ!5e0!3m2!1sen!2s!4v1751101490103!5m2!1sen!2s"
                                    loading="lazy"
                                    referrerPolicy="no-referrer-when-downgrade"
                                />
                            </div>
                            <div className="text-center bg-primary p-4 rounded-bottom bg-gradient" style={{
                                boxShadow: '0 4px 15px rgba(255, 98, 132, 0.3)'
                            }}>
                                <h4 className="text-white fw-bold mb-3" style={{ textShadow: '2px 2px 4px rgba(0,0,0,0.3)' }}>
                                    Theo dõi chúng tôi
                                </h4>
                                <div className="d-flex align-items-center justify-content-center">
                                    <button className="btn btn-light btn-square rounded-circle me-3 shadow-sm" style={{ transform: 'scale(1)', transition: 'all 0.3s ease' }} onMouseEnter={(e) => e.target.style.transform = 'scale(1.1)'} onMouseLeave={(e) => e.target.style.transform = 'scale(1)'}><i className="fab fa-facebook-f" aria-label="Facebook" /></button>
                                    <button className="btn btn-light btn-square rounded-circle me-3 shadow-sm" style={{ transform: 'scale(1)', transition: 'all 0.3s ease' }} onMouseEnter={(e) => e.target.style.transform = 'scale(1.1)'} onMouseLeave={(e) => e.target.style.transform = 'scale(1)'}><i className="fab fa-twitter" aria-label="Twitter" /></button>
                                    <button className="btn btn-light btn-square rounded-circle me-3 shadow-sm" style={{ transform: 'scale(1)', transition: 'all 0.3s ease' }} onMouseEnter={(e) => e.target.style.transform = 'scale(1.1)'} onMouseLeave={(e) => e.target.style.transform = 'scale(1)'}><i className="fab fa-instagram" aria-label="Instagram" /></button>
                                    <button className="btn btn-light btn-square rounded-circle shadow-sm" style={{ transform: 'scale(1)', transition: 'all 0.3s ease' }} onMouseEnter={(e) => e.target.style.transform = 'scale(1.1)'} onMouseLeave={(e) => e.target.style.transform = 'scale(1)'}><i className="fab fa-linkedin-in" aria-label="LinkedIn" /></button>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
            <Footer />
        </div>

    )
}

export default ContactPage;