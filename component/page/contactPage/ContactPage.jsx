import React from "react";
import Header from "../../shared/header";
import Footer from "../../shared/footer";

const ContactPage = () => {
    return (
        <div>
            <Header />
            <div className="container-fluid bg-breadcrumb py-5">
                <div className="container text-center py-5">
                    <h3 className="text-white display-3 mb-4">Contact Us</h3>
                    <ol className="breadcrumb justify-content-center mb-0">
                        <li className="breadcrumb-item"><a href="index.html">Home</a></li>
                        <li className="breadcrumb-item"><a href="#">Pages</a></li>
                        <li className="breadcrumb-item active text-white">Contact</li>
                    </ol>
                </div>
            </div>

            <div className="container-fluid contact py-5" style={{ background: 'var(--bs-primary)' }}>
                <div className="container pt-5">
                    <div className="row g-4 align-items-center">
                        <div className="col-lg-6">
                            <div className="text-center">
                                <h1 className="display-3 text-white mb-4">Contact Us</h1>
                                <p className="text-white fs-4">The contact form is currently inactive. Get a functional and working contact form with Ajax &amp; PHP in a few minutes. Just copy and paste the files, add a little code and you're done. <a className="text-secondary" href="https://htmlcodex.com/contact-form">Download Now</a>.</p>
                            </div>
                        </div>
                        <div className="col-lg-6">
                            <div className="contact-form rounded p-5">
                                <form>
                                    <h1 className="display-6 mb-4">Do You have Any Questions?</h1>
                                    <div className="row gx-4 gy-3">
                                        <div className="col-xl-6">
                                            <input type="text" className="form-control bg-white border-0 py-3 px-4" placeholder="Your First Name" />
                                        </div>
                                        <div className="col-xl-6">
                                            <input type="email" className="form-control bg-white border-0 py-3 px-4" placeholder="Your Email" />
                                        </div>
                                        <div className="col-xl-6">
                                            <input type="text" className="form-control bg-white border-0 py-3 px-4" placeholder="Your Phone" />
                                        </div>
                                        <div className="col-xl-6">
                                            <input type="text" className="form-control bg-white border-0 py-3 px-4" placeholder="Subject" />
                                        </div>
                                        <div className="col-12">
                                            <textarea className="form-control bg-white border-0 py-3 px-4" rows={4} cols={10} placeholder="Your Message" defaultValue={""} />
                                        </div>
                                        <div className="col-12">
                                            <button className="btn btn-primary btn-primary-outline-0 w-100 py-3 px-5" type="submit">Submit</button>
                                        </div>
                                    </div>
                                </form>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
            <div className="container-fluid pb-5">
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
                                <iframe className="rounded-top w-100" style={{ height: 450, marginBottom: '-6px' }} src="https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d387191.33750346623!2d-73.97968099999999!3d40.6974881!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x89c24fa5d33f083b%3A0xc80b8f06e177fe62!2sNew%20York%2C%20NY%2C%20USA!5e0!3m2!1sen!2sbd!4v1694259649153!5m2!1sen!2sbd" loading="lazy" referrerPolicy="no-referrer-when-downgrade" />
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
            <Footer />
        </div>

    )
}

export default ContactPage;