import React from "react";

const Gallery = () => {
    return(
       <div className="container-fluid gallery py-5">
  <div className="container py-5">
    <div className="text-center mx-auto mb-5" style={{maxWidth: 800}}>
      <p className="fs-4 text-uppercase text-primary">Bộ Sưu Tập Hình Ảnh</p>
      <h1 className="display-4 mb-4">Khám Phá Bộ Sưu Tập Của Chúng Tôi</h1>
    </div>
    <div className="tab-class text-center">
      <ul className="nav nav-pills d-inline-flex justify-content-center mb-5 text-uppercase">
        <li className="nav-item">
          <a className="d-flex mx-3 py-2 border border-primary bg-light rounded-pill active" data-bs-toggle="pill" href="#tab-1">
            <span className="text-dark" style={{width: 150}}>Tất Cả</span>
          </a>
        </li>
        <li className="nav-item">
          <a className="d-flex py-2 mx-3 border border-primary bg-light rounded-pill" data-bs-toggle="pill" href="#tab-2">
            <span className="text-dark" style={{width: 150}}>Chăm Sóc Da</span>
          </a>
        </li>
        <li className="nav-item">
          <a className="d-flex mx-3 py-2 border border-primary bg-light rounded-pill" data-bs-toggle="pill" href="#tab-3">
            <span className="text-dark" style={{width: 150}}>Tắm Hơi</span>
          </a>
        </li>
        <li className="nav-item">
          <a className="d-flex mx-3 py-2 border border-primary bg-light rounded-pill" data-bs-toggle="pill" href="#tab-4">
            <span className="text-dark" style={{width: 150}}>Đá Nóng</span>
          </a>
        </li>
        <li className="nav-item">
          <a className="d-flex mx-3 py-2 border border-primary bg-light rounded-pill" data-bs-toggle="pill" href="#tab-5">
            <span className="text-dark" style={{width: 150}}>Massage Mặt</span>
          </a>
        </li>
      </ul>
      <div className="tab-content">
        <div id="tab-1" className="tab-pane fade show p-0 active">
          <div className="row g-4">
            <div className="col-lg-12">
              <div className="row g-4">
                <div className="col-lg-3">
                  <div className="gallery-img">
                    <img className="img-fluid rounded w-100" src="assets/img/gallery-1.jpg" alt />
                    <div className="gallery-overlay p-4">
                      <h4 className="text-primary">Chăm Sóc Da</h4>
                    </div>
                    <div className="search-icon">
                      <a href="assets/img/gallery-1.jpg" data-lightbox="Gallery-1" className="my-auto"><i className="fas fa-search-plus btn-primary btn-primary-outline-0 rounded-circle p-3" /></a>
                    </div>
                  </div>
                </div>
                <div className="col-lg-3">
                  <div className="gallery-img">
                    <img className="img-fluid rounded w-100" src="assets/img/gallery-2.jpg" alt />
                    <div className="gallery-overlay p-4">
                      <h4 className="text-primary">Tắm Hơi</h4>
                    </div>
                    <div className="search-icon">
                      <a href="assets/img/gallery-2.jpg" data-lightbox="Gallery-2" className="my-auto"><i className="fas fa-search-plus btn-primary btn-primary-outline-0 rounded-circle p-3" /></a>
                    </div>
                  </div>
                </div>
                <div className="col-lg-3">
                  <div className="gallery-img">
                    <img className="img-fluid rounded w-100" src="assets/img/gallery-3.jpg" alt />
                    <div className="gallery-overlay p-4">
                      <h4 className="text-primary">Liệu Pháp Đá Nóng</h4>
                    </div>
                    <div className="search-icon">
                      <a href="assets/img/gallery-3.jpg" data-lightbox="Gallery-3" className="my-auto"><i className="fas fa-search-plus btn-primary btn-primary-outline-0 rounded-circle p-3" /></a>
                    </div>
                  </div>
                </div>
                <div className="col-lg-3">
                  <div className="gallery-img">
                    <img className="img-fluid rounded w-100" src="assets/img/gallery-4.jpg" alt />
                    <div className="gallery-overlay p-4">
                      <h4 className="text-primary">Massage Mặt</h4>
                    </div>
                    <div className="search-icon">
                      <a href="assets/img/gallery-4.jpg" data-lightbox="Gallery-4" className="my-auto"><i className="fas fa-search-plus btn-primary btn-primary-outline-0 rounded-circle p-3" /></a>
                    </div>
                  </div>
                </div>
                <div className="col-lg-3">
                  <div className="gallery-img">
                    <img className="img-fluid rounded w-100" src="assets/img/gallery-5.jpg" alt />
                    <div className="gallery-overlay p-4">
                      <h4 className="text-primary">Chăm Sóc Da</h4>
                    </div>
                    <div className="search-icon">
                      <a href="assets/img/gallery-5.jpg" data-lightbox="Gallery-5" className="my-auto"><i className="fas fa-search-plus btn-primary btn-primary-outline-0 rounded-circle p-3" /></a>
                    </div>
                  </div>
                </div>
                <div className="col-lg-3">
                  <div className="gallery-img">
                    <img className="img-fluid rounded w-100" src="assets/img/gallery-6.jpg" alt />
                    <div className="gallery-overlay p-4">
                      <h4 className="text-primary">Tắm Hơi</h4>
                    </div>
                    <div className="search-icon">
                      <a href="assets/img/gallery-6.jpg" data-lightbox="Gallery-6" className="my-auto"><i className="fas fa-search-plus btn-primary btn-primary-outline-0 rounded-circle p-3" /></a>
                    </div>
                  </div>
                </div>
                <div className="col-lg-3">
                  <div className="gallery-img">
                    <img className="img-fluid rounded w-100" src="assets/img/gallery-7.jpg" alt />
                    <div className="gallery-overlay p-4">
                      <h4 className="text-primary">Liệu Pháp Đá Nóng</h4>
                    </div>
                    <div className="search-icon">
                      <a href="assets/img/gallery-7.jpg" data-lightbox="Gallery-7" className="my-auto"><i className="fas fa-search-plus btn-primary btn-primary-outline-0 rounded-circle p-3" /></a>
                    </div>
                  </div>
                </div>
                <div className="col-lg-3">
                  <div className="gallery-img">
                    <img className="img-fluid rounded w-100" src="assets/img/gallery-8.jpg" alt />
                    <div className="gallery-overlay p-4">
                      <h4 className="text-primary">Massage Mặt</h4>
                    </div>
                    <div className="search-icon">
                      <a href="assets/img/gallery-8.jpg" data-lightbox="Gallery-8" className="my-auto"><i className="fas fa-search-plus btn-primary btn-primary-outline-0 rounded-circle p-3" /></a>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
        <div id="tab-2" className="tab-pane fade show p-0">
          <div className="row g-4">
            <div className="col-lg-12">
              <div className="row g-4">
                <div className="col-lg-3">
                  <div className="gallery-img">
                    <img className="img-fluid rounded w-100" src="assets/img/gallery-9.jpg" alt />
                    <div className="gallery-overlay p-4">
                      <h4 className="text-primary">Chăm Sóc Da</h4>
                    </div>
                    <div className="search-icon">
                      <a href="assets/img/gallery-9.jpg" data-lightbox="Gallery-9" className="my-auto"><i className="fas fa-search-plus btn-primary btn-primary-outline-0 rounded-circle p-3" /></a>
                    </div>
                  </div>
                </div>
                <div className="col-lg-3">
                  <div className="gallery-img">
                    <img className="img-fluid rounded w-100" src="assets/img/gallery-10.jpg" alt />
                    <div className="gallery-overlay p-4">
                      <h4 className="text-primary">Chăm Sóc Da</h4>
                    </div>
                    <div className="search-icon">
                      <a href="assets/img/gallery-10.jpg" data-lightbox="Gallery-10" className="my-auto"><i className="fas fa-search-plus btn-primary btn-primary-outline-0 rounded-circle p-3" /></a>
                    </div>
                  </div>
                </div>
                <div className="col-lg-3">
                  <div className="gallery-img">
                    <img className="img-fluid rounded w-100" src="assets/img/gallery-5.jpg" alt />
                    <div className="gallery-overlay p-4">
                      <h4 className="text-primary">Chăm Sóc Da</h4>
                    </div>
                    <div className="search-icon">
                      <a href="assets/img/gallery-5.jpg" data-lightbox="Gallery-11" className="my-auto"><i className="fas fa-search-plus btn-primary btn-primary-outline-0 rounded-circle p-3" /></a>
                    </div>
                  </div>
                </div>
                <div className="col-lg-3">
                  <div className="gallery-img">
                    <img className="img-fluid rounded w-100" src="assets/img/gallery-1.jpg" alt />
                    <div className="gallery-overlay p-4">
                      <h4 className="text-primary">Chăm Sóc Da</h4>
                    </div>
                    <div className="search-icon">
                      <a href="assets/img/gallery-1.jpg" data-lightbox="Gallery-12" className="my-auto"><i className="fas fa-search-plus btn-primary btn-primary-outline-0 rounded-circle p-3" /></a>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
        <div id="tab-3" className="tab-pane fade show p-0">
          <div className="row g-4">
            <div className="col-lg-12">
              <div className="row g-4">
                <div className="col-lg-3">
                  <div className="gallery-img">
                    <img className="img-fluid rounded w-100" src="assets/img/gallery-11.jpg" alt />
                    <div className="gallery-overlay p-4">
                      <h4 className="text-primary">Tắm Hơi</h4>
                    </div>
                    <div className="search-icon">
                      <a href="assets/img/gallery-11.jpg" data-lightbox="Gallery-13" className="my-auto"><i className="fas fa-search-plus btn-primary btn-primary-outline-0 rounded-circle p-3" /></a>
                    </div>
                  </div>
                </div>
                <div className="col-lg-3">
                  <div className="gallery-img">
                    <img className="img-fluid rounded w-100" src="assets/img/gallery-12.jpg" alt />
                    <div className="gallery-overlay p-4">
                      <h4 className="text-primary">Tắm Hơi</h4>
                    </div>
                    <div className="search-icon">
                      <a href="assets/img/gallery-12.jpg" data-lightbox="Gallery-14" className="my-auto"><i className="fas fa-search-plus btn-primary btn-primary-outline-0 rounded-circle p-3" /></a>
                    </div>
                  </div>
                </div>
                <div className="col-lg-3">
                  <div className="gallery-img">
                    <img className="img-fluid rounded w-100" src="assets/img/gallery-2.jpg" alt />
                    <div className="gallery-overlay p-4">
                      <h4 className="text-primary">Tắm Hơi</h4>
                    </div>
                    <div className="search-icon">
                      <a href="assets/img/gallery-2.jpg" data-lightbox="Gallery-15" className="my-auto"><i className="fas fa-search-plus btn-primary btn-primary-outline-0 rounded-circle p-3" /></a>
                    </div>
                  </div>
                </div>
                <div className="col-lg-3">
                  <div className="gallery-img">
                    <img className="img-fluid rounded w-100" src="assets/img/gallery-6.jpg" alt />
                    <div className="gallery-overlay p-4">
                      <h4 className="text-primary">Tắm Hơi</h4>
                    </div>
                    <div className="search-icon">
                      <a href="assets/img/gallery-6.jpg" data-lightbox="Gallery-16" className="my-auto"><i className="fas fa-search-plus btn-primary btn-primary-outline-0 rounded-circle p-3" /></a>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
        <div id="tab-4" className="tab-pane fade show p-0">
          <div className="row g-4">
            <div className="col-lg-12">
              <div className="row g-4">
                <div className="col-lg-3">
                  <div className="gallery-img">
                    <img className="img-fluid rounded w-100" src="assets/img/gallery-13.jpg" alt />
                    <div className="gallery-overlay p-4">
                      <h4 className="text-primary">Liệu Pháp Đá Nóng</h4>
                    </div>
                    <div className="search-icon">
                      <a href="assets/img/gallery-13.jpg" data-lightbox="Gallery-17" className="my-auto"><i className="fas fa-search-plus btn-primary btn-primary-outline-0 rounded-circle p-3" /></a>
                    </div>
                  </div>
                </div>
                <div className="col-lg-3">
                  <div className="gallery-img">
                    <img className="img-fluid rounded w-100" src="assets/img/gallery-2.jpg" alt />
                    <div className="gallery-overlay p-4">
                      <h4 className="text-primary">Liệu Pháp Đá Nóng</h4>
                    </div>
                    <div className="search-icon">
                      <a href="assets/img/gallery-2.jpg" data-lightbox="Gallery-18" className="my-auto"><i className="fas fa-search-plus btn-primary btn-primary-outline-0 rounded-circle p-3" /></a>
                    </div>
                  </div>
                </div>
                <div className="col-lg-3">
                  <div className="gallery-img">
                    <img className="img-fluid rounded w-100" src="assets/img/gallery-3.jpg" alt />
                    <div className="gallery-overlay p-4">
                      <h4 className="text-primary">Liệu Pháp Đá Nóng</h4>
                    </div>
                    <div className="search-icon">
                      <a href="assets/img/gallery-3.jpg" data-lightbox="Gallery-19" className="my-auto"><i className="fas fa-search-plus btn-primary btn-primary-outline-0 rounded-circle p-3" /></a>
                    </div>
                  </div>
                </div>
                <div className="col-lg-3">
                  <div className="gallery-img">
                    <img className="img-fluid rounded w-100" src="assets/img/gallery-7.jpg" alt />
                    <div className="gallery-overlay p-4">
                      <h4 className="text-primary">Liệu Pháp Đá Nóng</h4>
                    </div>
                    <div className="search-icon">
                      <a href="assets/img/gallery-7.jpg" data-lightbox="Gallery-20" className="my-auto"><i className="fas fa-search-plus btn-primary btn-primary-outline-0 rounded-circle p-3" /></a>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
        <div id="tab-5" className="tab-pane fade show p-0">
          <div className="row g-4">
            <div className="col-lg-12">
              <div className="row g-4">
                <div className="col-lg-3">
                  <div className="gallery-img">
                    <img className="img-fluid rounded w-100" src="assets/img/gallery-4.jpg" alt />
                    <div className="gallery-overlay p-4">
                      <h4 className="text-primary">Massage Mặt</h4>
                    </div>
                    <div className="search-icon">
                      <a href="assets/img/gallery-4.jpg" data-lightbox="Gallery-21" className="my-auto"><i className="fas fa-search-plus btn-primary btn-primary-outline-0 rounded-circle p-3" /></a>
                    </div>
                  </div>
                </div>
                <div className="col-lg-3">
                  <div className="gallery-img">
                    <img className="img-fluid rounded w-100" src="assets/img/gallery-6.jpg" alt />
                    <div className="gallery-overlay p-4">
                      <h4 className="text-primary">Massage Mặt</h4>
                    </div>
                    <div className="search-icon">
                      <a href="assets/img/gallery-6.jpg" data-lightbox="Gallery-22" className="my-auto"><i className="fas fa-search-plus btn-primary btn-primary-outline-0 rounded-circle p-3" /></a>
                    </div>
                  </div>
                </div>
                <div className="col-lg-3">
                  <div className="gallery-img">
                    <img className="img-fluid rounded w-100" src="assets/img/gallery-8.jpg" alt />
                    <div className="gallery-overlay p-4">
                      <h4 className="text-primary">Massage Mặt</h4>
                    </div>
                    <div className="search-icon">
                      <a href="assets/img/gallery-8.jpg" data-lightbox="Gallery-23" className="my-auto"><i className="fas fa-search-plus btn-primary btn-primary-outline-0 rounded-circle p-3" /></a>
                    </div>
                  </div>
                </div>
                <div className="col-lg-3">
                  <div className="gallery-img">
                    <img className="img-fluid rounded w-100" src="assets/img/gallery-14.jpg" alt />
                    <div className="gallery-overlay p-4">
                      <h4 className="text-primary">Massage Mặt</h4>
                    </div>
                    <div className="search-icon">
                      <a href="assets/img/gallery-14.jpg" data-lightbox="Gallery-24" className="my-auto"><i className="fas fa-search-plus btn-primary btn-primary-outline-0 rounded-circle p-3" /></a>
                    </div>
                  </div>
                </div>
                <div className="col-lg-3">
                  <div className="gallery-img">
                    <img className="img-fluid rounded w-100" src="assets/img/gallery-4.jpg" alt />
                    <div className="gallery-overlay p-4">
                      <h4 className="text-primary">Massage Mặt</h4>
                    </div>
                    <div className="search-icon">
                      <a href="assets/img/gallery-4.jpg" data-lightbox="Gallery-25" className="my-auto"><i className="fas fa-search-plus btn-primary btn-primary-outline-0 rounded-circle p-3" /></a>
                    </div>
                  </div>
                </div>
                <div className="col-lg-3">
                  <div className="gallery-img">
                    <img className="img-fluid rounded w-100" src="assets/img/gallery-8.jpg" alt />
                    <div className="gallery-overlay p-4">
                      <h4 className="text-primary">Massage Mặt</h4>
                    </div>
                    <div className="search-icon">
                      <a href="assets/img/gallery-8.jpg" data-lightbox="Gallery-26" className="my-auto"><i className="fas fa-search-plus btn-primary btn-primary-outline-0 rounded-circle p-3" /></a>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</div>

    )
}

export default Gallery;