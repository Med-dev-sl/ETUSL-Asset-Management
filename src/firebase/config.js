import { initializeApp } from 'firebase/app';
import { getFirestore } from 'firebase/firestore';

const firebaseConfig = {
  apiKey: "AIzaSyAVAKgesDJB09tu108BhOpWfCqNQqDLmdk",
  authDomain: "etusl-asset-management-1dda2.firebaseapp.com",
  projectId: "etusl-asset-management-1dda2",
  storageBucket: "etusl-asset-management-1dda2.firebasestorage.app",
  messagingSenderId: "561423280624",
  appId: "1:561423280624:web:8c4ea1ad53a61fcebf1535",
  measurementId: "G-C8KG09DY3L"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
export const db = getFirestore(app);

export default app;
