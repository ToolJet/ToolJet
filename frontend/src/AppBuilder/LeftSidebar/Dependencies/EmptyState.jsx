import React from 'react';
import { SearchIcon, WaypointsIcon } from 'lucide-react';

const EmptyState = ({ icon, title, description, action }) => (
  <div className="dependency-empty-state" data-cy="dependency-viewer-empty">
    <div className="dependency-empty-state-content">
      <span className="dependency-empty-state-spot">{icon}</span>
      <div className="dependency-empty-state-text">
        <div className="dependency-empty-state-title">{title}</div>
        <div className="dependency-empty-state-description">{description}</div>
      </div>
    </div>
    {action && (
      <button type="button" className="dependency-empty-state-action" onClick={action.onClick} data-cy={action.dataCy}>
        {action.label}
      </button>
    )}
  </div>
);

/** Nothing on the page participates in a relationship yet. */
export const NoDependenciesEmptyState = () => (
  <EmptyState
    icon={<WaypointsIcon size={20} className="dependency-empty-state-icon" />}
    title="No dependencies yet"
    description="Connect a query to a component to see how data flows through this app."
  />
);

/** A search term matched nothing. */
export const NoSearchMatchesEmptyState = ({ term, onClearSearch }) => (
  <EmptyState
    icon={<SearchIcon size={20} className="dependency-empty-state-icon" />}
    title={`No matches for “${term}”`}
    description="Search matches components, queries, and variables."
    action={{ label: 'Clear search', onClick: onClearSearch, dataCy: 'dependency-clear-search-button' }}
  />
);

export default EmptyState;
