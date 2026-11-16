import React from 'react';

import EmptyState from '@/pages/components/EmptyState';
import NoResultFoundIllustration from '../illustrations/NoResultsFound';

interface NoAppsExistProps {
  icon: React.ReactNode;
  title: string;
  description?: string;
  /** Actions shown under the text, e.g. the add and build-with-AI buttons. */
  children?: React.ReactNode;
}

export function NoAppsExist({ icon, title, description, children }: NoAppsExistProps) {
  return (
    <EmptyState
      icon={icon}
      title={title}
      description={description}
      classes={{ description: 'tw-whitespace-pre-line' }}
      data-cy="dashboard-no-apps"
    >
      {children}
    </EmptyState>
  );
}

interface NoResultsProps {
  title: string;
  description?: string;
  'data-cy': string;
}

function NoResults({ title, description, 'data-cy': dataCy }: NoResultsProps) {
  return (
    <EmptyState illustration={<NoResultFoundIllustration />} title={title} description={description} data-cy={dataCy} />
  );
}

export function NoMatchesFound() {
  return <NoResults title="No matches found!" data-cy="dashboard-no-matches" />;
}

export function FolderNotFound() {
  return (
    <NoResults
      title="Folder not found"
      description="It may have been deleted, or you may not have access to it."
      data-cy="dashboard-folder-not-found"
    />
  );
}

export function NoFilterMatches() {
  return (
    <NoResults
      title="No apps match your filters"
      description="Try adjusting or removing your filters to see more apps."
      data-cy="dashboard-no-filter-matches"
    />
  );
}
