import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom'; // dùng điều hướng
import Header from '../../shared/header';
import Footer from '../../shared/footer';

const itemsPerPage = 8;

const ServicePage = () => {
  const [servicesData, setServicesData] = useState([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [loading, setLoading] = useState(true);

  const navigate = useNavigate(); // hook điều hướng

  useEffect(() => {
    const fetchData = async () => {
      try {
        const response = await fetch('http://localhost:8080/api/v1/services');
        const result = await response.json();
        if (result.status === 'SUCCESS') {
          setServicesData(result.data);
        } else {
          console.error(result.message);
        }
      } catch (error) {
        console.error('Lỗi khi fetch dữ liệu:', error);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  const totalPages = Math.ceil(servicesData.length / itemsPerPage);
  const displayedServices = servicesData.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  return (
    <div>
      <Header />
      <div className="container-fluid bg-breadcrumb py-5">
        <div className="container text-center py-5">
          <h3 className="text-white display-3 mb-4">Our Services</h3>
          <ol className="breadcrumb justify-content-center mb-0">
            <li className="breadcrumb-item"><a href="/">Home</a></li>
            <li className="breadcrumb-item"><a href="#">Pages</a></li>
            <li className="breadcrumb-item active text-white">Service Page</li>
          </ol>
        </div>
      </div>

      <div className="container-fluid services py-5">
        <div className="container py-5">
          <div className="mx-auto text-center mb-5" style={{ maxWidth: 800 }}>
            <p className="fs-4 text-uppercase text-center text-primary">Our Service</p>
            <h1 className="display-3">Spa &amp; Beauty Services</h1>
          </div>

          {loading ? (
            <div className="text-center">Loading...</div>
          ) : (
            <div className="row g-4">
              {displayedServices.map((service, index) => {
                const isEven = index % 2 === 0;
                const showMore = service.description.length > 120;

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
                                {showMore && (
                                  <button
                                    className="btn btn-sm btn-link px-0"
                                    onClick={() => navigate(`/ServicePage/${service.id}`)}
                                  >
                                    More
                                  </button>
                                )}
                                <br />
                                <a href="#" className="btn btn-primary btn-primary-outline-0 rounded-pill py-2 px-4 mt-2">Make Order</a>
                              </div>
                            </div>
                            <div className="col-4 d-flex align-items-center justify-content-center">
                              <div className="services-img rounded" style={{ width: '100px', height: '100px', overflow: 'hidden' }}>
                                <img
                                  src={service.imageUrl || service.image_url}
                                  className="img-fluid rounded"
                                  alt={service.name}
                                  style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                                />
                              </div>
                            </div>
                          </>
                        ) : (
                          <>
                            <div className="col-4 d-flex align-items-center justify-content-center">
                              <div className="services-img rounded" style={{ width: '100px', height: '100px', overflow: 'hidden' }}>
                                <img
                                  src={service.imageUrl || service.image_url}
                                  className="img-fluid rounded"
                                  alt={service.name}
                                  style={{ width: '100%', height: '100%', objectFit: 'cover' }}
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
                                {showMore && (
                                  <button
                                    className="btn btn-sm btn-link px-0"
                                    onClick={() => navigate(`/ServicePage/${service.id}`)}
                                  >
                                    More
                                  </button>
                                )}
                                <br />
                                <a href="#" className="btn btn-primary btn-primary-outline-0 rounded-pill py-2 px-4 mt-2">Make Order</a>
                              </div>
                            </div>
                          </>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          <div className="text-center mt-5">
            {[...Array(totalPages)].map((_, i) => (
              <button
                key={i}
                className={`btn btn-outline-primary mx-1 ${i + 1 === currentPage ? "active" : ""}`}
                onClick={() => setCurrentPage(i + 1)}
              >
                {i + 1}
              </button>
            ))}
          </div>
        </div>
      </div>

      <Footer />
    </div>
  );
};

export default ServicePage;