import React from "react";
import { Link } from "react-router-dom";
import Footer from "../../shared/footer";
import Header from "../../shared/header";

const teamMembers = [
  { id: 1, name: "Oliva Mia", role: "Spa & Beauty Expert", img: "/assets/img/team-1.png" },
  { id: 2, name: "Charlotte Ross", role: "Spa & Beauty Expert", img: "/assets/img/team-2.png" },
  { 
    id: 3, 
    name: "Đỗ Thị Diệp Quyên", 
    role: "Massage trị liệu, Chăm sóc da mặt", 
    img: "https://i.postimg.cc/fTn6M71Z/att-pn2b-Pe-St-OOu-Wi-W33e-U2-EDDCj-OFA9pv0-GUl-Xa-MDO8few.jpg",
    rating: 4.4,
    reviews: 44
  },
  { id: 4, name: "Isabella Evelyn", role: "Spa & Beauty Expert", img: "/assets/img/team-4.png" }
];

const TeamPage = () => {
  return (
    <>
      {/* Header Start */}
      <Header/>
      <div className="container-fluid bg-breadcrumb py-5">
        <div className="container text-center py-5">
          <h3 className="text-white display-3 mb-4">Our Team</h3>
          <ol className="breadcrumb justify-content-center mb-0">
            <li className="breadcrumb-item"><a href="/">Home</a></li>
            <li className="breadcrumb-item"><a href="#">Pages</a></li>
            <li className="breadcrumb-item active text-white">Team</li>
          </ol>
        </div>
      </div>
      {/* Header End */}

      {/* Team Start */}
      <div className="container-fluid team py-5">
        <div className="container py-5">
          <div className="text-center mx-auto mb-5" style={{ maxWidth: "800px" }}>
            <p className="fs-4 text-uppercase text-primary">Spa Specialist</p>
            <h1 className="display-4 mb-4">Spa & Beauty Specialist</h1>
          </div>
          <div className="row g-4">
            {teamMembers.map((member) => (
              <div key={member.id} className="col-md-6 col-lg-6 col-xl-3">
                <div className="team-item">
                  <div className="team-img rounded-top">
                    <img
                      src={member.img}
                      className="img-fluid w-100 rounded-top bg-light"
                      alt={member.name}
                    />
                  </div>
                  <div className="team-text rounded-bottom text-center p-4">
                    <h3 className="text-white">{member.name}</h3>
                    <p className="mb-2 text-white">{member.role}</p>
                    
                    {/* Rating display for staff with review data */}
                    {member.rating && (
                      <div className="mb-3">
                        <div className="d-flex justify-content-center align-items-center">
                          <span className="text-warning me-2">
                            {'★'.repeat(Math.floor(member.rating))}
                            {'☆'.repeat(5 - Math.floor(member.rating))}
                          </span>
                          <small className="text-white-50">
                            {member.rating} ({member.reviews} đánh giá)
                          </small>
                        </div>
                      </div>
                    )}
                    
                    <Link 
                      to={`/staff-review/${member.id}`} 
                      className="btn btn-primary btn-sm"
                    >
                      <i className="fas fa-star me-2"></i>
                      Đánh Giá
                    </Link>
                  </div>
                  <div className="team-social">
                    <a className="btn btn-light btn-light-outline-0 btn-square rounded-circle mb-2" href="#"><i className="fab fa-twitter"></i></a>
                    <a className="btn btn-light btn-light-outline-0 btn-square rounded-circle mb-2" href="#"><i className="fab fa-facebook-f"></i></a>
                    <a className="btn btn-light btn-light-outline-0 btn-square rounded-circle mb-2" href="#"><i className="fab fa-linkedin-in"></i></a>
                    <a className="btn btn-light btn-light-outline-0 btn-square rounded-circle" href="#"><i className="fab fa-instagram"></i></a>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
      <Footer/>
      {/* Team End */}
    </>
  );
};

export default TeamPage;
