import React, { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import Header from '../../shared/header';
import Footer from '../../shared/footer';

// ----- GIẢ LẬP AUTHENTICATION HOOK -----
// Trong dự án thật, bạn sẽ import hook này từ hệ thống quản lý state của mình (Context API, Redux, ...).
const useAuth = () => {
  // Thay đổi các giá trị này để test các kịch bản khác nhau
  // KỊCH BẢN 1: Người dùng đã đăng nhập
  // return {
  //   isAuthenticated: true,
  //   user: { id: 101, fullName: 'Nguyen Van A' },
  //   token: 'your_jwt_token_here'
  // };

  // KỊCH BẢN 2: Khách vãng lai (Mặc định)
  return {
    isAuthenticated: false,
    user: null,
    token: null
  };
};
// ------------------------------------------

const ServiceDetailPage = () => {
  const { id } = useParams();
  const { isAuthenticated, user, token } = useAuth();

  const [service, setService] = useState(null);
  const [loading, setLoading] = useState(true);
  const [reviews, setReviews] = useState([]);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const [newReview, setNewReview] = useState({
    guestName: '',
    guestEmail: '',
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
          setService(null); // Set service là null nếu không tìm thấy
        }
      } catch (error) {
        console.error('Error fetching service:', error);
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

    // Gọi tất cả các hàm fetch và chỉ tắt loading khi tất cả hoàn tất
    const fetchData = async () => {
      setLoading(true);
      await Promise.all([fetchServiceDetails(), fetchReviews()]);
      setLoading(false);
    };

    fetchData();
  }, [id]);

  // Hàm gửi review mới lên backend
  const handleReviewSubmit = async (e) => {
    e.preventDefault();
    if (isSubmitting) return;

    if (!isAuthenticated && !newReview.guestName.trim()) {
      alert('Vui lòng nhập tên của bạn.');
      return;
    }
    if (!newReview.comment.trim()) {
      alert('Vui lòng nhập nội dung bình luận.');
      return;
    }

    setIsSubmitting(true);

    const payload = {
      relatedId: parseInt(id, 10),
      type: 'SERVICE',
      rating: newReview.rating,
      comment: newReview.comment,
    };

    if (!isAuthenticated) {
      payload.guestName = newReview.guestName;
      payload.guestEmail = newReview.guestEmail;
    }

    try {
      const headers = { 'Content-Type': 'application/json' };
      if (token) {
        headers['Authorization'] = `Bearer ${token}`;
      }

      const response = await fetch('http://localhost:8080/api/v1/reviews', {
        method: 'POST',
        headers: headers,
        body: JSON.stringify(payload),
      });

      const result = await response.json();

      if (response.ok && result.status === 'SUCCESS') {
        alert('Cảm ơn bạn đã gửi đánh giá!');
        setReviews((prev) => [result.data, ...prev]);
        setNewReview({ guestName: '', guestEmail: '', rating: 5, comment: '' });
      } else {
        alert(`Gửi đánh giá thất bại: ${result.message}`);
      }
    } catch (error) {
      console.error('Error submitting review:', error);
      alert('Đã xảy ra lỗi. Vui lòng thử lại.');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Các hàm tính toán cho phần thống kê review
  const ratingCounts = [5, 4, 3, 2, 1].map((star) =>
    reviews.filter((r) => r.rating === star).length
  );

  const averageRating = reviews.length
    ? (reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length).toFixed(1)
    : '0.0';

  if (loading) return <div style={{ textAlign: 'center', marginTop: 40, fontSize: '1.2rem' }}>Loading...</div>;
  if (!service) return <div style={{ textAlign: 'center', marginTop: 40, fontSize: '1.2rem' }}>Service not found</div>;

  return (
    <div>
      <Header />
      <div style={{ maxWidth: 900, margin: 'auto', padding: '40px 15px' }}>
        <Link to="/ServicePage" style={{ marginBottom: 20, display: 'inline-block', border: '1px solid #f8a4c1', padding: '8px 16px', color: '#333', textDecoration: 'none', fontWeight: 'bold', transition: 'background-color 0.3s, color 0.3s', borderRadius: '999px'}}>
          ← Back to Services
        </Link>

        <div className="row align-items-center">
          <div className="col-md-6 mb-4">
            <img
              src={service.imageUrl || service.image_url || '/default-image.jpg'}
              alt={service.name}
              style={{
                borderRadius: 15,
                boxShadow: '0 8px 16px rgba(0,0,0,0.15)',
                width: '100%',
              }}
            />
          </div>

          <div className="col-md-6">
            <h2 style={{ fontSize: '2.5rem', color: '#d6336c', fontWeight: 700 }}>
              {service.name}
            </h2>
            <p>
              <strong>Price:</strong>{' '}
              {service.price ? `${service.price.toLocaleString()} VND/session` : 'N/A'}
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
        </div>

        {/* REVIEWS SECTION */}
        <div style={{ marginTop: 60 }}>
          <h3 style={{ fontWeight: 700, marginBottom: 25 }}>Reviews</h3>
          <div style={{ display: 'flex', alignItems: 'center', flexWrap: 'wrap' }}>
            <div style={{ textAlign: 'center', marginRight: 40, marginBottom: 20 }}>
              <div style={{ fontSize: '3rem', color: '#f60', fontWeight: 'bold' }}>{averageRating}</div>
              <div style={{ color: '#f5a623', fontSize: 20 }}>
                {'★'.repeat(Math.round(averageRating)) + '☆'.repeat(5 - Math.round(averageRating))}
              </div>
              <div style={{ color: '#888' }}>{reviews.length} reviews</div>
            </div>
            <div style={{ flexGrow: 1, minWidth: '300px' }}>
              {[5, 4, 3, 2, 1].map((star, i) => (
                <div key={star} style={{ display: 'flex', alignItems: 'center', marginBottom: 6 }}>
                  <div style={{ minWidth: 60, textAlign: 'right', paddingRight: 10, fontSize: '0.9em' }}>{star} star{star > 1 ? 's' : ''}</div>
                  <div style={{ background: '#eee', height: 10, flex: 1, margin: '0 10px', borderRadius: 5, position: 'relative', overflow: 'hidden' }}>
                    <div style={{
                      height: '100%',
                      width: `${(ratingCounts[i] / (reviews.length || 1)) * 100}%`,
                      background: '#f60',
                    }}></div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Review form */}
          <div style={{ marginTop: 40, borderTop: '1px solid #eee', paddingTop: 30 }}>
            <h4 style={{ marginBottom: 15 }}>Share your review</h4>
            <form onSubmit={handleReviewSubmit}>
                {isAuthenticated ? (
                    <div>
                        <label>Your Name</label>
                        <input type="text" value={user.fullName} disabled style={{ width: '100%', padding: 10, borderRadius: 5, border: '1px solid #ccc', marginBottom: 15, background: '#f5f5f5' }}/>
                    </div>
                ) : (
                    <>
                        <label>Your Name *</label>
                        <input type="text" value={newReview.guestName} onChange={(e) => setNewReview({ ...newReview, guestName: e.target.value })} style={{ width: '100%', padding: 10, borderRadius: 5, border: '1px solid #ccc', marginBottom: 15 }}/>
                        <label>Your Email</label>
                        <input type="email" value={newReview.guestEmail} onChange={(e) => setNewReview({ ...newReview, guestEmail: e.target.value })} style={{ width: '100%', padding: 10, borderRadius: 5, border: '1px solid #ccc', marginBottom: 15 }}/>
                    </>
                )}

              <label style={{ display: 'block', marginBottom: 8 }}>Your rating *</label>
              <div style={{ display: 'flex', alignItems: 'center', marginBottom: 15 }}>
                {[1, 2, 3, 4, 5].map((star) => (
                  <span key={star} onClick={() => setNewReview({ ...newReview, rating: star })} style={{ fontSize: 30, cursor: 'pointer', color: star <= newReview.rating ? '#f60' : '#ccc', marginRight: 5, userSelect: 'none' }}>★</span>
                ))}
                <span style={{ marginLeft: 10, fontSize: 14, color: '#555' }}>
                  {{ 1: 'Very Bad', 2: 'Not Satisfied', 3: 'Average', 4: 'Satisfied', 5: 'Very Satisfied',}[newReview.rating]}
                </span>
              </div>

              <label>Comment *</label>
              <textarea
                value={newReview.comment}
                onChange={(e) => setNewReview({ ...newReview, comment: e.target.value })}
                rows={4}
                style={{ width: '100%', padding: 10, borderRadius: 5, border: '1px solid #ccc', marginBottom: 15, resize: 'vertical' }}
              />

              <button type="submit" disabled={isSubmitting} style={{ backgroundColor: '#28a745', color: 'white', padding: '10px 20px', border: 'none', borderRadius: 5, fontWeight: 'bold', cursor: 'pointer', opacity: isSubmitting ? 0.7 : 1 }}>
                {isSubmitting ? 'Submitting...' : 'Submit Review'}
              </button>
            </form>
          </div>
        </div>

        {/* Review list */}
        <div style={{ marginTop: 40, borderTop: '1px solid #eee', paddingTop: 30 }}>
            <h4 style={{marginBottom: 20}}>All Reviews ({reviews.length})</h4>
          {reviews.length > 0 ? (
            reviews.map((r) => (
              <div key={r.id} style={{ borderBottom: '1px solid #f0f0f0', paddingBottom: 16, marginBottom: 16 }}>
                <div style={{display: 'flex', alignItems: 'center', marginBottom: 8}}>
                    <strong style={{ color: '#d6336c', marginRight: 10 }}>{r.authorName}</strong>
                    <span style={{ color: '#f5a623' }}>{'★'.repeat(r.rating)}{'☆'.repeat(5 - r.rating)}</span>
                </div>
                <p style={{ margin: '0 0 8px 0', color: '#333' }}>{r.comment}</p>
                <small style={{color: '#888'}}>{new Date(r.createdAt).toLocaleString('vi-VN')}</small>
              </div>
            ))
          ) : (
            <p>There are no reviews yet. Be the first one!</p>
          )}
        </div>
      </div>
      <Footer />
    </div>
  );
};

export default ServiceDetailPage;