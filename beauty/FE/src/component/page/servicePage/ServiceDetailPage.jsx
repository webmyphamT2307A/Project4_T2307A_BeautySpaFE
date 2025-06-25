import React, { useEffect, useState } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import Swal from 'sweetalert2';
import Header from '../../shared/header';
import Footer from '../../shared/footer';


const useAuth = () => {
  // Sử dụng state để component có thể re-render khi trạng thái auth thay đổi (ví dụ: sau khi logout)
  const [authInfo, setAuthInfo] = useState(() => {
    try {
      const userString = localStorage.getItem('userInfo');
      const token = localStorage.getItem('token');

      // Nếu có cả thông tin user và token trong localStorage
      if (userString && token) {
        const user = JSON.parse(userString);
        return {
          isAuthenticated: true,
          user: user,
          token: token
        };
      }
    } catch (error) {
      // Nếu có lỗi khi đọc/parse JSON (dữ liệu bị hỏng), xóa đi để đảm bảo an toàn
      console.error("Failed to parse user data from localStorage", error);
      localStorage.removeItem('user');
      localStorage.removeItem('token');
    }

    // Mặc định, nếu không có dữ liệu, trả về trạng thái khách
    return {
      isAuthenticated: false,
      user: null,
      token: null
    };
  });

 

  return authInfo;
};
// ------------------------------------------

const ServiceDetailPage = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { isAuthenticated, user, token } = useAuth();
  
  // Debug removed - allowing all users to reply

  const [editingReviewId, setEditingReviewId] = useState(null);
  const [editedContent, setEditedContent] = useState({ rating: 0, comment: '' });

  const [service, setService] = useState(null);
  const [loading, setLoading] = useState(true);
  const [reviews, setReviews] = useState([]);
  const [relatedServices, setRelatedServices] = useState([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  // Pagination state for reviews
  const [currentPage, setCurrentPage] = useState(1);
  const reviewsPerPage = 5;
  
  // Reply system states - REMOVED: Staff replies managed via admin panel

  // State đã được đơn giản hóa, không còn thông tin khách
  const [newReview, setNewReview] = useState({
    rating: 0,
    comment: '',
  });

  useEffect(() => {
    // Hàm fetch chi tiết dịch vụ
    const fetchServiceDetails = async () => {
      try {
        const response = await fetch(`http://localhost:8080/api/v1/services/${id}`);
        const result = await response.json();
        if (result.status === 'SUCCESS') {
          setService(result.data);
        } else {
          console.error("Failed to fetch service:", result.message);
          setService(null);
        }
      } catch (error) {
        console.error('Error fetching service:', error);
      }
    };

    // Hàm fetch related services
    const fetchRelatedServices = async () => {
      try {
        const response = await fetch('http://localhost:8080/api/v1/services');
        const result = await response.json();
        if (result.status === 'SUCCESS') {
          // Filter out current service and take first 6 services
          const filtered = result.data.filter(s => s.id !== parseInt(id)).slice(0, 6);
          setRelatedServices(filtered);
        }
      } catch (error) {
        console.error('Error fetching related services:', error);
      }
    };

    // Hàm fetch danh sách review
    const fetchReviews = async () => {
      try {
        const response = await fetch(`http://localhost:8080/api/v1/reviews/item/${id}?sort=createdAt,desc`);
        const result = await response.json();
        if (result.status === 'SUCCESS' && result.data.content) {
          setReviews(result.data.content);
        } else {
          console.error("Failed to fetch reviews:", result.message);
        }
      } catch (error) {
        console.error('Error fetching reviews:', error);
      }
    };

    const fetchData = async () => {
      setLoading(true);
      await Promise.all([fetchServiceDetails(), fetchRelatedServices(), fetchReviews()]);
      setLoading(false);
    };

    fetchData();
  }, [id]);
  // Hàm hủy chỉnh sửa
  const handleCancelEdit = () => {
    setEditingReviewId(null);
  };

  // Hàm gửi yêu cầu CẬP NHẬT review
  const handleUpdateSubmit = async (reviewId) => {
    if (isSubmitting) return;
    setIsSubmitting(true);

    try {
      const response = await fetch(`http://localhost:8080/api/v1/reviews/${reviewId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(editedContent)
      });
      const result = await response.json();

      if (response.ok) {
        Swal.fire({
          title: 'Thành công!',
          text: 'Cập nhật đánh giá thành công!',
          icon: 'success',
          confirmButtonColor: '#28a745',
          timer: 2000,
          timerProgressBar: true
        });
        setReviews(reviews.map(r => r.id === reviewId ? result.data : r));
        handleCancelEdit();
      } else {
        Swal.fire({
          title: 'Lỗi!',
          text: `Lỗi: ${result.message}`,
          icon: 'error',
          confirmButtonColor: '#dc3545'
        });
      }
    } catch (error) {
      Swal.fire({
        title: 'Lỗi!',
        text: 'Đã có lỗi xảy ra khi cập nhật.',
        icon: 'error',
        confirmButtonColor: '#dc3545'
      });
    } finally {
      setIsSubmitting(false);
    }
  };
  const handleEditClick = (review) => {
    setEditingReviewId(review.id);
    setEditedContent({ rating: review.rating, comment: review.comment });
  };
  // Hàm gửi yêu cầu XÓA review
  const handleDeleteClick = async (reviewId) => {
    const result = await Swal.fire({
      title: 'Xác nhận xóa',
      text: 'Bạn có chắc chắn muốn xóa đánh giá này không?',
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#dc3545',
      cancelButtonColor: '#6c757d',
      confirmButtonText: 'Xóa ngay',
      cancelButtonText: 'Hủy',
      reverseButtons: true
    });

    if (!result.isConfirmed) {
      return;
    }

    try {
      const response = await fetch(`http://localhost:8080/api/v1/reviews/${reviewId}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` }
      });

      if (response.ok) {
        Swal.fire({
          title: 'Thành công!',
          text: 'Xóa đánh giá thành công!',
          icon: 'success',
          confirmButtonColor: '#28a745',
          timer: 2000,
          timerProgressBar: true
        });
        setReviews(reviews.filter(r => r.id !== reviewId));
      } else {
        const result = await response.json();
        Swal.fire({
          title: 'Lỗi!',
          text: `Lỗi: ${result.message}`,
          icon: 'error',
          confirmButtonColor: '#dc3545'
        });
      }
    } catch (error) {
      Swal.fire({
        title: 'Lỗi!',
        text: 'Đã có lỗi xảy ra khi xóa.',
        icon: 'error',
        confirmButtonColor: '#dc3545'
      });
    }
  };

  // Hàm submit chỉ dành cho người dùng đã đăng nhập
  const handleReviewSubmit = async (e) => {
    e.preventDefault();
    if (isSubmitting) return;

    if (newReview.rating === 0) {
      Swal.fire({
        title: 'Thiếu thông tin!',
        text: 'Vui lòng chọn số sao đánh giá.',
        icon: 'warning',
        confirmButtonColor: '#ffc107'
      });
      return;
    }

    if (!newReview.comment.trim()) {
      Swal.fire({
        title: 'Thiếu thông tin!',
        text: 'Vui lòng nhập nội dung bình luận.',
        icon: 'warning',
        confirmButtonColor: '#ffc107'
      });
      return;
    }

    if (newReview.comment.length > 500) {
      Swal.fire({
        title: 'Nội dung quá dài!',
        text: 'Nội dung bình luận không được vượt quá 500 ký tự.',
        icon: 'warning',
        confirmButtonColor: '#ffc107'
      });
      return;
    }

    setIsSubmitting(true);

    const payload = {
      relatedId: parseInt(id, 10),
      type: 'SERVICE',
      rating: newReview.rating,
      comment: newReview.comment,
    };

    try {
      const headers = {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      };

      const response = await fetch('http://localhost:8080/api/v1/reviews', {
        method: 'POST',
        headers: headers,
        body: JSON.stringify(payload),
      });

      const result = await response.json();

      if (response.ok && result.status === 'SUCCESS') {
        Swal.fire({
          title: 'Cảm ơn bạn!',
          text: 'Đánh giá của bạn đã được gửi thành công!',
          icon: 'success',
          confirmButtonColor: '#28a745',
          timer: 3000,
          timerProgressBar: true
        });
        setReviews((prev) => [result.data, ...prev]);
        setNewReview({ rating: 0, comment: '' });
        setCurrentPage(1); // Reset to first page when new review is added
      } else {
        Swal.fire({
          title: 'Gửi thất bại!',
          text: `Gửi đánh giá thất bại: ${result.message}`,
          icon: 'error',
          confirmButtonColor: '#dc3545'
        });
      }
    } catch (error) {
      console.error('Error submitting review:', error);
      Swal.fire({
        title: 'Lỗi!',
        text: 'Đã xảy ra lỗi. Vui lòng thử lại.',
        icon: 'error',
        confirmButtonColor: '#dc3545'
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const ratingCounts = [5, 4, 3, 2, 1].map((star) =>
    reviews.filter((r) => r.rating === star).length
  );

  const averageRating = reviews.length
    ? (reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length).toFixed(1)
    : '0.0';

  // Pagination calculations
  const totalPages = Math.ceil(reviews.length / reviewsPerPage);
  const startIndex = (currentPage - 1) * reviewsPerPage;
  const endIndex = startIndex + reviewsPerPage;
  const currentReviews = reviews.slice(startIndex, endIndex);

  // Handle page change
  const handlePageChange = (pageNumber) => {
    setCurrentPage(pageNumber);
    // Scroll to reviews section
    document.getElementById('reviews-section')?.scrollIntoView({ behavior: 'smooth' });
  };

  // Reply handling functions - REMOVED: Staff replies managed via admin panel

  // Component to render simple replies (no threading)
  const renderReplies = (replies) => {
    if (!replies || replies.length === 0) return null;

    return replies.map((reply) => (
      <div key={reply.id} className="reply-container" style={{
        marginLeft: '20px',
        marginTop: '15px',
        padding: '20px',
        background: 'linear-gradient(135deg, #f8fff8 0%, #e8f5e8 100%)',
        borderLeft: '4px solid #28a745',
        borderRadius: '12px',
        position: 'relative',
        wordWrap: 'break-word',
        boxShadow: '0 2px 8px rgba(40, 167, 69, 0.1)',
        border: '1px solid rgba(40, 167, 69, 0.2)'
      }}>
        {/* Business Reply Badge */}
        <div style={{
          position: 'absolute',
          top: '-8px',
          left: '15px',
          background: '#28a745',
          color: 'white',
          padding: '4px 12px',
          borderRadius: '12px',
          fontSize: '0.7rem',
          fontWeight: '600'
        }}>
          <i className="fas fa-check-circle" style={{ marginRight: '4px' }}></i>
          Phản hồi từ spa
        </div>

        {/* Author Info */}
        <div style={{ display: 'flex', alignItems: 'center', marginBottom: '15px', marginTop: '8px' }}>
          <div style={{
            width: '40px',
            height: '40px',
            borderRadius: '50%',
            background: 'linear-gradient(135deg, #28a745, #20c997)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            marginRight: '12px',
            flexShrink: 0
          }}>
            <i className="fas fa-user-tie" style={{ color: 'white', fontSize: '1rem' }}></i>
          </div>
          <div style={{ flex: 1 }}>
            <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'baseline', gap: '8px' }}>
              <strong style={{ 
                color: '#28a745', 
                fontSize: '1.1rem'
              }}>
                {reply.authorName}
              </strong>
              <span style={{
                background: '#e8f5e8',
                color: '#155724',
                padding: '2px 8px',
                borderRadius: '10px',
                fontSize: '0.8rem',
                fontWeight: '600'
              }}>
                Nhân viên
              </span>
              <small style={{ color: '#666', fontSize: '0.9rem', flexShrink: 0 }}>
                {new Date(reply.createdAt).toLocaleString('vi-VN')}
              </small>
            </div>
          </div>
        </div>

        {/* Reply Content */}
        <div style={{
          background: 'white',
          padding: '15px',
          borderRadius: '8px',
          border: '1px solid rgba(40, 167, 69, 0.3)',
          boxShadow: '0 1px 3px rgba(40, 167, 69, 0.1)'
        }}>
          <p style={{ 
            margin: 0, 
            color: '#333', 
            fontSize: '1rem',
            lineHeight: '1.6',
            wordWrap: 'break-word',
            overflowWrap: 'break-word'
          }}>
            {reply.comment}
          </p>
        </div>

        {/* Helpful indicator */}
        <div style={{
          marginTop: '10px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'flex-end'
        }}>
          <span style={{
            color: '#28a745',
            fontSize: '0.9rem',
            fontStyle: 'italic',
            display: 'flex',
            alignItems: 'center',
            gap: '5px'
          }}>
            <i className="fas fa-heart" style={{ fontSize: '0.8rem' }}></i>
            Cảm ơn bạn đã chia sẻ!
          </span>
        </div>
      </div>
    ));
  };

  if (loading) return <div style={{ textAlign: 'center', marginTop: 40, fontSize: '1.2rem' }}>Đang tải...</div>;
  if (!service) return <div style={{ textAlign: 'center', marginTop: 40, fontSize: '1.2rem' }}>Không tìm thấy dịch vụ</div>;

  return (
    <div>
      <Header />
      
      {/* Main Content Container - Full Width */}
      <div className="container-fluid py-4" style={{ backgroundColor: '#fafafa', minHeight: '100vh' }}>
        <div className="container">
          <Link to="/ServicePage" style={{ marginBottom: 20, display: 'inline-block', border: '1px solid #f8a4c1', padding: '8px 16px', color: '#333', textDecoration: 'none', fontWeight: 'bold', transition: 'background-color 0.3s, color 0.3s', borderRadius: '999px' }}>
            ← Quay lại Dịch vụ
          </Link>

          {/* PHẦN THÔNG TIN DỊCH VỤ - New Layout */}
          <div className="row">
            {/* Bên trái: Ảnh dịch vụ và thông tin chính - Chiếm 9/12 phần */}
            <div className="col-md-9 mb-4">
              <img
                src={service.imageUrl || service.image_url || '/default-image.jpg'}
                alt={service.name}
                style={{
                  borderRadius: 15,
                  boxShadow: '0 8px 16px rgba(0,0,0,0.15)',
                  width: '100%',
                  marginBottom: '20px'
                }}
              />
              <h2 style={{ fontSize: '2.5rem', color: '#d6336c', fontWeight: 700 }}>
                {service.name}
              </h2>
              <p>
                <strong>Giá:</strong>{' '}
                {service.price ? `${service.price.toLocaleString()}$` : 'N/A'}
              </p>
              <p style={{ whiteSpace: 'pre-line' }}>{service.description}</p>
              <button 
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
                                  style={{
                    background: 'linear-gradient(90deg, #f09397 0%, #f5576c 100%)',
                    color: 'white',
                    fontWeight: '700',
                    borderRadius: 30,
                    padding: '15px 45px',
                    display: 'inline-block',
                    marginTop: 20,
                    textDecoration: 'none',
                    border: 'none',
                    cursor: 'pointer',
                    transition: 'all 0.3s ease',
                    boxShadow: '0 8px 25px rgba(240, 147, 151, 0.4)',
                    fontSize: '1.1rem',
                    letterSpacing: '0.5px',
                    position: 'relative',
                    zIndex: 2
                  }}
                onMouseEnter={(e) => {
                  e.target.style.transform = 'translateY(-4px) scale(1.05)';
                  e.target.style.boxShadow = '0 15px 35px rgba(240, 147, 151, 0.6)';
                }}
                onMouseLeave={(e) => {
                  e.target.style.transform = 'translateY(0) scale(1)';
                  e.target.style.boxShadow = '0 8px 25px rgba(240, 147, 151, 0.4)';
                }}
              >
                ĐĂNG KÝ NGAY!
              </button>
            </div>

            {/* Bên phải: Gợi ý dịch vụ - Beautiful Design - Chiếm 3/12 phần */}
            <div className="col-md-3">
              <div style={{
                background: 'linear-gradient(135deg, #ff9a9e 0%, #fecfef 50%, #ffecd2 100%)',
                borderRadius: '20px',
                padding: '25px',
                boxShadow: '0 15px 40px rgba(255, 154, 158, 0.3)',
                border: '1px solid rgba(255, 154, 158, 0.2)'
              }}>
                <h3 style={{ 
                  fontSize: '1.8rem', 
                  color: '#d6336c', 
                  fontWeight: 700, 
                  marginBottom: '25px',
                  textAlign: 'center',
                  position: 'relative'
                }}>
                  <span style={{
                    background: 'linear-gradient(135deg, #ffffff, #fff0f5)',
                    WebkitBackgroundClip: 'text',
                    WebkitTextFillColor: 'transparent',
                    backgroundClip: 'text',
                    textShadow: '0 2px 8px rgba(255, 255, 255, 0.5)'
                  }}>
                    Dịch vụ gợi ý
                  </span>
                  <div style={{
                    width: '50px',
                    height: '3px',
                    background: 'linear-gradient(90deg, #ffffff, #fff0f5)',
                    margin: '10px auto 0',
                    borderRadius: '2px',
                    boxShadow: '0 2px 8px rgba(255, 255, 255, 0.6)'
                  }}></div>
                </h3>
                
                <div className="row g-2">
                  {relatedServices.map((relatedService, index) => (
                    <div key={relatedService.id} className="col-6">
                      <div className="related-service-card" style={{
                        background: 'white',
                        borderRadius: '12px',
                        padding: '12px',
                        textAlign: 'center',
                        cursor: 'pointer',
                        transition: 'all 0.4s cubic-bezier(0.175, 0.885, 0.32, 1.275)',
                        border: '1px solid rgba(214, 51, 108, 0.1)',
                        position: 'relative',
                        overflow: 'hidden',
                        height: '160px',
                        display: 'flex',
                        flexDirection: 'column',
                        justifyContent: 'space-between'
                      }}
                      onMouseEnter={(e) => {
                        const card = e.currentTarget;
                        card.style.transform = 'translateY(-8px) scale(1.02)';
                        card.style.boxShadow = '0 15px 35px rgba(214, 51, 108, 0.2)';
                        card.style.borderColor = '#d6336c';
                      }}
                      onMouseLeave={(e) => {
                        const card = e.currentTarget;
                        card.style.transform = 'translateY(0) scale(1)';
                        card.style.boxShadow = 'none';
                        card.style.borderColor = 'rgba(214, 51, 108, 0.1)';
                      }}
                      onClick={() => navigate(`/ServicePage/${relatedService.id}`)}
                      >
                        <div style={{
                          position: 'absolute',
                          top: 0,
                          left: 0,
                          right: 0,
                          height: '60%',
                          background: 'linear-gradient(135deg, rgba(214, 51, 108, 0.05), rgba(245, 87, 108, 0.05))',
                          zIndex: 1
                        }}></div>
                        
                        <div style={{ position: 'relative', zIndex: 2 }}>
                          <img
                            src={relatedService.imageUrl || relatedService.image_url || '/default-image.jpg'}
                            alt={relatedService.name}
                            style={{
                              width: '50px',
                              height: '50px',
                              borderRadius: '50%',
                              objectFit: 'cover',
                              margin: '0 auto 8px',
                              border: '2px solid rgba(214, 51, 108, 0.2)',
                              transition: 'all 0.3s ease'
                            }}
                          />
                          
                          <h6 style={{ 
                            fontSize: '0.75rem', 
                            fontWeight: '700', 
                            margin: '0 0 4px 0',
                            color: '#333',
                            lineHeight: '1.1',
                            height: '16px',
                            overflow: 'hidden',
                            display: '-webkit-box',
                            WebkitLineClamp: 1,
                            WebkitBoxOrient: 'vertical'
                          }}>
                            {relatedService.name}
                          </h6>
                          
                          <p style={{ 
                            fontSize: '0.65rem', 
                            color: '#888', 
                            margin: '0',
                            height: '36px',
                            overflow: 'hidden',
                            display: '-webkit-box',
                            WebkitLineClamp: 3,
                            WebkitBoxOrient: 'vertical',
                            lineHeight: '1.2'
                          }}>
                            {relatedService.description}
                          </p>
                        </div>

                        {/* <div style={{
                          position: 'absolute',
                          top: '10px',
                          right: '10px',
                          width: '30px',
                          height: '30px',
                          borderRadius: '50%',
                          background: 'rgba(214, 51, 108, 0.1)',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          opacity: 0,
                          transition: 'opacity 0.3s ease',
                          zIndex: 3
                        }} className="hover-icon">
                          <i className="fas fa-eye" style={{ color: '#d6336c', fontSize: '0.8rem' }}></i>
                        </div> */}
                      </div>
                    </div>
                  ))}
                </div>
                
                {/* View All Services Button - Enhanced */}
                <div style={{ marginTop: '25px' }}>
                  <button 
                    onClick={() => navigate('/ServicePage')}
                    style={{
                      display: 'block',
                      width: '100%',
                      textAlign: 'center',
                      padding: '15px',
                      background: 'linear-gradient(135deg, #ff9a9e, #fecfef)',
                      borderRadius: '25px',
                      color: 'white',
                      border: 'none',
                      fontWeight: '700',
                      fontSize: '1rem',
                      transition: 'all 0.3s ease',
                      boxShadow: '0 5px 15px rgba(255, 154, 158, 0.4)',
                      position: 'relative',
                      overflow: 'hidden',
                      cursor: 'pointer'
                    }}
                    onMouseEnter={(e) => {
                      e.target.style.transform = 'translateY(-2px)';
                      e.target.style.boxShadow = '0 8px 25px rgba(255, 154, 158, 0.5)';
                    }}
                    onMouseLeave={(e) => {
                      e.target.style.transform = 'translateY(0)';
                      e.target.style.boxShadow = '0 5px 15px rgba(255, 154, 158, 0.4)';
                    }}
                  >
                    <i className="fas fa-spa" style={{ marginRight: '8px' }}></i>
                    Xem tất cả dịch vụ
                    <i className="fas fa-arrow-right" style={{ marginLeft: '8px' }}></i>
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* PHẦN REVIEWS */}
          <div id="reviews-section" style={{ marginTop: 60 }}>
            <h3 style={{ fontWeight: 700, marginBottom: 25 }}>Đánh giá</h3>

            {/* PHẦN THỐNG KÊ REVIEW - Đầy đủ */}
            <div style={{ display: 'flex', alignItems: 'center', flexWrap: 'wrap' }}>
              <div style={{ textAlign: 'center', marginRight: 40, marginBottom: 20 }}>
                <div style={{ fontSize: '3rem', color: '#f60', fontWeight: 'bold' }}>{averageRating}</div>
                <div style={{ color: '#f5a623', fontSize: 20 }}>
                  {'★'.repeat(Math.round(Number(averageRating))) + '☆'.repeat(5 - Math.round(Number(averageRating)))}
                </div>
                <div style={{ color: '#888' }}>{reviews.length} đánh giá</div>
              </div>
              <div style={{ flexGrow: 1, minWidth: '300px' }}>
                {[5, 4, 3, 2, 1].map((star, i) => (
                  <div key={star} style={{ display: 'flex', alignItems: 'center', marginBottom: 4, gap: '8px' }}>
                    {/* Cột 1: Nhãn bằng sao */}
                    <div style={{ color: '#f5a623', minWidth: '90px', textAlign: 'right', letterSpacing: '2px' }}>
                      {'★'.repeat(star)}{'☆'.repeat(5 - star)}
                    </div>

                    {/* Cột 2: Thanh tiến trình */}
                    <div style={{ background: '#eee', height: 10, flex: 1, borderRadius: 5, overflow: 'hidden' }}>
                      <div style={{
                        height: '100%',
                        width: `${(ratingCounts[i] / (reviews.length || 1)) * 100}%`,
                        background: '#f60',
                      }}></div>
                    </div>

                    {/* Cột 3: Số lượng đếm */}
                    <div style={{ minWidth: '30px', textAlign: 'left', fontSize: '0.9em', color: '#666' }}>
                      {ratingCounts[i]}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* PHẦN FORM REVIEW - Đã cập nhật */}
            <div style={{ marginTop: 40, borderTop: '1px solid #eee', paddingTop: 30 }}>
              <h4 style={{ marginBottom: 15 }}>Chia sẻ đánh giá của bạn</h4>
              
              {/* Thông báo về chính sách phản hồi */}
              <div style={{
                background: 'linear-gradient(135deg, #e8f5e8 0%, #f0f8f0 100%)',
                border: '1px solid #28a745',
                borderRadius: '8px',
                padding: '12px 16px',
                marginBottom: '20px',
                display: 'flex',
                alignItems: 'center',
                gap: '10px'
              }}>
                <i className="fas fa-info-circle" style={{ color: '#28a745', fontSize: '1.1rem' }}></i>
                <div style={{ fontSize: '0.9rem', color: '#155724' }}>
                  <strong>Chính sách phản hồi:</strong> Đội ngũ chăm sóc khách hàng của chúng tôi sẽ phản hồi các đánh giá quan trọng. 
                  Mọi phản hồi từ spa đều được xem xét kỹ lưỡng để đảm bảo chất lượng dịch vụ tốt nhất.
                </div>
              </div>

              {isAuthenticated ? (
                <form onSubmit={handleReviewSubmit}>
                  <div style={{ padding: '10px 15px', background: '#e9ecef', borderLeft: '4px solid #d6336c', marginBottom: 15, borderRadius: 4 }}>
                    <p style={{ margin: 0 }}>Bạn đang đánh giá với tư cách: <strong>{user.fullName}</strong></p>
                  </div>
                                      <label style={{ display: 'block', marginBottom: 8, fontWeight: 500 }}>Đánh giá của bạn *</label>
                  <div style={{ display: 'flex', alignItems: 'center', marginBottom: 15 }}>
                    {[1, 2, 3, 4, 5].map((star) => (
                      <span key={star} onClick={() => setNewReview({ ...newReview, rating: star })} style={{ fontSize: 30, cursor: 'pointer', color: star <= newReview.rating ? '#f60' : '#ccc', marginRight: 5, userSelect: 'none' }}>★</span>
                    ))}
                                          <span style={{ marginLeft: 10, fontSize: 14, color: '#555' }}>
                        {newReview.rating === 0 ? 'Chưa chọn đánh giá' : { 1: 'Rất tệ', 2: 'Không hài lòng', 3: 'Trung bình', 4: 'Hài lòng', 5: 'Rất hài lòng' }[newReview.rating]}
                      </span>
                  </div>
                                      <label style={{ fontWeight: 500 }}>Bình luận * (Tối đa 500 ký tự)</label>
                  <textarea
                    value={newReview.comment}
                    onChange={(e) => setNewReview({ ...newReview, comment: e.target.value })}
                    rows={4}
                    maxLength={500}
                    placeholder="Chia sẻ trải nghiệm của bạn về dịch vụ này..."
                    style={{ width: '100%', padding: 10, borderRadius: 5, border: '1px solid #ccc', margin: '8px 0 5px 0', resize: 'vertical' }}
                  />
                  <div style={{ textAlign: 'right', marginBottom: 15 }}>
                    <small style={{ color: newReview.comment.length > 450 ? '#f60' : '#888' }}>
                      {newReview.comment.length}/500 ký tự
                    </small>
                  </div>
                                      <button type="submit" disabled={isSubmitting} style={{ backgroundColor: '#28a745', color: 'white', padding: '10px 20px', border: 'none', borderRadius: 5, fontWeight: 'bold', cursor: 'pointer', opacity: isSubmitting ? 0.7 : 1 }}>
                      {isSubmitting ? 'Đang gửi...' : 'Gửi Đánh Giá'}
                    </button>
                </form>
              ) : (
                <div style={{ padding: '20px', textAlign: 'center', background: '#fffbe6', border: '1px solid #ffe58f', borderRadius: 5 }}>
                  <p style={{ margin: 0 }}>
                    Vui lòng <Link to="/login" style={{ fontWeight: 'bold', color: '#d6336c' }}>đăng nhập</Link>  để lại đánh giá.
                  </p>
                </div>
              )}
            </div>
          </div>

          <div style={{ marginTop: 40, borderTop: '1px solid #eee', paddingTop: 30 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
              <h4 style={{ marginBottom: 0 }}>Tất cả Đánh Giá ({reviews.length})</h4>
              {totalPages > 1 && (
                <small style={{ color: '#666' }}>
                  Trang {currentPage} / {totalPages} (Hiển thị {currentReviews.length} / {reviews.length} đánh giá)
                </small>
              )}
            </div>
            {currentReviews.length > 0 ? (
              currentReviews.map((r) => (
                <div key={r.id} style={{ 
                  borderBottom: '1px solid #f0f0f0', 
                  paddingBottom: 20, 
                  marginBottom: 20,
                  background: 'white',
                  borderRadius: '12px',
                  padding: '20px',
                  boxShadow: '0 2px 8px rgba(0,0,0,0.05)',
                  border: '1px solid #f5f5f5'
                }}>

                  {/* KIỂM TRA NẾU REVIEW NÀY ĐANG ĐƯỢC SỬA */}
                  {editingReviewId === r.id ? (
                    // GIAO DIỆN KHI SỬA
                    <div>
                      <div style={{ display: 'flex', alignItems: 'center', marginBottom: 15 }}>
                        {[1, 2, 3, 4, 5].map((star) => (
                          <span key={star} onClick={() => setEditedContent({ ...editedContent, rating: star })} style={{ fontSize: 30, cursor: 'pointer', color: star <= editedContent.rating ? '#f60' : '#ccc' }}>★</span>
                        ))}
                      </div>
                      <textarea
                        value={editedContent.comment}
                        onChange={(e) => setEditedContent({ ...editedContent, comment: e.target.value })}
                        rows={3}
                        style={{ width: '100%', padding: 10, borderRadius: 5, border: '1px solid #ccc', marginBottom: 10, resize: 'vertical' }}
                      />
                      <div>
                        <button onClick={() => handleUpdateSubmit(r.id)} disabled={isSubmitting} style={{ backgroundColor: '#007bff', color: 'white', padding: '8px 16px', border: 'none', borderRadius: 5, cursor: 'pointer', marginRight: 8 }}>
                          {isSubmitting ? 'Đang lưu...' : 'Lưu Thay Đổi'}
                        </button>
                        <button onClick={handleCancelEdit} style={{ padding: '8px 16px', border: '1px solid #ccc', borderRadius: 5, cursor: 'pointer', background: 'transparent' }}>
                          Hủy
                        </button>
                      </div>
                    </div>
                  ) : (
                    // GIAO DIỆN HIỂN THỊ BÌNH THƯỜNG
                    <>
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 15 }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                          <div style={{
                            width: '40px',
                            height: '40px',
                            borderRadius: '50%',
                            background: 'linear-gradient(135deg, #d6336c, #f5576c)',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            flexShrink: 0
                          }}>
                            <i className="fas fa-user" style={{ color: 'white', fontSize: '1rem' }}></i>
                          </div>
                          <div>
                            <strong style={{ color: '#d6336c', fontSize: '1.1rem', display: 'block' }}>{r.authorName}</strong>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginTop: '2px' }}>
                              <span style={{ color: '#f5a623', fontSize: '1.1rem' }}>{'★'.repeat(r.rating)}{'☆'.repeat(5 - r.rating)}</span>
                              <span style={{ 
                                background: '#f5f5f5', 
                                color: '#666', 
                                padding: '2px 8px', 
                                borderRadius: '10px', 
                                fontSize: '0.8rem',
                                fontWeight: '500'
                              }}>
                                Khách hàng
                              </span>
                            </div>
                          </div>
                        </div>

                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                          {/* REPLY BUTTON - REMOVED: Only staff/admin can reply via admin panel */}

                          {/* HIỂN THỊ NÚT SỬA/XÓA NẾU ĐÚNG CHỦ REVIEW */}
                          {isAuthenticated && user && user.id === r.customerId && (
                            // Tính toán thời gian cho phép sửa (30 phút)
                            (() => {
                              const createdAt = new Date(r.createdAt);
                              const now = new Date();
                              const diffMinutes = (now - createdAt) / (1000 * 60);
                              const canEdit = diffMinutes <= 30;
                              return (
                                <>
                                  <button
                                    onClick={() => canEdit && handleEditClick(r)}
                                    style={{
                                      border: 'none',
                                      background: 'none',
                                      cursor: canEdit ? 'pointer' : 'not-allowed',
                                      color: canEdit ? '#007bff' : '#aaa',
                                      fontSize: 18,
                                      verticalAlign: 'middle'
                                    }}
                                    title={canEdit ? "Edit" : "Chỉ được sửa trong 30 phút sau khi đăng"}
                                    disabled={!canEdit}
                                  >
                                    <i className="fas fa-edit"></i>
                                  </button>
                                  <button
                                    onClick={() => handleDeleteClick(r.id)}
                                    style={{
                                      border: 'none',
                                      background: 'none',
                                      cursor: 'pointer',
                                      color: '#dc3545',
                                      fontSize: 18,
                                      verticalAlign: 'middle'
                                    }}
                                    title="Delete"
                                  >
                                    <i className="fas fa-trash-alt"></i>
                                  </button>
                                </>
                              );
                            })()
                          )}
                        </div>
                      </div>
                      <div style={{
                        background: '#fafafa',
                        padding: '15px',
                        borderRadius: '8px',
                        margin: '10px 0',
                        border: '1px solid #f0f0f0'
                      }}>
                        <p style={{ 
                          margin: 0, 
                          color: '#333', 
                          fontSize: '1rem',
                          lineHeight: '1.6'
                        }}>{r.comment}</p>
                      </div>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '10px' }}>
                        <small style={{ 
                          color: '#888', 
                          fontSize: '0.9rem',
                          display: 'flex',
                          alignItems: 'center',
                          gap: '5px'
                        }}>
                          <i className="fas fa-clock" style={{ fontSize: '0.8rem' }}></i>
                          {new Date(r.createdAt).toLocaleString('vi-VN')}
                        </small>
                      </div>
                      
                      {/* REPLY FORM REMOVED - Staff replies managed via admin panel */}
                      
                      {/* HIỂN THỊ TẤT CẢ BUSINESS REPLIES */}
                      {r.replies && renderReplies(r.replies)}
                    </>
                  )}

                </div>
              ))
            ) : (
              <p>Chưa có đánh giá nào. Hãy là người đầu tiên!</p>
            )}

            {/* Pagination UI */}
            {totalPages > 1 && (
              <div style={{ 
                marginTop: 30, 
                paddingTop: 20, 
                borderTop: '1px solid #f0f0f0', 
                display: 'flex', 
                justifyContent: 'center', 
                alignItems: 'center',
                gap: '10px'
              }}>
                {/* Previous Button */}
                <button
                  onClick={() => handlePageChange(currentPage - 1)}
                  disabled={currentPage === 1}
                  style={{
                    padding: '8px 12px',
                    border: '1px solid #d6336c',
                    borderRadius: '5px',
                    background: currentPage === 1 ? '#f8f9fa' : 'white',
                    color: currentPage === 1 ? '#6c757d' : '#d6336c',
                    cursor: currentPage === 1 ? 'not-allowed' : 'pointer',
                    fontWeight: '500',
                    transition: 'all 0.3s ease'
                  }}
                  onMouseEnter={(e) => {
                    if (currentPage !== 1) {
                      e.target.style.background = '#d6336c';
                      e.target.style.color = 'white';
                    }
                  }}
                  onMouseLeave={(e) => {
                    if (currentPage !== 1) {
                      e.target.style.background = 'white';
                      e.target.style.color = '#d6336c';
                    }
                  }}
                >
                  <i className="fas fa-chevron-left"></i> Trước
                </button>

                {/* Page Numbers */}
                {Array.from({ length: totalPages }, (_, i) => i + 1).map((pageNum) => (
                  <button
                    key={pageNum}
                    onClick={() => handlePageChange(pageNum)}
                    style={{
                      width: '40px',
                      height: '40px',
                      border: '1px solid #d6336c',
                      borderRadius: '5px',
                      background: pageNum === currentPage ? '#d6336c' : 'white',
                      color: pageNum === currentPage ? 'white' : '#d6336c',
                      cursor: 'pointer',
                      fontWeight: '600',
                      transition: 'all 0.3s ease'
                    }}
                    onMouseEnter={(e) => {
                      if (pageNum !== currentPage) {
                        e.target.style.background = '#d6336c';
                        e.target.style.color = 'white';
                      }
                    }}
                    onMouseLeave={(e) => {
                      if (pageNum !== currentPage) {
                        e.target.style.background = 'white';
                        e.target.style.color = '#d6336c';
                      }
                    }}
                  >
                    {pageNum}
                  </button>
                ))}

                {/* Next Button */}
                <button
                  onClick={() => handlePageChange(currentPage + 1)}
                  disabled={currentPage === totalPages}
                  style={{
                    padding: '8px 12px',
                    border: '1px solid #d6336c',
                    borderRadius: '5px',
                    background: currentPage === totalPages ? '#f8f9fa' : 'white',
                    color: currentPage === totalPages ? '#6c757d' : '#d6336c',
                    cursor: currentPage === totalPages ? 'not-allowed' : 'pointer',
                    fontWeight: '500',
                    transition: 'all 0.3s ease'
                  }}
                  onMouseEnter={(e) => {
                    if (currentPage !== totalPages) {
                      e.target.style.background = '#d6336c';
                      e.target.style.color = 'white';
                    }
                  }}
                  onMouseLeave={(e) => {
                    if (currentPage !== totalPages) {
                      e.target.style.background = 'white';
                      e.target.style.color = '#d6336c';
                    }
                  }}
                >
                  Tiếp <i className="fas fa-chevron-right"></i>
                </button>
              </div>
            )}
          </div>
        </div>

      </div>
      
      {/* Custom CSS for hover effects */}
      <style jsx>{`
        .related-service-card:hover .hover-icon {
          opacity: 1 !important;
        }
        
        .related-service-card:hover img {
          transform: scale(1.1);
          border-color: #d6336c !important;
        }
        
        /* Business reply responsive */
        @media (max-width: 768px) {
          .related-service-card {
            height: auto !important;
            min-height: 140px;
          }
          
          .col-6 {
            flex: 0 0 50% !important;
            max-width: 50% !important;
          }
          
          /* Responsive cho business replies */
          .reply-container {
            margin-left: 10px !important;
            max-width: calc(100% - 15px) !important;
          }
        }
        
        @media (max-width: 576px) {
          .col-6 {
            flex: 0 0 100% !important;
            max-width: 100% !important;
          }
          
          /* Mobile: điều chỉnh business replies */
          .reply-container {
            margin-left: 5px !important;
            max-width: calc(100% - 10px) !important;
            padding: 12px !important;
            font-size: 0.85rem !important;
          }
        }
      `}</style>
      <Footer />

    </div>
  );
};

export default ServiceDetailPage;