import React, { useState } from 'react';
import { decodeEntities } from '@/_helpers/utils';
import { SearchBox } from '@/_components/SearchBox';
import useEntityNavigation, { KIND_LABELS, NAVIGABLE_KINDS } from './useEntityNavigation';
import './entityUsage.scss';

const SEARCH_THRESHOLD = 10;

// Renders usage groups (e.g. Uses / Used by / Triggers) with click-to-navigate rows.
// groups: [{ title, entries: UsageEntry[] }]
export const EntityUsageList = ({ groups, emptyMessage = 'No dependencies yet', onNavigate, readOnly = false }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const navigateToEntity = useEntityNavigation();

  const totalEntries = groups.reduce((sum, group) => sum + group.entries.length, 0);

  const handleEntryClick = (entry) => {
    if (navigateToEntity(entry)) onNavigate?.();
  };

  const matchesSearch = (entry) => {
    if (!searchTerm) return true;
    const term = searchTerm.toLowerCase();
    return (
      entry.name.toLowerCase().includes(term) || entry.details.some((detail) => detail.toLowerCase().includes(term))
    );
  };

  const visibleGroups = groups
    .map((group) => ({ ...group, entries: group.entries.filter(matchesSearch) }))
    .filter((group) => group.entries.length > 0);

  if (totalEntries === 0) {
    return (
      <div className="entity-usage-empty" data-cy="entity-usage-empty">
        {emptyMessage}
      </div>
    );
  }

  return (
    <div className="entity-usage-list">
      {totalEntries > SEARCH_THRESHOLD && (
        <div className="entity-usage-search">
          <SearchBox
            width="100%"
            placeholder="Search dependencies"
            callBack={(e) => setSearchTerm(e.target.value)}
            onClearCallback={() => setSearchTerm('')}
            dataCy="entity-usage"
          />
        </div>
      )}
      {visibleGroups.length === 0 && <div className="entity-usage-empty">No matches</div>}
      {visibleGroups.map((group) => (
        <div className="entity-usage-group" key={group.title}>
          <div
            className="entity-usage-group-title"
            data-cy={`entity-usage-group-${group.title.toLowerCase().replace(/\s+/g, '-')}`}
          >
            {group.title} · {group.entries.length}
          </div>
          {group.entries.map((entry) => {
            const navigable = !readOnly && NAVIGABLE_KINDS.has(entry.kind);
            return (
              <div
                key={`${entry.kind}-${entry.id ?? entry.name}`}
                className={`entity-usage-row ${navigable ? 'navigable' : ''}`}
                onClick={navigable ? () => handleEntryClick(entry) : undefined}
                role={navigable ? 'button' : undefined}
                data-cy={`entity-usage-row-${entry.name.toLowerCase().replace(/\s+/g, '-')}`}
              >
                <div className="entity-usage-row-main">
                  <span className={`entity-usage-kind entity-usage-kind-${entry.kind}`}>{KIND_LABELS[entry.kind]}</span>
                  <span className="entity-usage-name text-truncate">{decodeEntities(entry.name)}</span>
                </div>
                {entry.details.length > 0 && (
                  <div className="entity-usage-details text-truncate" title={entry.details.join(', ')}>
                    {entry.details.join(', ')}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      ))}
    </div>
  );
};

export default EntityUsageList;
