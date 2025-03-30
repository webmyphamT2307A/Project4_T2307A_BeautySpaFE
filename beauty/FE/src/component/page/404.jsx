import React from "react";
import Footer from "../shared/footer";
import Header from "../shared/header";

const ErrorPage = () => {
    return (
        <div>
            <Header/>
            <div className="container-fluid bg-breadcrumb py-5">
                <div className="container text-center py-5">
                    <h3 className="text-white display-3 mb-4">404 Page</h3>
                    <ol className="breadcrumb justify-content-center mb-0">
                        <li className="breadcrumb-item"><a href="index.html">Home</a></li>
                        <li className="breadcrumb-item"><a href="#">Pages</a></li>
                        <li className="breadcrumb-item active text-white">404</li>
                    </ol>
                </div>
            </div>

            {/* 404 Start */}
            <div className="container-fluid py-5" style={{ background: 'linear-gradient(rgba(0, 0, 0, 0.2), rgba(0, 0, 0, 0.2))', objectFit: 'cover' }}>
                <div className="container py-5 text-center">
                    <div className="row justify-content-center">
                        <div className="col-lg-6">
                            <i className="bi bi-exclamation-triangle display-1 text-secondary" />
                            <h1 className="display-1">404</h1>
                            <h1 className="mb-4 text-dark">Page Not Found</h1>
                            <p className="mb-4 text-dark">We’re sorry, the page you have looked for does not exist in our website! Maybe go to our home page or try to use a search?</p>
                            <a className="btn btn-primary btn-primary-outline-0 rounded-pill py-3 px-5" href="index.html">Go Back To Home</a>
                        </div>
                    </div>
                </div>
            </div>
            <Footer/>
        </div>
    )
}
export default ErrorPage;