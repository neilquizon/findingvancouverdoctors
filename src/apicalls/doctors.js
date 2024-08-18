import {
  addDoc,
  collection,
  doc,
  getDoc,
  getDocs,
  query,
  setDoc,
  updateDoc,
  where,
  arrayUnion,
} from "firebase/firestore";
import firestoreDatabase from "../firebaseConfig";

export const AddDoctor = async (payload) => {
  try {
    await setDoc(doc(firestoreDatabase, "doctors", payload.userId), payload);

    // update user role
    await updateDoc(doc(firestoreDatabase, "users", payload.userId), {
      role: "doctor",
    });
    return {
      success: true,
      message: "Doctor added successfully, please wait for approval",
    };
  } catch (error) {
    return {
      success: false,
      message: error.message,
    };
  }
};

export const CheckIfDoctorAccountIsApplied = async (id) => {
  try {
    const doctors = await getDocs(
      query(collection(firestoreDatabase, "doctors"), where("userId", "==", id))
    );
    if (doctors.size > 0) {
      return {
        success: true,
        message: "Doctor account already applied",
        data: doctors.docs.map((doc) => {
          return {
            ...doc.data(),
            id: doc.id,
          };
        })[0],
      };
    }
    return {
      success: false,
      message: "Doctor account not applied",
    };
  } catch (error) {
    return {
      success: false,
      message: error.message,
    };
  }
};

export const GetAllDoctors = async () => {
  try {
    const doctors = await getDocs(collection(firestoreDatabase, "doctors"));
    return {
      success: true,
      data: doctors.docs.map((doc) => {
        return {
          ...doc.data(),
          id: doc.id,
        };
      }),
    };
  } catch (error) {
    return {
      success: false,
      message: error.message,
    };
  }
};

export const UpdateDoctor = async (payload) => {
  try {
    await setDoc(doc(firestoreDatabase, "doctors", payload.id), payload);
    return {
      success: true,
      message: "Doctor updated successfully",
    };
  } catch (error) {
    return {
      success: false,
      message: error.message,
    };
  }
};

export const GetDoctorById = async (id) => {
  try {
    const doctor = await getDoc(doc(firestoreDatabase, "doctors", id));
    return {
      success: true,
      data: doctor.data(),
    };
  } catch (error) {
    return {
      success: false,
      message: error.message,
    };
  }
};

export const SubmitRating = async (doctorId, userId, rating, comment) => {
  try {
    const doctorRef = doc(firestoreDatabase, "doctors", doctorId);

    // Add the rating to the doctor's ratings array
    await updateDoc(doctorRef, {
      ratings: arrayUnion({
        userId: userId,
        rating: rating,
        comment: comment,
        date: new Date(),
      }),
    });

    return { success: true, message: "Rating submitted successfully." };
  } catch (error) {
    return { success: false, message: error.message };
  }
};
