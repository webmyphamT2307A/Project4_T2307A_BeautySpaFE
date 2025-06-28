import React, { useState, useEffect, useMemo } from 'react';
import axios from 'axios';
import { Link } from 'react-router-dom';
import { ToastContainer, toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import Header from '../shared/header';
import Footer from '../shared/footer';

// ✅ HÀM HELPER MỚI: Xử lý ngày tháng một cách nhất quán
const parseDate = (dateString) => {
    if (!dateString) return null;
    try {
        // Ưu tiên định dạng DD/MM/YYYY mà backend trả về trong DTO
        if (typeof dateString === 'string' && dateString.includes('/')) {
            const [day, month, year] = dateString.split('/').map(Number);
            const date = new Date(year, month - 1, day);
            if (!isNaN(date.getTime())) return date;
        }
        // Fallback cho các định dạng khác (ví dụ: ISO string)
        const date = new Date(dateString);
        return isNaN(date.getTime()) ? null : date;
    } catch (e) {
        console.error("Lỗi parse ngày:", dateString, e);
        return null;
    }
};

// ✅ HÀM HELPER MỚI: Xử lý giá tiền một cách thông minh
const formatVNDPrice = (priceValue) => {
    if (priceValue === null || priceValue === undefined || priceValue === 0) {
        return 'Chưa có giá';
    }

    let numericPrice = 0;

    // Xử lý các format khác nhau từ backend
    if (typeof priceValue === 'string') {
        // Nếu là string có thể chứa ký tự $ hoặc dấu phẩy
        numericPrice = parseFloat(priceValue.replace(/[$,]/g, '')) || 0;
    } else if (typeof priceValue === 'object' && priceValue !== null) {
        // Nếu là BigDecimal object
        numericPrice = Number(priceValue) || 0;
    } else {
        numericPrice = Number(priceValue) || 0;
    }

    // Backend có vẻ đã trả về giá đúng (150000 = 150k VNĐ), không cần nhân thêm
    // Chỉ nhân nếu giá quá nhỏ (< 1000 = có thể là 38 thay vì 380000)
    if (numericPrice > 0 && numericPrice < 1000) {
        numericPrice *= 10000;
    }

    return `${Math.round(numericPrice).toLocaleString('vi-VN')} VNĐ`;
};

// ✅ LOGIC XỬ LÝ TRẠNG THÁI ĐÃ ĐƯỢC CẢI TIẾN (di chuyển ra ngoài component)
const getAppointmentStatus = (item) => {
    // Ưu tiên 1: Trạng thái tường minh từ backend là 'cancelled' hoặc 'completed'
    const directStatus = item.status?.toLowerCase().trim();
    if (directStatus === 'cancelled') {
        return { text: 'Đã hủy', className: 'bg-danger' };
    }
    if (directStatus === 'completed') {
        return { text: 'Đã hoàn thành', className: 'bg-success' };
    }

    // Ưu tiên 2: Logic dựa trên ngày tháng cho các trạng thái còn lại
    const aptDate = parseDate(item.appointmentDate);
    if (!aptDate) {
        return { text: 'Ngày không xác định', className: 'bg-secondary' };
    }
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    aptDate.setHours(0, 0, 0, 0);

    if (aptDate.getTime() < today.getTime()) {
        return { text: 'Đã hoàn thành', className: 'bg-success' };
    }
    if (aptDate.getTime() === today.getTime()) {
        return { text: 'Đang chờ', className: 'bg-warning text-dark' };
    }
    return { text: 'Sắp tới', className: 'bg-info' };
};

const canCancelAppointment = (item) => {
    const { text } = getAppointmentStatus(item);
    // Có thể hủy nếu trạng thái không phải là "Đã hủy" hoặc "Đã hoàn thành"
    return text !== 'Đã hủy' && text !== 'Đã hoàn thành';
};

// Component StarRating để chọn sao
const StarRating = ({ rating, setRating, disabled = false }) => (
    <div className="d-flex justify-content-center" style={{ gap: '0.5rem' }}>
        {[1, 2, 3, 4, 5].map((star) => (
            <i
                key={star}
                className={`fas fa-star ${star <= rating ? 'text-warning' : 'text-light'}`}
                style={{
                    cursor: disabled ? 'default' : 'pointer',
                    fontSize: '1.75rem',
                    transition: 'transform 0.2s',
                }}
                onMouseEnter={(e) => { if (!disabled) e.target.style.transform = 'scale(1.2)'; }}
                onMouseLeave={(e) => { if (!disabled) e.target.style.transform = 'scale(1)'; }}
                onClick={() => { if (!disabled) setRating(star); }}
            ></i>
        ))}
    </div>
);

const ServiceHistoryPage = () => {
    const [history, setHistory] = useState([]);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState('');
    const [userInfo, setUserInfo] = useState(null);
    const [lookupIdentifier, setLookupIdentifier] = useState('');
    const [lookupPerformed, setLookupPerformed] = useState(false);
    const [phoneError, setPhoneError] = useState('');
    const [showCancelModal, setShowCancelModal] = useState(false);
    const [cancelAppointmentId, setCancelAppointmentId] = useState(null);
    const [cancelReason, setCancelReason] = useState('');
    const [isSubmittingCancel, setIsSubmittingCancel] = useState(false);
    const [cancellingAppointments, setCancellingAppointments] = useState(new Set());
    const [customerStats, setCustomerStats] = useState(null);
    const [calculatedTotal, setCalculatedTotal] = useState(0);
    const [autoLookupPerformed, setAutoLookupPerformed] = useState(false); // Thêm state mới

    // Review Modal States
    const [showReviewModal, setShowReviewModal] = useState(false);
    const [reviewingAppointment, setReviewingAppointment] = useState(null);
    const [isSubmittingReview, setIsSubmittingReview] = useState(false);
    const [reviewData, setReviewData] = useState({
        serviceRating: 0,
        staffRating: 0,
        comment: '',
    });

    // ✅ NEW: Filter states
    const [filterStatus, setFilterStatus] = useState('all');
    const [filterStartDate, setFilterStartDate] = useState('');
    const [filterEndDate, setFilterEndDate] = useState('');
    const [searchTerm, setSearchTerm] = useState('');

    // ✅ NEW: Memoized filtered and sorted history
    const filteredAndSortedHistory = useMemo(() => {
        let filtered = history
            .filter(item => {
                // Status filter
                const statusInfo = getAppointmentStatus(item);
                if (filterStatus !== 'all') {
                    let statusMatch = false;
                    if (filterStatus === 'completed' && statusInfo.text === 'Đã hoàn thành') statusMatch = true;
                    if (filterStatus === 'upcoming' && (statusInfo.text === 'Sắp tới' || statusInfo.text === 'Đang chờ')) statusMatch = true;
                    if (filterStatus === 'cancelled' && statusInfo.text === 'Đã hủy') statusMatch = true;
                    if (!statusMatch) return false;
                }

                // Date range filter
                const aptDate = parseDate(item.appointmentDate);
                if (aptDate) {
                    if (filterStartDate && aptDate < new Date(new Date(filterStartDate).setHours(0, 0, 0, 0))) {
                        return false;
                    }
                    if (filterEndDate && aptDate > new Date(new Date(filterEndDate).setHours(23, 59, 59, 999))) {
                        return false;
                    }
                }

                // Search term filter (service name or staff name)
                if (searchTerm) {
                    const term = searchTerm.toLowerCase();
                    const serviceMatch = item.serviceName?.toLowerCase().includes(term);
                    const staffMatch = item.userName?.toLowerCase().includes(term);
                    if (!serviceMatch && !staffMatch) return false;
                }

                return true;
            });

        // Sort by date descending
        return filtered.sort((a, b) => {
            const dateA = parseDate(a.appointmentDate);
            const dateB = parseDate(b.appointmentDate);
            if (!dateA) return 1;
            if (!dateB) return -1;
            return dateB - dateA;
        });
    }, [history, filterStatus, filterStartDate, filterEndDate, searchTerm]);

    // ✅ NEW: Memoized total for filtered data
    const filteredCalculatedTotal = useMemo(() => {
        return filteredAndSortedHistory.reduce((sum, app) => {
            const statusInfo = getAppointmentStatus(app);
            if (statusInfo.text === 'Đã hoàn thành') {
                let parsedPrice = parseFloat(app.servicePrice) || 0;
                if (parsedPrice > 0 && parsedPrice < 1000) {
                    parsedPrice *= 10000;
                }
                return sum + parsedPrice;
            }
            return sum;
        }, 0);
    }, [filteredAndSortedHistory]);

    // ✅ NEW: Check if any filter is active
    const isAnyFilterActive = useMemo(() => {
        return filterStatus !== 'all' || filterStartDate !== '' || filterEndDate !== '' || searchTerm !== '';
    }, [filterStatus, filterStartDate, filterEndDate, searchTerm]);

    const validateVietnamesePhone = (phone) => {
        const cleanPhone = phone.replace(/[\s-().]/g, '');
        const patterns = [
            /^(84|0)(3[2-9]|5[689]|7[06-9]|8[1-689]|9[0-46-9])[0-9]{7}$/,
            /^(84|0)(2[0-9])[0-9]{8}$/,
        ];
        if (cleanPhone.length < 10 || cleanPhone.length > 11) return 'Số điện thoại phải có 10-11 số';
        if (!/^\d+$/.test(cleanPhone)) return 'Số điện thoại chỉ được chứa các chữ số';
        if (!patterns.some(p => p.test(cleanPhone))) return 'Định dạng số điện thoại không hợp lệ (VD: 0987654321)';
        return null;
    };

    const handlePhoneChange = (e) => {
        const value = e.target.value.replace(/[^0-9\s-().]/g, '');
        if (value.length > 15) return;
        setLookupIdentifier(value);
        if (phoneError) setPhoneError('');
        if (value.trim()) {
            setPhoneError(validateVietnamesePhone(value) || '');
        }
    };

    useEffect(() => {
        const storedUser = localStorage.getItem('userInfo');
        const recentBooking = sessionStorage.getItem('recentBooking');

        console.log('📝 Raw userInfo from localStorage:', storedUser);
        console.log('📝 Recent booking from sessionStorage:', recentBooking);

        if (storedUser) {
            const parsedUser = JSON.parse(storedUser);
            console.log('👤 Parsed user info:', parsedUser);

            setUserInfo(parsedUser);
            const customerIdToUse = parsedUser.customerId || parsedUser.id;
            console.log('🆔 Customer ID being used for API call:', customerIdToUse);

            fetchHistoryByCustomerId(customerIdToUse);
            fetchCustomerStats(customerIdToUse);

            // Xóa thông tin đặt lịch vì đã đăng nhập
            if (recentBooking) {
                sessionStorage.removeItem('recentBooking');
            }
        } else if (recentBooking && !autoLookupPerformed) {
            // Người dùng chưa đăng nhập nhưng vừa đặt lịch thành công
            try {
                const bookingInfo = JSON.parse(recentBooking);
                console.log('🎯 Auto lookup for recent booking:', bookingInfo);

                // Kiểm tra xem thông tin có còn mới không (trong vòng 5 phút)
                const timeDiff = Date.now() - bookingInfo.timestamp;
                if (timeDiff < 5 * 60 * 1000 && bookingInfo.phoneNumber) { // 5 phút
                    setLookupIdentifier(bookingInfo.phoneNumber);
                    setAutoLookupPerformed(true);

                    // Hiển thị toast thông báo đang tự động tra cứu
                    // toast.info('Đang tự động tra cứu lịch hẹn vừa đặt...', {
                    //     position: "top-right",
                    //     autoClose: 3000,
                    // });
                    console.log('🔍 Recent booking is fresh, performing auto lookup...');

                    // Tự động thực hiện tra cứu
                    setTimeout(() => {
                        performAutoLookup(bookingInfo.phoneNumber);
                    }, 1000);
                } else {
                    // Thông tin quá cũ, xóa đi
                    sessionStorage.removeItem('recentBooking');
                }
            } catch (error) {
                console.error('❌ Error parsing recent booking:', error);
                sessionStorage.removeItem('recentBooking');
            }
        } else {
            console.log('❌ No userInfo found in localStorage and no recent booking');
        }
    }, [autoLookupPerformed]);

    // Hàm tự động tra cứu
    const performAutoLookup = async (phoneNumber) => {
        console.log('🔍 Performing auto lookup for:', phoneNumber);

        setIsLoading(true);
        setError('');
        setLookupPerformed(true);

        try {
            const response = await axios.get(`http://localhost:8080/api/v1/admin/appointment/history/phone/${phoneNumber}`);
            if (response.data.status === 'SUCCESS' && response.data.data) {
                const processedHistory = processHistoryData(response.data.data);
                setHistory(processedHistory);

                if (processedHistory.length === 0) {
                    setError(`Không tìm thấy lịch hẹn hợp lệ với số điện thoại: ${phoneNumber}`);
                } else {
                    // Hiển thị thông báo thành công
                    // toast.success(`Tìm thấy ${processedHistory.length} lịch hẹn! Lịch hẹn mới nhất đã được hiển thị.`, {
                    //     position: "top-right",
                    //     autoClose: 4000,
                    // });
                    console.log('✅ Auto lookup successful, processed history:', processedHistory);
                }
            } else {
                setHistory([]);
                setCalculatedTotal(0);
                setError(response.data.message || `Không tìm thấy lịch hẹn với số điện thoại: ${phoneNumber}`);
            }
        } catch (err) {
            console.error('❌ Auto lookup error:', err);
            setError('Lỗi kết nối hoặc không tìm thấy lịch hẹn dịch vụ.');
            setHistory([]);
            setCalculatedTotal(0);

            toast.error('Không thể tự động tra cứu lịch hẹn. Vui lòng thử lại thủ công.', {
                position: "top-right",
                autoClose: 3000,
            });
        } finally {
            setIsLoading(false);
            // Xóa thông tin đặt lịch sau khi đã tra cứu xong
            sessionStorage.removeItem('recentBooking');
        }
    };

    const fetchCustomerStats = async (customerId) => {
        try {
            const response = await axios.get(`http://localhost:8080/api/v1/admin/appointment/stats/customer/${customerId}`);
            if (response.data.status === 'SUCCESS') {
                setCustomerStats(response.data.data);
            }
        } catch (error) {
            console.warn('⚠️ Không thể tải thống kê khách hàng:', error);
        }
    };

    const processHistoryData = (data) => {
        const appointmentsData = Array.isArray(data) ? data : [data];
        console.log('🔍 Processing data, total items:', appointmentsData.length);

        // ✅ CẢI TIẾN: Lọc những record có dữ liệu hợp lệ
        const filteredData = appointmentsData.filter(app => {
            console.log(`📋 Item ${app.id || app.appointmentId}:`, {
                serviceName: app.serviceName,
                servicePrice: app.servicePrice,
                userName: app.userName,
                status: app.status,
                appointmentDate: app.appointmentDate,
                fullObject: app
            });

            // Loại bỏ những record không hợp lệ
            const hasValidId = app.id || app.appointmentId;
            const hasValidPrice = app.servicePrice !== null && app.servicePrice !== undefined && app.servicePrice > 0;
            const hasValidName = app.serviceName && app.serviceName.toLowerCase() !== 'n/a' && app.serviceName.trim() !== '';
            const hasValidUserName = app.userName && app.userName.toLowerCase() !== 'n/a' && app.userName.trim() !== '';

            const isValid = hasValidId && hasValidPrice && hasValidName && hasValidUserName;

            console.log(`🔍 Validation for ${app.id || app.appointmentId}:`, {
                hasValidId,
                hasValidPrice,
                hasValidName,
                hasValidUserName,
                isValid
            });

            return isValid;
        });

        console.log('🎯 After filtering, remaining items:', filteredData.length);

        // ✅ DEBUG: Log tất cả dữ liệu trước khi tính tổng
        console.log('🔍 === DEBUGGING TOTAL CALCULATION ===');
        console.log('📊 Raw filtered data:', filteredData);
        filteredData.forEach((app, index) => {
            console.log(`📋 Item ${index + 1}:`, {
                id: app.id || app.appointmentId,
                serviceName: app.serviceName,
                servicePrice: app.servicePrice,
                status: app.status,
                appointmentDate: app.appointmentDate,
                rawPrice: app.servicePrice,
                parsedPrice: parseFloat(app.servicePrice) || 0
            });
        });

        // ✅ TÍNH TỔNG TIỀN chỉ cho lịch hẹn đã hoàn thành (dựa trên getAppointmentStatus)
        const total = filteredData.reduce((sum, app) => {
            // Sử dụng chính hàm getAppointmentStatus để đảm bảo 100% nhất quán
            const statusInfo = (() => {
                const directStatus = app.status?.toLowerCase().trim();
                if (directStatus === 'cancelled') {
                    return { text: 'Đã hủy', className: 'bg-danger' };
                }
                if (directStatus === 'completed') {
                    return { text: 'Đã hoàn thành', className: 'bg-success' };
                }

                const aptDate = parseDate(app.appointmentDate);
                if (!aptDate) {
                    return { text: 'Ngày không xác định', className: 'bg-secondary' };
                }
                const today = new Date();
                today.setHours(0, 0, 0, 0);
                aptDate.setHours(0, 0, 0, 0);

                if (aptDate.getTime() < today.getTime()) {
                    return { text: 'Đã hoàn thành', className: 'bg-success' };
                }
                if (aptDate.getTime() === today.getTime()) {
                    return { text: 'Hôm nay', className: 'bg-warning text-dark' };
                }
                return { text: 'Sắp tới', className: 'bg-info' };
            })();
            const rawPrice = app.servicePrice;
            let parsedPrice = parseFloat(app.servicePrice) || 0;

            // ✅ Áp dụng cùng logic normalize giá như formatVNDPrice
            if (parsedPrice > 0 && parsedPrice < 1000) {
                parsedPrice *= 10000; // Backend trả về 38 thay vì 380000
            }

            // CHỈ tính những lịch hẹn có trạng thái "Đã hoàn thành"
            if (statusInfo.text === 'Đã hoàn thành') {
                console.log(`💰 ADDING to total - ID: ${app.id || app.appointmentId}, Service: ${app.serviceName}, Raw Price: ${rawPrice}, Parsed Price: ${parsedPrice}, Status: ${statusInfo.text}, Sum before: ${sum}, Sum after: ${sum + parsedPrice}`);
                return sum + parsedPrice;
            } else {
                console.log(`❌ NOT ADDING - ID: ${app.id || app.appointmentId}, Service: ${app.serviceName}, Price: ${parsedPrice}, Status: ${statusInfo.text}, Reason: Not completed`);
                return sum;
            }
        }, 0);

        console.log('💰 Calculated total price (completed appointments only):', total);
        setCalculatedTotal(total);

        return filteredData.map(app => ({
            ...app,
            id: app.id || app.appointmentId,
            appointmentId: app.appointmentId || app.id,
        }));
    };

    const fetchHistoryByCustomerId = async (customerId) => {
        setIsLoading(true);
        setError('');
        setLookupPerformed(true);

        const apiUrl = `http://localhost:8080/api/v1/admin/appointment/history/customer/${customerId}`;
        console.log('🌐 Making API call to:', apiUrl);

        try {
            const response = await axios.get(apiUrl);
            console.log('🔍 Backend response for customer history:', response.data);
            console.log('📡 Response status:', response.status);
            console.log('📡 Response headers:', response.headers);

            if (response.data.status === 'SUCCESS' && response.data.data) {
                console.log('📊 Raw data before processing:', response.data.data);
                console.log('📊 Data type:', Array.isArray(response.data.data) ? 'Array' : typeof response.data.data);
                console.log('📊 Data length:', Array.isArray(response.data.data) ? response.data.data.length : 'Not array');

                const processedHistory = processHistoryData(response.data.data);
                console.log('✅ Processed history:', processedHistory);
                console.log('✅ Processed history length:', processedHistory.length);

                setHistory(processedHistory);
            } else {
                console.log('⚠️ Backend response not successful or no data');
                console.log('⚠️ Response status field:', response.data.status);
                console.log('⚠️ Response data field:', response.data.data);
                setHistory([]);
                setError(response.data.message || 'Không tìm thấy lịch hẹn.');
            }
        } catch (err) {
            console.error('❌ Error fetching history:', err);
            console.error('❌ Error response:', err.response);
            console.error('❌ Error status:', err.response?.status);
            console.error('❌ Error data:', err.response?.data);
            setError('Lỗi kết nối hoặc không tìm thấy lịch hẹn dịch vụ.');
            setHistory([]);
        } finally {
            setIsLoading(false);
        }
    };

    const handleLookup = async (e) => {
        e.preventDefault();
        if (phoneError || !lookupIdentifier) {
            setError('Vui lòng nhập số điện thoại hợp lệ.');
            return;
        }
        setIsLoading(true);
        setError('');
        setLookupPerformed(true);
        try {
            const response = await axios.get(`http://localhost:8080/api/v1/admin/appointment/history/phone/${lookupIdentifier}`);
            if (response.data.status === 'SUCCESS' && response.data.data) {
                const processedHistory = processHistoryData(response.data.data);
                setHistory(processedHistory);
                if (processedHistory.length === 0) {
                    setError(`Không tìm thấy lịch hẹn hợp lệ với số điện thoại: ${lookupIdentifier}`);
                }
            } else {
                setHistory([]);
                setCalculatedTotal(0);
                setError(response.data.message || `Không tìm thấy lịch hẹn với số điện thoại: ${lookupIdentifier}`);
            }
        } catch (err) {
            setError('Lỗi kết nối hoặc không tìm thấy lịch hẹn dịch vụ.');
            setHistory([]);
            setCalculatedTotal(0);
        } finally {
            setIsLoading(false);
        }
    };

    const handleShowCancelModal = (appointmentId) => {
        if (cancellingAppointments.has(appointmentId)) return;
        setCancelAppointmentId(appointmentId);
        setCancelReason('');
        setShowCancelModal(true);
    };

    const handleCloseCancelModal = () => {
        setShowCancelModal(false);
        setCancelAppointmentId(null);
        setCancelReason('');
        setIsSubmittingCancel(false);
    };

    const handleCancelAppointment = async () => {
        if (!cancelReason.trim()) {
            toast.warn('Vui lòng nhập lý do hủy đặt lịch.');
            return;
        }

        if (cancelReason.length > 500) {
            toast.warn('Lý do hủy không được vượt quá 500 ký tự.');
            return;
        }

        if (!cancelAppointmentId) return;

        setIsSubmittingCancel(true);
        setCancellingAppointments(prev => new Set(prev).add(cancelAppointmentId));

        try {
            const response = await axios.put(`http://localhost:8080/api/v1/admin/appointment/${cancelAppointmentId}/cancel`, {
                reason: cancelReason
            });

            if (response.data.status === 'SUCCESS' || response.status === 200) {
                toast.success(`Đã hủy lịch hẹn thành công. Lý do: ${cancelReason}`);

                // Cập nhật UI ngay lập tức
                setHistory(prevHistory =>
                    prevHistory.map(item =>
                        item.appointmentId === cancelAppointmentId
                            ? { ...item, status: 'cancelled', canCancel: false, statusText: 'Đã hủy', statusClassName: 'bg-danger' }
                            : item
                    )
                );
                handleCloseCancelModal();
            } else {
                toast.error(response.data.message || 'Không thể hủy lịch hẹn.');
            }
        } catch (error) {
            toast.error(error.response?.data?.message || 'Có lỗi xảy ra khi hủy lịch hẹn.');
        } finally {
            setIsSubmittingCancel(false);
            setCancellingAppointments(prev => {
                const newSet = new Set(prev);
                newSet.delete(cancelAppointmentId);
                return newSet;
            });
        }
    };

    const handleShowReviewModal = (appointment) => {
        setReviewingAppointment(appointment);
        // Reset state trước khi mở modal
        setReviewData({ serviceRating: 0, staffRating: 0, comment: '' });
        setShowReviewModal(true);
    };

    const handleCloseReviewModal = () => {
        setShowReviewModal(false);
        setReviewingAppointment(null);
        setIsSubmittingReview(false);
    };

    const handleSubmitReview = async () => {
        if (reviewData.serviceRating === 0 && reviewData.staffRating === 0) {
            toast.warn("Vui lòng xếp hạng sao cho dịch vụ hoặc nhân viên.");
            return;
        }
        if (!reviewingAppointment) return;

        setIsSubmittingReview(true);

        // Dữ liệu gửi đi, khớp với ReviewServiceAndStaffRequestDTO của backend
        const payload = {
            serviceId: reviewingAppointment.serviceId,
            staffId: reviewingAppointment.userId,
            serviceRating: reviewData.serviceRating,
            staffRating: reviewData.staffRating,
            comment: reviewData.comment,
            // Backend DTO nên có trường này để liên kết review với lịch hẹn
            appointmentId: reviewingAppointment.appointmentId,
        };

        try {
            // Lấy token từ localStorage
            const token = localStorage.getItem('token');
            if (!token) {
                toast.error("Phiên đăng nhập đã hết hạn. Vui lòng đăng nhập lại.");
                setIsSubmittingReview(false);
                return;
            }

            // Cấu hình headers với token
            const config = {
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            };

            // Gọi đến endpoint mới để tạo review cho cả service và staff, đính kèm token
            await axios.post('http://localhost:8080/api/v1/reviews/service-and-staff', payload, config);

            toast.success("Cảm ơn bạn đã gửi đánh giá!");
            handleCloseReviewModal();

            // Refresh lại danh sách lịch sử để cập nhật trạng thái (nút "Đánh giá" sẽ biến mất)
            if (userInfo) {
                const customerIdToUse = userInfo.customerId || userInfo.id;
                fetchHistoryByCustomerId(customerIdToUse);
            } else if (lookupIdentifier && lookupPerformed) {
                // Nếu là guest thì thực hiện lại việc tra cứu
                handleLookup({ preventDefault: () => {} });
            }
        } catch (error) {
            toast.error(error.response?.data?.message || "Có lỗi xảy ra khi gửi đánh giá.");
        } finally {
            setIsSubmittingReview(false);
        }
    };

    const renderFilters = () => (
        <div className="card shadow-sm mb-4 border-0 rounded-3">
            <div className="card-header py-3" style={{
                background: 'linear-gradient(135deg, rgba(255, 182, 193, 0.1) 0%, rgba(247, 168, 184, 0.05) 100%)',
                borderBottom: '2px solid rgba(253, 181, 185, 0.2)',
                borderTopLeftRadius: '15px',
                borderTopRightRadius: '15px'
            }}>
                <h5 className="mb-0 fw-bold" style={{ color: '#2c3e50' }}>
                    <i className="fas fa-filter me-2" style={{ color: '#FDB5B9' }}></i>
                    Bộ Lọc Lịch Hẹn
                </h5>
            </div>
            <div className="card-body p-4">
                <div className="row g-3 align-items-end">
                    <div className="col-lg-3 col-md-6">
                        <label htmlFor="searchTerm" className="form-label fw-bold" style={{ color: '#2c3e50' }}>
                            <i className="fas fa-search me-1" style={{ color: '#FDB5B9' }}></i>
                            Tìm kiếm
                        </label>
                        <input
                            type="text"
                            id="searchTerm"
                            className="form-control rounded-pill border-2"
                            placeholder="Tên dịch vụ, nhân viên..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            style={{
                                borderColor: 'rgba(253, 181, 185, 0.3)',
                                transition: 'all 0.3s ease'
                            }}
                            onFocus={(e) => {
                                e.target.style.borderColor = '#FDB5B9';
                                e.target.style.boxShadow = '0 0 0 0.2rem rgba(253, 181, 185, 0.25)';
                            }}
                            onBlur={(e) => {
                                e.target.style.borderColor = 'rgba(253, 181, 185, 0.3)';
                                e.target.style.boxShadow = 'none';
                            }}
                        />
                    </div>
                    <div className="col-lg-3 col-md-6">
                        <label htmlFor="filterStatus" className="form-label fw-bold" style={{ color: '#2c3e50' }}>
                            <i className="fas fa-flag me-1" style={{ color: '#FDB5B9' }}></i>
                            Trạng thái
                        </label>
                        <select
                            id="filterStatus"
                            className="form-select rounded-pill border-2"
                            value={filterStatus}
                            onChange={(e) => setFilterStatus(e.target.value)}
                            style={{
                                borderColor: 'rgba(253, 181, 185, 0.3)',
                                transition: 'all 0.3s ease'
                            }}
                            onFocus={(e) => {
                                e.target.style.borderColor = '#FDB5B9';
                                e.target.style.boxShadow = '0 0 0 0.2rem rgba(253, 181, 185, 0.25)';
                            }}
                            onBlur={(e) => {
                                e.target.style.borderColor = 'rgba(253, 181, 185, 0.3)';
                                e.target.style.boxShadow = 'none';
                            }}
                        >
                            <option value="all">Tất cả</option>
                            <option value="completed">Đã hoàn thành</option>
                            <option value="upcoming">Sắp tới / Đang chờ</option>
                            <option value="cancelled">Đã hủy</option>
                        </select>
                    </div>
                    <div className="col-lg-2 col-md-4">
                        <label htmlFor="filterStartDate" className="form-label fw-bold" style={{ color: '#2c3e50' }}>
                            <i className="fas fa-calendar-day me-1" style={{ color: '#FDB5B9' }}></i>
                            Từ ngày
                        </label>
                        <input
                            type="date"
                            id="filterStartDate"
                            className="form-control rounded-pill border-2"
                            value={filterStartDate}
                            onChange={(e) => setFilterStartDate(e.target.value)}
                            style={{
                                borderColor: 'rgba(253, 181, 185, 0.3)',
                                transition: 'all 0.3s ease'
                            }}
                            onFocus={(e) => {
                                e.target.style.borderColor = '#FDB5B9';
                                e.target.style.boxShadow = '0 0 0 0.2rem rgba(253, 181, 185, 0.25)';
                            }}
                            onBlur={(e) => {
                                e.target.style.borderColor = 'rgba(253, 181, 185, 0.3)';
                                e.target.style.boxShadow = 'none';
                            }}
                        />
                    </div>
                    <div className="col-lg-2 col-md-4">
                        <label htmlFor="filterEndDate" className="form-label fw-bold" style={{ color: '#2c3e50' }}>
                            <i className="fas fa-calendar-day me-1" style={{ color: '#FDB5B9' }}></i>
                            Đến ngày
                        </label>
                        <input
                            type="date"
                            id="filterEndDate"
                            className="form-control rounded-pill border-2"
                            value={filterEndDate}
                            onChange={(e) => setFilterEndDate(e.target.value)}
                            min={filterStartDate}
                            style={{
                                borderColor: 'rgba(253, 181, 185, 0.3)',
                                transition: 'all 0.3s ease'
                            }}
                            onFocus={(e) => {
                                e.target.style.borderColor = '#FDB5B9';
                                e.target.style.boxShadow = '0 0 0 0.2rem rgba(253, 181, 185, 0.25)';
                            }}
                            onBlur={(e) => {
                                e.target.style.borderColor = 'rgba(253, 181, 185, 0.3)';
                                e.target.style.boxShadow = 'none';
                            }}
                        />
                    </div>
                    <div className="col-lg-2 col-md-4">
                        {isAnyFilterActive && (
                            <button
                                className="btn btn-outline-secondary w-100 rounded-pill border-2 fw-bold"
                                onClick={() => {
                                    setFilterStatus('all');
                                    setFilterStartDate('');
                                    setFilterEndDate('');
                                    setSearchTerm('');
                                }}
                                style={{
                                    borderColor: 'rgba(253, 181, 185, 0.5)',
                                    color: '#FDB5B9',
                                    transition: 'all 0.3s ease'
                                }}
                                onMouseEnter={(e) => {
                                    e.target.style.backgroundColor = '#FDB5B9';
                                    e.target.style.borderColor = '#FDB5B9';
                                    e.target.style.color = 'white';
                                    e.target.style.transform = 'translateY(-2px)';
                                }}
                                onMouseLeave={(e) => {
                                    e.target.style.backgroundColor = 'transparent';
                                    e.target.style.borderColor = 'rgba(253, 181, 185, 0.5)';
                                    e.target.style.color = '#FDB5B9';
                                    e.target.style.transform = 'translateY(0)';
                                }}
                            >
                                <i className="fas fa-undo me-2"></i>Reset
                            </button>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );

    const renderHistoryTable = () => (
        <div className="table-responsive">
            <table className="table table-hover mb-0">
                <thead style={{ backgroundColor: '#f8f9fa' }}>
                    <tr>
                        <th scope="col" className="py-3 border-0" style={{ fontSize: '0.9rem', fontWeight: '600', color: '#495057' }}>
                            <i className="fas fa-hashtag me-2"></i>STT
                        </th>
                        <th scope="col" className="py-3 border-0" style={{ fontSize: '0.9rem', fontWeight: '600', color: '#495057' }}>
                            <i className="fas fa-spa me-2"></i>Dịch Vụ
                        </th>
                        <th scope="col" className="py-3 border-0" style={{ fontSize: '0.9rem', fontWeight: '600', color: '#495057' }}>
                            <i className="fas fa-dollar-sign me-2"></i>Giá Tiền (VNĐ)
                        </th>
                        <th scope="col" className="py-3 border-0" style={{ fontSize: '0.9rem', fontWeight: '600', color: '#495057' }}>
                            <i className="fas fa-calendar-alt me-2"></i>Ngày Hẹn
                        </th>
                        <th scope="col" className="py-3 border-0" style={{ fontSize: '0.9rem', fontWeight: '600', color: '#495057' }}>
                            <i className="fas fa-info-circle me-2"></i>Trạng Thái
                        </th>
                        <th scope="col" className="py-3 border-0" style={{ fontSize: '0.9rem', fontWeight: '600', color: '#495057' }}>
                            <i className="fas fa-user-tie me-2"></i>Nhân Viên
                        </th>
                        <th scope="col" className="py-3 border-0" style={{ fontSize: '0.9rem', fontWeight: '600', color: '#495057' }}>
                            <i className="fas fa-sticky-note me-2"></i>Ghi Chú
                        </th>
                        <th scope="col" className="py-3 border-0" style={{ fontSize: '0.9rem', fontWeight: '600', color: '#495057' }}>
                            <i className="fas fa-cogs me-2"></i>Thao Tác
                        </th>
                    </tr>
                </thead>
                <tbody>
                    {filteredAndSortedHistory.map((item, index) => {
                        const statusInfo = getAppointmentStatus(item);
                        const isCancellable = canCancelAppointment(item);
                        const isCompleted = statusInfo.text === 'Đã hoàn thành';
                        // Giả sử có trường isReviewed từ backend để biết đã đánh giá hay chưa
                        const isReviewed = item.isReviewed === true;

                        return (
                            <tr key={item.id} style={{ borderLeft: `4px solid ${index % 2 === 0 ? '#007bff' : '#28a745'}` }}>
                                <td className="py-3 align-middle">
                                    <span className="badge bg-primary rounded-pill">{index + 1}</span>
                                </td>
                                <td className="py-3 align-items-center">
                                    <div className="d-flex align-items-center">
                                        <div className="bg-primary text-white rounded-circle d-flex align-items-center justify-content-center me-3"
                                            style={{ width: '40px', height: '40px', fontSize: '0.9rem' }}>
                                            <i className="fas fa-spa"></i>
                                        </div>
                                        <div>
                                            <div className="fw-bold text-primary">{item.serviceName}</div>
                                            <small className="text-muted">Mã dịch vụ: #{item.serviceId}</small>
                                        </div>
                                    </div>
                                </td>
                                <td className="py-3 align-middle">
                                    <span className="fw-bold text-success" style={{ fontSize: '1.1rem' }}>
                                        {formatVNDPrice(item.servicePrice || item.price)}
                                    </span>
                                </td>
                                <td className="py-3 align-middle">
                                    <div>
                                        <div className="fw-bold" style={{ color: '#495057' }}>
                                            {item.displayDate || item.appointmentDate}
                                        </div>
                                        {/* <small className="text-muted">{item.slot || item.appointmentTime}</small> */}
                                    </div>
                                </td>
                                <td className="py-3 align-middle">
                                    <span className={`badge ${statusInfo.className} px-3 py-2`} style={{ fontSize: '0.75rem', fontWeight: '600' }}>
                                        <i className={`fas ${statusInfo.text === 'Đã hủy' ? 'fa-times-circle' :
                                            statusInfo.text === 'Đã hoàn thành' ? 'fa-check-circle' :
                                                statusInfo.text === 'Hôm nay' ? 'fa-clock' :
                                                    'fa-calendar-plus'
                                            } me-1`}></i>
                                        {statusInfo.text}
                                    </span>
                                </td>
                                <td className="py-3 align-middle">
                                    <div>
                                        <div className="fw-bold text-info">{item.userName}</div>
                                        <small className="text-muted">Mã lịch hẹn: #{item.appointmentId}</small>
                                    </div>
                                </td>
                                <td className="py-3 align-middle">
                                    <div className="text-muted" style={{ maxWidth: '200px' }}>
                                        {item.notes ? <span>{item.notes}</span> : <em className="text-muted">Không có ghi chú</em>}
                                    </div>
                                </td>
                                <td className="py-3 align-middle">
                                    <div className="d-flex flex-column align-items-center gap-2">
                                        {isCancellable && !cancellingAppointments.has(item.appointmentId) && (
                                            <button
                                                type="button"
                                                className="btn btn-outline-danger btn-sm"
                                                onClick={() => handleShowCancelModal(item.appointmentId)}
                                                disabled={cancellingAppointments.has(item.appointmentId)}
                                            >
                                                <i className="fas fa-times me-1"></i>
                                                Hủy Lịch
                                            </button>
                                        )}
                                        {cancellingAppointments.has(item.appointmentId) && (
                                            <div className="text-warning small">
                                                <i className="fas fa-spinner fa-spin me-1"></i>
                                                Đang hủy...
                                            </div>
                                        )}
                                        {isCompleted && !isReviewed && userInfo && (
                                            <button
                                                className="btn btn-outline-primary btn-sm"
                                                onClick={() => handleShowReviewModal(item)}
                                            >
                                                <i className="fas fa-star me-1"></i>
                                                Đánh giá
                                            </button>
                                        )}
                                        {isCompleted && isReviewed && (
                                            <span className="text-success small">
                                                <i className="fas fa-check-circle me-1"></i>
                                                Đã đánh giá
                                            </span>
                                        )}
                                        {!isCancellable && !isCompleted && (
                                             <span className="text-muted small">
                                                <i className="fas fa-info-circle me-1"></i>
                                                Không thể hủy
                                            </span>
                                        )}
                                    </div>
                                </td>
                            </tr>
                        );
                    })}
                </tbody>
            </table>
            {/* Phần thống kê ở footer table */}
            <div className="p-3 border-top" style={{
                background: 'linear-gradient(135deg, rgba(255, 182, 193, 0.1) 0%, rgba(247, 168, 184, 0.05) 100%)',
                borderBottomLeftRadius: '15px',
                borderBottomRightRadius: '15px'
            }}>
                <div className="row text-center">
                    <div className="col-md-4">
                        <div className="d-flex align-items-center justify-content-center">
                            <div className="text-white rounded-circle d-flex align-items-center justify-content-center me-3"
                                style={{
                                    width: '50px',
                                    height: '50px',
                                    background: 'linear-gradient(135deg, #FDB5B9 0%, #F7A8B8 100%)',
                                    boxShadow: '0 4px 10px rgba(253, 181, 185, 0.3)'
                                }}>
                                <i className="fas fa-list"></i>
                            </div>
                            <div>
                                <div className="fw-bold" style={{ color: '#2c3e50', fontSize: '1.2rem' }}>
                                    {filteredAndSortedHistory.length}
                                </div>
                                <small className="text-muted">Tổng lịch hẹn</small>
                            </div>
                        </div>
                    </div>
                    <div className="col-md-4">
                        <div className="d-flex align-items-center justify-content-center">
                            <div className="text-white rounded-circle d-flex align-items-center justify-content-center me-3"
                                style={{
                                    width: '50px',
                                    height: '50px',
                                    background: 'linear-gradient(135deg, #28a745 0%, #20c997 100%)',
                                    boxShadow: '0 4px 10px rgba(40, 167, 69, 0.3)'
                                }}>
                                <i className="fas fa-coins"></i>
                            </div>
                            <div>
                                <div className="fw-bold text-success" style={{ fontSize: '1.2rem' }}>
                                    {formatVNDPrice(filteredCalculatedTotal)}
                                </div>
                                <small className="text-muted">Tổng chi tiêu</small>
                            </div>
                        </div>
                    </div>
                    <div className="col-md-4">
                        <div className="d-flex align-items-center justify-content-center">
                            <div className="text-white rounded-circle d-flex align-items-center justify-content-center me-3"
                                style={{
                                    width: '50px',
                                    height: '50px',
                                    background: 'linear-gradient(135deg, #17a2b8 0%, #6f42c1 100%)',
                                    boxShadow: '0 4px 10px rgba(23, 162, 184, 0.3)'
                                }}>
                                <i className="fas fa-calendar-check"></i>
                            </div>
                            <div>
                                <div className="fw-bold text-info" style={{ fontSize: '1.2rem' }}>
                                    {filteredAndSortedHistory.length > 0 ? (filteredAndSortedHistory[0].displayDate || filteredAndSortedHistory[0].appointmentDate) : 'Chưa có'}
                                </div>
                                <small className="text-muted">Lần gần nhất</small>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );

    return (
        <div>
            <ToastContainer position="top-right" autoClose={3000} hideProgressBar={false} />
            <Header />
            <div className="container-fluid py-5" style={{ backgroundColor: '#f8f9fa' }}>
                <div className="container">
                    <div className="text-center mx-auto mb-5" style={{ maxWidth: '900px' }}>
                        <h1 className="display-4 mb-3" style={{ color: '#2c3e50' }}>
                            <i className="fas fa-history me-3 text-primary"></i>
                            Lịch Sử Lịch Hẹn
                        </h1>
                        <p className="fs-5 text-muted">
                            {userInfo
                                ? 'Đây là danh sách lịch hẹn và dịch vụ của bạn tại spa của chúng tôi.'
                                : 'Tra cứu lịch hẹn bằng số điện thoại (dành cho khách chưa đăng nhập).'}
                        </p>
                        {/* {userInfo && (
                            <div className="alert alert-info" role="alert">
                                <i className="fas fa-info-circle me-2"></i>
                                <strong>Lưu ý:</strong> Bạn có thể hủy các lịch hẹn sắp tới bằng cách nhấn nút "Hủy Lịch" trong bảng bên dưới.
                                Lịch hẹn chỉ có thể hủy trước ngày hẹn hoặc trong ngày hẹn.
                                <br />
                                <small className="text-muted mt-1 d-block">
                                    <i className="fas fa-filter me-1"></i>
                                    Chỉ hiển thị lịch hẹn hợp lệ (có giá tiền lớn hơn 0, tên dịch vụ và nhân viên không phải N/A).
                                </small>
                            </div>
                        )} */}


                        {/* Thông báo tự động tra cứu */}
                        {!userInfo && autoLookupPerformed && (
                            <div className="alert alert-success" role="alert">
                                <i className="fas fa-magic me-2"></i>
                                <strong>Tự động tra cứu:</strong> Hệ thống đã tự động tra cứu lịch hẹn với số điện thoại bạn vừa sử dụng để đặt lịch.
                            </div>
                        )}
                    </div>


                    {/* Form tra cứu cho guest users - CẢI THIỆN THIẾT KẾ */}
                    {!userInfo && (
                        <div className="row justify-content-center mb-5">
                            <div className="col-lg-8 col-md-10">
                                <div className="card shadow-lg border-0 rounded-4" style={{
                                    background: 'linear-gradient(135deg, rgba(255, 255, 255, 0.95) 0%, rgba(248, 249, 250, 0.9) 100%)',
                                    backdropFilter: 'blur(20px)',
                                    border: '2px solid rgba(253, 181, 185, 0.2)',
                                    overflow: 'hidden'
                                }}>
                                    {/* Header với gradient nhẹ nhàng */}
                                    <div className="card-header text-center py-4 border-0" style={{
                                        background: 'linear-gradient(135deg, rgba(253, 181, 185, 0.15) 0%, rgba(247, 168, 184, 0.1) 100%)',
                                        position: 'relative'
                                    }}>
                                        {/* Decorative elements */}
                                        <div className="position-absolute top-0 start-0 w-100 h-100" style={{
                                            background: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23FDB5B9' fill-opacity='0.1'%3E%3Ccircle cx='7' cy='7' r='7'/%3E%3Ccircle cx='53' cy='53' r='7'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`,
                                            opacity: 0.3
                                        }}></div>

                                        <div className="position-relative">
                                            <div className="d-inline-flex align-items-center justify-content-center mb-3" style={{
                                                width: '80px',
                                                height: '80px',
                                                background: 'linear-gradient(135deg, #FDB5B9 0%, #F7A8B8 100%)',
                                                borderRadius: '50%',
                                                boxShadow: '0 8px 25px rgba(253, 181, 185, 0.3)',
                                                border: '3px solid rgba(255, 255, 255, 0.8)'
                                            }}>
                                                <i className="fas fa-search fa-2x text-white"></i>
                                            </div>
                                            <h4 className="mb-2 fw-bold" style={{ color: '#2c3e50' }}>
                                                Tra Cứu Lịch Hẹn
                                            </h4>
                                            <p className="mb-0" style={{ color: '#6c757d', fontSize: '1rem' }}>
                                                Nhập số điện thoại để xem lịch hẹn của bạn
                                            </p>
                                        </div>
                                    </div>

                                    <div className="card-body p-5">
                                        <form onSubmit={handleLookup}>
                                            <div className="mb-4">
                                                <label className="form-label fw-bold mb-3" style={{ color: '#2c3e50', fontSize: '1.1rem' }}>
                                                    <i className="fas fa-mobile-alt me-2" style={{ color: '#FDB5B9' }}></i>
                                                    Số điện thoại
                                                </label>

                                                <div className="position-relative">
                                                    <div className="input-group input-group-lg shadow-sm" style={{
                                                        borderRadius: '15px',
                                                        overflow: 'hidden'
                                                    }}>
                                                        <span className="input-group-text border-0" style={{
                                                            background: 'linear-gradient(135deg, rgba(253, 181, 185, 0.1) 0%, rgba(247, 168, 184, 0.05) 100%)',
                                                            color: '#FDB5B9',
                                                            fontSize: '1.2rem',
                                                            padding: '0.75rem 1rem'
                                                        }}>
                                                            <i className="fas fa-phone"></i>
                                                        </span>
                                                        <input
                                                            type="tel"
                                                            className={`form-control border-0 ${phoneError ? 'is-invalid' : ''}`}
                                                            placeholder="Ví dụ: 0987654321"
                                                            value={lookupIdentifier}
                                                            onChange={handlePhoneChange}
                                                            maxLength={15}
                                                            required
                                                            style={{
                                                                fontSize: '1.1rem',
                                                                padding: '0.75rem 1rem',
                                                                backgroundColor: 'rgba(248, 249, 250, 0.8)',
                                                                color: '#2c3e50',
                                                                fontWeight: '500'
                                                            }}
                                                        />
                                                    </div>

                                                    {/* Success/Error indicator */}
                                                    {lookupIdentifier && !phoneError && (
                                                        <div className="position-absolute end-0 top-50 translate-middle-y me-3">
                                                            <i className="fas fa-check-circle text-success"></i>
                                                        </div>
                                                    )}
                                                </div>
                                            </div>

                                            {phoneError && (
                                                <div className="alert border-0 rounded-3 py-3 mb-4" style={{
                                                    background: 'linear-gradient(135deg, rgba(220, 53, 69, 0.1) 0%, rgba(248, 215, 218, 0.8) 100%)',
                                                    color: '#721c24'
                                                }}>
                                                    <div className="d-flex align-items-center">
                                                        <i className="fas fa-exclamation-triangle me-2"></i>
                                                        <span className="fw-medium">{phoneError}</span>
                                                    </div>
                                                </div>
                                            )}

                                            <button
                                                type="submit"
                                                className="btn btn-lg w-100 py-3 fw-bold rounded-3 border-0 position-relative overflow-hidden"
                                                disabled={isLoading || !lookupIdentifier.trim() || phoneError}
                                                style={{
                                                    fontSize: '1.1rem',
                                                    background: 'linear-gradient(135deg, #FDB5B9 0%, #F7A8B8 100%)',
                                                    color: 'black',
                                                    boxShadow: '0 8px 25px rgba(253, 181, 185, 0.3)',
                                                    transition: 'all 0.3s ease',
                                                    transform: 'translateY(0)',
                                                    opacity: isLoading || !lookupIdentifier.trim() || phoneError ? 0.6 : 1
                                                }}
                                                onMouseEnter={(e) => {
                                                    if (!isLoading && lookupIdentifier.trim() && !phoneError) {
                                                        e.target.style.transform = 'translateY(-2px)';
                                                        e.target.style.boxShadow = '0 12px 35px rgba(253, 181, 185, 0.4)';
                                                        e.target.style.background = 'linear-gradient(135deg,rgb(255, 149, 170) 0%,rgb(255, 89, 98) 100%)';
                                                    }
                                                }}
                                                onMouseLeave={(e) => {
                                                    e.target.style.transform = 'translateY(0)';
                                                    e.target.style.boxShadow = '0 8px 25px rgba(253, 181, 185, 0.3)';
                                                    e.target.style.background = 'linear-gradient(135deg, #FDB5B9 0%, #F7A8B8 100%)';
                                                }}
                                            >
                                                {/* Button background animation */}
                                                <div className="position-absolute top-0 start-0 w-100 h-100" style={{
                                                    background: `url("data:image/svg+xml,%3Csvg width='40' height='40' viewBox='0 0 40 40' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='%23ffffff' fill-opacity='0.1'%3E%3Ccircle cx='10' cy='10' r='2'/%3E%3Ccircle cx='30' cy='30' r='2'/%3E%3C/g%3E%3C/svg%3E")`,
                                                    opacity: 0.2,
                                                }}></div>

                                                <span className="position-relativeb" style={{ background: 'none',}}>
                                                    {isLoading ? (
                                                        <>
                                                            <div className="spinner-border spinner-border-sm me-3" role="status">
                                                                <span className="visually-hidden">Loading...</span>
                                                            </div>
                                                            Đang tìm kiếm...
                                                        </>
                                                    ) : (
                                                        <>
                                                            <i className="fas fa-search me-3"></i>
                                                            Tra Cứu Lịch Hẹn
                                                        </>
                                                    )}
                                                </span>
                                            </button>

                                            {/* Helper text */}
                                            <div className="text-center mt-4">
                                                <small className="text-muted d-block mb-2">
                                                    <i className="fas fa-info-circle me-1"></i>
                                                    Nhập đúng số điện thoại bạn đã sử dụng khi đặt lịch
                                                </small>
                                                <small style={{ color: '#6c757d' }}>
                                                    Cần hỗ trợ? Gọi hotline:
                                                    <a href="tel:1900xxxx" className="text-decoration-none ms-1" style={{ color: '#FDB5B9', fontWeight: '600' }}>
                                                        0366888894
                                                    </a>
                                                </small>
                                            </div>
                                        </form>
                                    </div>

                                    {/* Decorative footer */}
                                    {/* <div className="card-footer border-0 text-center py-3" style={{
                                        background: 'linear-gradient(135deg, rgba(253, 181, 185, 0.05) 0%, rgba(247, 168, 184, 0.02) 100%)'
                                    }}>
                                        <div className="d-flex justify-content-center align-items-center">
                                            <div className="d-flex align-items-center me-4">
                                                <div className="rounded-circle me-2" style={{
                                                    width: '8px',
                                                    height: '8px',
                                                    backgroundColor: '#28a745'
                                                }}></div>
                                                <small className="text-muted">Bảo mật</small>
                                            </div>
                                            <div className="d-flex align-items-center me-4">
                                                <div className="rounded-circle me-2" style={{
                                                    width: '8px',
                                                    height: '8px',
                                                    backgroundColor: '#17a2b8'
                                                }}></div>
                                                <small className="text-muted">Nhanh chóng</small>
                                            </div>
                                            <div className="d-flex align-items-center">
                                                <div className="rounded-circle me-2" style={{
                                                    width: '8px',
                                                    height: '8px',
                                                    backgroundColor: '#FDB5B9'
                                                }}></div>
                                                <small className="text-muted">Chính xác</small>
                                            </div>
                                        </div>
                                    </div> */}
                                </div>
                            </div>
                        </div>
                    )}


                    {/* Loading và Error states */}
                    {isLoading && (
                        <div className="text-center py-5">
                            <div className="spinner-border text-primary" style={{ width: '3rem', height: '3rem' }} role="status">
                                <span className="visually-hidden">Đang tải...</span>
                            </div>
                            <p className="mt-3 text-muted">
                                {autoLookupPerformed ? 'Đang tự động tìm kiếm lịch hẹn vừa đặt...' : 'Đang tìm kiếm lịch hẹn...'}
                            </p>
                        </div>
                    )}

                    {error && (
                        <div className="row justify-content-center">
                            <div className="col-lg-8">
                                <div className="alert alert-danger text-center py-4" role="alert">
                                    <i className="fas fa-exclamation-triangle fa-2x mb-3 text-danger"></i>
                                    <h5 className="alert-heading">Không tìm thấy kết quả!</h5>
                                    <p className="mb-3">{error}</p>
                                    <hr />
                                    <div className="mb-0">
                                        <button
                                            className="btn btn-outline-danger me-3"
                                            onClick={() => {
                                                setError('');
                                                setLookupIdentifier('');
                                                setLookupPerformed(false);
                                                setHistory([]);
                                            }}
                                        >
                                            <i className="fas fa-redo me-2"></i>
                                            Thử lại
                                        </button>
                                        <small className="text-muted">
                                            Hoặc liên hệ <strong>hotline: 0366888894</strong> để hỗ trợ
                                        </small>
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* Hiển thị lịch sử */}
                    {((userInfo && !isLoading && !error) || (lookupPerformed && !isLoading && !error)) && (
                        history.length > 0 ? (
                            <>
                                {renderFilters()}

                                {filteredAndSortedHistory.length > 0 ? (
                                    <div className="row justify-content-center">
                                        <div className="col-12">
                                            <div className="card shadow-lg border-0 rounded-3">
                                                <div className="card-header text-white py-4" style={{
                                                    background: 'linear-gradient(135deg, #FDB5B9 0%, #F7A8B8 100%)',
                                                    borderTopLeftRadius: '15px',
                                                    borderTopRightRadius: '15px'
                                                }}>
                                                    <div className="d-flex justify-content-between align-items-center">
                                                        <h5 className="mb-0 fw-bold">
                                                            <i className="fas fa-check-circle me-2"></i>
                                                            Tìm thấy {filteredAndSortedHistory.length} lịch hẹn
                                                        </h5>
                                                        <span className="badge bg-white text-dark px-3 py-2 rounded-pill">
                                                            <i className="fas fa-calendar-check me-1"></i>
                                                            Kết quả đã lọc
                                                        </span>
                                                    </div>
                                                </div>
                                                <div className="card-body p-0">
                                                    {renderHistoryTable()}
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                ) : (
                                    <div className="row justify-content-center">
                                        <div className="col-lg-8">
                                            <div className="alert border-0 text-center py-5 rounded-3 shadow-sm"
                                                style={{
                                                    background: 'linear-gradient(135deg, rgba(255, 182, 193, 0.1) 0%, rgba(247, 168, 184, 0.05) 100%)',
                                                    border: '2px solid rgba(253, 181, 185, 0.3) !important'
                                                }}>
                                                <div className="icon-circle mx-auto mb-4" style={{
                                                    width: '80px',
                                                    height: '80px',
                                                    backgroundColor: 'rgba(253, 181, 185, 0.2)',
                                                    borderRadius: '50%',
                                                    display: 'flex',
                                                    alignItems: 'center',
                                                    justifyContent: 'center',
                                                    border: '3px solid #FDB5B9'
                                                }}>
                                                    <i className="fas fa-search-minus fa-2x" style={{ color: '#FDB5B9' }}></i>
                                                </div>
                                                <h4 className="alert-heading fw-bold mb-3" style={{ color: '#2c3e50' }}>
                                                    Không có kết quả phù hợp
                                                </h4>
                                                <p className="mb-4 text-muted" style={{ fontSize: '1.1rem' }}>
                                                    Không tìm thấy lịch hẹn nào khớp với bộ lọc của bạn.
                                                </p>
                                                <button
                                                    className="btn btn-lg px-4 py-2 rounded-pill fw-bold"
                                                    style={{
                                                        background: 'linear-gradient(135deg, #FDB5B9 0%, #F7A8B8 100%)',
                                                        border: 'none',
                                                        color: 'white',
                                                        boxShadow: '0 4px 15px rgba(253, 181, 185, 0.3)',
                                                        transition: 'all 0.3s ease'
                                                    }}
                                                    onClick={() => {
                                                        setFilterStatus('all');
                                                        setFilterStartDate('');
                                                        setFilterEndDate('');
                                                        setSearchTerm('');
                                                    }}
                                                    onMouseEnter={(e) => {
                                                        e.target.style.transform = 'translateY(-2px)';
                                                        e.target.style.boxShadow = '0 6px 20px rgba(253, 181, 185, 0.4)';
                                                    }}
                                                    onMouseLeave={(e) => {
                                                        e.target.style.transform = 'translateY(0)';
                                                        e.target.style.boxShadow = '0 4px 15px rgba(253, 181, 185, 0.3)';
                                                    }}
                                                >
                                                    <i className="fas fa-undo me-2"></i>
                                                    Reset Bộ Lọc
                                                </button>
                                            </div>
                                        </div>
                                    </div>
                                )}
                            </>
                        ) : (
                            <div className="row justify-content-center">
                                <div className="col-lg-8">
                                    <div className="alert border-0 text-center py-5 rounded-3 shadow-sm"
                                        style={{
                                            background: 'linear-gradient(135deg, rgba(255, 182, 193, 0.1) 0%, rgba(247, 168, 184, 0.05) 100%)',
                                            border: '2px solid rgba(253, 181, 185, 0.3) !important'
                                        }}>
                                        <div className="icon-circle mx-auto mb-4" style={{
                                            width: '100px',
                                            height: '100px',
                                            backgroundColor: 'rgba(253, 181, 185, 0.2)',
                                            borderRadius: '50%',
                                            display: 'flex',
                                            alignItems: 'center',
                                            justifyContent: 'center',
                                            border: '3px solid #FDB5B9'
                                        }}>
                                            <i className="fas fa-spa fa-3x" style={{ color: '#FDB5B9' }}></i>
                                        </div>
                                        <h4 className="alert-heading fw-bold mb-3" style={{ color: '#2c3e50' }}>
                                            Chưa có lịch hẹn
                                        </h4>
                                        <p className="mb-4 text-muted" style={{ fontSize: '1.1rem' }}>
                                            {userInfo
                                                ? 'Bạn chưa có lịch hẹn hợp lệ nào (có giá tiền và nhân viên phụ trách) tại spa của chúng tôi.'
                                                : `Không tìm thấy lịch hẹn hợp lệ với số điện thoại: ${lookupIdentifier}`
                                            }
                                        </p>
                                        <Link
                                            to="/ServicePage"
                                            className="btn btn-lg px-4 py-2 rounded-pill fw-bold text-decoration-none"
                                            style={{
                                                background: 'linear-gradient(135deg, #FDB5B9 0%, #F7A8B8 100%)',
                                                border: 'none',
                                                color: 'white',
                                                boxShadow: '0 4px 15px rgba(253, 181, 185, 0.3)',
                                                transition: 'all 0.3s ease'
                                            }}
                                            onMouseEnter={(e) => {
                                                e.target.style.transform = 'translateY(-2px)';
                                                e.target.style.boxShadow = '0 6px 20px rgba(253, 181, 185, 0.4)';
                                            }}
                                            onMouseLeave={(e) => {
                                                e.target.style.transform = 'translateY(0)';
                                                e.target.style.boxShadow = '0 4px 15px rgba(253, 181, 185, 0.3)';
                                            }}
                                        >
                                            <i className="fas fa-spa me-2"></i>
                                            Xem Dịch Vụ
                                        </Link>
                                    </div>
                                </div>
                            </div>
                        )
                    )}
                </div>
            </div>

            {/* Review Modal */}
            {showReviewModal && reviewingAppointment && (
                 <div className="modal-overlay" style={{
                    position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
                    backgroundColor: 'rgba(0, 0, 0, 0.6)', display: 'flex',
                    alignItems: 'center', justifyContent: 'center', zIndex: 1050
                }}>
                    <div className="modal-content" style={{
                        background: '#ffffff', borderRadius: '12px', padding: '1.5rem',
                        width: '90%', maxWidth: '480px',
                        boxShadow: '0 10px 30px rgba(0, 0, 0, 0.2)',
                        animation: 'slideInUp 0.3s ease-out'
                    }}>
                        <div className="modal-header border-0 text-center d-block mb-2">
                            <h4 className="modal-title fw-bold" style={{ color: '#8B4513' }}>Đánh Giá Chất Lượng</h4>
                            <button type="button" className="btn-close" onClick={handleCloseReviewModal} style={{position: 'absolute', top: '1rem', right: '1rem'}}></button>
                        </div>
                        <div className="modal-body px-0 py-2">
                            <div className="mb-3 p-3 bg-light rounded-3" style={{border: '1px solid #eee'}}>
                                <div className="d-flex align-items-center mb-2">
                                    <i className="fas fa-cut me-3 text-danger" style={{fontSize: '1.2rem'}}></i>
                                    <span className="fw-bold me-2">Dịch vụ:</span>
                                    <span className="text-muted">{reviewingAppointment.serviceName}</span>
                                </div>
                                <div className="d-flex align-items-center">
                                    <i className="fas fa-user-tie me-3 text-danger" style={{fontSize: '1.2rem'}}></i>
                                    <span className="fw-bold me-2">Stylist:</span>
                                    <span className="text-muted">{reviewingAppointment.userName}</span>
                                </div>
                            </div>

                            <div className="mb-3 text-center">
                                <label className="form-label fw-bold mb-2">Xếp hạng dịch vụ</label>
                                <StarRating
                                    rating={reviewData.serviceRating}
                                    setRating={(rating) => setReviewData(prev => ({ ...prev, serviceRating: rating }))}
                                />
                            </div>

                            <div className="mb-4 text-center">
                                <label className="form-label fw-bold mb-2">Xếp hạng nhân viên</label>
                                <StarRating
                                    rating={reviewData.staffRating}
                                    setRating={(rating) => setReviewData(prev => ({ ...prev, staffRating: rating }))}
                                />
                            </div>

                            <div className="mb-3">
                                <label htmlFor="reviewComment" className="form-label fw-bold">Bình luận (tùy chọn)</label>
                                <textarea
                                    id="reviewComment"
                                    className="form-control"
                                    rows="3"
                                    placeholder="Chia sẻ cảm nhận của bạn về dịch vụ..."
                                    value={reviewData.comment}
                                    onChange={(e) => setReviewData(prev => ({ ...prev, comment: e.target.value }))}
                                />
                            </div>
                        </div>
                        <div className="modal-footer border-0 d-flex justify-content-end gap-2">
                            <button
                                type="button"
                                className="btn btn-secondary"
                                onClick={handleCloseReviewModal}
                                disabled={isSubmittingReview}
                                style={{backgroundColor: '#6c757d', borderColor: '#6c757d'}}
                            >
                                <i className="fas fa-times me-2"></i>Hủy
                            </button>
                            <button
                                type="button"
                                className="btn"
                                onClick={handleSubmitReview}
                                disabled={isSubmittingReview || (reviewData.serviceRating === 0 && reviewData.staffRating === 0)}
                                style={{backgroundColor: '#e83e8c', color: 'white', borderColor: '#e83e8c'}}
                            >
                                {isSubmittingReview ? (
                                    <>
                                        <span className="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true"></span>
                                        Đang gửi...
                                    </>
                                ) : (
                                    <>
                                        <i className="fas fa-paper-plane me-2"></i>Gửi đánh giá
                                    </>
                                )}
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Cancel Appointment Modal - Simplified */}
            {showCancelModal && (
                <div className="modal-overlay" style={{
                    position: 'fixed',
                    top: 0,
                    left: 0,
                    right: 0,
                    bottom: 0,
                    backgroundColor: 'rgba(0, 0, 0, 0.5)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    zIndex: 9999
                }}>
                    <div className="modal-content" style={{
                        backgroundColor: 'white',
                        borderRadius: '15px',
                        padding: '30px',
                        maxWidth: '500px',
                        width: '90%',
                        boxShadow: '0 10px 30px rgba(0, 0, 0, 0.3)'
                    }}>
                        <div className="modal-header text-center mb-4">
                            <h4 className="text-danger mb-2">
                                <i className="fas fa-exclamation-triangle me-2"></i>
                                Xác Nhận Hủy Lịch Hẹn
                            </h4>
                            <p className="text-muted mb-0">Bạn có chắc chắn muốn hủy lịch hẹn này không?</p>
                        </div>

                        <div className="modal-body">
                            <div className="mb-3">
                                <label className="form-label fw-bold">Lý do hủy đặt lịch *</label>
                                <textarea
                                    value={cancelReason}
                                    onChange={(e) => setCancelReason(e.target.value)}
                                    className="form-control"
                                    rows={4}
                                    placeholder="Vui lòng nhập lý do hủy đặt lịch (tối đa 500 ký tự)..."
                                    maxLength={500}
                                    style={{
                                        resize: 'vertical',
                                        fontSize: '0.95rem'
                                    }}
                                />
                                <div className="d-flex justify-content-between mt-1">
                                    <small className="text-muted">* Bắt buộc</small>
                                    <small className={`${cancelReason.length > 450 ? 'text-warning' : 'text-muted'}`}>
                                        {cancelReason.length}/500 ký tự
                                    </small>
                                </div>
                            </div>

                            {/* Quick reason buttons */}
                            <div className="mb-4">
                                <label className="form-label small text-muted">Hoặc chọn lý do nhanh:</label>
                                <div className="d-flex flex-wrap gap-2">
                                    {[
                                        'Bận đột xuất',
                                        'Thay đổi lịch trình',
                                        'Lý do sức khỏe',
                                        'Có việc gia đình',
                                        'Thời tiết xấu'
                                    ].map((reason, index) => (
                                        <button
                                            key={index}
                                            type="button"
                                            className="btn btn-outline-secondary btn-sm"
                                            onClick={() => setCancelReason(reason)}
                                            style={{ fontSize: '0.8rem' }}
                                        >
                                            {reason}
                                        </button>
                                    ))}
                                </div>
                            </div>

                            <div className="alert alert-warning py-2 mb-3">
                                <small>
                                    <i className="fas fa-exclamation-triangle me-1"></i>
                                    <strong>Lưu ý:</strong> Hành động này không thể hoàn tác. Việc hủy lịch có thể ảnh hưởng đến việc đặt lịch trong tương lai.
                                    Vui lòng hủy trước ít nhất 2 giờ so với giờ hẹn.
                                </small>
                            </div>
                        </div>

                        <div className="modal-footer d-flex justify-content-between">
                            <button
                                type="button"
                                className="btn btn-secondary"
                                onClick={handleCloseCancelModal}
                                disabled={isSubmittingCancel}
                            >
                                <i className="fas fa-times me-1"></i>
                                Đóng
                            </button>
                            <button
                                type="button"
                                className="btn btn-danger"
                                onClick={handleCancelAppointment}
                                disabled={isSubmittingCancel || !cancelReason.trim()}
                            >
                                {isSubmittingCancel ? (
                                    <>
                                        <div className="spinner-border spinner-border-sm me-2" role="status"></div>
                                        Đang hủy...
                                    </>
                                ) : (
                                    <>
                                        <i className="fas fa-check me-1"></i>
                                        Xác nhận hủy
                                    </>
                                )}
                            </button>
                        </div>
                    </div>
                </div>
            )}

            <Footer />
        </div>
    );
};

export default ServiceHistoryPage;