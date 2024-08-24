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

// Add a new doctor to the database
export const AddDoctor = async (payload) => {
  try {
    await setDoc(doc(firestoreDatabase, "doctors", payload.userId), payload);

    // Update the user's role to doctor
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

// Check if a doctor account has already been applied for
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

// Get all doctors from the database
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

// Update doctor information in the database
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

// Get a doctor by their ID
export const GetDoctorById = async (id) => {
  try {
    const doctorDoc = await getDoc(doc(firestoreDatabase, "doctors", id));
    if (!doctorDoc.exists()) {
      throw new Error("Doctor not found.");
    }
    const doctorData = doctorDoc.data();

    // Calculate the average rating and count
    const ratingCount = doctorData.ratings?.length || 0;
    const averageRating =
      ratingCount > 0
        ? doctorData.ratings.reduce((sum, rating) => sum + rating.rating, 0) /
          ratingCount
        : 0;

    return {
      success: true,
      data: {
        ...doctorData,
        ratingCount,
        averageRating: averageRating.toFixed(1),
      },
    };
  } catch (error) {
    return {
      success: false,
      message: error.message,
    };
  }
};

// Submit a rating for a doctor
export const SubmitRating = async (doctorId, userId, rating, comment) => {
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
      return { success: false, message: "You have already rated this doctor." };
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

    // Recalculate the average rating and count
    const ratingCount = (doctorData.ratings?.length || 0) + 1;
    const totalRating = doctorData.ratings?.reduce((sum, r) => sum + r.rating, 0) + rating;
    const averageRating = totalRating / ratingCount;

    // Update the doctor's average rating and rating count
    await updateDoc(doctorRef, {
      averageRating: averageRating.toFixed(1),
      ratingCount,
    });

    return { success: true, message: "Rating submitted successfully." };
  } catch (error) {
    return { success: false, message: error.message };
  }
};
