import React, { useState, useEffect } from "react";
import { message } from "antd";
import { doc, setDoc, updateDoc, arrayUnion, onSnapshot, deleteDoc } from "firebase/firestore";
import firestoreDatabase from "../../firebaseConfig"; // Adjust the path as needed

function ChatSupport({ userId }) {
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState("");
  const currentUser = JSON.parse(localStorage.getItem("user"));

  useEffect(() => {
    if (!currentUser || !userId) return;

    const chatDocId = `chat_${userId}_admin`;
    const chatDocRef = doc(firestoreDatabase, "chats", chatDocId);

    // Listen for real-time updates to the chat document
    const unsubscribe = onSnapshot(chatDocRef, (docSnapshot) => {
      if (docSnapshot.exists()) {
        setMessages(docSnapshot.data().messages || []);
      } else {
        setMessages([]); // If no messages, set empty array
      }
    });

    return () => unsubscribe(); // Clean up the listener on unmount
  }, [userId, currentUser]);

  const handleSendMessage = async () => {
    if (!newMessage.trim()) return;

    const chatDocId = `chat_${userId}_admin`;
    const chatDocRef = doc(firestoreDatabase, "chats", chatDocId);

    const messageData = {
      text: newMessage,
      sender: currentUser.role === "admin" ? "admin" : currentUser.name || currentUser.id,
      timestamp: new Date(),
    };

    try {
      await updateDoc(chatDocRef, {
        messages: arrayUnion(messageData),
      }).catch(async (error) => {
        if (error.code === "not-found") {
          await setDoc(chatDocRef, {
            messages: [messageData],
          });
        } else {
          throw error;
        }
      });

      setNewMessage(""); // Clear the input after sending the message
    } catch (error) {
      message.error("Failed to send message: " + error.message);
    }
  };

  const handleClearChat = async () => {
    const chatDocId = `chat_${userId}_admin`;
    const chatDocRef = doc(firestoreDatabase, "chats", chatDocId);

    try {
      await deleteDoc(chatDocRef);
      message.success("Chat cleared and document deleted successfully");
      setMessages([]); // Clear the UI as well
    } catch (error) {
      message.error("Failed to clear chat and delete document: " + error.message);
    }
  };

  if (!currentUser) {
    return <div>Please log in to access chat support.</div>;
  }

  return (
    <div>
      <div className="chat-messages" style={{ maxHeight: '300px', overflowY: 'auto', marginBottom: '1rem' }}>
        {messages.map((msg, index) => (
          <div
            key={index}
            className="chat-message"
            style={{
              marginBottom: '0.5rem',
              display: 'flex',
              justifyContent: msg.sender === (currentUser.name || currentUser.id) ? 'flex-end' : 'flex-start',
            }}
          >
            <div
              style={{
                backgroundColor: msg.sender === (currentUser.name || currentUser.id) ? '#e6f7ff' : '#f0f0f0',
                padding: '10px',
                borderRadius: '10px',
                maxWidth: '60%',
                textAlign: 'left',
              }}
            >
              <strong>{msg.sender === (currentUser.name || currentUser.id) ? "You" : msg.sender}:</strong> {msg.text}
            </div>
          </div>
        ))}
      </div>
      <div className="chat-input" style={{ display: 'flex', gap: '0.5rem' }}>
        <input
          type="text"
          value={newMessage}
          onChange={(e) => setNewMessage(e.target.value)}
          placeholder="Type your message..."
          style={{ flex: 1, padding: '0.5rem' }}
        />
        <button onClick={handleSendMessage} style={{ padding: '0.5rem 1rem' }}>Send</button>
        {currentUser.role === "admin" && (
          <button onClick={handleClearChat} style={{ padding: '0.5rem 1rem', marginLeft: '10px' }}>
            Clear Chat
          </button>
        )}
      </div>
    </div>
  );
}

export default ChatSupport;
