import React, { useEffect, useState } from 'react';
import { useDispatch } from 'react-redux';
import { ShowLoader } from '../../redux/loaderSlice';
import { Table, message, Modal, Select, Input, Button } from 'antd';
import {
  GetDoctorAppointments,
  GetUserAppointments,
  UpdateAppointmentStatus,
  DeleteAppointment,
  SaveDoctorNotes,
  SubmitRating, // Import the SubmitRating function
} from '../../apicalls/appointments';
import sendEmail from '../../services/emailService'; 
import './Appointments.css'; 
import moment from 'moment';
import { useNavigate } from 'react-router-dom';

const { Option } = Select;
const { TextArea } = Input;

function Appointments() {
  const [appointments, setAppointments] = useState([]);
  const [notes, setNotes] = useState({});
  const [ratedAppointments, setRatedAppointments] = useState(new Set());
  const [rating, setRating] = useState({});
  const dispatch = useDispatch();
  const user = JSON.parse(localStorage.getItem("user"));
  const navigate = useNavigate();

  const getData = async () => {
    try {
      dispatch(ShowLoader(true));
      let response;
      if (user.role === "doctor") {
        response = await GetDoctorAppointments(user.id);
      } else {
        response = await GetUserAppointments(user.id);
      }
      dispatch(ShowLoader(false));
      if (response.success) {
        const sortedAppointments = response.data.sort((a, b) => moment(a.date).unix() - moment(b.date).unix());

        const ratedSet = new Set();
        sortedAppointments.forEach(appointment => {
          if (appointment.rating) {
            ratedSet.add(appointment.id);
          }
        });

        setRatedAppointments(ratedSet);
        setAppointments(sortedAppointments);
      } else {
        throw new Error(response.message);
      }
    } catch (error) {
      dispatch(ShowLoader(false));
      message.error(error.message);
    }
  };

  const onUpdate = async (id, status) => {
    try {
      dispatch(ShowLoader(true));
      const appointment = appointments.find(app => app.id === id);
      const userEmail = appointment.userEmail || appointment.user?.email; 
      const response = await UpdateAppointmentStatus(id, status);
      dispatch(ShowLoader(false));
      if (response.success) {
        message.success(response.message);

        if (status === "cancelled" && userEmail) {
          const emailSubject = "Your Appointment Has Been Cancelled";
          const emailText = `Dear ${appointment.userName},\n\nYour appointment with Dr. ${appointment.doctorName} on ${appointment.date} at ${appointment.slot} has been cancelled.\n\nThank you.`;
          await sendEmail(userEmail, emailSubject, emailText);
        }

        getData();
      } else {
        throw new Error(response.message);
      }
    } catch (error) {
      dispatch(ShowLoader(false));
      message.error("Failed to update appointment: " + error.message);
    }
  };

  const onDelete = async (id, navigateToBookAppointment) => {
    try {
      dispatch(ShowLoader(true));
      const appointment = appointments.find(app => app.id === id);
      const doctorEmail = appointment.doctorEmail;
      const userEmail = appointment.userEmail || appointment.user?.email; 

      const response = await DeleteAppointment(id);
      dispatch(ShowLoader(false));
      if (response.success) {
        message.success(response.message);

        const emailSubject = 'Appointment Cancellation Notice';
        const emailText = `The appointment on ${appointment.date} at ${appointment.slot} has been cancelled.`;

        if (doctorEmail) {
          await sendEmail(doctorEmail, emailSubject, emailText);
        }
        if (userEmail) {
          await sendEmail(userEmail, emailSubject, emailText);
        }

        if (navigateToBookAppointment) {
          navigate(`/book-appointment/${navigateToBookAppointment}`);
        } else {
          getData();
        }
      } else {
        throw new Error(response.message);
      }
    } catch (error) {
      dispatch(ShowLoader(false));
      message.error(error.message);
    }
  };

  const handleNotesChange = (appointmentId, value) => {
    setNotes(prevNotes => ({
      ...prevNotes,
      [appointmentId]: value,
    }));
  };

  const saveNotes = async (appointmentId) => {
    try {
      dispatch(ShowLoader(true));
      const response = await SaveDoctorNotes(appointmentId, notes[appointmentId]);
      dispatch(ShowLoader(false));
      if (response.success) {
        message.success('Notes saved successfully');
        getData();
      } else {
        throw new Error(response.message);
      }
    } catch (error) {
      dispatch(ShowLoader(false));
      message.error(error.message);
    }
  };

  const handleRatingChange = (appointmentId, value) => {
    setRating(prevRating => ({
      ...prevRating,
      [appointmentId]: value,
    }));
  };

  const submitRating = async (appointmentId) => {
    try {
      const selectedRating = rating[appointmentId];
      if (!selectedRating) {
        message.error("Please select a rating before submitting.");
        return;
      }

      dispatch(ShowLoader(true));
      const response = await SubmitRating(appointments.find(app => app.id === appointmentId).doctorId, user.id, selectedRating);
      dispatch(ShowLoader(false));

      if (response.success) {
        message.success('Rating submitted successfully');
        setRatedAppointments(new Set([...ratedAppointments, appointmentId]));
        getData();
      } else {
        throw new Error(response.message);
      }
    } catch (error) {
      dispatch(ShowLoader(false));
      message.error(error.message);
    }
  };

  useEffect(() => {
    getData();
  }, []);

  const showConfirm = (id, isDoctor, navigateToBookAppointment) => {
    const title = navigateToBookAppointment 
      ? 'Are you sure you want to reschedule this appointment? This will delete the current appointment and cannot be undone.'
      : 'Are you sure you want to cancel this appointment?';

    Modal.confirm({
      title: title,
      onOk() {
        if (isDoctor) {
          onUpdate(id, "cancelled");
        } else {
          onDelete(id, navigateToBookAppointment);
        }
      }
    });
  };

  const handleChangeStatus = (id, value) => {
    onUpdate(id, value);
  };

  const columns = [
    { title: 'Date', dataIndex: 'date', key: 'date' },
    { title: 'Time', dataIndex: 'slot', key: 'slot' },
    { title: 'Doctor', dataIndex: 'doctorName', key: 'doctorName' },
    { title: 'Patient', dataIndex: 'userName', key: 'userName' },
    { title: 'Email', dataIndex: 'userEmail', key: 'userEmail' }, 
    { title: 'Booked On', dataIndex: 'bookedOn', key: 'bookedOn' },
    { title: 'Problem', dataIndex: 'problem', key: 'problem' },
    { title: 'Status', dataIndex: 'status', key: 'status' },
    {
      title: 'Doctor\'s Notes',
      dataIndex: 'notes',
      key: 'notes',
      render: (text, record) => {
        if (user.role === "doctor") {
          return (
            <div>
              <TextArea
                rows={4}
                value={notes[record.id] || record.notes}
                onChange={(e) => handleNotesChange(record.id, e.target.value)}
              />
              <button onClick={() => saveNotes(record.id)}>Save</button>
            </div>
          );
        } else {
          return <div>{record.notes || "No notes available"}</div>;
        }
      }
    },
    {
      title: 'Rate Doctor',
      dataIndex: 'rateDoctor',
      key: 'rateDoctor',
      render: (text, record) => {
        if (user.role !== "doctor" && !ratedAppointments.has(record.id)) {
          return (
            <div>
              <Select
                style={{ width: 120 }}
                value={rating[record.id]}
                onChange={(value) => handleRatingChange(record.id, value)}
                placeholder="Rate"
              >
                {[1, 2, 3, 4, 5].map(star => (
                  <Option key={star} value={star}>{`${star} Star${star > 1 ? 's' : ''}`}</Option>
                ))}
              </Select>
              <Button type="primary" onClick={() => submitRating(record.id)}>
                Submit Rating
              </Button>
            </div>
          );
        }
        return 'Rated';
      }
    }
  ];

  if (user.role === "doctor") {
    columns.push({
      title: 'Action',
      dataIndex: 'action',
      key: 'action',
      render: (text, record) => {
        const isPastDate = moment(record.date).isBefore(moment(), 'day');
        return !isPastDate ? (
          <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
            <Select
              value={record.status}
              onChange={(value) => handleChangeStatus(record.id, value)}
              style={{ width: 120 }}
            >
              <Option value="pending">Pending</Option>
              <Option value="approved">Approved</Option>
              <Option value="cancelled">Cancelled</Option>
              <Option value="completed">Completed</Option>
              <Option value="no show">No Show</Option>
              <Option value="in progress">In Progress</Option>
            </Select>
            <span
              style={{ textDecoration: 'underline', cursor: 'pointer' }}
              onClick={() => showConfirm(record.id, true)}
            >
              Cancel
            </span>
          </div>
        ) : null;
      }
    });
  } else {
    columns.push({
      title: 'Modify',
      dataIndex: 'modify',
      key: 'modify',
      render: (text, record) => {
        const isPastDate = moment(record.date).isBefore(moment(), 'day');
        return !isPastDate ? (
          <div style={{ display: 'flex', gap: '0.5rem' }}>
            <span
              style={{ textDecoration: 'underline', cursor: 'pointer' }}
              onClick={() => showConfirm(record.id, false)}
            >
              Cancel
            </span>
            <span
              style={{ textDecoration: 'underline', cursor: 'pointer' }}
              onClick={() => showConfirm(record.id, false, record.doctorId)}
            >
              Reschedule
            </span>
          </div>
        ) : null;
      }
    });
  }

  return (
    <div className="table-container">
      <Table
        columns={columns}
        dataSource={appointments}
        pagination={false}
        rowKey="id"
        scroll={{ x: 600 }} 
      />
    </div>
  );
}

export default Appointments;
