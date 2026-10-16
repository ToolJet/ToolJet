import React, { useEffect, useRef } from 'react';
import { EditorState } from '@codemirror/state';
import { EditorView, lineNumbers } from '@codemirror/view';
import { MergeView, unifiedMergeView } from '@codemirror/merge';
import { javascript } from '@codemirror/lang-javascript';
import { python } from '@codemirror/lang-python';
import { sql } from '@codemirror/lang-sql';
import { sass } from '@codemirror/lang-sass';
import { okaidia } from '@uiw/codemirror-theme-okaidia';
import { githubLight } from '@uiw/codemirror-theme-github';

// The same themes as the editor's code fields, so code reads the same here.
const LANGUAGES = {
  javascript: () => javascript(),
  json: () => javascript(),
  python: () => python(),
  sql: () => sql(),
  css: () => sass(),
  text: () => [],
};

// Unchanged stretches longer than this fold into a bar that expands on click.
const COLLAPSE = { margin: 3, minSize: 6 };

const baseExtensions = (language, darkMode) => [
  EditorState.readOnly.of(true),
  EditorView.editable.of(false),
  EditorView.lineWrapping,
  lineNumbers(),
  (LANGUAGES[language] ?? LANGUAGES.text)(),
  darkMode ? okaidia : githubLight,
];

/**
 * A read-only line diff of two texts: side by side ('split') or interleaved
 * ('unified'), with line numbers from each side and unchanged lines folded.
 * 'plain' shows one side as it is, for code that is entirely new or gone.
 */
export const CodeDiff = ({ before = '', after = '', language = 'text', mode = 'split', darkMode = false }) => {
  const hostRef = useRef(null);

  useEffect(() => {
    const parent = hostRef.current;
    if (!parent) return undefined;
    const extensions = baseExtensions(language, darkMode);
    const view =
      mode === 'plain'
        ? // A query that is new or gone: its code as it is, without diff marks.
          new EditorView({ parent, state: EditorState.create({ doc: after || before, extensions }) })
        : mode === 'unified'
        ? new EditorView({
            parent,
            state: EditorState.create({
              doc: after,
              extensions: [
                ...extensions,
                unifiedMergeView({ original: before, mergeControls: false, collapseUnchanged: COLLAPSE }),
              ],
            }),
          })
        : new MergeView({
            parent,
            a: { doc: before, extensions },
            b: { doc: after, extensions },
            collapseUnchanged: COLLAPSE,
            gutter: true,
          });
    return () => view.destroy();
  }, [before, after, language, mode, darkMode]);

  return <div ref={hostRef} className={`vd-code vd-code--${mode}`} data-language={language} />;
};

export default CodeDiff;
