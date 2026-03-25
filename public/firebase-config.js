import { initializeApp } from "https://www.gstatic.com/firebasejs/10.9.0/firebase-app.js";
import { getFirestore } from "https://www.gstatic.com/firebasejs/10.9.0/firebase-firestore.js";

// TODO: Replace this with your actual Firebase Project Configuration!
const firebaseConfig = {
  apiKey: "AIzaSyBR2ve4yh6OtpfujnvUO_M9Wi_hSrxwM8Y",
  authDomain: "lemonyy.firebaseapp.com",
  projectId: "lemonyy",
  storageBucket: "lemonyy.firebasestorage.app",
  messagingSenderId: "568438600511",
  appId: "1:568438600511:web:5738e349a60d78d064598a"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
export const db = getFirestore(app);
