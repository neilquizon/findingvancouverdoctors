import React, { useEffect, useState, useCallback, useRef } from 'react';
import { useDispatch } from 'react-redux';
import { ShowLoader } from '../../redux/loaderSlice';
import {
  Table,
  message,
  Modal,
  Select,
  Input,
  Button,
  DatePicker,
  Tooltip,
} from 'antd';
import {
  GetDoctorAppointments,
  GetUserAppointments,
  UpdateAppointmentStatus,
  DeleteAppointment,
  SaveDoctorNotes,
  SubmitRating,
} from '../../apicalls/appointments';
import { GetDoctorById } from '../../apicalls/doctors';
import { doc, updateDoc } from 'firebase/firestore';
import firestoreDatabase from '../../firebaseConfig';
import emailjs from 'emailjs-com';
import './Appointments.css';
import moment from 'moment';
import { useNavigate } from 'react-router-dom';
import { SearchOutlined } from '@ant-design/icons';

const { Option } = Select;
const { TextArea } = Input;
const { RangePicker } = DatePicker;

/** 
 * =============================================================================
 * 1) PROFANITY FILTER SETUP
 * =============================================================================
 * Here is our custom profanity list and checker function. 
 * - If you want to block additional words, add them to PROFANITY_LIST.
 * - This approach blocks "bitch" but NOT "bitching" unless you add "bitching" too.
 * - Punctuation (e.g., "bitch!") and case (e.g., "BITCH") are handled automatically.
 */
const PROFANITY_LIST = [
  'bitch',
  'shit',
  'damn',
  'crap',
  'fuck',
  'asshole',
  'hell',
  // add or remove words as needed
];

function containsProfanity(text) {
  if (!text) return false;

  // Lowercase for case-insensitive match
  let lowerText = text.toLowerCase();

  // Remove punctuation so "bitch!" => "bitch"
  lowerText = lowerText.replace(/[^\w\s]/g, '');

  // Split into individual words by whitespace
  const words = lowerText.split(/\s+/);

  // Return true if any word is in our list
  return words.some((word) => PROFANITY_LIST.includes(word));
}

/**
 * =============================================================================
 * Appointments Component
 * =============================================================================
 */
function Appointments() {
  const [appointments, setAppointments] = useState([]);
  const [filteredAppointments, setFilteredAppointments] = useState([]);
  const [filterType, setFilterType] = useState(null);
  const [filterValue, setFilterValue] = useState(null);
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [notes, setNotes] = useState({});
  const [problems, setProblems] = useState({});
  const [ratedAppointments, setRatedAppointments] = useState(new Set());
  const [ratedStatus, setRatedStatus] = useState({});
  const [rating, setRating] = useState({});
  const [comment, setComment] = useState({});
  const dispatch = useDispatch();
  const user = JSON.parse(localStorage.getItem('user'));
  const navigate = useNavigate();
  const printRef = useRef();

  // Helper function to check if appointment is within 24 hours
  const isWithin24Hours = (appointmentDateTime) => {
    const now = moment();
    const appointmentMoment = moment(appointmentDateTime);
    const diffHours = appointmentMoment.diff(now, 'hours');
    return diffHours <= 24 && diffHours >= 0;
  };

  const getData = useCallback(async () => {
    try {
      dispatch(ShowLoader(true));
      let response;
      if (user.role === 'doctor') {
        response = await GetDoctorAppointments(user.id);
      } else {
        response = await GetUserAppointments(user.id);
      }
      dispatch(ShowLoader(false));
      if (response.success) {
        const sortedAppointments = response.data.sort(
          (a, b) => moment(a.date).unix() - moment(b.date).unix()
        );

        const ratedSet = new Set();
        const ratedStats = {};

        sortedAppointments.forEach((appointment) => {
          if (appointment.rated === 'Yes') {
            ratedSet.add(appointment.id);
            ratedStats[appointment.id] = 'Yes';
          } else {
            ratedStats[appointment.id] = 'Not Yet';
          }
        });

        setRatedAppointments(ratedSet);
        setRatedStatus(ratedStats);
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

  const handleFilterValueChange = (value) => {
    setFilterValue(value);
  };

  const handleFilterValueChangeInput = (e) => {
    setFilterValue(e.target.value);
  };

  const handleSearch = () => {
    let filtered = appointments;

    if (filterType && filterValue) {
      filtered = appointments.filter((appointment) => {
        if (filterType === 'Patients') {
          return appointment.userName
            .toLowerCase()
            .includes(filterValue.toLowerCase());
        }
        if (filterType === 'Doctors') {
          return appointment.doctorName
            .toLowerCase()
            .includes(filterValue.toLowerCase());
        }
        if (filterType === 'Appointment Date') {
          const [start, end] = filterValue;
          return moment(appointment.date).isBetween(start, end, null, '[]');
        }
        if (filterType === 'Status') {
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
    const printWindow = window.open('', '', 'height=600,width=800');
    printWindow.document.write('<html><head><title>Appointments Report</title>');
    printWindow.document.write('</head><body>');
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

    emailjs
      .send('service_7rqzzbn', 'template_izpot6c', templateParams, 'MfjeugCZV3OLQrm7O')
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
      const appointment = appointments.find((app) => app.id === id);
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
      message.error('Failed to update appointment: ' + error.message);
    }
  };

  const onDelete = async (id, navigateToBookAppointment, action) => {
    try {
      dispatch(ShowLoader(true));
      const appointment = appointments.find((app) => app.id === id);
      const doctorEmail = appointment.doctorEmail;
      const userEmail = appointment.userEmail || appointment.user?.email;

      const response = await DeleteAppointment(id);
      dispatch(ShowLoader(false));
      if (response.success) {
        message.success(response.message);

        const emailSubject =
          action === 'reschedule'
            ? 'Appointment Reschedule Notice'
            : 'Appointment Cancellation Notice';
        const emailTextUser = `Dear ${appointment.userName},\n\nYour appointment with Dr. ${appointment.doctorName} on ${appointment.date} at ${appointment.slot} has been ${
          action === 'reschedule' ? 'rescheduled' : 'cancelled'
        }.`;
        const emailTextDoctor = `Dear Dr. ${appointment.doctorName},\n\nThe appointment with ${appointment.userName} on ${appointment.date} at ${appointment.slot} has been ${
          action === 'reschedule' ? 'rescheduled' : 'cancelled'
        }.`;

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

  const saveNotes = async (appointmentId, isModal) => {
    if (isModal) return;

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

  const saveProblem = async (appointmentId, isModal) => {
    if (isModal) return;

    try {
      dispatch(ShowLoader(true));
      const response = await SaveDoctorNotes(appointmentId, problems[appointmentId]);
      dispatch(ShowLoader(false));
      if (response.success) {
        message.success('Problem saved successfully');
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
    setRating((prevRating) => ({
      ...prevRating,
      [appointmentId]: value,
    }));
  };

  const handleCommentChange = (appointmentId, value) => {
    setComment((prevComment) => ({
      ...prevComment,
      [appointmentId]: value,
    }));
  };

  const recheckRating = async (appointmentId) => {
    try {
      const appointment = appointments.find((app) => app.id === appointmentId);
      const doctorId = appointment.doctorId;
      const doctorData = await GetDoctorById(doctorId);
      const userHasRated = doctorData.data?.ratings?.some(
        (r) => r.userId === user.id
      );
      if (userHasRated) {
        setRatedAppointments((prevRatedAppointments) => new Set([...prevRatedAppointments, appointmentId]));
        setRatedStatus((prevRatedStatus) => ({
          ...prevRatedStatus,
          [appointmentId]: 'Yes',
        }));
      }
    } catch (error) {
      message.error('Error rechecking rating data.');
    }
  };

  /**
   * =========================================================================
   * 2) INSERT PROFANITY CHECK INTO submitRating
   * =========================================================================
   */
  const submitRating = async (appointmentId, isModal) => {
    if (isModal) return;

    try {
      const selectedRating = rating[appointmentId];
      const userComment = comment[appointmentId];

      if (!selectedRating) {
        message.error('Please select a rating before submitting.');
        return;
      }

      // >>> PROFANITY CHECK <<<
      if (containsProfanity(userComment)) {
        message.error('Your comment contains inappropriate language. Please revise.');
        return;
      }

      dispatch(ShowLoader(true));

      const appointment = appointments.find((app) => app.id === appointmentId);
      const response = await SubmitRating(
        appointment.doctorId,
        user.id,
        selectedRating,
        userComment,
        appointmentId
      );

      if (response.success) {
        const appointmentDoc = doc(firestoreDatabase, 'appointments', appointmentId);
        await updateDoc(appointmentDoc, { rated: 'Yes' });

        const updatedAppointments = appointments.map((app) =>
          app.id === appointmentId
            ? { ...app, rating: selectedRating, comment: userComment, rated: 'Yes' }
            : app
        );

        setAppointments(updatedAppointments);
        setRatedAppointments(new Set([...ratedAppointments, appointmentId]));
        setRatedStatus((prevRatedStatus) => ({
          ...prevRatedStatus,
          [appointmentId]: 'Yes',
        }));

        message.success('Rating submitted successfully');
        recheckRating(appointmentId);
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
    const title =
      action === 'reschedule'
        ? 'Are you sure you want to reschedule this appointment? This will delete the current appointment and cannot be undone.'
        : 'Are you sure you want to cancel this appointment?';

    Modal.confirm({
      title: title,
      onOk() {
        if (isDoctor) {
          onUpdate(id, 'cancelled');
        } else {
          onDelete(id, navigateToBookAppointment, action);
        }
      },
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
        {dataIndex === 'date' ? (
          <RangePicker
            onChange={(dates, dateStrings) => {
              setSelectedKeys(dateStrings.length > 0 ? [dateStrings] : []);
            }}
            style={{ marginBottom: 8, display: 'block' }}
          />
        ) : (
          <Input
            placeholder={`Search ${dataIndex}`}
            value={selectedKeys[0]}
            onChange={(e) =>
              setSelectedKeys(e.target.value ? [e.target.value] : [])
            }
            onPressEnter={() => confirm()}
            style={{ marginBottom: 8, display: 'block' }}
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
      <SearchOutlined style={{ color: filtered ? '#1890ff' : undefined }} />
    ),
    onFilter: (value, record) =>
      dataIndex === 'date'
        ? moment(record[dataIndex]).isBetween(value[0], value[1], null, '[]')
        : record[dataIndex].toString().toLowerCase().includes(value.toLowerCase()),
  });

  const renderNotesColumn = (text, record) => {
    const isModal = isModalVisible;
    return (
      <div>
        {user.role === 'doctor' ? (
          <>
            <TextArea
              rows={4}
              value={notes[record.id] || record.notes || ''}
              onChange={(e) => handleNotesChange(record.id, e.target.value)}
            />
            {!isModal && (
              <button onClick={() => saveNotes(record.id, isModal)}>Save</button>
            )}
          </>
        ) : (
          <div>{record.notes || 'Not Available'}</div>
        )}
      </div>
    );
  };

  const renderProblemColumn = (text, record) => {
    const isPastDate = moment(record.date).isBefore(moment(), 'day');
    return (
      <div>
        {user.role === 'user' && !isPastDate ? (
          <>
            <TextArea
              rows={2}
              value={problems[record.id] || record.problem || ''}
              onChange={(e) => handleProblemChange(record.id, e.target.value)}
            />
            <button onClick={() => saveProblem(record.id, isModalVisible)}>
              Save
            </button>
          </>
        ) : (
          <div>{record.problem || 'No Problem specified'}</div>
        )}
      </div>
    );
  };

  const renderStatusColumn = (text, record) => {
    const isPastDate = moment(record.date).isBefore(moment(), 'day');
    return (
      <div>
        {user.role === 'doctor' && !isPastDate ? (
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
        ) : (
          <div>{record.status}</div>
        )}
      </div>
    );
  };

  const renderRateDoctorColumn = (text, record) => {
    if (user.role !== 'doctor') {
      const isRated = ratedStatus[record.id] === 'Yes';

      return (
        <div>
          <Select
            style={{ width: 120 }}
            value={rating[record.id]}
            onChange={(value) => handleRatingChange(record.id, value)}
            placeholder="Rate"
            disabled={isRated}
          >
            {[1, 2, 3, 4, 5].map((star) => (
              <Option key={star} value={star}>
                {`${star} Star${star > 1 ? 's' : ''}`}
              </Option>
            ))}
          </Select>
          <TextArea
            rows={2}
            value={comment[record.id]}
            onChange={(e) => handleCommentChange(record.id, e.target.value)}
            placeholder="Add a comment"
            style={{ marginTop: 8 }}
            disabled={isRated}
          />
          <Button
            type="primary"
            onClick={() => submitRating(record.id, false)}
            disabled={isRated}
          >
            Submit Rating
          </Button>
        </div>
      );
    }
    return null;
  };

  const columns = [
    {
      title: 'Date',
      dataIndex: 'date',
      key: 'date',
      sorter: (a, b) => moment(a.date).unix() - moment(b.date).unix(),
      ...getColumnSearchProps('date'),
    },
    {
      title: 'Time',
      dataIndex: 'slot',
      key: 'slot',
      sorter: (a, b) => a.slot.localeCompare(b.slot),
      ...getColumnSearchProps('slot'),
    },
    {
      title: 'Doctor',
      dataIndex: 'doctorName',
      key: 'doctorName',
      sorter: (a, b) => a.doctorName.localeCompare(b.doctorName),
      ...getColumnSearchProps('doctorName'),
    },
    {
      title: 'Patient',
      dataIndex: 'userName',
      key: 'userName',
      sorter: (a, b) => a.userName.localeCompare(b.userName),
      ...getColumnSearchProps('userName'),
    },
    {
      title: 'Booked On',
      dataIndex: 'bookedOn',
      key: 'bookedOn',
      sorter: (a, b) => moment(a.bookedOn).unix() - moment(b.bookedOn).unix(),
      ...getColumnSearchProps('bookedOn'),
    },
    {
      title: 'Problem',
      dataIndex: 'problem',
      key: 'problem',
      render: renderProblemColumn,
    },
    {
      title: 'Status',
      dataIndex: 'status',
      key: 'status',
      render: renderStatusColumn,
      ...getColumnSearchProps('status'),
    },
    {
      title: "Doctor's Notes",
      dataIndex: 'notes',
      key: 'notes',
      render: renderNotesColumn,
    },
    {
      title: 'Rate Doctor',
      dataIndex: 'rateDoctor',
      key: 'rateDoctor',
      render: renderRateDoctorColumn,
    },
    {
      title: 'Rated',
      dataIndex: 'rated',
      key: 'rated',
      render: (text, record) => ratedStatus[record.id] || 'Not Yet',
    },
  ];

  if (user.role === 'doctor') {
    columns.push({
      title: 'Action',
      dataIndex: 'action',
      key: 'action',
      render: (text, record) => {
        const isPastDate = moment(record.date).isBefore(moment(), 'day');
        return !isPastDate ? (
          <div
            style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}
          >
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
      },
    });
  } else {
    columns.push({
      title: 'Modify',
      dataIndex: 'modify',
      key: 'modify',
      render: (text, record) => {
        const isPastDate = moment(record.date).isBefore(moment(), 'day');
        const appointmentDateTime = moment(
          `${record.date} ${record.slot}`,
          'YYYY-MM-DD HH:mm'
        );
        const within24Hours = isWithin24Hours(appointmentDateTime);

        // Only apply disabling logic if user is a patient
        const disableActions = user.role === 'user' && within24Hours;

        return !isPastDate ? (
          <div style={{ display: 'flex', gap: '0.5rem' }}>
            <Tooltip
              title={
                disableActions
                  ? 'Cannot cancel within 24 hours of the appointment'
                  : 'Cancel Appointment'
              }
            >
              <span
                style={{
                  textDecoration: 'underline',
                  cursor: disableActions ? 'not-allowed' : 'pointer',
                  color: disableActions ? 'grey' : 'blue',
                }}
                onClick={() => {
                  if (!disableActions) {
                    showConfirm(record.id, false);
                  }
                }}
              >
                Cancel
              </span>
            </Tooltip>
            <Tooltip
              title={
                disableActions
                  ? 'Cannot reschedule within 24 hours of the appointment'
                  : 'Reschedule Appointment'
              }
            >
              <span
                style={{
                  textDecoration: 'underline',
                  cursor: disableActions ? 'not-allowed' : 'pointer',
                  color: disableActions ? 'grey' : 'blue',
                }}
                onClick={() => {
                  if (!disableActions) {
                    showConfirm(record.id, false, record.doctorId, 'reschedule');
                  }
                }}
              >
                Reschedule
              </span>
            </Tooltip>
          </div>
        ) : null;
      },
    });
  }

  return (
    <div className="table-container">
      <div style={{ marginBottom: 16 }}>
        <Select
          style={{ width: 200, marginRight: 16 }}
          placeholder={`Select Filter`}
          onChange={handleFilterChange}
        >
          {user.role === 'user' && <Option value="Doctors">Doctors</Option>}
          {user.role === 'doctor' && <Option value="Patients">Patients</Option>}
          <Option value="Appointment Date">Appointment Date</Option>
          <Option value="Status">Status</Option>
        </Select>

        {filterType === 'Doctors' && user.role === 'user' && (
          <Input
            placeholder="Enter Doctor's Name"
            value={filterValue}
            onChange={handleFilterValueChangeInput}
            style={{ width: 200 }}
          />
        )}

        {filterType === 'Patients' && user.role === 'doctor' && (
          <Input
            placeholder="Enter Patient's Name"
            value={filterValue}
            onChange={handleFilterValueChangeInput}
            style={{ width: 200 }}
          />
        )}

        {filterType === 'Appointment Date' && (
          <RangePicker
            onChange={(dates, dateStrings) => setFilterValue(dateStrings)}
            style={{ width: 300 }}
          />
        )}

        {filterType === 'Status' && (
          <Select
            style={{ width: 200 }}
            placeholder="Select Status"
            onChange={handleFilterValueChange}
          >
            <Option value="pending">Pending</Option>
            <Option value="approved">Approved</Option>
            <Option value="cancelled">Cancelled</Option>
            <Option value="completed">Completed</Option>
            <Option value="no show">No Show</Option>
            <Option value="in progress">In Progress</Option>
          </Select>
        )}

        <Button type="primary" onClick={handleSearch}>
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

      <Modal
        title="Filtered Appointments"
        visible={isModalVisible}
        onCancel={() => setIsModalVisible(false)}
        footer={[
          <Button
            key="print"
            style={{ backgroundColor: 'light blue', color: 'white' }}
            onClick={handlePrint}
          >
            Print
          </Button>,
        ]}
      >
        <div ref={printRef}>
          <Table
            columns={columns.filter(
              (col) => col.key !== 'modify' && col.key !== 'action'
            )}
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
