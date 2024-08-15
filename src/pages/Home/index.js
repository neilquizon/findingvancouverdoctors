import { Col, message, Row } from "antd";
import React, { useEffect, useState } from "react";
import { useDispatch } from "react-redux";
import { useNavigate } from "react-router-dom";
import { GetAllDoctors } from "../../apicalls/doctors";
import { ShowLoader } from "../../redux/loaderSlice";

const Footer = () => (
  <footer style={{ backgroundColor: '#004182', color: 'white', padding: '1rem', fontFamily: 'Roboto, sans-serif', textAlign: 'center' }}>
    <p style={{ color: 'white' }}>&copy; 2024 Finding Vancouver Doctor. All rights reserved.</p>
  </footer>
);

function Home() {
  const [doctors, setDoctors] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
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
  }, []);

  const handleSearch = (e) => {
    setSearchQuery(e.target.value.toLowerCase());
  };

  const filteredDoctors = doctors
    .filter((doctor) => doctor.status === "approved") // Only include doctors with status "approved"
    .filter((doctor) => {
      const fullName = `${doctor.firstName} ${doctor.lastName}`.toLowerCase();
      const speciality = doctor.speciality?.toLowerCase() || '';
      const language = doctor.language?.toLowerCase() || '';
      const daysAvailable = doctor.days?.join(', ').toLowerCase() || '';
      const availableTime = `${doctor.startTime} - ${doctor.endTime}`.toLowerCase();

      return (
        fullName.includes(searchQuery) ||
        speciality.includes(searchQuery) ||
        language.includes(searchQuery) ||
        daysAvailable.includes(searchQuery) ||
        availableTime.includes(searchQuery)
      );
    });

  // Sort the filtered doctors alphabetically by full name
  const sortedDoctors = filteredDoctors.sort((a, b) => {
    const fullNameA = `${a.firstName} ${a.lastName}`.toLowerCase();
    const fullNameB = `${b.firstName} ${b.lastName}`.toLowerCase();
    return fullNameA.localeCompare(fullNameB);
  });

  const handleDoctorClick = (doctorId) => {
    if (!user) {
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
        {user ? (
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
                navigate("/");
              }}
              style={{ color: "white", textDecoration: "underline" }}
            >
              LOGOUT
            </span>
          </div>
        ) : (
          <div className="flex gap-3 items-center">
            <h4
              className="uppercase cursor-pointer underline"
              onClick={() => navigate("/login")}
              style={{ color: "white" }}
            >
              LOGIN
            </h4>
          </div>
        )}
      </div>
      <div className="content my-1">
        <div style={{ display: 'flex', justifyContent: 'space-between', padding: '1rem' }}>
          <div>
            {user && (
              <button
                style={{ border: '1px solid #004182', padding: '0.5rem 1rem', backgroundColor: 'transparent', cursor: 'pointer', marginBottom: '1rem' }}
                onClick={() => navigate(user.role === "admin" ? "/admin" : "/profile")}
              >
                My Dashboard
              </button>
            )}
            <input
              placeholder="Search doctors"
              style={{ width: '100%', maxWidth: '400px' }}
              value={searchQuery}
              onChange={handleSearch}
            />
          </div>
          {user && user.role !== "doctor" && user.role !== "admin" && (
            <button
              style={{ padding: '0.5rem 1rem', backgroundColor: 'transparent', cursor: 'pointer', border: 'none' }}
              onClick={handleRegisterClick}
            >
              Register as a Doctor
            </button>
          )}
        </div>
        <Row gutter={[16, 16]} style={{ margin: '1rem 0' }}>
          {sortedDoctors.map((doctor) => (
            <Col xs={24} sm={12} md={8} key={doctor.id}>
              <div
                style={{ backgroundColor: 'white', padding: '1rem', display: 'flex', flexDirection: 'column', gap: '1rem', cursor: 'pointer' }}
                onClick={() => handleDoctorClick(doctor.id)}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', width: '100%' }}>
                  <h2 style={{ textTransform: 'uppercase' }}>
                    {doctor.firstName} {doctor.lastName}
                  </h2>
                </div>
                <hr />
                <div style={{ display: 'flex', justifyContent: 'space-between', width: '100%' }}>
                  <h4>
                    <b>Clinic : </b>
                  </h4>
                  <h4>{doctor.address}</h4>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', width: '100%' }}>
                  <h4>
                    <b>Speciality : </b>
                  </h4>
                  <h4>{doctor.speciality}</h4>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', width: '100%' }}>
                  <h4>
                    <b>Language : </b>
                  </h4>
                  <h4>{doctor.language}</h4>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', width: '100%' }}>
                  <h4>
                    <b>Experience : </b>
                  </h4>
                  <h4>{doctor.experience} Years
                  </h4>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', width: '100%' }}>
                  <h4>
                    <b>Email : </b>
                  </h4>
                  <h4>{doctor.email}</h4>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', width: '100%' }}>
                  <h4>
                    <b>Phone : </b>
                  </h4>
                  <h4>{doctor.phone}</h4>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', width: '100%' }}>
                  <h4>
                    <b>Days Available : </b>
                  </h4>
                  <h4>{doctor.days.join(', ')}</h4>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', width: '100%' }}>
                  <h4>
                    <b>Available Time : </b>
                  </h4>
                  <h4>{doctor.startTime} - {doctor.endTime}</h4>
                </div>
              </div>
            </Col>
          ))}
        </Row>
      </div>
      <Footer />
    </div>
  );
}

export default Home;
