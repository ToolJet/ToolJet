import React, { forwardRef } from 'react';
import PropTypes from 'prop-types';
import { cva } from 'class-variance-authority';
import { cn } from '@/lib/utils';
import { Label as ShadcnLabel } from '@/components/ui/Rocket/shadcn/label';

const labelVariants = cva(
  [
    'tw-font-medium tw-leading-none',
    'tw-pl-0.5',
    'peer-disabled:tw-cursor-not-allowed peer-disabled:tw-opacity-70',
  ],
  {
    variants: {
      size: {
        sm: 'tw-text-xs tw-leading-[18px]',
        default: 'tw-text-[13px] tw-leading-[18px]',
        lg: 'tw-text-sm tw-leading-5',
      },
    },
    defaultVariants: { size: 'default' },
  }
);

const Label = forwardRef(function Label(
  { className, size, required, disabled, children, ...props },
  ref
) {
  return (
    <ShadcnLabel
      ref={ref}
      className={cn(
        labelVariants({ size }),
        disabled ? 'tw-text-text-disabled' : 'tw-text-text-default',
        className
      )}
      {...props}
    >
      {children}
      {required && (
        <span
          className={cn(
            'tw-ml-0.5',
            disabled ? 'tw-text-text-disabled' : 'tw-text-text-danger'
          )}
          aria-hidden="true"
        >
          *
        </span>
      )}
    </ShadcnLabel>
  );
});

Label.displayName = 'Label';

Label.propTypes = {
  size: PropTypes.oneOf(['sm', 'default', 'lg']),
  required: PropTypes.bool,
  disabled: PropTypes.bool,
  className: PropTypes.string,
  children: PropTypes.node,
};

export { Label, labelVariants };
