import React, { createContext, useState } from 'react';

const ResolveContext = createContext(undefined);

function ResolvableContext({ children }) {
  const [customResolves, setCustomResolves] = useState({});

  return <ResolveContext.Provider value={{ customResolves, setCustomResolves }}>{children}</ResolveContext.Provider>;
}

export { ResolvableContext, ResolveContext };
