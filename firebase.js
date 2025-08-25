import { initializeApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";
import { getStorage } from "firebase/storage";
import { getAuth } from "firebase/auth";

const firebaseConfig = {
  apiKey: "AIzaSyCABsnwxEQPNl-1OLcacEY0cgd3CIMI4x8",
  authDomain: "spendly-f4129.firebaseapp.com",
  projectId: "spendly-f4129",
  storageBucket: "spendly-f4129.firebasestorage.app",
  messagingSenderId: "75054399483",
  appId: "1:75054399483:web:b9ad2433d21208d407d55e"
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);
const storage = getStorage(app);
const auth = getAuth(app);


export { app, db, storage, auth };