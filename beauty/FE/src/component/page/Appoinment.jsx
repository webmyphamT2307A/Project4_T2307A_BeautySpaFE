import React, { useState, useEffect, useMemo } from "react";
import axios from 'axios';
import { ToastContainer, toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

const Appointment = () => {
    // Step management
    const [currentStep, setCurrentStep] = useState(1);
    const totalSteps = 4;
    
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
    
        if (name === 'serviceId') {
            // --- BẮT ĐẦU THÊM VÀO ĐÂY ---
            console.log("1. Đã chọn Service ID:", value); 
            const selectedService = services.find(s => String(s.id) === value);
            console.log("2. Dịch vụ tìm thấy:", selectedService); // In ra để xem có tìm thấy không
            // --- KẾT THÚC THÊM VÀO ĐÂY ---
            
            setFormData(prev => ({
                ...prev,
                serviceId: value,
                price: selectedService ? selectedService.price : ''
            }));
        } else {
            setFormData(prev => ({
                ...prev,
                [name]: value
            }));
        }
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
            setCurrentStep(1); // Reset về step đầu tiên

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

    // Step validation
    const canProceedToStep = (step) => {
        switch (step) {
            case 2:
                return formData.serviceId !== '' && formData.appointmentDate !== '' && formData.timeSlotId !== '';
            case 3:
                return formData.serviceId !== '' && formData.appointmentDate !== '' && formData.timeSlotId !== '' && formData.userId !== '';
            case 4:
                return formData.serviceId !== '' && formData.appointmentDate !== '' && formData.timeSlotId !== '' && formData.userId !== '' && formData.fullName !== '' && formData.phoneNumber !== '';
            default:
                return true;
        }
    };

    const handleNextStep = () => {
        if (canProceedToStep(currentStep + 1)) {
            setCurrentStep(prev => Math.min(prev + 1, totalSteps));
        } else {
            toast.error('Vui lòng hoàn thành thông tin bước hiện tại!');
        }
    };

    const handlePrevStep = () => {
        setCurrentStep(prev => Math.max(prev - 1, 1));
    };

    // Step content rendering
    const renderStepContent = () => {
        switch (currentStep) {
            case 1:
                return renderServiceAndDateTime();
            case 2:
                return renderStaffSelection();
            case 3:
                return renderCustomerInfo();
            case 4:
                return renderConfirmation();
            default:
                return null;
        }
    };

    const renderServiceAndDateTime = () => (
        <div className="step-content">
            <div className="text-center mb-4">
                <h4 className="text-white mb-2">
                    <i className="fas fa-spa me-2 text-primary"></i>
                    Chọn Dịch Vụ & Thời Gian
                </h4>
                <p className="text-white-50">Lựa chọn dịch vụ và thời gian phù hợp với bạn</p>
            </div>
            
            <div className="row g-3">
                <div className="col-12 col-lg-6">
                    <label className="form-label text-white fw-bold">
                        <i className="fas fa-list me-2"></i>Chọn Dịch Vụ *
                    </label>
                    <select
                        name="serviceId"
                        value={formData.serviceId}
                        onChange={handleInputChange}
                        className="form-select py-2 border-white bg-transparent text-white-option"
                        style={{ height: '45px' }}
                    >
                        <option value="" style={{ color: 'black' }}>Chọn dịch vụ</option>
                        {services.map(service => (
                            <option key={service.id} value={service.id} style={{ color: 'black' }}>
                                {service.name} - {service.price}$
                            </option>
                        ))}
                    </select>
                </div>

                <div className="col-12 col-lg-6">
                    <label className="form-label text-white fw-bold">
                        <i className="fas fa-calendar me-2"></i>Chọn Ngày *
                    </label>
                    <input
                        type="date"
                        name="appointmentDate"
                        value={formData.appointmentDate}
                        onChange={handleInputChange}
                        className="form-control py-2 border-white bg-transparent text-white custom-date-picker"
                        min={new Date().toISOString().split("T")[0]}
                        style={{ height: '45px' }}
                    />
                </div>

                <div className="col-12">
                    <label className="form-label text-white fw-bold">
                        <i className="fas fa-clock me-2"></i>Chọn Khung Giờ *
                    </label>
                    <select
                        name="timeSlotId"
                        value={formData.timeSlotId}
                        onChange={handleInputChange}
                        className="form-select py-2 border-white bg-transparent text-white-option"
                        disabled={!formData.serviceId || !formData.appointmentDate}
                        style={{ height: '45px' }}
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

                {slotInfo && (
                    <div className="col-12">
                        <div className="alert alert-info bg-transparent border-info text-white">
                            <div className="d-flex align-items-center justify-content-between flex-wrap">
                                <span>
                                    <i className="fas fa-info-circle me-2"></i>
                                    <strong>Còn lại:</strong>
                                    <span className={`badge ms-2 ${slotInfo.availableSlot > 3 ? 'bg-success' : slotInfo.availableSlot > 0 ? 'bg-warning text-dark' : 'bg-danger'}`}>
                                        {slotInfo.availableSlot}/{slotInfo.totalSlot} slot
                                    </span>
                                </span>
                                <div className="progress" style={{ width: '200px', height: '8px' }}>
                                    <div
                                        className={`progress-bar ${slotInfo.availableSlot === 0 ? 'bg-danger' : slotInfo.availableSlot <= 3 ? 'bg-warning' : 'bg-success'}`}
                                        style={{ width: `${(slotInfo.availableSlot / slotInfo.totalSlot) * 100}%` }}
                                    />
                                </div>
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );

    const renderStaffSelection = () => (
        <div className="step-content">
            <div className="text-center mb-4">
                <h4 className="text-white mb-2">
                    <i className="fas fa-user-tie me-2 text-primary"></i>
                    Chọn Nhân Viên
                </h4>
                <p className="text-white-50">Lựa chọn nhân viên phục vụ bạn</p>
            </div>

            <div className="row mb-3">
                <div className="col-12 col-md-6">
                    <div className="position-relative">
                        <div className="position-absolute top-50 start-0 translate-middle-y ms-2" style={{ zIndex: 10 }}>
                            <i className="fas fa-search text-white-50"></i>
                        </div>
                        <input
                            type="text"
                            className="form-control py-2 bg-transparent text-white custom-placeholder"
                            placeholder="Tìm kiếm nhân viên..."
                            value={staffSearchTerm}
                            onChange={(e) => setStaffSearchTerm(e.target.value)}
                            style={{
                                color: 'white',
                                height: '40px',
                                border: '1px solid rgba(255,255,255,0.3)',
                                borderRadius: '5px',
                                paddingLeft: '35px'
                            }}
                        />
                    </div>
                </div>
                <div className="col-12 col-md-6">
                    {isCheckingAvailabilities && (
                        <div className="text-info mt-2">
                            <i className="fas fa-spinner fa-spin me-2"></i>
                            Đang kiểm tra lịch rảnh nhân viên...
                        </div>
                    )}
                </div>
            </div>

            <div className="staff-directory-grid">
                {filteredStaffList.length === 0 ? (
                    <div className="text-center py-5">
                        <i className="fas fa-search text-white-50 mb-3" style={{ fontSize: '2rem' }}></i>
                        <p className="text-white-50">
                            {staffSearchTerm ? 'Không tìm thấy nhân viên phù hợp' : 'Không có nhân viên nào'}
                        </p>
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
                                                    <i className="fas fa-times me-1"></i>Bận
                                                </span>
                                            ) : isSelected ? (
                                                <span className="badge bg-primary" style={{ fontSize: '0.65rem' }}>
                                                    <i className="fas fa-check me-1"></i>Đã chọn
                                                </span>
                                            ) : (
                                                <span className="badge bg-success" style={{ fontSize: '0.65rem' }}>
                                                    <i className="fas fa-circle me-1"></i>Rảnh
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
                                                    <><i className="fas fa-ban me-1"></i>Không có</>
                                                ) : isSelected ? (
                                                    <><i className="fas fa-check me-1"></i>Đã chọn</>
                                                ) : (
                                                    <><i className="fas fa-hand-pointer me-1"></i>Chọn</>
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
    );

    const renderCustomerInfo = () => (
        <div className="step-content">
            <div className="text-center mb-4">
                <h4 className="text-white mb-2">
                    <i className="fas fa-user me-2 text-primary"></i>
                    Thông Tin Khách Hàng
                </h4>
                <p className="text-white-50">Vui lòng điền thông tin liên hệ của bạn</p>
            </div>

            <div className="row g-3">
                <div className="col-12">
                    <button
                        type="button"
                        onClick={handleUseAccountInfo}
                        className="btn btn-outline-light w-100 mb-3"
                        style={{ height: '45px' }}
                    >
                        <i className="fas fa-user-circle me-2"></i>
                        Sử dụng thông tin tài khoản
                    </button>
                </div>

                <div className="col-12 col-lg-6">
                    <label className="form-label text-white fw-bold">
                        <i className="fas fa-user me-2"></i>Họ và Tên *
                    </label>
                    <input
                        type="text"
                        name="fullName"
                        value={formData.fullName}
                        onChange={handleInputChange}
                        className={`form-control py-2 border-white bg-transparent text-white custom-placeholder ${validationErrors.fullName ? 'border-danger' : ''}`}
                        placeholder="Nhập họ và tên của bạn"
                        style={{ color: 'white', height: '45px' }}
                    />
                    {validationErrors.fullName && (
                        <small className="text-danger mt-1 d-block">{validationErrors.fullName}</small>
                    )}
                </div>

                <div className="col-12 col-lg-6">
                    <label className="form-label text-white fw-bold">
                        <i className="fas fa-phone me-2"></i>Số Điện Thoại *
                    </label>
                    <input
                        type="text"
                        name="phoneNumber"
                        value={formData.phoneNumber}
                        onChange={handleInputChange}
                        className={`form-control py-2 border-white bg-transparent text-white custom-placeholder ${validationErrors.phoneNumber ? 'border-danger' : ''}`}
                        placeholder="Nhập số điện thoại (tối đa 10 số)"
                        maxLength="10"
                        style={{ color: 'white', height: '45px' }}
                    />
                    {validationErrors.phoneNumber && (
                        <small className="text-danger mt-1 d-block">{validationErrors.phoneNumber}</small>
                    )}
                </div>

                <div className="col-12">
                    <label className="form-label text-white fw-bold">
                        <i className="fas fa-comment me-2"></i>Ghi Chú
                    </label>
                    <div className="position-relative">
                        <textarea
                            name="notes"
                            value={formData.notes}
                            onChange={handleInputChange}
                            className={`form-control border-white bg-transparent text-white custom-placeholder ${validationErrors.notes ? 'border-danger' : ''}`}
                            rows="4"
                            placeholder="Ghi chú thêm về yêu cầu của bạn (không bắt buộc)"
                            maxLength="500"
                            style={{
                                color: 'white',
                                resize: 'none',
                                fontSize: '0.9rem'
                            }}
                        />
                        <div className="d-flex justify-content-between align-items-center mt-1">
                            {validationErrors.notes && (
                                <small className="text-danger">{validationErrors.notes}</small>
                            )}
                            <small className={`text-white-50 ms-auto ${formData.notes?.length > 450 ? 'text-warning' : ''} ${formData.notes?.length >= 500 ? 'text-danger' : ''}`} style={{ fontSize: '0.75rem' }}>
                                {formData.notes?.length || 0}/500 ký tự
                            </small>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );

    const renderConfirmation = () => {
        const selectedService = services.find(s => String(s.id) === formData.serviceId);
        const selectedTimeSlot = timeSlots.find(ts => String(ts.slotId) === formData.timeSlotId);
        const selectedStaff = staffList.find(s => s.id === selectedStaffId);

        return (
            <div className="step-content">
                <div className="text-center mb-4">
                    <h4 className="text-white mb-2">
                        <i className="fas fa-check-circle me-2 text-success"></i>
                        Xác Nhận Đặt Lịch
                    </h4>
                    <p className="text-white-50">Vui lòng kiểm tra lại thông tin trước khi xác nhận</p>
                </div>

                <div className="confirmation-card p-4 rounded-3" style={{ backgroundColor: 'rgba(255,255,255,0.1)', backdropFilter: 'blur(10px)' }}>
                    <div className="row g-4">
                        <div className="col-12 col-md-6">
                            <div className="border-start border-primary border-3 ps-3">
                                <h6 className="text-primary mb-1">
                                    <i className="fas fa-spa me-2"></i>Dịch Vụ
                                </h6>
                                <p className="text-white mb-1 fw-bold">{selectedService?.name}</p>
                                <p className="text-success mb-0">{selectedService?.price}$ - {selectedService?.duration || '60'} phút</p>
                            </div>
                        </div>

                        <div className="col-12 col-md-6">
                            <div className="border-start border-info border-3 ps-3">
                                <h6 className="text-info mb-1">
                                    <i className="fas fa-calendar-alt me-2"></i>Thời Gian
                                </h6>
                                <p className="text-white mb-1 fw-bold">{formData.appointmentDate}</p>
                                <p className="text-warning mb-0">
                                    {selectedTimeSlot?.startTime} - {selectedTimeSlot?.endTime}
                                </p>
                            </div>
                        </div>

                        <div className="col-12 col-md-6">
                            <div className="border-start border-success border-3 ps-3">
                                <h6 className="text-success mb-1">
                                    <i className="fas fa-user-tie me-2"></i>Nhân Viên
                                </h6>
                                <p className="text-white mb-1 fw-bold">{selectedStaff?.fullName}</p>
                                <div className="d-flex align-items-center">
                                    {renderStars(selectedStaff?.averageRating)}
                                    <span className="ms-2 text-white-50 small">
                                        ({selectedStaff?.totalReviews || 0} đánh giá)
                                    </span>
                                </div>
                            </div>
                        </div>

                        <div className="col-12 col-md-6">
                            <div className="border-start border-warning border-3 ps-3">
                                <h6 className="text-warning mb-1">
                                    <i className="fas fa-user me-2"></i>Khách Hàng
                                </h6>
                                <p className="text-white mb-1 fw-bold">{formData.fullName}</p>
                                <p className="text-white-50 mb-0">{formData.phoneNumber}</p>
                            </div>
                        </div>

                        {formData.notes && (
                            <div className="col-12">
                                <div className="border-start border-secondary border-3 ps-3">
                                    <h6 className="text-secondary mb-1">
                                        <i className="fas fa-comment me-2"></i>Ghi Chú
                                    </h6>
                                    <p className="text-white-50 mb-0 small">{formData.notes}</p>
                                </div>
                            </div>
                        )}
                    </div>

                    <hr className="my-4" style={{ borderColor: 'rgba(255,255,255,0.3)' }} />
                    
                    <div className="d-flex justify-content-between align-items-center">
                        <h5 className="text-white mb-0">
                            <i className="fas fa-money-bill-wave me-2"></i>Tổng Chi Phí:
                        </h5>
                        <h3 className="text-primary mb-0 fw-bold">{selectedService?.price}$</h3>
                    </div>
                </div>
            </div>
        );
    };

    // --- BẮT ĐẦU PHẦN GIAO DIỆN (JSX) ---
    return (
        <div className="container-fluid appointment py-5">
            <ToastContainer />
            <div className="container py-5">
                {/* Header */}
                <div className="text-center mb-5">
                    <p className="fs-4 text-uppercase text-primary">Get In Touch</p>
                    <h1 className="display-5 display-lg-4 mb-3 text-white">Get Appointment</h1>
                    <p className="text-white-50">Đặt lịch hẹn spa chỉ với 4 bước đơn giản</p>
                </div>

                {/* Progress Steps */}
                <div className="row justify-content-center mb-4">
                    <div className="col-lg-10 col-12">
                        <div className="step-progress-container">
                            <div className="d-flex justify-content-between align-items-center step-progress-wrapper">
                                {[1, 2, 3, 4].map(step => (
                                    <div key={step} className="d-flex flex-column align-items-center step-item">
                                        <div 
                                            className={`step-circle ${currentStep >= step ? 'active' : ''} ${currentStep > step ? 'completed' : ''}`}
                                        >
                                            {currentStep > step ? (
                                                <i className="fas fa-check"></i>
                                            ) : (
                                                step
                                            )}
                                        </div>
                                        <small className="mt-2 text-center step-label">
                                            {step === 1 && 'Dịch Vụ & Thời Gian'}
                                            {step === 2 && 'Chọn Nhân Viên'}
                                            {step === 3 && 'Thông Tin Cá Nhân'}
                                            {step === 4 && 'Xác Nhận'}
                                        </small>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>
                </div>

                <div className="row g-5 justify-content-center">
                    <div className="col-lg-10 col-12">
                        <div
                            className="appointment-form p-3 p-lg-4 position-relative overflow-hidden"
                            style={{
                                height: 'auto',
                                minHeight: '600px',
                                maxWidth: '100%',
                                background: 'rgba(0, 0, 0, 0.3)',
                                backdropFilter: 'blur(15px)',
                                border: '1px solid rgba(255, 255, 255, 0.1)',
                                boxShadow: '0 8px 32px rgba(0, 0, 0, 0.4)',
                                zIndex: 5
                            }}
                        >
                            <form onSubmit={handleSubmit}>
                                {/* Step Content */}
                                {renderStepContent()}

                                {/* Navigation Buttons */}
                                <div className="row mt-4">
                                    <div className="col-12">
                                        <div className="d-flex justify-content-between navigation-buttons-wrapper">
                                            <button 
                                                type="button"
                                                className="btn custom-btn prev-btn"
                                                onClick={handlePrevStep}
                                                disabled={currentStep === 1}
                                                style={{ minWidth: '120px' }}
                                            >
                                                <i className="fas fa-chevron-left me-2"></i>
                                                Quay Lại
                                            </button>
                                            
                                            {currentStep < totalSteps ? (
                                                <button 
                                                    type="button"
                                                    className="btn custom-btn next-btn"
                                                    onClick={handleNextStep}
                                                    disabled={!canProceedToStep(currentStep + 1)}
                                                    style={{ minWidth: '120px' }}
                                                >
                                                    Tiếp Theo
                                                    <i className="fas fa-chevron-right ms-2"></i>
                                                </button>
                                            ) : (
                                                <button 
                                                    type="submit"
                                                    className="btn custom-btn submit-btn"
                                                    style={{ minWidth: '120px' }}
                                                >
                                                    <i className="fas fa-check me-2"></i>
                                                    Xác Nhận Đặt Lịch
                                                </button>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            </form>
                        </div>
                    </div>
                </div>
            </div>

            {/* Global CSS */}
            <style jsx global>{`
              /* Step Progress Styles */
              .step-progress-container {
                background: rgba(0, 0, 0, 0.4);
                backdrop-filter: blur(10px);
                border-radius: 15px;
                padding: 20px;
                border: 1px solid rgba(255, 255, 255, 0.1);
                box-shadow: 0 8px 32px rgba(0, 0, 0, 0.3);
                position: relative;
                z-index: 10;
              }
              
              .step-progress-wrapper {
                position: relative;
                padding: 0 25px;
              }
              
              .step-progress-wrapper::before {
                content: '';
                position: absolute;
                top: 25px;
                left: 50px;
                right: 50px;
                height: 3px;
                background: linear-gradient(90deg, rgba(255,255,255,0.1), rgba(255,255,255,0.3), rgba(255,255,255,0.1));
                border-radius: 2px;
                z-index: 1;
              }
              
              .step-item {
                position: relative;
                z-index: 3;
                flex: 1;
                max-width: 130px;
              }
              
              .step-circle {
                width: 55px;
                height: 55px;
                border-radius: 50%;
                display: flex;
                align-items: center;
                justify-content: center;
                background: rgba(0, 0, 0, 0.3);
                color: rgba(255,255,255,0.6);
                font-weight: bold;
                border: 3px solid rgba(255,255,255,0.2);
                transition: all 0.4s ease;
                margin: 0 auto;
                font-size: 1.1rem;
                position: relative;
                box-shadow: 0 4px 15px rgba(0, 0, 0, 0.2);
              }
              
              .step-circle::before {
                content: '';
                position: absolute;
                inset: -3px;
                border-radius: 50%;
                padding: 3px;
                background: linear-gradient(45deg, transparent, rgba(255,255,255,0.1), transparent);
                mask: linear-gradient(#fff 0 0) content-box, linear-gradient(#fff 0 0);
                mask-composite: exclude;
                opacity: 0;
                transition: opacity 0.4s ease;
              }
              
              .step-circle.active {
                background: linear-gradient(135deg, #0d6efd, #0056b3);
                color: white;
                border-color: #0d6efd;
                box-shadow: 0 0 25px rgba(13, 110, 253, 0.5), 0 4px 15px rgba(0, 0, 0, 0.3);
                transform: scale(1.1);
              }
              
              .step-circle.active::before {
                opacity: 1;
              }
              
              .step-circle.completed {
                background: linear-gradient(135deg, #198754, #0f5132);
                color: white;
                border-color: #198754;
                box-shadow: 0 0 20px rgba(25, 135, 84, 0.5), 0 4px 15px rgba(0, 0, 0, 0.3);
                transform: scale(1.05);
              }
              
              .step-circle.completed::before {
                opacity: 1;
              }
              
              .step-label {
                color: white;
                font-weight: 500;
                text-shadow: 1px 1px 2px rgba(0, 0, 0, 0.5);
                font-size: 0.85rem;
              }

              /* Step Content Styles */
              .step-content {
                min-height: 500px;
                padding: 20px;
                border-radius: 10px;
                background: rgba(255,255,255,0.02);
                backdrop-filter: blur(5px);
              }
              
              /* Confirmation Card */
              .confirmation-card {
                border: 1px solid rgba(255,255,255,0.1);
                box-shadow: 0 10px 30px rgba(0,0,0,0.3);
              }

              /* Custom Navigation Buttons */
              .navigation-buttons-wrapper {
                padding: 20px 0;
                gap: 20px;
              }

              .custom-btn {
                position: relative;
                padding: 15px 30px;
                border-radius: 10px;
                font-weight: 600;
                font-size: 1rem;
                border: none;
                overflow: hidden;
                transition: all 0.3s ease;
                text-transform: uppercase;
                letter-spacing: 0.5px;
                box-shadow: 0 4px 15px rgba(0, 0, 0, 0.2);
                backdrop-filter: blur(10px);
              }

              .custom-btn::before {
                content: '';
                position: absolute;
                top: 0;
                left: -100%;
                width: 100%;
                height: 100%;
                background: linear-gradient(90deg, transparent, rgba(255, 255, 255, 0.2), transparent);
                transition: left 0.5s ease;
              }

              .custom-btn:hover::before {
                left: 100%;
              }

              .custom-btn i {
                transition: transform 0.3s ease;
              }

              /* Previous Button */
              .prev-btn {
                background: linear-gradient(135deg, #6c757d, #495057);
                color: white;
                border: 2px solid rgba(255, 255, 255, 0.2);
              }

              .prev-btn:hover:not(:disabled) {
                background: linear-gradient(135deg, #495057, #343a40);
                box-shadow: 0 6px 20px rgba(108, 117, 125, 0.4);
                transform: translateY(-2px);
                color: white;
              }

              .prev-btn:hover:not(:disabled) i {
                transform: translateX(-3px);
              }

              .prev-btn:disabled {
                background: linear-gradient(135deg, rgba(108, 117, 125, 0.4), rgba(73, 80, 87, 0.4));
                color: rgba(255, 255, 255, 0.5);
                cursor: not-allowed;
                border-color: rgba(255, 255, 255, 0.1);
              }

              /* Next Button */
              .next-btn {
                background: linear-gradient(135deg, #e91e63, #c2185b);
                color: white;
                border: 2px solid rgba(233, 30, 99, 0.3);
                box-shadow: 0 4px 15px rgba(233, 30, 99, 0.3);
              }

              .next-btn:hover:not(:disabled) {
                background: linear-gradient(135deg, #c2185b, #ad1457);
                box-shadow: 0 6px 25px rgba(233, 30, 99, 0.5);
                transform: translateY(-2px);
                color: white;
              }

              .next-btn:hover:not(:disabled) i {
                transform: translateX(3px);
              }

              .next-btn:disabled {
                background: linear-gradient(135deg, rgba(233, 30, 99, 0.4), rgba(194, 24, 91, 0.4));
                color: rgba(255, 255, 255, 0.5);
                cursor: not-allowed;
                border-color: rgba(233, 30, 99, 0.1);
                box-shadow: none;
              }

              /* Submit Button */
              .submit-btn {
                background: linear-gradient(135deg, #28a745, #1e7e34);
                color: white;
                border: 2px solid rgba(40, 167, 69, 0.3);
                box-shadow: 0 4px 15px rgba(40, 167, 69, 0.4);
                animation: subtle-pulse 2s ease-in-out infinite alternate;
              }

              .submit-btn:hover {
                background: linear-gradient(135deg, #1e7e34, #155724);
                box-shadow: 0 6px 25px rgba(40, 167, 69, 0.6);
                transform: translateY(-2px);
                color: white;
              }

              .submit-btn:hover i {
                transform: scale(1.1);
              }

              @keyframes subtle-pulse {
                0% { 
                  box-shadow: 0 4px 15px rgba(40, 167, 69, 0.4);
                }
                100% { 
                  box-shadow: 0 4px 20px rgba(40, 167, 69, 0.6);
                }
              }

                              /* Responsive and custom styles */
                @media (max-width: 767.98px) {
                  .appointment-form {
                    height: auto !important;
                    min-height: 600px !important;
                    padding: 1rem !important;
                    background: rgba(0, 0, 0, 0.4) !important;
                    backdropFilter: blur(10px) !important;
                  }
                  .display-4 {
                    font-size: 2rem !important;
                  }
                  .step-progress-container {
                    padding: 15px;
                    background: rgba(0, 0, 0, 0.5);
                  }
                  .step-progress-wrapper {
                    padding: 0 10px;
                  }
                  .step-progress-wrapper::before {
                    left: 30px;
                    right: 30px;
                    height: 2px;
                  }
                  .step-item {
                    max-width: 80px;
                  }
                  .step-circle {
                    width: 45px;
                    height: 45px;
                    font-size: 0.9rem;
                  }
                  .step-label {
                    font-size: 0.7rem;
                  }
                  .navigation-buttons-wrapper {
                    flex-direction: column;
                    gap: 15px;
                  }
                  .custom-btn {
                    min-width: 100%;
                    padding: 12px 25px;
                    font-size: 0.9rem;
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