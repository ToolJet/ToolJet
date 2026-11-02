import React from 'react';

// Lives outside App.jsx so leaf components can read the breadcrumb context without importing
// the router root (App.jsx -> '@/modules'), which closes an import cycle through
// '@/modules/common/helpers'.
export const BreadCrumbContext = React.createContext({});
