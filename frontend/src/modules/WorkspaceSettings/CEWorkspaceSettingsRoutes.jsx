import React from 'react';
import { Route, Routes, Navigate } from 'react-router-dom';
import { AdminRoute } from '@/Routes';
import WorkspaceSettingsPage from './WorkspaceSettingsPage';
import { WorkspaceLoginSettings, ManageOrgUsers, ManageGroupPermissionsV2 } from './pages';

export const getCEWorkspaceSettingsRoutes = (props) => [
  <Route index key="index" element={<Navigate to="users" replace />} />,
  <Route
    key="users"
    path="users"
    element={<ManageOrgUsers switchDarkMode={props.switchDarkMode} darkMode={props.darkMode} />}
  />,
  <Route
    key="groups"
    path="groups"
    element={<ManageGroupPermissionsV2 switchDarkMode={props.switchDarkMode} darkMode={props.darkMode} />}
  />,
  <Route
    key="workspace-login"
    path="workspace-login"
    element={<WorkspaceLoginSettings switchDarkMode={props.switchDarkMode} darkMode={props.darkMode} />}
  />,
];

const CEWorkspaceSettingsRoutes = (props) => (
  <AdminRoute {...props}>
    <Routes>
      <Route element={<WorkspaceSettingsPage switchDarkMode={props.switchDarkMode} darkMode={props.darkMode} />}>
        {getCEWorkspaceSettingsRoutes(props)}
      </Route>
    </Routes>
  </AdminRoute>
);

export default CEWorkspaceSettingsRoutes;
