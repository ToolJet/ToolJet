import React from 'react';
import { Columns2, Rows2, X } from 'lucide-react';
import { Button } from '@/components/ui/Rocket';
import { CodeDiff } from './CodeDiff';
import { IconChoice, StatusDot } from './ui';

const LANGUAGE_NAME = {
  javascript: 'JavaScript',
  python: 'Python',
  sql: 'SQL',
  css: 'CSS',
  json: 'JSON',
  text: 'Text',
};

/**
 * The right pane's line diff for one code change: what it belongs to, a split or
 * unified view, and a way back to the live preview when there is one.
 */
export const CodePane = ({ entry, mode, onMode, baseName, targetName, darkMode, onClose }) => (
  <section
    className="vd-code-pane tw-h-full tw-flex tw-flex-col tw-min-h-0 tw-rounded-lg tw-overflow-hidden tw-bg-background-surface-layer-01 tw-border tw-border-solid tw-border-border-weak"
    aria-label={`What changed in ${entry.title}`}
  >
    <header className="tw-flex tw-items-center tw-gap-3 tw-px-4 tw-h-12 tw-shrink-0 tw-border-0 tw-border-b tw-border-solid tw-border-border-weak">
      <StatusDot status={entry.status} />
      <div className="tw-flex tw-items-baseline tw-gap-2 tw-min-w-0">
        <span className="tw-truncate tw-font-title-default tw-text-text-default">{entry.title}</span>
        <span className="tw-truncate tw-font-body-small tw-text-text-placeholder">
          {entry.field} · {LANGUAGE_NAME[entry.language] ?? entry.language}
        </span>
      </div>
      <div className="tw-ml-auto tw-flex tw-items-center tw-gap-2 tw-shrink-0">
        <IconChoice
          label="Code diff layout"
          value={mode}
          onChange={onMode}
          options={[
            { id: 'split', text: 'Split diff', Icon: Columns2 },
            { id: 'unified', text: 'Unified diff', Icon: Rows2 },
          ]}
        />
        {onClose && (
          <Button
            variant="ghost"
            size="medium"
            iconOnly
            aria-label="Back to the preview"
            data-tip="Back to the preview"
            onClick={onClose}
          >
            <X size={16} strokeWidth={1.75} aria-hidden="true" />
          </Button>
        )}
      </div>
    </header>
    {mode === 'split' && (
      <div className="vd-code-pane__sides tw-grid tw-grid-cols-2 tw-shrink-0 tw-font-body-small tw-text-text-placeholder tw-border-0 tw-border-b tw-border-solid tw-border-border-weak">
        <span className="tw-px-4 tw-py-1.5 tw-truncate">{baseName}</span>
        <span className="tw-px-4 tw-py-1.5 tw-truncate tw-border-0 tw-border-l tw-border-solid tw-border-border-weak">
          {targetName}
        </span>
      </div>
    )}
    <div className="vd-scroll tw-flex-1 tw-min-h-0 tw-overflow-auto">
      <CodeDiff before={entry.before} after={entry.after} language={entry.language} mode={mode} darkMode={darkMode} />
    </div>
  </section>
);

export default CodePane;
