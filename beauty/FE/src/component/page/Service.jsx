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
                            <span className="visually-hidden">Đang tải...</span>
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
      <p className="fs-4 text-uppercase text-center text-primary">Dịch Vụ Của Chúng Tôi</p>
      <h1 className="display-3">Dịch Vụ Spa &amp; Làm Đẹp</h1>
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
                            {service.price ? `${service.price.toLocaleString()}₫` : 'Liên hệ'}
                          </span>
                        </div>
                        <button 
                          onClick={() => {
                            setTimeout(() => {
                              const appointmentSection = document.getElementById('appointment');
                              if (appointmentSection) {
                                const yOffset = -50;
                                const y = appointmentSection.getBoundingClientRect().top + window.pageYOffset + yOffset;
                                window.scrollTo({ top: y, behavior: 'smooth' });
                              }
                            }, 100);
                          }}
                          className="btn btn-primary btn-primary-outline-0 rounded-pill py-2 px-4"
                        >
                          Đặt Lịch Ngay
                        </button>
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
                            {service.price ? `${service.price.toLocaleString()}₫` : 'Liên hệ'}
                          </span>
                        </div>
                        <button 
                          onClick={() => {
                            setTimeout(() => {
                              const appointmentSection = document.getElementById('appointment');
                              if (appointmentSection) {
                                const yOffset = -50;
                                const y = appointmentSection.getBoundingClientRect().top + window.pageYOffset + yOffset;
                                window.scrollTo({ top: y, behavior: 'smooth' });
                              }
                            }, 100);
                          }}
                          className="btn btn-primary btn-primary-outline-0 rounded-pill py-2 px-4"
                        >
                          Đặt Lịch Ngay
                        </button>
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
            Xem Thêm Dịch Vụ
          </Link>
        </div>
      </div>
    </div>
  </div>
</div>

<style jsx>{`
  .service-image-clickable {
    cursor: pointer;
    transition: all 0.3s ease-in-out;
    position: relative;
  }

  .service-image-clickable:hover {
    transform: translateY(-3px);
    box-shadow: 0 8px 25px rgba(0, 123, 255, 0.2);
  }

  .service-image-clickable:hover img {
    filter: brightness(1.1);
  }

  .service-image-clickable::after {
    content: "\\f06e";
    font-family: "Font Awesome 5 Free";
    font-weight: 900;
    position: absolute;
    top: 50%;
    left: 50%;
    transform: translate(-50%, -50%);
    background: linear-gradient(135deg, rgba(0, 123, 255, 0.9), rgba(40, 167, 69, 0.9));
    color: white;
    border-radius: 50%;
    width: 35px;
    height: 35px;
    display: flex;
    align-items: center;
    justify-content: center;
    opacity: 0;
    transition: all 0.3s ease-in-out;
    font-size: 16px;
    box-shadow: 0 4px 15px rgba(0, 123, 255, 0.3);
  }

  .service-image-clickable:hover::after {
    opacity: 1;
    transform: translate(-50%, -50%) scale(1.1);
    animation: pulse 1.5s infinite;
  }

  @keyframes pulse {
    0% {
      box-shadow: 0 4px 15px rgba(0, 123, 255, 0.3);
    }
    50% {
      box-shadow: 0 4px 20px rgba(0, 123, 255, 0.6);
    }
    100% {
      box-shadow: 0 4px 15px rgba(0, 123, 255, 0.3);
    }
  }

  /* Enhanced "Đặt Lịch Ngay" button styling */
  .btn-primary.rounded-pill {
    box-shadow: 0 4px 15px rgba(0, 123, 255, 0.2) !important;
    font-weight: 600 !important;
    font-size: 0.95rem !important;
    letter-spacing: 0.3px !important;
    transition: all 0.3s ease !important;
    border: none !important;
    position: relative !important;
    overflow: hidden !important;
  }

  .btn-primary.rounded-pill:hover {
    transform: translateY(-2px) !important;
    box-shadow: 0 8px 25px rgba(0, 123, 255, 0.3) !important;
    background: linear-gradient(135deg, #0056b3, #007bff) !important;
  }

  .btn-primary.rounded-pill:active {
    transform: translateY(0) !important;
    transition: all 0.1s ease !important;
  }

  .btn-primary.rounded-pill::before {
    content: "";
    position: absolute;
    top: 0;
    left: -100%;
    width: 100%;
    height: 100%;
    background: linear-gradient(90deg, transparent, rgba(255, 255, 255, 0.2), transparent);
    transition: left 0.5s;
  }

  .btn-primary.rounded-pill:hover::before {
    left: 100%;
  }
`}</style>
        </>
    )
}
export default Service;