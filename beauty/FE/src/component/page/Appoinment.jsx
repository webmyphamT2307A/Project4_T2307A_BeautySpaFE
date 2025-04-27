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
  useEffect(() => {
    axios.get('http://localhost:8080/api/v1/timeslot')
      .then(res => setTimeSlots(Array.isArray(res.data) ? res.data : res.data.data || []))
      .catch(() => setTimeSlots([]));
  }, []);

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
  
    // Tạo bản sao submitData và loại bỏ customerId, userId nếu rỗng
    const submitData = {
      ...formData,
      status: formData.status || 'pending',
      appointmentDate: formattedDate,
      branchId: formData.branchId || 1,
      timeSlotId: formData.timeSlotId || 1,
      price: formData.price || 10000,
      slot: formData.slot || "1",
    };
  
    // Xóa customerId và userId nếu là chuỗi rỗng hoặc null
    if (!submitData.customerId) delete submitData.customerId;
    if (!submitData.userId) delete submitData.userId;
  
    console.log('Form Data gửi lên:', submitData);
  
    if (!submitData.fullName || !submitData.phoneNumber || !submitData.appointmentDate || !submitData.serviceId) {
      toast.error('Vui lòng điền đầy đủ thông tin!');
      return;
    }
  
    try {
      const response = await axios.post('http://localhost:8080/api/v1/admin/appointment/create', submitData);
      toast.success('Đặt lịch thành công!');
    } catch (error) {
      if (error.response) {
        console.error('Backend Error:', error.response.data);
        toast.error('Đặt lịch thất bại! Lỗi: ' + error.response.data.message);
      } else {
        console.error('Error:', error.message);
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
                      style={{width: '73vh'}}
                      className="form-select py-3 border-white bg-transparent w-100 vw-50"
                    >
                      <option value="">Chọn khung giờ</option>
                      {timeSlots.map(slot => (
                        <option key={slot.slotId} value={slot.slotId}>
                          {slot.startTime} - {slot.endTime}
                        </option>
                      ))}
                    </select>
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