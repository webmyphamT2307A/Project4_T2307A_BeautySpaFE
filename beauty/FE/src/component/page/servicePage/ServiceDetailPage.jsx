import React, { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import Header from '../../shared/header';
import Footer from '../../shared/footer';

const ServiceDetailPage = () => {
  const { id } = useParams();
  const [service, setService] = useState(null);
  const [loading, setLoading] = useState(true);
  const [reviews, setReviews] = useState([]);
  const [newReview, setNewReview] = useState({
    userName: '',
    rating: 5,
    comment: '',
  });

  useEffect(() => {
    const fetchService = async () => {
      try {
        const response = await fetch(`http://localhost:8080/api/v1/services/${id}`);
        const result = await response.json();
        if (result.status === 'SUCCESS') {
          setService(result.data);
        } else {
          console.error(result.message);
        }
      } catch (error) {
        console.error('Error fetching service:', error);
      } finally {
        setLoading(false);
      }
    };

    const mockReviews = [
      {
        userName: 'Nguyen Van A',
        rating: 5,
        comment: 'Dịch vụ rất chuyên nghiệp và nhiệt tình. Rất hài lòng!',
      },
      {
        userName: 'Tran Thi B',
        rating: 4,
        comment: 'Nhân viên thân thiện, giá cả hợp lý.',
      },
      {
        userName: 'Le Van C',
        rating: 3,
        comment: 'Tạm ổn, cần cải thiện thời gian chờ đợi.',
      },
    ];

    fetchService();
    setReviews(mockReviews);
  }, [id]);

  const handleReviewSubmit = (e) => {
    e.preventDefault();
    if (!newReview.userName || !newReview.comment) {
      alert('Vui lòng điền đầy đủ thông tin đánh giá.');
      return;
    }

    setReviews((prevReviews) => [newReview, ...prevReviews]);

    setNewReview({
      userName: '',
      rating: 5,
      comment: '',
    });
  };

  if (loading) return <div style={{ textAlign: 'center', marginTop: 40 }}>Loading...</div>;
  if (!service) return <div style={{ textAlign: 'center', marginTop: 40 }}>Service not found</div>;

  // Styles inline
  const styles = {
    container: {
      maxWidth: 900,
      margin: 'auto',
      padding: '40px 15px',
    },
    btnBack: {
      backgroundColor: '#f8b4b8',
      color: '#222',
      fontWeight: '600',
      padding: '10px 18px',
      border: 'none',
      borderRadius: 5,
      display: 'inline-block',
      textDecoration: 'none',
      marginBottom: 20,
      cursor: 'pointer',
      transition: 'background-color 0.3s ease',
    },
    btnBackHover: {
      backgroundColor: '#f09397',
      color: '#000',
    },
    image: {
      borderRadius: 15,
      boxShadow: '0 8px 16px rgba(0,0,0,0.15)',
      width: '100%',
      height: 'auto',
      transition: 'transform 0.3s ease',
    },
    serviceTitle: {
      fontSize: '2.5rem',
      color: '#d6336c',
      marginBottom: 10,
      fontWeight: '700',
    },
    price: {
      fontSize: '1.2rem',
      color: '#555',
      marginBottom: 24,
    },
    btnRegister: {
      background: 'linear-gradient(90deg, #f09397 0%, #f5576c 100%)',
      color: 'white',
      fontWeight: '700',
      borderRadius: 30,
      padding: '12px 40px',
      boxShadow: '0 5px 15px rgba(245, 87, 108, 0.4)',
      border: 'none',
      cursor: 'pointer',
      marginTop: 20,
      display: 'inline-block',
      textDecoration: 'none',
      transition: 'box-shadow 0.3s ease',
    },
    btnRegisterHover: {
      boxShadow: '0 8px 24px rgba(245, 87, 108, 0.7)',
    },
    reviewCard: {
      borderRadius: 12,
      boxShadow: '0 4px 12px rgba(0,0,0,0.1)',
      padding: 20,
      backgroundColor: '#fff5f8',
      marginBottom: 16,
      transition: 'box-shadow 0.3s ease',
    },
    reviewUser: {
      fontWeight: '700',
      color: '#d6336c',
    },
    reviewStars: {
      fontSize: '1.1rem',
      color: '#f5a623', // gold star color
    },
    reviewComment: {
      marginTop: 8,
      fontStyle: 'italic',
      color: '#555',
    },
    formLabel: {
      fontWeight: '600',
      color: '#444',
      display: 'block',
      marginBottom: 6,
    },
    formInput: {
      borderRadius: 8,
      border: '1.5px solid #dcdcdc',
      padding: '8px 12px',
      fontSize: 16,
      width: '100%',
      boxSizing: 'border-box',
      marginBottom: 16,
      transition: 'border-color 0.3s ease',
    },
    formInputFocus: {
      borderColor: '#d6336c',
      boxShadow: '0 0 8px rgba(214, 51, 108, 0.4)',
      outline: 'none',
    },
    btnSubmitReview: {
      backgroundColor: '#d6336c',
      color: 'white',
      fontWeight: '700',
      borderRadius: 30,
      padding: '10px 36px',
      border: 'none',
      cursor: 'pointer',
      transition: 'background-color 0.3s ease',
    },
  };

  return (
    <div>
      <Header />
      <div style={styles.container}>
        <Link
          to="/ServicePage"
          style={styles.btnBack}
          onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = '#f09397')}
          onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = '#f8b4b8')}
        >
          ← Back to Services
        </Link>

        <div className="row align-items-center">
          <div className="col-md-6 mb-4">
            <img
              src={service.imageUrl || service.image_url || '/default-image.jpg'}
              alt={service.name}
              style={styles.image}
              onMouseEnter={(e) => (e.currentTarget.style.transform = 'scale(1.05)')}
              onMouseLeave={(e) => (e.currentTarget.style.transform = 'scale(1)')}
            />
          </div>

          <div className="col-md-6">
            <h2 style={styles.serviceTitle}>{service.name || 'Service Title'}</h2>
            <p style={styles.price}>
              <strong>Price:</strong>{' '}
              {service.price ? `${service.price.toLocaleString()} VND/session` : 'N/A'}
            </p>
            <p style={{ whiteSpace: 'pre-line' }}>{service.description}</p>

            <a
              href="#"
              style={styles.btnRegister}
              onMouseEnter={(e) => (e.currentTarget.style.boxShadow = '0 8px 24px rgba(245, 87, 108, 0.7)')}
              onMouseLeave={(e) => (e.currentTarget.style.boxShadow = '0 5px 15px rgba(245, 87, 108, 0.4)')}
            >
              REGISTER NOW!
            </a>
          </div>
        </div>

        {/* Reviews */}
        <div style={{ marginTop: 50 }}>
          <h4 style={{ fontWeight: '700', marginBottom: 20 }}>Customer Reviews</h4>
          {reviews.length === 0 ? (
            <p style={{ color: '#777' }}>No reviews yet.</p>
          ) : (
            reviews.map((review, index) => (
              <div key={index} style={styles.reviewCard}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <strong style={styles.reviewUser}>{review.userName}</strong>
                  <span style={styles.reviewStars}>
                    {'★'.repeat(review.rating)}
                    {'☆'.repeat(5 - review.rating)}
                  </span>
                </div>
                <p style={styles.reviewComment}>{review.comment}</p>
              </div>
            ))
          )}
        </div>

        {/* Write a Review Form */}
        <div style={{ marginTop: 50 }}>
          <h4 style={{ fontWeight: '700', marginBottom: 20 }}>Write a Review</h4>
          <form onSubmit={handleReviewSubmit}>
            <label style={styles.formLabel} htmlFor="userName">Your Name</label>
            <input
              id="userName"
              type="text"
              style={styles.formInput}
              value={newReview.userName}
              onChange={(e) => setNewReview({ ...newReview, userName: e.target.value })}
              required
              onFocus={(e) => (e.target.style.borderColor = '#d6336c')}
              onBlur={(e) => (e.target.style.borderColor = '#dcdcdc')}
            />

            <label style={styles.formLabel} htmlFor="rating">Rating</label>
            <select
              id="rating"
              style={styles.formInput}
              value={newReview.rating}
              onChange={(e) => setNewReview({ ...newReview, rating: parseInt(e.target.value) })}
            >
              {[5, 4, 3, 2, 1].map((star) => (
                <option key={star} value={star}>
                  {`${star} Star${star > 1 ? 's' : ''}`}
                </option>
              ))}
            </select>

            <label style={styles.formLabel} htmlFor="comment">Comment</label>
            <textarea
              id="comment"
              rows="3"
              style={styles.formInput}
              value={newReview.comment}
              onChange={(e) => setNewReview({ ...newReview, comment: e.target.value })}
              required
              onFocus={(e) => (e.target.style.borderColor = '#d6336c')}
              onBlur={(e) => (e.target.style.borderColor = '#dcdcdc')}
            ></textarea>

            <button
              type="submit"
              style={styles.btnSubmitReview}
              onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = '#b82d5e')}
              onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = '#d6336c')}
            >
              Submit Review
            </button>
          </form>
        </div>
      </div>
      <Footer />
    </div>
  );
};

export default ServiceDetailPage;
