import React, { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import axios from 'axios';
import { toast, ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import Header from '../../shared/header';
import Footer from '../../shared/footer';

// 🔧 Utility functions for staff cache management
const STAFF_CACHE_KEY = 'staffList';
const STAFF_CACHE_EXPIRY_KEY = 'staffListExpiry';
const CACHE_DURATION = 30 * 60 * 1000; // 30 minutes

const getStaffFromCache = () => {
    try {
        const cachedData = localStorage.getItem(STAFF_CACHE_KEY);
        const expiry = localStorage.getItem(STAFF_CACHE_EXPIRY_KEY);
        
        if (cachedData && expiry) {
            const now = Date.now();
            if (now < parseInt(expiry, 10)) {
                return JSON.parse(cachedData);
            } else {
                // Cache expired, remove it
                localStorage.removeItem(STAFF_CACHE_KEY);
                localStorage.removeItem(STAFF_CACHE_EXPIRY_KEY);
            }
        }
    } catch (error) {
        console.warn('⚠️ Error reading staff cache:', error);
    }
    return null;
};

const setStaffToCache = (staffList) => {
    try {
        const expiry = Date.now() + CACHE_DURATION;
        localStorage.setItem(STAFF_CACHE_KEY, JSON.stringify(staffList));
        localStorage.setItem(STAFF_CACHE_EXPIRY_KEY, expiry.toString());
        console.log('💾 Staff list cached for 30 minutes');
    } catch (error) {
        console.warn('⚠️ Error setting staff cache:', error);
    }
};

const StaffReviewPage = () => {
    const { staffId } = useParams();
    const navigate = useNavigate();
    const [staff, setStaff] = useState(null);
    const [reviews, setReviews] = useState([]);
    const [reviewStats, setReviewStats] = useState({
        averageRating: 0,
        totalReviews: 0,
        ratingCounts: [0, 0, 0, 0, 0] // [5star, 4star, 3star, 2star, 1star]
    });
    
    // Review form state
    const [newReview, setNewReview] = useState({ rating: 0, comment: '' });
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [isAuthenticated, setIsAuthenticated] = useState(false);
    const [user, setUser] = useState(null);
    
    // Pagination
    const [currentPage, setCurrentPage] = useState(1);
    const [totalPages, setTotalPages] = useState(1);
    const reviewsPerPage = 10;

    useEffect(() => {
        // Check authentication
        const token = localStorage.getItem('accessToken') || localStorage.getItem('token');
        const userInfo = localStorage.getItem('userInfo');
        
        console.log('🔍 Authentication check:');
        console.log('   Token:', token ? 'Found ✅' : 'Not found ❌');
        console.log('   UserInfo:', userInfo ? 'Found ✅' : 'Not found ❌');
        
        if (token && userInfo) {
            try {
                const parsedUser = JSON.parse(userInfo);
                console.log('👤 User info:', parsedUser);
                setIsAuthenticated(true);
                setUser(parsedUser);
            } catch (error) {
                console.error('❌ Error parsing userInfo:', error);
            }
        } else {
            console.log('⚠️ User not authenticated');
        }

        // Fetch staff details and reviews
        fetchStaffDetails();
        fetchStaffReviews(currentPage - 1);
    }, [staffId, currentPage]);

    // Recalculate stats when staff data changes
    useEffect(() => {
        if (staff && reviews) {
            calculateReviewStats(reviews);
        }
    }, [staff]);

    const fetchStaffDetails = async () => {
        try {
            // 🔍 First: Try to get staff from cache (with expiry check)
            const cachedStaffList = getStaffFromCache();
            if (cachedStaffList) {
                const foundStaff = cachedStaffList.find(staff => staff.id === parseInt(staffId, 10));
                if (foundStaff) {
                    console.log('✅ Found staff in cache:', foundStaff.fullName);
                    setStaff(foundStaff);
                    return; // Exit early if found in cache
                }
            }

            // 🌐 Second: Try the admin API endpoint
            console.log('🔍 Staff not found in cache, trying admin API...');
            try {
                const response = await axios.get(`http://localhost:8080/api/v1/admin/accounts/find-by-id/${staffId}`);
                if (response.data && response.data.status === 'SUCCESS') {
                    console.log('✅ Found staff via admin API:', response.data.data.fullName);
                    setStaff(response.data.data); // ⚠️ Admin API wraps data in ResponseObject
                    return;
                }
            } catch (adminError) {
                console.warn('⚠️ Admin API not accessible:', adminError.response?.status);
            }

            // 🔄 Third: Fallback to staff list API
            console.log('🔄 Trying staff list API...');
            const fallbackResponse = await axios.get('http://localhost:8080/api/v1/user/accounts/staff');
            const staffList = Array.isArray(fallbackResponse.data) 
                ? fallbackResponse.data 
                : (fallbackResponse.data.data || []);
            
            // 💾 Cache the staff list for future use
            setStaffToCache(staffList);
            
            const foundStaff = staffList.find(staff => staff.id === parseInt(staffId, 10));
            if (foundStaff) {
                console.log('✅ Found staff via staff list API:', foundStaff.fullName);
                setStaff(foundStaff);
            } else {
                console.error('❌ Staff not found. Available IDs:', staffList.map(s => s.id));
                toast.error(`Không tìm thấy nhân viên với ID: ${staffId}`);
            }
        } catch (error) {
            console.error('❌ All API attempts failed:', error);
            toast.error('Không thể tải thông tin nhân viên. Vui lòng thử lại sau.');
        }
    };

    const fetchStaffReviews = async (page = 0) => {
        try {
            const response = await axios.get(`http://localhost:8080/api/v1/reviews/item/${staffId}`, {
                params: {
                    page: page,
                    size: reviewsPerPage,
                    sort: 'createdAt,desc'
                }
            });
            
            if (response.data.status === 'SUCCESS') {
                const pageData = response.data.data;
                setReviews(pageData.content || []);
                setTotalPages(pageData.totalPages || 1);
                
                // Calculate review statistics after both staff and reviews are loaded
                if (staff || pageData.content) {
                    calculateReviewStats(pageData.content || []);
                }
            }
        } catch (error) {
            console.error('Error fetching staff reviews:', error);
            setReviews([]);
        }
    };

    const calculateReviewStats = (reviewList) => {
        // 🎯 Use database rating if available, otherwise calculate from reviews
        const dbRating = staff?.averageRating;
        const dbTotalReviews = staff?.totalReviews;
        
        if (dbRating && dbTotalReviews) {
            // ✅ Use database values (more accurate)
            console.log(`📊 Using database rating: ${dbRating} (${dbTotalReviews} reviews)`);
            
            // Count ratings from current reviews for chart
            const ratingCounts = [5, 4, 3, 2, 1].map(star => 
                reviewList.filter(review => review.rating === star).length
            );
            
            setReviewStats({
                averageRating: parseFloat(dbRating),
                totalReviews: parseInt(dbTotalReviews),
                ratingCounts
            });
        } else if (reviewList.length === 0) {
            // ❌ No data available
            setReviewStats({
                averageRating: 0,
                totalReviews: 0,
                ratingCounts: [0, 0, 0, 0, 0]
            });
        } else {
            // 🧮 Fallback: Calculate from current reviews
            console.log('📊 Calculating rating from current reviews (fallback)');
            const totalReviews = reviewList.length;
            const totalRating = reviewList.reduce((sum, review) => sum + review.rating, 0);
            const averageRating = (totalRating / totalReviews).toFixed(1);
            
            const ratingCounts = [5, 4, 3, 2, 1].map(star => 
                reviewList.filter(review => review.rating === star).length
            );

            setReviewStats({
                averageRating: parseFloat(averageRating),
                totalReviews,
                ratingCounts
            });
        }
    };

    const handleReviewSubmit = async (e) => {
        e.preventDefault();
        
        if (isSubmitting) return;

        // Validation
        if (newReview.rating === 0) {
            toast.warn('Vui lòng chọn số sao đánh giá');
            return;
        }

        if (!newReview.comment.trim()) {
            toast.warn('Vui lòng nhập nội dung đánh giá');
            return;
        }

        if (newReview.comment.length > 500) {
            toast.warn('Nội dung đánh giá không được vượt quá 500 ký tự');
            return;
        }

        setIsSubmitting(true);

        const payload = {
            relatedId: parseInt(staffId, 10),
            type: 'USER', // 👈 KEY: Review nhân viên
            rating: newReview.rating,
            comment: newReview.comment,
        };

        try {
            const token = localStorage.getItem('accessToken') || localStorage.getItem('token');
            console.log('🚀 Submitting review:', payload);
            console.log('🔑 Using token:', token ? 'Available ✅' : 'Missing ❌');
            
            const response = await axios.post('http://localhost:8080/api/v1/reviews', payload, {
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                }
            });

            if (response.data.status === 'SUCCESS') {
                toast.success('Đánh giá nhân viên thành công! Cảm ơn bạn đã chia sẻ.');
                setNewReview({ rating: 0, comment: '' });
                setCurrentPage(1);
                fetchStaffReviews(0); // Refresh reviews
            }
        } catch (error) {
            console.error('Error submitting staff review:', error);
            const errorMessage = error.response?.data?.message || 'Có lỗi xảy ra khi gửi đánh giá';
            toast.error(errorMessage);
        } finally {
            setIsSubmitting(false);
        }
    };

    const renderStars = (rating, interactive = false, onStarClick = null) => {
        return [1, 2, 3, 4, 5].map((star) => (
            <span
                key={star}
                onClick={() => interactive && onStarClick && onStarClick(star)}
                style={{
                    fontSize: interactive ? '2rem' : '1.2rem',
                    cursor: interactive ? 'pointer' : 'default',
                    color: star <= rating ? '#ffc107' : '#e4e5e9',
                    marginRight: '2px',
                    userSelect: 'none'
                }}
            >
                ★
            </span>
        ));
    };

    const formatDate = (dateString) => {
        try {
            return new Date(dateString).toLocaleDateString('vi-VN', {
                year: 'numeric',
                month: 'long',
                day: 'numeric'
            });
        } catch {
            return dateString;
        }
    };

    if (!staff) {
        return (
            <div>
                <Header />
                <div className="container py-5">
                    <div className="text-center">
                        <div className="spinner-border text-primary" role="status">
                            <span className="visually-hidden">Đang tải...</span>
                        </div>
                    </div>
                </div>
                <Footer />
            </div>
        );
    }

    return (
        <div>
            <Header />
            <ToastContainer position="top-right" autoClose={3000} />
            
            {/* Staff Profile Header */}
            <div className="container-fluid bg-light py-5">
                <div className="container">
                    <div className="row align-items-center">
                        <div className="col-md-4 text-center">
                            <img
                                src={staff.imageUrl || '/default-avatar.png'}
                                alt={staff.fullName}
                                className="rounded-circle border"
                                style={{
                                    width: '150px',
                                    height: '150px',
                                    objectFit: 'cover',
                                    borderWidth: '4px !important'
                                }}
                            />
                        </div>
                        <div className="col-md-8">
                            <h1 className="display-6 mb-3">{staff.fullName}</h1>
                            <p className="lead text-muted mb-2">{staff.skillsText || 'Chuyên viên Spa'}</p>
                            <p className="text-muted mb-3">{staff.description || 'Nhân viên giàu kinh nghiệm tại spa'}</p>
                            
                            {/* Rating Summary */}
                            <div className="d-flex align-items-center mb-3">
                                <div className="me-3">
                                    {renderStars(reviewStats.averageRating)}
                                </div>
                                <span className="fs-5 fw-bold text-warning me-2">
                                    {reviewStats.averageRating}
                                </span>
                                <span className="text-muted">
                                    ({reviewStats.totalReviews} đánh giá)
                                </span>
                            </div>
                            
                            <button 
                                type="button"
                                className="btn btn-primary"
                                onClick={() => {
                                    navigate('/');
                                    setTimeout(() => {
                                        const appointmentElement = document.getElementById('appointment');
                                        if (appointmentElement) {
                                            const rect = appointmentElement.getBoundingClientRect();
                                            const y = window.scrollY + rect.top - 100;
                                            window.scrollTo({ top: y, behavior: 'smooth' });
                                        }
                                    }, 1000);
                                }}
                            >
                                <i className="fas fa-calendar-plus me-2"></i>
                                Đặt Lịch Hẹn
                            </button>
                        </div>
                    </div>
                </div>
            </div>

            {/* Reviews Section */}
            <div className="container py-5">
                <div className="row">
                    <div className="col-lg-8">
                        {/* Review Statistics */}
                        <div className="card mb-4">
                            <div className="card-body">
                                <h5 className="card-title">Thống Kê Đánh Giá</h5>
                                <div className="row">
                                    <div className="col-md-4 text-center">
                                        <div className="display-4 text-warning fw-bold">
                                            {reviewStats.averageRating}
                                        </div>
                                        <div className="mb-2">
                                            {renderStars(reviewStats.averageRating)}
                                        </div>
                                        <div className="text-muted">
                                            {reviewStats.totalReviews} đánh giá
                                        </div>
                                    </div>
                                    <div className="col-md-8">
                                        {[5, 4, 3, 2, 1].map((star, index) => (
                                            <div key={star} className="d-flex align-items-center mb-2">
                                                <span className="me-2" style={{ minWidth: '60px' }}>
                                                    {star} sao
                                                </span>
                                                <div className="progress flex-grow-1 me-2" style={{ height: '10px' }}>
                                                    <div
                                                        className="progress-bar bg-warning"
                                                        style={{
                                                            width: `${reviewStats.totalReviews > 0 
                                                                ? (reviewStats.ratingCounts[index] / reviewStats.totalReviews) * 100 
                                                                : 0}%`
                                                        }}
                                                    ></div>
                                                </div>
                                                <span className="text-muted" style={{ minWidth: '30px' }}>
                                                    {reviewStats.ratingCounts[index]}
                                                </span>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Review Form */}
                        {isAuthenticated ? (
                            <div className="card mb-4">
                                <div className="card-body">
                                    <h5 className="card-title">Đánh Giá Nhân Viên</h5>
                                    <div className="alert alert-info">
                                        <strong>Đánh giá với tư cách:</strong> {user?.fullName}
                                    </div>
                                    
                                    <form onSubmit={handleReviewSubmit}>
                                        <div className="mb-3">
                                            <label className="form-label fw-bold">Đánh giá của bạn *</label>
                                            <div className="d-flex align-items-center mb-2">
                                                {renderStars(newReview.rating, true, (star) => 
                                                    setNewReview({...newReview, rating: star})
                                                )}
                                                <span className="ms-3 text-muted">
                                                    {newReview.rating === 0 ? 'Chưa chọn đánh giá' : 
                                                     ['', 'Rất tệ', 'Không hài lòng', 'Trung bình', 'Hài lòng', 'Rất hài lòng'][newReview.rating]}
                                                </span>
                                            </div>
                                        </div>

                                        <div className="mb-3">
                                            <label className="form-label fw-bold">
                                                Nhận xét * <small className="text-muted">(Tối đa 500 ký tự)</small>
                                            </label>
                                            <textarea
                                                value={newReview.comment}
                                                onChange={(e) => setNewReview({...newReview, comment: e.target.value})}
                                                className="form-control"
                                                rows="4"
                                                maxLength="500"
                                                placeholder="Chia sẻ trải nghiệm của bạn về nhân viên này..."
                                                required
                                            />
                                            <div className="text-end mt-1">
                                                <small className={newReview.comment.length > 450 ? 'text-warning' : 'text-muted'}>
                                                    {newReview.comment.length}/500 ký tự
                                                </small>
                                            </div>
                                        </div>

                                        <button 
                                            type="submit" 
                                            className="btn btn-primary"
                                            disabled={isSubmitting}
                                        >
                                            {isSubmitting ? (
                                                <>
                                                    <i className="fas fa-spinner fa-spin me-2"></i>
                                                    Đang gửi...
                                                </>
                                            ) : (
                                                <>
                                                    <i className="fas fa-star me-2"></i>
                                                    Gửi Đánh Giá
                                                </>
                                            )}
                                        </button>
                                    </form>
                                </div>
                            </div>
                        ) : (
                            <div className="alert alert-warning text-center">
                                <p className="mb-0">
                                    Vui lòng <Link to="/login" className="fw-bold">đăng nhập</Link> để đánh giá nhân viên.
                                </p>
                            </div>
                        )}

                        {/* Reviews List */}
                        <div className="card">
                            <div className="card-header d-flex justify-content-between align-items-center">
                                <h5 className="mb-0">Tất Cả Đánh Giá ({reviewStats.totalReviews})</h5>
                                {totalPages > 1 && (
                                    <small className="text-muted">
                                        Trang {currentPage} / {totalPages}
                                    </small>
                                )}
                            </div>
                            <div className="card-body">
                                {reviews.length > 0 ? (
                                    <>
                                        {reviews.map((review, index) => (
                                            <div key={review.id} className={`py-3 ${index < reviews.length - 1 ? 'border-bottom' : ''}`}>
                                                <div className="d-flex align-items-start">
                                                    <div className="rounded-circle bg-primary text-white d-flex align-items-center justify-content-center me-3"
                                                         style={{ width: '40px', height: '40px', flexShrink: 0 }}>
                                                        <i className="fas fa-user"></i>
                                                    </div>
                                                    <div className="flex-grow-1">
                                                        <div className="d-flex justify-content-between align-items-start mb-2">
                                                            <div>
                                                                <h6 className="mb-1">{review.authorName}</h6>
                                                                <div className="d-flex align-items-center">
                                                                    {renderStars(review.rating)}
                                                                    <span className="badge bg-light text-dark ms-2">Khách hàng</span>
                                                                </div>
                                                            </div>
                                                            <small className="text-muted">
                                                                {formatDate(review.createdAt)}
                                                            </small>
                                                        </div>
                                                        <p className="mb-2">{review.comment}</p>
                                                        
                                                        {/* Business Reply */}
                                                        {review.replies && review.replies.length > 0 && (
                                                            <div className="mt-3 p-3 bg-light rounded">
                                                                <div className="d-flex align-items-center mb-2">
                                                                    <i className="fas fa-spa text-primary me-2"></i>
                                                                    <strong className="text-primary">Phản hồi từ Spa</strong>
                                                                    <span className="badge bg-primary ms-2">Nhân viên</span>
                                                                </div>
                                                                {review.replies.map(reply => (
                                                                    <div key={reply.id}>
                                                                        <p className="mb-1">{reply.comment}</p>
                                                                        <small className="text-muted">
                                                                            {reply.authorName} - {formatDate(reply.createdAt)}
                                                                        </small>
                                                                    </div>
                                                                ))}
                                                            </div>
                                                        )}
                                                    </div>
                                                </div>
                                            </div>
                                        ))}

                                        {/* Pagination */}
                                        {totalPages > 1 && (
                                            <div className="d-flex justify-content-center mt-4">
                                                <nav>
                                                    <ul className="pagination">
                                                        <li className={`page-item ${currentPage === 1 ? 'disabled' : ''}`}>
                                                            <button 
                                                                className="page-link"
                                                                onClick={() => setCurrentPage(currentPage - 1)}
                                                                disabled={currentPage === 1}
                                                            >
                                                                Trước
                                                            </button>
                                                        </li>
                                                        {[...Array(totalPages)].map((_, index) => (
                                                            <li key={index + 1} className={`page-item ${currentPage === index + 1 ? 'active' : ''}`}>
                                                                <button 
                                                                    className="page-link"
                                                                    onClick={() => setCurrentPage(index + 1)}
                                                                >
                                                                    {index + 1}
                                                                </button>
                                                            </li>
                                                        ))}
                                                        <li className={`page-item ${currentPage === totalPages ? 'disabled' : ''}`}>
                                                            <button 
                                                                className="page-link"
                                                                onClick={() => setCurrentPage(currentPage + 1)}
                                                                disabled={currentPage === totalPages}
                                                            >
                                                                Sau
                                                            </button>
                                                        </li>
                                                    </ul>
                                                </nav>
                                            </div>
                                        )}
                                    </>
                                ) : (
                                    <div className="text-center py-4">
                                        <i className="fas fa-comments fa-3x text-muted mb-3"></i>
                                        <h6>Chưa có đánh giá nào</h6>
                                        <p className="text-muted">Hãy là người đầu tiên đánh giá nhân viên này!</p>
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>

                    {/* Staff Info Sidebar */}
                    <div className="col-lg-4">
                        <div className="card">
                            <div className="card-body">
                                <h5 className="card-title">Thông Tin Nhân Viên</h5>
                                <div className="mb-3">
                                    <strong>Họ tên:</strong>
                                    <p className="mb-1">{staff.fullName}</p>
                                </div>
                                <div className="mb-3">
                                    <strong>Chuyên môn:</strong>
                                    <p className="mb-1">{staff.skillsText || 'Chuyên viên Spa'}</p>
                                </div>
                                <div className="mb-3">
                                    <strong>Vai trò:</strong>
                                    <p className="mb-1">{staff.roleName || 'Nhân viên'}</p>
                                </div>
                                {staff.description && (
                                    <div className="mb-3">
                                        <strong>Mô tả:</strong>
                                        <p className="mb-1">{staff.description}</p>
                                    </div>
                                )}
                                
                                <div className="text-center mt-4">
                                    <Link to="/appointment" className="btn btn-outline-primary w-100">
                                        <i className="fas fa-calendar-plus me-2"></i>
                                        Đặt Lịch Với Nhân Viên Này
                                    </Link>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            <Footer />
        </div>
    );
};

export default StaffReviewPage; 