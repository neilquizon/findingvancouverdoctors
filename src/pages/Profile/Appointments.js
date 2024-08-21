import React, { useEffect, useState, useCallback, useRef } from 'react';
import { useDispatch } from 'react-redux';
import { ShowLoader } from '../../redux/loaderSlice';
import { Table, message, Modal, Select, Input, Button } from 'antd';
import { GetDoctorAppointments, GetUserAppointments } from '../../apicalls/appointments';
import './Appointments.css'; 
import moment from 'moment';

const { Option } = Select;

function Appointments() {
  const [appointments, setAppointments] = useState([]);
  const [filteredAppointments, setFilteredAppointments] = useState([]);
  const [filterType, setFilterType] = useState(null);
  const [filterValue, setFilterValue] = useState(null);
  const [isModalVisible, setIsModalVisible] = useState(false);
  const dispatch = useDispatch();
  const user = JSON.parse(localStorage.getItem("user"));
  const printRef = useRef(); // Reference for the printable content

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

  const columns = [
    { title: 'Date', dataIndex: 'date', key: 'date' },
    { title: 'Time', dataIndex: 'slot', key: 'slot' },
    { title: 'Doctor', dataIndex: 'doctorName', key: 'doctorName', hidden: user.role === 'doctor' },
    { title: 'Patient', dataIndex: 'userName', key: 'userName', hidden: user.role === 'user' },
    { title: 'Email', dataIndex: 'userEmail', key: 'userEmail' },
    { title: 'Booked On', dataIndex: 'bookedOn', key: 'bookedOn' },
    { title: 'Problem', dataIndex: 'problem', key: 'problem' },
    { title: 'Status', dataIndex: 'status', key: 'status' },
  ].filter(col => !col.hidden); // Filter out hidden columns based on role

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
