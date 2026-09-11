import { initializeApp } from "https://www.gstatic.com/firebasejs/12.18.0/firebase-app.js";
import { getFirestore } from "https://www.gstatic.com/firebasejs/12.18.0/firebase-firestore.js";

const firebaseConfig = {
  apiKey: "AIzaSyAb8sURxE631xnNMRXYuHJEZzy9zBuXKbs",
  authDomain: "cha-casa-nova-b2a94.firebaseapp.com",
  projectId: "cha-casa-nova-b2a94",
  storageBucket: "cha-casa-nova-b2a94.firebasestorage.app",
  messagingSenderId: "778135148126",
  appId: "1:778135148126:web:2a3d7d785b37c815ad06cf"
};

const firebaseApp = initializeApp(firebaseConfig);
export const db = getFirestore(firebaseApp);
