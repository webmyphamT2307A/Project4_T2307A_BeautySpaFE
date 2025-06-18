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
    const [statusMessage, setStatusMessage] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);

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
        setFormData(prevData => ({
            ...prevData,
            [name]: value
        }));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setIsSubmitting(true);
        setStatusMessage('Đang gửi tin nhắn của bạn...');

        try {
            // Trong API call, chúng ta có thể đổi tên trường `firstName` thành `guestName` để khớp với backend nếu cần
            const payload = {
                ...formData,
                guestName: formData.firstName, // Ánh xạ firstName sang guestName nếu backend yêu cầu
            };
            const response = await axios.post('http://localhost:8080/api/v1/feedbacks/created', payload);

            if (response.data.status === 'SUCCESS') {
                setStatusMessage('Tin nhắn của bạn đã được gửi thành công! Cảm ơn bạn.');
                // Xóa các trường người dùng có thể nhập, giữ lại thông tin tự điền nếu đăng nhập
                const initialData = (isAuthenticated && user) 
                    ? { firstName: user.fullName || '', email: user.email || '', phone: user.phone || '' }
                    : { firstName: '', email: '', phone: '' };

                setFormData({
                    ...initialData,
                    subject: '',
                    message: ''
                });
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
        <div className="container-fluid py-5">
            <div className="container py-5">
                <div className="row g-4 align-items-center">
                  <div className="container-fluid pb-5">
                <div className="container py-5">
                    <div className="row g-4 align-items-center">
                        <div className="col-12">
                            <div className="row g-4">
                                <div className="col-lg-4">
                                    <div className="d-inline-flex bg-light w-100 border border-primary p-4 rounded">
                                        <i className="fas fa-map-marker-alt fa-2x text-primary me-4" />
                                        <div>
                                            <h4>Địa chỉ</h4>
                                            <p className="mb-0">123 North tower New York, USA</p>
                                        </div>
                                    </div>
                                </div>
                                <div className="col-lg-4">
                                    <div className="d-inline-flex bg-light w-100 border border-primary p-4 rounded">
                                        <i className="fas fa-envelope fa-2x text-primary me-4" />
                                        <div>
                                            <h4>Email của chúng tôi</h4>
                                            <p className="mb-0">info@example.com</p>
                                        </div>
                                    </div>
                                </div>
                                <div className="col-lg-4">
                                    <div className="d-inline-flex bg-light w-100 border border-primary p-4 rounded">
                                        <i className="fa fa-phone-alt fa-2x text-primary me-4" />
                                        <div>
                                            <h4>Điện thoại</h4>
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
                                <h4 className="text-white fw-bold">Theo dõi chúng tôi</h4>
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

                    <div className="col-12">
                        <div className="bg-light rounded p-4 p-sm-5 mt-5">
                            <div className="text-center mx-auto" style={{ maxWidth: 500 }}>
                                <h2 className="display-6 mb-4">Bạn có câu hỏi nào không?</h2>
                            </div>
                            <form onSubmit={handleSubmit}>
                                <div className="row g-4">
                                    {/* --- BƯỚC 3: THÊM `readOnly` VÀO CÁC Ô INPUT --- */}
                                    <div className="col-lg-6">
                                        <input
                                            type="text"
                                            name="firstName"
                                            className="form-control py-3"
                                            placeholder="Tên của bạn"
                                            required
                                            value={formData.firstName}
                                            onChange={handleChange}
                                            readOnly={isAuthenticated} // Nếu đã đăng nhập thì không cho sửa
                                        />
                                    </div>
                                    <div className="col-lg-6">
                                        <input
                                            type="email"
                                            name="email"
                                            className="form-control py-3"
                                            placeholder="Email của bạn"
                                            required
                                            value={formData.email}
                                            onChange={handleChange}
                                            readOnly={isAuthenticated} // Nếu đã đăng nhập thì không cho sửa
                                        />
                                    </div>
                                    <div className="col-lg-6">
                                        <input
                                            type="text"
                                            name="phone"
                                            className="form-control py-3"
                                            placeholder="Số điện thoại của bạn"
                                            value={formData.phone}
                                            onChange={handleChange}
                                            // Cho phép sửa SĐT nếu muốn
                                        />
                                    </div>
                                    {/* ... các input còn lại ... */}
                                    <div className="col-lg-6">
                                        <input type="text" name="subject" className="form-control py-3" placeholder="Chủ đề" required value={formData.subject} onChange={handleChange} />
                                    </div>
                                    <div className="col-12">
                                        <textarea name="message" className="form-control" rows={5} placeholder="Tin nhắn của bạn" required value={formData.message} onChange={handleChange} />
                                    </div>
                                    <div className="col-12 text-center">
                                        <button className="btn btn-primary w-100 py-3" type="submit" disabled={isSubmitting}>
                                            {isSubmitting ? 'Đang gửi...' : 'Gửi'}
                                        </button>
                                    </div>
                                    {statusMessage && (
                                        <div className="col-12 mt-3 text-center">
                                            <p className={statusMessage.includes('successfully') ? 'text-success' : 'text-danger'}>{statusMessage}</p>
                                        </div>
                                    )}
                                </div>
                            </form>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default Contact;