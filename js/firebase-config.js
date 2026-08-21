// firebase-config.js
// Ключі публічні за задумом Firebase — безпека забезпечується
// Security Rules у консолі Firebase, а не приховуванням apiKey.

import { initializeApp } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-app.js";
import { getAuth } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-auth.js";
import { getDatabase } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-database.js";

const firebaseConfig = {
  apiKey: "AIzaSyACRp160rx6aZD4FYuXSVhROKS9I0g5q-w",
  authDomain: "positive-strike.firebaseapp.com",
  databaseURL: "https://positive-strike-default-rtdb.europe-west1.firebasedatabase.app",
  projectId: "positive-strike",
  storageBucket: "positive-strike.firebasestorage.app",
  messagingSenderId: "787238507992",
  appId: "1:787238507992:web:6b3a7c1f924c3489324ead"
};

export const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const db = getDatabase(app);
