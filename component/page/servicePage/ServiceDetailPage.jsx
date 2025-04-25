import React, { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import Header from '../../shared/header';
import Footer from '../../shared/footer';

const ServiceDetailPage = () => {
  const { id } = useParams();
  const [service, setService] = useState(null);
  const [loading, setLoading] = useState(true);

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
        console.error('Lỗi khi fetch chi tiết dịch vụ:', error);
      } finally {
        setLoading(false);
      }
    };
    fetchService();
  }, [id]);

  if (loading) return <div className="text-center mt-5">Loading...</div>;

  if (!service) return <div className="text-center mt-5">Service not found</div>;

  return (
    <div>
      <Header />
      <div className="container py-5">
        <Link to="/ServicePage" className="btn btn-secondary mb-4">← Back to Services</Link>
        <h1>{service.name}</h1>
        <p><strong>Price:</strong> ${service.price}</p>
        <img
          src={service.imageUrl || service.image_url}
          alt={service.name}
          className="img-fluid rounded my-3"
          style={{ maxHeight: '300px', objectFit: 'cover' }}
        />
        <p>{service.description}</p>
        <a href="#" className="btn btn-primary rounded-pill mt-3">Make Order</a>
      </div>
      <Footer />
    </div>
  );
};

export default ServiceDetailPage;
