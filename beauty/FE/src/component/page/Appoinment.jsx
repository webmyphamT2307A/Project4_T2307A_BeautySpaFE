import React from "react";
import { useState, useEffect } from "react";
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
  useEffect(() => {
    axios.get('http://localhost:8080/api/v1/timeslot')
      .then(res => setTimeSlots(Array.isArray(res.data) ? res.data : res.data.data || []))
      .catch(() => setTimeSlots([]));
  }, []);
  useEffect(() => {
    if (formData.appointmentDate && formData.serviceId && formData.timeSlotId) {
      const appointmentDates = formData.appointmentDate
      ? `${formData.appointmentDate}T00:00:00Z`
      : '';
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
  console.log('slotInfo:', slotInfo);
  useEffect(() => {
    axios.get('http://localhost:8080/api/v1/services')
      .then(res => {
        console.log('Service API:', res.data);
        setServices(Array.isArray(res.data) ? res.data : res.data.data || []);
      })
      .catch(() => setServices([]));
  }, []);


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
  console.log('formData:', formData);

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

  const handleSubmit = async (e) => {
    e.preventDefault();

    // Chuyển đổi ngày sang dd/MM/yyyy
    let formattedDate = formData.appointmentDate;
    if (formattedDate && formattedDate.includes('-')) {
      const [year, month, day] = formattedDate.split('-');
      formattedDate = `${day}/${month}/${year}`;
    }

    let customerId = formData.customerId;

    // Nếu chưa có customerId, tạo customer tạm trước
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

    // Tạo submitData với customerId vừa lấy được
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

    // Kiểm tra thông tin
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
                      {timeSlots.map(slot => (
                        <option key={slot.slotId} value={slot.slotId}>
                          {slot.startTime} - {slot.endTime}
                        </option>
                      ))}
                    </select>
                    {/* Hiển thị slot còn lại ngay dưới select */}
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

                  {/* Nút sử dụng thông tin tài khoản */}
                  <div className="col-lg-6">
                    <button
                      type="button"
                      onClick={handleUseAccountInfo}
                      className="btn btn-outline-light w-100 py-3"

                    >
                      Dùng thông tin tài khoản
                    </button>
                  </div>

                  {/* Nút Submit */}
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
      {/* Counter Start */}
      <div className="container-fluid counter-section">
        <div className="container py-5">
          <div className="row g-5 justify-content-center">
            <div className="col-md-6 col-lg-4 col-xl-4">
              <div className="counter-item p-5">
                <div className="counter-content bg-white p-4">
                  <i className="fas fa-globe fa-5x text-primary mb-3" />
                  <h5 className="text-primary">Worldwide Clients</h5>
                  <div className="svg-img">
                    <svg width={100} height={50}>
                      <polygon points="55, 10 85, 55 25, 55 25," style={{ fill: '#DCCAF2' }} />
                    </svg>
                  </div>
                </div>
                <div className="counter-quantity">
                  <span className="text-white fs-2 fw-bold" data-toggle="counter-up">379</span>
                  <span className="h1 fw-bold text-white">+</span>
                </div>
              </div>
            </div>
            <div className="col-md-6 col-lg-4 col-xl-4">
              <div className="counter-item p-5">
                <div className="counter-content bg-white p-4">
                  <i className="fas fa-spa fa-5x text-primary mb-3" />
                  <h5 className="text-primary">Wellness &amp; Spa</h5>
                  <div className="svg-img">
                    <svg width={100} height={50}>
                      <polygon points="55, 10 85, 55 25, 55 25," style={{ fill: '#DCCAF2' }} />
                    </svg>
                  </div>
                </div>
                <div className="counter-quantity">
                  <span className="text-white fs-2 fw-bold" data-toggle="counter-up">829</span>
                  <span className="h1 fw-bold text-white">+</span>
                </div>
              </div>
            </div>
            <div className="col-md-6 col-lg-4 col-xl-4">
              <div className="counter-item p-5">
                <div className="counter-content bg-white p-4">
                  <i className="fas fa-users fa-5x text-primary mb-3" />
                  <h5 className="text-primary">Happy Customers</h5>
                  <div className="svg-img">
                    <svg width={100} height={50}>
                      <polygon points="55, 10 85, 55 25, 55 25," style={{ fill: '#DCCAF2' }} />
                    </svg>
                  </div>
                </div>
                <div className="counter-quantity">
                  <span className="text-white fs-2 fw-bold" data-toggle="counter-up">713</span>
                  <span className="h1 fw-bold text-white">+</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
      {/* Counter End */}
    </div>

  )
}
export default Appoinment;