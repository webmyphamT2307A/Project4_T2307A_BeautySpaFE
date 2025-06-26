import React, { useState, useEffect } from "react"; // Thêm useEffect
import axios from 'axios';

// --- BƯỚC 1: TẠO HOẶC IMPORT HOOK ĐỂ KIỂM TRA ĐĂNG NHẬP ---
// Hook này sẽ đọc từ localStorage để lấy thông tin người dùng.
const useAuth = () => {
    const [authInfo, setAuthInfo] = useState(() => {
        try {
            const userString = localStorage.getItem('user');
            const token = localStorage.getItem('token');
            if (userString && token) {
                return { isAuthenticated: true, user: JSON.parse(userString), token };
            }
        } catch (error) {
            console.error("Failed to parse user data from localStorage", error);
            localStorage.removeItem('user');
            localStorage.removeItem('token');
        }
        return { isAuthenticated: false, user: null, token: null };
    });
    return authInfo;
};
// -------------------------------------------------------------

const Contact = () => {
    const { isAuthenticated, user } = useAuth(); // Lấy trạng thái và thông tin người dùng

    const [formData, setFormData] = useState({
        firstName: '',
        email: '',
        phone: '',
        subject: '',
        message: ''
    });

    const [errors, setErrors] = useState({});
    const [statusMessage, setStatusMessage] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);

    // Validation functions
    const validateName = (name) => {
        if (!name.trim()) return 'Tên không được để trống';
        if (name.trim().length < 2) return 'Tên phải có ít nhất 2 ký tự';
        if (name.trim().length > 50) return 'Tên không được quá 50 ký tự';
        if (!/^[a-zA-ZÀ-ỹ\s]+$/.test(name.trim())) return 'Tên chỉ được chứa chữ cái và khoảng trắng';
        return '';
    };

    const validateEmail = (email) => {
        if (!email.trim()) return 'Email không được để trống';
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(email.trim())) return 'Email không hợp lệ';
        if (email.length > 100) return 'Email không được quá 100 ký tự';
        return '';
    };

    const validatePhone = (phone) => {
        if (!phone.trim()) return 'Số điện thoại không được để trống';
        // Chỉ cho phép số và các ký tự +, -, (, ), space
        const phoneRegex = /^[\d\s\-\+\(\)]+$/;
        if (!phoneRegex.test(phone.trim())) return 'Số điện thoại chỉ được chứa số và các ký tự +, -, (, )';
        // Loại bỏ các ký tự không phải số để kiểm tra độ dài
        const digitsOnly = phone.replace(/\D/g, '');
        if (digitsOnly.length < 9) return 'Số điện thoại phải có ít nhất 9 chữ số';
        if (digitsOnly.length > 15) return 'Số điện thoại không được quá 15 chữ số';
        return '';
    };

    const validateSubject = (subject) => {
        if (!subject.trim()) return 'Chủ đề không được để trống';
        if (subject.trim().length < 5) return 'Chủ đề phải có ít nhất 5 ký tự';
        if (subject.trim().length > 100) return 'Chủ đề không được quá 100 ký tự';
        return '';
    };

    const validateMessage = (message) => {
        if (!message.trim()) return 'Tin nhắn không được để trống';
        if (message.trim().length < 10) return 'Tin nhắn phải có ít nhất 10 ký tự';
        if (message.trim().length > 1000) return 'Tin nhắn không được quá 1000 ký tự';
        return '';
    };

    // Real-time validation
    const validateField = (name, value) => {
        let error = '';
        switch (name) {
            case 'firstName':
                error = validateName(value);
                break;
            case 'email':
                error = validateEmail(value);
                break;
            case 'phone':
                error = validatePhone(value);
                break;
            case 'subject':
                error = validateSubject(value);
                break;
            case 'message':
                error = validateMessage(value);
                break;
            default:
                break;
        }

        setErrors(prev => ({
            ...prev,
            [name]: error
        }));

        return error === '';
    };

    // --- BƯỚC 2: SỬ DỤNG useEffect ĐỂ TỰ ĐỘNG ĐIỀN FORM ---
    // Hook này sẽ chạy khi component được tải lần đầu và khi trạng thái đăng nhập thay đổi.
    useEffect(() => {
        if (isAuthenticated && user) {
            setFormData(prevData => ({
                ...prevData, // Giữ lại subject và message nếu người dùng đã gõ
                firstName: user.fullName || '', // Lấy fullName cho ô firstName
                email: user.email || '',
                phone: user.phone || ''
            }));
        }
    }, [isAuthenticated, user]); // Phụ thuộc vào trạng thái đăng nhập

    const handleChange = (e) => {
        const { name, value } = e.target;

        // Format phone number
        let formattedValue = value;
        if (name === 'phone') {
            // Chỉ cho phép số và một số ký tự đặc biệt
            formattedValue = value.replace(/[^0-9\s\-\+\(\)]/g, '');
        }

        setFormData(prevData => ({
            ...prevData,
            [name]: formattedValue
        }));

        // Real-time validation
        validateField(name, formattedValue);
    };

    const validateAllFields = () => {
        const newErrors = {};
        newErrors.firstName = validateName(formData.firstName);
        newErrors.email = validateEmail(formData.email);
        newErrors.phone = validatePhone(formData.phone);
        newErrors.subject = validateSubject(formData.subject);
        newErrors.message = validateMessage(formData.message);

        setErrors(newErrors);

        // Return true if no errors
        return Object.values(newErrors).every(error => error === '');
    };

    const handleSubmit = async (e) => {
        e.preventDefault();

        // Validate all fields before submit
        if (!validateAllFields()) {
            setStatusMessage('Vui lòng sửa các lỗi trong form trước khi gửi.');
            return;
        }

        setIsSubmitting(true);
        setStatusMessage('Đang gửi tin nhắn của bạn...');

        try {
            const payload = {
                ...formData,
                guestName: formData.firstName,
            };
            const response = await axios.post('http://localhost:8080/api/v1/feedbacks/created', payload);

            if (response.data.status === 'SUCCESS') {
                setStatusMessage('Tin nhắn của bạn đã được gửi thành công! Cảm ơn bạn.');
                // Reset form
                const initialData = (isAuthenticated && user)
                    ? { firstName: user.fullName || '', email: user.email || '', phone: user.phone || '' }
                    : { firstName: '', email: '', phone: '' };

                setFormData({
                    ...initialData,
                    subject: '',
                    message: ''
                });
                setErrors({});
            } else {
                setStatusMessage(response.data.message || 'Gửi tin nhắn thất bại. Vui lòng thử lại.');
            }
        } catch (error) {
            const errorMessage = error.response?.data?.message || 'Đã xảy ra lỗi. Vui lòng thử lại sau.';
            setStatusMessage(errorMessage);
            console.error("Error sending feedback:", error);
        } finally {
            setIsSubmitting(false);
        }
    };
    // -----------------------------------------------------------

    return (
        <div className="container-fluid py-4">
            <div className="container py-2">
                <div className="row g-4 align-items-center">
                    <div className="col-12">
                        <div className="bg-light rounded p-4 p-sm-5">
                            <div className="text-center mx-auto" style={{ maxWidth: 500 }}>
                                <h2 className="display-6 mb-4">Bạn có câu hỏi nào không?</h2>
                            </div>
                            <form onSubmit={handleSubmit}>
                                <div className="row g-4">
                                    <div className="col-lg-6">
                                        <input
                                            type="text"
                                            name="firstName"
                                            className={`form-control py-3 ${errors.firstName ? 'is-invalid' : formData.firstName && !errors.firstName ? 'is-valid' : ''}`}
                                            placeholder="Tên của bạn"
                                            required
                                            value={formData.firstName}
                                            onChange={handleChange}
                                            readOnly={isAuthenticated}
                                        />
                                        {errors.firstName && (
                                            <div className="invalid-feedback d-block">
                                                <i className="fas fa-exclamation-circle me-1"></i>
                                                {errors.firstName}
                                            </div>
                                        )}
                                    </div>
                                    <div className="col-lg-6">
                                        <input
                                            type="email"
                                            name="email"
                                            className={`form-control py-3 ${errors.email ? 'is-invalid' : formData.email && !errors.email ? 'is-valid' : ''}`}
                                            placeholder="Email của bạn"
                                            required
                                            value={formData.email}
                                            onChange={handleChange}
                                            readOnly={isAuthenticated}
                                        />
                                        {errors.email && (
                                            <div className="invalid-feedback d-block">
                                                <i className="fas fa-exclamation-circle me-1"></i>
                                                {errors.email}
                                            </div>
                                        )}
                                    </div>
                                    <div className="col-lg-6">
                                        <input
                                            type="text"
                                            name="phone"
                                            className={`form-control py-3 ${errors.phone ? 'is-invalid' : formData.phone && !errors.phone ? 'is-valid' : ''}`}
                                            placeholder="Số điện thoại của bạn"
                                            value={formData.phone}
                                            onChange={handleChange}
                                        />
                                        {errors.phone && (
                                            <div className="invalid-feedback d-block">
                                                <i className="fas fa-exclamation-circle me-1"></i>
                                                {errors.phone}
                                            </div>
                                        )}

                                    </div>
                                    <div className="col-lg-6">
                                        <input
                                            type="text"
                                            name="subject"
                                            className={`form-control py-3 ${errors.subject ? 'is-invalid' : formData.subject && !errors.subject ? 'is-valid' : ''}`}
                                            placeholder="Chủ đề"
                                            required
                                            value={formData.subject}
                                            onChange={handleChange}
                                        />
                                        {errors.subject && (
                                            <div className="invalid-feedback d-block">
                                                <i className="fas fa-exclamation-circle me-1"></i>
                                                {errors.subject}
                                            </div>
                                        )}
                                    </div>
                                    <div className="col-12">
                                        <textarea
                                            name="message"
                                            className={`form-control ${errors.message ? 'is-invalid' : formData.message && !errors.message ? 'is-valid' : ''}`}
                                            rows={5}
                                            placeholder="Tin nhắn của bạn"
                                            required
                                            value={formData.message}
                                            onChange={handleChange}
                                        />
                                        {errors.message && (
                                            <div className="invalid-feedback d-block">
                                                <i className="fas fa-exclamation-circle me-1"></i>
                                                {errors.message}
                                            </div>
                                        )}
                                        <small className="text-muted">
                                            {formData.message.length}/1000 ký tự
                                        </small>
                                    </div>
                                    {isAuthenticated && (
                                        <div className="col-12">
                                            <div className="alert alert-info">
                                                <i className="fas fa-info-circle me-2"></i>
                                                Thông tin cá nhân đã được điền tự động từ tài khoản của bạn.
                                            </div>
                                        </div>
                                    )}
                                    <div className="col-12 text-center">
                                        <button
                                            className="btn btn-primary w-100 py-3"
                                            type="submit"
                                            disabled={isSubmitting || Object.values(errors).some(error => error !== '')}
                                            style={{
                                                background: 'linear-gradient(135deg, #fdb5b9 0%, #fecaca 50%)',
                                                border: 'none',
                                                color: 'white',
                                                fontWeight: '600',
                                                borderRadius: '25px',
                                                transition: 'all 0.3s ease',
                                                boxShadow: '0 8px 20px rgba(253, 181, 185, 0.3)'
                                            }}
                                            onMouseEnter={(e) => {
                                                if (!e.target.disabled) {
                                                    e.target.style.background = 'linear-gradient(135deg, #F7A8B8, #E589A3)';
                                                    e.target.style.transform = 'translateY(-2px)';
                                                }
                                            }}
                                            onMouseLeave={(e) => {
                                                e.target.style.background = 'linear-gradient(135deg, #FDB5B9, #f89ca0)';
                                                e.target.style.transform = 'translateY(0)';
                                            }}
                                        >
                                            {isSubmitting ? (
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
                                    {statusMessage && (
                                        <div className="col-12 mt-3">
                                            <div className={`alert ${statusMessage.includes('thành công') ? 'alert-success' : statusMessage.includes('lỗi') ? 'alert-danger' : 'alert-info'}`}>
                                                <i className={`fas ${statusMessage.includes('thành công') ? 'fa-check-circle' : statusMessage.includes('lỗi') ? 'fa-exclamation-triangle' : 'fa-info-circle'} me-2`}></i>
                                                {statusMessage}
                                            </div>
                                        </div>
                                    )}
                                </div>
                            </form>
                        </div>
                    </div>
                    <div className="col-12 py-5 mt-5">
                        <div className="rounded shadow-lg border border-2 border-primary">
                            <iframe
                                className="rounded-top w-100"
                                style={{
                                    height: 450,
                                    marginBottom: '-6px',
                                    filter: 'brightness(1.1) contrast(1.1) saturate(1.2)',
                                }}
                                src="https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d3919.324408746655!2d106.69749831533343!3d10.78231859230824!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x31752f38f9ed887b%3A0x14aded5703768989!2zQsOgaSBYw6AgRHXDom4gQ2jDrG0!5e0!3m2!1svi!2s!4v1645678901234!5m2!1svi!2s"
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
                                <a href="#" className="btn btn-light btn-square rounded-circle me-3 shadow-sm" style={{ transform: 'scale(1)', transition: 'all 0.3s ease' }} onMouseEnter={(e) => e.target.style.transform = 'scale(1.1)'} onMouseLeave={(e) => e.target.style.transform = 'scale(1)'}><i className="fab fa-facebook-f" /></a>
                                <a href="#" className="btn btn-light btn-square rounded-circle me-3 shadow-sm" style={{ transform: 'scale(1)', transition: 'all 0.3s ease' }} onMouseEnter={(e) => e.target.style.transform = 'scale(1.1)'} onMouseLeave={(e) => e.target.style.transform = 'scale(1)'}><i className="fab fa-twitter" /></a>
                                <a href="#" className="btn btn-light btn-square rounded-circle me-3 shadow-sm" style={{ transform: 'scale(1)', transition: 'all 0.3s ease' }} onMouseEnter={(e) => e.target.style.transform = 'scale(1.1)'} onMouseLeave={(e) => e.target.style.transform = 'scale(1)'}><i className="fab fa-instagram" /></a>
                                <a href="#" className="btn btn-light btn-square rounded-circle shadow-sm" style={{ transform: 'scale(1)', transition: 'all 0.3s ease' }} onMouseEnter={(e) => e.target.style.transform = 'scale(1.1)'} onMouseLeave={(e) => e.target.style.transform = 'scale(1)'}><i className="fab fa-linkedin-in" /></a>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default Contact;