import React, { useState, useEffect } from "react";
import { message } from "antd";
import {
  doc,
  setDoc,
  updateDoc,
  arrayUnion,
  onSnapshot,
  deleteDoc,
} from "firebase/firestore";
import firestoreDatabase from "../../firebaseConfig"; // Adjust the path as needed

function ChatSupport({ userId }) {
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState("");
  const currentUser = JSON.parse(localStorage.getItem("user"));

  // Inline FAQ data
  const faqData = [
    {
      question: "How do I reset my password?",
      answer:
        "To reset your password, go to your profile settings and click 'Reset Password'.",
    },
    {
      question: "How do I contact support?",
      answer:
        "You can email us at support@example.com or use this chat to speak with an agent.",
    },
    {
      question: "Where can I view my orders?",
      answer:
        "You can view your orders under 'My Orders' in your account dashboard.",
    },
    // Add more Q&A as needed
  ];

  // Listen for new messages from Firestore
  useEffect(() => {
    if (!currentUser || !userId) return;

    const chatDocId = `chat_${userId}_admin`;
    const chatDocRef = doc(firestoreDatabase, "chats", chatDocId);

    const unsubscribe = onSnapshot(chatDocRef, (docSnapshot) => {
      if (docSnapshot.exists()) {
        setMessages(docSnapshot.data().messages || []);
      } else {
        setMessages([]);
      }
    });

    return () => unsubscribe();
  }, [userId, currentUser]);

  // Sends a message as the current user
  const handleSendMessage = async () => {
    if (!newMessage.trim()) return;

    const chatDocId = `chat_${userId}_admin`;
    const chatDocRef = doc(firestoreDatabase, "chats", chatDocId);

    const messageData = {
      text: newMessage,
      sender:
        currentUser.role === "admin"
          ? "admin"
          : currentUser.name || currentUser.id,
      timestamp: new Date(),
    };

    try {
      await updateDoc(chatDocRef, {
        messages: arrayUnion(messageData),
      }).catch(async (error) => {
        if (error.code === "not-found") {
          // If the doc doesn't exist, create it
          await setDoc(chatDocRef, {
            messages: [messageData],
          });
        } else {
          throw error;
        }
      });

      // After sending the user's message, check if it matches an FAQ
      checkForFaqAndRespond(newMessage);

      setNewMessage("");
    } catch (error) {
      message.error("Failed to send message: " + error.message);
    }
  };

  // Checks if user message matches any FAQ question (basic substring match)
  const checkForFaqAndRespond = async (userText) => {
    const lowerUserText = userText.toLowerCase();

    // Find a matching FAQ (in production, you might do something more robust)
    const matchedFaq = faqData.find((faq) =>
      lowerUserText.includes(faq.question.toLowerCase())
    );

    // If we have a match, respond with the bot answer
    if (matchedFaq) {
      await sendBotMessage(matchedFaq.answer);
    }
  };

  // Helper function to send a message as the bot
  const sendBotMessage = async (text) => {
    const chatDocId = `chat_${userId}_admin`;
    const chatDocRef = doc(firestoreDatabase, "chats", chatDocId);

    const botMessage = {
      text,
      sender: "Bot",
      timestamp: new Date(),
    };

    try {
      await updateDoc(chatDocRef, {
        messages: arrayUnion(botMessage),
      }).catch(async (error) => {
        if (error.code === "not-found") {
          // If the doc doesn't exist, create it
          await setDoc(chatDocRef, {
            messages: [botMessage],
          });
        } else {
          throw error;
        }
      });
    } catch (error) {
      message.error("Failed to send bot message: " + error.message);
    }
  };

  const handleClearChat = async () => {
    const chatDocId = `chat_${userId}_admin`;
    const chatDocRef = doc(firestoreDatabase, "chats", chatDocId);

    try {
      await deleteDoc(chatDocRef);
      message.success("Chat cleared and document deleted successfully");
      setMessages([]);
    } catch (error) {
      message.error("Failed to clear chat and delete document: " + error.message);
    }
  };

  if (!currentUser) {
    return <div>Please log in to access chat support.</div>;
  }

  return (
    <div>
      <div
        className="chat-messages"
        style={{ maxHeight: "300px", overflowY: "auto", marginBottom: "1rem" }}
      >
        {messages.map((msg, index) => (
          <div
            key={index}
            className="chat-message"
            style={{
              marginBottom: "0.5rem",
              display: "flex",
              justifyContent:
                msg.sender === (currentUser.name || currentUser.id)
                  ? "flex-end"
                  : "flex-start",
            }}
          >
            <div
              style={{
                backgroundColor:
                  msg.sender === (currentUser.name || currentUser.id)
                    ? "#e6f7ff"
                    : msg.sender === "Bot"
                    ? "#cce5ff"
                    : "#f0f0f0",
                padding: "10px",
                borderRadius: "10px",
                maxWidth: "60%",
                textAlign: "left",
              }}
            >
              <strong>
                {msg.sender === (currentUser.name || currentUser.id)
                  ? "You"
                  : msg.sender}
                :
              </strong>{" "}
              {msg.text}
            </div>
          </div>
        ))}
      </div>
      <div className="chat-input" style={{ display: "flex", gap: "0.5rem" }}>
        <input
          type="text"
          value={newMessage}
          onChange={(e) => setNewMessage(e.target.value)}
          placeholder="Type your message..."
          style={{ flex: 1, padding: "0.5rem" }}
        />
        <button onClick={handleSendMessage} style={{ padding: "0.5rem 1rem" }}>
          Send
        </button>
        {currentUser.role === "admin" && (
          <button
            onClick={handleClearChat}
            style={{ padding: "0.5rem 1rem", marginLeft: "10px" }}
          >
            Clear Chat
          </button>
        )}
      </div>
    </div>
  );
}

export default ChatSupport;
