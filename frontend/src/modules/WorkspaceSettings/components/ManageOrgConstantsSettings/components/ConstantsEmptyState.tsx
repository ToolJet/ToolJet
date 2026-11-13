import React from 'react';
import { KeyRound, Lock, Plus, SearchX, type LucideIcon } from 'lucide-react';
import {
  Button,
  Empty,
  EmptyContent,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from '@/components/ui/Rocket';
import { cn } from '@/lib/utils';

type ContentVariant = 'secret' | 'global';

const CONTENT: Record<ContentVariant, { Icon: LucideIcon; title: string; description: string; createLabel: string }> = {
  secret: {
    Icon: Lock,
    title: 'No secrets yet',
    description: 'Secrets are encrypted and hidden. Use them in data sources with {{secrets.name}}.',
    createLabel: 'Create secret',
  },
  global: {
    Icon: KeyRound,
    title: 'No global constants yet',
    description: 'Global constants hold plain values you can reuse in any app with {{constants.name}}.',
    createLabel: 'Create global constant',
  },
};

interface ConstantsEmptyStateProps extends React.HTMLAttributes<HTMLDivElement> {
  variant: ContentVariant | 'search';
  /** The search term shown in the `search` variant. */
  query?: string;
  /** Without it the empty state has no create button. */
  onCreate?: () => void;
  size?: 'large' | 'default' | 'small';
}

export default function ConstantsEmptyState({
  variant,
  query,
  onCreate,
  size = 'small',
  className,
  ...props
}: ConstantsEmptyStateProps) {
  if (variant === 'search') {
    return (
      <Empty size={size} className={cn('tw-px-4 tw-py-10', className)} {...props}>
        <EmptyMedia variant="icon" className="tw-mb-0">
          <SearchX className="tw-size-5" />
        </EmptyMedia>
        <EmptyHeader className="tw-max-w-none tw-gap-0.5">
          <EmptyTitle>No constants found</EmptyTitle>
          <EmptyDescription>{`No results for "${query}". Try a different name.`}</EmptyDescription>
        </EmptyHeader>
      </Empty>
    );
  }

  const { Icon, title, description, createLabel } = CONTENT[variant];
  return (
    <Empty size={size} className={cn('tw-px-4 tw-py-10', className)} {...props}>
      <EmptyMedia variant="icon" className="tw-mb-0">
        <Icon className="tw-size-5" />
      </EmptyMedia>
      <EmptyHeader className="tw-max-w-none tw-gap-0.5">
        <EmptyTitle>{title}</EmptyTitle>
        <EmptyDescription>{description}</EmptyDescription>
      </EmptyHeader>
      {onCreate && (
        <EmptyContent className="tw-mt-1">
          <Button
            variant="outline"
            size="medium"
            className="tw-border-border-accent-weak"
            leadingVisual={<Plus size={14} />}
            onClick={onCreate}
          >
            {createLabel}
          </Button>
        </EmptyContent>
      )}
    </Empty>
  );
}
