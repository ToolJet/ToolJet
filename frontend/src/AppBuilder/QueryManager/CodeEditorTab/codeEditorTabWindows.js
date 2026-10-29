// Browser tabs the app opened to edit a query's code, by query id. Window objects stay out of the store:
// it holds only the ids (queryPanel.codeEditorTabQueryIds).
const tabs = new Map();

export const CODE_EDITOR_TAB_KINDS = ['runjs', 'runpy'];

export const codeEditorTabWindowName = (queryId) => `tj-query-code-${queryId}`;

// Must run inside the click handler, or the browser blocks the new tab.
export const openCodeEditorTabWindow = (queryId) => {
  const existing = tabs.get(queryId);
  if (existing && !existing.closed) {
    existing.focus();
    return existing;
  }
  const tab = window.open('', codeEditorTabWindowName(queryId));
  if (tab) tabs.set(queryId, tab);
  return tab;
};

export const getCodeEditorTabWindow = (queryId) => tabs.get(queryId);

export const forgetCodeEditorTabWindow = (queryId) => tabs.delete(queryId);

export const closeAllCodeEditorTabWindows = () => {
  tabs.forEach((tab) => tab.close());
  tabs.clear();
};

const isStyleNode = (node) =>
  node.nodeName === 'STYLE' || (node.nodeName === 'LINK' && node.getAttribute('rel') === 'stylesheet');

// Copies the app's stylesheets into the tab and keeps copying the ones added later (lazy chunks).
export const mirrorStyles = (fromDocument, toDocument) => {
  const copy = (node) => toDocument.head.appendChild(toDocument.importNode(node, true));
  Array.from(fromDocument.head.childNodes).filter(isStyleNode).forEach(copy);

  const observer = new MutationObserver((mutations) =>
    mutations.forEach((mutation) => Array.from(mutation.addedNodes).filter(isStyleNode).forEach(copy))
  );
  observer.observe(fromDocument.head, { childList: true });
  return () => observer.disconnect();
};
