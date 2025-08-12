import { useUserManagement } from '../contexts/UserManagementContext';

export const useAuthorization = () => {
  const { hasPermission, checkAccess, userRoles } = useUserManagement();

  const canView = (module) => hasPermission(`${module}.view`);
  const canCreate = (module) => hasPermission(`${module}.create`);
  const canUpdate = (module) => hasPermission(`${module}.update`);
  const canDelete = (module) => hasPermission(`${module}.delete`);
  
  const isAdmin = () => userRoles.includes('admin');

  return {
    canView,
    canCreate,
    canUpdate,
    canDelete,
    hasPermission,
    checkAccess,
    isAdmin
  };
};

export default useAuthorization;
