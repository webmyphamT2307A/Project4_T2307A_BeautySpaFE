import React, { useState, useEffect, useMemo } from "react";
import axios from 'axios';
import { ToastContainer, toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

const Appointment = () => {
    const [formData, setFormData] = useState({
        fullName: '',
        phoneNumber: '',
        appointmentDate: '',
        serviceId: '',
        notes: '',
        customerId: '',
        userId: '',
        branchId: '',
        timeSlotId: '',
        slot: '',
        price: '',
        status: 'pending',
    });
    const [services, setServices] = useState([]);
    const [timeSlots, setTimeSlots] = useState([]);
    const [slotInfo, setSlotInfo] = useState(null);
    const [staffList, setStaffList] = useState([]);
    // State quản lý lịch rảnh của TẤT CẢ nhân viên
    const [staffAvailabilities, setStaffAvailabilities] = useState({}); // { staffId: { isAvailable, message } }
    const [isCheckingAvailabilities, setIsCheckingAvailabilities] = useState(false);
    const [staffSearchTerm, setStaffSearchTerm] = useState('');
    const [selectedStaffId, setSelectedStaffId] = useState(null); // To track visually selected staff

    // Validation states và patterns
    const [validationErrors, setValidationErrors] = useState({});
    const phoneRegex = /^\d{1,10}$/; // Tối đa 10 số

    // Fetch services
    useEffect(() => {
        axios.get('http://localhost:8080/api/v1/services')
            .then(res => {
                setServices(Array.isArray(res.data) ? res.data : res.data.data || []);
            })
            .catch(() => setServices([]));
    }, []);

    // Fetch staff list and shuffle it
    useEffect(() => {
        axios.get('http://localhost:8080/api/v1/user/accounts/staff')
            .then(res => {
                const rawStaffList = Array.isArray(res.data) ? res.data : (res.data.data || []);

                const processedStaff = rawStaffList.map(staff => ({
                    ...staff,
                    isActiveResolved: staff.isActive === true || staff.isActive === 1 || String(staff.isActive).toLowerCase() === 'true'
                }));

                const activeStaff = processedStaff.filter(staff => staff.isActiveResolved === true);
                const shuffledStaff = [...activeStaff].sort(() => 0.5 - Math.random());

                setStaffList(shuffledStaff);
            })
            .catch((error) => {
                console.error("Error fetching staff list:", error);
                setStaffList([]);
                toast.error("Không thể tải danh sách nhân viên.");
            });
    }, []);

    // Fetch time slots
    useEffect(() => {
        axios.get('http://localhost:8080/api/v1/timeslot')
            .then(res => setTimeSlots(Array.isArray(res.data) ? res.data : res.data.data || []))
            .catch(() => setTimeSlots([]));
    }, []);

    // Fetch available slots
    useEffect(() => {
        if (formData.appointmentDate && formData.serviceId && formData.timeSlotId) {
            const appointmentDates = formData.appointmentDate;
            axios.get('http://localhost:8080/api/v1/timeslot/available', {
                params: {
                    date: appointmentDates,
                    serviceId: formData.serviceId,
                    timeSlotId: formData.timeSlotId
                }
            })
                .then(res => {
                    if (res.data.data && res.data.data.availableSlot !== undefined) {
                        setSlotInfo(res.data.data);
                    } else if (res.data.availableSlot !== undefined) {
                        setSlotInfo(res.data);
                    } else {
                        setSlotInfo(null);
                    }
                })
                .catch(() => setSlotInfo(null));
        } else {
            setSlotInfo(null);
        }
    }, [formData.appointmentDate, formData.serviceId, formData.timeSlotId]);

    // Kiểm tra lịch rảnh cho TẤT CẢ nhân viên khi thông tin thay đổi
    useEffect(() => {
        const checkAllStaffAvailability = async () => {
            if (!formData.appointmentDate || !formData.timeSlotId || !formData.serviceId || staffList.length === 0) {
                setStaffAvailabilities({});
                return;
            }

            setIsCheckingAvailabilities(true);
            setStaffAvailabilities({});

            const selectedTimeSlot = timeSlots.find(ts => String(ts.slotId) === formData.timeSlotId);
            if (!selectedTimeSlot) {
                setIsCheckingAvailabilities(false);
                return;
            }

            const [slotHours, slotMinutes] = selectedTimeSlot.startTime.split(':').map(Number);
            const [year, month, day] = formData.appointmentDate.split('-').map(Number);
            const localDateTimeForSlot = new Date(year, month - 1, day, slotHours, slotMinutes);
            const requestedDateTimeISO = localDateTimeForSlot.toISOString();

            const availabilityChecks = staffList.map(staff => {
                return axios.get('http://localhost:8080/api/v1/booking/staff-availability', {
                    params: {
                        userId: staff.id,
                        requestedDateTime: requestedDateTimeISO,
                        durationMinutes: 60 // Cần thay đổi nếu dịch vụ có thời gian khác nhau
                    }
                }).then(res => ({
                    staffId: staff.id,
                    isAvailable: res.data?.data?.isAvailable || false,
                    message: res.data?.data?.availabilityMessage || 'Không xác định'
                })).catch(() => ({
                    staffId: staff.id,
                    isAvailable: false,
                    message: 'Lỗi kiểm tra'
                }));
            });

            const results = await Promise.all(availabilityChecks);

            const newAvailabilities = results.reduce((acc, result) => {
                acc[result.staffId] = { isAvailable: result.isAvailable, message: result.message };
                return acc;
            }, {});

            setStaffAvailabilities(newAvailabilities);
            setIsCheckingAvailabilities(false);
        };

        checkAllStaffAvailability();
    }, [formData.appointmentDate, formData.timeSlotId, formData.serviceId, staffList, timeSlots]);


    // Validation functions
    const validateField = (name, value) => {
        let error = '';
        
        switch (name) {
            case 'fullName':
                if (!value.trim()) {
                    error = 'Họ tên không được để trống';
                }
                break;
            case 'phoneNumber':
                if (!value.trim()) {
                    error = 'Số điện thoại không được để trống';
                } else if (!phoneRegex.test(value)) {
                    error = 'Số điện thoại chỉ được chứa số và tối đa 10 chữ số';
                } else if (value.length > 10) {
                    error = 'Số điện thoại không được quá 10 chữ số';
                }
                break;
            case 'notes':
                if (value && value.length > 500) {
                    error = 'Ghi chú không được vượt quá 500 ký tự';
                }
                break;
            default:
                break;
        }
        
        setValidationErrors(prev => ({
            ...prev,
            [name]: error
        }));
        
        return error === '';
    };

    const handleInputChange = (e) => {
        const { name, value } = e.target;
        
        validateField(name, value);
        
        setFormData(prev => ({
            ...prev,
            [name]: value
        }));
    };

    const handleStaffSelect = (staffId) => {
        const isBusy = staffAvailabilities[staffId]?.isAvailable === false;
        if (selectedStaffId === staffId || isBusy) return;

        setFormData((prev) => ({ ...prev, userId: staffId }));
        setSelectedStaffId(staffId);
    };

    const handleUseAccountInfo = () => {
        const storedUserInfo = JSON.parse(localStorage.getItem('userInfo'));
        if (storedUserInfo) {
            setFormData((prev) => ({
                ...prev,
                fullName: storedUserInfo.fullName || '',
                phoneNumber: storedUserInfo.phone || '',
                customerId: storedUserInfo.id,
            }));
        } else {
            toast.error('Không có thông tin tài khoản!');
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();

        if (formData.userId && staffAvailabilities[formData.userId]?.isAvailable === false) {
            toast.error("Nhân viên bạn chọn đã bận vào khung giờ này. Vui lòng chọn nhân viên khác.");
            return;
        }

        let formattedDate = formData.appointmentDate;
        if (formattedDate && formattedDate.includes('-')) {
            const [year, month, day] = formattedDate.split('-');
            formattedDate = `${day}/${month}/${year}`;
        }

        let customerIdToSubmit = formData.customerId;

        if (!customerIdToSubmit && (formData.fullName && formData.phoneNumber)) {
            try {
                const res = await axios.post('http://localhost:8080/api/v1/customer/guest-create', {
                    fullName: formData.fullName,
                    phone: formData.phoneNumber,
                });
                customerIdToSubmit = res.data.id;
            } catch (err) {
                toast.error(err.response?.data?.message || 'Không thể tạo khách hàng tạm!');
                return;
            }
        }

        const submitData = {
            ...formData,
            customerId: customerIdToSubmit,
            status: formData.status || 'pending',
            appointmentDate: formattedDate,
            branchId: formData.branchId || 1,
            timeSlotId: formData.timeSlotId,
            price: formData.price,
            slot: formData.slot || "1",
        };

        if (!submitData.userId) {
            delete submitData.userId;
        }


        if (!submitData.fullName || !submitData.phoneNumber || !submitData.appointmentDate || !submitData.serviceId || !submitData.timeSlotId) {
            toast.error('Vui lòng điền đầy đủ các trường bắt buộc: Họ tên, SĐT, Dịch vụ, Ngày hẹn, Khung giờ.');
            return;
        }

        try {
            await axios.post('http://localhost:8080/api/v1/admin/appointment/create', submitData);
            toast.success('Đặt lịch thành công!');
            setFormData(prev => ({
                ...prev,
                appointmentDate: '',
                serviceId: '',
                timeSlotId: '',
                notes: '',
                userId: '',
                price: '',
            }));
            setSelectedStaffId(null);
            setSlotInfo(null);
            setStaffAvailabilities({});

        } catch (error) {
            if (error.response) {
                toast.error('Đặt lịch thất bại! Lỗi: ' + (error.response.data.message || error.response.data));
            } else {
                toast.error('Đặt lịch thất bại! Vui lòng thử lại.');
            }
        }
    };

    // --- THAY ĐỔI: CẢI THIỆN LOGIC LỌC VÀ SẮP XẾP NHÂN VIÊN ---
    const filteredStaffList = useMemo(() => {
        try {
            let filtered = staffList || [];

            // Lọc theo từ khóa tìm kiếm
            if (staffSearchTerm?.trim()) {
                filtered = filtered.filter(staff =>
                    staff?.fullName?.toLowerCase().includes(staffSearchTerm.toLowerCase())
                );
            }

            // Sắp xếp lại: nhân viên rảnh lên đầu, bận xuống cuối
            // Chỉ sắp xếp khi có dữ liệu lịch rảnh
            if (Object.keys(staffAvailabilities).length > 0) {
                filtered.sort((a, b) => {
                    const aIsAvailable = staffAvailabilities[a.id]?.isAvailable === true;
                    const bIsAvailable = staffAvailabilities[b.id]?.isAvailable === true;
                    return bIsAvailable - aIsAvailable; // true (1) - false (0) -> b lên trước a
                });
            }
            
            return filtered;
        } catch (error) {
            console.error('Error in filteredStaffList:', error);
            return [];
        }
    }, [staffList, staffSearchTerm, staffAvailabilities]); // Thêm staffAvailabilities vào dependencies

    const renderStars = (rating) => {
        const totalStars = 5;
        const filledStars = Math.round(rating || 0);
        return Array(totalStars).fill(0).map((_, index) => (
            <span key={index} style={{ color: index < filledStars ? '#ffc107' : '#e4e5e9', fontSize: '1em' }}>
                &#9733;
            </span>
        ));
    };

    // --- BẮT ĐẦU PHẦN GIAO DIỆN (JSX) ---
    return (
        <div className="container-fluid appointment py-5">
            <ToastContainer />
            <div className="container py-5">
                <div className="row g-5 justify-content-center">
                    <div className="col-lg-10 col-12">
                        <div
                            className="appointment-form p-3 p-lg-4 position-relative overflow-hidden"
                            style={{
                                height: 'auto',
                                minHeight: '600px',
                                maxWidth: '100%'
                            }}
                        >
                            <p className="fs-4 text-uppercase text-primary">Get In Touch</p>
                            <h1 className="display-5 display-lg-4 mb-3 text-white">Get Appointment</h1>
                            <form onSubmit={handleSubmit}>
                                <div className="row gy-2 gx-2 gx-lg-3">
                                    {/* Customer Info Inputs */}
                                    <div className="col-12 col-lg-6">
                                        <input
                                            type="text"
                                            name="fullName"
                                            value={formData.fullName}
                                            onChange={handleInputChange}
                                            className={`form-control py-2 border-white bg-transparent text-white custom-placeholder text-truncate ${validationErrors.fullName ? 'border-danger' : ''}`}
                                            placeholder="Full Name"
                                            style={{
                                                color: 'white',
                                                maxWidth: '100%',
                                                height: '45px'
                                            }}
                                        />
                                        {validationErrors.fullName && (
                                            <small className="text-danger mt-1 d-block">{validationErrors.fullName}</small>
                                        )}
                                    </div>
                                    <div className="col-12 col-lg-6">
                                        <input
                                            type="text"
                                            name="phoneNumber"
                                            value={formData.phoneNumber}
                                            onChange={handleInputChange}
                                            className={`form-control py-2 border-white bg-transparent text-white custom-placeholder text-truncate ${validationErrors.phoneNumber ? 'border-danger' : ''}`}
                                            placeholder="Phone Number (Max 10 digits)"
                                            maxLength="10"
                                            style={{
                                                color: 'white',
                                                maxWidth: '100%',
                                                height: '45px'
                                            }}
                                        />
                                        {validationErrors.phoneNumber && (
                                            <small className="text-danger mt-1 d-block">{validationErrors.phoneNumber}</small>
                                        )}
                                    </div>

                                    {/* Service, Date, TimeSlot Selectors */}
                                    <div className="col-12 col-lg-6">
                                        <select
                                            name="serviceId"
                                            value={formData.serviceId}
                                            onChange={handleInputChange}
                                            className="form-select py-2 border-white bg-transparent text-white-option text-truncate"
                                            style={{
                                                maxWidth: '100%',
                                                height: '45px'
                                            }}
                                        >
                                            <option value="" style={{ color: 'black' }}>Select Service</option>
                                            {services.map(service => (
                                                <option key={service.id} value={service.id} style={{ color: 'black' }}>
                                                    {service.name} - {service.price}$
                                                </option>
                                            ))}
                                        </select>
                                    </div>
                                    <div className="col-12 col-lg-6">
                                        <input
                                            type="date"
                                            name="appointmentDate"
                                            value={formData.appointmentDate}
                                            onChange={handleInputChange}
                                            className="form-control py-2 border-white bg-transparent text-white custom-date-picker"
                                            min={new Date().toISOString().split("T")[0]}
                                            style={{
                                                maxWidth: '100%',
                                                height: '45px'
                                            }}
                                        />
                                    </div>
                                    <div className="col-12">
                                        <select
                                            name="timeSlotId"
                                            value={formData.timeSlotId}
                                            onChange={handleInputChange}
                                            className="form-select py-2 border-white bg-transparent text-white-option w-100 text-truncate"
                                            disabled={!formData.serviceId || !formData.appointmentDate}
                                            style={{
                                                maxWidth: '100%',
                                                height: '45px'
                                            }}
                                        >
                                            <option value="" style={{ color: 'black' }}>Chọn khung giờ</option>
                                            {timeSlots.map(slot => {
                                                const slotDateTimeStr = `${formData.appointmentDate}T${slot.endTime}:00`;
                                                const slotEnd = new Date(slotDateTimeStr);
                                                const now = new Date();
                                                const isPast = formData.appointmentDate && slot.endTime ? slotEnd < now : false;

                                                return (
                                                    <option
                                                        key={slot.slotId}
                                                        value={slot.slotId}
                                                        disabled={isPast}
                                                        style={{ color: isPast ? '#aaa' : 'black', backgroundColor: 'white' }}
                                                    >
                                                        {slot.startTime} - {slot.endTime} {isPast ? '(Đã qua)' : ''}
                                                    </option>
                                                );
                                            })}
                                        </select>
                                    </div>

                                    {/* Available Slot Info */}
                                    {slotInfo && (
                                        <div className="col-12">
                                            <div className="d-flex align-items-center flex-wrap" style={{ gap: '8px' }}>
                                                <span className="text-white text-truncate" style={{ fontSize: '0.75rem' }}>
                                                    <b>Còn lại:</b>
                                                    <span className={`badge ms-1 ${slotInfo.availableSlot > 3 ? 'bg-success' : slotInfo.availableSlot > 0 ? 'bg-warning text-dark' : 'bg-danger'}`}>
                                                        {slotInfo.availableSlot}/{slotInfo.totalSlot} slot
                                                    </span>
                                                </span>
                                                <div className="flex-grow-1" style={{ minWidth: '60px', maxWidth: '150px' }}>
                                                    <div className="progress" style={{ height: 6, backgroundColor: 'rgba(255,255,255,0.2)' }}>
                                                        <div
                                                            className={`progress-bar ${slotInfo.availableSlot === 0 ? 'bg-danger' : slotInfo.availableSlot <= 3 ? 'bg-warning' : 'bg-success'}`}
                                                            role="progressbar"
                                                            style={{ width: `${(slotInfo.availableSlot / slotInfo.totalSlot) * 100}%` }}
                                                            aria-valuenow={slotInfo.availableSlot}
                                                            aria-valuemin="0"
                                                            aria-valuemax={slotInfo.totalSlot}
                                                        />
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    )}

                                    {/* Staff Section Header */}
                                    <div className="col-12 mb-3">
                                        <div className="d-flex align-items-center justify-content-between flex-wrap mb-3">
                                            <h5 className="text-white-50 mb-0" style={{ 
                                                fontSize: '0.85rem', 
                                                fontWeight: '400',
                                                letterSpacing: '1px',
                                                textTransform: 'uppercase'
                                            }}>
                                            </h5>
                                            <div className="d-flex align-items-center" style={{ gap: '15px' }}>
                                                <div style={{ position: 'relative' }}>
                                                    <div className="position-absolute top-50 start-0 translate-middle-y ms-2" style={{ zIndex: 10 }}>
                                                        <i className="fas fa-search text-white-50" style={{ fontSize: '0.8rem' }}></i>
                                                    </div>
                                                    <input
                                                        type="text"
                                                        className="form-control py-2 bg-transparent text-white custom-placeholder"
                                                        placeholder="Search"
                                                        value={staffSearchTerm}
                                                        onChange={(e) => setStaffSearchTerm(e.target.value)}
                                                        style={{
                                                            color: 'white',
                                                            width: '150px',
                                                            height: '35px',
                                                            fontSize: '0.8rem',
                                                            border: '1px solid rgba(255,255,255,0.3)',
                                                            borderRadius: '5px',
                                                            paddingLeft: '30px'
                                                        }}
                                                    />
                                                </div>
                                                <button 
                                                    type="button"
                                                    className="btn btn-outline-light btn-sm"
                                                    style={{ 
                                                        fontSize: '0.75rem',
                                                        height: '35px',
                                                        padding: '5px 15px'
                                                    }}
                                                    onClick={() => setStaffSearchTerm('')}
                                                >
                                                    Reset
                                                </button>
                                            </div>
                                        </div>
                                        
                                        {isCheckingAvailabilities && (
                                            <div className="text-center py-2">
                                                <small className="text-info">
                                                    <i className="fas fa-spinner fa-spin me-2"></i>
                                                    Đang kiểm tra lịch rảnh của nhân viên...
                                                </small>
                                            </div>
                                        )}
                                    </div>

                                    {/* Staff Grid */}
                                    <div className="col-12">
                                        <div className="staff-directory-grid">
                                            {filteredStaffList.length === 0 ? (
                                                <div className="col-12 text-center py-5">
                                                    <div className="text-center">
                                                        <i className="fas fa-search text-white-50 mb-3" style={{ fontSize: '2rem' }}></i>
                                                        <p className="text-white-50" style={{ fontSize: '1rem' }}>
                                                            {staffSearchTerm ? 'No employees found' : 'No employees available'}
                                                        </p>
                                                    </div>
                                                </div>
                                            ) : (
                                                <div className="row g-3">
                                                    {filteredStaffList.map(staff => {
                                                        const isSelected = selectedStaffId === staff.id;
                                                        const isBusy = staffAvailabilities[staff.id]?.isAvailable === false;

                                                        return (
                                                            <div key={staff.id} className="col-12 col-sm-6 col-md-4 col-lg-3">
                                                                <div
                                                                    className={`employee-card h-100 p-3 border rounded-3 position-relative ${
                                                                        isSelected ? 'border-primary selected-card' : 
                                                                        isBusy ? 'border-danger busy-card' : 'border-light'
                                                                    }`}
                                                                    style={{
                                                                        backgroundColor: isBusy ? 'rgba(220, 53, 69, 0.1)' : 
                                                                                       isSelected ? 'rgba(13, 110, 253, 0.1)' : 
                                                                                       'rgba(255,255,255,0.05)',
                                                                        cursor: isBusy ? 'not-allowed' : 'pointer',
                                                                        transition: 'all 0.3s ease-in-out',
                                                                        opacity: isBusy ? 0.6 : 1,
                                                                        minHeight: '220px'
                                                                    }}
                                                                    onClick={() => !isBusy && handleStaffSelect(staff.id)}
                                                                >
                                                                    {/* Status Badge */}
                                                                    <div className="position-absolute top-0 end-0 m-2">
                                                                        {isBusy ? (
                                                                            <span className="badge bg-danger" style={{ fontSize: '0.65rem' }}>
                                                                                <i className="fas fa-times me-1"></i>Busy
                                                                            </span>
                                                                        ) : isSelected ? (
                                                                            <span className="badge bg-primary" style={{ fontSize: '0.65rem' }}>
                                                                                <i className="fas fa-check me-1"></i>Selected
                                                                            </span>
                                                                        ) : (
                                                                            <span className="badge bg-success" style={{ fontSize: '0.65rem' }}>
                                                                                <i className="fas fa-circle me-1"></i>Available
                                                                            </span>
                                                                        )}
                                                                    </div>

                                                                    {/* Employee Info */}
                                                                    <div className="text-center">
                                                                        <img
                                                                            src={staff.imageUrl || '/default-avatar.png'}
                                                                            alt={staff.fullName}
                                                                            className="rounded-circle border border-white mb-3"
                                                                            style={{
                                                                                width: '70px',
                                                                                height: '70px',
                                                                                objectFit: 'cover',
                                                                                borderWidth: '2px !important'
                                                                            }}
                                                                        />
                                                                        
                                                                        <h6 className="text-white mb-1" style={{ 
                                                                            fontSize: '0.95rem', 
                                                                            fontWeight: '600',
                                                                            minHeight: '22px'
                                                                        }}>
                                                                            {staff.fullName}
                                                                        </h6>
                                                                        
                                                                        <p className="text-white-50 mb-1" style={{ 
                                                                            fontSize: '0.75rem',
                                                                            minHeight: '18px'
                                                                        }}>
                                                                            {staff.skillsText || 'Spa Specialist'}
                                                                        </p>
                                                                        
                                                                        <p className="text-white-50 mb-3" style={{ 
                                                                            fontSize: '0.7rem',
                                                                            minHeight: '16px'
                                                                        }}>
                                                                        </p>

                                                                        {/* Rating */}
                                                                        <div className="d-flex align-items-center justify-content-center mb-3">
                                                                            <div className="me-2">
                                                                                {renderStars(staff.averageRating)}
                                                                            </div>
                                                                            <span className="text-white-50" style={{ fontSize: '0.65rem' }}>
                                                                                ({staff.totalReviews || 0})
                                                                            </span>
                                                                        </div>

                                                                        {/* Select Button */}
                                                                        <button
                                                                            type="button"
                                                                            className={`btn btn-sm w-100 ${
                                                                                isBusy ? 'btn-outline-danger' : 
                                                                                isSelected ? 'btn-primary' : 'btn-outline-light'
                                                                            }`}
                                                                            style={{ fontSize: '0.75rem', padding: '6px 12px' }}
                                                                            disabled={isBusy}
                                                                        >
                                                                            {isBusy ? (
                                                                                <><i className="fas fa-ban me-1"></i>Unavailable</>
                                                                            ) : isSelected ? (
                                                                                <><i className="fas fa-check me-1"></i>Selected</>
                                                                            ) : (
                                                                                <><i className="fas fa-hand-pointer me-1"></i>Select</>
                                                                            )}
                                                                        </button>
                                                                    </div>
                                                                </div>
                                                            </div>
                                                        );
                                                    })}
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                    
                                    {/* Notes */}
                                    <div className="col-12">
                                        <div className="position-relative">
                                            <textarea
                                                name="notes"
                                                value={formData.notes}
                                                onChange={handleInputChange}
                                                className={`form-control border-white bg-transparent text-white custom-placeholder ${validationErrors.notes ? 'border-danger' : ''}`}
                                                rows="3"
                                                placeholder="Write Comments (Tối đa 500 ký tự)"
                                                maxLength="500"
                                                style={{
                                                    color: 'white',
                                                    resize: 'none',
                                                    height: '70px',
                                                    maxWidth: '100%',
                                                    fontSize: '0.8rem'
                                                }}
                                            />
                                            <div className="d-flex justify-content-between align-items-center mt-1">
                                                {validationErrors.notes && (
                                                    <small className="text-danger">{validationErrors.notes}</small>
                                                )}
                                                <small className={`text-white-50 ms-auto ${formData.notes?.length > 450 ? 'text-warning' : ''} ${formData.notes?.length >= 500 ? 'text-danger' : ''}`} style={{ fontSize: '0.7rem' }}>
                                                    {formData.notes?.length || 0}/500
                                                </small>
                                            </div>
                                        </div>
                                    </div>

                                    {/* Submit Buttons */}
                                    <div className="col-12 col-lg-6">
                                        <button
                                            type="button"
                                            onClick={handleUseAccountInfo}
                                            className="btn btn-outline-light w-100"
                                            style={{ height: '40px', fontSize: '0.8rem' }}
                                        >
                                            Dùng thông tin tài khoản
                                        </button>
                                    </div>
                                    <div className="col-12 col-lg-6">
                                        <button
                                            type="submit"
                                            className="btn btn-primary w-100"
                                            style={{ height: '40px', fontSize: '0.8rem' }}
                                        >
                                            Submit Now
                                        </button>
                                    </div>
                                </div>
                            </form>
                        </div>
                    </div>
                </div>
            </div>

            {/* Global CSS */}
            <style jsx global>{`
              /* Responsive and custom styles */
              @media (max-width: 767.98px) {
                .appointment-form {
                  height: auto !important;
                  min-height: 600px !important;
                  padding: 1rem !important;
                }
                .display-4 {
                  font-size: 2rem !important;
                }
              }
              
              .text-white-option { color: white !important; }
              .text-white-option option { color: black !important; background-color: white !important; }
              .text-white-option option:disabled { color: #999 !important; }
              
              .form-control.custom-placeholder::placeholder { color: #ccc; opacity: 1; }
              .form-control.custom-placeholder:-ms-input-placeholder { color: #ccc; }
              .form-control.custom-placeholder::-ms-input-placeholder { color: #ccc; }
              
              .custom-date-picker::-webkit-calendar-picker-indicator { filter: invert(1); }
              
              /* Employee Directory Card Styles */
              .employee-card {
                transition: all 0.3s ease-in-out;
                border: 1px solid rgba(255,255,255,0.2) !important;
                background: rgba(255,255,255,0.05) !important;
                backdrop-filter: blur(10px);
              }
              
              .employee-card:hover {
                transform: translateY(-5px);
                box-shadow: 0 8px 25px rgba(0,0,0,0.3) !important;
                border-color: rgba(255,255,255,0.4) !important;
                background: rgba(255,255,255,0.1) !important;
              }

              .employee-card.selected-card {
                border-color: #0d6efd !important;
                background: rgba(13, 110, 253, 0.15) !important;
                box-shadow: 0 0 20px rgba(13, 110, 253, 0.3) !important;
              }

              .employee-card.busy-card {
                border-color: #dc3545 !important;
                background: rgba(220, 53, 69, 0.1) !important;
                opacity: 0.6;
              }

              /* Staff Directory Grid */
              .staff-directory-grid {
                max-height: 400px;
                overflow-y: auto;
                padding: 10px;
                border-radius: 10px;
                background: rgba(0,0,0,0.1);
              }

              .staff-directory-grid::-webkit-scrollbar {
                width: 6px;
              }

              .staff-directory-grid::-webkit-scrollbar-track {
                background: rgba(255,255,255,0.1);
                border-radius: 3px;
              }

              .staff-directory-grid::-webkit-scrollbar-thumb {
                background: rgba(255,255,255,0.3);
                border-radius: 3px;
              }

              .staff-directory-grid::-webkit-scrollbar-thumb:hover {
                background: rgba(255,255,255,0.5);
              }
            `}</style>
        </div>
    );
};

export default Appointment;