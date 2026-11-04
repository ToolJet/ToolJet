import React, { useState } from 'react';
import { ChevronDown, X } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/Rocket/Popover/Popover';

// One row of the panel: a 60px column for the connector, the column and operator fields, the value, and a 20px cross
export const ROW_CLASS =
  'tw-mb-2 tw-grid tw-grid-cols-[60px_minmax(0,1fr)_minmax(0,1.15fr)_minmax(0,2fr)_20px] tw-items-center tw-gap-2';

// A 36px bordered field in the table's type (14px, the page font)
export const FIELD_CLASS =
  'tw-flex tw-h-9 tw-w-full tw-min-w-0 tw-items-center tw-gap-2 tw-rounded-md tw-border tw-border-solid tw-border-border-default tw-bg-background-surface-layer-01 tw-px-3 tw-text-lg tw-text-text-default [font-family:inherit] focus-within:tw-border-border-accent-strong';

const CONNECTORS = ['and', 'or'];

/**
 * How a row joins the ones before it: "where" / "and" / "or" as grey text, or, on the one row that sets it for all,
 * a select of and / or.
 */
export const RowConnector = ({ label, dataCy, onChange, darkMode }) => {
  const [open, setOpen] = useState(false);

  if (!onChange) {
    return (
      <span data-cy={dataCy} className="tw-w-full tw-text-right tw-text-lg tw-text-text-placeholder">
        {label}
      </span>
    );
  }
  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <button
          type="button"
          data-cy="filter-connector-select"
          aria-label="Match filters with"
          aria-haspopup="listbox"
          className={cn(FIELD_CLASS, 'tw-cursor-pointer tw-justify-between tw-px-2')}
        >
          <span>{label}</span>
          <ChevronDown size={12} className="tw-shrink-0 tw-text-icon-default" />
        </button>
      </PopoverTrigger>
      <PopoverContent
        align="start"
        sideOffset={4}
        // above the panel and the dialogs the builder lifts to 1050
        className={cn('tw-z-[1060] tw-w-max tw-min-w-[72px] tw-gap-0 tw-p-2', darkMode && 'dark-theme')}
      >
        <div role="listbox" aria-label="Match filters with" className="tw-flex tw-flex-col">
          {CONNECTORS.map((connector) => (
            <button
              key={connector}
              type="button"
              role="option"
              aria-selected={connector === label}
              data-cy={`filter-connector-option-${connector}`}
              onClick={() => {
                onChange(connector);
                setOpen(false);
              }}
              className="tw-flex tw-h-8 tw-w-full tw-items-center tw-rounded-md tw-border-0 tw-bg-transparent tw-px-2 tw-text-left tw-text-lg tw-text-text-default [font-family:inherit] hover:tw-bg-interactive-hover aria-selected:tw-font-medium"
            >
              {connector}
            </button>
          ))}
        </div>
      </PopoverContent>
    </Popover>
  );
};

export const RowCloseButton = ({ dataCy, label, onClick }) => (
  <button
    type="button"
    data-cy={dataCy}
    aria-label={label}
    onClick={onClick}
    className="tw-flex tw-h-5 tw-w-5 tw-items-center tw-justify-center tw-rounded tw-border-0 tw-bg-transparent tw-p-0 tw-text-icon-default hover:tw-bg-interactive-hover"
  >
    <X size={16} />
  </button>
);
