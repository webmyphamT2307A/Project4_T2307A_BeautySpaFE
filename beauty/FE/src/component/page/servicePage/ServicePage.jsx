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
    
    // Trim và loại bỏ khoảng trắng thừa, kiểm tra độ dài tối thiểu
    const trimmedValue = value.trim().replace(/\s+/g, ' ');
    
    if (trimmedValue && trimmedValue.length >= 2) {
      // Tách từ khóa và tìm kiếm theo từng từ
      const keywords = trimmedValue.toLowerCase().split(' ').filter(keyword => keyword.length > 0);
      
      const filtered = servicesData.filter(service => {
        const serviceName = service.name.toLowerCase();
        const serviceDesc = service.description.toLowerCase();
        
        // Tìm kiếm chính xác: phải chứa ít nhất 1 từ khóa hoàn chỉnh
        return keywords.some(keyword => {
          // Tránh các ký tự đặc biệt gây nhiễu
          if (keyword.length < 2 || /^[^a-záàảãạăắằẳẵặâấầẩẫậđéèẻẽẹêếềểễệíìỉĩịóòỏõọôốồổỗộơớờởỡợúùủũụưứừửữựýỳỷỹỵ0-9]+$/.test(keyword)) {
            return false;
          }
          
          return serviceName.includes(keyword) || serviceDesc.includes(keyword);
        });
      });
      
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
          <h3 className="text-white display-3 mb-4">Dịch Vụ Của Chúng Tôi</h3>
          <ol className="breadcrumb justify-content-center mb-0">
            <li className="breadcrumb-item"><a href="/">Trang chủ</a></li>
            <li className="breadcrumb-item"><a href="#">Trang</a></li>
            <li className="breadcrumb-item active text-white">Trang Dịch Vụ</li>
          </ol>
        </div>
      </div>

      <div id="services-section" className="container-fluid services py-5">
        <div className="container py-5">
          <div className="mx-auto text-center mb-5" style={{ maxWidth: 800 }}>
            <p className="fs-4 text-uppercase text-center text-primary">Dịch Vụ Của Chúng Tôi</p>
            <h1 className="display-3">Dịch Vụ Spa &amp; Làm Đẹp</h1>
            
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
                    border: '2px solid rgb(255, 164, 173)',
                    transition: 'all 0.3s ease',
                    fontSize: '1rem',
                    padding: '12px 50px 12px 20px'
                  }}
                />
                <button
                  className="btn position-absolute search-btn"
                  onClick={() => handleSearchSubmit()}
                  style={{
                    right: '5px',
                    top: '50%',
                    transform: 'translateY(-50%)',
                    border: 'none',
                    background: '#FDB5B9',
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
                          <div className="flex-grow-1 text-start">
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
            <div className="text-center">Đang tải...</div>
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
                                  onClick={() => {
                                    navigate('/', { replace: true });
                                    setTimeout(() => {
                                      const appointmentSection = document.getElementById('appointment');
                                      if (appointmentSection) {
                                        appointmentSection.scrollIntoView({ behavior: 'smooth' });
                                      }
                                    }, 100);
                                  }}
                                  className="btn btn-primary btn-primary-outline-0 rounded-pill py-2 px-4 mt-2"
                                >
                                  Đặt Lịch
                                </button>
                              </div>
                            </div>
                            <div className="col-4 d-flex align-items-center justify-content-center">
                              <div 
                                className="services-img rounded service-image-clickable" 
                                style={{ width: '180px', height: '180px', overflow: 'hidden' }}
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
                                style={{ width: '180px', height: '180px', overflow: 'hidden' }}
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
                                  onClick={() => {
                                    navigate('/', { replace: true });
                                    setTimeout(() => {
                                      const appointmentSection = document.getElementById('appointment');
                                      if (appointmentSection) {
                                        appointmentSection.scrollIntoView({ behavior: 'smooth' });
                                      }
                                    }, 100);
                                  }}
                                  className="btn btn-primary btn-primary-outline-0 rounded-pill py-2 px-4 mt-2"
                                >
                                  Đặt Lịch
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

          <div className="text-center mt-5 d-flex justify-content-center align-items-center flex-wrap gap-2">
            {/* Previous Button */}
            <button
              className="pagination-btn"
              onClick={() => {
                const prevPage = Math.max(1, currentPage - 1);
                setCurrentPage(prevPage);
                // Scroll to services section when changing page
                const servicesSection = document.getElementById('services-section');
                if (servicesSection) {
                  servicesSection.scrollIntoView({ behavior: 'smooth', block: 'start' });
                } else {
                  // Fallback: scroll to top of page
                  window.scrollTo({ top: 0, behavior: 'smooth' });
                }
              }}
              disabled={currentPage === 1}
              style={{
                minWidth: '100px',
                height: '50px',
                borderRadius: '12px',
                border: '2px solid #FDB5B9',
                background: 'white',
                color: currentPage === 1 ? '#ccc' : '#FDB5B9',
                fontWeight: '600',
                fontSize: '1rem',
                cursor: currentPage === 1 ? 'not-allowed' : 'pointer',
                transition: 'all 0.3s ease',
                opacity: currentPage === 1 ? 0.5 : 1
              }}
              onMouseEnter={(e) => {
                if (currentPage !== 1) {
                  e.target.style.background = '#FDB5B9';
                  e.target.style.color = 'white';
                  e.target.style.transform = 'translateY(-2px)';
                  e.target.style.boxShadow = '0 4px 15px rgba(253, 181, 185, 0.3)';
                }
              }}
              onMouseLeave={(e) => {
                if (currentPage !== 1) {
                  e.target.style.background = 'white';
                  e.target.style.color = '#FDB5B9';
                  e.target.style.transform = 'translateY(0)';
                  e.target.style.boxShadow = 'none';
                }
              }}
            >
              <i className="fas fa-chevron-left me-2"></i>
            </button>

            {/* Page Numbers */}
            {[...Array(totalPages)].map((_, i) => (
              <button
                key={i}
                className="pagination-btn"
                onClick={() => {
                  setCurrentPage(i + 1);
                  // Scroll to services section when changing page
                  const servicesSection = document.getElementById('services-section');
                  if (servicesSection) {
                    servicesSection.scrollIntoView({ behavior: 'smooth', block: 'start' });
                  } else {
                    // Fallback: scroll to top of page
                    window.scrollTo({ top: 0, behavior: 'smooth' });
                  }
                }}
                style={{
                  width: '50px',
                  height: '50px',
                  borderRadius: '12px',
                  border: i + 1 === currentPage ? 'none' : '2px solid #FDB5B9',
                  background: i + 1 === currentPage ? '#FDB5B9' : 'white',
                  color: i + 1 === currentPage ? 'white' : '#FDB5B9',
                  fontWeight: '700',
                  fontSize: '1.1rem',
                  cursor: 'pointer',
                  transition: 'all 0.3s ease',
                  boxShadow: i + 1 === currentPage ? '0 4px 15px rgba(253, 181, 185, 0.4)' : 'none'
                }}
                onMouseEnter={(e) => {
                  if (i + 1 !== currentPage) {
                    e.target.style.background = '#FDB5B9';
                    e.target.style.color = 'white';
                    e.target.style.transform = 'translateY(-2px)';
                    e.target.style.boxShadow = '0 4px 15px rgba(253, 181, 185, 0.3)';
                  }
                }}
                onMouseLeave={(e) => {
                  if (i + 1 !== currentPage) {
                    e.target.style.background = 'white';
                    e.target.style.color = '#FDB5B9';
                    e.target.style.transform = 'translateY(0)';
                    e.target.style.boxShadow = 'none';
                  }
                }}
              >
                {i + 1}
              </button>
            ))}

            {/* Next Button */}
            <button
              className="pagination-btn"
              onClick={() => {
                const nextPage = Math.min(totalPages, currentPage + 1);
                setCurrentPage(nextPage);
                // Scroll to services section when changing page
                const servicesSection = document.getElementById('services-section');
                if (servicesSection) {
                  servicesSection.scrollIntoView({ behavior: 'smooth', block: 'start' });
                } else {
                  // Fallback: scroll to top of page
                  window.scrollTo({ top: 0, behavior: 'smooth' });
                }
              }}
              disabled={currentPage === totalPages}
              style={{
                minWidth: '100px',
                height: '50px',
                borderRadius: '12px',
                border: '2px solid #FDB5B9',
                background: 'white',
                color: currentPage === totalPages ? '#ccc' : '#FDB5B9',
                fontWeight: '600',
                fontSize: '1rem',
                cursor: currentPage === totalPages ? 'not-allowed' : 'pointer',
                transition: 'all 0.3s ease',
                opacity: currentPage === totalPages ? 0.5 : 1
              }}
              onMouseEnter={(e) => {
                if (currentPage !== totalPages) {
                  e.target.style.background = '#FDB5B9';
                  e.target.style.color = 'white';
                  e.target.style.transform = 'translateY(-2px)';
                  e.target.style.boxShadow = '0 4px 15px rgba(253, 181, 185, 0.3)';
                }
              }}
              onMouseLeave={(e) => {
                if (currentPage !== totalPages) {
                  e.target.style.background = 'white';
                  e.target.style.color = '#FDB5B9';
                  e.target.style.transform = 'translateY(0)';
                  e.target.style.boxShadow = 'none';
                }
              }}
            >
              <i className="fas fa-chevron-right ms-2"></i>
            </button>
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
          content: "\\f35d";
          font-family: "Font Awesome 5 Free";
          font-weight: 900;
          position: absolute;
          top: 50%;
          left: 50%;
          transform: translate(-50%, -50%);
          background: linear-gradient(135deg, rgba(253, 181, 185, 0.9), rgba(247, 168, 184, 0.9));
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
          box-shadow: 0 4px 15px rgba(253, 181, 185, 0.4);
        }

        .service-image-clickable:hover::after {
          opacity: 1;
          transform: translate(-50%, -50%) scale(1.1);
        }

        /* Add pulse animation to the heart icon */
        .service-image-clickable:hover::after {
          animation: pulse 1.5s infinite;
        }

        @keyframes pulse {
          0% {
            box-shadow: 0 4px 15px rgba(253, 181, 185, 0.4);
          }
          50% {
            box-shadow: 0 4px 20px rgba(253, 181, 185, 0.7);
          }
          100% {
            box-shadow: 0 4px 15px rgba(253, 181, 185, 0.4);
          }
        }

        /* Enhanced "Đặt Lịch" button styling */
        .btn-primary.rounded-pill {
          background: linear-gradient(135deg, #FDB5B9, #f89ca0) !important;
          border: none !important;
          box-shadow: 0 6px 20px rgba(253, 181, 185, 0.3) !important;
          font-weight: 600 !important;
          font-size: 1rem !important;
          letter-spacing: 0.3px !important;
          transition: all 0.3s ease !important;
          position: relative !important;
          z-index: 2 !important;
          padding: 10px 25px !important;
          color: white !important;
        }

        .btn-primary.rounded-pill:hover {
          background: linear-gradient(135deg, #F7A8B8, #E589A3) !important;
          transform: translateY(-3px) scale(1.05) !important;
          box-shadow: 0 12px 30px rgba(253, 181, 185, 0.5) !important;
          color: white !important;
        }

        /* Search input focus effect */
        .form-control:focus {
          border-color: rgb(255, 164, 173) !important;
          box-shadow: 0 0 0 0.2rem rgb(255, 226, 229) !important;
        }

        /* Search button hover effect - Keep original position */
        .search-btn:hover {
          background: linear-gradient(135deg, #F7A8B8, #E589A3) !important;
          transform: translateY(-50%) !important; /* Keep center position */
        }
        
        /* Override general btn hover for other buttons */
        .btn:hover:not(.search-btn) {
          background: linear-gradient(135deg, #F7A8B8, #E589A3) !important;
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