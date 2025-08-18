import { createContext } from 'react';

const WorkflowEditorContext = createContext({
  editorSession: {},
  editorSessionActions: {
    copyNodeToClipboard: () => {},
    handleNodeDuplicate: () => {},
  },
});

export default WorkflowEditorContext;