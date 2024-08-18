import {
  addDoc,
  collection,
  doc,
  getDocs,
  query,
  updateDoc,
  deleteDoc,
  where,
} from "firebase/firestore";
import axios from 'axios';
import firestoreDatabase from "../firebaseConfig";

export const BookDoctorAppointment = async (payload) => {
  try {
    await addDoc(collection(firestoreDatabase, "appointments"), payload);
    return { success: true, message: "Appointment booked successfully" };
  } catch (error) {
    return { success: false, message: error.message };
  }
};

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
