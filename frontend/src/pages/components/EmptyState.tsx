import React from 'react';
import type { ReactNode } from 'react';

import { cn } from '@/lib/utils';
import {
  Empty,
  EmptyContent,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from '@/components/ui/Rocket/Empty/Empty';

/** Class overrides per part. Each one is merged over that part's default, so a conflicting utility wins. */
export interface EmptyStateClasses {
  root?: string;
  header?: string;
  /** The wrapper around the icon or illustration. */
  media?: string;
  title?: string;
  description?: string;
  /** The wrapper around `children`. */
  content?: string;
}

// An icon sits in a tinted tile; an illustration is shown as is. Pass one, not both.
type EmptyStateMedia = { icon?: ReactNode; illustration?: never } | { icon?: never; illustration?: ReactNode };

export type EmptyStateProps = EmptyStateMedia & {
  title: string;
  description?: string;
  /** Rendered under the text, centered in a row, e.g. action buttons. Omit for a text-only state. */
  children?: ReactNode;
  classes?: EmptyStateClasses;
  'data-cy'?: string;
};

export default function EmptyState({
  icon,
  illustration,
  title,
  description,
  children,
  classes,
  'data-cy': dataCy,
}: EmptyStateProps) {
  const hasIcon = Boolean(icon);
  const hasMedia = hasIcon || Boolean(illustration);

  return (
    <Empty className={cn('tw-gap-3 tw-px-4 tw-py-10', classes?.root)} data-cy={dataCy}>
      <EmptyHeader className={cn('tw-gap-0', classes?.header)}>
        {hasMedia && (
          <EmptyMedia
            variant={hasIcon ? 'icon' : 'default'}
            className={cn('tw-mb-0', hasIcon && 'tw-size-auto tw-p-1.5', classes?.media)}
          >
            {hasIcon ? icon : illustration}
          </EmptyMedia>
        )}

        <EmptyTitle className={cn(hasMedia && (hasIcon ? 'tw-mt-2' : 'tw-mt-2.5'), classes?.title)}>{title}</EmptyTitle>

        {Boolean(description) && (
          <EmptyDescription className={cn('tw-mt-0.5', classes?.description)}>{description}</EmptyDescription>
        )}
      </EmptyHeader>

      {Boolean(children) && (
        <EmptyContent className={cn('tw-flex-row tw-justify-center tw-gap-1', classes?.content)}>
          {children}
        </EmptyContent>
      )}
    </Empty>
  );
}
