import {
  addDoc,
  collection,
  doc,
  getDoc,
  getDocs,
  query,
  updateDoc,
  deleteDoc,
  where,
  arrayUnion,
} from "firebase/firestore";
import axios from 'axios';
import firestoreDatabase from "../firebaseConfig";

// Function to book a doctor appointment
export const BookDoctorAppointment = async (payload) => {
  try {
    // Include the 'rated' field with a default value of "Not Yet"
    const appointmentData = {
      ...payload,
      rated: "Not Yet",
    };
    await addDoc(collection(firestoreDatabase, "appointments"), appointmentData);
    return { success: true, message: "Appointment booked successfully" };
  } catch (error) {
    return { success: false, message: error.message };
  }
};

// Function to get doctor appointments on a specific date
export const GetDoctorAppointmentsOnDate = async (doctorId, date) => {
  try {
    const querySnapshot = await getDocs(
      query(
        collection(firestoreDatabase, "appointments"),
        where("doctorId", "==", doctorId),
        where("date", "==", date)
      )
    );
    const data = [];
    querySnapshot.forEach((doc) => {
      data.push(doc.data());
    });
    return { success: true, data };
  } catch (error) {
    return { success: false, message: error.message };
  }
};

// Function to get all appointments for a specific doctor
export const GetDoctorAppointments = async (doctorId) => {
  try {
    const querySnapshot = await getDocs(
      query(
        collection(firestoreDatabase, "appointments"),
        where("doctorId", "==", doctorId)
      )
    );
    const data = [];
    querySnapshot.forEach((doc) => {
      data.push({
        ...doc.data(),
        id: doc.id,
      });
    });
    return { success: true, data };
  } catch (error) {
    return { success: false, message: error.message };
  }
};

// Function to get all appointments for a specific user
export const GetUserAppointments = async (userId) => {
  try {
    const querySnapshot = await getDocs(
      query(
        collection(firestoreDatabase, "appointments"),
        where("userId", "==", userId)
      )
    );
    const data = [];
    querySnapshot.forEach((doc) => {
      data.push({
        ...doc.data(),
        id: doc.id,
      });
    });
    return { success: true, data };
  } catch (error) {
    return { success: false, message: error.message };
  }
};

// Function to update the status of an appointment
export const UpdateAppointmentStatus = async (id, status) => {
  try {
    await updateDoc(doc(firestoreDatabase, "appointments", id), {
      status,
    });
    return { success: true, message: "Appointment status updated" };
  } catch (error) {
    return { success: false, message: error.message };
  }
};

// Function to delete an appointment and send cancellation emails
export const DeleteAppointment = async (id, doctorEmail, userEmail, cancelledBy) => {
  try {
    // Delete the appointment from the database
    await deleteDoc(doc(firestoreDatabase, "appointments", id));

    // Send cancellation email to the doctor and the user
    if (doctorEmail || userEmail) {
      await axios.post('http://localhost:5000/cancel-appointment', {
        appointmentId: id,
        doctorEmail,
        userEmail,
        cancelledBy,
      });
    }

    return { success: true, message: "Appointment deleted and email sent successfully" };
  } catch (error) {
    return { success: false, message: error.message };
  }
};

// Function to update the date of an appointment
export const UpdateAppointmentDate = async (id, date) => {
  try {
    await updateDoc(doc(firestoreDatabase, "appointments", id), {
      date,
    });
    return { success: true, message: "Appointment date updated successfully" };
  } catch (error) {
    return { success: false, message: error.message };
  }
};

// Function to get all appointments
export const GetAppointments = async () => {
  try {
    const querySnapshot = await getDocs(collection(firestoreDatabase, "appointments"));
    const data = [];
    querySnapshot.forEach((doc) => {
      data.push({
        ...doc.data(),
        id: doc.id,
      });
    });
    return { success: true, data };
  } catch (error) {
    return { success: false, message: error.message };
  }
};

// Function to save doctor's notes for an appointment
export const SaveDoctorNotes = async (appointmentId, notes) => {
  try {
    await updateDoc(doc(firestoreDatabase, "appointments", appointmentId), {
      notes,
    });
    return { success: true, message: "Doctor's notes saved successfully" };
  } catch (error) {
    return { success: false, message: error.message };
  }
};

// Function to update the problem description of an appointment
export const UpdateProblem = async (appointmentId, problem) => {
  try {
    await updateDoc(doc(firestoreDatabase, "appointments", appointmentId), {
      problem,
    });
    return { success: true, message: "Problem updated successfully" };
  } catch (error) {
    return { success: false, message: error.message };
  }
};

// Function to submit a rating for a doctor by a user
export const SubmitRating = async (doctorId, userId, rating, comment, appointmentId) => {
  try {
    const doctorRef = doc(firestoreDatabase, "doctors", doctorId);
    const doctorDoc = await getDoc(doctorRef);

    if (!doctorDoc.exists()) {
      throw new Error("Doctor not found.");
    }

    const doctorData = doctorDoc.data();

    // Check if the user has already rated this doctor
    const alreadyRated = doctorData.ratings?.some(
      (r) => r.userId === userId
    );

    if (alreadyRated) {
      return { success: false, message: "You have already rated this doctor.", alreadyRated: true };
    }

    // Add the rating to the doctor's ratings array
    await updateDoc(doctorRef, {
      ratings: arrayUnion({
        userId: userId,
        rating: rating,
        comment: comment,
        date: new Date(),
      }),
    });

    // Update the rated field in the appointment record
    await updateDoc(doc(firestoreDatabase, "appointments", appointmentId), {
      rated: "Yes",
    });

    return { success: true, message: "Rating submitted successfully.", alreadyRated: false };
  } catch (error) {
    return { success: false, message: error.message, alreadyRated: false };
  }
};
