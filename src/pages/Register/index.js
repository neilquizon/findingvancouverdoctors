import { Button, Form, message } from "antd";
import React, { useEffect } from "react";
import { useDispatch } from "react-redux";
import { Link, useNavigate } from "react-router-dom";
import { CreateUser } from "../../apicalls/users";
import { ShowLoader } from "../../redux/loaderSlice";
import { AiOutlineHome } from "react-icons/ai"; // Import the home icon
import logo from '../../logo.png'; // Import the logo

// Header component
const Header = () => (
    <header style={{ backgroundColor: '#0073b1', color: 'white', padding: '1rem', fontFamily: 'Roboto, sans-serif', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        {/* Flexbox container for logo and text */}
        <div className="flex items-center">
            <img 
                src={logo} 
                alt="Logo" 
                style={{ height: "80px", marginRight: "10px" }} // Adjust logo size and spacing
            />
            <h1 style={{ color: 'white', fontSize: '1.6rem', margin: 0 }}>FINDING VANCOUVER DOCTOR</h1>
        </div>
        <Link to="/" style={{ color: 'white', fontSize: '1.2rem', display: 'flex', alignItems: 'center', textDecoration: 'none' }}>
            <AiOutlineHome /> {/* Home icon */}
            <span style={{ marginLeft: '0.5rem', color: 'white', fontSize: '1.1rem' }}>HOME</span>
        </Link>
    </header>
);

// Footer component
const Footer = () => (
    <footer style={{ backgroundColor: '#004182', color: 'white', padding: '1rem', fontFamily: 'Roboto, sans-serif', textAlign: 'center' }}>
        <p style={{ color: 'white' }}>&copy; 2024 Finding Vancouver Doctor. All rights reserved.</p>
    </footer>
);

function Register() {
    const navigate = useNavigate();
    const dispatch = useDispatch();
    
    const onFinish = async (values) => {
        if (values.password !== values.confirmPassword) {
            message.error("Passwords do not match");
            return;
        }

        try {
            dispatch(ShowLoader(true));
            const response = await CreateUser({
                ...values,
                role: "user",
            });
            dispatch(ShowLoader(false));
            if (response.success) {
                message.success(response.message);
                navigate("/login");
            } else {
                throw new Error(response.message);
            }
        } catch (error) {
            dispatch(ShowLoader(false));
            message.error(error.message);
        }
    };

    useEffect(() => {
        const user = JSON.parse(localStorage.getItem("user"));
        if (user) navigate("/");
    }, [navigate]);
    
    return (
        <div className="flex flex-col justify-between h-screen">
            <Header />
            <div className="flex justify-center items-center flex-grow">
                <Form layout="vertical" style={{ width: '80%', maxWidth: '800px', backgroundColor: 'white', padding: '2rem', borderRadius: '8px' }} onFinish={onFinish}>
                    <h2 className="uppercase my-1">
                        <strong>Register</strong>
                    </h2>
                    <hr />
                    
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '1rem' }}>
                        <Form.Item label="Name" name="name" rules={[{ required: true, message: 'Please input your name!' }]} style={{ flex: '1 1 45%' }}>
                            <input type="text" />
                        </Form.Item>
                        <Form.Item label="Date of Birth" name="dob" rules={[{ required: true, message: 'Please input your date of birth!' }]} style={{ flex: '1 1 45%' }}>
                            <input type="date" />
                        </Form.Item>
                        <Form.Item label="Provincial Health Number" name="provincialHealthNumber" rules={[{ required: true, message: 'Please input your Provincial Health Number!' }]} style={{ flex: '1 1 45%' }}>
                            <input type="text" />
                        </Form.Item>
                        
                        <Form.Item label="Address" name="address" rules={[{ required: true, message: 'Please input your address!' }]} style={{ flex: '1 1 45%' }}>
                            <input type="text" />
                        </Form.Item>
                        <Form.Item label="Telephone Number" name="telephoneNumber" rules={[{ required: true, message: 'Please input your Telephone Number!' }]} style={{ flex: '1 1 45%' }}>
                            <input type="text" />
                        </Form.Item>
                        <Form.Item label="Email" name="email" rules={[{ required: true, message: 'Please input your email!', type: 'email' }]} style={{ flex: '1 1 45%' }}>
                            <input type="email" />
                        </Form.Item>

                        <Form.Item label="Password" name="password" rules={[{ required: true, message: 'Please input your password!' }]} style={{ flex: '1 1 45%' }}>
                            <input type="password" />
                        </Form.Item>
                        <Form.Item label="Confirm Password" name="confirmPassword" rules={[{ required: true, message: 'Please confirm your password!' }]} style={{ flex: '1 1 45%' }}>
                            <input type="password" />
                        </Form.Item>
                        <Form.Item label="Secret Question" name="secretQuestion" rules={[{ required: true, message: 'Please input your secret question!' }]} style={{ flex: '1 1 45%' }}>
                            <input type="text" placeholder="Enter your secret question" />
                        </Form.Item>
                        
                        <Form.Item label="Secret Answer" name="secretAnswer" rules={[{ required: true, message: 'Please input your secret answer!' }]} style={{ flex: '1 1 45%' }}>
                            <input type="text" placeholder="Enter your secret answer" />
                        </Form.Item>
                    </div>

                    <button style={{ marginTop: '1rem', width: '100%', padding: '0.75rem', backgroundColor: '#0073b1', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer' }} type="submit">
                        REGISTER
                    </button>

                    <Link style={{ textDecoration: 'underline', display: 'block', marginTop: '1rem' }} to="/login">
                        Already have an account? <strong>Sign In</strong>
                    </Link>
                </Form>
            </div>
            <Footer />
        </div>
    );
}

export default Register;
