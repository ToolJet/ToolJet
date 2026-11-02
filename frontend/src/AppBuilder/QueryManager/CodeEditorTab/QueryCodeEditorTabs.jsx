import React, { useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { shallow } from 'zustand/shallow';
import useStore from '@/AppBuilder/_stores/store';
import { CodeEditorDocumentContext } from '@/AppBuilder/CodeEditor/codeEditorDocument';
import {
  closeAllCodeEditorTabWindows,
  forgetCodeEditorTabWindow,
  getCodeEditorTabWindow,
  mirrorStyles,
} from './codeEditorTabWindows';
import QueryCodeEditorTab from './QueryCodeEditorTab';

// How often to check whether the user closed or reloaded a tab: browsers don't tell the opener.
const TAB_CHECK_INTERVAL_MS = 500;

/**
 * Renders the code editor of each query open in its own browser tab. The tab is a blank window the app
 * opened, so the editor is this app's React tree portalled into it: it shares the store, and edits,
 * runs, environment and freeze state are the app tab's own. The tabs close with the app tab.
 */
const QueryCodeEditorTabs = () => {
  const queryIds = useStore((state) => state.queryPanel.codeEditorTabQueryIds, shallow);

  useEffect(() => {
    window.addEventListener('pagehide', closeAllCodeEditorTabWindows);
    return () => {
      window.removeEventListener('pagehide', closeAllCodeEditorTabWindows);
      // Leaving the editor without unloading the page (in-app navigation) closes them too.
      closeAllCodeEditorTabWindows();
    };
  }, []);

  return queryIds.map((queryId) => <CodeEditorTabPortal key={queryId} queryId={queryId} />);
};

const CodeEditorTabPortal = ({ queryId }) => {
  const closeCodeEditorTab = useStore((state) => state.queryPanel.closeCodeEditorTab);
  const [container, setContainer] = useState(null);
  // The editor's pending edit, written before the tab goes away.
  const flushRef = useRef(() => {});

  useEffect(() => {
    const tab = getCodeEditorTabWindow(queryId);
    let root = null;
    let stopMirroringStyles = () => {};

    const forget = () => {
      forgetCodeEditorTabWindow(queryId);
      closeCodeEditorTab(queryId);
    };

    const onPageHide = () => {
      flushRef.current();
      setContainer(null);
      if (tab.closed) forget();
    };

    // Also runs again after the user reloads the tab, which leaves it blank.
    const mount = () => {
      const tabDocument = tab.document;
      tabDocument.body.replaceChildren();
      tabDocument.head.replaceChildren();
      const base = tabDocument.createElement('base');
      base.href = document.baseURI;
      tabDocument.head.appendChild(base);
      stopMirroringStyles();
      stopMirroringStyles = mirrorStyles(document, tabDocument);
      tabDocument.body.className = document.body.className;
      root = tabDocument.createElement('div');
      root.className = 'query-code-editor-tab-root';
      tabDocument.body.appendChild(root);
      tab.addEventListener('pagehide', onPageHide);
      setContainer(root);
    };

    if (!tab || tab.closed) {
      forget();
      return undefined;
    }
    mount();

    const check = setInterval(() => {
      if (tab.closed) {
        forget();
      } else if (!tab.document.body?.contains(root) && tab.document.readyState === 'complete') {
        mount();
      }
    }, TAB_CHECK_INTERVAL_MS);

    return () => {
      clearInterval(check);
      tab.removeEventListener('pagehide', onPageHide);
      stopMirroringStyles();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [queryId]);

  if (!container) return null;

  return createPortal(
    <CodeEditorDocumentContext.Provider value={container.ownerDocument}>
      <QueryCodeEditorTab queryId={queryId} ownerDocument={container.ownerDocument} flushRef={flushRef} />
    </CodeEditorDocumentContext.Provider>,
    container
  );
};

export default QueryCodeEditorTabs;
