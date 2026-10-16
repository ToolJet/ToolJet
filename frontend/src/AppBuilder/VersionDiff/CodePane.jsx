import React from 'react';
import { CodeDiff } from './CodeDiff';
import { LANGUAGE_NAME, Pane, SideLabels } from './Pane';

/**
 * The right pane's line diff for one code change: what it belongs to, a split or
 * unified view, and a way back to the live preview when there is one.
 */
export const CodePane = ({ entry, mode, onMode, baseName, targetName, darkMode, onClose }) => (
  <Pane
    label={`What changed in ${entry.title}`}
    status={entry.status}
    title={entry.title}
    note={`${entry.field} · ${LANGUAGE_NAME[entry.language] ?? entry.language}`}
    mode={mode}
    onMode={onMode}
    onClose={onClose}
  >
    {mode === 'split' && <SideLabels baseName={baseName} targetName={targetName} />}
    <div className="vd-scroll tw-flex-1 tw-min-h-0 tw-overflow-auto">
      <CodeDiff before={entry.before} after={entry.after} language={entry.language} mode={mode} darkMode={darkMode} />
    </div>
  </Pane>
);

export default CodePane;
