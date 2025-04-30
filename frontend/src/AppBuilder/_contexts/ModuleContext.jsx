import React, { createContext, useContext } from 'react';

export const ModuleContext = createContext();

export const ModuleProvider = ({ moduleId, isModuleMode, appType, isModuleEditor, children }) => {
  return (
    <ModuleContext.Provider value={{ moduleId, isModuleMode, appType, isModuleEditor }}>
      {children}
    </ModuleContext.Provider>
  );
};

export const useModuleContext = () => {
  const context = useContext(ModuleContext);
  if (!context) {
    throw new Error('useModuleContext must be used within a ModuleProvider');
  }
  return context;
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

export const useIsModuleEditor = () => {
  const context = useContext(ModuleContext);
  if (!context) {
    throw new Error('useIsModuleEditor must be used within a ModuleProvider');
  }
  return context.isModuleEditor;
};
