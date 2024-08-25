import React, { useEffect, useState, useCallback, useRef } from "react";
import { useDispatch } from "react-redux";
import { Table, message, Modal, Select, Input, Button, DatePicker } from "antd";
import { SearchOutlined } from "@ant-design/icons";
import { ShowLoader } from "../../redux/loaderSlice";
import {
  GetAppointments,
  DeleteAppointment,
  UpdateAppointmentStatus,
  SaveDoctorNotes,
  UpdateProblem,
} from "../../apicalls/appointments";
import sendEmail from "../../services/emailService";
import moment from "moment";

const { Option } = Select;
const { RangePicker } = DatePicker;

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
  const [editingId, setEditingId] = useState(null);
  const [editedNotes, setEditedNotes] = useState("");
  const [editedProblem, setEditedProblem] = useState("");
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

  const handleSearch = () => {
    let filtered = appointments;

    if (filterType && filterValue) {
      filtered = appointments.filter((appointment) => {
        if (filterType === "Patients") {
          return appointment.userName
            .toLowerCase()
            .includes(filterValue.toLowerCase());
        }
        if (filterType === "Doctors") {
          return appointment.doctorName
            .toLowerCase()
            .includes(filterValue.toLowerCase());
        }
        if (filterType === "Appointment Date") {
          const [start, end] = filterValue;
          return moment(appointment.date).isBetween(start, end, null, "[]");
        }
        if (filterType === "Status") {
          return appointment.status
            .toLowerCase()
            .includes(filterValue.toLowerCase());
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

  const handleEdit = (record) => {
    setEditingId(record.id);
    setEditedNotes(record.notes);
    setEditedProblem(record.problem);
  };

  const handleSave = async (id) => {
    try {
      dispatch(ShowLoader(true));
      const notesResponse = await SaveDoctorNotes(id, editedNotes);
      const problemResponse = await UpdateProblem(id, editedProblem);
      dispatch(ShowLoader(false));
      if (notesResponse.success && problemResponse.success) {
        message.success("Appointment updated successfully");
        setEditingId(null);
        getData();
      } else {
        throw new Error(notesResponse.message || problemResponse.message);
      }
    } catch (error) {
      dispatch(ShowLoader(false));
      message.error(error.message);
    }
  };

  const getColumnSearchProps = (dataIndex) => ({
    filterDropdown: ({
      setSelectedKeys,
      selectedKeys,
      confirm,
      clearFilters,
    }) => (
      <div style={{ padding: 8 }}>
        {dataIndex === "date" ? (
          <RangePicker
            onChange={(dates, dateStrings) => {
              setSelectedKeys(dateStrings.length > 0 ? [dateStrings] : []);
            }}
            style={{ marginBottom: 8, display: "block" }}
          />
        ) : (
          <Input
            placeholder={`Search ${dataIndex}`}
            value={selectedKeys[0]}
            onChange={(e) =>
              setSelectedKeys(e.target.value ? [e.target.value] : [])
            }
            onPressEnter={() => confirm()}
            style={{ marginBottom: 8, display: "block" }}
          />
        )}
        <Button
          type="primary"
          onClick={() => confirm()}
          icon={<SearchOutlined />}
          size="small"
          style={{ width: 90, marginRight: 8 }}
        >
          Search
        </Button>
        <Button onClick={() => clearFilters()} size="small" style={{ width: 90 }}>
          Reset
        </Button>
      </div>
    ),
    filterIcon: (filtered) => (
      <SearchOutlined style={{ color: filtered ? "#1890ff" : undefined }} />
    ),
    onFilter: (value, record) =>
      dataIndex === "date"
        ? moment(record[dataIndex]).isBetween(value[0], value[1], null, "[]")
        : record[dataIndex]
            .toString()
            .toLowerCase()
            .includes(value.toLowerCase()),
  });

  const columns = [
    {
      title: "Date",
      dataIndex: "date",
      key: "date",
      sorter: (a, b) => moment(a.date).unix() - moment(b.date).unix(),
      ...getColumnSearchProps("date"),
    },
    {
      title: "Time",
      dataIndex: "slot",
      key: "slot",
      sorter: (a, b) => a.slot.localeCompare(b.slot),
      ...getColumnSearchProps("slot"),
    },
    {
      title: "Doctor",
      dataIndex: "doctorName",
      key: "doctorName",
      sorter: (a, b) => a.doctorName.localeCompare(b.doctorName),
      ...getColumnSearchProps("doctorName"),
    },
    {
      title: "Patient",
      dataIndex: "userName",
      key: "userName",
      sorter: (a, b) => a.userName.localeCompare(b.userName),
      ...getColumnSearchProps("userName"),
    },
    {
      title: "Booked On",
      dataIndex: "bookedOn",
      key: "bookedOn",
      sorter: (a, b) => moment(a.bookedOn).unix() - moment(b.bookedOn).unix(),
      ...getColumnSearchProps("bookedOn"),
    },
    {
      title: "Problem",
      dataIndex: "problem",
      key: "problem",
      sorter: (a, b) => a.problem.localeCompare(b.problem),
      render: (text, record) => {
        return editingId === record.id ? (
          <Input
            value={editedProblem}
            onChange={(e) => setEditedProblem(e.target.value)}
          />
        ) : (
          text
        );
      },
      ...getColumnSearchProps("problem"),
    },
    {
      title: "Status",
      dataIndex: "status",
      key: "status",
      sorter: (a, b) => a.status.localeCompare(b.status),
      ...getColumnSearchProps("status"),
    },
    {
      title: "Doctor's Notes",
      dataIndex: "notes",
      key: "notes",
      render: (text, record) => {
        return editingId === record.id ? (
          <Input
            value={editedNotes}
            onChange={(e) => setEditedNotes(e.target.value)}
          />
        ) : (
          text
        );
      },
    },
    {
      title: "Action",
      dataIndex: "action",
      key: "action",
      render: (text, record) => {
        return editingId === record.id ? (
          <div style={{ display: "flex", gap: "0.5rem", alignItems: "center" }}>
            <Button onClick={() => handleSave(record.id)}>Save</Button>
            <Button onClick={() => setEditingId(null)}>Cancel</Button>
          </div>
        ) : (
          <div style={{ display: "flex", gap: "0.5rem", alignItems: "center" }}>
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
            {user.role === "admin" && (
              <Button type="link" onClick={() => handleEdit(record)}>
                Edit
              </Button>
            )}
          </div>
        );
      },
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
          <RangePicker
            onChange={(dates, dateStrings) => setFilterValue(dateStrings)}
            style={{ width: 300 }}
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
          style={{
            backgroundColor: "white",
            color: "#004182",
            borderColor: "#004182",
          }}
        >
          Search
        </Button>
      </div>

      <Table
        columns={columns}
        dataSource={filteredAppointments.length > 0 ? filteredAppointments : appointments}
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
