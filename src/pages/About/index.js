import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Modal, message } from 'antd'; // Import Modal and message from antd
import logo from '../../logo.png'; // Import the logo

// Updated Footer Component
const Footer = () => (
  <footer style={{ backgroundColor: '#004182', color: 'white', padding: '1rem', fontFamily: 'Roboto, sans-serif', textAlign: 'center' }}>
    <p style={{ color: 'white', margin: 0 }}>&copy; 2024 Finding Vancouver Doctor. All rights reserved.</p>
  </footer>
);

const About = () => {
  const navigate = useNavigate();
  const user = JSON.parse(localStorage.getItem("user"));

  const handleLogout = () => {
    Modal.confirm({
      title: 'Are you sure you want to log out?',
      onOk: () => {
        message.success("You have successfully logged out.");
        localStorage.removeItem("user");
        navigate("/");
      },
    });
  };

  return (
    <div className="layout" style={{ fontFamily: 'Roboto, sans-serif', backgroundColor: '#f5f5f5', minHeight: '100vh' }}>
      {/* Header */}
      <div
        className="header p-2 flex justify-between items-center"
        style={{ backgroundColor: "#0077B5", padding: '1rem 2rem', flexWrap: 'wrap' }}
      >
        {/* Flexbox container for logo and text */}
        <div className="flex items-center cursor-pointer" onClick={() => navigate("/")}>
          <img 
            src={logo} 
            alt="Logo" 
            style={{ height: "90px", marginRight: "10px" }} // Adjust logo size and spacing
          />
          <h2 style={{ fontSize: "1.6rem", color: "white", fontWeight: 700, margin: 0, display: "flex", alignItems: "center" }}>
            FINDING VANCOUVER DOCTOR
          </h2>
        </div>
        {user ? (
          <div className="flex gap-3 items-center" style={{ flexWrap: 'wrap' }}>
            <div className="flex gap-1 items-center">
              <i className="ri-shield-user-line" style={{ color: "white" }}></i>
              <h4
                className="uppercase cursor-pointer underline"
                onClick={() => {
                  if (user.role === "admin") navigate("/admin");
                  else navigate("/profile");
                }}
                style={{ color: "white", margin: 0 }}
              >
                {user.name}
              </h4>
            </div>
            <span
              className="cursor-pointer"
              onClick={handleLogout}
              style={{ color: "white", textDecoration: "none", marginLeft: '1rem' }}
            >
              LOGOUT
            </span>
          </div>
        ) : (
          <div className="flex gap-3 items-center">
            <h4
              className="uppercase cursor-pointer"
              onClick={() => navigate("/")}
              style={{ color: "white", margin: 0, textDecoration: "none" }}
            >
              HOME
            </h4>
            <h4
              className="uppercase cursor-pointer"
              onClick={() => navigate("/contact")}
              style={{ color: "white", margin: 0, textDecoration: "none" }}
            >
              CONTACT
            </h4>
            <h4
              className="uppercase cursor-pointer"
              onClick={() => navigate("/login")}
              style={{ color: "white", margin: 0, textDecoration: "none" }}
            >
              LOGIN
            </h4>
          </div>
        )}
      </div>

      {/* Content Section */}
      <div className="content" style={{ padding: '3rem 2rem', maxWidth: '900px', margin: 'auto', backgroundColor: 'white', borderRadius: '8px', marginTop: '2rem', boxShadow: '0 4px 8px rgba(0, 0, 0, 0.1)' }}>
        <h1 style={{ fontSize: '2rem', fontWeight: 700, marginBottom: '1rem', textAlign: 'center', color: '#004182' }}>
          About Finding Vancouver Doctor
        </h1>
        <p style={{ fontSize: '1rem', lineHeight: '1.6', color: '#333' }}>
          <strong>Finding Vancouver Doctor</strong> is a web application designed to make it easier for Vancouver residents to find family doctors and book appointments online. With healthcare accessibility being a challenge, this platform was created to bridge the gap between patients and healthcare providers, simplifying the appointment scheduling process.
        </p>
        <h2 style={{ fontSize: '1.5rem', fontWeight: 600, marginTop: '2rem', color: '#004182' }}>Our Mission</h2>
        <p style={{ fontSize: '1rem', lineHeight: '1.6', color: '#333' }}>
          Our mission is to enhance patient access to primary healthcare in Vancouver by offering a streamlined, user-friendly platform where individuals can easily locate doctors, check their availability, and book appointments with just a few clicks.
        </p>
        <h2 style={{ fontSize: '1.5rem', fontWeight: 600, marginTop: '2rem', color: '#004182' }}>Key Features of the App</h2>
        <ul style={{ fontSize: '1rem', lineHeight: '1.6', color: '#333', paddingLeft: '20px' }}>
          <li>Search for available doctors by name, specialization, or available dates.</li>
          <li>View detailed doctor profiles without needing to log in.</li>
          <li>Easily register and log in to book appointments.</li>
          <li>Rate and review doctors after appointments to help others make informed decisions.</li>
          <li>Access real-time chat support for any questions or issues.</li>
        </ul>
        <h2 style={{ fontSize: '1.5rem', fontWeight: 600, marginTop: '2rem', color: '#004182' }}>Why We Created Finding Vancouver Doctor</h2>
        <p style={{ fontSize: '1rem', lineHeight: '1.6', color: '#333' }}>
          The healthcare system can be difficult to navigate, and finding a family doctor with available appointment times is often a challenge. By creating this app, we aim to reduce the time and effort patients spend searching for doctors and make the entire process more transparent and efficient.
        </p>
      </div>

      {/* Footer */}
      <Footer />
    </div>
  );
};

export default About;
