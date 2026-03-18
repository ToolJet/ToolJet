import React, { forwardRef, createContext, useContext } from 'react';
import PropTypes from 'prop-types';
import { cva } from 'class-variance-authority';
import { cn } from '@/lib/utils';
import {
  ToggleGroup as ShadcnToggleGroup,
  ToggleGroupItem as ShadcnToggleGroupItem,
} from '@/components/ui/Rocket/shadcn/toggle-group';
import { toggleBaseClasses } from '../Toggle/Toggle';

const ToggleGroupContext = createContext({ size: 'default' });

const toggleGroupClasses = 'tw-inline-flex tw-items-center tw-bg-interactive-default tw-p-0.5 tw-rounded-md';

const toggleGroupItemVariants = cva(
  [
    ...toggleBaseClasses,
    'tw-gap-1 tw-rounded-[5px]',
    'tw-bg-transparent tw-text-text-disabled',
    'hover:tw-bg-transparent', // override shadcn's hover:tw-bg-muted
    'data-[state=on]:tw-bg-background-surface-layer-01 data-[state=on]:tw-text-text-default data-[state=on]:tw-shadow-elevation-100',
  ],
  {
    variants: {
      size: {
        large: 'tw-h-9 tw-px-2.5 tw-text-lg',
        default: 'tw-h-7 tw-px-1.5 tw-text-base',
        medium: 'tw-h-6 tw-px-1.5 tw-text-base',
        small: 'tw-h-5 tw-px-1 tw-text-sm',
      },
    },
    defaultVariants: { size: 'default' },
  }
);

const ToggleGroup = forwardRef(function ToggleGroup({ className, size = 'default', children, ...props }, ref) {
  return (
    <ShadcnToggleGroup ref={ref} className={cn(toggleGroupClasses, className)} {...props}>
      <ToggleGroupContext.Provider value={{ size }}>{children}</ToggleGroupContext.Provider>
    </ShadcnToggleGroup>
  );
});

ToggleGroup.displayName = 'ToggleGroup';

ToggleGroup.propTypes = {
  type: PropTypes.oneOf(['single', 'multiple']).isRequired,
  size: PropTypes.oneOf(['large', 'default', 'medium', 'small']),
  value: PropTypes.oneOfType([PropTypes.string, PropTypes.arrayOf(PropTypes.string)]),
  defaultValue: PropTypes.oneOfType([PropTypes.string, PropTypes.arrayOf(PropTypes.string)]),
  onValueChange: PropTypes.func,
  disabled: PropTypes.bool,
  className: PropTypes.string,
};

const ToggleGroupItem = forwardRef(function ToggleGroupItem({ className, size, children, ...props }, ref) {
  const context = useContext(ToggleGroupContext);

  return (
    <ShadcnToggleGroupItem
      ref={ref}
      className={cn(toggleGroupItemVariants({ size: size || context.size }), className)}
      {...props}
    >
      {children}
    </ShadcnToggleGroupItem>
  );
});

ToggleGroupItem.displayName = 'ToggleGroupItem';

ToggleGroupItem.propTypes = {
  value: PropTypes.string.isRequired,
  size: PropTypes.oneOf(['large', 'default', 'medium', 'small']),
  disabled: PropTypes.bool,
  className: PropTypes.string,
  children: PropTypes.node,
};

export { ToggleGroup, ToggleGroupItem, toggleGroupClasses, toggleGroupItemVariants };
