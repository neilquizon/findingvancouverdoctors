import { message, Rate, Spin } from "antd";
import React, { useEffect, useState, useCallback } from "react";
import { useDispatch } from "react-redux";
import { useNavigate, useParams } from "react-router-dom";
import { GetDoctorById } from "../../apicalls/doctors";
import { ShowLoader } from "../../redux/loaderSlice";
import moment from "moment";
import { BookDoctorAppointment, GetDoctorAppointmentsOnDate } from "../../apicalls/appointments";
import emailjs from "emailjs-com"; // Import emailjs

function BookAppointment() {
  const [problem, setProblem] = useState("");
  const [date, setDate] = useState("");
  const [doctor, setDoctor] = useState(null);
  const [selectedSlot, setSelectedSlot] = useState("");
  const [loading, setLoading] = useState(true); // Local loading state
  const navigate = useNavigate();
  const { id } = useParams();
  const dispatch = useDispatch();
  const [bookedSlots, setBookedSlots] = useState([]);

  const getData = useCallback(async () => {
    try {
      setLoading(true); // Start loading
      dispatch(ShowLoader(true));
      const response = await GetDoctorById(id);
      if (response.success) {
        setDoctor(response.data);
      } else {
        message.error(response.message);
      }
    } catch (error) {
      message.error(error.message);
    } finally {
      dispatch(ShowLoader(false));
      setLoading(false); // Stop loading
    }
  }, [id, dispatch]);

  const getBookedSlots = useCallback(async () => {
    if (!date) return;
    try {
      setLoading(true); // Start loading
      dispatch(ShowLoader(true));
      const response = await GetDoctorAppointmentsOnDate(id, date);
      if (response.success) {
        setBookedSlots(response.data);
      } else {
        message.error(response.message);
      }
    } catch (error) {
      message.error(error.message);
    } finally {
      dispatch(ShowLoader(false));
      setLoading(false); // Stop loading
    }
  }, [id, date, dispatch]);

  useEffect(() => {
    getData();
  }, [getData]);

  useEffect(() => {
    getBookedSlots();
  }, [date, getBookedSlots]);

  const getSlotsData = () => {
    const day = moment(date).format("dddd");
    if (!doctor?.days.includes(day)) {
      return <h3>Doctor is not available on {moment(date).format("DD-MM-YYYY")}</h3>;
    }

    let startTime = moment(doctor.startTime, "HH:mm");
    let endTime = moment(doctor.endTime, "HH:mm");
    let slotDuration = 60; // in minutes
    const slots = [];
    while (startTime < endTime) {
      slots.push(startTime.format("HH:mm"));
      startTime.add(slotDuration, "minutes");
    }
    return (
      <div style={{ overflowX: "auto" }}>
        <table className="w-full">
          <tbody>
            <tr>
              {slots.map((slot) => {
                const isBooked = bookedSlots?.find(
                  (bookedSlot) => bookedSlot.slot === slot && bookedSlot.status !== "cancelled"
                );
                return (
                  <td key={slot} className="p-2">
                    <div
                      className="bg-white p-2 cursor-pointer"
                      onClick={() => !isBooked && setSelectedSlot(slot)}
                      style={{
                        border: selectedSlot === slot ? "3px solid green" : "1px solid gray",
                        backgroundColor: isBooked ? "gray" : "white",
                        pointerEvents: isBooked ? "none" : "auto",
                        cursor: isBooked ? "not-allowed" : "pointer",
                        minWidth: "120px",
                        textAlign: "center",
                      }}
                    >
                      <span style={{ fontSize: "14px" }}>
                        {moment(slot, "HH:mm").format("hh:mm A")} -{" "}
                        {moment(slot, "HH:mm").add(slotDuration, "minutes").format("hh:mm A")}
                      </span>
                    </div>
                  </td>
                );
              })}
            </tr>
          </tbody>
        </table>
      </div>
    );
  };

  const sendEmailNotification = (email, subject, text) => {
    const templateParams = {
      to_email: email,
      subject,
      message: text,
    };

    emailjs.send('service_7rqzzbn', 'template_izpot6c', templateParams, 'MfjeugCZV3OLQrm7O')
      .then((response) => {
        console.log('Email sent successfully:', response.status, response.text);
      })
      .catch((error) => {
        console.error('Failed to send email:', error);
      });
  };

  const onBookAppointment = async () => {
    try {
      dispatch(ShowLoader(true));
      const user = JSON.parse(localStorage.getItem("user"));
      const payload = {
        doctorId: doctor.id,
        userId: user.id,
        date,
        slot: selectedSlot,
        doctorName: `${doctor.firstName} ${doctor.lastName}`,
        userName: user.name,
        userEmail: user.email, // Capture the user's email
        bookedOn: moment().format("DD-MM-YYYY hh:mm A"),
        problem,
        status: "pending",
      };
      const response = await BookDoctorAppointment(payload);
      if (response.success) {
        const emailSubject = "Appointment Confirmation";
        const emailText = `Dear ${user.name},\n\nYour appointment with Dr. ${doctor.firstName} ${doctor.lastName} on ${date} at ${selectedSlot} has been successfully booked.`;

        sendEmailNotification(user.email, emailSubject, emailText);

        const doctorEmailSubject = "New Appointment Booked";
        const doctorEmailText = `Dear Dr. ${doctor.firstName} ${doctor.lastName},\n\nYou have a new appointment with ${user.name} on ${date} at ${selectedSlot}.\n\nProblem: ${problem}`;

        sendEmailNotification(doctor.email, doctorEmailSubject, doctorEmailText);

        message.success(response.message);
        navigate("/profile");
      } else {
        message.error(response.message);
      }
    } catch (error) {
      message.error(error.message);
    } finally {
      dispatch(ShowLoader(false));
    }
  };

  const calculateAverageRating = (doctor) => {
    if (doctor?.averageRating && doctor?.ratingCount) {
      return doctor.averageRating;
    }

    if (!doctor?.ratings || doctor.ratings.length === 0) return 0;

    const total = doctor.ratings.reduce((sum, rating) => sum + rating, 0);
    return total / doctor.ratings.length;
  };

  return (
    <Spin spinning={loading}>
      {doctor && (
        <div className="bg-white p-2">
          {/* Doctor's Profile Picture - Centered */}
          {doctor.profilePic && (
            <div className="my-2" style={{ textAlign: 'center' }}>
              <img
                src={doctor.profilePic}
                alt={`${doctor.firstName} ${doctor.lastName}`}
                style={{ width: "150px", height: "150px", borderRadius: "50%" }}
              />
            </div>
          )}

          <h1 className="uppercase my-1" style={{ textAlign: 'center' }}>
            <b>
              {doctor?.firstName} {doctor?.lastName}
            </b>
          </h1>

          {/* Doctor's Ratings - Centered */}
          <div className="my-2" style={{ textAlign: 'center' }}>
            <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
              <Rate disabled value={calculateAverageRating(doctor)} />
              <span style={{ marginLeft: '0.5rem' }}>
                {calculateAverageRating(doctor).toFixed(1)}
              </span>
            </div>
            <div>
              <small>{doctor.ratingCount || 0} review{doctor.ratingCount !== 1 ? 's' : ''}</small>
            </div>
          </div>

          <hr />

          <div className="flex flex-col gap-1 my-1 w-full">
            <div className="flex justify-between w-full">
              <h4>
                <b>Speciality: </b>
              </h4>
              <h4>{doctor.speciality}</h4>
            </div>
            <div className="flex justify-between w-full">
              <h4>
                <b>Experience: </b>
              </h4>
              <h4>{doctor.experience} Years</h4>
            </div>
            <div className="flex justify-between w-full">
              <h4>
                <b>Email: </b>
              </h4>
              <h4>{doctor.email}</h4>
            </div>
            <div className="flex justify-between w-full">
              <h4>
                <b>Phone: </b>
              </h4>
              <h4>{doctor.phone}</h4>
            </div>
            <div className="flex justify-between w-full">
              <h4>
                <b>Address: </b>
              </h4>
              <h4>{doctor.address}</h4>
            </div>
            <div className="flex justify-between w-full">
              <h4>
                <b>Days Available: </b>
              </h4>
              <h4>{doctor.days.join(", ")}</h4>
            </div>
          </div>

          <hr />

          <div className="flex flex-col gap-1 my-2">
            <div className="flex gap-2 items-end">
              <div>
                <span>Select Date: </span>
                <input
                  type="date"
                  value={date}
                  onChange={(e) => setDate(e.target.value)}
                  min={moment().format("YYYY-MM-DD")}
                  className="p-1 border rounded"
                />
              </div>
            </div>

            <div className="mt-2">{date && getSlotsData()}</div>

            {selectedSlot && (
              <div>
                <textarea
                  placeholder="Enter your problem here"
                  value={problem}
                  onChange={(e) => setProblem(e.target.value)}
                  rows="5"
                  className="w-full p-2 border rounded mt-2"
                ></textarea>
                <div className="flex gap-2 justify-center my-3">
                  <button
                    className="outlined-btn"
                    onClick={() => {
                      navigate("/");
                    }}
                  >
                    Cancel
                  </button>
                  <button className="contained-btn" onClick={onBookAppointment}>
                    Book Appointment
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </Spin>
  );
}

export default BookAppointment;
