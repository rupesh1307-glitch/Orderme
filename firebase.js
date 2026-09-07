// firebase.js
import { initializeApp } from "https://www.gstatic.com/firebasejs/12.11.0/firebase-app.js";
import { getAnalytics } from "https://www.gstatic.com/firebasejs/12.11.0/firebase-analytics.js";
import {
  getAuth,
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword
} from "https://www.gstatic.com/firebasejs/12.11.0/firebase-auth.js";

const firebaseConfig = {
  apiKey: "AIzaSyCXPoUqriOUyis_LVsFTwKn3UU5G6xoLA4",
  authDomain: "orderme-eb9be.firebaseapp.com",
  projectId: "orderme-eb9be",
  storageBucket: "orderme-eb9be.firebasestorage.app",
  messagingSenderId: "847356842419",
  appId: "1:847356842419:web:24880f33ae4baade28bbc6",
  measurementId: "G-Z0JSVL6QZE"
};

const app = initializeApp(firebaseConfig);
const analytics = getAnalytics(app);

export const auth = getAuth(app);
export { createUserWithEmailAndPassword, signInWithEmailAndPassword };