import React, { useState, useEffect, useCallback, useMemo } from "react";
import axios from 'axios';
import { ToastContainer, toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import { Swiper, SwiperSlide } from 'swiper/react';
import { Navigation, Pagination } from 'swiper/modules';
import 'swiper/css';
import 'swiper/css/navigation';
import 'swiper/css/pagination';


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
  
  // --- THAY ĐỔI 1: State mới để quản lý lịch rảnh của TẤT CẢ nhân viên ---
  const [staffAvailabilities, setStaffAvailabilities] = useState({}); // { staffId: { isAvailable, message } }
  const [isCheckingAvailabilities, setIsCheckingAvailabilities] = useState(false);
  const [staffSearchTerm, setStaffSearchTerm] = useState('');
  const [selectedStaffId, setSelectedStaffId] = useState(null); // To track visually selected staff
  const [showStaffSearch, setShowStaffSearch] = useState(false); // State để ẩn/hiện search

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

  // --- THAY ĐỔI 2: Cập nhật useEffect để kiểm tra lịch cho TẤT CẢ nhân viên ---
  useEffect(() => {
    const checkAllStaffAvailability = async () => {
      // Chỉ chạy khi có đủ thông tin cần thiết
      if (!formData.appointmentDate || !formData.timeSlotId || !formData.serviceId || staffList.length === 0) {
        setStaffAvailabilities({}); // Xóa dữ liệu cũ nếu thông tin chưa đủ
        return;
      }

      setIsCheckingAvailabilities(true);
      setStaffAvailabilities({}); // Xóa dữ liệu cũ trước khi kiểm tra

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
  

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    
    // Khi thay đổi các trường quan trọng, bỏ chọn nhân viên để tránh nhầm lẫn
    if (['appointmentDate', 'timeSlotId', 'serviceId'].includes(name)) {
        setFormData(prev => ({ ...prev, userId: '', [name]: value }));
        setSelectedStaffId(null);
    }

    if (name === "serviceId") {
      const selectedService = services.find(s => String(s.id) === value);
      setFormData((prev) => ({
        ...prev,
        serviceId: value,
        price: selectedService ? selectedService.price : '',
      }));
    } else {
      setFormData((prev) => ({
        ...prev,
        [name]: value,
      }));
    }
  };

  const handleStaffSelect = (staffId) => {
    // Ngăn việc chọn lại nhân viên đã chọn hoặc nhân viên bận
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

    // Kiểm tra lại lần cuối xem nhân viên đã chọn có bận không
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

  // Sửa lại filtered staff list - không lọc khi chưa chọn service
  const filteredStaffList = useMemo(() => {
    try {
      let filtered = staffList || [];
      
      // KHÔNG lọc theo service nữa - hiển thị tất cả staff
      // Chỉ lọc theo search term
      if (staffSearchTerm?.trim()) {
        filtered = filtered.filter(staff => 
          staff?.fullName?.toLowerCase().includes(staffSearchTerm.toLowerCase())
        );
      }
      
      return filtered;
    } catch (error) {
      console.error('Error in filteredStaffList:', error);
      return [];
    }
  }, [staffList, staffSearchTerm]); 

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
      <div className="row g-5 align-items-start"> {/* Thay đổi từ align-items-center */}
        <div className="col-lg-6 col-12"> {/* Thêm col-12 cho mobile */}
          <div 
            className="appointment-form p-3 p-lg-4 position-relative overflow-hidden" 
            style={{ 
              height: 'auto', // Thay đổi từ cố định sang auto cho mobile
              minHeight: '600px', // Thêm min-height
              maxWidth: '100%'
            }}
          >
            <p className="fs-4 text-uppercase text-primary">Get In Touch</p>
            <h1 className="display-5 display-lg-4 mb-3 text-white">Get Appointment</h1> {/* Responsive heading */}
            <form onSubmit={handleSubmit}>
              <div className="row gy-2 gx-2 gx-lg-3"> {/* Giảm gap cho mobile */}
                {/* Customer Info Inputs */}
                <div className="col-12 col-lg-6"> {/* Mobile full width */}
                  <input
                    type="text"
                    name="fullName"
                    value={formData.fullName}
                    onChange={handleInputChange}
                    className="form-control py-2 border-white bg-transparent text-white custom-placeholder text-truncate"
                    placeholder="Full Name"
                    style={{ 
                      color: 'white',
                      maxWidth: '100%',
                      height: '45px'
                    }}
                  />
                </div>
                <div className="col-12 col-lg-6">
                  <input
                    type="text"
                    name="phoneNumber"
                    value={formData.phoneNumber}
                    onChange={handleInputChange}
                    className="form-control py-2 border-white bg-transparent text-white custom-placeholder text-truncate"
                    placeholder="Phone Number"
                    style={{ 
                      color: 'white',
                      maxWidth: '100%',
                      height: '45px'
                    }}
                  />
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

                {/* Staff Info và Search Icon */}
                {formData.serviceId && (
                  <div className="col-12 mb-1">
                    <div className="d-flex align-items-center justify-content-between flex-wrap" style={{ gap: '5px' }}>
                      <small className="text-white-50" style={{ fontSize: '0.7rem' }}>
                        <i className="fas fa-users me-1"></i>
                        {filteredStaffList.length} nhân viên{staffSearchTerm ? ' tìm được' : ' có sẵn'}
                      </small>
                      {filteredStaffList.length > 0 && (
                        <div className="d-flex align-items-center" style={{ gap: '10px' }}>
                          {staffSearchTerm && (
                            <small className="text-info" style={{ fontSize: '0.6rem' }}>
                              ✓ Kết quả tìm kiếm
                            </small>
                          )}
                          <div
                            className="search-icon d-flex align-items-center justify-content-center"
                            style={{
                              width: '28px',
                              height: '28px',
                              backgroundColor: 'rgba(0,0,0,0.6)',
                              borderRadius: '50%',
                              cursor: 'pointer',
                              color: 'white',
                              fontSize: '12px',
                              transition: 'all 0.3s ease'
                            }}
                            onClick={() => setShowStaffSearch(!showStaffSearch)}
                          >
                            <i className={`fas ${showStaffSearch ? 'fa-times' : 'fa-search'}`}></i>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {/* Staff Search Input - Conditional */}
                {showStaffSearch && (
                  <div className="col-12">
                    <input
                      type="text"
                      className="form-control py-2 border-white bg-transparent text-white custom-placeholder text-truncate"
                      placeholder="Tìm kiếm nhân viên theo tên..."
                      value={staffSearchTerm}
                      onChange={(e) => setStaffSearchTerm(e.target.value)}
                      style={{ 
                        color: 'white',
                        maxWidth: '100%',
                        height: '40px'
                      }}
                    />
                  </div>
                )}

                {/* Horizontal Staff List */}
                <div className="col-12">
                  <div className="position-relative">
                    <Swiper
                      modules={[Navigation]}
                      spaceBetween={8}
                      slidesPerView={'auto'}
                      navigation={{
                        nextEl: '.swiper-button-next-custom',
                        prevEl: '.swiper-button-prev-custom',
                      }}
                      className="staff-swiper"
                      style={{ 
                        height: '140px', // Responsive height
                        paddingLeft: '0px',
                        paddingRight: '0px'
                      }}
                      breakpoints={{
                        320: {
                          slidesPerView: 'auto',
                          spaceBetween: 8
                        },
                        768: {
                          slidesPerView: 'auto',
                          spaceBetween: 10
                        },
                        992: {
                          slidesPerView: 'auto',
                          spaceBetween: 10
                        }
                      }}
                    >
                     {filteredStaffList.length === 0 ? (
    <SwiperSlide>
        <div className="d-flex align-items-center justify-content-center w-100" style={{ minHeight: '120px', width: '250px'}}>
            <div className="text-center">
                <i className="fas fa-search text-white-50 mb-2" style={{ fontSize: '1.5rem' }}></i>
                <p className="text-white-50" style={{ fontSize: '0.7rem', marginBottom: '5px' }}>
                    {/* Cập nhật thông báo cho rõ ràng hơn */}
                    {staffSearchTerm ? 'Không tìm thấy nhân viên' : 'Không có nhân viên nào'}
                </p>
                <small className="text-white-50" style={{ fontSize: '0.6rem' }}>
                    {staffSearchTerm ? 'Vui lòng thử từ khóa khác' : 'Vui lòng chờ hoặc tải lại'}
                </small>
            </div>
        </div>
    </SwiperSlide>
) : (
    filteredStaffList.map(staff => {
        // --- Logic render thẻ nhân viên của bạn giữ nguyên ---
        const isSelected = selectedStaffId === staff.id;
        
        // --- THAY ĐỔI NHỎ Ở ĐÂY ---
        // Lấy trạng thái bận/rảnh từ state `staffAvailabilities`
        const availability = staffAvailabilities[staff.id];
        const isBusy = availability && availability.isAvailable === false;
        
        // Chỉ disable nút chọn khi đã có đủ thông tin để check và nhân viên bận
        const canBeSelected = !isBusy;

        return (
            <SwiperSlide 
                key={staff.id}
                style={{ width: '120px' }}
            >
                <div
                    className={`staff-card p-2 border rounded d-flex flex-column justify-content-between text-center position-relative ${isSelected ? 'border-primary shadow' : 'border-secondary'} ${isBusy ? 'staff-busy' : ''}`}
                    style={{
                        width: '120px',
                        height: '120px',
                        backgroundColor: isSelected ? 'rgba(0, 123, 255, 0.1)' : 'rgba(255,255,255,0.05)',
                        cursor: canBeSelected ? 'pointer' : 'not-allowed', // Thay đổi con trỏ chuột
                        transition: 'all 0.3s ease-in-out',
                        opacity: isBusy ? 0.6 : 1, // Làm mờ nhân viên bận
                    }}
                    onClick={() => canBeSelected && handleStaffSelect(staff.id)} // Chỉ cho phép chọn khi rảnh
                >
                    {/* ... Phần bên trong thẻ nhân viên giữ nguyên ... */}
                    <div style={{ flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
                        <div>
                            <img
                                src={staff.imageUrl || '/default-avatar.png'}
                                alt={staff.fullName}
                                className="rounded-circle border border-white mb-1"
                                style={{ 
                                    width: '40px', 
                                    height: '40px', 
                                    objectFit: 'cover',
                                    borderWidth: '1px !important'
                                }}
                            />
                            <h6 className="text-white mb-1 text-truncate" style={{ fontSize: '0.6rem', lineHeight: '1.1' }}>
                                {staff.fullName}
                            </h6>
                        </div>
                        
                        <div style={{ minHeight: '15px' }}>
                            <p className="text-muted small mb-1" style={{ fontSize: '0.5rem', lineHeight: '1', margin: '0', padding: '0 1px', maxWidth: '100%', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                                {staff.skillsText || 'N/A'}
                            </p>
                            
                            <div className="mb-1 d-flex align-items-center justify-content-center">
                                <div className="me-1">
                                    {renderStars(staff.averageRating)}
                                </div>
                                <span className="text-white-50" style={{ fontSize: '0.45rem' }}>
                                    ({staff.totalReviews || 0})
                                </span>
                            </div>
                        </div>
                    </div>
                    
                    {/* Hiển thị thông báo bận nếu có */}
                    {isBusy && (
                        <div className="position-absolute top-0 start-0 w-100 h-100 d-flex align-items-center justify-content-center" style={{ backdropFilter: 'blur(1px)'}}>
                            <span className="badge bg-danger" style={{fontSize: '0.6rem'}}>Bận</span>
                        </div>
                    )}
                    
                    {/* Nút chọn */}
                    <button
                        type="button"
                        className={`btn btn-sm w-100 ${isSelected ? 'btn-primary' : 'btn-outline-light'}`}
                        style={{ fontSize: '0.5rem', padding: '2px 4px', height: '20px', marginTop: 'auto' }}
                        disabled={!canBeSelected} // Disable nút nếu nhân viên bận
                    >
                        {isSelected ? <><i className="fas fa-check me-1"></i> Đã chọn</> : (isBusy ? 'Đã bận' : 'Chọn')}
                    </button>
                </div>
            </SwiperSlide>
        )
    })
)}
                    </Swiper>

                    {/* Custom Navigation Arrows - Responsive */}
                    <div className="swiper-button-prev-custom position-absolute top-50 start-0 translate-middle-y d-none d-md-flex" style={{ 
                      zIndex: 10,
                      left: '-15px',
                      width: '30px',
                      height: '30px',
                      backgroundColor: 'rgba(0,0,0,0.6)',
                      borderRadius: '50%',
                      alignItems: 'center',
                      justifyContent: 'center',
                      cursor: 'pointer',
                      color: 'white',
                      fontSize: '12px'
                    }}>
                      <i className="fas fa-chevron-left"></i>
                    </div>
                    
                    <div className="swiper-button-next-custom position-absolute top-50 end-0 translate-middle-y d-none d-md-flex" style={{ 
                      zIndex: 10,
                      right: '-15px',
                      width: '30px',
                      height: '30px',
                      backgroundColor: 'rgba(0,0,0,0.6)',
                      borderRadius: '50%',
                      alignItems: 'center',
                      justifyContent: 'center',
                      cursor: 'pointer',
                      color: 'white',
                      fontSize: '12px'
                    }}>
                      <i className="fas fa-chevron-right"></i>
                    </div>
                  </div>
                </div>

                {/* Notes */}
                <div className="col-12">
                  <textarea
                    name="notes"
                    value={formData.notes}
                    onChange={handleInputChange}
                    className="form-control border-white bg-transparent text-white custom-placeholder"
                    cols="30"
                    rows="3"
                    placeholder="Write Comments"
                    style={{ 
                      color: 'white',
                      resize: 'none',
                      height: '70px',
                      maxWidth: '100%',
                      fontSize: '0.8rem'
                    }}
                  />
                </div>
                
                {/* Submit Buttons - Responsive */}
                <div className="col-12 col-lg-6">
                  <button
                    type="button"
                    onClick={handleUseAccountInfo}
                    className="btn btn-outline-light w-100"
                    style={{ 
                      height: '40px',
                      fontSize: '0.8rem'
                    }}
                  >
                    Dùng thông tin tài khoản
                  </button>
                </div>
                <div className="col-12 col-lg-6">
                  <button
                    type="submit"
                    className="btn btn-primary w-100"
                    style={{ 
                      height: '40px',
                      fontSize: '0.8rem'
                    }}
                  >
                    Submit Now
                  </button>
                </div>
              </div>
            </form>
          </div>
        </div>
        
        {/* Opening Hours - Ẩn trên mobile */}
        <div className="col-lg-6 d-none d-lg-block">
          <div className="appointment-time p-5">
            <h1 className="display-5 mb-4 text-white">Opening Hours</h1>
            <div className="d-flex justify-content-between fs-5 text-white">
              <p>Saturday:</p>
              <p>09:00 am – 10:00 pm</p>
            </div>
            <div className="d-flex justify-content-between fs-5 text-white">
              <p>Sunday:</p>
              <p>09:00 am – 10:00 pm</p>
            </div>
            <div className="d-flex justify-content-between fs-5 text-white">
              <p>Monday:</p>
              <p>09:00 am – 10:00 pm</p>
            </div>
            <div className="d-flex justify-content-between fs-5 text-white">
              <p>Tuesday:</p>
              <p>09:00 am – 10:00 pm</p>
            </div>
            <div className="d-flex justify-content-between fs-5 text-white">
              <p>Wednesday:</p>
              <p>09:00 am – 08:00 pm</p>
            </div>
            <div className="d-flex justify-content-between fs-5 text-white mb-4">
              <p>Thursday:</p>
              <p>09:00 am – 05:00 pm</p>
            </div>
            <div className="d-flex justify-content-between fs-5 text-white mb-4">
              <p>Friday:</p>
              <p>CLOSED</p>
            </div>
            <p className="text-white-50">Check out seasonal discounts for best offers.</p>
          </div>
        </div>
      </div>
    </div>
    
    {/* CSS Responsive */}
    <style jsx global>{`
      /* Mobile responsive styles */
      @media (max-width: 767.98px) {
        .appointment-form {
          height: auto !important;
          min-height: 600px !important;
          padding: 1rem !important;
        }
        
        .display-4 {
          font-size: 2rem !important;
        }
        
        .staff-swiper {
          height: 140px !important;
        }
        
        .staff-card {
          width: 110px !important;
          height: 120px !important;
        }
        
        .staff-card img {
          width: 35px !important;
          height: 35px !important;
        }
        
        .staff-card h6 {
          font-size: 0.55rem !important;
        }
        
        .staff-card p {
          font-size: 0.45rem !important;
        }
        
        .staff-card button {
          font-size: 0.45rem !important;
          height: 18px !important;
        }
        
        .search-icon {
          width: 25px !important;
          height: 25px !important;
          font-size: 11px !important;
        }
      }
      
      /* Tablet responsive styles */
      @media (min-width: 768px) and (max-width: 991.98px) {
        .appointment-form {
          height: auto !important;
          min-height: 650px !important;
        }
      }
      
      /* Existing styles... */
      .text-white-option {
        color: white !important;
      }
      .text-white-option option {
        color: black !important;
        background-color: white !important;
      }
      .text-white-option option:disabled {
        color: #999 !important;
      }
      .form-control.custom-placeholder::placeholder {
        color: #ccc;
        opacity: 1;
      }
      .form-control.custom-placeholder:-ms-input-placeholder {
        color: #ccc;
      }
      .form-control.custom-placeholder::-ms-input-placeholder {
        color: #ccc;
      }
      .custom-date-picker::-webkit-calendar-picker-indicator {
        filter: invert(1);
      }
      
      .staff-swiper .swiper-wrapper {
        align-items: center;
      }
      
      .swiper-button-prev-custom:hover,
      .swiper-button-next-custom:hover {
        background-color: rgba(0,0,0,0.8) !important;
        transform: scale(1.1);
        transition: all 0.3s ease;
      }
      
      .swiper-button-disabled {
        opacity: 0.3 !important;
        cursor: not-allowed !important;
      }
      
      .staff-card:hover {
        transform: translateY(-2px);
        box-shadow: 0 4px 15px rgba(0,0,0,0.2);
      }
      
      .btn-danger {
        background-color: #dc3545;
        border-color: #dc3545;
      }
      
      .search-icon {
        transition: all 0.3s ease;
      }
      
      .search-icon:hover {
        background-color: rgba(0,0,0,0.8) !important;
        transform: scale(1.1);
        box-shadow: 0 4px 10px rgba(0,0,0,0.3);
      }
    `}</style>
  </div>
  );
};

export default Appointment;