import React, { type ReactNode } from 'react';
import { CornerDownLeft, X } from 'lucide-react';
import { Button } from '@/components/ui/Rocket/Button/Button';
import { ROCKET_SCROLLBAR } from '@/components/ui/Rocket/scrollbar';
import { cn } from '@/lib/utils';

type DrawerShellProps = {
  title: string;
  /** Sits right of the title (a Tag, for example). */
  titleAdornment?: ReactNode;
  onClose: () => void;
  children: ReactNode;
  /** Left side of the footer: a short warning, for example. */
  footerStart?: ReactNode;
  submitLabel: string;
  submitDisabled?: boolean;
  isSubmitting?: boolean;
  onSubmit: () => void;
  /** Shift + Enter in a text field, when the drawer can submit and stay open. Without it Shift + Enter submits as Enter. */
  onSubmitAndStay?: () => void;
  /** data-cy of the title. */
  'data-cy'?: string;
  /** data-cy of the submit button. */
  submitDataCy?: string;
};

// Header, scrolling body and sticky footer shared by the table and column drawers. The width comes from the Drawer
// around it. Measurements follow the Figma Drawer: 48px header (0 12 0 16), 16px body padding, footer 12 16.
//
// Enter in a text field submits, when the primary button is enabled (the button's icon says so). Only a text input
// inside the shell counts: a button already acts on Enter, a code editor and a textarea need it for new lines, and
// Radix lists render in a portal, outside the shell's DOM though React bubbles their events up to it.
export function DrawerShell({
  title,
  titleAdornment,
  onClose,
  children,
  footerStart,
  submitLabel,
  submitDisabled,
  isSubmitting,
  onSubmit,
  onSubmitAndStay,
  'data-cy': dataCy,
  submitDataCy = 'create-button',
}: DrawerShellProps) {
  const submitOnEnter = (event: React.KeyboardEvent<HTMLDivElement>) => {
    const target = event.target as HTMLElement;
    if (event.key !== 'Enter' || event.defaultPrevented || event.nativeEvent.isComposing) return;
    if (!(target instanceof HTMLInputElement) || !event.currentTarget.contains(target)) return;
    if (submitDisabled || isSubmitting) return;

    event.preventDefault();
    if (event.shiftKey && onSubmitAndStay) onSubmitAndStay();
    else onSubmit();
  };

  return (
    <div className="tw-flex tw-h-full tw-flex-col tw-bg-background-surface-layer-01" onKeyDown={submitOnEnter}>
      <header className="tw-flex tw-h-12 tw-shrink-0 tw-items-center tw-justify-between tw-gap-3 tw-border-0 tw-border-b tw-border-solid tw-border-border-weak tw-py-0 tw-pl-4 tw-pr-3">
        <div className="tw-flex tw-min-w-0 tw-flex-1 tw-items-center tw-gap-2">
          <h2 className="tw-m-0 tw-whitespace-nowrap tw-font-title-x-large tw-text-text-default" data-cy={dataCy}>
            {title}
          </h2>
          {titleAdornment}
        </div>
        <Button
          variant="ghost"
          iconOnly
          size="medium"
          aria-label="Close"
          onClick={onClose}
          data-cy="drawer-close-button"
        >
          <X />
        </Button>
      </header>
      <div
        className={cn('tw-flex tw-min-h-0 tw-flex-1 tw-flex-col tw-gap-3 tw-overflow-y-auto tw-p-4', ROCKET_SCROLLBAR)}
      >
        {children}
      </div>
      <footer className="tw-flex tw-shrink-0 tw-items-center tw-justify-between tw-gap-3 tw-border-0 tw-border-t tw-border-solid tw-border-border-weak tw-px-4 tw-py-3">
        <div className="tw-flex tw-min-w-0 tw-items-center tw-gap-1.5">{footerStart}</div>
        <div className="tw-flex tw-shrink-0 tw-items-center tw-gap-2">
          <Button variant="outline" onClick={onClose} data-cy="cancel-button">
            Cancel
          </Button>
          <Button
            variant="primary"
            trailingVisual={<CornerDownLeft />}
            disabled={submitDisabled || isSubmitting}
            loading={isSubmitting}
            onClick={onSubmit}
            data-cy={submitDataCy}
          >
            {submitLabel}
          </Button>
        </div>
      </footer>
    </div>
  );
}
