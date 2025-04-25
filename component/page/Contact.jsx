import React from "react";

const Contact = () => {
    return(
        <div className="container-fluid py-5">
  <div className="container py-5">
    <div className="row g-4 align-items-center">
      <div className="col-12">
        <div className="row g-4">
          <div className="col-lg-4">
            <div className="d-inline-flex bg-light w-100 border border-primary p-4 rounded">
              <i className="fas fa-map-marker-alt fa-2x text-primary me-4" />
              <div>
                <h4>Address</h4>
                <p className="mb-0">123 North tower New York, USA</p>
              </div>
            </div>
          </div>
          <div className="col-lg-4">
            <div className="d-inline-flex bg-light w-100 border border-primary p-4 rounded">
              <i className="fas fa-envelope fa-2x text-primary me-4" />
              <div>
                <h4>Mail Us</h4>
                <p className="mb-0">info@example.com</p>
              </div>
            </div>
          </div>
          <div className="col-lg-4">
            <div className="d-inline-flex bg-light w-100 border border-primary p-4 rounded">
              <i className="fa fa-phone-alt fa-2x text-primary me-4" />
              <div>
                <h4>Telephone</h4>
                <p className="mb-0">(+012) 3456 7890 123</p>
              </div>
            </div>
          </div>
        </div>
      </div>
      <div className="col-12">
        <div className="rounded">
          <iframe className="rounded-top w-100" style={{height: 450, marginBottom: '-6px'}} src="https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d387191.33750346623!2d-73.97968099999999!3d40.6974881!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x89c24fa5d33f083b%3A0xc80b8f06e177fe62!2sNew%20York%2C%20NY%2C%20USA!5e0!3m2!1sen!2sbd!4v1694259649153!5m2!1sen!2sbd" loading="lazy" referrerPolicy="no-referrer-when-downgrade" />
        </div>
        <div className=" text-center p-4 rounded-bottom bg-primary">
          <h4 className="text-white fw-bold">Follow Us</h4>
          <div className="d-flex align-items-center justify-content-center">
            <a href="#" className="btn btn-light btn-light-outline-0 btn-square rounded-circle me-3"><i className="fab fa-facebook-f" /></a>
            <a href="#" className="btn btn-light btn-light-outline-0 btn-square rounded-circle me-3"><i className="fab fa-twitter" /></a>
            <a href="#" className="btn btn-light btn-light-outline-0 btn-square rounded-circle me-3"><i className="fab fa-instagram" /></a>
            <a href="#" className="btn btn-light btn-light-outline-0 btn-square rounded-circle"><i className="fab fa-linkedin-in" /></a>
          </div>   
        </div>
      </div>
    </div>
  </div>
</div>

    )
};

export default Contact;