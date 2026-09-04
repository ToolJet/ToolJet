import React, { useState } from 'react';
import CodeMirror from '@uiw/react-codemirror';
import { okaidia } from '@uiw/codemirror-theme-okaidia';
import { githubLight } from '@uiw/codemirror-theme-github';
import { sql as sqlLang } from '@codemirror/lang-sql';
import { EditorView } from '@codemirror/view';
import { search, openSearchPanel } from '@codemirror/search';
import SolidIcon from '@/_ui/Icon/SolidIcons';
import './SqlEditor.scss';

// Same basicSetup shape as AppBuilder/Widgets/CodeEditor.jsx - the only other standalone (non
// resolver-bound) CodeMirror usage in this codebase.
const EDITABLE_BASIC_SETUP = {
  lineNumbers: true,
  syntaxHighlighting: true,
  bracketMatching: true,
  foldGutter: true,
  highlightActiveLine: false,
  autocompletion: true,
  highlightActiveLineGutter: false,
  completionKeymap: true,
  searchKeymap: true,
};

const READ_ONLY_BASIC_SETUP = {
  lineNumbers: true,
  foldGutter: false,
  highlightActiveLine: false,
  highlightActiveLineGutter: false,
};

/**
 * Standalone (non resolver-bound) CodeMirror SQL editor, shared between SeedDataDrawer,
 * MigrationHistoryDrawer, and MigrationConfirmModal's SQL step - the App Builder's
 * MultiLineCodeEditor needs the AppBuilder module store/context that doesn't exist on this page.
 *
 * Editable (with the search-panel button, richer basicSetup, onChange) when `onChange` is passed;
 * read-only otherwise.
 */
const SqlEditor = ({ value, onChange, height, placeholder, dataCy = 'sql-editor' }) => {
  const [editorView, setEditorView] = useState(null);
  const darkMode = localStorage.getItem('darkMode') === 'true';
  const editable = !!onChange;

  return (
    <div
      className="tj-db-sql-editor tw-overflow-hidden tw-rounded"
      style={{ border: '1px solid var(--slate5)' }}
      data-cy={dataCy}
    >
      {editable && editorView && (
        <span
          className="tj-db-seed-data-search-btn"
          data-cy={`${dataCy}-search-button`}
          onClick={() => openSearchPanel(editorView)}
        >
          <SolidIcon name="search" width="14" fill="#889096" />
        </span>
      )}
      <CodeMirror
        value={value || (editable ? '' : '-- No SQL available for this migration')}
        height={height}
        theme={darkMode ? okaidia : githubLight}
        extensions={editable ? [sqlLang(), EditorView.lineWrapping, search()] : [sqlLang(), EditorView.lineWrapping]}
        editable={editable}
        onChange={editable ? onChange : undefined}
        basicSetup={editable ? EDITABLE_BASIC_SETUP : READ_ONLY_BASIC_SETUP}
        placeholder={placeholder}
        indentWithTab={editable}
        onCreateEditor={editable ? (view) => setEditorView(view) : undefined}
      />
    </div>
  );
};

export default SqlEditor;
