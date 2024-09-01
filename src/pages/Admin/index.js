import React, { useEffect, useState } from "react";
import { message, Tabs, Card, Row, Col, Statistic } from "antd";
import UsersList from "./UsersList";
import DoctorsList from "./DoctorsList";
import { useDispatch } from "react-redux";
import { ShowLoader } from "../../redux/loaderSlice";
import {
  GetUserById,
  GetAllUsers,
} from "../../apicalls/users"; // Adjust according to your actual path for user-related API functions
import {
  GetAppointments,
} from "../../apicalls/appointments"; // Adjust according to your actual path for appointments API functions
import AppointmentsList from "./AppointmentsList";
import ChatSupport from "../Profile/ChatSupport";
import { collection, onSnapshot, deleteDoc, doc } from "firebase/firestore";
import firestoreDatabase from "../../firebaseConfig";
import moment from "moment"; // Import moment.js for date manipulation

function Admin() {
  const [isAdmin, setIsAdmin] = useState(false);
  const [dashboardData, setDashboardData] = useState({
    appointments: 0,
    doctors: 0,
    patients: 0,
    appointmentsThisYear: 0,
    appointmentsThisMonth: 0,
    appointmentsToday: 0,
    monthlyAppointments: Array(12).fill(0), // Array to hold counts for each month
  });
  const [selectedUserId, setSelectedUserId] = useState(null);
  const [userList, setUserList] = useState([]);
  const [activeChats, setActiveChats] = useState([]);
  const [highlightedChat, setHighlightedChat] = useState(null);
  const user = JSON.parse(localStorage.getItem("user"));
  const dispatch = useDispatch();

  const fetchDashboardData = async () => {
    try {
      dispatch(ShowLoader(true));

      // Fetch all appointments
      const appointmentsRes = await GetAppointments();

      // Fetch all users
      const usersRes = await GetAllUsers();
      const usersData = usersRes.data || [];

      // Filter users based on roles
      const doctorsCount = usersData.filter(user => user.role === "doctor").length;
      const patientsCount = usersData.filter(user => user.role === "user").length;

      const today = moment().startOf('day');
      const thisMonth = moment().startOf('month');
      const thisYear = moment().startOf('year');

      const monthlyAppointments = Array(12).fill(0); // Initialize an array to store appointments per month

      // Filter appointments by year, month, and date
      const appointmentsThisYear = appointmentsRes.data.filter(appointment => {
        const appointmentDate = moment(appointment.date);
        if (appointmentDate.isSame(thisYear, 'year')) {
          monthlyAppointments[appointmentDate.month()] += 1; // Increment the count for the respective month
          return true;
        }
        return false;
      }).length;

      const appointmentsThisMonth = monthlyAppointments[thisMonth.month()];
      const appointmentsToday = appointmentsRes.data.filter(appointment => moment(appointment.date).isSame(today, 'day')).length;

      setDashboardData({
        appointments: appointmentsRes.data.length || 0,
        doctors: doctorsCount,
        patients: patientsCount,
        appointmentsThisYear,
        appointmentsThisMonth,
        appointmentsToday,
        monthlyAppointments,
      });
    } catch (error) {
      message.error("Failed to fetch dashboard data");
    } finally {
      dispatch(ShowLoader(false));
    }
  };

  const checkIsAdmin = async () => {
    try {
      dispatch(ShowLoader(true));
      const response = await GetUserById(user.id);
      if (response.success && response.data.role === "admin") {
        setIsAdmin(true);
        const usersResponse = await GetAllUsers();
        if (usersResponse.success) {
          setUserList(usersResponse.data || []);
        } else {
          message.error("Failed to fetch users");
        }
        fetchDashboardData();
      } else {
        throw new Error("You are not an admin");
      }
    } catch (error) {
      message.error(error.message);
    } finally {
      dispatch(ShowLoader(false));
    }
  };

  // eslint-disable-next-line react-hooks/exhaustive-deps
  useEffect(() => {
    checkIsAdmin();
  }, []);

  useEffect(() => {
    if (isAdmin) {
      const unsubscribe = onSnapshot(collection(firestoreDatabase, "chats"), (snapshot) => {
        const chatList = [];
        snapshot.forEach((doc) => {
          const docId = doc.id;
          if (docId.endsWith("_admin") && (doc.data().messages || []).length > 0) {
            chatList.push({ chatId: docId, lastMessageTime: doc.data().messages.slice(-1)[0].timestamp });
            if (docId !== selectedUserId) {
              setHighlightedChat(docId); // Highlight the chat that just got updated
            }
          }
        });
        setActiveChats(chatList.sort((a, b) => b.lastMessageTime - a.lastMessageTime)); // Sort by most recent message
      });

      return () => unsubscribe(); // Clean up the listener on unmount
    }
  }, [isAdmin, selectedUserId]);

  const handleClearChat = async (userId) => {
    const chatDocId = `chat_${userId}_admin`;
    const chatDocRef = doc(firestoreDatabase, "chats", chatDocId);

    try {
      await deleteDoc(chatDocRef); // Delete the chat document
      message.success("Chat cleared and document deleted successfully");
    } catch (error) {
      message.error("Failed to clear chat: " + error.message);
    }
  };

  return (
    isAdmin && (
      <div className="bg-white p-1">
        <Tabs>
          <Tabs.TabPane tab="Dashboard" key="1">
            {/* Dashboard Content */}
            <Row gutter={16} style={{ marginBottom: "16px" }}>
              <Col span={8}>
                <Card>
                  <Statistic
                    title="Total Appointments"
                    value={dashboardData.appointments}
                  />
                </Card>
              </Col>
              <Col span={8}>
                <Card>
                  <Statistic title="Total Doctors" value={dashboardData.doctors} />
                </Card>
              </Col>
              <Col span={8}>
                <Card>
                  <Statistic title="Total Patients" value={dashboardData.patients} />
                </Card>
              </Col>
            </Row>

            <Row gutter={16} style={{ marginBottom: "16px" }}>
              <Col span={8}>
                <Card>
                  <Statistic
                    title="Appointments This Year"
                    value={dashboardData.appointmentsThisYear}
                  />
                </Card>
              </Col>
              <Col span={8}>
                <Card>
                  <Statistic
                    title="Appointments This Month"
                    value={dashboardData.appointmentsThisMonth}
                  />
                </Card>
              </Col>
              <Col span={8}>
                <Card>
                  <Statistic
                    title="Appointments Today"
                    value={dashboardData.appointmentsToday}
                  />
                </Card>
              </Col>
            </Row>

            {/* Monthly Breakdown */}
            <Row gutter={16} style={{ marginBottom: "16px" }}>
              {dashboardData.monthlyAppointments.map((count, index) => (
                <Col span={8} key={index}>
                  <Card>
                    <Statistic
                      title={moment().month(index).format('MMMM')}
                      value={count}
                    />
                  </Card>
                </Col>
              ))}
            </Row>
          </Tabs.TabPane>

          <Tabs.TabPane tab="Appointments" key="2">
            <AppointmentsList />
          </Tabs.TabPane>
          <Tabs.TabPane tab="Users" key="3">
            <UsersList />
          </Tabs.TabPane>
          <Tabs.TabPane tab="Doctors" key="4">
            <DoctorsList />
          </Tabs.TabPane>
          <Tabs.TabPane tab="Chat Support" key="5">
            <div style={{ display: 'flex', height: '100vh' }}>
              <div style={{ width: '25%', borderRight: '1px solid #ccc', padding: '1rem' }}>
                <h3>Active Chats</h3>
                <ul style={{ listStyleType: 'none', padding: 0 }}>
                  {activeChats.length > 0 ? (
                    activeChats.map(({ chatId }) => {
                      const userId = chatId.replace('chat_', '').replace('_admin', '');
                      return (
                        <li
                          key={chatId}
                          onClick={() => {
                            setSelectedUserId(userId);
                            setHighlightedChat(null);
                          }}
                          style={{
                            padding: '0.5rem',
                            cursor: 'pointer',
                            backgroundColor: highlightedChat === chatId ? '#ffeb3b' : selectedUserId === userId ? '#e6f7ff' : 'transparent',
                          }}
                        >
                          {userList.find(u => u.id === userId)?.name || 'Unknown User'}
                          <button onClick={() => handleClearChat(userId)} style={{ marginLeft: '10px' }}>
                            Clear Chat
                          </button>
                        </li>
                      );
                    })
                  ) : (
                    <li>No active chats available</li>
                  )}
                </ul>
              </div>
              <div style={{ flex: 1, padding: '1rem' }}>
                {selectedUserId ? (
                  <ChatSupport userId={selectedUserId} />
                ) : (
                  <div>Please select a chat to start the conversation</div>
                )}
              </div>
            </div>
          </Tabs.TabPane>
        </Tabs>
      </div>
    )
  );
}

export default Admin;
