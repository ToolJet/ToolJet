import React from 'react';

import DesktopOnlyRoute from './DesktopOnlyRoute';
import { PrivateRoute } from './PrivateRoute';
import { AdminRoute } from './AdminRoute';

export const DesktopOnlyPrivateRoute = ({ children, darkMode }) => (
  <DesktopOnlyRoute darkMode={darkMode}>
    <PrivateRoute>{children}</PrivateRoute>
  </DesktopOnlyRoute>
);

export const DesktopOnlyAdminRoute = ({ children, darkMode }) => (
  <DesktopOnlyRoute darkMode={darkMode}>
    <AdminRoute>{children}</AdminRoute>
  </DesktopOnlyRoute>
);
