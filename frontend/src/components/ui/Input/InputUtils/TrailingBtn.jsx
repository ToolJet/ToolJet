import React from 'react';
import { Button } from '../../Button/Button';
import { cn } from '@/lib/utils';
import { TRAILING_BUTTON_SCALE } from './Variants';
import { getButtonSizeForInput } from './InputUtils';

const TrailingBtn = ({ size, type, className, disabled, ...restProps }) => {
  return (
    <Button
      disabled={disabled}
      fill={type === 'loading' ? '#3E63DD' : disabled ? 'var(--icon-disabled)' : 'var(--icon-default)'}
      iconOnly
      isLoading={type === 'loading'}
      leadingIcon="removerectangle"
      variant="ghost"
      className={cn(TRAILING_BUTTON_SCALE, className)}
      size={getButtonSizeForInput(size)}
      {...restProps}
    />
  );
};

export default TrailingBtn;
