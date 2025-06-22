import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Link } from 'react-router-dom';
import { ToastContainer, toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
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

    // Phone validation state
    const [phoneError, setPhoneError] = useState('');

    // Function to validate Vietnamese phone numbers
    const validateVietnamesePhone = (phone) => {
        // Remove all spaces and special characters
        const cleanPhone = phone.replace(/[\s\-\(\)\.]/g, '');
        
        // Vietnamese phone number patterns
        const patterns = [
            /^(84|0)(3[2-9]|5[689]|7[06-9]|8[1-689]|9[0-46-9])[0-9]{7}$/, // Mobile
            /^(84|0)(2[0-9])[0-9]{8}$/, // Landline
        ];
        
        // Check length first (10-11 digits for Vietnam)
        if (cleanPhone.length < 10 || cleanPhone.length > 11) {
            return 'Số điện thoại phải có 10-11 số';
        }
        
        // Check if contains only numbers
        if (!/^\d+$/.test(cleanPhone)) {
            return 'Số điện thoại chỉ được chứa các chữ số';
        }
        
        // Check Vietnamese phone patterns
        const isValid = patterns.some(pattern => pattern.test(cleanPhone));
        if (!isValid) {
            return 'Định dạng số điện thoại không hợp lệ (VD: 0987654321)';
        }
        
        return null; // Valid
    };

    // Handle phone input change with validation
    const handlePhoneChange = (e) => {
        const value = e.target.value;
        
        // Limit input to 15 characters max (including spaces/special chars)
        if (value.length > 15) {
            return;
        }
        
        // Allow only numbers, spaces, hyphens, parentheses, dots
        const filteredValue = value.replace(/[^0-9\s\-\(\)\.]/g, '');
        
        setLookupIdentifier(filteredValue);
        
        // Clear error when user starts typing
        if (phoneError) {
            setPhoneError('');
        }
        
        // Validate if not empty
        if (filteredValue.trim()) {
            const error = validateVietnamesePhone(filteredValue);
            setPhoneError(error || '');
        }
    };

    // Cancel appointment states
    const [showCancelModal, setShowCancelModal] = useState(false);
    const [cancelAppointmentId, setCancelAppointmentId] = useState(null);
    const [cancelReason, setCancelReason] = useState('');
    const [isSubmittingCancel, setIsSubmittingCancel] = useState(false);

    // Appointment status cache to avoid multiple API calls
    const [appointmentStatusCache, setAppointmentStatusCache] = useState({});

    useEffect(() => {
        const storedUser = localStorage.getItem('userInfo');
        if (storedUser) {
            const parsedUser = JSON.parse(storedUser);
            setUserInfo(parsedUser);
            // If user is logged in, fetch their service history immediately
            fetchHistoryByCustomerId(parsedUser.id);
        }
    }, []);

    // Fetch appointment statuses when history changes
    useEffect(() => {
        const fetchAllAppointmentStatuses = async () => {
            if (history.length === 0) return;
            
            console.log('🔄 Fetching appointment statuses for all history items...');
            const appointmentIds = history.map(item => item.appointmentId).filter(id => id && !appointmentStatusCache[id]);
            
            if (appointmentIds.length === 0) {
                console.log('📦 All appointment statuses already cached');
                return;
            }
            
            console.log(`🎯 Fetching statuses for ${appointmentIds.length} appointments:`, appointmentIds);
            
            // Fetch statuses in parallel
            const statusPromises = appointmentIds.map(async (appointmentId) => {
                const status = await fetchAppointmentStatus(appointmentId);
                return { appointmentId, status };
            });
            
            try {
                const results = await Promise.all(statusPromises);
                console.log('✅ Fetched all appointment statuses:', results);
                
                // Force re-render to update status badges
                setHistory(prevHistory => [...prevHistory]);
            } catch (error) {
                console.error('❌ Error fetching appointment statuses:', error);
            }
        };
        
        fetchAllAppointmentStatuses();
    }, [history.length]); // Only trigger when history length changes

    // Function to fetch appointment status from appointment API
    const fetchAppointmentStatus = async (appointmentId) => {
        // Check cache first
        if (appointmentStatusCache[appointmentId]) {
            console.log(`📦 Using cached status for appointment ${appointmentId}:`, appointmentStatusCache[appointmentId]);
            return appointmentStatusCache[appointmentId];
        }

        try {
            console.log(`🔍 Fetching status for appointment ${appointmentId}...`);
            
            // Try multiple potential endpoints
            const endpoints = [
                `http://localhost:8080/api/v1/admin/appointment/findById/${appointmentId}`,
                `http://localhost:8080/api/v1/appointment/findById/${appointmentId}`,
                `http://localhost:8080/api/v1/admin/appointment/${appointmentId}`,
                `http://localhost:8080/api/v1/appointment/${appointmentId}`
            ];
            
            let response = null;
            let workingEndpoint = null;
            
            for (const endpoint of endpoints) {
                try {
                    console.log(`🧪 Trying endpoint: ${endpoint}`);
                    response = await axios.get(endpoint);
                    workingEndpoint = endpoint;
                    console.log(`✅ Working endpoint found: ${endpoint}`);
                    break;
                } catch (endpointError) {
                    console.log(`❌ Endpoint failed: ${endpoint}`, endpointError.response?.status);
                    continue;
                }
            }
            
            if (!response) {
                console.error(`❌ All endpoints failed for appointment ${appointmentId}`);
                return null;
            }
            
            console.log(`📊 Response from ${workingEndpoint}:`, response.data);
            
            if (response.data.status === 'SUCCESS' && response.data.data) {
                const appointmentStatus = response.data.data.status || 'pending';
                console.log(`✅ Fetched appointment ${appointmentId} status:`, appointmentStatus);
                
                // Cache the result
                setAppointmentStatusCache(prev => ({
                    ...prev,
                    [appointmentId]: appointmentStatus
                }));
                
                return appointmentStatus;
            } else if (response.data.status || response.data.appointmentId) {
                // Handle different response structure
                const appointmentStatus = response.data.status || 'pending';
                console.log(`✅ Fetched appointment ${appointmentId} status (alt structure):`, appointmentStatus);
                
                setAppointmentStatusCache(prev => ({
                    ...prev,
                    [appointmentId]: appointmentStatus
                }));
                
                return appointmentStatus;
            } else {
                console.warn(`⚠️ Unexpected response structure for appointment ${appointmentId}:`, response.data);
                return null;
            }
        } catch (error) {
            console.error(`❌ Error fetching appointment ${appointmentId} status:`, error);
            return null;
        }
    };

    // Manual test function for debugging
    const testFetchAppointmentStatus = async (appointmentId) => {
        console.log(`🧪 MANUAL TEST: Fetching status for appointment ${appointmentId}`);
        const status = await fetchAppointmentStatus(appointmentId);
        console.log(`🧪 MANUAL TEST RESULT:`, status);
        toast.info(`Test result for appointment ${appointmentId}: ${status || 'FAILED'}`);
    };

    // Function to try alternative API call when encountering duplicate errors
    const tryAlternativeHistoryFetch = async (customerId) => {
        try {
            console.log('Trying alternative API call for customer:', customerId);
            // Try using the general service history endpoint with customer filter
            const response = await axios.get(`http://localhost:8080/api/v1/serviceHistory/`);
            
            if (response.data.status === 'SUCCESS' && Array.isArray(response.data.data)) {
                // Filter results by customer ID on frontend side
                const customerHistory = response.data.data.filter(item => 
                    (item.customerId === customerId || 
                    (item.customer && item.customer.id === customerId)) &&
                    item.isActive
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
        console.log('🔄 Fetching history for customer ID:', customerId);
        setIsLoading(true);
        setError('');
        setLookupPerformed(true);
        try {
            // Sử dụng API ServiceHistory để lấy lịch sử dịch vụ theo customer ID
            const response = await axios.get(`http://localhost:8080/api/v1/serviceHistory/customer/${customerId}`);
            console.log('📊 Fetch History API Response:', response.data); // Debug log
            
            if (response.data.status === 'SUCCESS') {
                // Đảm bảo data là array và xử lý multiple results
                const historyData = Array.isArray(response.data.data) ? response.data.data : [response.data.data];
                const filteredHistory = historyData.filter(item => item != null && item.isActive);
                console.log('✅ Fetched history data:', filteredHistory);
                console.log('📈 History count:', filteredHistory.length);
                console.log('🔍 Individual records:');
                filteredHistory.forEach((item, index) => {
                    console.log(`   ${index + 1}. Appointment ID: ${item.appointmentId}, Status: ${item.status}, Date: ${item.appointmentDate}`);
                });
                setHistory(filteredHistory);
            } else {
                // Xử lý các loại lỗi backend khác nhau
                const errorMessage = response.data.message || 'Không tìm thấy lịch sử dịch vụ.';
                console.warn('⚠️ API returned non-success status:', errorMessage);
                if (errorMessage.includes('Query did not return a unique result')) {
                    setError('Dữ liệu lịch sử bị trùng lặp. Vui lòng liên hệ admin để khắc phục.');
                } else {
                    setError(errorMessage);
                }
                setHistory([]);
            }
        } catch (err) {
            console.error('❌ Fetch history error:', err);
            // Xử lý lỗi response từ server
            if (err.response && err.response.data) {
                const errorMessage = err.response.data.message || 'Lỗi từ server.';
                if (errorMessage.includes('Query did not return a unique result') && retryCount === 0) {
                    // Try alternative approach once
                    console.log('🔄 Attempting alternative fetch due to duplicate error...');
                    setRetryCount(1);
                    try {
                        await tryAlternativeHistoryFetch(customerId);
                        // If successful, show success message
                        console.log('✅ Alternative fetch successful');
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
            console.log('✅ Fetch history completed');
        }
    };

    const handleLookup = async (e) => {
        e.preventDefault();
        if (!lookupIdentifier) {
            setError('Vui lòng nhập số điện thoại để tra cứu.');
            return;
        }

        // Validate phone number before proceeding
        const phoneValidationError = validateVietnamesePhone(lookupIdentifier);
        if (phoneValidationError) {
            setPhoneError(phoneValidationError);
            setError('Vui lòng nhập số điện thoại hợp lệ.');
            return;
        }

        setIsLoading(true);
        setError('');
        setPhoneError('');
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
                const filteredHistory = historyData.filter(item => item != null && item.isActive);
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

    // Cancel appointment functions
    const handleShowCancelModal = (appointmentId) => {
        setCancelAppointmentId(appointmentId);
        setShowCancelModal(true);
        setCancelReason('');
    };

    const handleCloseCancelModal = () => {
        setShowCancelModal(false);
        setCancelAppointmentId(null);
        setCancelReason('');
        setIsSubmittingCancel(false);
    };

    const handleCancelAppointment = async () => {
        if (!cancelReason.trim()) {
            toast.warn('Vui lòng nhập lý do hủy đặt lịch.');
            return;
        }

        if (cancelReason.length > 500) {
            toast.warn('Lý do hủy không được vượt quá 500 ký tự.');
            return;
        }

        if (!cancelAppointmentId) {
            toast.error('Không xác định được lịch hẹn cần hủy.');
            return;
        }

        setIsSubmittingCancel(true);

        try {
            console.log('🚀 Starting cancel appointment request...');
            console.log('📋 Cancel Details:', {
                appointmentId: cancelAppointmentId,
                reason: cancelReason,
                userInfo: userInfo?.id || 'Guest',
                endpoint: `http://localhost:8080/api/v1/admin/appointment/${cancelAppointmentId}/cancel`
            });

            // Call backend API to cancel appointment
            const response = await axios.put(`http://localhost:8080/api/v1/admin/appointment/${cancelAppointmentId}/cancel`, {
                reason: cancelReason
            });
            
            console.log('✅ Cancel API Response:', response);
            console.log('📊 Response Data:', response.data);
            console.log('📊 Response Status:', response.status);
            console.log('📊 Response Headers:', response.headers);
            
            if (response.data.status === 'SUCCESS' || response.status === 200) {
                console.log('🎉 Cancel appointment successful!');
                toast.success(`Đã hủy đặt lịch thành công. Lý do: ${cancelReason}`);
                
                console.log('🔄 Starting data refresh...');
                
                // IMMEDIATE CACHE UPDATE: Update appointment status cache first
                console.log('🚀 Immediately updating appointment status cache...');
                setAppointmentStatusCache(prev => ({
                    ...prev,
                    [cancelAppointmentId]: 'cancelled'
                }));
                
                // FORCE UPDATE: Immediately update the status in current history data
                console.log('🚀 Force updating appointment status in current data...');
                setHistory(prevHistory => {
                    const updatedHistory = prevHistory.map(item => {
                        if (item.appointmentId === cancelAppointmentId) {
                            console.log(`✅ Force updating appointment ${item.appointmentId} status to 'cancelled'`);
                            return {
                                ...item,
                                status: 'cancelled',
                                // Also add timestamp for when it was cancelled
                                cancelledAt: new Date().toISOString()
                            };
                        }
                        return item;
                    });
                    console.log('📊 Updated history with cancelled status:', updatedHistory);
                    return updatedHistory;
                });
                
                // FORCE RE-RENDER: Trigger component re-render to update buttons
                console.log('🔄 Forcing component re-render...');
                setTimeout(() => {
                    // This will trigger re-evaluation of canCancel function with updated cache
                    setHistory(prevHistory => [...prevHistory]);
                }, 100);
                
                console.log('✅ Immediate UI updates completed');
                
                // Close modal first to provide immediate feedback
                handleCloseCancelModal();
                
                // Then refresh from backend for data consistency in background
                console.log('🔄 Starting background data refresh...');
                if (userInfo) {
                    console.log('👤 Refreshing for logged in user:', userInfo.id);
                    fetchHistoryByCustomerId(userInfo.id).catch(console.error);
                } else if (lookupIdentifier) {
                    console.log('🔍 Refreshing for guest lookup:', lookupIdentifier);
                    handleLookup({ preventDefault: () => {} }).catch(console.error);
                }
                
                console.log('✅ Modal closed and background refresh started');
            } else {
                console.warn('⚠️ Unexpected response structure:', response.data);
                toast.error(response.data.message || 'Không thể hủy đặt lịch. Vui lòng thử lại.');
            }
        } catch (error) {
            console.error('❌ Cancel appointment error:', error);
            console.error('❌ Error Response:', error.response);
            console.error('❌ Error Response Data:', error.response?.data);
            console.error('❌ Error Response Status:', error.response?.status);
            console.error('❌ Error Code:', error.code);
            
            if (error.response && error.response.data) {
                const errorMessage = error.response.data.message || 'Lỗi từ server khi hủy đặt lịch.';
                console.error('📝 Error Message:', errorMessage);
                
                // Check for common error scenarios
                if (error.response.status === 404) {
                    toast.error('Không tìm thấy lịch hẹn hoặc endpoint API. Vui lòng liên hệ hỗ trợ.');
                } else if (error.response.status === 403) {
                    toast.error('Không có quyền hủy lịch hẹn này. Vui lòng đăng nhập lại.');
                } else if (error.response.status === 401) {
                    toast.error('Phiên đăng nhập đã hết hạn. Vui lòng đăng nhập lại.');
                } else if (error.response.status >= 500) {
                    toast.error('Lỗi máy chủ. Vui lòng thử lại sau.');
                } else {
                    toast.error(errorMessage);
                }
            } else if (error.code === 'NETWORK_ERROR') {
                console.error('🌐 Network error detected');
                toast.error('Lỗi kết nối mạng. Vui lòng kiểm tra kết nối internet.');
            } else {
                console.error('❓ Unknown error type');
                toast.error('Có lỗi xảy ra khi hủy đặt lịch. Vui lòng thử lại.');
            }
        } finally {
            setIsSubmittingCancel(false);
        }
    };

    // Helper function to determine appointment status
    const getAppointmentStatus = (appointmentDate, status, appointmentId) => {
        const today = new Date();
        const aptDate = new Date(appointmentDate);
        
        // Reset time to beginning of day for comparison
        today.setHours(0, 0, 0, 0);
        aptDate.setHours(0, 0, 0, 0);
        
        // First, try to use cached appointment status if available
        const cachedStatus = appointmentStatusCache[appointmentId];
        const effectiveStatus = cachedStatus || status;
        
        // Debug: Log status information
        console.log('🔍 Status Check Debug:', {
            appointmentId,
            appointmentDate,
            originalStatus: status,
            cachedStatus: cachedStatus,
            effectiveStatus: effectiveStatus,
            statusType: typeof effectiveStatus,
            statusLowerCase: effectiveStatus?.toLowerCase(),
            statusString: String(effectiveStatus),
            today: today.toDateString(),
            aptDate: aptDate.toDateString()
        });
        
        // Check for cancelled status in multiple variations
        const cancelledVariations = ['cancelled', 'canceled', 'hủy', 'da_huy', 'đã hủy'];
        const statusString = String(effectiveStatus || '').toLowerCase().trim();
        
        if (effectiveStatus && cancelledVariations.some(variation => statusString.includes(variation))) {
            console.log('✅ Status detected as CANCELLED:', statusString);
            return { status: 'cancelled', text: 'Đã hủy', className: 'bg-danger' };
        } 
        
        // Check for completed status variations
        const completedVariations = ['completed', 'finished', 'done', 'hoàn thành', 'hoan_thanh'];
        if (effectiveStatus && completedVariations.some(variation => statusString.includes(variation))) {
            console.log('✅ Status detected as COMPLETED:', statusString);
            return { status: 'completed', text: 'Đã hoàn thành', className: 'bg-success' };
        }
        
        // Check for pending status
        const pendingVariations = ['pending', 'waiting', 'chờ', 'cho', 'đang chờ'];
        if (effectiveStatus && pendingVariations.some(variation => statusString.includes(variation))) {
            // For pending status, use date-based logic
            if (aptDate < today) {
                console.log('📅 Pending appointment in past: COMPLETED');
                return { status: 'completed', text: 'Đã hoàn thành', className: 'bg-success' };
            } else if (aptDate.getTime() === today.getTime()) {
                console.log('📅 Pending appointment today: TODAY');
                return { status: 'today', text: 'Hôm nay', className: 'bg-warning text-dark' };
            } else {
                console.log('📅 Pending appointment future: UPCOMING');
                return { status: 'upcoming', text: 'Sắp tới', className: 'bg-info' };
            }
        }
        
        // Date-based logic for appointments without explicit status
        if (aptDate < today) {
            console.log('📅 Status based on DATE: COMPLETED (past date)');
            return { status: 'completed', text: 'Đã hoàn thành', className: 'bg-success' };
        } else if (aptDate.getTime() === today.getTime()) {
            console.log('📅 Status based on DATE: TODAY');
            return { status: 'today', text: 'Hôm nay', className: 'bg-warning text-dark' };
        } else {
            console.log('📅 Status based on DATE: UPCOMING');
            return { status: 'upcoming', text: 'Sắp tới', className: 'bg-info' };
        }
    };

    // Helper function to check if appointment can be cancelled
    const canCancelAppointment = (appointmentDate, status, appointmentId) => {
        const today = new Date();
        const aptDate = new Date(appointmentDate);
        
        // Reset time to beginning of day for comparison
        today.setHours(0, 0, 0, 0);
        aptDate.setHours(0, 0, 0, 0);
        
        // Use cached status if available
        const effectiveStatus = appointmentStatusCache[appointmentId] || status;
        
        // Can cancel if:
        // 1. Not already cancelled
        // 2. Appointment is today or in the future
        // 3. Not already completed
        const isNotCancelled = !effectiveStatus || !String(effectiveStatus).toLowerCase().includes('cancel');
        const isNotPast = aptDate >= today;
        const isNotCompleted = !effectiveStatus || !String(effectiveStatus).toLowerCase().includes('completed');
        
        console.log('🔍 Can Cancel Check:', {
            appointmentId,
            effectiveStatus,
            isNotCancelled,
            isNotPast,
            isNotCompleted,
            result: isNotCancelled && isNotPast && isNotCompleted
        });
        
        return isNotCancelled && isNotPast && isNotCompleted;
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
                            <i className="fas fa-dollar-sign me-2"></i>Giá Tiền (VNĐ)
                        </th>
                        <th scope="col" className="py-3 border-0" style={{ fontSize: '0.9rem', fontWeight: '600', color: '#495057' }}>
                            <i className="fas fa-calendar-alt me-2"></i>Ngày Hẹn
                        </th>
                        <th scope="col" className="py-3 border-0" style={{ fontSize: '0.9rem', fontWeight: '600', color: '#495057' }}>
                            <i className="fas fa-info-circle me-2"></i>Trạng Thái
                        </th>
                        <th scope="col" className="py-3 border-0" style={{ fontSize: '0.9rem', fontWeight: '600', color: '#495057' }}>
                            <i className="fas fa-user-tie me-2"></i>Nhân Viên
                        </th>
                        <th scope="col" className="py-3 border-0" style={{ fontSize: '0.9rem', fontWeight: '600', color: '#495057' }}>
                            <i className="fas fa-sticky-note me-2"></i>Ghi Chú
                        </th>
                        <th scope="col" className="py-3 border-0" style={{ fontSize: '0.9rem', fontWeight: '600', color: '#495057' }}>
                            <i className="fas fa-cogs me-2"></i>Thao Tác
                        </th>
                    </tr>
                </thead>
                <tbody>
                    {history.map((item, index) => {
                        // Debug: Log complete item data
                        console.log(`🔍 History Item ${index + 1} Debug:`, {
                            id: item.id,
                            appointmentId: item.appointmentId,
                            appointmentDate: item.appointmentDate,
                            status: item.status,
                            statusType: typeof item.status,
                            allFields: Object.keys(item),
                            fullItem: item
                        });
                        
                        const appointmentStatus = getAppointmentStatus(item.appointmentDate, item.status, item.appointmentId);
                        const canCancel = canCancelAppointment(item.appointmentDate, item.status, item.appointmentId);
                        
                        console.log(`📊 Item ${index + 1} Final Status:`, {
                            appointmentId: item.appointmentId,
                            inputStatus: item.status,
                            calculatedStatus: appointmentStatus,
                            canCancel: canCancel
                        });
                        
                        return (
                            <tr key={item.id} style={{ borderLeft: `4px solid ${index % 2 === 0 ? '#007bff' : '#28a745'}` }}>
                                <td className="py-3 align-middle">
                                    <span className="badge bg-primary rounded-pill">{index + 1}</span>
                                </td>
                                <td className="py-3 align-items-center">
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
                                            `${item.price.toLocaleString()} VNĐ` : 
                                            'N/A'
                                        }
                                    </span>
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
                                    <span className={`badge ${appointmentStatus.className} px-3 py-2`} style={{ fontSize: '0.75rem', fontWeight: '600' }}>
                                        <i className={`fas ${
                                            appointmentStatus.status === 'cancelled' ? 'fa-times-circle' :
                                            appointmentStatus.status === 'completed' ? 'fa-check-circle' :
                                            appointmentStatus.status === 'today' ? 'fa-clock' :
                                            'fa-calendar-plus'
                                        } me-1`}></i>
                                        {appointmentStatus.text}
                                    </span>
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
                                <td className="py-3 align-middle">
                                    {canCancel ? (
                                        <button
                                            type="button"
                                            className="btn btn-outline-danger btn-sm"
                                            onClick={() => handleShowCancelModal(item.appointmentId)}
                                            style={{
                                                fontSize: '0.75rem',
                                                padding: '6px 12px',
                                                borderRadius: '6px',
                                                fontWeight: '600'
                                            }}
                                        >
                                            <i className="fas fa-times me-1"></i>
                                            Hủy Lịch
                                        </button>
                                    ) : (
                                        <span className="text-muted small">
                                            <i className="fas fa-info-circle me-1"></i>
                                            {appointmentStatus.status === 'cancelled' ? 'Đã hủy' :
                                             appointmentStatus.status === 'completed' ? 'Đã hoàn thành' :
                                             'Không thể hủy'}
                                        </span>
                                    )}
                                    
                                    {/* Debug Test Button - Only show for first few items */}
                                    {index < 3 && (
                                        <div className="mt-1">
                                            <button
                                                type="button"
                                                className="btn btn-outline-info btn-sm"
                                                onClick={() => testFetchAppointmentStatus(item.appointmentId)}
                                                style={{
                                                    fontSize: '0.7rem',
                                                    padding: '4px 8px',
                                                    borderRadius: '4px'
                                                }}
                                            >
                                                <i className="fas fa-bug me-1"></i>
                                                Test API
                                            </button>
                                        </div>
                                    )}
                                </td>
                            </tr>
                        );
                    })}
                </tbody>
            </table>
            
            {/* Tổng kết thống kê */}
            <div className="bg-light p-3 border-top">
                <div className="row text-center">
                    <div className="col-md-3">
                        <div className="d-flex align-items-center justify-content-center">
                            <div className="bg-primary text-white rounded-circle d-flex align-items-center justify-content-center me-3" style={{ width: '40px', height: '40px' }}>
                                <i className="fas fa-list"></i>
                            </div>
                            <div>
                                <div className="fw-bold text-primary">{history.length}</div>
                                <small className="text-muted">Tổng lịch hẹn</small>
                            </div>
                        </div>
                    </div>
                    <div className="col-md-3">
                        <div className="d-flex align-items-center justify-content-center">
                            <div className="bg-success text-white rounded-circle d-flex align-items-center justify-content-center me-3" style={{ width: '40px', height: '40px' }}>
                                <i className="fas fa-coins"></i>
                            </div>
                            <div>
                                <div className="fw-bold text-success">
                                    {history.reduce((total, item) => total + (item.price || 0), 0).toLocaleString()} VNĐ
                                </div>
                                <small className="text-muted">Tổng chi tiêu</small>
                            </div>
                        </div>
                    </div>
                    <div className="col-md-3">
                        <div className="d-flex align-items-center justify-content-center">
                            <div className="bg-warning text-dark rounded-circle d-flex align-items-center justify-content-center me-3" style={{ width: '40px', height: '40px' }}>
                                <i className="fas fa-check-circle"></i>
                            </div>
                            <div>
                                <div className="fw-bold text-warning">
                                    {history.filter(item => {
                                        const status = getAppointmentStatus(item.appointmentDate, item.status, item.appointmentId);
                                        return status.status === 'completed';
                                    }).length}
                                </div>
                                <small className="text-muted">Đã hoàn thành</small>
                            </div>
                        </div>
                    </div>
                    <div className="col-md-3">
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
            <ToastContainer />
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
                                ? `Chào mừng trở lại, ${userInfo.fullName}! Đây là danh sách lịch sử dịch vụ và lịch hẹn của bạn.`
                                : 'Tra cứu lịch sử dịch vụ bằng số điện thoại (dành cho khách chưa đăng nhập).'}
                        </p>
                        {userInfo && (
                            <div className="alert alert-info" role="alert">
                                <i className="fas fa-info-circle me-2"></i>
                                <strong>Lưu ý:</strong> Bạn có thể hủy các lịch hẹn sắp tới bằng cách nhấn nút "Hủy Lịch" trong bảng bên dưới.
                                Lịch hẹn chỉ có thể hủy trước ngày hẹn hoặc trong ngày hẹn.
                            </div>
                        )}
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
                                            Dành cho khách  chưa đăng nhập(tra cứu bằng số điện thoại)
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
                                                    className={`form-control border-start-0 ${phoneError ? 'is-invalid' : ''}`}
                                                    placeholder="0987654321"
                                                    value={lookupIdentifier}
                                                    onChange={handlePhoneChange}
                                                    maxLength={15}
                                                    required
                                                    style={{ 
                                                        fontSize: '1.1rem',
                                                        borderLeft: 'none !important',
                                                        boxShadow: 'none'
                                                    }}
                                                />
                                            </div>
                                            
                                            {/* Phone validation error */}
                                            {phoneError && (
                                                <div className="alert alert-danger py-2 mb-3" role="alert">
                                                    <i className="fas fa-exclamation-triangle me-2"></i>
                                                    <small>{phoneError}</small>
                                                </div>
                                            )}
                                            
                                            <small className="form-text text-muted mb-4 d-block">
                                                <i className="fas fa-info-circle me-1"></i>
                                                Nhập số điện thoại khách vãng lai để tra cứu lịch sử dịch vụ
                                                <br/>
                                                <strong>Định dạng hợp lệ:</strong> 0987654321, 84987654321, 0231234567
                                            </small>

                                            <button 
                                                type="submit" 
                                                className="btn btn-lg w-100 py-3 mb-3" 
                                                disabled={isLoading || !lookupIdentifier.trim() || phoneError}
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
                                                        Khách chưa đăng nhập:
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

            {/* Cancel Appointment Modal */}
            {showCancelModal && (
                <div className="modal-overlay" style={{
                    position: 'fixed',
                    top: 0,
                    left: 0,
                    right: 0,
                    bottom: 0,
                    backgroundColor: 'rgba(0, 0, 0, 0.5)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    zIndex: 9999
                }}>
                    <div className="modal-content" style={{
                        backgroundColor: 'white',
                        borderRadius: '15px',
                        padding: '30px',
                        maxWidth: '500px',
                        width: '90%',
                        maxHeight: '80vh',
                        overflowY: 'auto',
                        boxShadow: '0 10px 30px rgba(0, 0, 0, 0.3)'
                    }}>
                        <div className="modal-header text-center mb-4">
                            <h4 className="text-danger mb-2">
                                <i className="fas fa-exclamation-triangle me-2"></i>
                                Hủy Đặt Lịch Hẹn
                            </h4>
                            <p className="text-muted mb-0">Vui lòng cho chúng tôi biết lý do hủy đặt lịch</p>
                        </div>

                        <div className="modal-body">
                            <div className="mb-3">
                                <label className="form-label fw-bold">Lý do hủy đặt lịch *</label>
                                <textarea
                                    value={cancelReason}
                                    onChange={(e) => setCancelReason(e.target.value)}
                                    className="form-control"
                                    rows={4}
                                    placeholder="Vui lòng nhập lý do hủy đặt lịch (tối đa 500 ký tự)..."
                                    maxLength={500}
                                    style={{
                                        resize: 'vertical',
                                        fontSize: '0.95rem'
                                    }}
                                />
                                <div className="d-flex justify-content-between mt-1">
                                    <small className="text-muted">* Bắt buộc</small>
                                    <small className={`${cancelReason.length > 450 ? 'text-warning' : 'text-muted'}`}>
                                        {cancelReason.length}/500 ký tự
                                    </small>
                                </div>
                            </div>

                            {/* Quick reason buttons */}
                            <div className="mb-3">
                                <label className="form-label fw-bold">Lý do thường gặp:</label>
                                <div className="d-flex flex-wrap gap-2">
                                    {[
                                        'Thay đổi lịch trình',
                                        'Vấn đề sức khỏe',
                                        'Có việc đột xuất',
                                        'Thay đổi ý định',
                                        'Không phù hợp thời gian',
                                        'Lý do tài chính'
                                    ].map((reason, index) => (
                                        <button
                                            key={index}
                                            type="button"
                                            className="btn btn-sm btn-outline-secondary"
                                            onClick={(e) => {
                                                e.preventDefault();
                                                e.stopPropagation();
                                                setCancelReason(reason);
                                            }}
                                            style={{
                                                borderRadius: '15px',
                                                fontSize: '0.8rem'
                                            }}
                                        >
                                            {reason}
                                        </button>
                                    ))}
                                </div>
                            </div>

                            {/* Warning notice */}
                            <div className="alert alert-warning" role="alert">
                                <div className="d-flex">
                                    <i className="fas fa-exclamation-triangle me-3 mt-1"></i>
                                    <div>
                                        <strong>Lưu ý quan trọng:</strong>
                                        <ul className="mb-0 mt-2 small">
                                            <li>Việc hủy lịch hẹn sẽ không thể hoàn tác</li>
                                            <li>Vui lòng liên hệ spa để đặt lại lịch mới nếu cần</li>
                                            <li>Chính sách hủy lịch có thể áp dụng theo quy định của spa</li>
                                        </ul>
                                    </div>
                                </div>
                            </div>
                        </div>

                        <div className="modal-footer d-flex justify-content-center gap-3">
                            <button
                                type="button"
                                onClick={(e) => {
                                    e.preventDefault();
                                    e.stopPropagation();
                                    handleCloseCancelModal();
                                }}
                                className="btn btn-secondary"
                                style={{
                                    borderRadius: '20px',
                                    padding: '10px 25px',
                                    fontWeight: '600'
                                }}
                                disabled={isSubmittingCancel}
                            >
                                <i className="fas fa-arrow-left me-2"></i>
                                Quay lại
                            </button>
                            <button
                                type="button"
                                onClick={(e) => {
                                    e.preventDefault();
                                    e.stopPropagation();
                                    handleCancelAppointment();
                                }}
                                className="btn btn-danger"
                                style={{
                                    borderRadius: '20px',
                                    padding: '10px 25px',
                                    fontWeight: '600'
                                }}
                                disabled={isSubmittingCancel || !cancelReason.trim()}
                            >
                                {isSubmittingCancel ? (
                                    <>
                                        <i className="fas fa-spinner fa-spin me-2"></i>
                                        Đang hủy...
                                    </>
                                ) : (
                                    <>
                                        <i className="fas fa-check me-2"></i>
                                        Xác nhận hủy
                                    </>
                                )}
                            </button>
                        </div>
                    </div>
                </div>
            )}

            <Footer />
        </div>
    );
};

export default ServiceHistoryPage;