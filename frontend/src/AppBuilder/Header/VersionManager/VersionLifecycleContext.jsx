import React, { createContext, useContext } from 'react';

const VersionLifecycleContext = createContext(null);

export const VersionLifecycleProvider = ({ value, children }) => (
  <VersionLifecycleContext.Provider value={value}>{children}</VersionLifecycleContext.Provider>
);

export const useOptionalVersionLifecycle = () => useContext(VersionLifecycleContext);

export function useVersionLifecycle() {
  const value = useOptionalVersionLifecycle();
  if (!value) throw new Error('Version lifecycle content requires a VersionLifecycleProvider');
  return value;
}
