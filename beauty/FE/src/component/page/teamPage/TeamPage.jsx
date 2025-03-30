import React from "react";
import Footer from "../../shared/footer";
import Header from "../../shared/header";

const teamMembers = [
  { id: 1, name: "Oliva Mia", role: "Spa & Beauty Expert", img: "/assets/img/team-1.png" },
  { id: 2, name: "Charlotte Ross", role: "Spa & Beauty Expert", img: "/assets/img/team-2.png" },
  { id: 3, name: "Amelia Luna", role: "Spa & Beauty Expert", img: "/assets/img/team-3.png" },
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
                    <p className="mb-0 text-white">{member.role}</p>
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
