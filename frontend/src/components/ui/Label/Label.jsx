import * as React from 'react';
// eslint-disable-next-line import/no-unresolved
import * as LabelPrimitive from '@radix-ui/react-label';
// eslint-disable-next-line import/no-unresolved
import { cva } from 'class-variance-authority';
import { cn } from '@/lib/utils';

const labelVariants = cva('peer-disabled:tw-cursor-not-allowed peer-disabled:tw-opacity-70', {
  variants: {
    type: {
      label: `tw-text-text-default`,
      helper: `tw-text-text-placeholder`,
    },
  },
  compoundVariants: [
    {
      type: 'label',
      size: 'default',
      className: 'tw-text-[12px]/[18px]',
    },
    {
      type: 'label',
      size: 'large',
      className: 'tw-text-[14px]/[20px]',
    },
    {
      type: 'helper',
      size: 'default',
      className: 'tw-text-[11px]/[16px]',
    },
    {
      type: 'helper',
      size: 'large',
      className: 'tw-text-[12px]/[18px]',
    },
  ],
});

const Label = React.forwardRef(({ className, size, type, ...restProps }, ref) => (
  <LabelPrimitive.Root ref={ref} className={cn(labelVariants({ type, size }), className)} {...restProps} />
));
Label.displayName = LabelPrimitive.Root.displayName;

export { Label };
