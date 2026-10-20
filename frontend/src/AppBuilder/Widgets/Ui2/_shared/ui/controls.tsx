// shadcn/ui form controls for the pack: buttons, text inputs, labels, checkbox, switch, radio, slider, toggle group.
import React from 'react';
import { cva, type VariantProps } from 'class-variance-authority';
import { Slot } from '@radix-ui/react-slot';
import * as CheckboxPrimitive from '@radix-ui/react-checkbox';
import * as LabelPrimitive from '@radix-ui/react-label';
import * as RadioGroupPrimitive from '@radix-ui/react-radio-group';
import * as SliderPrimitive from '@radix-ui/react-slider';
import * as SwitchPrimitive from '@radix-ui/react-switch';
import * as ToggleGroupPrimitive from '@radix-ui/react-toggle-group';
import { Check, Circle } from 'lucide-react';
import { cn } from './cn';
import { truncateText } from './truncate';

export const buttonVariants = cva(
  'tw-inline-flex tw-min-w-0 tw-max-w-full tw-items-center tw-justify-center tw-gap-2 tw-whitespace-nowrap tw-rounded-ui2-md tw-text-ui2-sm tw-font-medium tw-transition-colors focus-visible:tw-outline-none focus-visible:tw-ring-1 focus-visible:tw-ring-ui2-ring focus-visible:tw-ring-offset-1 disabled:tw-pointer-events-none disabled:tw-opacity-50 [&_svg]:tw-pointer-events-none [&_svg]:tw-size-4 [&_svg]:tw-shrink-0',
  {
    variants: {
      variant: {
        // The strong primary, so a 14px label reads at 4.5:1; hover darkens it (fading it toward a light page fell
        // under 4.5:1 even on ToolJet's own blue).
        default:
          'tw-bg-ui2-primary-strong tw-text-ui2-primary-foreground tw-shadow-sm hover:tw-bg-[color:color-mix(in_srgb,var(--sc-primary-strong)_88%,#000)]',
        destructive:
          'tw-bg-ui2-destructive tw-text-ui2-destructive-foreground tw-shadow-sm hover:tw-bg-ui2-destructive/90',
        outline:
          'tw-border tw-border-ui2-input tw-bg-ui2-background tw-shadow-sm hover:tw-bg-ui2-accent hover:tw-text-ui2-accent-foreground',
        secondary: 'tw-bg-ui2-secondary tw-text-ui2-secondary-foreground tw-shadow-sm hover:tw-bg-ui2-secondary/80',
        ghost: 'hover:tw-bg-ui2-accent hover:tw-text-ui2-accent-foreground',
        link: 'tw-text-ui2-primary tw-underline-offset-4 hover:tw-underline',
      },
      size: {
        default: 'tw-h-9 tw-px-4 tw-py-2',
        sm: 'tw-h-8 tw-rounded-ui2-md tw-px-3 tw-text-xs',
        lg: 'tw-h-10 tw-rounded-ui2-md tw-px-8',
        icon: 'tw-h-9 tw-w-9',
      },
    },
    defaultVariants: { variant: 'default', size: 'default' },
  }
);

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  asChild?: boolean;
}

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, asChild = false, children, ...props }, ref) => {
    const Comp = asChild ? Slot : 'button';
    return (
      <Comp className={cn(buttonVariants({ variant, size, className }))} ref={ref} {...props}>
        {asChild ? children : truncateText(children)}
      </Comp>
    );
  }
);
Button.displayName = 'Button';

export const Input = React.forwardRef<HTMLInputElement, React.InputHTMLAttributes<HTMLInputElement>>(
  ({ className, type, ...props }, ref) => (
    <input
      type={type}
      className={cn(
        'tw-flex tw-h-9 tw-w-full tw-rounded-ui2-md tw-border tw-border-ui2-input tw-bg-transparent tw-px-3 tw-py-1 tw-text-ui2-sm tw-shadow-sm tw-transition-colors placeholder:tw-text-ui2-muted-foreground focus-visible:tw-outline-none focus-visible:tw-ring-1 focus-visible:tw-ring-ui2-ring disabled:tw-cursor-not-allowed disabled:tw-opacity-50',
        className
      )}
      ref={ref}
      {...props}
    />
  )
);
Input.displayName = 'Input';

export const Textarea = React.forwardRef<HTMLTextAreaElement, React.TextareaHTMLAttributes<HTMLTextAreaElement>>(
  ({ className, ...props }, ref) => (
    <textarea
      className={cn(
        'tw-flex tw-min-h-[60px] tw-w-full tw-rounded-ui2-md tw-border tw-border-ui2-input tw-bg-transparent tw-px-3 tw-py-2 tw-text-ui2-sm tw-shadow-sm placeholder:tw-text-ui2-muted-foreground focus-visible:tw-outline-none focus-visible:tw-ring-1 focus-visible:tw-ring-ui2-ring disabled:tw-cursor-not-allowed disabled:tw-opacity-50',
        className
      )}
      ref={ref}
      {...props}
    />
  )
);
Textarea.displayName = 'Textarea';

export const Label = React.forwardRef<
  React.ElementRef<typeof LabelPrimitive.Root>,
  React.ComponentPropsWithoutRef<typeof LabelPrimitive.Root>
>(({ className, ...props }, ref) => (
  <LabelPrimitive.Root
    ref={ref}
    className={cn(
      'tw-text-ui2-sm tw-font-medium tw-leading-none peer-disabled:tw-cursor-not-allowed peer-disabled:tw-opacity-70',
      className
    )}
    {...props}
  />
));
Label.displayName = 'Label';

// Checkbox and radio items are buttons: p-0 keeps ToolJet's global button padding from squeezing their indicator.
export const Checkbox = React.forwardRef<
  React.ElementRef<typeof CheckboxPrimitive.Root>,
  React.ComponentPropsWithoutRef<typeof CheckboxPrimitive.Root>
>(({ className, ...props }, ref) => (
  <CheckboxPrimitive.Root
    ref={ref}
    className={cn(
      'tw-peer tw-h-4 tw-w-4 tw-shrink-0 tw-rounded-ui2-xs tw-border tw-border-ui2-primary tw-p-0 tw-shadow focus-visible:tw-outline-none focus-visible:tw-ring-1 focus-visible:tw-ring-ui2-ring disabled:tw-cursor-not-allowed disabled:tw-opacity-50 data-[state=checked]:tw-bg-ui2-primary data-[state=checked]:tw-text-ui2-primary-foreground',
      className
    )}
    {...props}
  >
    <CheckboxPrimitive.Indicator className="tw-flex tw-items-center tw-justify-center tw-text-current">
      <Check className="tw-h-4 tw-w-4" />
    </CheckboxPrimitive.Indicator>
  </CheckboxPrimitive.Root>
));
Checkbox.displayName = 'Checkbox';

export const Switch = React.forwardRef<
  React.ElementRef<typeof SwitchPrimitive.Root>,
  React.ComponentPropsWithoutRef<typeof SwitchPrimitive.Root>
>(({ className, ...props }, ref) => (
  <SwitchPrimitive.Root
    className={cn(
      'tw-peer tw-inline-flex tw-h-5 tw-w-9 tw-shrink-0 tw-cursor-pointer tw-items-center tw-rounded-full tw-border-2 tw-border-transparent tw-shadow-sm tw-transition-colors focus-visible:tw-outline-none focus-visible:tw-ring-2 focus-visible:tw-ring-ui2-ring disabled:tw-cursor-not-allowed disabled:tw-opacity-50 data-[state=checked]:tw-bg-ui2-primary data-[state=unchecked]:tw-bg-ui2-input',
      className
    )}
    {...props}
    ref={ref}
  >
    <SwitchPrimitive.Thumb className="tw-pointer-events-none tw-block tw-h-4 tw-w-4 tw-rounded-full tw-bg-ui2-background tw-shadow-lg tw-ring-0 tw-transition-transform data-[state=checked]:tw-translate-x-4 data-[state=unchecked]:tw-translate-x-0" />
  </SwitchPrimitive.Root>
));
Switch.displayName = 'Switch';

export const RadioGroup = React.forwardRef<
  React.ElementRef<typeof RadioGroupPrimitive.Root>,
  React.ComponentPropsWithoutRef<typeof RadioGroupPrimitive.Root>
>(({ className, ...props }, ref) => (
  <RadioGroupPrimitive.Root className={cn('tw-grid tw-gap-2', className)} {...props} ref={ref} />
));
RadioGroup.displayName = 'RadioGroup';

export const RadioGroupItem = React.forwardRef<
  React.ElementRef<typeof RadioGroupPrimitive.Item>,
  React.ComponentPropsWithoutRef<typeof RadioGroupPrimitive.Item>
>(({ className, ...props }, ref) => (
  <RadioGroupPrimitive.Item
    ref={ref}
    className={cn(
      'tw-aspect-square tw-h-4 tw-w-4 tw-rounded-full tw-border tw-border-ui2-primary tw-p-0 tw-text-ui2-primary tw-shadow focus:tw-outline-none focus-visible:tw-ring-1 focus-visible:tw-ring-ui2-ring disabled:tw-cursor-not-allowed disabled:tw-opacity-50',
      className
    )}
    {...props}
  >
    <RadioGroupPrimitive.Indicator className="tw-flex tw-items-center tw-justify-center">
      <Circle className="tw-h-2.5 tw-w-2.5 tw-fill-ui2-primary" />
    </RadioGroupPrimitive.Indicator>
  </RadioGroupPrimitive.Item>
));
RadioGroupItem.displayName = 'RadioGroupItem';

// Slider and progress tracks read the pack's trackColor style (--lk-track), else a tint of primary as upstream.
export const Slider = React.forwardRef<
  React.ElementRef<typeof SliderPrimitive.Root>,
  React.ComponentPropsWithoutRef<typeof SliderPrimitive.Root> & { thumbLabel?: string }
>(({ className, thumbLabel, ...props }, ref) => (
  <SliderPrimitive.Root
    ref={ref}
    className={cn('tw-relative tw-flex tw-w-full tw-touch-none tw-select-none tw-items-center', className)}
    {...props}
  >
    <SliderPrimitive.Track className="tw-relative tw-h-1.5 tw-w-full tw-grow tw-overflow-hidden tw-rounded-full tw-bg-[color:var(--lk-track,color-mix(in_srgb,var(--sc-primary)_20%,transparent))]">
      <SliderPrimitive.Range className="tw-absolute tw-h-full tw-bg-ui2-primary" />
    </SliderPrimitive.Track>
    {(props.value ?? props.defaultValue ?? [0]).map((_, i) => (
      <SliderPrimitive.Thumb
        key={i}
        aria-label={thumbLabel}
        className="tw-block tw-h-4 tw-w-4 tw-rounded-full tw-border tw-border-ui2-primary/50 tw-bg-ui2-background tw-shadow tw-transition-colors focus-visible:tw-outline-none focus-visible:tw-ring-1 focus-visible:tw-ring-ui2-ring disabled:tw-pointer-events-none disabled:tw-opacity-50"
      />
    ))}
  </SliderPrimitive.Root>
));
Slider.displayName = 'Slider';

export const ToggleGroup = React.forwardRef<
  React.ElementRef<typeof ToggleGroupPrimitive.Root>,
  React.ComponentPropsWithoutRef<typeof ToggleGroupPrimitive.Root>
>(({ className, ...props }, ref) => (
  <ToggleGroupPrimitive.Root
    ref={ref}
    className={cn(
      // h-9 like the input, select and button, so a segmented control sits flush beside a field in a filter row
      // (sized by its items it was 34px against the fields' 36px).
      'tw-inline-flex tw-h-9 tw-items-center tw-rounded-ui2-lg tw-bg-ui2-muted tw-p-[3px] tw-text-ui2-muted-foreground',
      className
    )}
    {...props}
  />
));
ToggleGroup.displayName = 'ToggleGroup';
export const ToggleGroupItem = React.forwardRef<
  React.ElementRef<typeof ToggleGroupPrimitive.Item>,
  React.ComponentPropsWithoutRef<typeof ToggleGroupPrimitive.Item>
>(({ className, ...props }, ref) => (
  <ToggleGroupPrimitive.Item
    ref={ref}
    className={cn(
      'tw-inline-flex tw-h-[calc(100%-1px)] tw-flex-1 tw-items-center tw-justify-center tw-whitespace-nowrap tw-rounded-ui2-md tw-px-3 tw-py-1 tw-text-ui2-sm tw-font-medium tw-transition-all focus-visible:tw-outline-none focus-visible:tw-ring-1 focus-visible:tw-ring-ui2-ring disabled:tw-pointer-events-none disabled:tw-opacity-50 data-[state=on]:tw-bg-ui2-background data-[state=on]:tw-text-ui2-foreground data-[state=on]:tw-shadow-sm',
      className
    )}
    {...props}
  />
));
ToggleGroupItem.displayName = 'ToggleGroupItem';
