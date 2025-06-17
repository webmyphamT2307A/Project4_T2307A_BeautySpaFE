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
                  <h4 className="text-primary text-uppercase mb-3">Spa &amp; Beauty Center</h4>
                  <h1 className="display-1 text-capitalize text-dark mb-3">Massage Treatment</h1>
                  <p className="mx-md-5 fs-4 px-4 mb-5 text-dark">Lorem rebum magna dolore amet lorem eirmod magna erat diam stet. Sadips duo stet amet amet ndiam elitr ipsum</p>
                  <div className="d-flex align-items-center justify-content-center">
                    <a className="btn btn-light btn-light-outline-0 rounded-pill py-3 px-5 me-4" href="#">Get Start</a>
                    <a className="btn btn-primary btn-primary-outline-0 rounded-pill py-3 px-5" href="#">Book Now</a>
                  </div>
                </div>
              </div>
            </div>
            <div className="carousel-item">
              <img src="assets/img/carousel-2.jpg" className="img-fluid d-block w-100" alt="Image" />
              <div className="carousel-caption">
                <div className="p-3" style={{ maxWidth: 900 }}>
                  <h4 className="text-primary text-uppercase mb-3" style={{ letterSpacing: 3 }}>Spa &amp; Beauty Center</h4>
                  <h1 className="display-1 text-capitalize text-dark mb-3">Facial Treatment</h1>
                  <p className="mx-md-5 fs-4 px-5 mb-5 text-dark">Lorem rebum magna dolore amet lorem eirmod magna erat diam stet. Sadips duo stet amet amet ndiam elitr ipsum</p>
                  <div className="d-flex align-items-center justify-content-center">
                    <a className="btn btn-light btn-light-outline-0 rounded-pill py-3 px-5 me-4" href="#">Get Start</a>
                    <a className="btn btn-primary btn-primary-outline-0 rounded-pill py-3 px-5" href="#">Book Now</a>
                  </div>
                </div>
              </div>
            </div>
            <div className="carousel-item">
              <img src="assets/img/carousel-1.jpg" className="img-fluid d-block w-100" alt="Image" />
              <div className="carousel-caption">
                <div className="p-3" style={{ maxWidth: 900 }}>
                  <h4 className="text-primary text-uppercase mb-3" style={{ letterSpacing: 3 }}>Spa &amp; Beauty Center</h4>
                  <h1 className="display-1 text-capitalize text-dark">Cellulite Treatment</h1>
                  <p className="mx-md-5 fs-4 px-5 mb-5 text-dark">Lorem rebum magna dolore amet lorem eirmod magna erat diam stet. Sadips duo stet amet amet ndiam elitr ipsum</p>
                  <div className="d-flex align-items-center justify-content-center">
                    <a className="btn btn-light btn-light-outline-0 rounded-pill py-3 px-5 me-4" href="#">Get Start</a>
                    <a className="btn btn-primary btn-primary-outline-0 rounded-pill py-3 px-5" href="#">Book Now</a>
                  </div>
                </div>
              </div>
            </div>
          </div>
          <button className="carousel-control-prev" type="button" data-bs-target="#carouselId" data-bs-slide="prev">
            <span className="carousel-control-prev-icon" aria-hidden="true" />
            <span className="visually-hidden">Previous</span>
          </button>
          <button className="carousel-control-next" type="button" data-bs-target="#carouselId" data-bs-slide="next">
            <span className="carousel-control-next-icon" aria-hidden="true" />
            <span className="visually-hidden">Next</span>
          </button>
        </div>
      </div>
      <Service />
      <AboutUs />
      <Appoinment />
      <Gallery />
      <Team />
      <Contact/>
      <Footer />
    </div>
  )
}
export default Homepage;