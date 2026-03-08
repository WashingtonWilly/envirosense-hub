import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";

const firebaseConfig = {
  apiKey: "AIzaSyAZ0bo_DP8f7o1jXUcsTBD3aAEDz5fhcYA",
  authDomain: "smartaire-c4693.firebaseapp.com",
  projectId: "smartaire-c4693",
};

const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const db = getFirestore(app);
export default app;
