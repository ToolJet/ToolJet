import React from 'react';

// Lives in its own module (not App.jsx) so consumers — and tests — can import the
// context without pulling in the entire App component tree.
export const BreadCrumbContext = React.createContext({});
