import React, { useEffect, useRef } from 'react';
import { CodeDiff } from './CodeDiff';
import { LANGUAGE_NAME, Pane, SideLabels } from './Pane';
import { Tag } from './ui';

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
    <Pane
      className="vd-query-pane"
      label={`Query ${view.name}`}
      status={view.status}
      title={view.name}
      note={kind}
      tag={
        view.status === 'added' ? (
          <Tag tone="success">New in {targetName}</Tag>
        ) : view.status === 'removed' ? (
          <Tag tone="danger">Only in {baseName}</Tag>
        ) : null
      }
      mode={mode}
      onMode={!view.wholeQuery && view.code.length > 0 ? onMode : null}
      onClose={onClose}
    >
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
            {codeMode === 'split' && <SideLabels baseName={baseName} targetName={targetName} className="tw-border-y" />}
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
    </Pane>
  );
};

export default QueryPane;
