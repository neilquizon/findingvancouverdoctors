import React, { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { message, Modal } from "antd"; // Import Modal and message components from antd
import Notifications from "../components/Notifications"; // Import Notifications component
import logo from "../logo.png"; // Import the logo

function ProtectedRoute({ children }) {
    const navigate = useNavigate();
    const user = JSON.parse(localStorage.getItem("user"));

    useEffect(() => {
        if (!user) {
            navigate("/"); // Redirect to the Home page if not logged in
        }
    }, [navigate, user]);

    if (!user) {
        return null; // Return nothing while redirecting
    }

    const handleLogout = () => {
        Modal.confirm({
            title: 'Are you sure you want to log out?',
            onOk: () => {
                message.success("You have successfully logged out."); // Display the success message
                localStorage.removeItem("user");
                navigate("/"); // Navigate to home page after logout
            },
        });
    };

    return (
        <div className="layout p-1">
            <div
                className="header p-2 flex justify-between items-center"
                style={{ 
                    backgroundColor: "#0077B5",
                    flexWrap: "wrap"  // Ensure wrapping on smaller screens
                }}
            >
                {/* Logo and Text Container */}
                <div className="flex items-center cursor-pointer" onClick={() => navigate("/")}>
                    <img 
                        src={logo} 
                        alt="Logo" 
                        style={{ height: "80px", marginRight: "10px" }} // Adjust logo size and spacing
                    />
                    <h2
                        style={{ color: "white", fontSize: "1.6rem", marginBottom: "0.5rem" }} // Adjust font size
                    >
                        <strong>FINDING VANCOUVER </strong>
                        <strong>DOCTOR</strong>
                    </h2>
                </div>

                {user && (
                    <div className="flex gap-3 items-center" style={{ flexWrap: "wrap" }}>
                        {/* Notifications Icon */}
                        <Notifications 
                            userId={user.uid || user.id || user._id} 
                            userRole={user.role} 
                        />
                        <div className="flex gap-1 items-center">
                            <i className="ri-shield-user-line" style={{ color: "white" }}></i>
                            <h4
                                className="uppercase cursor-pointer underline"
                                onClick={() => {
                                    if (user.role === "admin") navigate("/admin");
                                    else navigate("/profile");
                                }}
                                style={{ color: "white", marginBottom: "0.5rem" }}
                            >
                                {user.name}
                            </h4>
                        </div>
                        <span
                            className="cursor-pointer"
                            onClick={handleLogout}
                            style={{ color: "white", textDecoration: "none", whiteSpace: "nowrap" }} // Prevent text wrap
                        >
                            LOGOUT
                        </span>
                    </div>
                )}
            </div>
            <div className="content my-1">
                {children}
            </div>
        </div>
    );
}

export default ProtectedRoute;
