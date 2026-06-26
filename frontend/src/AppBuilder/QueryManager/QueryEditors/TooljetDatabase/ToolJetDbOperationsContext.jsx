import React, { createContext, useContext } from 'react';

const ToolJetDbOperationsContext = createContext();

export const ToolJetDbOperationsProvider = ({ value, children }) => (
  <ToolJetDbOperationsContext.Provider value={value}>{children}</ToolJetDbOperationsContext.Provider>
);

export const useToolJetDbOperationsContext = () => {
  const context = useContext(ToolJetDbOperationsContext);

  if (!context) {
    throw new Error('useToolJetDbOperationsContext must be used within a ToolJetDbOperationsProvider');
  }

  return context;
};
