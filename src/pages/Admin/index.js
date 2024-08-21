import React, { useEffect } from "react";
import { message, Tabs } from "antd";
import UsersList from "./UsersList";
import DoctorsList from "./DoctorsList";
import { useDispatch } from "react-redux";
import { ShowLoader } from "../../redux/loaderSlice";
import { GetUserById } from "../../apicalls/users";
import AppointmentsList from "./AppointmentsList";
import { useNavigate } from "react-router-dom";

function Admin() {
  const [isAdmin, setIsAdmin] = React.useState(false);
  const user = JSON.parse(localStorage.getItem("user"));
  const dispatch = useDispatch();
  const navigate = useNavigate();

  const checkIsAdmin = async () => {
    try {
      dispatch(ShowLoader(true));
      const response = await GetUserById(user.id);
      dispatch(ShowLoader(false));
      if (response.success && response.data.role === "admin") {
        setIsAdmin(true);
      } else {
        throw new Error("You are not an admin");
      }
    } catch (error) {
      dispatch(ShowLoader(false));
      message.error(error.message);
    }
  };

  useEffect(() => {
    checkIsAdmin();
  }, []);

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
          
        </Tabs>
      </div>
    )
  );
}

export default Admin;
