import { initializeApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";

const firebaseConfig = {
    apiKey: "AIzaSyBmFVi7OYNf9UtnV0jkUe09p3QKtcLDoYM",
    authDomain: "findvancouverdoctor.firebaseapp.com",
    projectId: "findvancouverdoctor",
    storageBucket: "findvancouverdoctor.appspot.com",
    messagingSenderId: "843242700270",
    appId: "1:843242700270:web:054bc1787b2748e938e2ff",
    measurementId: "G-P5NX2L77N2"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

const firestoreDatabase = getFirestore(app);

export default firestoreDatabase;