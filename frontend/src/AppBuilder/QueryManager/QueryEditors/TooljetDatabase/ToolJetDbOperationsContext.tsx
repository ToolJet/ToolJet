import React, { createContext, useContext, ReactNode } from 'react';

type ToolJetDbOperationsContextValue = Record<string, unknown>;

type ToolJetDbOperationsProviderProps = {
  value: ToolJetDbOperationsContextValue;
  children: ReactNode;
};

const ToolJetDbOperationsContext = createContext<ToolJetDbOperationsContextValue | undefined>(undefined);

export const ToolJetDbOperationsProvider = ({ value, children }: ToolJetDbOperationsProviderProps) => (
  <ToolJetDbOperationsContext.Provider value={value}>{children}</ToolJetDbOperationsContext.Provider>
);

export const useToolJetDbOperationsContext = (): ToolJetDbOperationsContextValue => {
  const context = useContext(ToolJetDbOperationsContext);

  if (!context) {
    throw new Error('useToolJetDbOperationsContext must be used within a ToolJetDbOperationsProvider');
  }

  return context;
};
