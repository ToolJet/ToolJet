import React from 'react';
import { cn } from '@/lib/utils';

// Small pieces the compare view shares, drawn the way the version menu draws
// its Draft and Released tags. Rocket's tooltip and popover portal to the body,
// outside this full-screen dialog and its dark-mode scope, so tips here are
// CSS (`data-tip`, see versionDiff.scss) and use the same tokens.

const TAG_TONES = {
  neutral: 'tw-bg-interactive-default tw-text-text-medium',
  warning: 'tw-bg-background-warning-weak tw-text-text-warning',
  success: 'tw-bg-background-success-weak tw-text-text-success',
  danger: 'tw-bg-background-error-weak tw-text-text-danger',
  accent: 'tw-bg-background-accent-weak tw-text-text-brand',
};

export const Tag = ({ tone = 'neutral', className, children }) => (
  <span
    className={cn(
      'tw-inline-flex tw-shrink-0 tw-items-center tw-h-[18px] tw-px-2 tw-rounded tw-font-title-small tw-whitespace-nowrap',
      TAG_TONES[tone],
      className
    )}
  >
    {children}
  </span>
);

export const STATUS_TONE = { added: 'success', changed: 'warning', removed: 'danger' };

const DOT_TONES = {
  added: 'tw-bg-icon-success',
  changed: 'tw-bg-icon-warning',
  removed: 'tw-bg-icon-danger',
};

// The one mark for added, changed and removed, in the list, the tabs and the dialogs.
export const StatusDot = ({ status, className }) => (
  <span
    className={cn('tw-inline-block tw-shrink-0 tw-w-1.5 tw-h-1.5 tw-rounded-full', DOT_TONES[status], className)}
    aria-hidden="true"
  />
);

// "8 added, 9 changed": counts in words, each led by its dot.
export const Counts = ({ counts, className }) => {
  const parts = ['added', 'changed', 'removed'].filter((status) => counts?.[status] > 0);
  if (!parts.length) return null;
  return (
    <span
      className={cn('tw-inline-flex tw-items-center tw-gap-2.5 tw-font-body-small tw-text-text-placeholder', className)}
    >
      {parts.map((status) => (
        <span key={status} className="tw-inline-flex tw-items-center tw-gap-1">
          <StatusDot status={status} />
          {counts[status]} {status}
        </span>
      ))}
    </span>
  );
};

export const Divider = () => <span className="tw-w-px tw-h-5 tw-bg-border-weak tw-shrink-0" aria-hidden="true" />;
