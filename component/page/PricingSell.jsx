import React from "react";
import OwlCarousel from "react-owl-carousel";
import "owl.carousel/dist/assets/owl.carousel.css";
import "owl.carousel/dist/assets/owl.theme.default.css";

const Pricing = () => {
  const pricingPlans = [
    { price: 49, title: "Basic Plan" },
    { price: 99, title: "Family Plan" },
    { price: 149, title: "VIP Plan" },
    { price: 199, title: "Most Plan" },
  ];

  return (
    <div className="container-fluid pricing py-5">
      <div className="container py-5">
        <OwlCarousel
          className="owl-theme"
          loop
          margin={10}
          nav
          dots={false}
          responsive={{
            0: { items: 1 },
            600: { items: 2 },
            1000: { items: 3 },
          }}
        >
          {pricingPlans.map((plan, index) => (
            <div className="pricing-item" key={index}>
              <div className="pricing-content rounded">
                <div className="d-flex align-items-center justify-content-between bg-light rounded-top border-3 border-bottom border-primary p-4">
                  <h1 className="display-4 mb-0">
                    <small className="align-top text-muted" style={{ fontSize: "22px", lineHeight: "45px" }}>$</small>
                    {plan.price}
                    <small className="text-muted" style={{ fontSize: "16px", lineHeight: "40px" }}>/Mo</small>
                  </h1>
                  <h5 className="text-primary text-uppercase m-0">{plan.title}</h5>
                </div>
                <div className="p-4">
                  <p><i className="fa fa-check text-primary me-2"></i>Full Body Massage</p>
                  <p><i className="fa fa-check text-primary me-2"></i>Deep Tissue Massage</p>
                  <p><i className="fa fa-check text-primary me-2"></i>Hot Stone Massage</p>
                  <p><i className="fa fa-check text-primary me-2"></i>Tissue Body Polish</p>
                  <p><i className="fa fa-check text-primary me-2"></i>Foot & Nail Care</p>
                  <a href="#" className="btn btn-primary rounded-pill my-2 px-4">Order Now</a>
                </div>
              </div>
            </div>
          ))}
        </OwlCarousel>
      </div>
    </div>
  );
};

export default Pricing;