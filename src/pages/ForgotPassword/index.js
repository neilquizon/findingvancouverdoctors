import { Button, Form, message } from "antd";
import React, { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { GetSecretQuestion, ValidateSecretAnswer, UpdatePassword } from "../../apicalls/users";
import { ShowLoader } from "../../redux/loaderSlice";
import { useDispatch } from "react-redux";
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
            <span style={{ marginLeft: '0.5rem', color: 'white' }}>HOME</span>
        </Link>
    </header>
);

// Footer component
const Footer = () => (
    <footer style={{ backgroundColor: '#004182', color: 'white', padding: '1rem', fontFamily: 'Roboto, sans-serif', textAlign: 'center' }}>
        <p style={{ color: 'white' }}>&copy; 2024 Finding Vancouver Doctor. All rights reserved.</p>
    </footer>
);

function ForgotPassword() {
    const navigate = useNavigate();
    const dispatch = useDispatch();
    const [step, setStep] = useState(1);
    const [email, setEmail] = useState("");
    const [secretQuestion, setSecretQuestion] = useState("");
    const [secretAnswer, setSecretAnswer] = useState("");

    const handleEmailSubmit = async (values) => {
        try {
            dispatch(ShowLoader(true));
            const response = await GetSecretQuestion(values.email);
            dispatch(ShowLoader(false));
            if (response.success) {
                setEmail(values.email);
                setSecretQuestion(response.secretQuestion);
                setStep(2);
            } else {
                throw new Error(response.message);
            }
        } catch (error) {
            dispatch(ShowLoader(false));
            message.error(error.message);
        }
    };

    const handleAnswerSubmit = async (values) => {
        try {
            dispatch(ShowLoader(true));
            const response = await ValidateSecretAnswer({
                email,
                secretAnswer: values.secretAnswer,
            });
            dispatch(ShowLoader(false));
            if (response.success) {
                setSecretAnswer(values.secretAnswer);
                setStep(3);
            } else {
                throw new Error(response.message);
            }
        } catch (error) {
            dispatch(ShowLoader(false));
            message.error(error.message);
        }
    };

    const handlePasswordSubmit = async (values) => {
        try {
            dispatch(ShowLoader(true));
            const response = await UpdatePassword({
                email,
                newPassword: values.newPassword,
                secretAnswer,
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

    return (
        <div className="flex flex-col justify-between h-screen">
            <Header />
            <div className="flex justify-center items-center flex-grow">
                {step === 1 && (
                    <Form layout="vertical" className="w-400 bg-white p-2" onFinish={handleEmailSubmit}>
                        <h2 className="uppercase my-1">
                            <strong>Forgot Password</strong>
                        </h2>
                        <hr />
                        <Form.Item label="Email" name="email">
                            <input type="email" />
                        </Form.Item>
                        <button className="contained-btn my-1 w-full" type="submit">
                            Submit
                        </button>
                    </Form>
                )}
                {step === 2 && (
                    <Form layout="vertical" className="w-400 bg-white p-2" onFinish={handleAnswerSubmit}>
                        <h2 className="uppercase my-1">
                            <strong>Answer Secret Question</strong>
                        </h2>
                        <hr />
                        <p>{secretQuestion}</p>
                        <Form.Item label="Secret Answer" name="secretAnswer">
                            <input type="text" />
                        </Form.Item>
                        <button className="contained-btn my-1 w-full" type="submit">
                            Submit
                        </button>
                    </Form>
                )}
                {step === 3 && (
                    <Form layout="vertical" className="w-400 bg-white p-2" onFinish={handlePasswordSubmit}>
                        <h2 className="uppercase my-1">
                            <strong>Reset Password</strong>
                        </h2>
                        <hr />
                        <Form.Item label="New Password" name="newPassword">
                            <input type="password" />
                        </Form.Item>
                        <Form.Item label="Confirm Password" name="confirmPassword">
                            <input type="password" />
                        </Form.Item>
                        <button className="contained-btn my-1 w-full" type="submit">
                            Submit
                        </button>
                    </Form>
                )}
            </div>
            <Footer />
        </div>
    );
}

export default ForgotPassword;
