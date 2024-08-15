import React, { useEffect } from 'react';
import { useDispatch } from 'react-redux';
import { ShowLoader } from '../../redux/loaderSlice';
import { Table, message, Modal, Select, Input } from 'antd';
import { GetDoctorAppointments, GetUserAppointments, UpdateAppointmentStatus, DeleteAppointment, SaveDoctorNotes } from '../../apicalls/appointments';
import './Appointments.css'; // Ensure you create this CSS file
import moment from 'moment';
import { useNavigate } from 'react-router-dom';

const { Option } = Select;
const { TextArea } = Input;

function Appointments() {
  const [appointments, setAppointments] = React.useState([]);
  const [notes, setNotes] = React.useState({});
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
        setAppointments(response.data);
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
      const response = await UpdateAppointmentStatus(id, status);
      dispatch(ShowLoader(false));
      if (response.success) {
        message.success(response.message);
        getData();
      } else {
        throw new Error(response.message);
      }
    } catch (error) {
      dispatch(ShowLoader(false));
      message.error(error.message);
    }
  };

  const onDelete = async (id, navigateToBookAppointment) => {
    try {
      dispatch(ShowLoader(true));
      const response = await DeleteAppointment(id);
      dispatch(ShowLoader(false));
      if (response.success) {
        message.success(response.message);
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
    { title: 'Booked At', dataIndex: 'bookedOn', key: 'bookedOn' },
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
        scroll={{ x: 600 }} // Enable horizontal scrolling on smaller screens
      />
    </div>
  );
}

export default Appointments;
