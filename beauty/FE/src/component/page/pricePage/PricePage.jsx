import React from "react";
import "owl.carousel/dist/assets/owl.carousel.css";
import "owl.carousel/dist/assets/owl.theme.default.css";
import OwlCarousel from "react-owl-carousel";
import Footer from "../../shared/footer";
import Header from "../../shared/header";

const pricingPlans = [
  { id: 1, price: 49, name: "Basic Plan" },
  { id: 2, price: 99, name: "Family Plan" },
  { id: 3, price: 149, name: "VIP Plan" },
  { id: 4, price: 199, name: "Most Plan" },
];

const PricePage = () => {
  return (
    <>
    <Header/>
      {/* Breadcrumb Section */}
      <div className="container-fluid bg-breadcrumb py-5">
        <div className="container text-center py-5">
          <h3 className="text-white display-3 mb-4">Our Price Plan</h3>
          <ol className="breadcrumb justify-content-center mb-0">
            <li className="breadcrumb-item"><a href="/">Home</a></li>
            <li className="breadcrumb-item"><a href="#">Pages</a></li>
            <li className="breadcrumb-item active text-white">Price Page</li>
          </ol>
        </div>
      </div>

      {/* Pricing Section */}
      <div className="container-fluid pricing py-5" style={{ background: "var(--bs-primary)" }}>
        <div className="container py-5">
          <OwlCarousel className="pricing-carousel" items={3} loop margin={20} nav>
            {pricingPlans.map((plan) => (
              <div key={plan.id} className="pricing-item">
                <div className="pricing-content rounded">
                  <div className="d-flex align-items-center justify-content-between bg-light rounded-top border-3 border-bottom border-primary p-4">
                    <h1 className="display-4 mb-0">
                      <small className="align-top text-muted" style={{ fontSize: "22px", lineHeight: "45px" }}>
                        $
                      </small>
                      {plan.price}
                      <small className="text-muted" style={{ fontSize: "16px", lineHeight: "40px" }}>
                        /Mo
                      </small>
                    </h1>
                    <h5 className="text-primary text-uppercase m-0">{plan.name}</h5>
                  </div>
                  <div className="p-4">
                    <p><i className="fa fa-check text-primary me-2"></i>Full Body Massage</p>
                    <p><i className="fa fa-check text-primary me-2"></i>Deep Tissue Massage</p>
                    <p><i className="fa fa-check text-primary me-2"></i>Hot Stone Massage</p>
                    <p><i className="fa fa-check text-primary me-2"></i>Tissue Body Polish</p>
                    <p><i className="fa fa-check text-primary me-2"></i>Foot & Nail Care</p>
                    <a href="#" className="btn btn-primary btn-primary-outline-0 rounded-pill my-2 px-4">
                      Order Now
                    </a>
                  </div>
                </div>
              </div>
            ))}
          </OwlCarousel>
        </div>
      </div>
        <Footer/>
    </>
  );
};

export default PricePage;