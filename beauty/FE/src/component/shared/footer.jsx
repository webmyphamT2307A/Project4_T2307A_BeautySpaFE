import React from "react";

const Footer = () => {
    return (
        <div className="container-fluid footer py-5">
            <div className="container py-5">
                <div className="row g-5">
                    <div className="col-md-6 col-lg-6 col-xl-3">
                        <div className="footer-item">
                            <h4 className="mb-4 text-white">Newsletter</h4>
                            <p className="text-white">Dolor amet sit justo amet elitr clita ipsum elitr est.Lorem ipsum dolor sit amet, consectetur adipiscing elit. Nullam in tempor dui, non consectetur enim.</p>
                            <div className="position-relative mx-auto rounded-pill">
                                <input className="form-control rounded-pill border-0 w-100 py-3 ps-4 pe-5" type="text" placeholder="Enter your email" />
                                <button type="button" className="btn btn-primary btn-primary-outline-0 rounded-pill position-absolute top-0 end-0 py-2 mt-2 me-2">SignUp</button>
                            </div>
                        </div>
                    </div>
                    <div className="col-md-6 col-lg-6 col-xl-3">
                        <div className="footer-item d-flex flex-column">
                            <h4 className="mb-4 text-white">Our Services</h4>
                            <a href><i className="fas fa-angle-right me-2" /> Facials</a>
                            <a href><i className="fas fa-angle-right me-2" /> Waxing</a>
                            <a href><i className="fas fa-angle-right me-2" /> Message</a>
                            <a href><i className="fas fa-angle-right me-2" /> Minarel baths</a>
                            <a href><i className="fas fa-angle-right me-2" /> Body treatments</a>
                            <a href><i className="fas fa-angle-right me-2" /> Aroma Therapy</a>
                            <a href><i className="fas fa-angle-right me-2" /> Stone Spa</a>
                        </div>
                    </div>
                    <div className="col-md-6 col-lg-6 col-xl-3">
                        <div className="footer-item d-flex flex-column">
                            <h4 className="mb-4 text-white">Schedule</h4>
                            <p className="text-muted mb-0">Monday: <span className="text-white"> 09:00 am – 10:00 pm</span></p>
                            <p className="text-muted mb-0">Saturday: <span className="text-white"> 09:00 am – 08:00 pm</span></p>
                            <p className="text-muted mb-0">Sunday: <span className="text-white"> 09:00 am – 05:00 pm</span></p>
                            <h4 className="my-4 text-white">Address</h4>
                            <p className="mb-0"><i className="fas fa-map-marker-alt  me-2" /> 123 ranking street North tower New York, USA</p>
                        </div>
                    </div>
                    <div className="col-md-6 col-lg-6 col-xl-3">
                        <div className="footer-item d-flex flex-column">
                            <h4 className="mb-4 text-white">Follow Us</h4>
                            <a href><i className="fas fa-angle-right me-2" /> Faceboock</a>
                            <a href><i className="fas fa-angle-right me-2" /> Instagram</a>
                            <a href><i className="fas fa-angle-right me-2" /> Twitter</a>
                            <h4 className="my-4 text-white">Contact Us</h4>
                            <p className="mb-0"><i className="fas fa-envelope  me-2" /> info@example.com</p>
                            <p className="mb-0"><i className="fas fa-phone  me-2" /> (+012) 3456 7890 123</p>
                        </div>
                    </div>
                </div>
            </div>
            <div className="container-fluid copyright py-4">
                <div className="container">
                    <div className="row g-4 align-items-center">
                        <div className="col-md-4 text-center text-md-start mb-md-0">
                            <span className="text-light"><a href="#"><i className="fas fa-copyright text-light me-2" />Sparlex</a>, All right reserved.</span>
                        </div>
                        <div className="col-md-4">
                            <div className="d-flex justify-content-center">
                                <a href className="btn btn-light btn-light-outline-0 btn-sm-square rounded-circle me-2"><i className="fab fa-facebook-f" /></a>
                                <a href className="btn btn-light btn-light-outline-0 btn-sm-square rounded-circle me-2"><i className="fab fa-twitter" /></a>
                                <a href className="btn btn-light btn-light-outline-0 btn-sm-square rounded-circle me-2"><i className="fab fa-instagram" /></a>
                                <a href className="btn btn-light btn-light-outline-0 btn-sm-square rounded-circle me-0"><i className="fab fa-linkedin-in" /></a>
                            </div>
                        </div>
                        <div className="col-md-4 text-center text-md-end text-white">
                            {/*/*** This template is free as long as you keep the below author’s credit link/attribution link/backlink. *** /*/}
                            {/*/*** If you'd like to use the template without the below author’s credit link/attribution link/backlink, *** /*/}
                            {/*/*** you can purchase the Credit Removal License from "https://htmlcodex.com/credit-removal". *** /*/}
                            Designed By <a className="border-bottom" href="https://htmlcodex.com">HTML Codex</a> Distributed By <a className="border-bottom" href="https://themewagon.com">ThemeWagon</a>
                        </div>
                    </div>
                </div>
            </div>

        </div>

    )
}
export default Footer;