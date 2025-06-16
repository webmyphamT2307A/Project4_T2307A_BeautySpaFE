import React, { useEffect, useState } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { toast, ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
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

  // State đã được đơn giản hóa, không còn thông tin khách
  const [newReview, setNewReview] = useState({
    rating: 5,
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
        toast.success('Cập nhật đánh giá thành công!');
        setReviews(reviews.map(r => r.id === reviewId ? result.data : r));
        handleCancelEdit();
      } else {
        toast.error(`Lỗi: ${result.message}`);
      }
    } catch (error) {
      toast.error('Đã có lỗi xảy ra khi cập nhật.');
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
    if (!window.confirm('Bạn có chắc chắn muốn xóa đánh giá này không?')) {
      return;
    }

    try {
      const response = await fetch(`http://localhost:8080/api/v1/reviews/${reviewId}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` }
      });

      if (response.ok) {
        toast.success('Xóa đánh giá thành công!');
        setReviews(reviews.filter(r => r.id !== reviewId));
      } else {
        const result = await response.json();
        toast.error(`Lỗi: ${result.message}`);
      }
    } catch (error) {
      toast.error('Đã có lỗi xảy ra khi xóa.');
    }
  };

  // Hàm submit chỉ dành cho người dùng đã đăng nhập
  const handleReviewSubmit = async (e) => {
    e.preventDefault();
    if (isSubmitting) return;

    if (!newReview.comment.trim()) {
      toast.warn('Vui lòng nhập nội dung bình luận.');
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
        toast.success('Cảm ơn bạn đã gửi đánh giá!');
        setReviews((prev) => [result.data, ...prev]);
        setNewReview({ rating: 5, comment: '' });
        setCurrentPage(1); // Reset to first page when new review is added
      } else {
        toast.error(`Gửi đánh giá thất bại: ${result.message}`);
      }
    } catch (error) {
      console.error('Error submitting review:', error);
      toast.error('Đã xảy ra lỗi. Vui lòng thử lại.');
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

  if (loading) return <div style={{ textAlign: 'center', marginTop: 40, fontSize: '1.2rem' }}>Loading...</div>;
  if (!service) return <div style={{ textAlign: 'center', marginTop: 40, fontSize: '1.2rem' }}>Service not found</div>;

  return (
    <div>
      <Header />
      <ToastContainer position="top-right" autoClose={2000} />
      <div style={{ maxWidth: 900, margin: 'auto', padding: '40px 15px' }}>
        <Link to="/ServicePage" style={{ marginBottom: 20, display: 'inline-block', border: '1px solid #f8a4c1', padding: '8px 16px', color: '#333', textDecoration: 'none', fontWeight: 'bold', transition: 'background-color 0.3s, color 0.3s', borderRadius: '999px' }}>
          ← Back to Services
        </Link>

        {/* PHẦN THÔNG TIN DỊCH VỤ - New Layout */}
        <div className="row">
          {/* Bên trái: Ảnh dịch vụ và thông tin chính */}
          <div className="col-md-6 mb-4">
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
              <strong>Price:</strong>{' '}
              {service.price ? `${service.price.toLocaleString()}$` : 'N/A'}
            </p>
            <p style={{ whiteSpace: 'pre-line' }}>{service.description}</p>
            <a href="#" style={{
              background: 'linear-gradient(90deg, #f09397 0%, #f5576c 100%)',
              color: 'white',
              fontWeight: '700',
              borderRadius: 30,
              padding: '12px 40px',
              display: 'inline-block',
              marginTop: 20,
              textDecoration: 'none'
            }}>
              REGISTER NOW!
            </a>
          </div>

          {/* Bên phải: Gợi ý dịch vụ - Beautiful Design */}
          <div className="col-md-6">
            <div style={{
              background: 'linear-gradient(135deg, #fff5f8 0%, #ffeef2 100%)',
              borderRadius: '20px',
              padding: '25px',
              boxShadow: '0 10px 30px rgba(214, 51, 108, 0.1)',
              border: '1px solid rgba(214, 51, 108, 0.1)'
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
                  background: 'linear-gradient(135deg, #d6336c, #f5576c)',
                  WebkitBackgroundClip: 'text',
                  WebkitTextFillColor: 'transparent',
                  backgroundClip: 'text'
                }}>
                  Dịch vụ gợi ý
                </span>
                <div style={{
                  width: '50px',
                  height: '3px',
                  background: 'linear-gradient(90deg, #d6336c, #f5576c)',
                  margin: '10px auto 0',
                  borderRadius: '2px'
                }}></div>
              </h3>
              
              <div className="row g-2">
                {relatedServices.map((relatedService, index) => (
                  <div key={relatedService.id} className="col-4">
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
                      {/* Gradient overlay */}
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
                          margin: '0 0 8px 0',
                          height: '24px',
                          overflow: 'hidden',
                          display: '-webkit-box',
                          WebkitLineClamp: 2,
                          WebkitBoxOrient: 'vertical',
                          lineHeight: '1.2'
                        }}>
                          {relatedService.description}
                        </p>
                        
                        <div style={{
                          background: 'linear-gradient(135deg, #d6336c, #f5576c)',
                          borderRadius: '15px',
                          padding: '4px 10px',
                          display: 'inline-block'
                        }}>
                          <span style={{ 
                            fontSize: '0.7rem', 
                            fontWeight: '700', 
                            color: 'white'
                          }}>
                            {relatedService.price ? `${relatedService.price.toLocaleString()}$` : 'N/A'}
                          </span>
                        </div>
                      </div>

                      {/* Hover icon */}
                      <div style={{
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
                      </div>
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
                    background: 'linear-gradient(135deg, #d6336c, #f5576c)',
                    borderRadius: '25px',
                    color: 'white',
                    border: 'none',
                    fontWeight: '700',
                    fontSize: '1rem',
                    transition: 'all 0.3s ease',
                    boxShadow: '0 5px 15px rgba(214, 51, 108, 0.3)',
                    position: 'relative',
                    overflow: 'hidden',
                    cursor: 'pointer'
                  }}
                  onMouseEnter={(e) => {
                    e.target.style.transform = 'translateY(-2px)';
                    e.target.style.boxShadow = '0 8px 25px rgba(214, 51, 108, 0.4)';
                  }}
                  onMouseLeave={(e) => {
                    e.target.style.transform = 'translateY(0)';
                    e.target.style.boxShadow = '0 5px 15px rgba(214, 51, 108, 0.3)';
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
          <h3 style={{ fontWeight: 700, marginBottom: 25 }}>Reviews</h3>

          {/* PHẦN THỐNG KÊ REVIEW - Đầy đủ */}
          <div style={{ display: 'flex', alignItems: 'center', flexWrap: 'wrap' }}>
            <div style={{ textAlign: 'center', marginRight: 40, marginBottom: 20 }}>
              <div style={{ fontSize: '3rem', color: '#f60', fontWeight: 'bold' }}>{averageRating}</div>
              <div style={{ color: '#f5a623', fontSize: 20 }}>
                {'★'.repeat(Math.round(Number(averageRating))) + '☆'.repeat(5 - Math.round(Number(averageRating)))}
              </div>
              <div style={{ color: '#888' }}>{reviews.length} reviews</div>
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
            <h4 style={{ marginBottom: 15 }}>Share your review</h4>

            {isAuthenticated ? (
              <form onSubmit={handleReviewSubmit}>
                <div style={{ padding: '10px 15px', background: '#e9ecef', borderLeft: '4px solid #d6336c', marginBottom: 15, borderRadius: 4 }}>
                  <p style={{ margin: 0 }}>You are reviewing as: <strong>{user.fullName}</strong></p>
                </div>
                <label style={{ display: 'block', marginBottom: 8, fontWeight: 500 }}>Your rating *</label>
                <div style={{ display: 'flex', alignItems: 'center', marginBottom: 15 }}>
                  {[1, 2, 3, 4, 5].map((star) => (
                    <span key={star} onClick={() => setNewReview({ ...newReview, rating: star })} style={{ fontSize: 30, cursor: 'pointer', color: star <= newReview.rating ? '#f60' : '#ccc', marginRight: 5, userSelect: 'none' }}>★</span>
                  ))}
                  <span style={{ marginLeft: 10, fontSize: 14, color: '#555' }}>
                    {{ 1: 'Very Bad', 2: 'Not Satisfied', 3: 'Average', 4: 'Satisfied', 5: 'Very Satisfied' }[newReview.rating]}
                  </span>
                </div>
                <label style={{ fontWeight: 500 }}>Comment *</label>
                <textarea
                  value={newReview.comment}
                  onChange={(e) => setNewReview({ ...newReview, comment: e.target.value })}
                  rows={4}
                  style={{ width: '100%', padding: 10, borderRadius: 5, border: '1px solid #ccc', margin: '8px 0 15px 0', resize: 'vertical' }}
                />
                <button type="submit" disabled={isSubmitting} style={{ backgroundColor: '#28a745', color: 'white', padding: '10px 20px', border: 'none', borderRadius: 5, fontWeight: 'bold', cursor: 'pointer', opacity: isSubmitting ? 0.7 : 1 }}>
                  {isSubmitting ? 'Submitting...' : 'Submit Review'}
                </button>
              </form>
            ) : (
              <div style={{ padding: '20px', textAlign: 'center', background: '#fffbe6', border: '1px solid #ffe58f', borderRadius: 5 }}>
                <p style={{ margin: 0 }}>
                  Please <Link to="/login" style={{ fontWeight: 'bold', color: '#d6336c' }}>log in</Link> to leave a review.
                </p>
              </div>
            )}
          </div>
        </div>

        <div style={{ marginTop: 40, borderTop: '1px solid #eee', paddingTop: 30 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
            <h4 style={{ marginBottom: 0 }}>All Reviews ({reviews.length})</h4>
            {totalPages > 1 && (
              <small style={{ color: '#666' }}>
                Trang {currentPage} / {totalPages} (Hiển thị {currentReviews.length} / {reviews.length} đánh giá)
              </small>
            )}
          </div>
          {currentReviews.length > 0 ? (
            currentReviews.map((r) => (
              <div key={r.id} style={{ borderBottom: '1px solid #f0f0f0', paddingBottom: 16, marginBottom: 16 }}>

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
                        {isSubmitting ? 'Saving...' : 'Save Changes'}
                      </button>
                      <button onClick={handleCancelEdit} style={{ padding: '8px 16px', border: '1px solid #ccc', borderRadius: 5, cursor: 'pointer', background: 'transparent' }}>
                        Cancel
                      </button>
                    </div>
                  </div>
                ) : (
                  // GIAO DIỆN HIỂN THỊ BÌNH THƯỜNG
                  <>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 }}>
                      <div style={{ display: 'flex', alignItems: 'center' }}>
                        <strong style={{ color: '#d6336c', marginRight: 10 }}>{r.authorName}</strong>
                        <span style={{ color: '#f5a623' }}>{'★'.repeat(r.rating)}{'☆'.repeat(5 - r.rating)}</span>
                      </div>

                      {/* HIỂN THỊ NÚT SỬA/XÓA NẾU ĐÚNG CHỦ REVIEW */}
                      {isAuthenticated && user && user.id === r.customerId && (
                        // Tính toán thời gian cho phép sửa (30 phút)
                        (() => {
                          const createdAt = new Date(r.createdAt);
                          const now = new Date();
                          const diffMinutes = (now - createdAt) / (1000 * 60);
                          const canEdit = diffMinutes <= 30;
                          return (
                            <div>
                              <button
                                onClick={() => canEdit && handleEditClick(r)}
                                style={{
                                  marginRight: 8,
                                  border: 'none',
                                  background: 'none',
                                  cursor: canEdit ? 'pointer' : 'not-allowed',
                                  color: canEdit ? '#007bff' : '#aaa',
                                  fontSize: 20,
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
                                  fontSize: 20,
                                  verticalAlign: 'middle'
                                }}
                                title="Delete"
                              >
                                <i className="fas fa-trash-alt"></i>
                              </button>
                            </div>
                          );
                        })()
                      )}
                    </div>
                    <p style={{ margin: '0 0 8px 0', color: '#333' }}>{r.comment}</p>
                    <small style={{ color: '#888' }}>{new Date(r.createdAt).toLocaleString('vi-VN')}</small>
                  </>
                )}

              </div>
            ))
          ) : (
            <p>There are no reviews yet. Be the first one!</p>
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
                <i className="fas fa-chevron-left"></i> Previous
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
                Next <i className="fas fa-chevron-right"></i>
              </button>
            </div>
          )}
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
        
        @media (max-width: 768px) {
          .related-service-card {
            height: auto !important;
            min-height: 140px;
          }
          
          .col-4 {
            flex: 0 0 50% !important;
            max-width: 50% !important;
          }
        }
        
        @media (max-width: 576px) {
          .col-4 {
            flex: 0 0 100% !important;
            max-width: 100% !important;
          }
        }
      `}</style>

      <Footer />
    </div>
  );
};

export default ServiceDetailPage;