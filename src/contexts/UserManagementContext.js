import React, { createContext, useContext, useState, useEffect } from 'react';
import { getAuth } from 'firebase/auth';
import { db } from '../firebase/config';
import { userService } from '../services/userService';

const auth = getAuth();

const UserManagementContext = createContext();

export const UserManagementProvider = ({ children }) => {
  const [currentUser, setCurrentUser] = useState(null);
  const [userRoles, setUserRoles] = useState([]);
  const [permissions, setPermissions] = useState({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = auth.onAuthStateChanged(async (user) => {
      if (user) {
        try {
          // Get user data including roles
          const userData = await userService.getUser(user.uid);
          setCurrentUser(userData);

          // Get user roles
          const roles = await userService.getUserRoles(user.uid);
          setUserRoles(roles);

          // Get permissions for all roles
          const allPermissions = {};
          await Promise.all(
            roles.map(async (roleId) => {
              const rolePermissions = await userService.getPermissions(roleId);
              Object.assign(allPermissions, rolePermissions);
            })
          );
          setPermissions(allPermissions);
        } catch (error) {
          console.error('Error loading user data:', error);
        }
      } else {
        setCurrentUser(null);
        setUserRoles([]);
        setPermissions({});
      }
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const hasPermission = (permission) => {
    if (!currentUser) return false;
    if (userRoles.includes('admin')) return true;
    return permissions[permission] === true;
  };

  const checkAccess = (requiredPermissions) => {
    if (!currentUser) return false;
    if (userRoles.includes('admin')) return true;
    if (!Array.isArray(requiredPermissions)) {
      requiredPermissions = [requiredPermissions];
    }
    return requiredPermissions.every(permission => permissions[permission] === true);
  };

  return (
    <UserManagementContext.Provider
      value={{
        currentUser,
        userRoles,
        permissions,
        loading,
        hasPermission,
        checkAccess
      }}
    >
      {children}
    </UserManagementContext.Provider>
  );
};

export const useUserManagement = () => {
  const context = useContext(UserManagementContext);
  if (!context) {
    throw new Error('useUserManagement must be used within a UserManagementProvider');
  }
  return context;
};

// HOC to protect routes based on permissions
export const withPermission = (WrappedComponent, requiredPermissions) => {
  return function WithPermissionComponent(props) {
    const { checkAccess, loading } = useUserManagement();

    if (loading) {
      return <div>Loading...</div>; // Or your loading component
    }

    if (!checkAccess(requiredPermissions)) {
      return <div>Access Denied</div>; // Or your access denied component
    }

    return <WrappedComponent {...props} />;
  };
};
