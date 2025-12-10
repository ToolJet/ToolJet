import React, { useMemo } from 'react';
import { cva } from 'class-variance-authority';

import { cn } from '@/lib/utils';
import { Label } from '@/components/ui/Rocket/label';
import { Separator } from '@/components/ui/Rocket/separator';

function FieldSet({ className, ...props }) {
  return (
    <fieldset
      data-slot="field-set"
      className={cn(
        'tw-flex tw-flex-col tw-gap-6',
        'has-[>[data-slot=checkbox-group]]:tw-gap-3 has-[>[data-slot=radio-group]]:tw-gap-3',
        className
      )}
      {...props}
    />
  );
}

function FieldLegend({ className, variant = 'legend', ...props }) {
  return (
    <legend
      data-slot="field-legend"
      data-variant={variant}
      className={cn(
        'tw-mb-3 tw-font-medium',
        'data-[variant=legend]:tw-text-base',
        'data-[variant=label]:tw-text-sm',
        className
      )}
      {...props}
    />
  );
}

function FieldGroup({ className, ...props }) {
  return (
    <div
      data-slot="field-group"
      className={cn(
        'tw-group/field-group @container/field-group tw-flex tw-w-full tw-flex-col tw-gap-7 data-[slot=checkbox-group]:tw-gap-3 [&>[data-slot=field-group]]:tw-gap-4',
        className
      )}
      {...props}
    />
  );
}

const fieldVariants = cva('tw-group/field data-[invalid=true]:tw-text-destructive tw-flex tw-w-full tw-gap-1', {
  variants: {
    orientation: {
      vertical: ['tw-flex-col [&>*]:tw-w-full [&>.sr-only]:tw-w-auto'],
      horizontal: [
        'tw-flex-row tw-items-center',
        '[&>[data-slot=field-label]]:tw-flex-auto',
        'has-[>[data-slot=field-content]]:[&>[role=checkbox],[role=radio]]:tw-mt-px has-[>[data-slot=field-content]]:tw-items-start',
      ],
      responsive: [
        '@md/field-group:tw-flex-row @md/field-group:tw-items-center @md/field-group:[&>*]:tw-w-auto tw-flex-col [&>*]:tw-w-full [&>.sr-only]:tw-w-auto',
        '@md/field-group:[&>[data-slot=field-label]]:tw-flex-auto',
        '@md/field-group:has-[>[data-slot=field-content]]:tw-items-start @md/field-group:has-[>[data-slot=field-content]]:[&>[role=checkbox],[role=radio]]:tw-mt-px',
      ],
    },
  },
  defaultVariants: {
    orientation: 'vertical',
  },
});

function Field({ className, orientation = 'vertical', ...props }) {
  return (
    <div
      role="group"
      data-slot="field"
      data-orientation={orientation}
      className={cn(fieldVariants({ orientation }), className)}
      {...props}
    />
  );
}

function FieldContent({ className, ...props }) {
  return (
    <div
      data-slot="field-content"
      className={cn('tw-group/field-content tw-flex tw-flex-1 tw-flex-col tw-gap-1.5 tw-leading-snug', className)}
      {...props}
    />
  );
}

function FieldLabel({ className, ...props }) {
  return (
    <Label
      data-slot="field-label"
      className={cn(
        'tw-group/field-label tw-peer/field-label tw-flex tw-w-fit tw-gap-2 tw-leading-snug tw-group-data-[disabled=true]/field:opacity-50',
        'has-[>[data-slot=field]]:tw-w-full has-[>[data-slot=field]]:tw-flex-col has-[>[data-slot=field]]:tw-rounded-md has-[>[data-slot=field]]:tw-border [&>[data-slot=field]]:tw-p-4',
        'has-data-[state=checked]:tw-bg-primary has-data-[state=checked]:tw-border-primary dark:has-data-[state=checked]:tw-bg-primary',
        className
      )}
      {...props}
    />
  );
}

function FieldTitle({ className, ...props }) {
  return (
    <div
      data-slot="field-label"
      className={cn(
        'tw-flex tw-w-fit tw-items-center tw-gap-2 tw-text-sm tw-font-medium tw-leading-snug group-data-[disabled=true]/field:opacity-50',
        className
      )}
      {...props}
    />
  );
}

function FieldDescription({ className, ...props }) {
  return (
    <p
      data-slot="field-description"
      className={cn(
        'tw-text-muted-foreground tw-text-sm tw-font-normal tw-leading-normal group-has-[[data-orientation=horizontal]]/field:tw-text-balance',
        'nth-last-2:-tw-mt-1 last:tw-mt-0 [[data-variant=legend]+&]:-tw-mt-1.5',
        '[&>a:hover]:tw-text-primary [&>a]:tw-underline [&>a]:tw-underline-offset-4',
        className
      )}
      {...props}
    />
  );
}

function FieldSeparator({ children, className, ...props }) {
  return (
    <div
      data-slot="field-separator"
      data-content={!!children}
      className={cn(
        'tw-relative -tw-my-2 tw-h-5 tw-text-sm group-data-[variant=outline]/field-group:-tw-mb-2',
        className
      )}
      {...props}
    >
      <Separator className="tw-absolute tw-inset-0 tw-top-1/2" />
      {children && (
        <span
          className="tw-bg-background tw-text-muted-foreground tw-relative tw-mx-auto tw-block tw-w-fit tw-px-2"
          data-slot="field-separator-content"
        >
          {children}
        </span>
      )}
    </div>
  );
}

function FieldError({ className, children, errors, ...props }) {
  const content = useMemo(() => {
    if (children) {
      return children;
    }

    if (!errors) {
      return null;
    }

    if (errors?.length === 1 && errors[0]?.message) {
      return errors[0].message;
    }

    return (
      <ul className="tw-ml-4 tw-flex tw-list-disc tw-flex-col tw-gap-1">
        {errors.map((error, index) => error?.message && <li key={index}>{error.message}</li>)}
      </ul>
    );
  }, [children, errors]);

  if (!content) {
    return null;
  }

  return (
    <div
      role="alert"
      data-slot="field-error"
      className={cn('tw-text-destructive tw-text-sm tw-font-normal', className)}
      {...props}
    >
      {content}
    </div>
  );
}

export {
  Field,
  FieldLabel,
  FieldDescription,
  FieldError,
  FieldGroup,
  FieldLegend,
  FieldSeparator,
  FieldSet,
  FieldContent,
  FieldTitle,
};
