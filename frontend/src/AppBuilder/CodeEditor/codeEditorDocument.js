import React from 'react';
import { tooltips } from '@codemirror/view';

// The document a code editor renders into. The app's own document unless the editor is portalled into
// another browser tab (QueryManager/CodeEditorTab), whose autocomplete must open in that tab.
export const CodeEditorDocumentContext = React.createContext(null);

// One tooltip extension per document: anything fed into CodeMirror's `extensions` must keep a stable
// identity (see MultiLineCodeEditor), and tooltips go to <body> to escape the editor's overflow.
const tooltipExtensions = new WeakMap();

export const getTooltipExtension = (ownerDocument) => {
  if (!tooltipExtensions.has(ownerDocument)) {
    tooltipExtensions.set(ownerDocument, tooltips({ parent: ownerDocument.body }));
  }
  return tooltipExtensions.get(ownerDocument);
};
