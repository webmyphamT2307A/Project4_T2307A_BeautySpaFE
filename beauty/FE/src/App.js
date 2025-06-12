import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import './App.css';
import Homepage from './component/page/Homepage';
import AboutPage from './component/page/aboutPage/AboutPage';
import ServicePage from './component/page/servicePage/ServicePage';
import ServiceDetailPage from './component/page/servicePage/ServiceDetailPage';
import ServiceLayout from './component/page/servicePage/ServiceLayout';
import ContactPage from './component/page/contactPage/ContactPage';
import TeamPage from './component/page/teamPage/TeamPage';
import TerminalPage from './component/page/tesminalPage/TesminalPage';
import GaleryPage from './component/page/galeryPage/GaleryPage';
import AppointmentPage from './component/page/appointmentPage/AppointmentPage';
import ErrorPage from './component/page/404';
import CustomerDetail from './component/page/authPage/CustomerDetail';

function App() {
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const timer = setTimeout(() => {
      setLoading(false);
    }, 1000);
    return () => clearTimeout(timer);
  }, []);

  return (
    <Router>
      <div className="App">
        {loading && (
          <div
            id="spinner"
            className="show w-100 vh-100 bg-white position-fixed translate-middle top-50 start-50 d-flex align-items-center justify-content-center"
          >
            <div className="spinner-grow text-primary" role="status"></div>
          </div>
        )}
        {!loading && (
          <Routes>
            <Route path="/" element={<Homepage />} />
            <Route path="/AboutPage" element={<AboutPage />} />

            {/* Route path="/ServicePage" sẽ render component ServicePage */}
            <Route path="/ServicePage" element={<ServiceLayout />}>
              {/* Route "index" sẽ render khi URL là "/ServicePage" */}
              <Route index element={<ServicePage />} />
              {/* Route ":id" sẽ render khi URL là "/ServicePage/some-id" */}
              <Route path=":id" element={<ServiceDetailPage />} />
            </Route>

            <Route path="/ContactPage" element={<ContactPage />} />
            <Route path="/TeamPage" element={<TeamPage />} />
            <Route path="/TerminalPage" element={<TerminalPage />} />
            <Route path="/GaleryPage" element={<GaleryPage />} />
            <Route path="/AppointmentPage" element={<AppointmentPage />} />
            <Route path="/ErrorPage" element={<ErrorPage />} />
            <Route path="/CustomerDetail" element={<CustomerDetail />} />

            <Route path="*" element={<ErrorPage />} />
          </Routes>
        )}
      </div>
      <a href="#" className="btn btn-primary btn-primary-outline-0 btn-md-square rounded-circle back-to-top">
        <i className="fa fa-arrow-up" />
      </a>
    </Router>
  );
}

export default App;