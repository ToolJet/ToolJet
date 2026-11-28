import React, { forwardRef, type HTMLAttributes, type ReactNode } from 'react';
import { cn } from '@/lib/utils';
import { ROCKET_SCROLLBAR } from '../scrollbar';

// Slim, fixed-width panel for the left edge of a page (Figma "Tables panel", 232px). Presentational: showing and
// hiding is the page's job, so there is no collapse state here.
const SidePanel = forwardRef<HTMLElement, HTMLAttributes<HTMLElement>>(function SidePanel(
  { className, ...props },
  ref
) {
  return (
    <aside
      ref={ref}
      className={cn(
        'tw-flex tw-h-full tw-w-[232px] tw-shrink-0 tw-flex-col',
        // Preflight is off: set the border style, and zero the other sides (a solid style alone gives them 3px).
        'tw-border-0 tw-border-r tw-border-solid tw-border-border-weak tw-bg-page-weak',
        className
      )}
      {...props}
    />
  );
});

export interface SidePanelHeaderProps extends Omit<HTMLAttributes<HTMLDivElement>, 'title'> {
  title: ReactNode;
  actions?: ReactNode;
}

const SidePanelHeader = forwardRef<HTMLDivElement, SidePanelHeaderProps>(function SidePanelHeader(
  { title, actions, className, ...props },
  ref
) {
  return (
    <div
      ref={ref}
      className={cn(
        'tw-flex tw-h-12 tw-shrink-0 tw-items-center tw-justify-between',
        'tw-border-0 tw-border-b tw-border-solid tw-border-border-weak tw-pl-4 tw-pr-3',
        className
      )}
      {...props}
    >
      <h2 className="tw-m-0 tw-min-w-0 tw-truncate tw-font-title-x-large tw-text-text-default">{title}</h2>
      {actions && (
        <div data-slot="side-panel-actions" className="tw-flex tw-shrink-0 tw-items-center tw-gap-0.5">
          {actions}
        </div>
      )}
    </div>
  );
});

export interface SidePanelSectionProps extends HTMLAttributes<HTMLDivElement> {
  label: ReactNode;
  count?: ReactNode;
}

const SidePanelSection = forwardRef<HTMLDivElement, SidePanelSectionProps>(function SidePanelSection(
  { label, count, className, ...props },
  ref
) {
  return (
    <div
      ref={ref}
      className={cn('tw-flex tw-h-10 tw-shrink-0 tw-items-center tw-gap-1 tw-px-4 tw-text-text-placeholder', className)}
      {...props}
    >
      <span className="tw-font-title-section-title tw-uppercase">{label}</span>
      {count !== undefined && count !== null && (
        <span data-slot="side-panel-count" className="tw-font-body-small">
          {count}
        </span>
      )}
    </div>
  );
});

const SidePanelBody = forwardRef<HTMLDivElement, HTMLAttributes<HTMLDivElement>>(function SidePanelBody(
  { className, ...props },
  ref
) {
  return (
    <div
      ref={ref}
      className={cn(
        'tw-flex tw-min-h-0 tw-flex-1 tw-flex-col tw-gap-0.5 tw-overflow-y-auto tw-p-2',
        ROCKET_SCROLLBAR,
        className
      )}
      {...props}
    />
  );
});

export { SidePanel, SidePanelHeader, SidePanelSection, SidePanelBody };
