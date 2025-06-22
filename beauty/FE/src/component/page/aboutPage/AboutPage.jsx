import React from "react";
import Header from "../../shared/header";
import Footer from "../../shared/footer";

const AboutPage = () => {
    return (
        <div>
            <Header />
            <div className="container-fluid bg-breadcrumb py-5">
                <div className="container text-center py-5">
                    <h3 className="text-white display-3 mb-4">Về Chúng Tôi</h3>
                    <ol className="breadcrumb justify-content-center mb-0">
                        <li className="breadcrumb-item"><a href="/">Trang Chủ</a></li>
                        <li className="breadcrumb-item"><a href="#">Trang</a></li>
                        <li className="breadcrumb-item active text-white">Về Chúng Tôi</li>
                    </ol>
                </div>
            </div>

            <div className="container-fluid about py-5">
                <div className="container py-5">
                    <div className="row g-5 align-items-center">
                        <div className="col-lg-5">
                            <div className="video">
                                <img src="assets/img/about-1.jpg" className="img-fluid rounded" alt />
                                <div className="position-absolute rounded border-5 border-top border-start border-white" style={{ bottom: 0, right: 0 }}>
                                    <img src="assets/img/about-2.jpg" className="img-fluid rounded" alt />
                                </div>
                                <button type="button" className="btn btn-play" data-bs-toggle="modal" data-src="https://www.youtube.com/embed/DWRcNpR6Kdc" data-bs-target="#videoModal">
                                    <span />
                                </button>
                            </div>
                        </div>
                        <div className="col-lg-7">
                            <div>
                                <p className="fs-4 text-uppercase text-primary">Về Chúng Tôi</p>
                                <h1 className="display-4 mb-4">Trung Tâm Spa, Làm Đẹp &amp; Chăm Sóc Da Tốt Nhất</h1>
                                <p className="mb-4">Chúng tôi là trung tâm spa hàng đầu với đội ngũ chuyên gia giàu kinh nghiệm, cam kết mang đến cho bạn những dịch vụ chăm sóc sức khỏe và sắc đẹp tốt nhất với công nghệ hiện đại nhất.
                                </p>
                                <div className="row g-4">
                                    <div className="col-md-6">
                                        <div className="d-flex align-items-center">
                                            <i className="fab fa-gitkraken fa-3x text-primary" />
                                            <div className="ms-4">
                                                <h5 className="mb-2">Ưu Đãi Đặc Biệt</h5>
                                                <p className="mb-0">Chúng tôi luôn có những chương trình khuyến mãi hấp dẫn và ưu đãi đặc biệt dành cho khách hàng thân thiết.</p>
                                            </div>
                                        </div>
                                    </div>
                                    <div className="col-md-6">
                                        <div className="d-flex align-items-center">
                                            <i className="fas fa-gift fa-3x text-primary" />
                                            <div className="ms-4">
                                                <h5 className="mb-2">Quà Tặng Đặc Biệt</h5>
                                                <p className="mb-0">Nhận những món quà tặng giá trị và bất ngờ khi sử dụng dịch vụ tại trung tâm của chúng tôi.</p>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                                <p className="my-4">Với không gian sang trọng, trang thiết bị hiện đại và quy trình dịch vụ chuyên nghiệp, chúng tôi tự hào là địa chỉ tin cậy cho mọi nhu cầu làm đẹp của bạn.
                                </p>
                                <p className="mb-4">Đến với chúng tôi, bạn không chỉ được trải nghiệm những liệu pháp chăm sóc đẳng cấp mà còn được tận hưởng không gian thư giãn tuyệt vời, giúp bạn lấy lại năng lượng và sự tự tin trong cuộc sống.
                                </p>
                            </div>
                            <a href="/ServicePage" className="btn btn-primary btn-primary-outline-0 rounded-pill py-3 px-5">Khám Phá Thêm</a>
                        </div>
                    </div>
                </div>
            </div>
            {/* Modal Video */}
            <div className="modal fade" id="videoModal" tabIndex={-1} aria-labelledby="exampleModalLabel" aria-hidden="true">
                <div className="modal-dialog">
                    <div className="modal-content rounded-0">
                        <div className="modal-header">
                            <h5 className="modal-title" id="exampleModalLabel">Video Giới Thiệu</h5>
                            <button type="button" className="btn-close" data-bs-dismiss="modal" aria-label="Đóng" />
                        </div>
                        <div className="modal-body">
                            {/* 16:9 aspect ratio */}
                            <div className="ratio ratio-16x9">
                                <iframe className="embed-responsive-item" src id="video" allowFullScreen allowscriptaccess="always" allow="autoplay" />
                            </div>
                        </div>
                    </div>
                </div>
            </div>
            <Footer />
        </div>

    )
}
export default AboutPage;