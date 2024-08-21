import React, { useEffect, useState, useCallback, useRef } from "react";
import { useDispatch } from "react-redux";
import { Table, message, Modal, Select, Input, Button } from "antd";
import { ShowLoader } from "../../redux/loaderSlice";
import {
  GetAppointments,
  DeleteAppointment,
  SaveDoctorNotes,
  UpdateProblem,
  UpdateAppointmentStatus,
} from "../../apicalls/appointments";
import sendEmail from "../../services/emailService";
import moment from "moment";

const { Option } = Select;
const { TextArea } = Input;

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

function AppointmentsList() {
  const [appointments, setAppointments] = useState([]);
  const [filteredAppointments, setFilteredAppointments] = useState([]);
  const [filterType, setFilterType] = useState(null);
  const [filterValue, setFilterValue] = useState(null);
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [notes, setNotes] = useState({});
  const [problems, setProblems] = useState({});
  const dispatch = useDispatch();
  const user = JSON.parse(localStorage.getItem("user"));
  const printRef = useRef();

  const getData = useCallback(async () => {
    try {
      dispatch(ShowLoader(true));
      const response = await GetAppointments();
      dispatch(ShowLoader(false));
      if (response.success) {
        const sortedAppointments = response.data.sort((a, b) =>
          moment(a.date).unix() - moment(b.date).unix()
        );
        setAppointments(sortedAppointments);
      } else {
        throw new Error(response.message);
      }
    } catch (error) {
      dispatch(ShowLoader(false));
      message.error(error.message);
    }
  }, [dispatch]);

  useEffect(() => {
    getData();
  }, [getData]);

  const handleFilterChange = (value) => {
    setFilterType(value);
    setFilterValue(null);
  };

  const handleFilterValueChange = (e) => {
    setFilterValue(e.target.value);
  };

  const handleDateFilterChange = (e) => {
    setFilterValue(e.target.value);
  };

  const handleSearch = () => {
    let filtered = appointments;

    if (filterType && filterValue) {
      filtered = appointments.filter((appointment) => {
        if (filterType === "Patients") {
          return appointment.userName.toLowerCase().includes(filterValue.toLowerCase());
        }
        if (filterType === "Doctors") {
          return appointment.doctorName.toLowerCase().includes(filterValue.toLowerCase());
        }
        if (filterType === "Appointment Date") {
          return moment(appointment.date).isSame(filterValue, "day");
        }
        if (filterType === "Status") {
          return appointment.status.toLowerCase().includes(filterValue.toLowerCase());
        }
        return true;
      });
    }

    setFilteredAppointments(filtered);
    setIsModalVisible(true);
  };

  const handlePrint = () => {
    const printContent = printRef.current.innerHTML;
    const printWindow = window.open("", "", "height=600,width=800");
    printWindow.document.write("<html><head><title>Appointments Report</title>");
    printWindow.document.write("</head><body >");
    printWindow.document.write(printContent);
    printWindow.document.write("</body></html>");
    printWindow.document.close();
    printWindow.print();
  };

  const confirmDelete = (id) => {
    Modal.confirm({
      title: "Are you sure you want to delete this appointment?",
      onOk: () => onDelete(id),
    });
  };

  const onDelete = async (id) => {
    try {
      dispatch(ShowLoader(true));
      const appointment = appointments.find((app) => app.id === id);
      const doctorEmail = appointment.doctorEmail;
      const userEmail = appointment.userEmail || user.email;

      const response = await DeleteAppointment(id);
      dispatch(ShowLoader(false));
      if (response.success) {
        message.success(response.message);

        const emailSubject = "Appointment Deletion Notice";
        const emailText = `The appointment on ${appointment.date} at ${appointment.slot} has been deleted.`;

        await sendEmail(doctorEmail, emailSubject, emailText);
        await sendEmail(userEmail, emailSubject, emailText);

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
    setNotes((prevNotes) => ({
      ...prevNotes,
      [appointmentId]: value,
    }));
  };

  const handleProblemChange = (appointmentId, value) => {
    setProblems((prevProblems) => ({
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
        message.success("Notes saved successfully");
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
        message.success("Problem updated successfully");
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

  const columns = [
    { title: "Date", dataIndex: "date", key: "date" },
    { title: "Time", dataIndex: "slot", key: "slot" },
    { title: "Doctor", dataIndex: "doctorName", key: "doctorName" },
    { title: "Patient", dataIndex: "userName", key: "userName" },
    { title: "Booked On", dataIndex: "bookedOn", key: "bookedOn" },
    { title: "Problem", dataIndex: "problem", key: "problem" },
    { title: "Status", dataIndex: "status", key: "status" },
    {
      title: "Doctor's Notes",
      dataIndex: "notes",
      key: "notes",
    },
    {
      title: "Action",
      dataIndex: "action",
      key: "action",
      render: (text, record) => (
        <div
          style={{ display: "flex", gap: "0.5rem", alignItems: "center" }}
        >
          <Select
            value={record.status}
            onChange={(value) => onUpdate(record.id, value)}
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
            style={{ textDecoration: "underline", cursor: "pointer" }}
            onClick={() => confirmDelete(record.id)}
          >
            Delete
          </span>
        </div>
      ),
    },
  ];

  return (
    <div className="table-container">
      {/* Filter Section */}
      <div style={{ marginBottom: 16 }}>
        <Select
          style={{ width: 200, marginRight: 16 }}
          placeholder="Select Filter"
          onChange={handleFilterChange}
        >
          <Option value="Patients">Patients</Option>
          <Option value="Doctors">Doctors</Option>
          <Option value="Appointment Date">Appointment Date</Option>
          <Option value="Status">Status</Option>
        </Select>

        {filterType === "Patients" && (
          <Input
            placeholder="Enter Patient's Name"
            value={filterValue}
            onChange={handleFilterValueChange}
            style={{ width: 200 }}
          />
        )}

        {filterType === "Doctors" && (
          <Input
            placeholder="Enter Doctor's Name"
            value={filterValue}
            onChange={handleFilterValueChange}
            style={{ width: 200 }}
          />
        )}

        {filterType === "Appointment Date" && (
          <Input
            type="date"
            value={filterValue}
            onChange={handleDateFilterChange}
            style={{ width: 200 }}
          />
        )}

        {filterType === "Status" && (
          <Input
            placeholder="Enter Status"
            value={filterValue}
            onChange={handleFilterValueChange}
            style={{ width: 200 }}
          />
        )}

        <Button
          type="primary"
          onClick={handleSearch}
          style={{ backgroundColor: "white", color: "#004182", borderColor: "#004182" }}
        >
          Search
        </Button>
      </div>

      <Table
        columns={columns}
        dataSource={appointments}
        pagination={false}
        rowKey="id"
        scroll={{ x: 600 }}
      />

      {/* Modal for displaying filtered results */}
      <Modal
        title="Filtered Appointments"
        visible={isModalVisible}
        onCancel={() => setIsModalVisible(false)}
        footer={[
          <Button
            key="print"
            onClick={handlePrint}
            style={{
              backgroundColor: "white",
              color: "#004182",
              borderColor: "#004182",
            }}
          >
            Print
          </Button>,
        ]}
      >
        <div ref={printRef}>
          <Table
            columns={columns.filter((col) => col.key !== "action")}
            dataSource={filteredAppointments}
            pagination={false}
            rowKey="id"
            scroll={{ x: 600 }}
          />
        </div>
      </Modal>

      <Footer />
    </div>
  );
}

export default AppointmentsList;
