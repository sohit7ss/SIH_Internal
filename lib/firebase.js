// lib/firebase.ts
import { initializeApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";
import { getAuth } from "firebase/auth";

const firebaseConfig = {
    apiKey: "AIzaSyDkxe_rb0W3hWYY8W_ZGKEoAVm2qKdF3_A",
    authDomain: "remote-classroom-aec5a.firebaseapp.com",
    projectId: "remote-classroom-aec5a",
    storageBucket: "remote-classroom-aec5a.firebasestorage.app",
    messagingSenderId: "379366764713",
    appId: "1:379366764713:web:3b40a2df61fc10067079b8",
    measurementId: "G-YZD3N5N48D"
};

const app = initializeApp(firebaseConfig);

export const db = getFirestore(app);
export const auth = getAuth(app);