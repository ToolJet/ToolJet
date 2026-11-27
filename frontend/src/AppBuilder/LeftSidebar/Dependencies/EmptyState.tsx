import React from 'react';
import { WaypointsIcon } from 'lucide-react';
import RawPanelEmptyState, {
  NoMatchesEmptyState as RawNoMatchesEmptyState,
} from '@/AppBuilder/Shared/Panel/PanelEmptyState';

// Untyped JS modules — cast at the import site.
const PanelEmptyState = RawPanelEmptyState as React.ComponentType<any>;
const NoMatchesEmptyState = RawNoMatchesEmptyState as React.ComponentType<any>;

/** Nothing on the page participates in a relationship yet. */
export const NoDependenciesEmptyState = () => (
  <PanelEmptyState
    icon={<WaypointsIcon size={20} />}
    title="No dependencies yet"
    description="Connect a query to a component to see how data flows through this app."
    dataCy="dependency-viewer-empty"
  />
);

export type NoSearchMatchesEmptyStateProps = {
  term: string;
  onClearSearch?: () => void;
};

/** A search term matched nothing. */
export const NoSearchMatchesEmptyState = ({ term, onClearSearch }: NoSearchMatchesEmptyStateProps) => (
  <NoMatchesEmptyState
    term={term}
    description="Search matches components, queries, and variables."
    onClearSearch={onClearSearch}
    dataCy="dependency-viewer-empty"
    clearDataCy="dependency-clear-search-button"
  />
);

export default PanelEmptyState;
