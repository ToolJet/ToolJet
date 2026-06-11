import React from 'react';
import { Button } from '../../Button/Button';
import { cn } from '@/lib/utils';
// eslint-disable-next-line import/no-unresolved
import { cva } from 'class-variance-authority';

const iconVariants = cva('!tw-rounded-[6px]', {
  variants: {
    size: {
      small: `!tw-h-[18px] !tw-px-[2px] !tw-py-[2px] !tw-w-[18px]`,
      medium: `!tw-h-[24px] !tw-px-[4px] !tw-py-[4px] !tw-w-[24px]`,
      large: `!tw-h-[32px] !tw-px-[8px] !tw-py-[8px] !tw-w-[32px]`,
    },
  },
  defaultVariants: {
    size: 'medium',
  },
});

const TrailingBtn = ({ size, type, className, disabled, ...restProps }) => {
  return (
    <Button
      disabled={disabled}
      fill={type === 'loading' ? '#3E63DD' : disabled ? 'var(--icon-disabled)' : 'var(--icon-default)'}
      iconOnly
      isLoading={type === 'loading' ? true : false}
      leadingIcon="removerectangle"
      variant="ghost"
      className={cn(iconVariants({ size }), className)}
      size="default"
      {...restProps}
    />
  );
};

export default TrailingBtn;
