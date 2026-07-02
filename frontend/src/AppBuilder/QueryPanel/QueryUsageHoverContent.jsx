import React, { useMemo } from 'react';
import useStore from '@/AppBuilder/_stores/store';
import { decodeEntities } from '@/_helpers/utils';
import { getQueryUsage } from '@/AppBuilder/_utils/entityUsage';
import { KIND_LABELS } from '@/AppBuilder/Shared/EntityUsage/useEntityNavigation';

const MAX_ROWS_PER_GROUP = 6;

// Compact, read-only usage summary for the query-card badge hover popover.
// Mounted only while the popover is shown, so usage is computed lazily.
const QueryUsageHoverContent = ({ queryId, moduleId }) => {
  const usage = useMemo(() => getQueryUsage(useStore.getState(), queryId, moduleId), [queryId, moduleId]);

  const groups = [
    { title: 'Used by', entries: usage.usedBy },
    { title: 'Triggered by', entries: usage.triggeredBy },
  ].filter((group) => group.entries.length > 0);

  if (groups.length === 0) {
    return <div className="entity-usage-empty">Not used on this page</div>;
  }

  return (
    <div className="query-usage-hover-content">
      {groups.map((group) => (
        <div className="entity-usage-group" key={group.title}>
          <div className="entity-usage-group-title">
            {group.title} · {group.entries.length}
          </div>
          {group.entries.slice(0, MAX_ROWS_PER_GROUP).map((entry) => (
            <div className="entity-usage-row" key={`${entry.kind}-${entry.id ?? entry.name}`}>
              <div className="entity-usage-row-main">
                <span className={`entity-usage-kind entity-usage-kind-${entry.kind}`}>{KIND_LABELS[entry.kind]}</span>
                <span className="entity-usage-name text-truncate">{decodeEntities(entry.name)}</span>
              </div>
              {entry.details.length > 0 && (
                <div className="entity-usage-details text-truncate">{entry.details.join(', ')}</div>
              )}
            </div>
          ))}
          {group.entries.length > MAX_ROWS_PER_GROUP && (
            <div className="entity-usage-more">+{group.entries.length - MAX_ROWS_PER_GROUP} more</div>
          )}
        </div>
      ))}
      <div className="query-usage-hover-hint">Open ⋮ → View usage for details</div>
    </div>
  );
};

export default QueryUsageHoverContent;
