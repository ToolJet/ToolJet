import * as React from 'react';
// eslint-disable-next-line import/no-unresolved
import { Slot } from '@radix-ui/react-slot';
// eslint-disable-next-line import/no-unresolved
import { cva } from 'class-variance-authority';
import SolidIcon from '@/_ui/Icon/SolidIcons';
import PropTypes from 'prop-types';
import { cn } from '@/lib/utils';
import './button.scss';

const buttonVariants = cva('flex justify-center items-center', {
  variants: {
    variant: {
      primary:
        'text-text-on-solid bg-button-primary hover:bg-button-primary-hover active:bg-button-primary-pressed active:border-border-accent-strong disabled:bg-button-primary-disabled  border-none focus-visible:shadow-focusActive',
      secondary: ` text-text-default border-1 border-solid border-border-accent-weak bg-button-secondary hover:border-border-accent-strong hover:bg-button-secondary-hover active:bg-button-secondary-pressed active:border-border-accent-strong disabled:borer-border-default disabled:bg-button-secondary-disabled disabled:text-text-text-disabled focus-visible:border-border-accent-weak focus-visible:shadow-focusActive`,
      outline: `text-text-default border-1 border-solid border-border-default bg-button-secondary hover:border-border-default hover:bg-button-outline-hover active:bg-button-outline-pressed active:border-border-strong disabled:border-border-default disabled:bg-button-outline-disabled disabled:text-text-text-disabled focus-visible:border-border-default focus-visible:bg-button-outline focus-visible:shadow-focusActive`,
      ghostBrand:
        'text-text-accent hover:bg-button-secondary-hove active:bg-button-secondary-pressed,  focus-visible:bg-button-outline disabled:text-text-disabled focus-visible:shadow-focusActive',
      ghost:
        'text-text-default hover:bg-button-outline-hover  active:button-outline-pressed  focus-visible:bg-button-outline disabled:text-text-disabled focus-visible:shadow-focusActive',
      dangerPrimary:
        'text-text-on-solid bg-button-danger-primary hover:bg-button-danger-primary-hover active:bg-button-danger-primary-pressed disabled:bg-button-danger-primary-disabled  border-none focus-visible:shadow-focusActive',
      dangerSecondary: `text-text-default border-1 border-solid border-border-danger-weak bg-button-secondary hover:border-border-danger-strong hover:bg-button-danger-secondary-hover active:border-border-danger-strong active:bg-button-secondary-pressed disabled:borer-border-default disabled:bg-button-danger-secondary-disabled disabled:text-text-text-disabled focus-visible:border-border-danger-strong focus-visible:shadow-focusActive`,
      dangerGhost: `text-text-default bg-button-secondary hover:bg-button-danger-secondary-hover active:bg-button-secondary-pressed disabled:borer-border-default disabled:bg-button-danger-secondary-disabled disabled:text-text-text-disabled focus-visible:shadow-focusActive`,
    },
    size: {
      large: 'h-10 gap-[8px] px-[20px] py-[10px] rounded-[10px]',
      default: 'h-8 gap-[6px] px-[12px] py-7px] rounded-[8px]',
      medium: 'h-7 gap-[6px] px-[10px] py-[5px] rounded-[6px]',
      small: 'h-4 gap-[6px] px-[8px] py-[2px] rounded-[4px]',
    },
    isLoading: {
      true: 'button-loading',
    },
  },
  defaultVariants: {
    variant: 'primary',
    size: 'default',
  },
});

const getDefaultIconFillColor = (variant) => {
  switch (variant) {
    case 'primary':
    case 'dangerPrimary':
      return 'var(--icon-on-solid)';
    case 'secondary':
    case 'ghostBrand':
      return 'var(--icon-brand)';
    case 'outline':
    case 'ghost':
      return 'var(--icon-strong)';
    case 'dangerSecondary':
    case 'dangerGhost':
      return 'var(--icon-danger)';
    default:
      return '';
  }
};

const Button = React.forwardRef(
  (
    {
      className,
      variant = 'primary',
      size = 'default',
      leadingIcon,
      trailingIcon,
      isLoading,
      disabled,
      asChild = false,
      fill,
      ...props
    },
    ref
  ) => {
    const Comp = asChild ? Slot : 'button';

    const leadingIconElement = leadingIcon && (
      <SolidIcon name={'leadingIcon'} height="16" width="16" fill={fill ?? getDefaultIconFillColor(variant)} />
    );
    const trailingIconElement = trailingIcon && (
      <SolidIcon name={'trailingIcon'} height="16" width="16" fill={fill ?? getDefaultIconFillColor(variant)} />
    );

    return (
      <Comp
        className={cn(buttonVariants({ variant, size, isLoading, className }))}
        ref={ref}
        disabled={disabled}
        {...props}
      >
        {isLoading ? (
          'loading...'
        ) : (
          <>
            {leadingIconElement}
            {props.children}
            {trailingIconElement}
          </>
        )}
      </Comp>
    );
  }
);
Button.displayName = 'Button'; //debugging purposes and helpful in React Developer Tools

Button.propTypes = {
  className: PropTypes.string,
  variant: PropTypes.oneOf([
    'primary',
    'secondary',
    'outline',
    'ghostBrand',
    'ghost',
    'dangerPrimary',
    'dangerSecondary',
    'dangerGhost',
  ]),
  size: PropTypes.oneOf(['large', 'default', 'medium', 'small']),
  loading: PropTypes.bool,
  disabled: PropTypes.bool,
  asChild: PropTypes.bool,
  fill: PropTypes.string,
  leadingIcon: PropTypes.string,
  trailingIcon: PropTypes.string,
};
Button.defaultProps = {
  className: '',
  variant: 'primary',
  size: 'default',
  loading: false,
  disabled: false,
  asChild: false,
  iconOnly: false,
  fill: '',
  leadingIcon: '',
  trailingIcon: '',
};

export { Button, buttonVariants };
