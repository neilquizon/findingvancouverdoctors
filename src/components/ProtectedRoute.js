import React, { useEffect } from "react";
import { useNavigate } from "react-router-dom";

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

    return (
        <div className="layout p-1">
            <div
                className="header p-2 flex justify-between items-center"
                style={{ backgroundColor: "#0077B5" }}
            >
                <h2
                    className="cursor-pointer"
                    onClick={() => navigate("/")}
                    style={{ color: "white" }}
                >
                    <strong>FINDING VANCOUVER </strong>
                    <strong>DOCTOR</strong>
                </h2>
                {user && (
                    <div className="flex gap-3 items-center">
                        <div className="flex gap-1 items-center">
                            <i className="ri-shield-user-line" style={{ color: "white" }}></i>
                            <h4
                                className="uppercase cursor-pointer underline"
                                onClick={() => {
                                    if (user.role === "admin") navigate("/admin");
                                    else navigate("/profile");
                                }}
                                style={{ color: "white" }}
                            >
                                {user.name}
                            </h4>
                        </div>
                        <span
                            className="cursor-pointer"
                            onClick={() => {
                                localStorage.removeItem("user");
                                navigate("/"); // Navigate to home page after logout
                            }}
                            style={{ color: "white", textDecoration: "underline" }}
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
