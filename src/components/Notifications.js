import React, { useState, useEffect } from "react";
import { Badge, Dropdown, List, Avatar, Tooltip } from "antd";
import { BellOutlined } from "@ant-design/icons";
import {
  fetchNotifications,
  markNotificationAsRead,
} from "../utils/notifications"; // Ensure this path is correct
import moment from "moment";

function Notifications({ userId, userRole }) {
  const [notifications, setNotifications] = useState([]);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    if (userId) {
      const unsubscribe = fetchNotifications(userId, setNotifications);
      return () => unsubscribe(); // Cleanup listener on unmount
    }
  }, [userId]);

  const handleVisibleChange = (flag) => {
    setVisible(flag);
    if (flag) {
      // Mark all unread notifications as read
      notifications.forEach((notification) => {
        if (!notification.read) {
          markNotificationAsRead(notification.id);
        }
      });

      // Optionally, mark them as read locally in the state
      setNotifications((prev) =>
        prev.map((notification) =>
          notification.read ? notification : { ...notification, read: true }
        )
      );
    }
  };

  const unreadCount = notifications.filter((n) => !n.read).length;

  const menu = (
    <div style={{ width: 350 }}>
      {notifications.length > 0 ? (
        <List
          dataSource={notifications}
          renderItem={(item) => (
            <List.Item key={item.id}>
              <List.Item.Meta
                avatar={<Avatar icon={<BellOutlined />} />}
                title={
                  <span style={{ fontWeight: item.read ? "normal" : "bold" }}>
                    {item.type}
                  </span>
                }
                description={
                  <div>
                    <p>
                      {userRole === "doctor"
                        ? `Patient: ${item.data?.userName || "Unknown"}`
                        : `Doctor: ${item.data?.doctorName || "Unknown"}`}
                    </p>
                    <p>
                      Date:{" "}
                      {item.data?.date
                        ? moment(
                            item.data.date.toDate
                              ? item.data.date.toDate()
                              : item.data.date
                          ).format("YYYY-MM-DD")
                        : "Unknown"}
                    </p>
                    <p>Time: {item.data?.time || "Unknown"}</p>
                  </div>
                }
              />
            </List.Item>
          )}
        />
      ) : (
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
