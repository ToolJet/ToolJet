import { createContext } from 'react';

const WorkflowEditorContext = createContext({
  editorSession: {},
  editorSessionActions: {},
});

export default WorkflowEditorContext;
