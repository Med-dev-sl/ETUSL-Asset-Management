import { db } from '../firebase/config';
import { collection, addDoc, getDocs, query, where } from 'firebase/firestore';

const createAdminUser = async () => {
  try {
    // Check if admin already exists
    const usersRef = collection(db, 'users');
    const q = query(usersRef, where('email', '==', 'director@etusl.edu.sl'));
    const querySnapshot = await getDocs(q);

    if (!querySnapshot.empty) {
      console.log('Admin user already exists');
      return;
    }

    // Create admin user if doesn't exist
    const adminData = {
      email: 'director@etusl.edu.sl',
      password: 'etuslAdmin',
      role: 'admin',
      created: new Date().toISOString(),
      lastLogin: null
    };

    const docRef = await addDoc(collection(db, 'users'), adminData);
    console.log('Admin user created successfully with ID:', docRef.id);
    
  } catch (error) {
    console.error('Error creating admin user:', error);
    throw error;
  }
};

export default createAdminUser;
