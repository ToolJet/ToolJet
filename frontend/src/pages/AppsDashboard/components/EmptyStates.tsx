import React from 'react';
import type { TAppType } from '../helper';

import {
  Empty,
  EmptyContent,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from '@/components/ui/Rocket/Empty/Empty';
import NoResultFoundIllustration from '../illustrations/NoResultsFound';
import AddNewMenu from './AddNewMenu';
import BuildWithAIButton from './BuildWithAIButton';

interface NoAppsExistProps {
  icon: React.ReactNode;
  title: string;
  description: string;
  appType: TAppType;
  onAddApp?: () => void;
  onAddFolder?: () => void;
  onBuildWithAI?: () => void;
}

export function NoAppsExist({
  icon,
  title,
  description,
  appType,
  onAddApp,
  onAddFolder,
  onBuildWithAI,
}: NoAppsExistProps & { appType: TAppType }) {
  return (
    <Empty className="tw-gap-3 tw-px-4 tw-py-10" data-cy="dashboard-no-apps">
      <EmptyHeader className="tw-gap-0">
        <EmptyMedia variant="icon" className="tw-mb-0 tw-size-auto tw-p-1.5">
          {icon}
        </EmptyMedia>

        <EmptyTitle className="tw-mt-2">{title}</EmptyTitle>

        <EmptyDescription className="tw-mt-0.5 tw-whitespace-pre-line">{description}</EmptyDescription>
      </EmptyHeader>

      <EmptyContent className="tw-flex-row tw-justify-center tw-gap-1">
        <AddNewMenu appType={appType} onAddApp={onAddApp} onAddFolder={onAddFolder} />
        <BuildWithAIButton onClick={onBuildWithAI} data-cy="no-apps-build-with-ai" />
      </EmptyContent>
    </Empty>
  );
}

interface NoResultsProps {
  title: string;
  description?: string;
  'data-cy': string;
}

function NoResults({ title, description, 'data-cy': dataCy }: NoResultsProps) {
  return (
    <Empty className="tw-gap-3 tw-px-4 tw-py-10" data-cy={dataCy}>
      <EmptyHeader className="tw-gap-0">
        <EmptyMedia className="tw-mb-0">
          <NoResultFoundIllustration width={128} height={97} />
        </EmptyMedia>

        <EmptyTitle className="tw-mt-2.5">{title}</EmptyTitle>

        {description && <EmptyDescription className="tw-mt-0.5">{description}</EmptyDescription>}
      </EmptyHeader>
    </Empty>
  );
}

export function NoMatchesFound() {
  return <NoResults title="No matches found!" data-cy="dashboard-no-matches" />;
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
