import * as React from 'react';

import { cn } from '@/lib/utils';

function Table({ className, ...props }) {
  return (
    <div data-slot="table-container" className="tw-relative tw-w-full tw-overflow-x-auto">
      <table data-slot="table" className={cn('tw-w-full tw-caption-bottom tw-text-sm', className)} {...props} />
    </div>
  );
}

function TableHeader({ className, ...props }) {
  return <thead data-slot="table-header" className={cn('[&_tr]:tw-border-b', className)} {...props} />;
}

function TableBody({ className, ...props }) {
  return <tbody data-slot="table-body" className={cn('[&_tr:last-child]:tw-border-0', className)} {...props} />;
}

function TableFooter({ className, ...props }) {
  return (
    <tfoot
      data-slot="table-footer"
      className={cn('tw-border-t tw-bg-muted/50 tw-font-medium [&>tr]:last:tw-border-b-0', className)}
      {...props}
    />
  );
}

function TableRow({ className, ...props }) {
  return (
    <tr
      data-slot="table-row"
      className={cn(
        'tw-border-b tw-transition-colors hover:tw-bg-muted/50 has-[[aria-expanded]]:tw-bg-muted/50 data-[state=selected]:tw-bg-muted',
        className
      )}
      {...props}
    />
  );
}

function TableHead({ className, ...props }) {
  return (
    <th
      data-slot="table-head"
      className={cn(
        'tw-h-10 tw-px-2 tw-text-left tw-align-middle tw-font-medium tw-whitespace-nowrap tw-text-foreground [&:has([role=checkbox])]:tw-pr-0',
        className
      )}
      {...props}
    />
  );
}

function TableCell({ className, ...props }) {
  return (
    <td
      data-slot="table-cell"
      className={cn('tw-p-2 tw-align-middle tw-whitespace-nowrap [&:has([role=checkbox])]:tw-pr-0', className)}
      {...props}
    />
  );
}

function TableCaption({ className, ...props }) {
  return (
    <caption
      data-slot="table-caption"
      className={cn('tw-mt-4 tw-text-sm tw-text-muted-foreground', className)}
      {...props}
    />
  );
}

export { Table, TableHeader, TableBody, TableFooter, TableHead, TableRow, TableCell, TableCaption };
