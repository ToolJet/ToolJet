import React, { useEffect, useRef } from 'react';
import { Columns2, Rows2, X } from 'lucide-react';
import { Button } from '@/components/ui/Rocket';
import { CodeDiff } from './CodeDiff';
import { IconChoice, StatusDot, Tag } from './ui';

const LANGUAGE_NAME = {
  javascript: 'JavaScript',
  python: 'Python',
  sql: 'SQL',
  css: 'CSS',
  json: 'JSON',
  text: 'Text',
};

/**
 * A query picked in the change list: name, type and data source on top, then its code and its
 * other settings. A changed query shows line diffs; a new or removed one shows all it holds.
 */
export const QueryPane = ({ view, baseName, targetName, mode, onMode, darkMode, onClose, focusId }) => {
  const bodyRef = useRef(null);
  useEffect(() => {
    if (!focusId) return;
    bodyRef.current?.querySelector(`[data-code-id="${CSS.escape(focusId)}"]`)?.scrollIntoView({ block: 'start' });
  }, [focusId, view.key]);

  const kind = [view.type, view.dataSource && view.dataSource !== view.type ? view.dataSource : null]
    .filter(Boolean)
    .join(' · ');
  const codeMode = view.wholeQuery ? 'plain' : mode;

  return (
    <section
      className="vd-code-pane vd-query-pane tw-h-full tw-flex tw-flex-col tw-min-h-0 tw-rounded-lg tw-overflow-hidden tw-bg-background-surface-layer-01 tw-border tw-border-solid tw-border-border-weak"
      aria-label={`Query ${view.name}`}
    >
      <header className="tw-flex tw-items-center tw-gap-3 tw-px-4 tw-h-12 tw-shrink-0 tw-border-0 tw-border-b tw-border-solid tw-border-border-weak">
        <StatusDot status={view.status} />
        <div className="tw-flex tw-items-baseline tw-gap-2 tw-min-w-0">
          <span className="tw-truncate tw-font-title-default tw-text-text-default">{view.name}</span>
          {kind && <span className="tw-truncate tw-font-body-small tw-text-text-placeholder">{kind}</span>}
        </div>
        {view.status === 'added' && <Tag tone="success">New in {targetName}</Tag>}
        {view.status === 'removed' && <Tag tone="danger">Only in {baseName}</Tag>}
        <div className="tw-ml-auto tw-flex tw-items-center tw-gap-2 tw-shrink-0">
          {!view.wholeQuery && view.code.length > 0 && (
            <IconChoice
              label="Code diff layout"
              value={mode}
              onChange={onMode}
              options={[
                { id: 'split', text: 'Split diff', Icon: Columns2 },
                { id: 'unified', text: 'Unified diff', Icon: Rows2 },
              ]}
            />
          )}
          {onClose && (
            <Button
              variant="ghost"
              size="medium"
              iconOnly
              aria-label="Back to the preview"
              data-tip="Back to the preview"
              onClick={onClose}
            >
              <X size={16} strokeWidth={1.75} className="tw-text-icon-strong" aria-hidden="true" />
            </Button>
          )}
        </div>
      </header>
      <div ref={bodyRef} className="vd-scroll tw-flex-1 tw-min-h-0 tw-overflow-auto">
        {view.code.map((entry) => (
          <section
            key={entry.id}
            data-code-id={entry.id}
            className="vd-query-pane__block tw-border-0 tw-border-b tw-border-solid tw-border-border-weak"
          >
            <div className="tw-flex tw-items-baseline tw-gap-2 tw-px-4 tw-py-2 tw-bg-background-surface-layer-02">
              <span className="tw-font-title-small tw-text-text-default">{entry.field}</span>
              <span className="tw-font-body-small tw-text-text-placeholder">
                {LANGUAGE_NAME[entry.language] ?? entry.language}
              </span>
            </div>
            {codeMode === 'split' && (
              <div className="vd-code-pane__sides tw-grid tw-grid-cols-2 tw-font-body-small tw-text-text-placeholder tw-border-0 tw-border-y tw-border-solid tw-border-border-weak">
                <span className="tw-px-4 tw-py-1.5 tw-truncate">{baseName}</span>
                <span className="tw-px-4 tw-py-1.5 tw-truncate tw-border-0 tw-border-l tw-border-solid tw-border-border-weak">
                  {targetName}
                </span>
              </div>
            )}
            <CodeDiff
              before={entry.before}
              after={entry.after}
              language={entry.language}
              mode={codeMode}
              darkMode={darkMode}
            />
          </section>
        ))}
        {view.settings.length > 0 && (
          <section className="tw-px-4 tw-py-3">
            <h3 className="tw-m-0 tw-mb-2 tw-font-title-small tw-text-text-placeholder">
              {view.wholeQuery ? 'Settings' : 'Other changes'}
            </h3>
            {view.wholeQuery ? (
              // Everything the query holds: name and value side by side.
              <dl className="vd-query-pane__settings tw-m-0 tw-grid tw-grid-cols-[max-content_1fr] tw-gap-x-6 tw-gap-y-1.5">
                {view.settings.map((row, index) => (
                  <React.Fragment key={`${row.label}-${index}`}>
                    <dt className="tw-font-body-small tw-text-text-placeholder">{row.label}</dt>
                    <dd className="tw-m-0 tw-min-w-0 tw-break-words tw-font-body-small tw-text-text-default">
                      {row.value}
                    </dd>
                  </React.Fragment>
                ))}
              </dl>
            ) : (
              // What else changed, in the change list's own words (they already name the setting).
              <ul className="tw-m-0 tw-p-0 tw-list-none tw-flex tw-flex-col tw-gap-1.5">
                {view.settings.map((row, index) => (
                  <li key={`${row.label}-${index}`} className="tw-font-body-small tw-text-text-default">
                    {row.value}
                  </li>
                ))}
              </ul>
            )}
          </section>
        )}
        {view.settings.length === 0 && (view.wholeQuery || view.code.length === 0) && (
          <p className="tw-m-0 tw-px-4 tw-py-3 tw-font-body-small tw-text-text-placeholder">
            {view.code.length ? 'No other settings.' : 'Nothing else to show for this query.'}
          </p>
        )}
      </div>
    </section>
  );
};

export default QueryPane;
