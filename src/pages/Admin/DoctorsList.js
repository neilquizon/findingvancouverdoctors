import { message, Table } from "antd";
import React, { useEffect } from "react";
import { useDispatch } from "react-redux";
import { GetAllDoctors, UpdateDoctor } from "../../apicalls/doctors";
import { ShowLoader } from "../../redux/loaderSlice";
import './DoctorsList.css'; // Ensure you create this CSS file

// Footer Component
const Footer = () => (
  <footer style={{ backgroundColor: '#004182', color: 'white', padding: '1rem', fontFamily: 'Roboto, sans-serif', textAlign: 'center' }}>
    <p style={{ color: 'white' }}>&copy; 2024 Finding Vancouver Doctor. All rights reserved.</p>
  </footer>
);

function DoctorsList() {
  const [doctors, setDoctors] = React.useState([]);

  const dispatch = useDispatch();
  const getData = async () => {
    try {
      dispatch(ShowLoader(true));
      const response = await GetAllDoctors();
      dispatch(ShowLoader(false));
      if (response.success) {
        // Sort doctors by first name and last name in alphabetical order
        const sortedDoctors = response.data.sort((a, b) => {
          const nameA = `${a.firstName} ${a.lastName}`.toLowerCase();
          const nameB = `${b.firstName} ${b.lastName}`.toLowerCase();
          return nameA.localeCompare(nameB);
        });
        setDoctors(sortedDoctors);
      } else {
        throw new Error(response.message);
      }
    } catch (error) {
      dispatch(ShowLoader(false));
      message.error(error.message);
    }
  };

  const changeStatus = async (payload) => {
    try {
      dispatch(ShowLoader(true));
      const response = await UpdateDoctor(payload);
      dispatch(ShowLoader(false));
      if (response.success) {
        message.success(response.message);
        getData();
      } else {
        throw new Error(response.message);
      }
    } catch (error) {
      message.error(error.message);
      dispatch(ShowLoader(false));
    }
  };

  useEffect(() => {
    getData();
  }, []);

  const columns = [
    { title: "First Name", dataIndex: "firstName" },
    { title: "Last Name", dataIndex: "lastName" },
    { title: "Email", dataIndex: "email" },
    { title: "Phone", dataIndex: "phone" },
    { title: "Speciality", dataIndex: "speciality" },
    {
      title: "Status",
      dataIndex: "status",
      render: (text, record) => text.toUpperCase()
    },
    {
      title: "Actions",
      dataIndex: "actions",
      render: (text, record) => {
        if (record.status === "pending") {
          return (
            <div className="flex gap-1">
              <span
                className="underline cursor-pointer"
                onClick={() => changeStatus({ ...record, status: "rejected" })}
              >
                Reject
              </span>
              <span
                className="underline cursor-pointer"
                onClick={() => changeStatus({ ...record, status: "approved" })}
              >
                Approve
              </span>
            </div>
          );
        }
        if (record.status === "approved") {
          return (
            <div className="flex gap-1">
              <span
                className="underline cursor-pointer"
                onClick={() => changeStatus({ ...record, status: "blocked" })}
              >
                Block
              </span>
            </div>
          );
        }
        if (record.status === "blocked") {
          return (
            <div className="flex gap-1">
              <span
                className="underline cursor-pointer"
                onClick={() => changeStatus({ ...record, status: "approved" })}
              >
                Unblock
              </span>
            </div>
          );
        }
      }
    }
  ];

  return (
    <div className="table-container">
      <Table columns={columns} dataSource={doctors} pagination={false} scroll={{ x: true }} />
      <Footer /> {/* Insert the Footer component here */}
    </div>
  );
}

export default DoctorsList;
