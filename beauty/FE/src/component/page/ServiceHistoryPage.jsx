import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Link } from 'react-router-dom';
import Header from '../shared/header';
import Footer from '../shared/footer';

const ServiceHistoryPage = () => {
    const [history, setHistory] = useState([]);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState('');
    const [userInfo, setUserInfo] = useState(null);

    // State for guest service history lookup
    const [lookupIdentifier, setLookupIdentifier] = useState('');
    const [lookupPerformed, setLookupPerformed] = useState(false);
    const [retryCount, setRetryCount] = useState(0);

    useEffect(() => {
        const storedUser = localStorage.getItem('userInfo');
        if (storedUser) {
            const parsedUser = JSON.parse(storedUser);
            setUserInfo(parsedUser);
            // If user is logged in, fetch their service history immediately
            fetchHistoryByCustomerId(parsedUser.id);
        }
    }, []);

    // Function to try alternative API call when encountering duplicate errors
    const tryAlternativeHistoryFetch = async (customerId) => {
        try {
            console.log('Trying alternative API call for customer:', customerId);
            // Try using the general service history endpoint with customer filter
            const response = await axios.get(`http://localhost:8080/api/v1/serviceHistory/`);
            
            if (response.data.status === 'SUCCESS' && Array.isArray(response.data.data)) {
                // Filter results by customer ID on frontend side
                const customerHistory = response.data.data.filter(item => 
                    item.customerId === customerId || 
                    (item.customer && item.customer.id === customerId)
                );
                setHistory(customerHistory);
                console.log('Alternative fetch successful, found:', customerHistory.length, 'records');
            } else {
                throw new Error('Alternative API call failed');
            }
        } catch (altErr) {
            console.error('Alternative fetch also failed:', altErr);
            throw altErr;
        }
    };

    const fetchHistoryByCustomerId = async (customerId) => {
        setIsLoading(true);
        setError('');
        setLookupPerformed(true);
        try {
            // Sử dụng API ServiceHistory để lấy lịch sử dịch vụ theo customer ID
            const response = await axios.get(`http://localhost:8080/api/v1/serviceHistory/customer/${customerId}`);
            console.log('API Response:', response.data); // Debug log
            
            if (response.data.status === 'SUCCESS') {
                // Đảm bảo data là array và xử lý multiple results
                const historyData = Array.isArray(response.data.data) ? response.data.data : [response.data.data];
                setHistory(historyData.filter(item => item != null));
            } else {
                // Xử lý các loại lỗi backend khác nhau
                const errorMessage = response.data.message || 'Không tìm thấy lịch sử dịch vụ.';
                if (errorMessage.includes('Query did not return a unique result')) {
                    setError('Dữ liệu lịch sử bị trùng lặp. Vui lòng liên hệ admin để khắc phục.');
                } else {
                    setError(errorMessage);
                }
                setHistory([]);
            }
        } catch (err) {
            console.error('Fetch history error:', err);
            // Xử lý lỗi response từ server
            if (err.response && err.response.data) {
                const errorMessage = err.response.data.message || 'Lỗi từ server.';
                if (errorMessage.includes('Query did not return a unique result') && retryCount === 0) {
                    // Try alternative approach once
                    console.log('Attempting alternative fetch due to duplicate error...');
                    setRetryCount(1);
                    try {
                        await tryAlternativeHistoryFetch(customerId);
                        // If successful, show success message
                        console.log('Alternative fetch successful');
                        return; // Exit early on success
                    } catch (altErr) {
                        setError('Dữ liệu lịch sử bị trùng lặp trong hệ thống. Vui lòng liên hệ bộ phận kỹ thuật để khắc phục.');
                    }
                } else if (errorMessage.includes('Query did not return a unique result')) {
                    setError('Dữ liệu lịch sử bị trùng lặp trong hệ thống. Vui lòng liên hệ bộ phận kỹ thuật để khắc phục.');
                } else {
                    setError(`Lỗi server: ${errorMessage}`);
                }
            } else if (err.code === 'NETWORK_ERROR') {
                setError('Lỗi kết nối mạng. Vui lòng kiểm tra kết nối internet.');
            } else {
                setError('Lỗi kết nối hoặc không tìm thấy lịch sử dịch vụ.');
            }
            setHistory([]);
        } finally {
            setIsLoading(false);
        }
    };

    const handleLookup = async (e) => {
        e.preventDefault();
        if (!lookupIdentifier) {
            setError('Vui lòng nhập số điện thoại để tra cứu.');
            return;
        }

        setIsLoading(true);
        setError('');
        setLookupPerformed(true);

        try {
            // Sử dụng API ServiceHistory lookup cho khách vãng lai bằng số điện thoại
            const params = new URLSearchParams();
            params.append('phone', lookupIdentifier);
            
            const response = await axios.get(`http://localhost:8080/api/v1/serviceHistory/lookup?${params.toString()}`);
            console.log('Lookup API Response:', response.data); // Debug log
            
            if (response.data.status === 'SUCCESS') {
                // Đảm bảo data là array và xử lý multiple results
                const historyData = Array.isArray(response.data.data) ? response.data.data : [response.data.data];
                const filteredHistory = historyData.filter(item => item != null);
                setHistory(filteredHistory);
                
                if (filteredHistory.length === 0) {
                    setError(`Không tìm thấy lịch sử dịch vụ với số điện thoại: ${lookupIdentifier}`);
                }
            } else {
                // Xử lý các loại lỗi backend khác nhau
                const errorMessage = response.data.message || 'Không thể tra cứu lịch sử dịch vụ.';
                if (errorMessage.includes('Query did not return a unique result')) {
                    setError('Dữ liệu lịch sử bị trùng lặp. Vui lòng liên hệ admin để khắc phục.');
                } else {
                    setError(errorMessage);
                }
                setHistory([]);
            }
        } catch (err) {
            console.error('Lookup error:', err);
            // Xử lý lỗi response từ server
            if (err.response && err.response.data) {
                const errorMessage = err.response.data.message || 'Lỗi từ server.';
                if (errorMessage.includes('Query did not return a unique result')) {
                    setError('Dữ liệu lịch sử bị trùng lặp trong hệ thống. Vui lòng liên hệ bộ phận kỹ thuật để khắc phục.');
                } else {
                    setError(`Lỗi server: ${errorMessage}`);
                }
            } else if (err.code === 'NETWORK_ERROR') {
                setError('Lỗi kết nối mạng. Vui lòng kiểm tra kết nối internet.');
            } else {
                setError('Lỗi kết nối hoặc không thể tra cứu lịch sử dịch vụ.');
            }
            setHistory([]);
        } finally {
            setIsLoading(false);
        }
    };

    const renderHistoryTable = () => (
        <div className="table-responsive">
            <table className="table table-hover mb-0">
                <thead style={{ backgroundColor: '#f8f9fa' }}>
                    <tr>
                        <th scope="col" className="py-3 border-0" style={{ fontSize: '0.9rem', fontWeight: '600', color: '#495057' }}>
                            <i className="fas fa-hashtag me-2"></i>STT
                        </th>
                        <th scope="col" className="py-3 border-0" style={{ fontSize: '0.9rem', fontWeight: '600', color: '#495057' }}>
                            <i className="fas fa-spa me-2"></i>Dịch Vụ
                        </th>
                        <th scope="col" className="py-3 border-0" style={{ fontSize: '0.9rem', fontWeight: '600', color: '#495057' }}>
                            <i className="fas fa-dollar-sign me-2"></i>Giá Tiền (USD)
                        </th>
                        <th scope="col" className="py-3 border-0" style={{ fontSize: '0.9rem', fontWeight: '600', color: '#495057' }}>
                            <i className="fas fa-calendar-alt me-2"></i>Ngày Sử Dụng
                        </th>
                        <th scope="col" className="py-3 border-0" style={{ fontSize: '0.9rem', fontWeight: '600', color: '#495057' }}>
                            <i className="fas fa-user-tie me-2"></i>Nhân Viên
                        </th>
                        <th scope="col" className="py-3 border-0" style={{ fontSize: '0.9rem', fontWeight: '600', color: '#495057' }}>
                            <i className="fas fa-sticky-note me-2"></i>Ghi Chú
                        </th>
                    </tr>
                </thead>
                <tbody>
                    {history.map((item, index) => (
                        <tr key={item.id} style={{ borderLeft: `4px solid ${index % 2 === 0 ? '#007bff' : '#28a745'}` }}>
                            <td className="py-3 align-middle">
                                <span className="badge bg-primary rounded-pill">{index + 1}</span>
                            </td>
                            <td className="py-3 align-middle">
                                <div className="d-flex align-items-center">
                                    <div className="bg-primary text-white rounded-circle d-flex align-items-center justify-content-center me-3" 
                                         style={{ width: '40px', height: '40px', fontSize: '0.9rem' }}>
                                        <i className="fas fa-spa"></i>
                                    </div>
                                    <div>
                                        <div className="fw-bold text-primary">{item.serviceName}</div>
                                        <small className="text-muted">Mã dịch vụ: #{item.serviceId}</small>
                                    </div>
                                </div>
                            </td>
                            <td className="py-3 align-middle">
                                <span className="fw-bold text-success" style={{ fontSize: '1.1rem' }}>
                                    {item.price ? 
                                        `${item.price.toFixed(2)} VND` : 
                                        'N/A'
                                    }
                                </span>
                                <div className="small text-muted">
                                    {item.price && 
                                        `VND ${(item.price * 25000).toLocaleString('vi-VN')}`
                                    }
                                </div>
                            </td>
                            <td className="py-3 align-middle">
                                <div>
                                    <div className="fw-bold" style={{ color: '#495057' }}>
                                        {new Date(item.appointmentDate).toLocaleDateString('vi-VN')}
                                    </div>
                                    <small className="text-muted">
                                        {new Date(item.appointmentDate).toLocaleDateString('vi-VN', { 
                                            weekday: 'long',
                                            timeZone: 'Asia/Ho_Chi_Minh'
                                        })}
                                    </small>
                                </div>
                            </td>
                            <td className="py-3 align-middle">
                                <div>
                                    <div className="fw-bold text-info">
                                        {item.userName || `Nhân viên #${item.userId}`}
                                    </div>
                                    <small className="text-muted">Mã lịch hẹn: #{item.appointmentId}</small>
                                </div>
                            </td>
                            <td className="py-3 align-middle">
                                <div className="text-muted" style={{ maxWidth: '200px' }}>
                                    {item.notes ? (
                                        <span>{item.notes}</span>
                                    ) : (
                                        <em className="text-muted">Không có ghi chú</em>
                                    )}
                                </div>
                            </td>
                        </tr>
                    ))}
                </tbody>
            </table>
            
            {/* Tổng kết thống kê */}
            <div className="bg-light p-3 border-top">
                <div className="row text-center">
                    <div className="col-md-4">
                        <div className="d-flex align-items-center justify-content-center">
                            <div className="bg-primary text-white rounded-circle d-flex align-items-center justify-content-center me-3" style={{ width: '40px', height: '40px' }}>
                                <i className="fas fa-list"></i>
                            </div>
                            <div>
                                <div className="fw-bold text-primary">{history.length}</div>
                                <small className="text-muted">Tổng dịch vụ đã sử dụng</small>
                            </div>
                        </div>
                    </div>
                    <div className="col-md-4">
                        <div className="d-flex align-items-center justify-content-center">
                            <div className="bg-success text-white rounded-circle d-flex align-items-center justify-content-center me-3" style={{ width: '40px', height: '40px' }}>
                                <i className="fas fa-coins"></i>
                            </div>
                            <div>
                                <div className="fw-bold text-success">
                                    {history.reduce((total, item) => total + (item.price || 0), 0).toFixed(2)} VND
                                </div>
                                <small className="text-muted">Tổng chi tiêu</small>
                            </div>
                        </div>
                    </div>
                    <div className="col-md-4">
                        <div className="d-flex align-items-center justify-content-center">
                            <div className="bg-info text-white rounded-circle d-flex align-items-center justify-content-center me-3" style={{ width: '40px', height: '40px' }}>
                                <i className="fas fa-calendar-check"></i>
                            </div>
                            <div>
                                <div className="fw-bold text-info">
                                    {history.length > 0 ? new Date(history[0].appointmentDate).toLocaleDateString('vi-VN') : 'N/A'}
                                </div>
                                <small className="text-muted">Lần gần nhất</small>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );

    return (
        <div>

            <Header />
            <div className="container-fluid py-5" style={{ backgroundColor: '#f8f9fa' }}>
                <div className="container">
                    <div className="text-center mx-auto mb-5" style={{ maxWidth: '900px' }}>
                        <h1 className="display-4 mb-3" style={{ color: '#2c3e50' }}>
                            <i className="fas fa-history me-3 text-primary"></i>
                            Lịch Sử Dịch Vụ
                        </h1>
                        <p className="fs-5 text-muted">
                            {userInfo
                                ? `Chào mừng trở lại, ${userInfo.fullName}! Đây là danh sách lịch sử dịch vụ bạn đã sử dụng.`
                                : 'Tra cứu lịch sử dịch vụ bằng số điện thoại (dành cho khách vãng lai).'}
                        </p>
                    </div>

                    {/* Form tra cứu cho guest users và khách vãng lai */}
                    {!userInfo && (
                        <div className="row justify-content-center mb-5">
                            <div className="col-lg-8 col-md-10">
                                <div className="card shadow-lg border-0">
                                    <div className="card-header bg-gradient text-white text-center py-4" 
                                         style={{ background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)' }}>
                                        <h4 className="mb-2">
                                            <i className="fas fa-search me-3"></i>
                                            Tra Cứu Lịch Sử Dịch Vụ
                                        </h4>
                                        <p className="mb-0 opacity-75">
                                            Dành cho khách vãng lai (tra cứu bằng số điện thoại)
                                        </p>
                                    </div>
                                    <div className="card-body p-4">
                                        <form onSubmit={handleLookup}>
                                            <div className="mb-4">
                                                <label className="form-label fw-bold text-dark">
                                                    <i className="fas fa-phone me-2"></i>
                                                    Nhập số điện thoại:
                                                </label>
                                            </div>

                                            <div className="input-group input-group-lg mb-4">
                                                <span className="input-group-text bg-light border-end-0">
                                                    <i className="fas fa-mobile-alt text-muted"></i>
                                                </span>
                                                <input
                                                    type="tel"
                                                    className="form-control border-start-0"
                                                    placeholder="0987654321"
                                                    value={lookupIdentifier}
                                                    onChange={(e) => setLookupIdentifier(e.target.value)}
                                                    required
                                                    style={{ 
                                                        fontSize: '1.1rem',
                                                        borderLeft: 'none !important',
                                                        boxShadow: 'none'
                                                    }}
                                                />
                                            </div>
                                            <small className="form-text text-muted mb-4 d-block">
                                                <i className="fas fa-info-circle me-1"></i>
                                                Nhập số điện thoại khách vãng lai để tra cứu lịch sử dịch vụ
                                            </small>

                                            <button 
                                                type="submit" 
                                                className="btn btn-lg w-100 py-3 mb-3" 
                                                disabled={isLoading || !lookupIdentifier.trim()}
                                                style={{
                                                    fontSize: '1.1rem',
                                                    fontWeight: '600',
                                                    background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                                                    border: 'none',
                                                    color: 'white',
                                                    transition: 'all 0.3s ease'
                                                }}
                                            >
                                                {isLoading ? (
                                                    <>
                                                        <div className="spinner-border spinner-border-sm me-2" role="status"></div>
                                                        Đang tìm kiếm...
                                                    </>
                                                ) : (
                                                    <>
                                                        <i className="fas fa-search me-2"></i>
                                                        Tra Cứu Lịch Sử Dịch Vụ
                                                    </>
                                                )}
                                            </button>

                                            {/* Quick login option */}
                                            <div className="text-center">
                                                <small className="text-muted">
                                                    Đã có tài khoản? 
                                                    <button 
                                                        type="button"
                                                        className="btn btn-link btn-sm p-0 ms-1"
                                                        onClick={() => {
                                                            const loginBtn = document.querySelector('[data-bs-target="#loginModal"]');
                                                            if (loginBtn) loginBtn.click();
                                                        }}
                                                    >
                                                        <i className="fas fa-sign-in-alt me-1"></i>
                                                        Đăng nhập ngay
                                                    </button>
                                                </small>
                                            </div>
                                        </form>

                                        {/* Hướng dẫn sử dụng */}
                                        <div className="mt-4 p-3 bg-light rounded">
                                            <h6 className="text-primary mb-3">
                                                <i className="fas fa-lightbulb me-2"></i>
                                                Hướng dẫn tra cứu:
                                            </h6>
                                            <div className="row">
                                                <div className="col-md-6">
                                                    <h6 className="small fw-bold text-warning mb-2">
                                                        <i className="fas fa-user me-1"></i>
                                                        Khách vãng lai:
                                                    </h6>
                                                    <ul className="small text-muted mb-3">
                                                        <li>Sử dụng số điện thoại tra cứu</li>
                                                        <li>Xem lịch sử dịch vụ đã dùng</li>
                                                    </ul>
                                                </div>
                                                <div className="col-md-6">
                                                    <h6 className="small fw-bold text-success mb-2">
                                                        <i className="fas fa-user-check me-1"></i>
                                                        Khách hàng đã đăng ký:
                                                    </h6>
                                                    <ul className="small text-muted mb-3">
                                                        <li>Đăng nhập để xem lịch sử đầy đủ</li>
                                                        <li>Theo dõi chi tiết các dịch vụ</li>
                                                    </ul>
                                                </div>
                                            </div>
                                            <div className="text-center">
                                                <small className="text-muted">
                                                    <i className="fas fa-phone-alt me-1"></i>
                                                    Cần hỗ trợ? Gọi hotline: <strong>1900-xxxx</strong>
                                                </small>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* Loading và Error states */}
                    {isLoading && (
                        <div className="text-center py-5">
                            <div className="spinner-border text-primary" style={{ width: '3rem', height: '3rem' }} role="status">
                                <span className="visually-hidden">Đang tải...</span>
                            </div>
                            <p className="mt-3 text-muted">Đang tìm kiếm lịch sử dịch vụ...</p>
                        </div>
                    )}
                    
                    {error && (
                        <div className="row justify-content-center">
                            <div className="col-lg-8">
                                <div className={`alert text-center py-4 ${error.includes('trùng lặp') ? 'alert-warning' : 'alert-danger'}`} role="alert">
                                    <i className={`fa-2x mb-3 ${error.includes('trùng lặp') ? 'fas fa-exclamation-circle text-warning' : 'fas fa-exclamation-triangle text-danger'}`}></i>
                                    <h5 className="alert-heading">
                                        {error.includes('trùng lặp') ? 'Phát hiện dữ liệu trùng lặp!' : 'Không tìm thấy kết quả!'}
                                    </h5>
                                    <p className="mb-3">{error}</p>
                                    
                                    {/* Hiển thị thêm thông tin cho lỗi trùng lặp */}
                                    {error.includes('trùng lặp') && (
                                        <div className="bg-light p-3 rounded mb-3">
                                            <small className="text-muted">
                                                <i className="fas fa-info-circle me-2"></i>
                                                <strong>Nguyên nhân có thể:</strong> Dữ liệu trong hệ thống bị duplicate, 
                                                hoặc có nhiều record cho cùng một thông tin khách hàng.<br/>
                                                <strong>Giải pháp:</strong> Hệ thống đã thử tự động khắc phục. 
                                                Nếu vẫn gặp lỗi, vui lòng liên hệ kỹ thuật.
                                            </small>
                                        </div>
                                    )}
                                    
                                    <hr />
                                    <div className="mb-0">
                                        <button 
                                            className={`btn me-3 ${error.includes('trùng lặp') ? 'btn-outline-warning' : 'btn-outline-danger'}`}
                                            onClick={() => {
                                                setError('');
                                                setLookupIdentifier('');
                                                setLookupPerformed(false);
                                                setHistory([]);
                                                setRetryCount(0);
                                            }}
                                        >
                                            <i className="fas fa-redo me-2"></i>
                                            Thử lại
                                        </button>
                                        <small className="text-muted">
                                            {error.includes('trùng lặp') 
                                                ? 'Hoặc liên hệ bộ phận kỹ thuật: ' 
                                                : 'Hoặc liên hệ '
                                            }
                                            <strong>hotline: 1900-xxxx</strong> để hỗ trợ
                                        </small>
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* Hiển thị lịch sử cho user đã đăng nhập hoặc kết quả tra cứu */}
                    {((userInfo && !isLoading && !error) || (lookupPerformed && !isLoading && !error)) && (
                        history.length > 0 ? (
                            <div className="row justify-content-center">
                                <div className="col-12">
                                    <div className="card shadow-lg border-0">
                                        <div className="card-header bg-success text-white py-3">
                                            <div className="d-flex justify-content-between align-items-center">
                                                <h5 className="mb-0">
                                                    <i className="fas fa-check-circle me-2"></i>
                                                    Tìm thấy {history.length} lịch sử dịch vụ
                                                </h5>
                                                <span className="badge bg-light text-dark">
                                                    {userInfo ? userInfo.fullName : lookupIdentifier}
                                                </span>
                                            </div>
                                        </div>
                                        <div className="card-body p-0">
                                            {renderHistoryTable()}
                                        </div>
                                    </div>
                                </div>
                            </div>
                        ) : (
                            <div className="row justify-content-center">
                                <div className="col-lg-8">
                                    <div className="alert alert-info text-center py-5" role="alert">
                                        <i className="fas fa-search fa-3x text-info mb-4"></i>
                                        <h4 className="alert-heading">Chưa có lịch sử dịch vụ</h4>
                                        <p className="mb-4">
                                            {userInfo 
                                                ? 'Bạn chưa sử dụng dịch vụ nào tại spa của chúng tôi.'
                                                : `Không tìm thấy lịch sử dịch vụ với số điện thoại: ${lookupIdentifier}`
                                            }
                                        </p>
                                        <hr />
                                        <div className="row text-start">
                                            <div className="col-md-6">
                                                <h6 className="text-info">
                                                    <i className="fas fa-lightbulb me-2"></i>
                                                    Khám phá dịch vụ:
                                                </h6>
                                                <ul className="small text-muted">
                                                    <li>Massage thư giãn toàn thân</li>
                                                    <li>Chăm sóc da mặt chuyên sâu</li>
                                                    <li>Liệu trình làm đẹp cao cấp</li>
                                                </ul>
                                            </div>
                                            <div className="col-md-6">
                                                <h6 className="text-info">
                                                    <i className="fas fa-calendar-alt me-2"></i>
                                                    Đặt lịch ngay:
                                                </h6>
                                                <p className="small text-muted">
                                                    Hotline: <strong>1900-xxxx</strong><br/>
                                                    Hoặc đặt lịch online để trải nghiệm
                                                </p>
                                            </div>
                                        </div>
                                        <a href="/ServicePage" className="btn btn-primary mt-3">
                                            <i className="fas fa-spa me-2"></i>
                                            Xem Dịch Vụ
                                        </a>
                                    </div>
                                </div>
                            </div>
                        )
                    )}
                </div>
            </div>
            <Footer />
        </div>
    );
};

export default ServiceHistoryPage;