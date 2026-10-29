import React, { forwardRef } from 'react';
import PropTypes from 'prop-types';
import { cva } from 'class-variance-authority';
import { cn } from '@/lib/utils';
import { Loader2 } from 'lucide-react';

const spinnerVariants = cva(['tw-animate-spin tw-text-icon-default tw-shrink-0'], {
  variants: {
    size: {
      large: 'tw-size-6',
      default: 'tw-size-4',
      small: 'tw-size-3',
    },
  },
  defaultVariants: { size: 'default' },
});

const Spinner = forwardRef(function Spinner({ className, size, label = 'Loading', ...props }, ref) {
  return (
    <Loader2
      ref={ref}
      role="status"
      aria-label={label}
      className={cn(spinnerVariants({ size }), className)}
      {...props}
    />
  );
});

Spinner.displayName = 'Spinner';

Spinner.propTypes = {
  size: PropTypes.oneOf(['large', 'default', 'small']),
  label: PropTypes.string,
  className: PropTypes.string,
};

export { Spinner, spinnerVariants };
