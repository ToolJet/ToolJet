import React, { forwardRef } from 'react';
import { cn } from '@/lib/utils';
import './Button.scss';
import {
  getDefaultIconFillColor,
  defaultButtonFillColour,
  LeadingIcon,
  TrailingIcon,
  Loading,
} from './ButtonUtils/ButtonUtils.jsx';
import { buttonVariants } from './ButtonUtils/ButtonVariants';

const Button = forwardRef(({ className, variant, size, fill = '', iconOnly = false, ...props }, ref) => {
  const iconFillColor = !defaultButtonFillColour.includes(fill) && fill ? fill : getDefaultIconFillColor(variant);

  return (
    <button className={cn(buttonVariants({ variant, size, iconOnly }), className)} ref={ref} {...props}>
      {props.isLoading ? (
        <Loading fill={iconFillColor} size={size}>
          {props.children}
        </Loading>
      ) : (
        <>
          {props.leadingIcon && <LeadingIcon leadingIcon={props.leadingIcon} size={size} fill={iconFillColor} />}
          {props.children}
          {props.trailingIcon && <TrailingIcon trailingIcon={props.trailingIcon} size={size} fill={iconFillColor} />}
        </>
      )}
    </button>
  );
});
Button.displayName = 'Button';

export { Button };