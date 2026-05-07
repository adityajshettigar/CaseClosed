// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";
import { getStorage } from "firebase/storage";
import { getAnalytics } from "firebase/analytics";

// Your web app's Firebase configuration
// For Firebase JS SDK v7.20.0 and later, measurementId is optional
const firebaseConfig = {
  apiKey: "AIzaSyB52-X6lJPDXsHkZDrGuTqeh1AZl1JT6j4",
  authDomain: "caseclosedmern.firebaseapp.com",
  projectId: "caseclosedmern",
  storageBucket: "caseclosedmern.firebasestorage.app",
  messagingSenderId: "753092768739",
  appId: "1:753092768739:web:0254cac3eed128446466d6",
  measurementId: "G-M47L0RBTQK"
};

// Initialize Firebase
// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Export the services we will use throughout the app
export const auth = getAuth(app);
export const db = getFirestore(app);
export const storage = getStorage(app);
export const analytics = getAnalytics(app);
export default app;