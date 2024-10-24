import { message, Table } from "antd";
import React, { useEffect } from "react";
import { useDispatch } from "react-redux";
import { GetAllDoctors, UpdateDoctor } from "../../apicalls/doctors";
import { ShowLoader } from "../../redux/loaderSlice";
import emailjs from 'emailjs-com'; // Import EmailJS
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

  // Function to send email notifications
  const sendEmailNotification = (email, firstName, status) => {
    const templateParams = {
      from_name: 'Finding Vancouver Doctor',  // Your service name
      from_email: 'noreply@findingvancouverdoctor.com',  // Your sender email
      to_email: email,  // Doctor's email (dynamic)
      to_name: firstName,  // Doctor's first name (dynamic)
      message: `Hello ${firstName}, your account has been ${status}. If you have any questions, please contact support.`,
    };

    console.log('Sending email with params:', templateParams);  // Log the template parameters for debugging

    emailjs.send(
      'service_7rqzzbn',       // Your EmailJS Service ID
      'template_izpot6c',      // Your EmailJS Template ID
      templateParams, 
      'MfjeugCZV3OLQrm7O'      // Your EmailJS User ID
    )
    .then((response) => {
      console.log('Email sent successfully:', response.status, response.text);
      message.success('Email notification sent successfully');
    })
    .catch((error) => {
      console.error('Failed to send email:', error);  // Log the error for debugging
      message.error('Failed to send the email notification');
    });
  };

  const changeStatus = async (payload) => {
    try {
      dispatch(ShowLoader(true));
      const response = await UpdateDoctor(payload);
      dispatch(ShowLoader(false));
      if (response.success) {
        message.success(response.message);
        getData();

        // Send email notification on status change
        sendEmailNotification(payload.email, payload.firstName, payload.status);
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
