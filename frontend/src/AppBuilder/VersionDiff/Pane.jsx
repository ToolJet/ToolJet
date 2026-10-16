import React from 'react';
import { Columns2, Rows2, X } from 'lucide-react';
import { Button } from '@/components/ui/Rocket';
import { cn } from '@/lib/utils';
import { IconChoice, StatusDot } from './ui';

export const LANGUAGE_NAME = {
  javascript: 'JavaScript',
  python: 'Python',
  sql: 'SQL',
  css: 'CSS',
  json: 'JSON',
  text: 'Text',
};

/**
 * The right pane's frame for code (CodePane, QueryPane): status, title and a note on top, an
 * optional tag, the split or unified switch when there is a diff to lay out, and a way back to
 * the live preview when there is one.
 */
export const Pane = ({ className, label, status, title, note, tag, mode, onMode, onClose, children }) => (
  <section
    className={cn(
      'vd-code-pane tw-h-full tw-flex tw-flex-col tw-min-h-0 tw-rounded-lg tw-overflow-hidden tw-bg-background-surface-layer-01 tw-border tw-border-solid tw-border-border-weak',
      className
    )}
    aria-label={label}
  >
    <header className="tw-flex tw-items-center tw-gap-3 tw-px-4 tw-h-12 tw-shrink-0 tw-border-0 tw-border-b tw-border-solid tw-border-border-weak">
      <StatusDot status={status} />
      <div className="tw-flex tw-items-baseline tw-gap-2 tw-min-w-0">
        <span className="tw-truncate tw-font-title-default tw-text-text-default">{title}</span>
        {note && <span className="tw-truncate tw-font-body-small tw-text-text-placeholder">{note}</span>}
      </div>
      {tag}
      <div className="tw-ml-auto tw-flex tw-items-center tw-gap-2 tw-shrink-0">
        {onMode && (
          <IconChoice
            label="Code diff layout"
            value={mode}
            onChange={onMode}
            options={[
              { id: 'split', text: 'Split diff', Icon: Columns2 },
              { id: 'unified', text: 'Unified diff', Icon: Rows2 },
            ]}
          />
        )}
        {onClose && (
          <Button
            variant="ghost"
            size="medium"
            iconOnly
            aria-label="Back to the preview"
            data-tip="Back to the preview"
            onClick={onClose}
          >
            <X size={16} strokeWidth={1.75} className="tw-text-icon-strong" aria-hidden="true" />
          </Button>
        )}
      </div>
    </header>
    {children}
  </section>
);

/** Which version each side of a split diff shows. */
export const SideLabels = ({ baseName, targetName, className = 'tw-border-b' }) => (
  <div
    className={cn(
      'vd-code-pane__sides tw-grid tw-grid-cols-2 tw-shrink-0 tw-font-body-small tw-text-text-placeholder tw-border-0 tw-border-solid tw-border-border-weak',
      className
    )}
  >
    <span className="tw-px-4 tw-py-1.5 tw-truncate">{baseName}</span>
    <span className="tw-px-4 tw-py-1.5 tw-truncate tw-border-0 tw-border-l tw-border-solid tw-border-border-weak">
      {targetName}
    </span>
  </div>
);
