import { initializeApp } from "firebase/app";
import { getStorage } from "firebase/storage";
import { getAuth } from "firebase/auth";

// Firebase configuration from mobile app
const firebaseConfig = {
  apiKey: "AIzaSyAzSrZbV3ib1Tuv6K4EwrUEy0iJr4ZOTqg",
  authDomain: "momentam-f9e3b.firebaseapp.com",
  projectId: "momentam-f9e3b",
  storageBucket: "momentam-f9e3b.appspot.com",
  messagingSenderId: "994849776896",
  appId: "1:994849776896:web:6b2c3847083feb7b8c7fe5",
  measurementId: "G-K44LFV199V",
};

// Initialize Firebase
const firebaseApp = initializeApp(firebaseConfig);
const storage = getStorage(firebaseApp);
const auth = getAuth();

export { storage, auth };
