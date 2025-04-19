import React, { createContext, useContext } from 'react';

export const ModuleContext = createContext();

export const ModuleProvider = ({ moduleId, isModuleMode, appType, children }) => {
  return <ModuleContext.Provider value={{ moduleId, isModuleMode, appType }}>{children}</ModuleContext.Provider>;
};

export const useModuleId = () => {
  const context = useContext(ModuleContext);
  if (!context) {
    throw new Error('useModuleId must be used within a ModuleProvider');
  }

  return context.moduleId;
};

export const useIsModuleMode = () => {
  const context = useContext(ModuleContext);
  if (!context) {
    throw new Error('useIsModuleMode must be used within a ModuleProvider');
  }
  return context.isModuleMode;
};

export const useAppType = () => {
  const context = useContext(ModuleContext);
  if (!context) {
    throw new Error('useAppType must be used within a ModuleProvider');
  }
  return context.appType;
};
