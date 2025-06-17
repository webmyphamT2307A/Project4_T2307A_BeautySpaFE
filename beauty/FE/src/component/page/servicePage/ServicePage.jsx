import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom'; // dùng điều hướng
import Header from '../../shared/header';
import Footer from '../../shared/footer';

const itemsPerPage = 8;

const ServicePage = () => {
  const [servicesData, setServicesData] = useState([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [loading, setLoading] = useState(true);
  
  // Search functionality states
  const [searchTerm, setSearchTerm] = useState('');
  const [filteredServices, setFilteredServices] = useState([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [selectedSuggestionIndex, setSelectedSuggestionIndex] = useState(-1);

  const navigate = useNavigate(); // hook điều hướng

  // Function to handle image click
  const handleImageClick = (serviceId) => {
    navigate(`/ServicePage/${serviceId}`);
  };

  // Search functionality
  const handleSearchChange = (e) => {
    const value = e.target.value;
    setSearchTerm(value);
    setSelectedSuggestionIndex(-1);
    
    if (value.trim()) {
      const filtered = servicesData.filter(service =>
        service.name.toLowerCase().includes(value.toLowerCase()) ||
        service.description.toLowerCase().includes(value.toLowerCase())
      );
      setFilteredServices(filtered);
      setShowSuggestions(true);
    } else {
      setFilteredServices([]);
      setShowSuggestions(false);
    }
  };

  const handleSearchSubmit = (serviceId = null) => {
    if (serviceId) {
      // Navigate to specific service
      navigate(`/ServicePage/${serviceId}`);
    } else if (filteredServices.length > 0) {
      // Navigate to first search result
      navigate(`/ServicePage/${filteredServices[0].id}`);
    }
    setShowSuggestions(false);
    setSearchTerm('');
  };

  const handleKeyDown = (e) => {
    if (!showSuggestions || filteredServices.length === 0) return;

    switch (e.key) {
      case 'ArrowDown':
        e.preventDefault();
        setSelectedSuggestionIndex(prev => 
          prev < filteredServices.length - 1 ? prev + 1 : prev
        );
        break;
      case 'ArrowUp':
        e.preventDefault();
        setSelectedSuggestionIndex(prev => prev > 0 ? prev - 1 : prev);
        break;
      case 'Enter':
        e.preventDefault();
        if (selectedSuggestionIndex >= 0) {
          handleSearchSubmit(filteredServices[selectedSuggestionIndex].id);
        } else {
          handleSearchSubmit();
        }
        break;
      case 'Escape':
        setShowSuggestions(false);
        setSelectedSuggestionIndex(-1);
        break;
    }
  };

  const handleSuggestionClick = (serviceId) => {
    handleSearchSubmit(serviceId);
  };

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
            
            {/* Search Box */}
            <div className="position-relative mx-auto mt-4" style={{ maxWidth: 500 }}>
              <div className="search-container" style={{ position: 'relative' }}>
                <input
                  type="text"
                  className="form-control rounded-pill ps-4 pe-5"
                  placeholder="Tìm kiếm dịch vụ..."
                  value={searchTerm}
                  onChange={handleSearchChange}
                  onKeyDown={handleKeyDown}
                  onBlur={() => setTimeout(() => setShowSuggestions(false), 150)}
                  onFocus={() => searchTerm && setShowSuggestions(true)}
                  style={{
                    border: '2px solid #e9ecef',
                    transition: 'all 0.3s ease',
                    fontSize: '1rem',
                    padding: '12px 50px 12px 20px'
                  }}
                />
                <button
                  className="btn position-absolute"
                  onClick={() => handleSearchSubmit()}
                  style={{
                    right: '5px',
                    top: '50%',
                    transform: 'translateY(-50%)',
                    border: 'none',
                    background: 'linear-gradient(135deg, #007bff, #0056b3)',
                    color: 'white',
                    borderRadius: '50%',
                    width: '40px',
                    height: '40px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center'
                  }}
                >
                  <i className="fas fa-search"></i>
                </button>
                
                {/* Search Suggestions Dropdown */}
                {showSuggestions && filteredServices.length > 0 && (
                  <div 
                    className="position-absolute w-100 bg-white border rounded shadow-lg"
                    style={{ 
                      top: '100%', 
                      zIndex: 1000,
                      maxHeight: '300px',
                      overflowY: 'auto',
                      marginTop: '5px'
                    }}
                  >
                    {filteredServices.slice(0, 8).map((service, index) => (
                      <div
                        key={service.id}
                        className={`p-3 border-bottom cursor-pointer search-suggestion ${
                          index === selectedSuggestionIndex ? 'bg-light' : ''
                        }`}
                        onClick={() => handleSuggestionClick(service.id)}
                        style={{
                          cursor: 'pointer',
                          transition: 'background-color 0.2s ease',
                          backgroundColor: index === selectedSuggestionIndex ? '#f8f9fa' : 'transparent'
                        }}
                        onMouseEnter={(e) => {
                          if (index !== selectedSuggestionIndex) {
                            e.target.style.backgroundColor = '#f1f3f4';
                          }
                        }}
                        onMouseLeave={(e) => {
                          if (index !== selectedSuggestionIndex) {
                            e.target.style.backgroundColor = 'transparent';
                          }
                        }}
                      >
                        <div className="d-flex align-items-center">
                          <img
                            src={service.imageUrl || service.image_url || '/default-image.jpg'}
                            alt={service.name}
                            style={{
                              width: '40px',
                              height: '40px',
                              objectFit: 'cover',
                              borderRadius: '8px',
                              marginRight: '12px'
                            }}
                          />
                          <div>
                            <div className="fw-bold text-dark" style={{ fontSize: '0.95rem' }}>
                              {service.name}
                            </div>
                            <div className="text-muted small" style={{ fontSize: '0.8rem' }}>
                              {service.description.length > 50 
                                ? service.description.substring(0, 50) + '...' 
                                : service.description}
                            </div>
                          </div>
                          <div className="ms-auto">
                            <i className="fas fa-arrow-right text-primary"></i>
                          </div>
                        </div>
                      </div>
                    ))}
                    
                    {filteredServices.length > 8 && (
                      <div className="p-2 text-center text-muted small">
                        Và {filteredServices.length - 8} kết quả khác...
                      </div>
                    )}
                  </div>
                )}
                
                {/* No results message */}
                {showSuggestions && searchTerm && filteredServices.length === 0 && (
                  <div 
                    className="position-absolute w-100 bg-white border rounded shadow-lg p-3 text-center text-muted"
                    style={{ 
                      top: '100%', 
                      zIndex: 1000,
                      marginTop: '5px'
                    }}
                  >
                    <i className="fas fa-search-minus mb-2"></i>
                    <div>Không tìm thấy dịch vụ nào</div>
                  </div>
                )}
              </div>
            </div>
          </div>

          {loading ? (
            <div className="text-center">Loading...</div>
          ) : (
            <div className="row g-4">
              {displayedServices.map((service, index) => {
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
                                <button 
                                  onClick={() => navigate(`/AppointmentPage?serviceId=${service.id}`)}
                                  className="btn btn-primary btn-primary-outline-0 rounded-pill py-2 px-4 mt-2"
                                >
                                  Make Order
                                </button>
                              </div>
                            </div>
                            <div className="col-4 d-flex align-items-center justify-content-center">
                              <div 
                                className="services-img rounded service-image-clickable" 
                                style={{ width: '100px', height: '100px', overflow: 'hidden' }}
                                onClick={() => handleImageClick(service.id)}
                                title="Click để xem chi tiết dịch vụ"
                              >
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
                              <div 
                                className="services-img rounded service-image-clickable" 
                                style={{ width: '100px', height: '100px', overflow: 'hidden' }}
                                onClick={() => handleImageClick(service.id)}
                                title="Click để xem chi tiết dịch vụ"
                              >
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
                                <button 
                                  onClick={() => navigate(`/AppointmentPage?serviceId=${service.id}`)}
                                  className="btn btn-primary btn-primary-outline-0 rounded-pill py-2 px-4 mt-2"
                                >
                                  Make Order
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

      {/* CSS for service image hover effects and search */}
      <style jsx>{`
        .service-image-clickable {
          cursor: pointer;
          transition: all 0.3s ease-in-out;
          position: relative;
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

        /* Search input focus effect */
        .form-control:focus {
          border-color: #007bff !important;
          box-shadow: 0 0 0 0.2rem rgba(0, 123, 255, 0.25) !important;
        }

        /* Search button hover effect */
        .btn:hover {
          background: linear-gradient(135deg, #0056b3, #004085) !important;
          transform: translateY(-50%) scale(1.05) !important;
        }

        /* Search suggestions scrollbar */
        .position-absolute::-webkit-scrollbar {
          width: 6px;
        }
        
        .position-absolute::-webkit-scrollbar-track {
          background: #f1f1f1;
          border-radius: 3px;
        }
        
        .position-absolute::-webkit-scrollbar-thumb {
          background: #c1c1c1;
          border-radius: 3px;
        }
        
        .position-absolute::-webkit-scrollbar-thumb:hover {
          background: #a8a8a8;
        }

        /* Suggestion hover effect */
        .search-suggestion:hover {
          background-color: #f8f9fa !important;
        }

        /* Highlight matching text */
        .highlight {
          background-color: #fff3cd;
          font-weight: bold;
        }
      `}</style>

      <Footer />
    </div>
  );
};

export default ServicePage;