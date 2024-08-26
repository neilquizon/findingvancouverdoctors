import React, { useEffect, useState } from "react";
import { message, Tabs } from "antd";
import UsersList from "./UsersList";
import DoctorsList from "./DoctorsList";
import { useDispatch } from "react-redux";
import { ShowLoader } from "../../redux/loaderSlice";
import { GetUserById, GetAllUsers } from "../../apicalls/users"; // Assuming you have GetAllUsers API
import AppointmentsList from "./AppointmentsList";
import { useNavigate } from "react-router-dom";
import ChatSupport from "../Profile/ChatSupport"; // Import the ChatSupport component

function Admin() {
  const [isAdmin, setIsAdmin] = useState(false);
  const [selectedUserId, setSelectedUserId] = useState(null); // State for selected user ID
  const [userList, setUserList] = useState([]); // State for list of users, initialized as an empty array
  const user = JSON.parse(localStorage.getItem("user"));
  const dispatch = useDispatch();
  const navigate = useNavigate();

  const checkIsAdmin = async () => {
    try {
      dispatch(ShowLoader(true));
      const response = await GetUserById(user.id);
      if (response.success && response.data.role === "admin") {
        setIsAdmin(true);
        const usersResponse = await GetAllUsers(); // Fetch all users (mocked or real)
        if (usersResponse.success) {
          setUserList(usersResponse.data || []); // Ensure that userList is always an array
        } else {
          message.error("Failed to fetch users");
        }
      } else {
        throw new Error("You are not an admin");
      }
    } catch (error) {
      message.error(error.message);
    } finally {
      dispatch(ShowLoader(false));
    }
  };

  useEffect(() => {
    checkIsAdmin();
  }, []);

  const handleUserSelect = (userId) => {
    setSelectedUserId(userId);
  };

  return (
    isAdmin && (
      <div className="bg-white p-1">
        <Tabs>
          <Tabs.TabPane tab="Appointments" key="1">
            <AppointmentsList />
          </Tabs.TabPane>
          <Tabs.TabPane tab="Users" key="2">
            <UsersList />
          </Tabs.TabPane>
          <Tabs.TabPane tab="Doctors" key="3">
            <DoctorsList />
          </Tabs.TabPane>
          <Tabs.TabPane tab="Chat Support" key="4"> {/* New Tab for Chat Support */}
            {/* User selection dropdown */}
            <div>
              <h3>Select a User to Chat With:</h3>
              <select
                onChange={(e) => handleUserSelect(e.target.value)}
                value={selectedUserId || ""}
              >
                <option value="" disabled>Select a user</option>
                {userList.length > 0 ? (
                  userList.map((user) => (
                    <option key={user.id} value={user.id}>
                      {user.name}
                    </option>
                  ))
                ) : (
                  <option value="" disabled>No users available</option>
                )}
              </select>
            </div>

            {/* Conditionally render the ChatSupport component if a user is selected */}
            {selectedUserId ? (
              <ChatSupport userId={selectedUserId} />
            ) : (
              <div>Please select a user to start the chat</div>
            )}
          </Tabs.TabPane>
        </Tabs>
      </div>
    )
  );
}

export default Admin;
