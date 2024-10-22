import React, { createContext, useContext } from 'react';

export const ModuleContext = createContext();

export const ModuleProvider = ({ moduleId, children }) => {
  return <ModuleContext.Provider value={{ moduleId }}>{children}</ModuleContext.Provider>;
};

export const useModuleId = () => {
  const context = useContext(ModuleContext);

  if (!context) {
    throw new Error('useModuleId must be used within a ModuleProvider');
  }

  return context;
};
