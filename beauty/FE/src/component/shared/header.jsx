
const Header = () => {
    return (
        //header
        <div>
            <div className="container-fluid sticky-top px-0">
                <div className="container-fluid topbar d-none d-lg-block">
                    <div className="container px-0">
                        <div className="row align-items-center">
                            <div className="col-lg-8">
                                <div className="d-flex flex-wrap">
                                    <a href="#" className="me-4 "><i className="fas fa-map-marker-alt  me-2" />Find A Location</a>
                                    <a href="#" className="me-4 "><i className="fas fa-phone-alt  me-2" />+01234567890</a>
                                    <a href="#" className=""><i className="fas fa-envelope me-2" />Example@gmail.com</a>
                                </div>
                            </div>
                            <div className="col-lg-4">
                                <div className="d-flex align-items-center justify-content-end">
                                    <a href="#" className="me-3 btn-square border rounded-circle nav-fill"><i className="fab fa-facebook-f" /></a>
                                    <a href="#" className="me-3 btn-square border rounded-circle nav-fill"><i className="fab fa-twitter" /></a>
                                    <a href="#" className="me-3 btn-square border rounded-circle nav-fill"><i className="fab fa-instagram" /></a>
                                    <a href="#" className="btn-square border rounded-circle nav-fill"><i className="fab fa-linkedin-in" /></a>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
                <div className="container-fluid bg-light">
                    <div className="container px-0">
                        <nav className="navbar navbar-light navbar-expand-xl">
                            <a href="/" className="navbar-brand">
                                <h1 className="text-primary display-4">Sparlex</h1>
                            </a>
                            <button className="navbar-toggler py-2 px-3" type="button" data-bs-toggle="collapse" data-bs-target="#navbarCollapse">
                                <span className="fa fa-bars text-primary" />
                            </button>
                            <div className="collapse navbar-collapse bg-light py-3" id="navbarCollapse">
                                <div className="navbar-nav mx-auto border-top">
                                    <a href="/" className="nav-item nav-link active">Home</a>
                                    <a href="AboutPage" className="nav-item nav-link">About</a>
                                    <a href="ServicePage" className="nav-item nav-link">Services</a>
                                    <div className="nav-item dropdown">
                                        <a href="#" className="nav-link dropdown-toggle" data-bs-toggle="dropdown">Pages</a>
                                        <div className="dropdown-menu m-0 bg-secondary rounded-0">
                                            <a href="TeamPage" className="dropdown-item">Team</a>
                                            <a href="TerminalPage" className="dropdown-item">Testimonial</a>
                                            <a href="GaleryPage" className="dropdown-item">Gallery</a>
                                            <a href="AppointmentPage" className="dropdown-item">Appointment</a>
                                            <a href="ErrorPage" className="dropdown-item">404 page</a>
                                        </div>
                                    </div>
                                    <a href="ContactPage" className="nav-item nav-link">Contact Us</a>
                                </div>
                                <div className="d-flex align-items-center flex-nowrap pt-xl-0">
                                    <button className="btn-search btn btn-primary btn-primary-outline-0 rounded-circle btn-lg-square" data-bs-toggle="modal" data-bs-target="#searchModal"><i className="fas fa-search" /></button>
                                    <a href="AppointmentPage" className="btn btn-primary btn-primary-outline-0 rounded-pill py-3 px-4 ms-4">Book Appointment</a>
                                </div>
                            </div>
                        </nav>
                    </div>
                </div>
            </div>

            {/* <!-- Search Modal --> */}
            <div className="modal fade" id="searchModal" tabIndex={-1} aria-labelledby="exampleModalLabel" aria-hidden="true">
                <div className="modal-dialog modal-fullscreen">
                    <div className="modal-content rounded-0">
                        <div className="modal-header">
                            <h4 className="modal-title mb-0" id="exampleModalLabel">Search by keyword</h4>
                            <button type="button" className="btn-close" data-bs-dismiss="modal" aria-label="Close" />
                        </div>
                        <div className="modal-body d-flex align-items-center">
                            <div className="input-group w-75 mx-auto d-flex">
                                <input type="search" className="form-control p-3" placeholder="keywords" aria-describedby="search-icon-1" />
                                <span id="search-icon-1" className="input-group-text p-3"><i className="fa fa-search" /></span>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

        </div>
    );
}
export default Header;