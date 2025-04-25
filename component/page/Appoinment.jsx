import React from "react";

const Appoinment = () => {
    return (
<div className="container-fluid appointment py-5">
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
                  <polygon points="55, 10 85, 55 25, 55 25," style={{fill: '#DCCAF2'}} />
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
                  <polygon points="55, 10 85, 55 25, 55 25," style={{fill: '#DCCAF2'}} />
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
                  <polygon points="55, 10 85, 55 25, 55 25," style={{fill: '#DCCAF2'}} />
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