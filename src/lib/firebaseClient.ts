import { initializeApp, getApps, getApp } from "firebase/app";
import { getDatabase } from "firebase/database";

// Public web config for project mm-websites (not secret — identifies the
// project to clients; protection comes from the RTDB security rules).
const firebaseConfig = {
  apiKey: "AIzaSyBQKlz3UZH3yLtZmwi2an3X1oGdNGeUMkM",
  authDomain: "mm-websites.firebaseapp.com",
  databaseURL: "https://mm-websites-default-rtdb.firebaseio.com",
  projectId: "mm-websites",
  storageBucket: "mm-websites.firebasestorage.app",
  messagingSenderId: "667616152120",
  appId: "1:667616152120:web:e54b2a6f39d1da4610f4cd",
};

const app = getApps().length ? getApp() : initializeApp(firebaseConfig);

export const rtdb = getDatabase(app);
