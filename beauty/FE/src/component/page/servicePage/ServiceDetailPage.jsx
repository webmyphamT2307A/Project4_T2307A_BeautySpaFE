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
    images: [],
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
      { userName: 'Nguyen Van A', rating: 5, comment: 'Dịch vụ rất chuyên nghiệp và nhiệt tình.' },
      { userName: 'Tran Thi B', rating: 4, comment: 'Nhân viên thân thiện, giá cả hợp lý.' },
      { userName: 'Le Van C', rating: 3, comment: 'Tạm ổn, cần cải thiện thời gian chờ đợi.' },
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

    setReviews((prev) => [newReview, ...prev]);
    setNewReview({ userName: '', rating: 5, comment: '', images: [] });
  };

  const handleImageChange = (e) => {
    const files = Array.from(e.target.files).slice(0, 5);
    setNewReview({ ...newReview, images: files });
  };

  const ratingCounts = [5, 4, 3, 2, 1].map((star) =>
    reviews.filter((r) => r.rating === star).length
  );

  const averageRating = reviews.length
    ? (reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length).toFixed(1)
    : '0.0';

  if (loading) return <div style={{ textAlign: 'center', marginTop: 40 }}>Loading...</div>;
  if (!service) return <div style={{ textAlign: 'center', marginTop: 40 }}>Service not found</div>;

  return (
    <div>
      <Header />
      <div style={{ maxWidth: 900, margin: 'auto', padding: '40px 15px' }}>
        <Link to="/ServicePage" style={{ marginBottom: 20, display: 'inline-block', border: '1px solid #f8a4c1', padding: '8px 16px', borderRadius: 5, color: '#333', textDecoration: 'none', fontWeight: 'bold', transition: 'background-color 0.3s, color 0.3s', borderRadius: '999px'}}>
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
              {service.price ? `${service.price.toLocaleString()} $/session` : 'N/A'}
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

        {/* REVIEWS SECTION (UPDATED) */}
        <div style={{ marginTop: 60 }}>
          <h3 style={{ fontWeight: 700, marginBottom: 25 }}>Reviews</h3>
          <div style={{ display: 'flex', alignItems: 'center' }}>
            <div style={{ textAlign: 'center', marginRight: 40 }}>
              <div style={{ fontSize: '3rem', color: '#f60', fontWeight: 'bold' }}>{averageRating}</div>
              <div style={{ color: '#f5a623', fontSize: 20 }}>
                {'★'.repeat(Math.round(averageRating)) + '☆'.repeat(5 - Math.round(averageRating))}
              </div>
              <div style={{ color: '#888' }}>{reviews.length} reviews</div>
            </div>
            <div style={{ flexGrow: 1 }}>
              {[5, 4, 3, 2, 1].map((star, i) => (
                <div key={star} style={{ display: 'flex', alignItems: 'center', marginBottom: 6 }}>
                  <div style={{ minWidth: 60, textAlign: 'right', paddingRight: 10 }}> {star} star{star > 1 ? 's' : ''}</div>
                  <div style={{ background: '#eee', height: 10, flex: 1, margin: '0 10px', position: 'relative' }}>
                    <div
                      style={{
                        height: '100%',
                        width: `${(ratingCounts[i] / (reviews.length || 1)) * 100}%`,
                        background: '#f60',
                      }}
                    ></div>
                  </div>
                  <div style={{ width: 100, fontSize: 14, color: '#666' }}>
                    {['Very Bad', 'Not Satisfied', 'Average', 'Satisfied', 'Very Satisfied'][4 - i]}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Review form */}
          <div style={{ marginTop: 40 }}>
            <h4 style={{ marginBottom: 15 }}>Share your review about this product</h4>
            <form onSubmit={handleReviewSubmit}>
              <label>Your Name *</label>
              <input
                type="text"
                value={newReview.userName}
                onChange={(e) => setNewReview({ ...newReview, userName: e.target.value })}
                style={{
                  width: '100%',
                  padding: 10,
                  borderRadius: 5,
                  border: '1px solid #ccc',
                  marginBottom: 10,
                }}
              />

              <label style={{ display: 'block', marginBottom: 8 }}>Your rating *</label>
              <div style={{ display: 'flex', alignItems: 'center', marginBottom: 10 }}>
                {[1, 2, 3, 4, 5].map((star) => (
                  <span
                    key={star}
                    onClick={() => setNewReview({ ...newReview, rating: star })}
                    style={{
                      fontSize: 30,
                      cursor: 'pointer',
                      color: star <= newReview.rating ? '#f60' : '#ccc',
                      marginRight: 5,
                    }}
                  >
                    ★
                  </span>
                ))}
                <span style={{ marginLeft: 10, fontSize: 14, color: '#555' }}>
                  {{
                    1: 'Very Bad',
                    2: 'Not Satisfied',
                    3: 'Average',
                    4: 'Satisfied',
                    5: 'Very Satisfied',
                  }[newReview.rating]}
                </span>
              </div>

              <label>Comment *</label>
              <textarea
                value={newReview.comment}
                onChange={(e) => setNewReview({ ...newReview, comment: e.target.value })}
                rows={4}
                style={{
                  width: '100%',
                  padding: 10,
                  borderRadius: 5,
                  border: '1px solid #ccc',
                  marginBottom: 10,
                }}
              />

              <br />
              <button
                type="submit"
                style={{
                  backgroundColor: '#28a745',
                  color: 'white',
                  padding: '10px 20px',
                  border: 'none',
                  borderRadius: 5,
                  fontWeight: 'bold',
                  cursor: 'pointer',
                }}
              >
                Submit
              </button>
            </form>
          </div>
        </div>

        {/* Review list */}
        <div style={{ marginTop: 30 }}>
          {reviews.map((r, i) => (
            <div
              key={i}
              style={{
                borderBottom: '1px solid #ddd',
                paddingBottom: 10,
                marginBottom: 16,
              }}
            >
              <strong style={{ color: '#d6336c' }}>{r.userName}</strong>{' '}
              <span style={{ color: '#f5a623' }}>
                {'★'.repeat(r.rating)}{'☆'.repeat(5 - r.rating)}
              </span>
              <p style={{ marginTop: 5 }}>{r.comment}</p>
            </div>
          ))}
        </div>

      </div>
      <Footer />
    </div>
  );
};

export default ServiceDetailPage;
