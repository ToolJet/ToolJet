import React from 'react';
import PropTypes from 'prop-types';
import { cn } from '@/lib/utils';
import {
  Field as ShadcnField,
  FieldLabel as ShadcnFieldLabel,
  FieldDescription as ShadcnFieldDescription,
  FieldError as ShadcnFieldError,
  FieldGroup as ShadcnFieldGroup,
  // Re-exported unchanged
  FieldContent,
  FieldSet,
  FieldLegend,
  FieldTitle,
  FieldSeparator,
} from '@/components/ui/Rocket/shadcn/field';

// ── Wrapped sub-components (token overrides) ──────────────────────────────

function Field({ className, ...props }) {
  return <ShadcnField className={cn('tw-gap-1.5', className)} {...props} />;
}
Field.displayName = 'Field';
Field.propTypes = {
  orientation: PropTypes.oneOf(['vertical', 'horizontal', 'responsive']),
  className: PropTypes.string,
};

function FieldLabel({ className, ...props }) {
  return (
    <ShadcnFieldLabel
      className={cn('tw-font-title-default tw-text-text-default tw-font-medium', className)}
      {...props}
    />
  );
}
FieldLabel.displayName = 'FieldLabel';

function FieldDescription({ className, ...props }) {
  return (
    <ShadcnFieldDescription
      className={cn('tw-font-body-small tw-text-text-placeholder tw-mb-0', className)}
      {...props}
    />
  );
}
FieldDescription.displayName = 'FieldDescription';

function FieldError({ className, ...props }) {
  return <ShadcnFieldError className={cn('tw-font-body-small tw-text-text-danger tw-mb-0', className)} {...props} />;
}
FieldError.displayName = 'FieldError';

function FieldGroup({ className, ...props }) {
  return <ShadcnFieldGroup className={cn(className)} {...props} />;
}
FieldGroup.displayName = 'FieldGroup';

// ── Exports ───────────────────────────────────────────────────────────────

export {
  Field,
  FieldLabel,
  FieldDescription,
  FieldError,
  FieldGroup,
  // Re-exports from shadcn (structural, no token overrides)
  FieldContent,
  FieldSet,
  FieldLegend,
  FieldTitle,
  FieldSeparator,
};
