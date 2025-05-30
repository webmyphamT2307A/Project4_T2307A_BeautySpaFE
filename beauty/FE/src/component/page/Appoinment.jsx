import React, { useState, useEffect } from "react";
import axios from 'axios';
import { ToastContainer, toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

const Appoinment = () => {
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
  const [staffAvailabilityInfo, setStaffAvailabilityInfo] = useState(null);

  // Fetch services
  useEffect(() => {
    axios.get('http://localhost:8080/api/v1/services')
      .then(res => {
        console.log('Service API:', res.data);
        setServices(Array.isArray(res.data) ? res.data : res.data.data || []);
      })
      .catch(() => setServices([]));
  }, []);

  // Fetch staff list
  useEffect(() => {
    axios.get('http://localhost:8080/api/v1/user/accounts/staff')
      .then(res => setStaffList(res.data))
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
          durationMinutes: 60 // Giả sử thời lượng dịch vụ là 60 phút
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

  // Handle input changes
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

  // Use account info
  const handleUseAccountInfo = () => {
    const storedUserInfo = JSON.parse(localStorage.getItem('userInfo'));
    if (storedUserInfo) {
      setFormData((prev) => ({
        ...prev,
        fullName: storedUserInfo.fullName || '',
        phoneNumber: storedUserInfo.phone || '',
        userId: storedUserInfo.id || prev.userId,
        customerId: storedUserInfo.id,
      }));
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
      formattedDate = `${day}/${month}/${year}`;
    }

    let customerId = formData.customerId;

    if (!customerId) {
      try {
        const res = await axios.post('http://localhost:8080/api/v1/customer/guest-create', {
          fullName: formData.fullName,
          phone: formData.phoneNumber,
        });
        customerId = res.data.id;
      } catch (err) {
        toast.error('Không thể tạo khách hàng tạm!');
        return;
      }
    }

    const submitData = {
      ...formData,
      customerId,
      status: formData.status || 'pending',
      appointmentDate: formattedDate,
      branchId: formData.branchId || 1,
      timeSlotId: formData.timeSlotId || 1,
      price: formData.price || 10000,
      slot: formData.slot || "1",
    };
    if (!submitData.userId) delete submitData.userId;

    if (!submitData.fullName || !submitData.phoneNumber || !submitData.appointmentDate || !submitData.serviceId) {
      toast.error('Vui lòng điền đầy đủ thông tin!');
      return;
    }

    try {
      await axios.post('http://localhost:8080/api/v1/admin/appointment/create', submitData);
      toast.success('Đặt lịch thành công!');
      axios.get('http://localhost:8080/api/v1/timeslot/available', {
        params: {
          date: formData.appointmentDate,
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
    } catch (error) {
      if (error.response) {
        toast.error('Đặt lịch thất bại! Lỗi: ' + error.response.data.message);
      } else {
        toast.error('Đặt lịch thất bại!');
      }
    }
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
                      className="form-control py-3 border-white bg-transparent text-white"
                      placeholder="Full Name"
                    />
                  </div>
                  <div className="col-lg-6">
                    <input
                      type="text"
                      name="phoneNumber"
                      value={formData.phoneNumber}
                      onChange={handleInputChange}
                      className="form-control py-3 border-white bg-transparent text-white"
                      placeholder="Phone Number"
                    />
                  </div>
                  <div className="col-lg-6">
                    <select
                      name="serviceId"
                      value={formData.serviceId}
                      onChange={handleInputChange}
                      className="form-select py-3 border-white bg-transparent"
                    >
                      <option value="">Select Service</option>
                      {services.map(service => (
                        <option key={service.id} value={service.id}>
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
                      className="form-control py-3 border-white bg-transparent"
                    />
                  </div>
                  <div className="col-lg-12">
                    <select
                      name="timeSlotId"
                      value={formData.timeSlotId}
                      onChange={handleInputChange}
                      className="form-select py-3 border-white bg-transparent w-100"
                      disabled={!formData.serviceId || !formData.appointmentDate}
                    >
                      <option value="">Chọn khung giờ</option>
                      {timeSlots.map(slot => {
                        const slotEnd = new Date(`${formData.appointmentDate}T${slot.endTime}`);
                        const now = new Date();
                        const isPast = slotEnd < now;
                        return (
                          <option
                            key={slot.slotId}
                            value={slot.slotId}
                            disabled={isPast}
                          >
                            {slot.startTime} - {slot.endTime} {isPast ? '(Đã qua)' : ''}
                          </option>
                        );
                      })}
                    </select>
                    <div className="col-lg-12">
                      <select
                        name="userId"
                        value={formData.userId}
                        onChange={handleInputChange}
                        className="form-select py-3 border-white bg-transparent w-100"
                      >
                        <option value="">Chọn nhân viên</option>
                        {staffList.map(staff => (
                          <option key={staff.id} value={staff.id}>
                            {staff.fullName} ({staff.email})
                          </option>
                        ))}
                      </select>
                    </div>
                    {staffAvailabilityInfo && (
                      <div className="mt-2" style={{ color: staffAvailabilityInfo.isAvailable ? 'green' : 'red', fontSize: '0.9em' }}>
                        {staffAvailabilityInfo.message}
                      </div>
                    )}
                    {slotInfo && (
                      <div className="mt-2">
                        <div className="d-flex align-items-center">
                          <span className="me-2">
                            <b>Còn lại:</b>
                            <span className={`badge ms-1 ${slotInfo.availableSlot > 3 ? 'bg-success' : slotInfo.availableSlot > 0 ? 'bg-warning text-dark' : 'bg-danger'}`}>
                              {slotInfo.availableSlot}/{slotInfo.totalSlot} slot
                            </span>
                          </span>
                          <div className="flex-grow-1 ms-2" style={{ minWidth: 80 }}>
                            <div className="progress" style={{ height: 8 }}>
                              <div
                                className={`progress-bar ${slotInfo.availableSlot === 0 ? 'bg-danger' : slotInfo.availableSlot <= 3 ? 'bg-warning' : 'bg-success'}`}
                                role="progressbar"
                                style={{ width: `${(slotInfo.availableSlot / slotInfo.totalSlot) * 100}%` }}
                                aria-valuenow={slotInfo.availableSlot}
                                aria-valuemin={0}
                                aria-valuemax={slotInfo.totalSlot}
                              />
                            </div>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                  <div className="col-lg-12">
                    <textarea
                      name="notes"
                      value={formData.notes}
                      onChange={handleInputChange}
                      className="form-control border-white bg-transparent text-white"
                      cols={30}
                      rows={5}
                      placeholder="Write Comments"
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
              <h1 className="display-5 mb-4">Opening Hours</h1>
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
                <p>Wednes:</p>
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
              <p className="text-dark">Check out seasonal discounts for best offers.</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Appoinment;