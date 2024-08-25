import React, { useState, useEffect } from "react";
import { message } from "antd";
import { doc, setDoc, updateDoc, arrayUnion, getDoc, onSnapshot } from "firebase/firestore";
import firestoreDatabase from "../../firebaseConfig"; // Adjust the path as needed

function ChatSupport() {
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState("");
  const user = JSON.parse(localStorage.getItem("user"));
  const chatDocId = "group_chat"; // Single document ID for all users and admins

  useEffect(() => {
    if (user) {
      const chatDocRef = doc(firestoreDatabase, "chats", chatDocId);

      // Listen for real-time updates to the chat document
      const unsubscribe = onSnapshot(chatDocRef, (docSnapshot) => {
        if (docSnapshot.exists()) {
          setMessages(docSnapshot.data().messages || []);
        }
      });

      return () => unsubscribe(); // Clean up the listener on unmount
    }
  }, [user]);

  const handleSendMessage = async () => {
    if (!newMessage.trim()) return;

    const chatDocRef = doc(firestoreDatabase, "chats", chatDocId);

    const messageData = {
      text: newMessage,
      sender: user.role === "admin" ? "admin" : user.name || user.id, // Distinguish sender (user or admin)
      timestamp: new Date(),
    };

    try {
      // Check if the document exists
      const docSnapshot = await getDoc(chatDocRef);
      if (docSnapshot.exists()) {
        // If the document exists, update it
        await updateDoc(chatDocRef, {
          messages: arrayUnion(messageData),
        });
      } else {
        // If the document doesn't exist, create it with the first message
        await setDoc(chatDocRef, {
          messages: [messageData],
        });
      }

      setNewMessage(""); // Clear the input after sending the message
    } catch (error) {
      message.error("Failed to send message: " + error.message);
    }
  };

  if (!user) {
    return <div>Please log in to access chat support.</div>;
  }

  return (
    <div>
      <div className="chat-messages" style={{ maxHeight: '300px', overflowY: 'auto', marginBottom: '1rem' }}>
        {messages.map((msg, index) => (
          <div key={index} className="chat-message" style={{ marginBottom: '0.5rem' }}>
            <strong>{msg.sender === (user.name || user.id) ? "You" : msg.sender}:</strong> {msg.text}
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
      </div>
    </div>
  );
}

export default ChatSupport;
