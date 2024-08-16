import React, { useEffect } from "react";
import { useDispatch } from "react-redux";
import { Table, message, Modal, Select, Input } from "antd";
import { ShowLoader } from "../../redux/loaderSlice";
import { GetAppointments, DeleteAppointment, UpdateAppointmentStatus, SaveDoctorNotes, UpdateProblem } from "../../apicalls/appointments";
import moment from 'moment';

const { Option } = Select;
const { TextArea } = Input;

function AppointmentsList() {
  const [appointments, setAppointments] = React.useState([]);
  const [notes, setNotes] = React.useState({});
  const [problems, setProblems] = React.useState({});
  const dispatch = useDispatch();
  const user = JSON.parse(localStorage.getItem("user"));

  const getData = async () => {
    try {
      dispatch(ShowLoader(true));
      const response = await GetAppointments();
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

  const confirmDelete = (id) => {
    Modal.confirm({
      title: 'Are you sure you want to delete this appointment?',
      onOk: () => onDelete(id),
    });
  };

  const onDelete = async (id) => {
    try {
      dispatch(ShowLoader(true));
      const response = await DeleteAppointment(id);
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

  const handleNotesChange = (appointmentId, value) => {
    setNotes(prevNotes => ({
      ...prevNotes,
      [appointmentId]: value,
    }));
  };

  const handleProblemChange = (appointmentId, value) => {
    setProblems(prevProblems => ({
      ...prevProblems,
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

  const saveProblem = async (appointmentId) => {
    try {
      dispatch(ShowLoader(true));
      const response = await UpdateProblem(appointmentId, problems[appointmentId]);
      dispatch(ShowLoader(false));
      if (response.success) {
        message.success('Problem updated successfully');
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

  const handleChangeStatus = (id, value) => {
    onUpdate(id, value);
  };

  const columns = [
    { title: "Date", dataIndex: "date", key: "date" },
    { title: "Time", dataIndex: "slot", key: "slot" },
    { title: "Doctor", dataIndex: "doctorName", key: "doctorName" },
    { title: "Patient", dataIndex: "userName", key: "userName" },
    { title: "Booked On", dataIndex: "bookedOn", key: "bookedOn" },
    {
      title: "Problem",
      dataIndex: "problem",
      key: "problem",
      render: (text, record) => {
        if (user.role === "admin") {
          return (
            <div>
              <TextArea
                rows={2}
                value={problems[record.id] || record.problem}
                onChange={(e) => handleProblemChange(record.id, e.target.value)}
              />
              <button onClick={() => saveProblem(record.id)}>Save</button>
            </div>
          );
        } else {
          return <div>{record.problem || "No problem specified"}</div>;
        }
      }
    },
    { title: "Status", dataIndex: "status", key: "status" },
    {
      title: "Doctor's Notes",
      dataIndex: "notes",
      key: "notes",
      render: (text, record) => {
        if (user.role === "doctor" || user.role === "admin") {
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

  if (user.role === "doctor" || user.role === "admin") {
    columns.push({
      title: 'Action',
      dataIndex: 'action',
      key: 'action',
      render: (text, record) => {
        const isPastDate = moment(record.date).isBefore(moment(), 'day');
        if (user.role === "admin" || !isPastDate) {
          return (
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
                onClick={() => confirmDelete(record.id)}
              >
                Delete
              </span>
            </div>
          );
        }
        return null;
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

export default AppointmentsList;
