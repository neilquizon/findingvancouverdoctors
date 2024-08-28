import React, { useEffect, useState } from "react";
import { message, Tabs } from "antd";
import UsersList from "./UsersList";
import DoctorsList from "./DoctorsList";
import { useDispatch } from "react-redux";
import { ShowLoader } from "../../redux/loaderSlice";
import { GetUserById, GetAllUsers } from "../../apicalls/users"; // Assuming you have GetAllUsers API
import AppointmentsList from "./AppointmentsList";
import ChatSupport from "../Profile/ChatSupport"; // Import the ChatSupport component
import { collection, onSnapshot, deleteDoc, doc } from "firebase/firestore"; // Import Firestore functions
import firestoreDatabase from "../../firebaseConfig"; // Import your Firestore configuration

function Admin() {
  const [isAdmin, setIsAdmin] = useState(false);
  const [selectedUserId, setSelectedUserId] = useState(null);
  const [userList, setUserList] = useState([]);
  const [activeChats, setActiveChats] = useState([]);
  const [highlightedChat, setHighlightedChat] = useState(null);
  const user = JSON.parse(localStorage.getItem("user"));
  const dispatch = useDispatch();

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

  useEffect(() => {
    if (isAdmin) {
      // Listen for all active chat documents where the admin is involved
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
          <Tabs.TabPane tab="Appointments" key="1">
            <AppointmentsList />
          </Tabs.TabPane>
          <Tabs.TabPane tab="Users" key="2">
            <UsersList />
          </Tabs.TabPane>
          <Tabs.TabPane tab="Doctors" key="3">
            <DoctorsList />
          </Tabs.TabPane>
          <Tabs.TabPane tab="Chat Support" key="4">
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
                            setHighlightedChat(null); // Remove highlight after selecting
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
