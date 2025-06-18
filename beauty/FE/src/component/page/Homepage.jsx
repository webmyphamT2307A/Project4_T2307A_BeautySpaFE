import React from "react";
import Header from "../shared/header";
import Footer from "../shared/footer";
import Service from "./Service";
import AboutUs from "./AboutUs";
import Appoinment from "./Appoinment";
import Gallery from "./Gallery";
import PricingSell from "./PricingSell";
import Team from "./Team";
import Tesminoal from "./Tesminoal";
import Contact from "./Contact";

const Homepage = () => {
  // Function to scroll to appointment section
  const scrollToAppointment = () => {
    const appointmentSection = document.getElementById('appointment');
    if (appointmentSection) {
      appointmentSection.scrollIntoView({ 
        behavior: 'smooth',
        block: 'start'
      });
    }
  };

  return (
    <div>
      <Header />
      <div className="container-fluid carousel-header px-0">
      <div id="carouselId" className="carousel slide" data-bs-ride="carousel" data-bs-interval="2000">
          <ol className="carousel-indicators">
            <li data-bs-target="#carouselId" data-bs-slide-to={0} className="active" />
            <li data-bs-target="#carouselId" data-bs-slide-to={1} />
            <li data-bs-target="#carouselId" data-bs-slide-to={2} />
          </ol>
          <div className="carousel-inner" role="listbox">
            <div className="carousel-item active">
              <img src="assets/img/carousel-3.jpg" className="img-fluid d-block w-100" alt="Image" />
              <div className="carousel-caption">
                <div className="p-3" style={{ maxWidth: 900 }}>
                  <h4 className="text-primary text-uppercase mb-3">Trung Tâm Spa &amp; Làm Đẹp</h4>
                  <h1 className="display-1 text-capitalize text-dark mb-3">Massage Trị Liệu</h1>
                  <p className="mx-md-5 fs-4 px-4 mb-5 text-dark">Thư giãn và phục hồi sức khỏe với các liệu pháp massage chuyên nghiệp. Chúng tôi mang đến cho bạn trải nghiệm tuyệt vời nhất.</p>
                  <div className="d-flex align-items-center justify-content-center">
                    <a className="btn btn-light btn-light-outline-0 rounded-pill py-3 px-5 me-4" href="#">Bắt Đầu</a>
                    <button 
                      className="btn btn-primary btn-primary-outline-0 rounded-pill py-3 px-5" 
                      onClick={scrollToAppointment}
                      type="button"
                    >
                      Đặt Lịch Ngay
                    </button>
                  </div>
                </div>
              </div>
            </div>
            <div className="carousel-item">
              <img src="assets/img/carousel-2.jpg" className="img-fluid d-block w-100" alt="Image" />
              <div className="carousel-caption">
                <div className="p-3" style={{ maxWidth: 900 }}>
                  <h4 className="text-primary text-uppercase mb-3" style={{ letterSpacing: 3 }}>Trung Tâm Spa &amp; Làm Đẹp</h4>
                  <h1 className="display-1 text-capitalize text-dark mb-3">Chăm Sóc Da Mặt</h1>
                  <p className="mx-md-5 fs-4 px-5 mb-5 text-dark">Làn da rạng rỡ và tươi trẻ với các liệu pháp chăm sóc da mặt cao cấp. Đội ngũ chuyên gia giàu kinh nghiệm sẽ tư vấn cho bạn.</p>
                  <div className="d-flex align-items-center justify-content-center">
                    <a className="btn btn-light btn-light-outline-0 rounded-pill py-3 px-5 me-4" href="#">Bắt Đầu</a>
                    <button 
                      className="btn btn-primary btn-primary-outline-0 rounded-pill py-3 px-5" 
                      onClick={scrollToAppointment}
                      type="button"
                    >
                      Đặt Lịch Ngay
                    </button>
                  </div>
                </div>
              </div>
            </div>
            <div className="carousel-item">
              <img src="assets/img/carousel-1.jpg" className="img-fluid d-block w-100" alt="Image" />
              <div className="carousel-caption">
                <div className="p-3" style={{ maxWidth: 900 }}>
                  <h4 className="text-primary text-uppercase mb-3" style={{ letterSpacing: 3 }}>Trung Tâm Spa &amp; Làm Đẹp</h4>
                  <h1 className="display-1 text-capitalize text-dark">Điều Trị Cellulite</h1>
                  <p className="mx-md-5 fs-4 px-5 mb-5 text-dark">Giải pháp hiệu quả cho vấn đề cellulite với công nghệ tiên tiến. Giúp bạn có được vóc dáng hoàn hảo và tự tin hơn.</p>
                  <div className="d-flex align-items-center justify-content-center">
                    <a className="btn btn-light btn-light-outline-0 rounded-pill py-3 px-5 me-4" href="#">Bắt Đầu</a>
                    <button 
                      className="btn btn-primary btn-primary-outline-0 rounded-pill py-3 px-5" 
                      onClick={scrollToAppointment}
                      type="button"
                    >
                      Đặt Lịch Ngay
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
          <button className="carousel-control-prev" type="button" data-bs-target="#carouselId" data-bs-slide="prev">
            <span className="carousel-control-prev-icon" aria-hidden="true" />
            <span className="visually-hidden">Trước</span>
          </button>
          <button className="carousel-control-next" type="button" data-bs-target="#carouselId" data-bs-slide="next">
            <span className="carousel-control-next-icon" aria-hidden="true" />
            <span className="visually-hidden">Tiếp</span>
          </button>
        </div>
      </div>
      <Service />
      <AboutUs />
      <div id="appointment">
        <Appoinment />
      </div>
      <Gallery />
      <Team />
      <Contact/>
      <Footer />
    </div>
  )
}
export default Homepage;