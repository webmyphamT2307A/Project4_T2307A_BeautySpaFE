import React from "react";

const AboutUs = () => {
    return(
       <div>
  {/* About Start */}
  <div className="container-fluid about py-5">
    <div className="container py-5">
      <div className="row g-5 align-items-center">
        <div className="col-lg-5">
          <div className="video">
            <img src="assets/img/about-1.jpg" className="img-fluid rounded" alt />
            <div className="position-absolute rounded border-5 border-top border-start border-white" style={{bottom: 0, right: 0}}>
              <img src="assets/img/about-2.jpg" className="img-fluid rounded" alt />
            </div>
            <button type="button" className="btn btn-play" data-bs-toggle="modal" data-src="https://www.youtube.com/embed/DWRcNpR6Kdc" data-bs-target="#videoModal">
              <span />
            </button>
          </div>
        </div>
        <div className="col-lg-7">
          <p className="fs-4 text-uppercase text-primary">Về Chúng Tôi</p>
          <h1 className="display-4 mb-4">Trung Tâm Spa, Làm Đẹp &amp; Chăm Sóc Da Tốt Nhất</h1>
          <p className="mb-4">Sparlex là điểm đến lý tưởng cho những ai muốn tìm kiếm sự thư giãn và làm đẹp hoàn hảo. Với đội ngũ chuyên gia giàu kinh nghiệm và các liệu pháp hiện đại, chúng tôi cam kết mang đến cho bạn trải nghiệm spa đẳng cấp nhất.
          </p>
          <div className="row g-4">
            <div className="col-md-6">
              <div className="d-flex align-items-center">
                <i className="fas fa-spa fa-3x text-primary" />
                <div className="ms-4">
                  <h5 className="mb-2">Dịch Vụ Chuyên Nghiệp</h5>
                  <p className="mb-0">Đội ngũ chuyên gia với hơn 10 năm kinh nghiệm trong lĩnh vực spa và làm đẹp, luôn cập nhật các xu hướng mới nhất.</p>
                </div>
              </div>
            </div>
            <div className="col-md-6">
              <div className="d-flex align-items-center">
                <i className="fas fa-gift fa-3x text-primary" />
                <div className="ms-4">
                  <h5 className="mb-2">Ưu Đãi Đặc Biệt</h5>
                  <p className="mb-0">Nhiều chương trình khuyến mãi hấp dẫn cho khách hàng thân thiết và gói combo tiết kiệm cho các dịch vụ.</p>
                </div>
              </div>
            </div>
          </div>
          <p className="my-4">Với không gian sang trọng, thiết bị hiện đại và sản phẩm chăm sóc cao cấp từ các thương hiệu uy tín quốc tế, Sparlex mang đến cho bạn những giây phút thư giãn tuyệt vời nhất.
          </p>
          <p className="mb-4">Chúng tôi cung cấp đa dạng các dịch vụ từ massage, chăm sóc da mặt, làm móng, tẩy lông đến các liệu pháp trị liệu chuyên sâu. Mỗi dịch vụ đều được thiết kế riêng biệt phù hợp với nhu cầu và mong muốn của từng khách hàng.
          </p>
          <a href="#" 
             className="btn btn-primary btn-primary-outline-0 rounded-pill py-3 px-5"
             style={{
               background: 'linear-gradient(135deg, #FDB5B9, #f89ca0) !important',
               border: 'none !important',
               boxShadow: '0 6px 20px rgba(253, 181, 185, 0.3)',
               color: 'white !important',
               fontWeight: '600',
               fontSize: '1rem',
               letterSpacing: '0.3px',
               transition: 'all 0.3s ease',
               textDecoration: 'none',
               position: 'relative',
               overflow: 'hidden'
             }}
             onMouseEnter={(e) => {
               e.target.style.setProperty('background', 'linear-gradient(135deg, #F7A8B8, #E589A3)', 'important');
               e.target.style.setProperty('border', 'none', 'important');
               e.target.style.transform = 'translateY(-3px) scale(1.05)';
               e.target.style.boxShadow = '0 12px 30px rgba(253, 181, 185, 0.5)';
             }}
             onMouseLeave={(e) => {
               e.target.style.setProperty('background', 'linear-gradient(135deg, #FDB5B9, #f89ca0)', 'important');
               e.target.style.setProperty('border', 'none', 'important');
               e.target.style.transform = 'translateY(0) scale(1)';
               e.target.style.boxShadow = '0 6px 20px rgba(253, 181, 185, 0.3)';
             }}
             onMouseDown={(e) => {
               e.target.style.transform = 'translateY(-1px) scale(1.02)';
             }}
             onMouseUp={(e) => {
               e.target.style.transform = 'translateY(-3px) scale(1.05)';
             }}
          >
            Khám Phá Thêm
          </a>
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
  {/* About End */}
</div>

    )
}
export default AboutUs;