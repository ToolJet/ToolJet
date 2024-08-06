// eslint-disable-next-line import/no-unresolved
import { cva } from 'class-variance-authority';

export const buttonVariants = cva('tw-flex tw-justify-center tw-items-center tw-font-medium', {
  variants: {
    variant: {
      primary: `tw-border-none tw-bg-button-primary tw-shadow-[0px_1px_0px_0px_rgba(0,0,0,0.10)] tw-text-text-on-solid hover:tw-bg-button-primary-hover hover:tw-shadow-none active:tw-bg-button-primary-pressed active:tw-shadow-none focus-visible:tw-shadow-[inset_0_0_0_2px_var(--interactive-focus-inner-shadow,_#FFF),_0_0_0_2px_var(--interactive-focus-outline,_#4368E3)] focus-visible:tw-outline-none disabled:tw-bg-button-primary-disabled disabled:tw-shadow-none`,
      secondary: `tw-border tw-border-solid tw-border-border-accent-weak tw-bg-button-secondary tw-shadow-[0px_1px_0px_0px_rgba(0,0,0,0.10)] tw-text-text-default hover:tw-border-border-accent-strong hover:tw-shadow-none hover:tw-bg-button-secondary-hover active:tw-bg-button-secondary-pressed active:tw-border-border-accent-strong active:tw-shadow-none focus-visible:tw-bg-button-secondary focus-visible:tw-outline-none focus-visible:tw-shadow-[0_0_0_2px_var(--Interactive-focusActive,_#4368E3)] disabled:tw-border-border-default disabled:tw-bg-button-secondary-disabled disabled:tw-text-text-disabled`,
      outline: `tw-border tw-border-solid tw-border-border-default tw-bg-button-secondary tw-shadow-[0px_1px_0px_0px_rgba(0,0,0,0.10)] tw-text-text-default hover:tw-border-border-strong hover:tw-bg-button-outline-hover hover:tw-shadow-none active:tw-bg-button-outline-pressed active:tw-border-border-strong active:tw-shadow-none focus-visible:tw-bg-button-outline focus-visible:tw-outline-none focus-visible:tw-shadow-[0_0_0_2px_var(--Interactive-focusActive,_#4368E3)] disabled:tw-bg-button-outline-disabled disabled:tw-text-text-disabled disabled:tw-shadow-none`,
      ghost: `tw-border-none tw-bg-transparent tw-text-text-default hover:tw-bg-button-outline-hover active:tw-bg-button-outline-pressed focus-visible:tw-bg-button-outline focus-visible:tw-outline-none focus-visible:tw-shadow-[0_0_0_2px_var(--Interactive-focusActive,_#4368E3)] disabled:tw-text-text-disabled`,
      ghostBrand: `tw-border-none tw-bg-transparent tw-text-text-accent hover:tw-bg-button-secondary-hover active:tw-bg-button-secondary-pressed focus-visible:tw-bg-button-secondary focus-visible:tw-shadow-[0_0_0_2px_var(--Interactive-focusActive,_#4368E3)] disabled:tw-text-text-disabled`,
      dangerPrimary: `tw-border-none tw-bg-button-danger-primary tw-shadow-[0px_1px_0px_0px_rgba(0,0,0,0.10)] tw-text-text-on-solid hover:tw-bg-button-danger-primary-hover hover:tw-shadow-none active:tw-bg-button-danger-primary-pressed active:tw-shadow-none focus-visible:tw-outline-none focus-visible:tw-bg-button-danger-primary focus-visible:tw-shadow-[inset_0_0_0_2px_var(--interactive-focus-inner-shadow,_#FFF),_0_0_0_2px_var(--interactive-focus-outline,_#4368E3)] disabled:tw-bg-button-danger-primary-disabled disabled:tw-shadow-none`,
      dangerSecondary: `tw-border tw-border-solid tw-border-border-danger-weak tw-bg-button-secondary tw-shadow-[0px_1px_0px_0px_rgba(0,0,0,0.10)] tw-text-text-default hover:tw-border-border-danger-strong hover:tw-bg-button-danger-secondary-hover hover:tw-shadow-none active:tw-border-border-danger-strong active:tw-bg-button-danger-secondary-pressed active:tw-shadow-none focus-visible:tw-border-border-danger-weak focus-visible:tw-bg-button-danger-secondary focus-visible:tw-outline-none focus-visible:tw-shadow-[0_0_0_2px_var(--Interactive-focusActive,_#4368E3)] disabled:tw-border-border-default disabled:tw-bg-button-danger-secondary-disabled disabled:tw-text-text-disabled disabled:tw-shadow-none`,
    },
    size: {
      large: `tw-h-[40px] tw-gap-[8px] tw-py-[10px] tw-rounded-[10px] tw-text-[14px]/[20px]`,
      default: `tw-h-[32px] tw-gap-[6px] tw-py-[7px] tw-rounded-[8px] tw-text-[12px]/[18px]`,
      medium: `tw-h-[28px] tw-gap-[6px] tw-py-[5px] tw-rounded-[6px] tw-text-[12px]/[18px]`,
      small: `tw-h-[20px] tw-gap-[4px] tw-py-[2px] tw-rounded-[4px] tw-text-[11px]/[16px]`,
    },
  },

  compoundVariants: [
    {
      iconOnly: true,
      size: 'large',
      className: 'tw-w-[40px] tw-px-[10px]',
    },
    {
      iconOnly: true,
      size: 'default',
      className: 'tw-w-[32px] tw-px-[7px]',
    },
    {
      iconOnly: true,
      size: 'medium',
      className: 'tw-w-[28px] tw-px-[5px]',
    },
    {
      iconOnly: true,
      size: 'small',
      className: 'tw-w-[20px] tw-px-[2px]',
    },
    {
      iconOnly: false,
      size: 'large',
      className: 'tw-px-[20px]',
    },
    {
      iconOnly: false,
      size: 'default',
      className: 'tw-px-[12px]',
    },
    {
      iconOnly: false,
      size: 'medium',
      className: 'tw-px-[10px]',
    },
    {
      iconOnly: false,
      size: 'small',
      className: 'tw-px-[8px]',
    },
  ],

  defaultVariants: {
    variant: 'primary',
    size: 'default',
    iconOnly: false,
  },
});
