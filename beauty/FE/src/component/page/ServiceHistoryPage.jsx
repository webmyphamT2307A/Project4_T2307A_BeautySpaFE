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

    // State for guest lookup
    const [lookupIdentifier, setLookupIdentifier] = useState('');
    const [lookupType, setLookupType] = useState('email'); // 'email' or 'phone'
    const [lookupPerformed, setLookupPerformed] = useState(false);

    useEffect(() => {
        const storedUser = localStorage.getItem('userInfo');
        if (storedUser) {
            const parsedUser = JSON.parse(storedUser);
            setUserInfo(parsedUser);
            // If user is logged in, fetch their history immediately
            fetchHistoryByCustomerId(parsedUser.id);
        }
    }, []);

    const fetchHistoryByCustomerId = async (customerId) => {
        setIsLoading(true);
        setError('');
        setLookupPerformed(true);
        try {
            const response = await axios.get(`http://localhost:8080/api/v1/serviceHistory/customer/${customerId}`);
            if (response.data.status === 'SUCCESS') {
                setHistory(response.data.data);
            } else {
                setError(response.data.message || 'Không tìm thấy lịch sử.');
                setHistory([]);
            }
        } catch (err) {
            setError('Lỗi kết nối hoặc không tìm thấy lịch sử.');
            setHistory([]);
        } finally {
            setIsLoading(false);
        }
    };

    const handleLookup = async (e) => {
        e.preventDefault();
        if (!lookupIdentifier) {
            setError('Vui lòng nhập Email hoặc SĐT để tra cứu.');
            return;
        }

        setIsLoading(true);
        setError('');
        setLookupPerformed(true);

        const params = new URLSearchParams();
        if (lookupType === 'email') {
            params.append('email', lookupIdentifier);
        } else {
            params.append('phone', lookupIdentifier);
        }

        try {
            const response = await axios.get(`http://localhost:8080/api/v1/serviceHistory/lookup?${params.toString()}`);
            if (response.data.status === 'SUCCESS') {
                setHistory(response.data.data);
            } else {
                setError(response.data.message || 'Không tìm thấy lịch sử.');
                setHistory([]);
            }
        } catch (err) {
            setError('Lỗi kết nối hoặc không tìm thấy lịch sử.');
            setHistory([]);
        } finally {
            setIsLoading(false);
        }
    };

    const renderHistoryTable = () => (
        <div className="table-responsive">
            <table className="table table-hover table-striped">
                <thead className="table-primary">
                    <tr>
                        <th scope="col">#</th>
                        <th scope="col">Tên Dịch Vụ</th>
                        <th scope="col">Giá</th>
                        <th scope="col">Ngày Sử Dụng</th>
                        <th scope="col">Ghi Chú</th>
                    </tr>
                </thead>
                <tbody>
                    {history.map((item, index) => (
                        <tr key={item.id}>
                            <th scope="row">{index + 1}</th>
                            <td>
                                <Link to={`/ServicePage/${item.serviceId}`} className="text-decoration-none fw-bold">
                                    {item.serviceName}
                                </Link>
                            </td>
                            <td>{item.price ? `${item.price.toLocaleString()}₫` : 'N/A'}</td>
                            <td>{new Date(item.appointmentDate).toLocaleDateString('vi-VN')}</td>
                            <td>{item.notes || '-'}</td>
                        </tr>
                    ))}
                </tbody>
            </table>
        </div>
    );

    return (
        <div>

            <Header />
            <div className="container-fluid py-5">
                <div className="container">
                    <div className="text-center mx-auto mb-5" style={{ maxWidth: '800px' }}>
                        <h1 className="display-4">Lịch Sử Sử Dụng Dịch Vụ</h1>
                        <p className="fs-5">
                            {userInfo
                                ? `Chào mừng trở lại, ${userInfo.fullName}! Đây là danh sách các dịch vụ bạn đã sử dụng.`
                                : 'Tra cứu lịch sử dịch vụ của bạn bằng Email hoặc Số điện thoại.'}
                        </p>
                    </div>

                    {!userInfo && (
                        <div className="row justify-content-center mb-5">
                            <div className="col-lg-6">
                                <form onSubmit={handleLookup} className="p-4 border rounded shadow-sm">
                                    <div className="input-group mb-3">
                                        <select
                                            className="form-select"
                                            value={lookupType}
                                            onChange={(e) => setLookupType(e.target.value)}
                                            style={{ flex: '0 0 120px' }}
                                        >
                                            <option value="email">Email</option>
                                            <option value="phone">SĐT</option>
                                        </select>
                                        <input
                                            type={lookupType === 'email' ? 'email' : 'tel'}
                                            className="form-control"
                                            placeholder={`Nhập ${lookupType === 'email' ? 'Email' : 'SĐT'} của bạn...`}
                                            value={lookupIdentifier}
                                            onChange={(e) => setLookupIdentifier(e.target.value)}
                                        />
                                    </div>
                                    <button type="submit" className="btn btn-primary w-100" disabled={isLoading}>
                                        {isLoading ? 'Đang tìm...' : 'Tra Cứu Lịch Sử'}
                                    </button>
                                </form>
                            </div>
                        </div>
                    )}

                    {isLoading && <div className="text-center"><div className="spinner-border text-primary" role="status"><span className="visually-hidden">Loading...</span></div></div>}
                    {error && <div className="alert alert-danger text-center">{error}</div>}

                    {lookupPerformed && !isLoading && !error && (
                        history.length > 0
                            ? renderHistoryTable()
                            : <div className="alert alert-info text-center">Không tìm thấy dữ liệu lịch sử nào.</div>
                    )}
                </div>
            </div>
            <Footer />
        </div>
    );
};

export default ServiceHistoryPage;