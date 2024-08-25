import { doc, setDoc, updateDoc, getDoc, arrayUnion } from "firebase/firestore";
import firestoreDatabase from "../../firebaseConfig"; // Adjust the path according to your structure

// Function to send a message
export const sendMessage = async (messageText, sender) => {
  const chatDocId = "group_chat"; // Single document ID for all users and admins
  const chatDocRef = doc(firestoreDatabase, "chats", chatDocId);

  const messageData = {
    text: messageText,
    sender: sender, // Use the sender parameter to identify who sent the message
    timestamp: new Date(),
  };

  try {
    // Check if the document exists
    const docSnapshot = await getDoc(chatDocRef);
    if (docSnapshot.exists()) {
      // If the document exists, update it by appending the new message to the messages array
      await updateDoc(chatDocRef, {
        messages: arrayUnion(messageData),
      });
    } else {
      // If the document doesn't exist, create it with the new message as the first entry in the messages array
      await setDoc(chatDocRef, {
        messages: [messageData],
      });
    }

    return { success: true, data: messageData };
  } catch (e) {
    console.error("Error adding document: ", e);
    return { success: false, message: e.message };
  }
};

// Function to get all messages
export const getMessages = async () => {
  const chatDocId = "group_chat"; // Single document ID for all users and admins
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
