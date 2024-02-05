import { createContext, useContext } from 'react';

export const ModuleContext = createContext(null);

export const useModuleName = () => {
  const moduleName = useContext(ModuleContext);

  if (!moduleName) throw Error('useModuleName can only be used inside a ModuleContext');

  return moduleName;
};
