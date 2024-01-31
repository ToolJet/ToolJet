import React, { createContext, useState } from 'react';

const EditorContext = createContext(undefined);

function EditorContextWrapper({ children, handleYmapEventUpdates }) {
  const [variablesExposedForPreview, exposeToCodeHinter] = useState({});

  return (
    <EditorContext.Provider value={{ variablesExposedForPreview, exposeToCodeHinter, handleYmapEventUpdates }}>
      {children}
    </EditorContext.Provider>
  );
}

export { EditorContextWrapper, EditorContext };
