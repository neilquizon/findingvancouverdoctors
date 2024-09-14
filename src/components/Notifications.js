import React, { useState, useEffect, useRef } from "react";
import { Badge, Dropdown, List, Avatar, Tooltip } from "antd";
import { BellOutlined } from "@ant-design/icons";
import {
  onSnapshot,
  collection,
  query,
  where,
} from "firebase/firestore";
import firestoreDatabase from "../firebaseConfig";
import moment from "moment";

function Notifications({ userId, userRole }) {
  const [notifications, setNotifications] = useState([]);
  const [visible, setVisible] = useState(false);
  const isInitialLoad = useRef(true);

  useEffect(() => {
    let q;
    if (userRole === "doctor") {
      q = query(
        collection(firestoreDatabase, "appointments"),
        where("doctorId", "==", userId)
      );
    } else {
      q = query(
        collection(firestoreDatabase, "appointments"),
        where("userId", "==", userId)
      );
    }

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const changes = snapshot.docChanges();

      console.log("onSnapshot called");
      console.log("Changes:", changes);

      if (isInitialLoad.current) {
        isInitialLoad.current = false;
        console.log("Initial load skipped");
        return;
      }

      changes.forEach((change) => {
        console.log("Change detected:", change.type);
        console.log("Document data:", change.doc.data());

        const appointmentData = change.doc.data();
        const newNotification = {
          id: change.doc.id,
          type: change.type === "added" ? "New Appointment" : "Appointment Updated",
          data: appointmentData,
          timestamp: new Date(),
          read: false, // Add a 'read' flag
        };

        setNotifications((prev) => [...prev, newNotification]);
        console.log("Updated notifications:", [...notifications, newNotification]);
      });
    });

    return () => unsubscribe();
  }, [userId, userRole]);

  const handleVisibleChange = (flag) => {
    setVisible(flag);
    if (flag) {
      // Mark notifications as read without clearing them
      setNotifications((prev) =>
        prev.map((notification) => ({ ...notification, read: true }))
      );
    }
  };

  const unreadCount = notifications.filter((n) => !n.read).length;

  const menu = (
    <div style={{ width: 350 }}>
      <List
        dataSource={notifications}
        renderItem={(item) => (
          <List.Item key={item.id}>
            <List.Item.Meta
              avatar={<Avatar icon={<BellOutlined />} />}
              title={<span style={{ fontWeight: item.read ? 'normal' : 'bold' }}>{item.type}</span>}
              description={
                <div>
                  <p>
                    {userRole === "doctor"
                      ? `Patient: ${item.data.userName}`
                      : `Doctor: ${item.data.doctorName}`}
                  </p>
                  <p>
                    Date: {moment(item.data.date).format("YYYY-MM-DD")}
                  </p>
                  <p>Time: {item.data.time}</p>
                </div>
              }
            />
          </List.Item>
        )}
      />
      {notifications.length === 0 && (
        <div style={{ textAlign: "center", padding: "10px" }}>
          No new notifications
        </div>
      )}
    </div>
  );

  return (
    <Dropdown
      overlay={menu}
      trigger={["click"]}
      onVisibleChange={handleVisibleChange}
      visible={visible}
    >
      <Tooltip title="Notifications">
        <Badge count={unreadCount} offset={[10, 0]}>
          <BellOutlined
            style={{ fontSize: 24, color: "white", cursor: "pointer" }}
          />
        </Badge>
      </Tooltip>
    </Dropdown>
  );
}

export default Notifications;
