import React from "react";
import Header from "../../shared/header";
import Footer from "../../shared/footer";

const AppointmentPage = () => {
    return(
        <div>
            <Header/>
  {/* Header Start */}
  <div className="container-fluid bg-breadcrumb py-5">
    <div className="container text-center py-5">
      <h3 className="text-white display-3 mb-4">Appointment</h3>
      <ol className="breadcrumb justify-content-center mb-0">
        <li className="breadcrumb-item"><a href="index.html">Home</a></li>
        <li className="breadcrumb-item"><a href="#">Pages</a></li>
        <li className="breadcrumb-item active text-white">Appointment</li>
      </ol>    
    </div>
  </div>
  {/* Header End */}
  {/* Appointment Start */}
  <div className="container-fluid appointment py-5" style={{background: 'var(--bs-primary)'}}>
    <div className="container py-5">
      <div className="row g-5 align-items-center">
        <div className="col-lg-6">
          <div className="appointment-form p-5">
            <p className="fs-4 text-uppercase text-primary">Get In Touch</p>
            <h1 className="display-4 mb-4 text-white">Get Appointment</h1>
            <form>
              <div className="row gy-3 gx-4">
                <div className="col-lg-6">
                  <input type="text" className="form-control py-3 border-white bg-transparent text-white" placeholder="First Name" />
                </div>
                <div className="col-lg-6">
                  <input type="email" className="form-control py-3 border-white bg-transparent text-white" placeholder="Email" />
                </div>
                <div className="col-lg-6">
                  <select className="form-select py-3 border-white bg-transparent" aria-label="Default select example">
                    <option selected>Open this select menu</option>
                    <option value={1}>One</option>
                    <option value={2}>Two</option>
                    <option value={3}>Three</option>
                  </select>
                </div>
                <div className="col-lg-6">
                  <input type="date" className="form-control py-3 border-white bg-transparent" />
                </div>
                <div className="col-lg-12">
                  <textarea className="form-control border-white bg-transparent text-white" name="text" id="area-text" cols={30} rows={5} placeholder="Write Comments" defaultValue={""} />
                </div>
                <div className="col-lg-12">
                  <button type="button" className="btn btn-primary btn-primary-outline-0 w-100 py-3 px-5">SUBMIT NOW</button>
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
  {/* Appointment End */}
  <Footer/>
</div>

    )
}

export default AppointmentPage;