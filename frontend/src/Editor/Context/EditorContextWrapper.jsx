import React, { createContext, useState } from 'react';

const EditorContext = createContext(undefined);

function EditorContextWrapper({ children }) {
  const [variablesExposedForPreview, exposeToCodeHinter] = useState({});

  return (
    <EditorContext.Provider value={{ variablesExposedForPreview, exposeToCodeHinter }}>
      {children}
    </EditorContext.Provider>
  );
}

export { EditorContextWrapper, EditorContext };
