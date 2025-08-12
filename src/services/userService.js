import { db } from '../firebase/config';
import {
  collection,
  doc,
  setDoc,
  getDoc,
  getDocs,
  updateDoc,
  deleteDoc,
  query,
  where,
  writeBatch
} from 'firebase/firestore';
import { hashPassword, verifyPassword } from '../utils/passwordUtils';

const USERS_COLLECTION = 'users';
const ROLES_COLLECTION = 'roles';

export const userService = {

  // Authentication
  async authenticate(email, password) {
    try {
      const usersRef = collection(db, USERS_COLLECTION);
      const q = query(usersRef, where('email', '==', email));
      const querySnapshot = await getDocs(q);
      
      if (querySnapshot.empty) {
        throw new Error('Invalid credentials');
      }

      const userDoc = querySnapshot.docs[0];
      const userData = userDoc.data();

      if (!verifyPassword(password, userData.passwordHash, userData.passwordSalt)) {
        throw new Error('Invalid credentials');
      }

      // Don't send sensitive data back
      const { passwordHash, passwordSalt, ...userInfo } = userData;
      return { 
        ...userInfo,
        id: userDoc.id
      };
    } catch (error) {
      console.error('Authentication error:', error);
      throw new Error('Authentication failed');
    }
  },

  // User Management
  async createUser(userData) {
    try {
      // Check if email already exists
      const usersRef = collection(db, USERS_COLLECTION);
      const q = query(usersRef, where('email', '==', userData.email));
      const querySnapshot = await getDocs(q);
      
      if (!querySnapshot.empty) {
        throw new Error('Email already exists');
      }

      const userRef = doc(collection(db, USERS_COLLECTION));
      
      // Initialize permissions based on roles
      const rolePromises = userData.roles.map(roleId => 
        getDoc(doc(db, ROLES_COLLECTION, roleId))
      );
      const roleSnaps = await Promise.all(rolePromises);
      
      const permissions = {};
      roleSnaps.forEach(snap => {
        if (snap.exists()) {
          const roleData = snap.data();
          Object.assign(permissions, roleData.permissions);
        }
      });

      // Hash password
      const { password, ...userDataWithoutPassword } = userData;
      const { hash: passwordHash, salt: passwordSalt } = hashPassword(password);

      await setDoc(userRef, {
        ...userDataWithoutPassword,
        passwordHash,
        passwordSalt,
        permissions,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      });
      return { success: true, id: userRef.id };
    } catch (error) {
      console.error('Error creating user:', error);
      throw new Error('Failed to create user');
    }
  },

  async updateUser(userId, userData) {
    try {
      const userRef = doc(db, USERS_COLLECTION, userId);
      const updateData = { ...userData, updatedAt: new Date().toISOString() };

      // If role is being changed, update permissions
      if (userData.role) {
        const roleRef = doc(db, ROLES_COLLECTION, userData.role);
        const roleSnap = await getDoc(roleRef);
        if (roleSnap.exists()) {
          updateData.permissions = roleSnap.data().permissions;
        }
      }

      await updateDoc(userRef, updateData);
      return { success: true };
    } catch (error) {
      console.error('Error updating user:', error);
      throw new Error('Failed to update user');
    }
  },

  async getUser(userId) {
    try {
      const userRef = doc(db, USERS_COLLECTION, userId);
      const userSnap = await getDoc(userRef);
      if (userSnap.exists()) {
        return { id: userSnap.id, ...userSnap.data() };
      }
      throw new Error('User not found');
    } catch (error) {
      console.error('Error getting user:', error);
      throw new Error('Failed to get user');
    }
  },

  async getAllUsers() {
    try {
      const usersRef = collection(db, USERS_COLLECTION);
      const usersSnap = await getDocs(usersRef);
      return usersSnap.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
    } catch (error) {
      console.error('Error getting users:', error);
      throw new Error('Failed to get users');
    }
  },

  // Role Management
  async createRole(roleData) {
    try {
      const roleRef = doc(collection(db, ROLES_COLLECTION));
      await setDoc(roleRef, {
        ...roleData,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      });
      return { success: true, id: roleRef.id };
    } catch (error) {
      console.error('Error creating role:', error);
      throw new Error('Failed to create role');
    }
  },

  async updateRole(roleId, roleData) {
    try {
      const roleRef = doc(db, ROLES_COLLECTION, roleId);
      await updateDoc(roleRef, {
        ...roleData,
        updatedAt: new Date().toISOString()
      });

      // Update permissions for all users with this role
      const usersRef = collection(db, USERS_COLLECTION);
      const usersWithRole = query(usersRef, where('role', '==', roleId));
      const usersSnap = await getDocs(usersWithRole);

      const batch = writeBatch(db);
      usersSnap.docs.forEach(userDoc => {
        batch.update(userDoc.ref, { permissions: roleData.permissions });
      });
      await batch.commit();

      return { success: true };
    } catch (error) {
      console.error('Error updating role:', error);
      throw new Error('Failed to update role');
    }
  },

  async getAllRoles() {
    try {
      const rolesRef = collection(db, ROLES_COLLECTION);
      const rolesSnap = await getDocs(rolesRef);
      return rolesSnap.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
    } catch (error) {
      console.error('Error getting roles:', error);
      throw new Error('Failed to get roles');
    }
  },

  // Role and Permission Management
  async getUserRole(userId) {
    try {
      const userRef = doc(db, USERS_COLLECTION, userId);
      const userSnap = await getDoc(userRef);
      if (userSnap.exists()) {
        return userSnap.data().role;
      }
      return null;
    } catch (error) {
      console.error('Error getting user role:', error);
      throw new Error('Failed to get user role');
    }
  },

  async getUserPermissions(userId) {
    try {
      const userRef = doc(db, USERS_COLLECTION, userId);
      const userSnap = await getDoc(userRef);
      if (userSnap.exists()) {
        return userSnap.data().permissions || {};
      }
      return {};
    } catch (error) {
      console.error('Error getting user permissions:', error);
      throw new Error('Failed to get user permissions');
    }
  },

  async checkPermission(userId, permission) {
    try {
      const userRef = doc(db, USERS_COLLECTION, userId);
      const userSnap = await getDoc(userRef);
      
      if (!userSnap.exists()) {
        return false;
      }

      const userData = userSnap.data();
      return userData.role === 'admin' || !!userData.permissions[permission];
    } catch (error) {
      console.error('Error checking permission:', error);
      return false;
    }
  }
};
