import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import SystemSettings from './SystemSettings';
import BackupRestore from './BackupRestore';
import NotificationSettings from './NotificationSettings';

const SettingsRouter = () => {
  return (
    <Routes>
      <Route path="system" element={<SystemSettings />} />
      <Route path="backup" element={<BackupRestore />} />
      <Route path="notifications" element={<NotificationSettings />} />
      <Route path="/" element={<Navigate to="system" replace />} />
    </Routes>
  );
};

export default SettingsRouter;
