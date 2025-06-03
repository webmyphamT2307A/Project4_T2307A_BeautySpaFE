import React, { useState, useEffect } from "react";
import axios from 'axios';
import { ToastContainer, toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
// Select from 'react-select' is removed as it's no longer used for staff.
// If you use it elsewhere, keep the import. Otherwise, it can be removed.
// import Select from 'react-select';

// customStyles and formatOptionLabel are removed as react-select for staff is removed.

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
  const [staffAvailabilityInfo, setStaffAvailabilityInfo] = useState(null);

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
        const fetchedStaff = Array.isArray(res.data) ? res.data : (res.data.data || []);
        // Shuffle the array
        const shuffledStaff = [...fetchedStaff].sort(() => 0.5 - Math.random());
        setStaffList(shuffledStaff);
      })
      .catch(() => setStaffList([]));
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

  // Fetch staff availability
  useEffect(() => {
    if (formData.userId && formData.appointmentDate && formData.timeSlotId && formData.serviceId) {
      const selectedTimeSlot = timeSlots.find(ts => String(ts.slotId) === formData.timeSlotId);

      if (!selectedTimeSlot || !selectedTimeSlot.startTime) {
        setStaffAvailabilityInfo(null);
        return;
      }

      const [hours, minutes] = selectedTimeSlot.startTime.split(':');
      const dateObj = new Date(formData.appointmentDate);
      dateObj.setUTCHours(parseInt(hours, 10));
      dateObj.setUTCMinutes(parseInt(minutes, 10));
      dateObj.setUTCSeconds(0);
      dateObj.setUTCMilliseconds(0);
      const requestedDateTimeISO = dateObj.toISOString();

      axios.get('http://localhost:8080/api/v1/booking/staff-availability', {
        params: {
          userId: formData.userId,
          requestedDateTime: requestedDateTimeISO,
          durationMinutes: 60 // Assuming service duration is 60 minutes
        }
      })
        .then(res => {
          if (res.data && res.data.data) {
            setStaffAvailabilityInfo({
              isAvailable: res.data.data.isAvailable,
              message: res.data.data.availabilityMessage
            });
          } else {
            setStaffAvailabilityInfo({ isAvailable: false, message: 'Không thể xác định lịch nhân viên.' });
          }
        })
        .catch(err => {
          console.error("Error checking staff availability:", err);
          setStaffAvailabilityInfo({ isAvailable: false, message: 'Lỗi khi kiểm tra lịch nhân viên.' });
        });
    } else {
      setStaffAvailabilityInfo(null);
    }
  }, [formData.userId, formData.appointmentDate, formData.timeSlotId, formData.serviceId, timeSlots]);

  // Handle input changes for general fields
  const handleInputChange = (e) => {
    const { name, value } = e.target;
    if (name === "serviceId") {
      const selectedService = services.find(s => String(s.id) === value);
      setFormData((prev) => ({
        ...prev,
        [name]: value,
        price: selectedService ? selectedService.price : '',
      }));
    } else {
      setFormData((prev) => ({
        ...prev,
        [name]: value,
      }));
    }
  };

  // Handle staff selection
  const handleStaffSelect = (staffId) => {
    setFormData((prev) => ({ ...prev, userId: staffId }));
    setSelectedStaffId(staffId);
    // Reset staff availability info when staff changes, it will be re-fetched by useEffect
    setStaffAvailabilityInfo(null);
  };

  // Use account info for customer details
  const handleUseAccountInfo = () => {
    const storedUserInfo = JSON.parse(localStorage.getItem('userInfo'));
    if (storedUserInfo) {
      setFormData((prev) => ({
        ...prev,
        fullName: storedUserInfo.fullName || '',
        phoneNumber: storedUserInfo.phone || '',
        customerId: storedUserInfo.id,
        // userId should be selected from the staff list, not from customer info
        // userId: storedUserInfo.id || prev.userId, // Removed this line
      }));
      // If you want to clear previously selected staff when user info is applied:
      // setSelectedStaffId(null);
      // setFormData(prev => ({...prev, userId: ''}));
    } else {
      toast.error('Không có thông tin tài khoản!');
    }
  };

  // Handle form submission
  const handleSubmit = async (e) => {
    e.preventDefault();

    let formattedDate = formData.appointmentDate;
    if (formattedDate && formattedDate.includes('-')) {
      const [year, month, day] = formattedDate.split('-');
      formattedDate = `${day}/${month}/${year}`; // Assuming your backend expects dd/MM/yyyy
    }

    let customerIdToSubmit = formData.customerId;

    if (!customerIdToSubmit && (formData.fullName && formData.phoneNumber)) { // Only create guest if not logged in and has name/phone
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
      appointmentDate: formattedDate, // Use the formatted date
      branchId: formData.branchId || 1, // Default or ensure it's selected
      timeSlotId: formData.timeSlotId, // Ensure this is selected
      price: formData.price,
      slot: formData.slot || "1", // Ensure this has a value or default
    };

    // Only include userId if it's selected
    if (!submitData.userId) {
      // toast.error('Vui lòng chọn một nhân viên.'); // Optional: require staff selection
      // return;
      delete submitData.userId; // Or allow booking without specific staff
    }


    if (!submitData.fullName || !submitData.phoneNumber || !submitData.appointmentDate || !submitData.serviceId || !submitData.timeSlotId) {
      toast.error('Vui lòng điền đầy đủ các trường bắt buộc: Họ tên, SĐT, Dịch vụ, Ngày hẹn, Khung giờ.');
      return;
    }

    try {
      await axios.post('http://localhost:8080/api/v1/admin/appointment/create', submitData);
      toast.success('Đặt lịch thành công!');
      // Reset form or parts of it
      setFormData(prev => ({
        ...prev,
        appointmentDate: '',
        serviceId: '',
        timeSlotId: '',
        notes: '',
        userId: '',
        price: '',
        // Keep customer info if they just booked
        // fullName: '',
        // phoneNumber: '',
        // customerId: '',
      }));
      setSelectedStaffId(null);
      setSlotInfo(null);
      setStaffAvailabilityInfo(null);

      // Re-fetch available slots for the date (if date and service are still relevant or cleared)
      if (formData.appointmentDate && formData.serviceId && formData.timeSlotId) {
          axios.get('http://localhost:8080/api/v1/timeslot/available', {
            params: {
              date: formData.appointmentDate, // This will be the old date before reset, consider logic here
              serviceId: formData.serviceId,
              timeSlotId: formData.timeSlotId
            }
          }).then(res => {
            if (res.data.data && res.data.data.availableSlot !== undefined) {
              setSlotInfo(res.data.data);
            } else if (res.data.availableSlot !== undefined) {
              setSlotInfo(res.data);
            } else {
              setSlotInfo(null);
            }
          });
      }

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

  // Helper to render stars
  const renderStars = (rating) => {
    const totalStars = 5;
    const filledStars = Math.round(rating || 0);
    return Array(totalStars).fill(0).map((_, index) => (
      <span key={index} style={{ color: index < filledStars ? '#ffc107' : '#e4e5e9', fontSize: '1em' }}>
        &#9733; {/* Star character */}
      </span>
    ));
  };


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
                          {service.name} - {service.price}₫
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
                    {/* <p className="text-white mb-2">Chọn nhân viên:</p> */}
                    <div className="staff-list-horizontal py-2" style={{ display: 'flex', overflowX: 'auto', gap: '15px', minHeight: '220px' }}>
                        {filteredStaffList.length > 0 ? filteredStaffList.map(staff => (
                            <div
                                key={staff.id}
                                className={`staff-card p-3 border ${selectedStaffId === staff.id ? 'border-primary shadow' : 'border-secondary'}`}
                                style={{
                                    minWidth: '180px',
                                    maxWidth: '180px',
                                    backgroundColor: selectedStaffId === staff.id ? 'rgba(0, 123, 255, 0.1)' : 'rgba(255,255,255,0.05)',
                                    borderRadius: '8px',
                                    textAlign: 'center',
                                    cursor: 'pointer',
                                    transition: 'all 0.3s ease-in-out',
                                    display: 'flex',
                                    flexDirection: 'column',
                                    justifyContent: 'space-between'
                                }}
                                onClick={() => handleStaffSelect(staff.id)}
                            >
                                <div>
                                    <img
                                        src={staff.imageUrl || '/default-avatar.png'} // Ensure you have a default avatar
                                        alt={staff.fullName}
                                        style={{ width: '70px', height: '70px', borderRadius: '50%', marginBottom: '10px', objectFit: 'cover', border: '2px solid white' }}
                                    />
                                    <h6 className="text-white mb-1" style={{ fontSize: '0.9rem' }}>{staff.fullName}</h6>
                                    <p className="text-muted small mb-1" style={{ fontSize: '0.8rem' }}>
                                        {/* Use staff.level or staff.skillsText. Your User model has skillsText */}
                                        Level: {staff.skillsText || 'N/A'}
                                    </p>
                                    <div className="mb-2">
                                        {renderStars(staff.averageRating)}
                                        <span className="text-white-50 small ms-1" style={{ fontSize: '0.75rem' }}>({staff.totalReviews || 0})</span>
                                    </div>
                                </div>
                                <button
                                    type="button"
                                    className={`btn btn-sm w-100 mt-auto ${selectedStaffId === staff.id ? 'btn-primary' : 'btn-outline-light'}`}
                                >
                                    {selectedStaffId === staff.id ? <><i className="fas fa-check me-1"></i> Đã chọn</> : 'Chọn'}
                                </button>
                            </div>
                        )) : (
                            <div className="d-flex align-items-center justify-content-center w-100" style={{ minHeight: '150px'}}>
                                <p className="text-white-50">Không có nhân viên nào phù hợp hoặc sẵn có.</p>
                            </div>
                        )}
                    </div>
                  </div>


                  {staffAvailabilityInfo && (
                    <div className="col-lg-12 mt-2" style={{ color: staffAvailabilityInfo.isAvailable ? 'lightgreen' : 'coral', fontSize: '0.9em' }}>
                      {staffAvailabilityInfo.message}
                    </div>
                  )}

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
              {/* Opening hours remain the same */}
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
                <p>Wednesday:</p> {/* Corrected spelling */}
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
              <p className="text-white-50">Check out seasonal discounts for best offers.</p> {/* Adjusted text color for contrast */}
            </div>
          </div>
        </div>
      </div>
      <style jsx global>{`
        .text-white-option {
          color: white !important;
        }
        .text-white-option option {
          color: black !important; /* For dropdown options */
          background-color: white !important;
        }
        .text-white-option option:disabled {
          color: #999 !important;
        }
        .form-control.custom-placeholder::placeholder {
          color: #ccc; /* Light gray placeholder text */
          opacity: 1; /* Firefox */
        }
        .form-control.custom-placeholder:-ms-input-placeholder { /* Internet Explorer 10-11 */
          color: #ccc;
        }
        .form-control.custom-placeholder::-ms-input-placeholder { /* Microsoft Edge */
          color: #ccc;
        }
        .custom-date-picker::-webkit-calendar-picker-indicator {
            filter: invert(1); /* Makes the calendar icon white */
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
        /* Add Font Awesome if you need icons like the checkmark */
        /* You can link it in your public/index.html */
        /* e.g., <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/5.15.4/css/all.min.css" /> */
      `}</style>
    </div>
  );
};

export default Appointment;