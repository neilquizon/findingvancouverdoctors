import {
    collection,
    query,
    where,
    onSnapshot,
    addDoc,
    doc,
    updateDoc,
  } from "firebase/firestore";
  import firestoreDatabase from "../firebaseConfig"; // Ensure this path is correct for your project
  
  // Function to fetch notifications from Firestore for a specific user
  export function fetchNotifications(userId, setNotifications) {
    const notificationsRef = collection(firestoreDatabase, "notifications");
  
    // Build the query based on userId to fetch all notifications
    const q = query(
      notificationsRef,
      where("userId", "==", userId)
      // Removed role filtering to fetch all notifications for the user
    );
  
    // Real-time listener for Firestore notifications
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const notifications = [];
      snapshot.forEach((doc) => {
        notifications.push({ id: doc.id, ...doc.data() });
      });
  
      // Sort notifications by timestamp in descending order
      notifications.sort((a, b) => {
        const timeA = a.timestamp.toDate ? a.timestamp.toDate() : a.timestamp;
        const timeB = b.timestamp.toDate ? b.timestamp.toDate() : b.timestamp;
        return timeB - timeA;
      });
  
      setNotifications(notifications);
    });
  
    return unsubscribe; // This allows cleanup when the component unmounts
  }
  
  // Function to mark a notification as read in Firestore
  export function markNotificationAsRead(notificationId) {
    const notificationRef = doc(firestoreDatabase, "notifications", notificationId);
  
    updateDoc(notificationRef, {
      read: true,
    })
      .then(() => {
        console.log(`Notification ${notificationId} marked as read`);
      })
      .catch((error) => {
        console.error("Error marking notification as read: ", error);
      });
  }
  
  // Function to add a new notification to Firestore
  export function addNotification(userId, type, appointmentData) {
    const notificationRef = collection(firestoreDatabase, "notifications");
  
    // Structure the new notification data
    const newNotification = {
      userId: userId, // ID of the user receiving the notification
      type: type, // e.g., 'New Appointment' or 'Appointment Updated'
      data: appointmentData, // Additional data related to the appointment
      read: false, // Default state: unread
      timestamp: new Date(), // Timestamp for when the notification was created
    };
  
    // Add the notification to Firestore
    addDoc(notificationRef, newNotification)
      .then(() => {
        console.log("Notification added successfully");
      })
      .catch((error) => {
        console.error("Error adding notification: ", error);
      });
  }
  