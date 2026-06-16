import React from 'react';
import { Navigate } from 'react-router-dom';

// The 'Settings' module was never registered in any edition's registry, so the
// old withEditionSpecificModule wrapper redirected in ALL editions. Preserved
// as a plain redirect — if a Settings module ever ships, route it here.
const Settings = () => <Navigate to="/" replace />;

export default Settings;
