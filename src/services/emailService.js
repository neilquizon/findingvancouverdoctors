import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Modal, message, Input, Button, Form } from 'antd'; // Import Modal, message, Form, Input, and Button from antd
import emailjs from 'emailjs-com'; // Import EmailJS

// Updated Footer Component
const Footer = () => (
  <footer style={{ backgroundColor: '#004182', color: 'white', padding: '1rem', fontFamily: 'Roboto, sans-serif', textAlign: 'center' }}>
    <p style={{ color: 'white', margin: 0 }}>&copy; 2024 Finding Vancouver Doctor. All rights reserved.</p>
  </footer>
);

const Contact = () => {
  const [form] = Form.useForm();
  const navigate = useNavigate();
  const user = JSON.parse(localStorage.getItem("user"));
  const [loading, setLoading] = useState(false);

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

  const onFinish = (values) => {
    const { email, subject, message: userMessage } = values;
    
    const templateParams = {
      from_email: email,     // User's email from form input
      subject,               // Subject from form input
      message: userMessage,  // Message from form input
    };

    setLoading(true);

    // Send email using EmailJS
    emailjs.send(
      'service_7rqzzbn',       // Your EmailJS Service ID
      'template_izpot6c',      // Your EmailJS Template ID
      templateParams, 
      'MfjeugCZV3OLQrm7O'      // Your EmailJS User ID
    )
    .then((response) => {
      console.log('Email sent successfully:', response.status, response.text);
      message.success('Message sent successfully!');
      form.resetFields();
      setLoading(false);
    })
    .catch((error) => {
      console.error('Failed to send email:', error);
      message.error('Failed to send the message. Please try again.');
      setLoading(false);
    });
  };

  return (
    <div className="layout" style={{ fontFamily: 'Roboto, sans-serif', backgroundColor: '#f5f5f5', minHeight: '100vh' }}>
      {/* Header */}
      <div
        className="header p-2 flex justify-between items-center"
        style={{ backgroundColor: "#0077B5", padding: '1rem 2rem', flexWrap: 'wrap' }}
      >
        <h2
          className="cursor-pointer"
          onClick={() => navigate("/")}
          style={{ color: "white", fontWeight: 700, margin: 0 }}
        >
          FINDING VANCOUVER DOCTOR
        </h2>
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
          Contact Us
        </h1>
        <p style={{ fontSize: '1rem', lineHeight: '1.6', color: '#333' }}>
          Have any questions or need assistance? Send us a message, and we’ll get back to you as soon as possible.
        </p>
        
        <Form form={form} onFinish={onFinish} layout="vertical" style={{ marginTop: '2rem' }}>
          <Form.Item
            label="Your Email"
            name="email"
            rules={[{ required: true, message: 'Please enter your email address!' }, { type: 'email', message: 'Please enter a valid email!' }]}
          >
            <Input placeholder="Enter your email" />
          </Form.Item>
          
          <Form.Item
            label="Subject"
            name="subject"
            rules={[{ required: true, message: 'Please enter a subject!' }]}
          >
            <Input placeholder="Enter the subject" />
          </Form.Item>
          
          <Form.Item
            label="Message"
            name="message"
            rules={[{ required: true, message: 'Please enter your message!' }]}
          >
            <Input.TextArea rows={5} placeholder="Enter your message" />
          </Form.Item>
          
          <Form.Item>
            <Button type="primary" htmlType="submit" loading={loading} block>
              Send Message
            </Button>
          </Form.Item>
        </Form>
      </div>

      {/* Footer */}
      <Footer />
    </div>
  );
};

export default Contact;
