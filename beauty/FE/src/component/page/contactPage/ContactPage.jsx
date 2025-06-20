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
    const [messageType, setMessageType] = useState(''); // 'success' or 'error'
    const [userInfo, setUserInfo] = useState(null);

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
        setFormData(prev => ({
            ...prev,
            [name]: value
        }));
    };

    // Form validation
    const validateForm = () => {
        if (!formData.firstName.trim()) {
            setMessage('Vui lòng nhập tên của bạn');
            setMessageType('error');
            return false;
        }
        if (!formData.email.trim()) {
            setMessage('Vui lòng nhập email');
            setMessageType('error');
            return false;
        }
        if (!formData.email.includes('@')) {
            setMessage('Email không hợp lệ');
            setMessageType('error');
            return false;
        }
        if (!formData.subject.trim()) {
            setMessage('Vui lòng nhập chủ đề');
            setMessageType('error');
            return false;
        }
        if (!formData.message.trim()) {
            setMessage('Vui lòng nhập nội dung tin nhắn');
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
                    firstName: formData.firstName,
                    email: formData.email,
                    phone: formData.phone,
                    subject: formData.subject,
                    message: formData.message
                },
                { headers }
            );

            if (response.data.status === 'SUCCESS') {
                setMessage('Tin nhắn của bạn đã được gửi thành công! Chúng tôi sẽ liên hệ lại sớm.');
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
            setMessage('Có lỗi xảy ra khi gửi tin nhắn. Vui lòng thử lại sau.');
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
                    <h3 className="text-white display-3 mb-4">Contact Us</h3>
                    <ol className="breadcrumb justify-content-center mb-0">
                        <li className="breadcrumb-item"><a href="index.html">Home</a></li>
                        <li className="breadcrumb-item"><a href="#">Pages</a></li>
                        <li className="breadcrumb-item active text-white">Contact</li>
                    </ol>
                </div>
            </div>

            <div className="container-fluid contact py-5" style={{ background: 'var(--bs-primary)' }}>
                <div className="container pt-5">
                    <div className="row g-4 align-items-center">
                        <div className="col-lg-6">
                            <div className="text-center">
                                <h1 className="display-3 text-white mb-4">Contact Us</h1>
                                <p className="text-white fs-4">
                                    Chúng tôi luôn sẵn sàng lắng nghe ý kiến từ bạn. 
                                    Hãy để lại tin nhắn và chúng tôi sẽ phản hồi trong thời gian sớm nhất.
                                    {userInfo && (
                                        <span className="d-block mt-3 fs-5">
                                            <i className="fas fa-user-check me-2"></i>
                                            Xin chào, {userInfo.fullName}!
                                        </span>
                                    )}
                                </p>
                            </div>
                        </div>
                        <div className="col-lg-6">
                            <div className="contact-form rounded p-5">
                                <form onSubmit={handleSubmit}>
                                    <h1 className="display-6 mb-4">Do You have Any Questions?</h1>
                                    
                                    {/* Success/Error Message */}
                                    {message && (
                                        <div className={`alert ${messageType === 'success' ? 'alert-success' : 'alert-danger'} mb-4`}>
                                            <i className={`fas ${messageType === 'success' ? 'fa-check-circle' : 'fa-exclamation-triangle'} me-2`}></i>
                                            {message}
                                        </div>
                                    )}
                                    
                                    <div className="row gx-4 gy-3">
                                        <div className="col-xl-6">
                                            <input 
                                                type="text" 
                                                name="firstName"
                                                value={formData.firstName}
                                                onChange={handleInputChange}
                                                className="form-control bg-white border-0 py-3 px-4" 
                                                placeholder="Your First Name" 
                                                required
                                            />
                                        </div>
                                        <div className="col-xl-6">
                                            <input 
                                                type="email" 
                                                name="email"
                                                value={formData.email}
                                                onChange={handleInputChange}
                                                className="form-control bg-white border-0 py-3 px-4" 
                                                placeholder="Your Email" 
                                                required
                                            />
                                        </div>
                                        <div className="col-xl-6">
                                            <input 
                                                type="text" 
                                                name="phone"
                                                value={formData.phone}
                                                onChange={handleInputChange}
                                                className="form-control bg-white border-0 py-3 px-4" 
                                                placeholder="Your Phone" 
                                            />
                                        </div>
                                        <div className="col-xl-6">
                                            <input 
                                                type="text" 
                                                name="subject"
                                                value={formData.subject}
                                                onChange={handleInputChange}
                                                className="form-control bg-white border-0 py-3 px-4" 
                                                placeholder="Subject" 
                                                required
                                            />
                                        </div>
                                        <div className="col-12">
                                            <textarea 
                                                name="message"
                                                value={formData.message}
                                                onChange={handleInputChange}
                                                className="form-control bg-white border-0 py-3 px-4" 
                                                rows={4} 
                                                cols={10} 
                                                placeholder="Your Message" 
                                                required
                                            />
                                        </div>
                                        <div className="col-12">
                                            <button 
                                                className="btn btn-primary btn-primary-outline-0 w-100 py-3 px-5" 
                                                type="submit"
                                                disabled={loading}
                                                style={{ 
                                                    opacity: loading ? 0.7 : 1,
                                                    cursor: loading ? 'not-allowed' : 'pointer'
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
                                    <div className="d-inline-flex bg-light w-100 border border-primary p-4 rounded">
                                        <i className="fas fa-map-marker-alt fa-2x text-primary me-4" />
                                        <div>
                                            <h4>Address</h4>
                                            <p className="mb-0">123 North tower New York, USA</p>
                                        </div>
                                    </div>
                                </div>
                                <div className="col-lg-4">
                                    <div className="d-inline-flex bg-light w-100 border border-primary p-4 rounded">
                                        <i className="fas fa-envelope fa-2x text-primary me-4" />
                                        <div>
                                            <h4>Mail Us</h4>
                                            <p className="mb-0">info@example.com</p>
                                        </div>
                                    </div>
                                </div>
                                <div className="col-lg-4">
                                    <div className="d-inline-flex bg-light w-100 border border-primary p-4 rounded">
                                        <i className="fa fa-phone-alt fa-2x text-primary me-4" />
                                        <div>
                                            <h4>Telephone</h4>
                                            <p className="mb-0">(+012) 3456 7890 123</p>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                        <div className="col-12">
                            <div className="rounded">
                                <iframe className="rounded-top w-100" style={{ height: 450, marginBottom: '-6px' }} src="https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d387191.33750346623!2d-73.97968099999999!3d40.6974881!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x89c24fa5d33f083b%3A0xc80b8f06e177fe62!2sNew%20York%2C%20NY%2C%20USA!5e0!3m2!1sen!2sbd!4v1694259649153!5m2!1sen!2sbd" loading="lazy" referrerPolicy="no-referrer-when-downgrade" />
                            </div>
                            <div className=" text-center p-4 rounded-bottom bg-primary">
                                <h4 className="text-white fw-bold">Follow Us</h4>
                                <div className="d-flex align-items-center justify-content-center">
                                    <a href="#" className="btn btn-light btn-light-outline-0 btn-square rounded-circle me-3"><i className="fab fa-facebook-f" /></a>
                                    <a href="#" className="btn btn-light btn-light-outline-0 btn-square rounded-circle me-3"><i className="fab fa-twitter" /></a>
                                    <a href="#" className="btn btn-light btn-light-outline-0 btn-square rounded-circle me-3"><i className="fab fa-instagram" /></a>
                                    <a href="#" className="btn btn-light btn-light-outline-0 btn-square rounded-circle"><i className="fab fa-linkedin-in" /></a>
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