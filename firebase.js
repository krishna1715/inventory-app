
// firebase.js
import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";

const firebaseConfig = {
  apiKey: "AIzaSyCUBYqEW65BcxP3X9ovHiHXoNlMUuttb0A",
  authDomain: "inventorybudgetapp-9c334.firebaseapp.com",
  projectId: "inventorybudgetapp-9c334",
  storageBucket: "inventorybudgetapp-9c334.firebasestorage.app",
  messagingSenderId: "1058625274551",
  appId: "1:1058625274551:web:8e2da717b97e55c27a4332"
};

const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
