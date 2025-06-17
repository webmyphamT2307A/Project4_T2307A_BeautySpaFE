import React, { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";

const Service = () => {
    const [servicesData, setServicesData] = useState([]);
    const [loading, setLoading] = useState(true);
    const navigate = useNavigate();

    useEffect(() => {
        const fetchServices = async () => {
            try {
                const response = await fetch('http://localhost:8080/api/v1/services');
                const result = await response.json();
                if (result.status === 'SUCCESS') {
                    // Lấy tối đa 6 services
                    setServicesData(result.data.slice(0, 6));
                } else {
                    console.error('Failed to fetch services:', result.message);
                }
            } catch (error) {
                console.error('Error fetching services:', error);
            } finally {
                setLoading(false);
            }
        };

        fetchServices();
    }, []);

    const handleImageClick = (serviceId) => {
        navigate(`/ServicePage/${serviceId}`);
    };

    if (loading) {
        return (
            <div className="container-fluid services py-5">
                <div className="container py-5">
                    <div className="text-center">
                        <div className="spinner-border text-primary" role="status">
                            <span className="visually-hidden">Loading...</span>
                        </div>
                        <p className="mt-2">Đang tải dịch vụ...</p>
                    </div>
                </div>
            </div>
        );
    }

    return(
        <>
<div className="container-fluid services py-5">
  <div className="container py-5">
    <div className="mx-auto text-center mb-5" style={{maxWidth: 800}}>
      <p className="fs-4 text-uppercase text-center text-primary">Our Service</p>
      <h1 className="display-3">Spa &amp; Beauty Services</h1>
    </div>
    <div className="row g-4">
      {servicesData.map((service, index) => {
        const isEven = index % 2 === 0;
        return (
          <div className="col-lg-6" key={service.id}>
            <div className={`services-item bg-light border-4 ${isEven ? 'border-end' : 'border-start'} border-primary rounded p-4`}>
              <div className="row align-items-center">
                {isEven ? (
                  <>
                    <div className="col-8">
                      <div className="services-content text-end">
                        <h3 className="text-truncate">{service.name}</h3>
                        <p style={{
                          overflow: 'hidden',
                          textOverflow: 'ellipsis',
                          display: '-webkit-box',
                          WebkitLineClamp: 3,
                          WebkitBoxOrient: 'vertical',
                          minHeight: '72px'
                        }}>
                          {service.description}
                        </p>
                        <div className="mb-2">
                          <span className="fw-bold text-primary">
                            {service.price ? `${service.price.toLocaleString()}$` : 'Liên hệ'}
                          </span>
                        </div>
                        <Link to={`/AppointmentPage?serviceId=${service.id}`} className="btn btn-primary btn-primary-outline-0 rounded-pill py-2 px-4">
                          Make Order
                        </Link>
                      </div>
                    </div>
                    <div className="col-4">
                      <div 
                        className="services-img d-flex align-items-center justify-content-center rounded service-image-clickable"
                        style={{ cursor: 'pointer', transition: 'all 0.3s ease' }}
                        onClick={() => handleImageClick(service.id)}
                        title="Click để xem chi tiết dịch vụ"
                      >
                        <img 
                          src={service.imageUrl || service.image_url || '/default-image.jpg'} 
                          className="img-fluid rounded" 
                          alt={service.name}
                          style={{ width: '100%', height: '180px', objectFit: 'cover' }}
                        />
                      </div>
                    </div>
                  </>
                ) : (
                  <>
                    <div className="col-4">
                      <div 
                        className="services-img d-flex align-items-center justify-content-center rounded service-image-clickable"
                        style={{ cursor: 'pointer', transition: 'all 0.3s ease' }}
                        onClick={() => handleImageClick(service.id)}
                        title="Click để xem chi tiết dịch vụ"
                      >
                        <img 
                          src={service.imageUrl || service.image_url || '/default-image.jpg'} 
                          className="img-fluid rounded" 
                          alt={service.name}
                          style={{ width: '100%', height: '180px', objectFit: 'cover' }}
                        />
                      </div>
                    </div>
                    <div className="col-8">
                      <div className="services-content text-start">
                        <h3 className="text-truncate">{service.name}</h3>
                        <p style={{
                          overflow: 'hidden',
                          textOverflow: 'ellipsis',
                          display: '-webkit-box',
                          WebkitLineClamp: 3,
                          WebkitBoxOrient: 'vertical',
                          minHeight: '72px'
                        }}>
                          {service.description}
                        </p>
                        <div className="mb-2">
                          <span className="fw-bold text-primary">
                            {service.price ? `${service.price.toLocaleString()}$` : 'Liên hệ'}
                          </span>
                        </div>
                        <Link to={`/AppointmentPage?serviceId=${service.id}`} className="btn btn-primary btn-primary-outline-0 rounded-pill py-2 px-4">
                          Make Order
                        </Link>
                      </div>
                    </div>
                  </>
                )}
              </div>
            </div>
          </div>
        );
      })}
      <div className="col-12">
        <div className="services-btn text-center">
          <Link to="/ServicePage" className="btn btn-primary btn-primary-outline-0 rounded-pill py-3 px-5">
            Service More
          </Link>
        </div>
      </div>
    </div>
  </div>
</div>

<style jsx>{`
  .service-image-clickable {
    position: relative;
    overflow: hidden;
  }

  .service-image-clickable:hover {
    transform: scale(1.05);
    box-shadow: 0 4px 15px rgba(0, 0, 0, 0.2);
  }

  .service-image-clickable:hover img {
    filter: brightness(1.1);
  }

  .service-image-clickable::after {
    content: "👁️";
    position: absolute;
    top: 50%;
    left: 50%;
    transform: translate(-50%, -50%);
    background: rgba(0, 0, 0, 0.7);
    color: white;
    border-radius: 50%;
    width: 30px;
    height: 30px;
    display: flex;
    align-items: center;
    justify-content: center;
    opacity: 0;
    transition: opacity 0.3s ease-in-out;
    font-size: 14px;
  }

  .service-image-clickable:hover::after {
    opacity: 1;
  }
`}</style>
        </>
    )
}
export default Service;