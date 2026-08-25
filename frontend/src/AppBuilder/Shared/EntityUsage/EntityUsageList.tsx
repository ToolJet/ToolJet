import React, { useState } from 'react';
import { decodeEntities } from '@/_helpers/utils';
import { SearchBox as RawSearchBox } from '@/_components/SearchBox';
import useEntityNavigation, { KIND_LABELS, NAVIGABLE_KINDS } from './useEntityNavigation';
import { activateOnEnterOrSpace } from './keyboard';
import type { UsageEntry } from '@/AppBuilder/_utils/entityUsage';
import './entityUsage.scss';

// Untyped JS module — cast at the import site.
const SearchBox = RawSearchBox as React.ComponentType<any>;

const SEARCH_THRESHOLD = 10;

export type EntityUsageGroup = {
  title: string;
  entries: UsageEntry[];
};

export type EntityUsageListProps = {
  groups: EntityUsageGroup[];
  emptyMessage?: string;
  onNavigate?: () => void;
  readOnly?: boolean;
};

// Renders usage groups (e.g. Uses / Used by / Triggers) with click-to-navigate rows.
export const EntityUsageList = ({
  groups,
  emptyMessage = 'No dependencies yet',
  onNavigate,
  readOnly = false,
}: EntityUsageListProps) => {
  const [searchTerm, setSearchTerm] = useState('');
  const navigateToEntity = useEntityNavigation();

  const totalEntries = groups.reduce((sum, group) => sum + group.entries.length, 0);

  const handleEntryClick = (entry: UsageEntry) => {
    if (navigateToEntity(entry)) onNavigate?.();
  };

  const matchesSearch = (entry: UsageEntry) => {
    if (!searchTerm) return true;
    const term = searchTerm.toLowerCase();
    return (
      entry.name.toLowerCase().includes(term) ||
      entry.details.some((detail) => detail.label.toLowerCase().includes(term))
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
            callBack={(e: any) => setSearchTerm(e.target.value)}
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
            const detailText = entry.details.map((detail) => detail.label).join(', ');
            return (
              <div
                key={`${entry.kind}-${entry.id ?? entry.name}`}
                className={`entity-usage-row ${navigable ? 'navigable' : ''}`}
                onClick={navigable ? () => handleEntryClick(entry) : undefined}
                onKeyDown={navigable ? activateOnEnterOrSpace(() => handleEntryClick(entry)) : undefined}
                role={navigable ? 'button' : undefined}
                tabIndex={navigable ? 0 : undefined}
                data-cy={`entity-usage-row-${entry.name.toLowerCase().replace(/\s+/g, '-')}`}
              >
                <div className="entity-usage-row-main">
                  <span className={`entity-usage-kind entity-usage-kind-${entry.kind}`}>{KIND_LABELS[entry.kind]}</span>
                  <span className="entity-usage-name text-truncate">{decodeEntities(entry.name)}</span>
                </div>
                {detailText && (
                  <div className="entity-usage-details text-truncate" title={detailText}>
                    {detailText}
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
