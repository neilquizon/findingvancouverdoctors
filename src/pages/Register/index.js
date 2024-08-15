import { Button, Form, message } from "antd";
import React, { useEffect } from "react";
import { useDispatch } from "react-redux";
import { Link, useNavigate } from "react-router-dom";
import { CreateUser } from "../../apicalls/users";
import { ShowLoader } from "../../redux/loaderSlice";

// Header component
const Header = () => (
    <header style={{ backgroundColor: '#0073b1', color: 'white', padding: '1rem', fontFamily: 'Roboto, sans-serif' }}>
        <h1 style={{ color: 'white', textAlign: 'center', fontSize: '2rem' }}>Finding Vancouver Doctor</h1>
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
                <Form layout="vertical" className="w-400 bg-white p-2" onFinish={onFinish}>
                    <h2 className="uppercase my-1">
                        <strong>Register</strong>
                    </h2>
                    <hr />
                    <Form.Item label="Name" name="name" rules={[{ required: true, message: 'Please input your name!' }]}>
                        <input type="text" />
                    </Form.Item>
                    <Form.Item label="Date of Birth" name="dob" rules={[{ required: true, message: 'Please input your date of birth!' }]}>
                        <input type="date" />
                    </Form.Item>
                    <Form.Item label="Provincial Health Number" name="provincialHealthNumber" rules={[{ required: true, message: 'Please input your Provincial Health Number!' }]}>
                        <input type="text" />
                    </Form.Item>
                    <Form.Item label="Address" name="address" rules={[{ required: true, message: 'Please input your address!' }]}>
                        <input type="text" />
                    </Form.Item>
                    <Form.Item label="Telephone Number" name="telephoneNumber" rules={[{ required: true, message: 'Please input your Telephone Number!' }]}>
                        <input type="text" />
                    </Form.Item>
                    <Form.Item label="Email" name="email" rules={[{ required: true, message: 'Please input your email!', type: 'email' }]}>
                        <input type="email" />
                    </Form.Item>
                    <Form.Item label="Password" name="password" rules={[{ required: true, message: 'Please input your password!' }]}>
                        <input type="password" />
                    </Form.Item>
                    <Form.Item label="Confirm Password" name="confirmPassword" rules={[{ required: true, message: 'Please confirm your password!' }]}>
                        <input type="password" />
                    </Form.Item>
                    <Form.Item label="Secret Question" name="secretQuestion" rules={[{ required: true, message: 'Please input your secret question!' }]}>
                        <input type="text" placeholder="Enter your secret question" />
                    </Form.Item>
                    <Form.Item label="Secret Answer" name="secretAnswer" rules={[{ required: true, message: 'Please input your secret answer!' }]}>
                        <input type="text" placeholder="Enter your secret answer" />
                    </Form.Item>

                    <button className="contained-btn my-1 w-full" type="submit">
                        REGISTER
                    </button>

                    <Link className="underline" to="/login">
                        Already have an account? <strong>Sign In</strong>
                    </Link>
                </Form>
            </div>
            <Footer />
        </div>
    );
}

export default Register;
