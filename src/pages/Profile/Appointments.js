import React, { useEffect, useState, useCallback, useRef } from 'react';
import { useDispatch } from 'react-redux';
import { ShowLoader } from '../../redux/loaderSlice';
import { Table, message, Modal, Select, Input, Button } from 'antd';
import { GetDoctorAppointments, GetUserAppointments, UpdateAppointmentStatus, DeleteAppointment, SaveDoctorNotes, SubmitRating } from '../../apicalls/appointments';
import emailjs from 'emailjs-com';
import './Appointments.css';
import moment from 'moment';
import { useNavigate } from 'react-router-dom';
import { SearchOutlined } from "@ant-design/icons";

const { Option } = Select;
const { TextArea } = Input;

function Appointments() {
  const [appointments, setAppointments] = useState([]);
  const [filteredAppointments, setFilteredAppointments] = useState([]);
  const [filterType, setFilterType] = useState(null);
  const [filterValue, setFilterValue] = useState(null);
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [notes, setNotes] = useState({});
  const [ratedAppointments, setRatedAppointments] = useState(new Set());
  const [rating, setRating] = useState({});
  const dispatch = useDispatch();
  const user = JSON.parse(localStorage.getItem("user"));
  const navigate = useNavigate();
  const printRef = useRef();

  const getData = useCallback(async () => {
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
          if (appointment.rating || appointment.status === "Rated") {
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
  }, [dispatch, user.id, user.role]);

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
    setFilterValue(e.target.value ? moment(e.target.value).format('YYYY-MM-DD') : null);
  };

  const handleSearch = () => {
    let filtered = appointments;

    if (filterType && filterValue) {
      filtered = appointments.filter((appointment) => {
        if (user.role === 'user') {
          if (filterType === 'Doctors') {
            return appointment.doctorName.toLowerCase().includes(filterValue.toLowerCase());
          }
        } else if (user.role === 'doctor') {
          if (filterType === 'Patients') {
            return appointment.userName.toLowerCase().includes(filterValue.toLowerCase());
          }
        }
        if (filterType === 'Appointment Date') {
          return moment(appointment.date).isSame(filterValue, 'day');
        }
        if (filterType === 'Status') {
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
    const printWindow = window.open('', '', 'height=600,width=800');
    printWindow.document.write('<html><head><title>Appointments Report</title>');
    printWindow.document.write('</head><body >');
    printWindow.document.write(printContent);
    printWindow.document.write('</body></html>');
    printWindow.document.close();
    printWindow.print();
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

  const onUpdate = async (id, status) => {
    try {
      dispatch(ShowLoader(true));
      const appointment = appointments.find(app => app.id === id);
      const userEmail = appointment.userEmail || appointment.user?.email; 
      const doctorEmail = appointment.doctorEmail || appointment.doctor?.email;
      const response = await UpdateAppointmentStatus(id, status);
      dispatch(ShowLoader(false));
      if (response.success) {
        message.success(response.message);

        const emailSubject = `Appointment Status Updated to "${status}"`;
        const emailTextUser = `Dear ${appointment.userName},\n\nYour appointment with Dr. ${appointment.doctorName} on ${appointment.date} at ${appointment.slot} has been updated to "${status}".\n\nThank you.`;
        const emailTextDoctor = `Dear Dr. ${appointment.doctorName},\n\nThe appointment with ${appointment.userName} on ${appointment.date} at ${appointment.slot} has been updated to "${status}".\n\nThank you.`;

        if (userEmail) {
          sendEmailNotification(userEmail, emailSubject, emailTextUser);
        }
        if (doctorEmail) {
          sendEmailNotification(doctorEmail, emailSubject, emailTextDoctor);
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

  const onDelete = async (id, navigateToBookAppointment, action) => {
    try {
      dispatch(ShowLoader(true));
      const appointment = appointments.find(app => app.id === id);
      const doctorEmail = appointment.doctorEmail;
      const userEmail = appointment.userEmail || appointment.user?.email; 

      const response = await DeleteAppointment(id);
      dispatch(ShowLoader(false));
      if (response.success) {
        message.success(response.message);

        const emailSubject = action === "reschedule" ? 'Appointment Reschedule Notice' : 'Appointment Cancellation Notice';
        const emailTextUser = `Dear ${appointment.userName},\n\nYour appointment with Dr. ${appointment.doctorName} on ${appointment.date} at ${appointment.slot} has been ${action === "reschedule" ? 'rescheduled' : 'cancelled'}.`;
        const emailTextDoctor = `Dear Dr. ${appointment.doctorName},\n\nThe appointment with ${appointment.userName} on ${appointment.date} at ${appointment.slot} has been ${action === "reschedule" ? 'rescheduled' : 'cancelled'}.`;

        if (doctorEmail) {
          sendEmailNotification(doctorEmail, emailSubject, emailTextDoctor);
        }
        if (userEmail) {
          sendEmailNotification(userEmail, emailSubject, emailTextUser);
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

  const saveNotes = async (appointmentId, isModal) => {
    if (isModal) return;

    try {
      dispatch(ShowLoader(true));
      const response = await SaveDoctorNotes(appointmentId, notes[appointmentId]);
      dispatch(ShowLoader(false));
      if (response.success) {
        message.success('Notes saved successfully');
        getData(); // Reload the data to reflect the saved notes
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

  const submitRating = async (appointmentId, isModal) => {
    if (isModal) return;

    try {
      const selectedRating = rating[appointmentId];
      if (!selectedRating) {
        message.error("Please select a rating before submitting.");
        return;
      }

      dispatch(ShowLoader(true));
      
      // Submit the rating
      const response = await SubmitRating(appointments.find(app => app.id === appointmentId).doctorId, user.id, selectedRating);
      
      if (response.success) {
        // Update status to "Rated"
        await UpdateAppointmentStatus(appointmentId, "Rated");
        
        // Update the local state immediately to reflect the change
        const updatedAppointments = appointments.map(app => 
          app.id === appointmentId ? { ...app, status: "Rated", rating: selectedRating } : app
        );

        setAppointments(updatedAppointments);
        setRatedAppointments(new Set([...ratedAppointments, appointmentId]));
        
        message.success('Rating submitted successfully');
      } else {
        throw new Error(response.message);
      }
    } catch (error) {
      message.error(error.message);
    } finally {
      dispatch(ShowLoader(false));
    }
  };

  const showConfirm = (id, isDoctor, navigateToBookAppointment, action) => {
    const title = action === "reschedule" 
      ? 'Are you sure you want to reschedule this appointment? This will delete the current appointment and cannot be undone.'
      : 'Are you sure you want to cancel this appointment?';

    Modal.confirm({
      title: title,
      onOk() {
        if (isDoctor) {
          onUpdate(id, "cancelled");
        } else {
          onDelete(id, navigateToBookAppointment, action);
        }
      }
    });
  };

  const handleChangeStatus = (id, value) => {
    onUpdate(id, value);
  };

  const getColumnSearchProps = (dataIndex) => ({
    filterDropdown: ({
      setSelectedKeys,
      selectedKeys,
      confirm,
      clearFilters,
    }) => (
      <div style={{ padding: 8 }}>
        <Input
          placeholder={`Search ${dataIndex}`}
          value={selectedKeys[0]}
          onChange={(e) =>
            setSelectedKeys(e.target.value ? [e.target.value] : [])
          }
          onPressEnter={() => confirm()}
          style={{ marginBottom: 8, display: "block" }}
        />
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
      record[dataIndex]
        .toString()
        .toLowerCase()
        .includes(value.toLowerCase()),
  });

  const renderNotesColumn = (text, record) => {
    const isModal = isModalVisible;
    return (
      <div>
        <TextArea
          rows={4}
          value={notes[record.id] || record.notes || ""}
          onChange={(e) => handleNotesChange(record.id, e.target.value)}
        />
        {!isModal && (
          <button onClick={() => saveNotes(record.id, isModal)}>Save</button>
        )}
      </div>
    );
  };

  const columns = [
    {
      title: 'Date',
      dataIndex: 'date',
      key: 'date',
      sorter: (a, b) => moment(a.date).unix() - moment(b.date).unix(),
      ...getColumnSearchProps("date"),
    },
    {
      title: 'Time',
      dataIndex: 'slot',
      key: 'slot',
      sorter: (a, b) => a.slot.localeCompare(b.slot),
      ...getColumnSearchProps("slot"),
    },
    {
      title: 'Doctor',
      dataIndex: 'doctorName',
      key: 'doctorName',
      sorter: (a, b) => a.doctorName.localeCompare(b.doctorName),
      ...getColumnSearchProps("doctorName"),
    },
    {
      title: 'Patient',
      dataIndex: 'userName',
      key: 'userName',
      sorter: (a, b) => a.userName.localeCompare(b.userName),
      ...getColumnSearchProps("userName"),
    },
    {
      title: 'Booked On',
      dataIndex: 'bookedOn',
      key: 'bookedOn',
      sorter: (a, b) => moment(a.bookedOn).unix() - moment(b.bookedOn).unix(),
      ...getColumnSearchProps("bookedOn"),
    },
    {
      title: 'Problem',
      dataIndex: 'problem',
      key: 'problem',
      sorter: (a, b) => a.problem.localeCompare(b.problem),
      ...getColumnSearchProps("problem"),
    },
    {
      title: 'Status',
      dataIndex: 'status',
      key: 'status',
      sorter: (a, b) => a.status.localeCompare(b.status),
      ...getColumnSearchProps("status"),
    },
    {
      title: 'Doctor\'s Notes',
      dataIndex: 'notes',
      key: 'notes',
      render: renderNotesColumn
    },
    {
      title: 'Rate Doctor',
      dataIndex: 'rateDoctor',
      key: 'rateDoctor',
      render: (text, record) => {
        const isModal = isModalVisible;
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
              {!isModal && (
                <Button type="primary" onClick={() => submitRating(record.id, isModal)}>
                  Submit Rating
                </Button>
              )}
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
              onClick={() => showConfirm(record.id, false, record.doctorId, 'reschedule')}
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
      {/* Render filter based on user's role */}
      <div style={{ marginBottom: 16 }}>
        <Select
          style={{ width: 200, marginRight: 16 }}
          placeholder={`Select Filter`}
          onChange={handleFilterChange}
        >
          {user.role === 'user' && (
            <Option value="Doctors">Doctors</Option>
          )}
          {user.role === 'doctor' && (
            <Option value="Patients">Patients</Option>
          )}
          <Option value="Appointment Date">Appointment Date</Option>
          <Option value="Status">Status</Option>
        </Select>

        {(filterType === 'Doctors' && user.role === 'user') && (
          <Input
            placeholder="Enter Doctor's Name"
            value={filterValue}
            onChange={handleFilterValueChange}
            style={{ width: 200 }}
          />
        )}

        {(filterType === 'Patients' && user.role === 'doctor') && (
          <Input
            placeholder="Enter Patient's Name"
            value={filterValue}
            onChange={handleFilterValueChange}
            style={{ width: 200 }}
          />
        )}

        {filterType === 'Appointment Date' && (
          <Input
            type="date"
            value={filterValue}
            onChange={handleDateFilterChange}
            style={{ width: 200 }}
          />
        )}

        {filterType === 'Status' && (
          <Input
            placeholder="Enter Status"
            value={filterValue}
            onChange={handleFilterValueChange}
            style={{ width: 200 }}
          />
        )}

        <Button type="primary" onClick={handleSearch}>
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
          <Button key="print" style={{ backgroundColor: 'light blue', color: 'white' }} onClick={handlePrint}>Print</Button>
        ]}
      >
        <div ref={printRef}>
          <Table
            columns={columns.filter(col => col.key !== 'modify' && col.key !== 'action')}
            dataSource={filteredAppointments}
            pagination={false}
            rowKey="id"
            scroll={{ x: 600 }}
          />
        </div>
      </Modal>
    </div>
  );
}

export default Appointments;
