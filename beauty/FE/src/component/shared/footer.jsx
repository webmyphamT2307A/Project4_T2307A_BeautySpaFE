import React from "react";
import { Link } from "react-router-dom";

const Footer = () => {
    return (
        <div className="container-fluid footer py-5">
            <div className="container py-5">
                <div className="row g-5">
                    <div className="col-md-6 col-lg-6 col-xl-3">
                        <div className="footer-item">
                            <h4 className="mb-4 text-white">Bản tin</h4>
                            <p className="text-white">Chúng tôi cam kết mang đến cho bạn những dịch vụ spa và làm đẹp tốt nhất. Hãy theo dõi chúng tôi để cập nhật những thông tin mới nhất về các dịch vụ và ưu đãi đặc biệt.</p>
                            
                        </div>
                    </div>
                    <div className="col-md-6 col-lg-6 col-xl-3">
                        <div className="footer-item d-flex flex-column">
                            <h4 className="mb-4 text-white">Menu</h4>
                            <Link to="/" className="nav-item nav-link text-white mb-2">Trang chủ</Link>
                            <Link to="/AboutPage" className="nav-item nav-link text-white mb-2">Giới thiệu</Link>
                            <Link to="/ServicePage" className="nav-item nav-link text-white mb-2">Dịch vụ</Link>
                            <Link to="/ContactPage" className="nav-item nav-link text-white mb-2">Liên hệ</Link>
                            
                        </div>
                    </div>
                    <div className="col-md-6 col-lg-6 col-xl-3">
                        <div className="footer-item d-flex flex-column">
                            <h4 className="mb-4 text-white">Lịch làm việc</h4>
                            <p className="text-muted mb-0">Thứ hai: <span className="text-white"> 09:00 sáng – 10:00 tối</span></p>
                            <p className="text-muted mb-0">Thứ bảy: <span className="text-white"> 09:00 sáng – 08:00 tối</span></p>
                            <p className="text-muted mb-0">Chủ nhật: <span className="text-white"> 09:00 sáng – 05:00 tối</span></p>
                            <h4 className="my-4 text-white">Địa chỉ</h4>
                            <p className="mb-0"><i className="fas fa-map-marker-alt  me-2" /> 123 đường Ranking, tòa nhà North, New York, USA</p>
                        </div>
                    </div>
                    <div className="col-md-6 col-lg-6 col-xl-3">
                        <div className="footer-item d-flex flex-column">
                            <h4 className="mb-4 text-white">Theo dõi chúng tôi</h4>
                            <a href="#" className="text-white mb-2 text-decoration-none"><i className="fab fa-facebook-f me-2" /> Facebook</a>
                            <a href="#" className="text-white mb-2 text-decoration-none"><i className="fab fa-instagram me-2" /> Instagram</a>
                            <a href="#" className="text-white mb-2 text-decoration-none"><i className="fab fa-twitter me-2" /> Twitter</a>
                            <h4 className="my-4 text-white">Liên hệ với chúng tôi</h4>
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
                            <span className="text-light"><a href="#"><i className="fas fa-copyright text-light me-2" />Sparlex</a>, Bảo lưu mọi quyền.</span>
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
                          
                            Thiết kế bởi <a className="border-bottom" href="https://htmlcodex.com">HTML Codex</a> Phân phối bởi <a className="border-bottom" href="https://themewagon.com">ThemeWagon</a>
                        </div>
                    </div>
                </div>
            </div>

        </div>

    )
}
export default Footer;