import React, { useState, useEffect, useCallback } from "react";
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
    userId: '', // This will store the selected staff's ID
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

  const filteredStaffList = staffList.filter(staff =>
    staff.fullName && staff.fullName.toLowerCase().includes(staffSearchTerm.toLowerCase())
  );

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
        <div className="row g-5 align-items-center">
          <div className="col-lg-6">
            <div className="appointment-form p-5">
              <p className="fs-4 text-uppercase text-primary">Get In Touch</p>
              <h1 className="display-4 mb-4 text-white">Get Appointment</h1>
              <form onSubmit={handleSubmit}>
                <div className="row gy-3 gx-4">
                  {/* Customer Info Inputs */}
                  <div className="col-lg-6">
                    <input
                      type="text"
                      name="fullName"
                      value={formData.fullName}
                      onChange={handleInputChange}
                      className="form-control py-3 border-white bg-transparent text-white custom-placeholder"
                      placeholder="Full Name"
                      style={{ color: 'white' }}
                    />
                  </div>
                  <div className="col-lg-6">
                    <input
                      type="text"
                      name="phoneNumber"
                      value={formData.phoneNumber}
                      onChange={handleInputChange}
                      className="form-control py-3 border-white bg-transparent text-white custom-placeholder"
                      placeholder="Phone Number"
                      style={{ color: 'white' }}
                    />
                  </div>
                  
                  {/* Service, Date, TimeSlot Selectors */}
                  <div className="col-lg-6">
                    <select
                      name="serviceId"
                      value={formData.serviceId}
                      onChange={handleInputChange}
                      className="form-select py-3 border-white bg-transparent text-white-option"
                    >
                      <option value="" style={{ color: 'black' }}>Select Service</option>
                      {services.map(service => (
                        <option key={service.id} value={service.id} style={{ color: 'black' }}>
                          {service.name} - {service.price}$
                        </option>
                      ))}
                    </select>
                  </div>
                  <div className="col-lg-6">
                    <input
                      type="date"
                      name="appointmentDate"
                      value={formData.appointmentDate}
                      onChange={handleInputChange}
                      className="form-control py-3 border-white bg-transparent text-white custom-date-picker"
                      min={new Date().toISOString().split("T")[0]} // Prevent selecting past dates
                    />
                  </div>
                  <div className="col-lg-12">
                    <select
                      name="timeSlotId"
                      value={formData.timeSlotId}
                      onChange={handleInputChange}
                      className="form-select py-3 border-white bg-transparent text-white-option w-100"
                      disabled={!formData.serviceId || !formData.appointmentDate}
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
                    <div className="col-lg-12 mt-2">
                      <div className="d-flex align-items-center">
                        <span className="me-2 text-white">
                          <b>Còn lại:</b>
                          <span className={`badge ms-1 ${slotInfo.availableSlot > 3 ? 'bg-success' : slotInfo.availableSlot > 0 ? 'bg-warning text-dark' : 'bg-danger'}`}>
                            {slotInfo.availableSlot}/{slotInfo.totalSlot} slot
                          </span>
                        </span>
                        <div className="flex-grow-1 ms-2" style={{ minWidth: 80 }}>
                          <div className="progress" style={{ height: 8, backgroundColor: 'rgba(255,255,255,0.2)' }}>
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

                  {/* Staff Search Input */}
                  <div className="col-lg-12 mt-3">
                      <input
                        type="text"
                        className="form-control py-3 border-white bg-transparent text-white custom-placeholder"
                        placeholder="Tìm kiếm nhân viên theo tên..."
                        value={staffSearchTerm}
                        onChange={(e) => setStaffSearchTerm(e.target.value)}
                        style={{ color: 'white' }}
                      />
                  </div>

                  {/* Horizontal Staff List */}
                  <div className="col-lg-12 mt-1">
                    <div className="staff-list-horizontal py-2" style={{ display: 'flex', overflowX: 'auto', gap: '15px', minHeight: '220px' }}>
                      {/* --- THAY ĐỔI 3: Cập nhật giao diện thẻ nhân viên --- */}
                      {filteredStaffList.length > 0 ? filteredStaffList.map(staff => {
                        const availability = staffAvailabilities[staff.id];
                        const isBusy = availability?.isAvailable === false;
                        const isSelected = selectedStaffId === staff.id;
                        const canCheck = formData.appointmentDate && formData.timeSlotId && formData.serviceId;

                        let buttonText = "Chọn";
                        if (isSelected) {
                          buttonText = <><i className="fas fa-check me-1"></i> Đã chọn</>;
                        } else if (isCheckingAvailabilities && canCheck && !availability) {
                          buttonText = "Đang kiểm tra...";
                        } else if (isBusy && canCheck) {
                          buttonText = "Bận";
                        }
                        
                        return (
                          <div
                            key={staff.id}
                            className={`staff-card p-3 border ${isSelected ? 'border-primary shadow' : 'border-secondary'}`}
                            style={{
                              minWidth: '180px',
                              maxWidth: '180px',
                              backgroundColor: isSelected ? 'rgba(0, 123, 255, 0.1)' : 'rgba(255,255,255,0.05)',
                              borderRadius: '8px',
                              textAlign: 'center',
                              cursor: isBusy || (isCheckingAvailabilities && canCheck) ? 'not-allowed' : 'pointer',
                              transition: 'all 0.3s ease-in-out',
                              display: 'flex',
                              flexDirection: 'column',
                              justifyContent: 'space-between',
                              opacity: isBusy && canCheck ? 0.6 : 1, // Làm mờ nếu nhân viên bận
                              position: 'relative'
                            }}
                            onClick={() => handleStaffSelect(staff.id)}
                          >
                            {/* Loading overlay */}
                             {isCheckingAvailabilities && canCheck && !availability && (
                                <div style={{
                                    position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, 
                                    backgroundColor: 'rgba(0,0,0,0.5)', zIndex: 2, display: 'flex',
                                    alignItems: 'center', justifyContent: 'center', borderRadius: '8px'
                                }}>
                                    <div className="spinner-border spinner-border-sm text-light" role="status"></div>
                                </div>
                             )}

                            <div>
                              <img
                                src={staff.imageUrl || '/default-avatar.png'}
                                alt={staff.fullName}
                                style={{ width: '70px', height: '70px', borderRadius: '50%', marginBottom: '10px', objectFit: 'cover', border: '2px solid white' }}
                              />
                              <h6 className="text-white mb-1" style={{ fontSize: '0.9rem' }}>{staff.fullName}</h6>
                              <p className="text-muted small mb-1" style={{ fontSize: '0.8rem' }}>
                                Level: {staff.skillsText || 'N/A'}
                              </p>
                              <div className="mb-2">
                                {renderStars(staff.averageRating)}
                                <span className="text-white-50 small ms-1" style={{ fontSize: '0.75rem' }}>({staff.totalReviews || 0})</span>
                              </div>
                            </div>
                            <button
                              type="button"
                              className={`btn btn-sm w-100 mt-auto ${isSelected ? 'btn-primary' : isBusy && canCheck ? 'btn-danger' : 'btn-outline-light'}`}
                              disabled={ (isBusy && canCheck) || (isCheckingAvailabilities && canCheck)}
                            >
                              {buttonText}
                            </button>
                          </div>
                        )
                      }) : (
                        <div className="d-flex align-items-center justify-content-center w-100" style={{ minHeight: '150px'}}>
                          <p className="text-white-50">Không có nhân viên nào phù hợp hoặc sẵn có.</p>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Notes and Submit Buttons */}
                  <div className="col-lg-12 mt-3">
                    <textarea
                      name="notes"
                      value={formData.notes}
                      onChange={handleInputChange}
                      className="form-control border-white bg-transparent text-white custom-placeholder"
                      cols="30"
                      rows="5"
                      placeholder="Write Comments"
                      style={{ color: 'white' }}
                    />
                  </div>
                  <div className="col-lg-6">
                    <button
                      type="button"
                      onClick={handleUseAccountInfo}
                      className="btn btn-outline-light w-100 py-3"
                    >
                      Dùng thông tin tài khoản
                    </button>
                  </div>
                  <div className="col-lg-6">
                    <button
                      type="submit"
                      className="btn btn-primary w-100 py-3"
                    >
                      Submit Now
                    </button>
                  </div>
                </div>
              </form>
            </div>
          </div>
          <div className="col-lg-6">
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
      <style jsx global>{`
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
        .staff-list-horizontal::-webkit-scrollbar {
            height: 8px;
        }
        .staff-list-horizontal::-webkit-scrollbar-track {
            background: rgba(255,255,255,0.1);
            border-radius: 10px;
        }
        .staff-list-horizontal::-webkit-scrollbar-thumb {
            background: rgba(255,255,255,0.3);
            border-radius: 10px;
        }
        .staff-list-horizontal::-webkit-scrollbar-thumb:hover {
            background: rgba(255,255,255,0.5);
        }
        .staff-card:hover {
            transform: translateY(-5px);
            box-shadow: 0 4px 15px rgba(0,0,0,0.2);
        }
        .btn-danger {
            background-color: #dc3545;
            border-color: #dc3545;
        }
      `}</style>
    </div>
  );
};

export default Appointment;