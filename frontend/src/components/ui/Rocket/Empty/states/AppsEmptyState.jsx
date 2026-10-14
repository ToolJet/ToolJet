import React from 'react';
import { Plus } from 'lucide-react';
import { Empty, EmptyHeader, EmptyMedia, EmptyTitle, EmptyDescription, EmptyContent } from '../Empty';
import { Button } from '../../Button/Button';
import AppsIllustration from '../illustrations/AppsIllustration';

function AppsEmptyState({ className, size = 'large', onCreateApp, ...props }) {
  return (
    <Empty size={size} className={className} {...props}>
      <EmptyMedia>
        <AppsIllustration width="176" height="121" />
      </EmptyMedia>
      {/*
        259px, not the EmptyHeader default of max-w-sm (384px): the design fixes the measure so the
        description wraps to exactly four lines under the illustration. Left as an override here
        rather than changed in EmptyHeader, which the data-source and workflow empty states share.
      */}
      <EmptyHeader className="tw-max-w-[259px]">
        {/* 16px / 500 / 24px comes from size="large" -> font-title-x-large. Nothing to override. */}
        <EmptyTitle>You don&apos;t have any apps yet</EmptyTitle>
        {/*
          The design calls for the default body size (12px/18px), but size="large" bumps the
          description to text-sm (14px/20px). Restating the tokens here lets tailwind-merge drop
          that override — same font-size group — so font-body-default's own metrics apply and the
          block lands at the specified 72px.
        */}
        <EmptyDescription className="tw-text-[length:var(--font-size-default)] tw-leading-[var(--line-height-default)]">
          You can start building from a blank canvas, use a pre-built template, or generate an app using AI. Choose the
          option that best fits your workflow.
        </EmptyDescription>
      </EmptyHeader>
      {onCreateApp && (
        <EmptyContent>
          <Button variant="outline" size="default" leadingVisual={<Plus size={14} />} onClick={onCreateApp}>
            Create new app
          </Button>
        </EmptyContent>
      )}
    </Empty>
  );
}

export default AppsEmptyState;
