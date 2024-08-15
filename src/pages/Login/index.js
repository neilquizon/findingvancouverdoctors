import { Button, Form, message } from "antd";
import React, { useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { LoginUser } from "../../apicalls/users";
import { useDispatch } from "react-redux";
import { ShowLoader } from "../../redux/loaderSlice";
import { AiOutlineHome } from "react-icons/ai"; // Import the home icon from react-icons

const Header = () => (
    <header style={{ backgroundColor: '#0073b1', color: 'white', padding: '1rem', fontFamily: 'Roboto, sans-serif', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <h1 style={{ color: 'white', fontSize: '2rem' }}>Finding Vancouver Doctor</h1>
        <Link to="/" style={{ color: 'white', fontSize: '1.3rem', display: 'flex', alignItems: 'center', textDecoration: 'none' }}>
            <AiOutlineHome /> {/* Home icon */}
            <span style={{ marginLeft: '0.5rem', color: 'white' }}>Home</span>
        </Link>
    </header>
);

const Footer = () => (
    <footer style={{ backgroundColor: '#004182', color: 'white', padding: '1rem', fontFamily: 'Roboto, sans-serif', textAlign: 'center' }}>
        <p style={{ color: 'white' }}>&copy; 2024 Finding Vancouver Doctor. All rights reserved.</p>
    </footer>
);

function Login() {
    const navigate = useNavigate();
    const dispatch = useDispatch();

    const onFinish = async (values) => {
        try {
            dispatch(ShowLoader(true));
            const response = await LoginUser(values);
            dispatch(ShowLoader(false));
            if (response.success) {
                message.success(response.message);
                localStorage.setItem("user", JSON.stringify(response.data));
                navigate("/");
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
                        <strong>Login</strong>
                        <hr />
                    </h2>
                    <Form.Item 
                        label="Email" 
                        name="email"
                        rules={[{ required: true, message: 'Email is required' }]}
                    >
                        <input type="email" />
                    </Form.Item>
                    <Form.Item 
                        label="Password" 
                        name="password"
                        rules={[{ required: true, message: 'Password is required' }]}
                    >
                        <input type="password" />
                    </Form.Item>
                    <button className="contained-btn my-1 w-full" type="submit">Login</button>
                    <Link className="underline" to='/register'>Don't have an account? <strong>Register</strong></Link>
                    <br />
                    <Link to="/forgot-password">Forgot Password? Click here</Link>
                </Form>
            </div>
            <Footer />
        </div>
    );
}

export default Login;
