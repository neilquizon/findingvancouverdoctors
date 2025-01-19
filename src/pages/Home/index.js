// src/pages/Home.js

import { message, Modal, Rate } from "antd";
import React, { useEffect, useState } from "react";
import { useDispatch } from "react-redux";
import { useNavigate } from "react-router-dom";
import DatePicker from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css";
import { GetAllDoctors } from "../../apicalls/doctors";
import { ShowLoader } from "../../redux/loaderSlice";
import Notifications from "../../components/Notifications"; 
import logo from "../../logo.png"; 
import "slick-carousel/slick/slick.css";
import "slick-carousel/slick/slick-theme.css";
import Slider from "react-slick";
import { LeftOutlined, RightOutlined } from "@ant-design/icons";

const Footer = () => (
  <footer
    style={{
      backgroundColor: "#004182",
      color: "white",
      padding: "1rem",
      fontFamily: "Roboto, sans-serif",
      textAlign: "center",
    }}
  >
    <p style={{ color: "white" }}>
      &copy; 2024 Finding Vancouver Doctor. All rights reserved.
    </p>
  </footer>
);

function Home() {
  const [doctors, setDoctors] = useState([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedDate, setSelectedDate] = useState(null);
  const [minRating, setMinRating] = useState(0); // rating filter

  const dispatch = useDispatch();
  const navigate = useNavigate();
  const user = JSON.parse(localStorage.getItem("user"));

  const getData = async () => {
    try {
      dispatch(ShowLoader(true));
      const response = await GetAllDoctors();
      if (response.success) {
        setDoctors(response.data);
      } else {
        message.error(response.message);
      }
      dispatch(ShowLoader(false));
    } catch (error) {
      message.error(error.message);
      dispatch(ShowLoader(false));
    }
  };

  useEffect(() => {
    getData();
    // eslint-disable-next-line
  }, []);

  const handleSearch = (e) => {
    setSearchQuery(e.target.value.toLowerCase());
  };

  const handleDateChange = (date) => {
    setSelectedDate(date);
  };

  const handleLogout = () => {
    Modal.confirm({
      title: "Are you sure you want to log out?",
      onOk: () => {
        message.success("You have successfully logged out.");
        localStorage.removeItem("user");
        navigate("/");
      },
    });
  };

  // Helper function to compute the average rating
  const calculateAverageRating = (doctor) => {
    if (!doctor.ratings || doctor.ratings.length === 0) return 0;
    const totalRating = doctor.ratings.reduce(
      (sum, rating) => sum + rating.rating,
      0
    );
    // Return numeric average with one decimal place
    return parseFloat((totalRating / doctor.ratings.length).toFixed(1));
  };

  // Filter doctors: approved -> text search -> date -> rating
  const filteredDoctors = doctors
    .filter((doctor) => doctor.status === "approved")
    .filter((doctor) => {
      const fullName = `${doctor.firstName} ${doctor.lastName}`.toLowerCase();
      const speciality = doctor.speciality?.toLowerCase() || "";
      const language = doctor.language?.toLowerCase() || "";
      const daysAvailable =
        doctor.days?.map((day) => day.toLowerCase()).join(", ") || "";
      const availableTime = `${doctor.startTime} - ${doctor.endTime}`.toLowerCase();

      // text-based search
      const matchesSearchQuery =
        fullName.includes(searchQuery) ||
        speciality.includes(searchQuery) ||
        language.includes(searchQuery) ||
        daysAvailable.includes(searchQuery) ||
        availableTime.includes(searchQuery);

      // date-based filter
      if (selectedDate) {
        const selectedDay = selectedDate
          .toLocaleDateString("en-US", { weekday: "long" })
          .toLowerCase();
        if (!daysAvailable.includes(selectedDay)) {
          return false;
        }
      }

      // rating filter
      const doctorAvgRating = calculateAverageRating(doctor);
      if (doctorAvgRating < minRating) {
        return false;
      }

      return matchesSearchQuery;
    });

  // Sort filtered doctors alphabetically by name
  const sortedDoctors = filteredDoctors.sort((a, b) => {
    const fullNameA = `${a.firstName} ${a.lastName}`.toLowerCase();
    const fullNameB = `${b.firstName} ${b.lastName}`.toLowerCase();
    return fullNameA.localeCompare(fullNameB);
  });

  const handleDoctorClick = (doctorId) => {
    if (!user) {
      localStorage.setItem("selectedDoctorId", doctorId);
      navigate("/login");
    } else {
      navigate(`/book-appointment/${doctorId}`);
    }
  };

  const handleRegisterClick = () => {
    if (!user) {
      navigate("/login");
    } else {
      navigate("/apply-doctor");
    }
  };

  const Arrow = ({ className, style, onClick, icon }) => (
    <div
      className={className}
      style={{
        ...style,
        display: "flex",
        justifyContent: "center",
        alignItems: "center",
        fontSize: "2rem",
        color: "#004182",
        position: "absolute",
        top: "50%",
        transform: "translateY(-50%)",
        zIndex: 1,
        width: "50px",
        height: "50px",
        backgroundColor: "rgba(255, 255, 255, 0.7)",
        borderRadius: "50%",
        cursor: "pointer",
      }}
      onClick={onClick}
    >
      {icon}
    </div>
  );

  const settings = {
    dots: true,
    infinite: false,
    speed: 500,
    slidesToShow: Math.min(3, doctors.length),
    slidesToScroll: 1,
    nextArrow: <Arrow icon={<RightOutlined />} />,
    prevArrow: <Arrow icon={<LeftOutlined />} />,
    responsive: [
      {
        breakpoint: 768,
        settings: {
          slidesToShow: Math.min(1, doctors.length),
        },
      },
      {
        breakpoint: 1024,
        settings: {
          slidesToShow: Math.min(2, doctors.length),
        },
      },
    ],
  };

  return (
    <div className="layout p-0">
      {/* HEADER */}
      <div
        className="header p-2 flex justify-between items-center"
        style={{ backgroundColor: "#0077B5", flexWrap: "wrap" }}
      >
        <div className="flex items-center cursor-pointer" onClick={() => navigate("/")}>
          <img
            src={logo}
            alt="Logo"
            style={{ height: "90px", marginRight: "10px" }}
          />
          <h2
            style={{
              color: "white",
              fontSize: "1.6rem",
              display: "flex",
              alignItems: "center",
            }}
          >
            <strong>FINDING VANCOUVER DOCTOR</strong>
          </h2>
        </div>

        <div className="flex gap-3 items-center" style={{ flexWrap: "wrap" }}>
          {user ? (
            <>
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
                  style={{ color: "white" }}
                >
                  {user.name}
                </h4>
              </div>
              <span
                className="cursor-pointer"
                onClick={handleLogout}
                style={{ color: "white", textDecoration: "none" }}
              >
                LOGOUT
              </span>
            </>
          ) : (
            <>
              <h4
                className="uppercase cursor-pointer"
                onClick={() => navigate("/about")}
                style={{ color: "white", textDecoration: "none" }}
              >
                ABOUT
              </h4>
              <h4
                className="uppercase cursor-pointer"
                onClick={() => navigate("/contact")}
                style={{ color: "white", textDecoration: "none" }}
              >
                CONTACT
              </h4>
              <h4
                className="uppercase cursor-pointer"
                onClick={() => navigate("/login")}
                style={{ color: "white", textDecoration: "none" }}
              >
                LOGIN
              </h4>
            </>
          )}
        </div>
      </div>

      {/* CONTENT */}
      <div className="content my-1" style={{ padding: "1rem" }}>
        {user && (
          <div style={{ marginBottom: "1rem" }}>
            <button
              style={{
                border: "1px solid #004182",
                padding: "0.5rem 1rem",
                backgroundColor: "transparent",
                cursor: "pointer",
              }}
              onClick={() =>
                navigate(user.role === "admin" ? "/admin" : "/profile")
              }
            >
              My Dashboard
            </button>
          </div>
        )}

        {/* SEARCH & ACTIONS */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            marginBottom: "1rem",
            justifyContent: "space-between",
          }}
        >
          {/* Text search */}
          <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
            <input
              placeholder="Search doctors"
              style={{ width: "100%", maxWidth: "400px" }}
              value={searchQuery}
              onChange={handleSearch}
            />
            <button
              style={{
                padding: "0.5rem 1rem",
                backgroundColor: "#004182",
                color: "white",
                border: "none",
                cursor: "pointer",
              }}
            >
              Search
            </button>
          </div>

          {/* Register as doctor button (only if user is not a doctor/admin) */}
          {user && user.role !== "doctor" && user.role !== "admin" && (
            <button
              style={{
                padding: "0.5rem 1rem",
                backgroundColor: "transparent",
                cursor: "pointer",
                border: "none",
              }}
              onClick={handleRegisterClick}
            >
              Register as a Doctor
            </button>
          )}
        </div>

        {/* RATING SELECTOR */}
        <div style={{ marginBottom: "1rem" }}>
          <label style={{ marginRight: "0.5rem" }}>Minimum Rating:</label>
          <select
            value={minRating}
            onChange={(e) => setMinRating(Number(e.target.value))}
            style={{
              width: "150px", // <-- Decrease the dropdown width
              padding: "0.25rem",
            }}
          >
            <option value={0}>All Ratings</option>
            <option value={1}>1 & Up</option>
            <option value={2}>2 & Up</option>
            <option value={3}>3 & Up</option>
            <option value={4}>4 & Up</option>
            <option value={5}>5 Stars Only</option>
          </select>
        </div>

        {/* DATE PICKER */}
        <div style={{ marginBottom: "1rem" }}>
          <DatePicker
            selected={selectedDate}
            onChange={handleDateChange}
            placeholderText="Select date"
            style={{ maxWidth: "200px" }}
            popperPlacement="bottom-end"
          />
        </div>

        {/* FEATURED DOCTORS */}
        <h3 style={{ textAlign: "center", marginBottom: "1rem" }}>
          Featured Doctors
        </h3>
        <Slider
          {...settings}
          className="slider-container"
          style={{ textAlign: "center", position: "relative" }}
        >
          {sortedDoctors.map((doctor) => (
            <div
              key={doctor.id}
              style={{
                backgroundColor: "white",
                padding: "1rem",
                display: "inline-block",
                width: "100%",
                maxWidth: "260px",
                cursor: "pointer",
              }}
            >
              {/* Profile Pic */}
              <div style={{ textAlign: "center" }}>
                {doctor.profilePic && (
                  <img
                    src={doctor.profilePic}
                    alt="Doctor Profile"
                    style={{
                      width: "150px",
                      height: "150px",
                      borderRadius: "10px",
                      margin: "0 auto",
                      display: "block",
                      objectFit: "cover",
                    }}
                  />
                )}
              </div>

              {/* Name */}
              <div
                style={{
                  display: "flex",
                  flexDirection: "column",
                  alignItems: "flex-start",
                  width: "100%",
                  marginTop: "1rem",
                }}
              >
                <h2 style={{ textTransform: "uppercase", textAlign: "left" }}>
                  {doctor.firstName} {doctor.lastName}
                </h2>
              </div>

              {/* Rating display */}
              <div style={{ textAlign: "left", width: "100%" }}>
                <div style={{ display: "flex", alignItems: "center" }}>
                  <Rate disabled value={calculateAverageRating(doctor)} />
                  <span style={{ marginLeft: "0.5rem" }}>
                    {calculateAverageRating(doctor) || "0.0"}
                  </span>
                </div>
                <div>
                  <small>
                    {doctor.ratings?.length || 0} review
                    {doctor.ratings?.length !== 1 ? "s" : ""}
                  </small>
                </div>
              </div>

              <hr />

              {/* Doctor Info */}
              <div style={{ textAlign: "left", width: "100%" }}>
                <h4>
                  <b>Clinic : </b>
                  {doctor.address}
                </h4>
              </div>
              <div style={{ textAlign: "left", width: "100%" }}>
                <h4>
                  <b>Speciality : </b>
                  {doctor.speciality}
                </h4>
              </div>
              <div style={{ textAlign: "left", width: "100%" }}>
                <h4>
                  <b>Language : </b>
                  {doctor.language}
                </h4>
              </div>
              <div style={{ textAlign: "left", width: "100%" }}>
                <h4>
                  <b>Experience : </b>
                  {doctor.experience} Years
                </h4>
              </div>
              <div style={{ textAlign: "left", width: "100%" }}>
                <h4>
                  <b>Email : </b>
                  {doctor.email}
                </h4>
              </div>
              <div style={{ textAlign: "left", width: "100%" }}>
                <h4>
                  <b>Phone : </b>
                  {doctor.phone}
                </h4>
              </div>
              <div style={{ textAlign: "left", width: "100%" }}>
                <h4>
                  <b>Days Available : </b>
                  {doctor.days.join(", ")}
                </h4>
              </div>
              <div style={{ textAlign: "left", width: "100%" }}>
                <h4>
                  <b>Available Time : </b>
                  {doctor.startTime} - {doctor.endTime}
                </h4>
              </div>

              <button
                onClick={() => handleDoctorClick(doctor.id)}
                style={{
                  marginTop: "1rem",
                  padding: "0.5rem 1rem",
                  backgroundColor: "#004182",
                  color: "white",
                  border: "none",
                  cursor: "pointer",
                }}
              >
                Book Appointment
              </button>
            </div>
          ))}
        </Slider>
      </div>

      {/* FOOTER */}
      <Footer />
    </div>
  );
}

export default Home;
