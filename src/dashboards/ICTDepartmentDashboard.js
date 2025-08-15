import React from 'react';
import RoleApprovalDashboard from './RoleApprovalDashboard';

const ICTDepartmentDashboard = () => {
  // Only show requests from ICT Department
  return <RoleApprovalDashboard role="Head of Department" departmentFilter="ICT Department" />;
};

export default ICTDepartmentDashboard;
