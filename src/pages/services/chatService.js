import { doc, setDoc, updateDoc, getDoc, arrayUnion } from "firebase/firestore";
import firestoreDatabase from "../../firebaseConfig"; // Adjust the path according to your structure

// Function to send a message
export const sendMessage = async (messageText, sender, userId) => {
  if (!userId) {
    console.error("sendMessage: userId is undefined");
    return { success: false, message: "userId is undefined" };
  }

  const chatDocId = `chat_${userId}_admin`; // Unique document ID for each user-admin chat
  const chatDocRef = doc(firestoreDatabase, "chats", chatDocId);

  const messageData = {
    text: messageText,
    sender: sender, // Use the sender parameter to identify who sent the message
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

    return { success: true, data: messageData };
  } catch (e) {
    console.error("Error adding document: ", e);
    return { success: false, message: e.message };
  }
};

// Function to get all messages
export const getMessages = async (userId) => {
  if (!userId) {
    console.error("getMessages: userId is undefined");
    return { success: false, message: "userId is undefined" };
  }

  const chatDocId = `chat_${userId}_admin`; // Unique document ID for each user-admin chat
  const chatDocRef = doc(firestoreDatabase, "chats", chatDocId);

  try {
    const docSnapshot = await getDoc(chatDocRef);
    if (docSnapshot.exists()) {
      return { success: true, data: docSnapshot.data().messages };
    } else {
      return { success: true, data: [] }; // No messages yet
    }
  } catch (e) {
    console.error("Error getting documents: ", e);
    return { success: false, message: e.message };
  }
};
