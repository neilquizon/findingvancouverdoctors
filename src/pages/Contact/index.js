import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Modal, message } from 'antd'; 
import emailjs from 'emailjs-com';
import logo from '../../logo.png'; // Import the logo

// Footer Component
const Footer = () => (
  <footer style={{ backgroundColor: '#004182', color: 'white', padding: '1rem', fontFamily: 'Roboto, sans-serif', textAlign: 'center' }}>
    <p style={{ color: 'white', margin: 0 }}>&copy; 2024 Finding Vancouver Doctor. All rights reserved.</p>
  </footer>
);

// Contact Component
const Contact = () => {
  const navigate = useNavigate();
  const user = JSON.parse(localStorage.getItem("user"));
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    message: '',
  });
  const [statusMessage, setStatusMessage] = useState('');

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prevData) => ({
      ...prevData,
      [name]: value,
    }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();

    const templateParams = {
      from_name: formData.name,
      from_email: formData.email, // User's email address
      message: formData.message,
      to_email: 'findingvancouverdoctor@gmail.com',  // Recipient email address
      user_email: formData.email, // Adding user email to be passed to EmailJS template
    };

    emailjs.send(
      'service_7rqzzbn',        // Your EmailJS Service ID
      'template_k8p75io',       // Your EmailJS Template ID
      templateParams, 
      'MfjeugCZV3OLQrm7O'       // Your EmailJS User ID
    )
    .then((response) => {
      console.log('SUCCESS!', response.status, response.text);
      setStatusMessage('Message sent successfully!');
    })
    .catch((error) => {
      console.log('FAILED...', error);
      setStatusMessage('Failed to send the message. Please try again.');
    });

    // Clear the form after submission
    setFormData({
      name: '',
      email: '',
      message: '',
    });
  };

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
      <div className="header p-2 flex justify-between items-center" style={{ backgroundColor: "#0077B5", padding: '1rem 2rem', flexWrap: 'wrap' }}>
        {/* Flexbox container for logo and text */}
        <div className="flex items-center cursor-pointer" onClick={() => navigate("/")}>
          <img 
            src={logo} 
            alt="Logo" 
            style={{ height: "80px", marginRight: "10px" }} // Adjust logo size and spacing
          />
          <h2 style={{ color: "white", fontWeight: 700, margin: 0, display: "flex", alignItems: "center" }}>
            FINDING VANCOUVER DOCTOR
          </h2>
        </div>
        {user ? (
          <div className="flex gap-3 items-center" style={{ flexWrap: 'wrap' }}>
            <div className="flex gap-1 items-center">
              <i className="ri-shield-user-line" style={{ color: "white" }}></i>
              <h4 className="uppercase cursor-pointer underline" onClick={() => {
                if (user.role === "admin") navigate("/admin");
                else navigate("/profile");
              }} style={{ color: "white", margin: 0 }}>
                {user.name}
              </h4>
            </div>
            <span className="cursor-pointer" onClick={handleLogout} style={{ color: "white", textDecoration: "none", marginLeft: '1rem' }}>
              LOGOUT
            </span>
          </div>
        ) : (
          <div className="flex gap-3 items-center">
            <h4 className="uppercase cursor-pointer" onClick={() => navigate("/")} style={{ color: "white", margin: 0, textDecoration: "none" }}>
              HOME
            </h4>
            <h4 className="uppercase cursor-pointer" onClick={() => navigate("/about")} style={{ color: "white", margin: 0, textDecoration: "none" }}>
              ABOUT
            </h4>
            <h4 className="uppercase cursor-pointer" onClick={() => navigate("/login")} style={{ color: "white", margin: 0, textDecoration: "none" }}>
              LOGIN
            </h4>
          </div>
        )}
      </div>

      {/* Content Section */}
      <div className="content" style={{ padding: '3rem 2rem', maxWidth: '900px', margin: 'auto', backgroundColor: 'white', borderRadius: '8px', marginTop: '2rem', boxShadow: '0 4px 8px rgba(0, 0, 0, 0.1)' }}>
        <h1 style={{ fontSize: '2rem', fontWeight: 700, marginBottom: '1rem', textAlign: 'center', color: '#004182' }}>
          Contact Us
        </h1>
        <p style={{ textAlign: 'center', marginBottom: '2rem' }}>
          We’re here to help! Whether you have a question, feedback, or need assistance, feel free to reach out. Fill out the form below, and we’ll get back to you as soon as possible.
        </p>
        <form onSubmit={handleSubmit}>
          <div>
            <label>Name</label>
            <input
              type="text"
              name="name"
              value={formData.name}
              onChange={handleChange}
              required
              style={{ width: '100%', padding: '0.5rem', marginBottom: '1rem', borderRadius: '4px', border: '1px solid #ccc' }}
            />
          </div>
          <div>
            <label>Email</label>
            <input
              type="email"
              name="email"
              value={formData.email}
              onChange={handleChange}
              required
              style={{ width: '100%', padding: '0.5rem', marginBottom: '1rem', borderRadius: '4px', border: '1px solid #ccc' }}
            />
          </div>
          <div>
            <label>Message</label>
            <textarea
              name="message"
              value={formData.message}
              onChange={handleChange}
              required
              style={{ width: '100%', padding: '0.5rem', marginBottom: '1rem', borderRadius: '4px', border: '1px solid #ccc' }}
            ></textarea>
          </div>
          <button type="submit" style={{ backgroundColor: '#0077B5', color: 'white', padding: '0.75rem 1.5rem', borderRadius: '4px', border: 'none', cursor: 'pointer' }}>Send</button>
        </form>
        {statusMessage && <p>{statusMessage}</p>}
      </div>

      {/* Footer */}
      <Footer />
    </div>
  );
};

export default Contact;
