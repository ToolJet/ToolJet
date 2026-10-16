// shadcn/ui display primitives for the pack: calendar, card, badge, avatar, progress, separator, skeleton, alert,
// accordion and table.
import React from 'react';
import { cva, type VariantProps } from 'class-variance-authority';
import * as AccordionPrimitive from '@radix-ui/react-accordion';
import * as AvatarPrimitive from '@radix-ui/react-avatar';
import * as ProgressPrimitive from '@radix-ui/react-progress';
import * as SeparatorPrimitive from '@radix-ui/react-separator';
import { DayPicker } from 'react-day-picker';
import { ChevronDown, ChevronLeft, ChevronRight } from 'lucide-react';
import { cn } from './cn';
import { buttonVariants } from './controls';
import { truncateText } from './truncate';

export const Calendar = ({
  className,
  classNames,
  components,
  showOutsideDays = true,
  ...props
}: React.ComponentProps<typeof DayPicker>) => (
  <DayPicker
    showOutsideDays={showOutsideDays}
    className={cn('tw-p-3', className)}
    classNames={{
      months: 'tw-relative tw-flex tw-flex-col tw-gap-4 sm:tw-flex-row',
      month: 'tw-flex tw-w-full tw-flex-col tw-gap-4',
      month_caption: 'tw-flex tw-h-7 tw-items-center tw-justify-center',
      caption_label: 'tw-text-ui2-sm tw-font-medium',
      nav: 'tw-absolute tw-inset-x-0 tw-top-0 tw-flex tw-w-full tw-items-center tw-justify-between',
      button_previous: cn(
        buttonVariants({ variant: 'outline' }),
        'tw-z-10 tw-h-7 tw-w-7 tw-bg-transparent tw-p-0 tw-opacity-60 hover:tw-opacity-100'
      ),
      button_next: cn(
        buttonVariants({ variant: 'outline' }),
        'tw-z-10 tw-h-7 tw-w-7 tw-bg-transparent tw-p-0 tw-opacity-60 hover:tw-opacity-100'
      ),
      month_grid: 'tw-w-full tw-border-collapse',
      weekdays: 'tw-flex',
      weekday: 'tw-w-8 tw-rounded-ui2-md tw-text-[0.8rem] tw-font-normal tw-text-ui2-muted-foreground',
      week: 'tw-mt-2 tw-flex tw-w-full',
      day: 'tw-relative tw-h-8 tw-w-8 tw-p-0 tw-text-center tw-text-ui2-sm',
      day_button: cn(
        buttonVariants({ variant: 'ghost' }),
        'tw-h-8 tw-w-8 tw-p-0 tw-font-normal aria-selected:tw-opacity-100'
      ),
      range_start: 'tw-rounded-l-ui2-md tw-bg-ui2-accent',
      range_middle: 'tw-bg-ui2-accent [&>button]:tw-bg-transparent [&>button]:tw-text-ui2-accent-foreground',
      range_end: 'tw-rounded-r-ui2-md tw-bg-ui2-accent',
      selected:
        '[&>button]:tw-bg-ui2-primary [&>button]:tw-text-ui2-primary-foreground [&>button]:hover:tw-bg-ui2-primary [&>button]:hover:tw-text-ui2-primary-foreground',
      today: '[&>button]:tw-bg-ui2-accent [&>button]:tw-text-ui2-accent-foreground',
      outside: 'tw-text-ui2-muted-foreground tw-opacity-50',
      disabled: 'tw-text-ui2-muted-foreground tw-opacity-50',
      hidden: 'tw-invisible',
      ...classNames,
    }}
    {...props}
    // Merged, not replaced: a widget passing its own components (the Calendar's day markers) lost these, and
    // react-day-picker's own chevron is filled black, invisible on a dark theme.
    components={{
      Chevron: ({ orientation }) =>
        orientation === 'left' ? <ChevronLeft className="tw-h-4 tw-w-4" /> : <ChevronRight className="tw-h-4 tw-w-4" />,
      ...components,
    }}
  />
);

export const Card = React.forwardRef<HTMLDivElement, React.HTMLAttributes<HTMLDivElement>>(
  ({ className, ...props }, ref) => (
    <div
      ref={ref}
      className={cn('tw-rounded-ui2-xl tw-border tw-bg-ui2-card tw-text-ui2-card-foreground tw-shadow-sm', className)}
      {...props}
    />
  )
);
Card.displayName = 'Card';

export const badgeVariants = cva(
  'tw-inline-flex tw-min-w-0 tw-max-w-full tw-items-center tw-rounded-ui2-md tw-border tw-px-2 tw-py-0.5 tw-text-xs tw-font-medium tw-whitespace-nowrap tw-transition-colors',
  {
    variants: {
      variant: {
        default: 'tw-border-transparent tw-bg-ui2-primary tw-text-ui2-primary-foreground',
        secondary: 'tw-border-transparent tw-bg-ui2-secondary tw-text-ui2-secondary-foreground',
        destructive: 'tw-border-transparent tw-bg-ui2-destructive/10 tw-text-ui2-destructive',
        success: 'tw-border-transparent tw-bg-ui2-success/10 tw-text-ui2-success',
        warning: 'tw-border-transparent tw-bg-ui2-warning/10 tw-text-ui2-warning',
        outline: 'tw-text-ui2-foreground',
      },
    },
    defaultVariants: { variant: 'default' },
  }
);
export const Badge = ({
  className,
  variant,
  children,
  ...props
}: React.HTMLAttributes<HTMLDivElement> & VariantProps<typeof badgeVariants>) => (
  <div className={cn(badgeVariants({ variant }), className)} {...props}>
    {truncateText(children)}
  </div>
);

export const Avatar = React.forwardRef<
  React.ElementRef<typeof AvatarPrimitive.Root>,
  React.ComponentPropsWithoutRef<typeof AvatarPrimitive.Root>
>(({ className, ...props }, ref) => (
  <AvatarPrimitive.Root
    ref={ref}
    className={cn('tw-relative tw-flex tw-h-8 tw-w-8 tw-shrink-0 tw-overflow-hidden tw-rounded-full', className)}
    {...props}
  />
));
Avatar.displayName = 'Avatar';
export const AvatarImage = React.forwardRef<
  React.ElementRef<typeof AvatarPrimitive.Image>,
  React.ComponentPropsWithoutRef<typeof AvatarPrimitive.Image>
>(({ className, ...props }, ref) => (
  <AvatarPrimitive.Image ref={ref} className={cn('tw-aspect-square tw-h-full tw-w-full', className)} {...props} />
));
AvatarImage.displayName = 'AvatarImage';
export const AvatarFallback = React.forwardRef<
  React.ElementRef<typeof AvatarPrimitive.Fallback>,
  React.ComponentPropsWithoutRef<typeof AvatarPrimitive.Fallback>
>(({ className, ...props }, ref) => (
  <AvatarPrimitive.Fallback
    ref={ref}
    className={cn(
      'tw-flex tw-h-full tw-w-full tw-items-center tw-justify-center tw-rounded-full tw-bg-ui2-muted tw-text-xs tw-font-medium',
      className
    )}
    {...props}
  />
));
AvatarFallback.displayName = 'AvatarFallback';

export const Progress = React.forwardRef<
  React.ElementRef<typeof ProgressPrimitive.Root>,
  React.ComponentPropsWithoutRef<typeof ProgressPrimitive.Root>
>(({ className, value, ...props }, ref) => (
  <ProgressPrimitive.Root
    ref={ref}
    className={cn(
      'tw-relative tw-h-2 tw-w-full tw-overflow-hidden tw-rounded-full tw-bg-[color:var(--lk-track,color-mix(in_srgb,var(--sc-primary)_20%,transparent))]',
      className
    )}
    value={value}
    {...props}
  >
    <ProgressPrimitive.Indicator
      className="tw-h-full tw-w-full tw-flex-1 tw-bg-ui2-primary tw-transition-all"
      style={{ transform: `translateX(-${100 - (value || 0)}%)` }}
    />
  </ProgressPrimitive.Root>
));
Progress.displayName = 'Progress';

export const Separator = React.forwardRef<
  React.ElementRef<typeof SeparatorPrimitive.Root>,
  React.ComponentPropsWithoutRef<typeof SeparatorPrimitive.Root>
>(({ className, orientation = 'horizontal', decorative = true, ...props }, ref) => (
  <SeparatorPrimitive.Root
    ref={ref}
    decorative={decorative}
    orientation={orientation}
    className={cn(
      'tw-shrink-0 tw-bg-ui2-border',
      orientation === 'horizontal' ? 'tw-h-[1px] tw-w-full' : 'tw-h-full tw-w-[1px]',
      className
    )}
    {...props}
  />
));
Separator.displayName = 'Separator';

export const Skeleton = ({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) => (
  <div className={cn('tw-animate-pulse tw-rounded-ui2-md tw-bg-ui2-primary/10', className)} {...props} />
);

const alertVariants = cva(
  'tw-relative tw-w-full tw-rounded-ui2-lg tw-border tw-px-4 tw-py-3 tw-text-ui2-sm [&>svg+div]:tw-translate-y-[-3px] [&>svg]:tw-absolute [&>svg]:tw-left-4 [&>svg]:tw-top-4 [&>svg]:tw-text-ui2-foreground [&>svg~*]:tw-pl-7',
  {
    variants: {
      variant: {
        default: 'tw-bg-ui2-background tw-text-ui2-foreground',
        destructive: 'tw-border-ui2-destructive/50 tw-text-ui2-destructive [&>svg]:tw-text-ui2-destructive',
      },
    },
    defaultVariants: { variant: 'default' },
  }
);
export const Alert = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement> & VariantProps<typeof alertVariants>
>(({ className, variant, ...props }, ref) => (
  <div ref={ref} role="alert" className={cn(alertVariants({ variant }), className)} {...props} />
));
Alert.displayName = 'Alert';
export const AlertTitle = ({ className, ...props }: React.HTMLAttributes<HTMLHeadingElement>) => (
  <h5 className={cn('tw-mb-1 tw-font-medium tw-leading-none tw-tracking-tight', className)} {...props} />
);
export const AlertDescription = ({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) => (
  <div className={cn('tw-text-ui2-sm tw-opacity-90 [&_p]:tw-leading-relaxed', className)} {...props} />
);

export const Accordion = AccordionPrimitive.Root;
export const AccordionItem = React.forwardRef<
  React.ElementRef<typeof AccordionPrimitive.Item>,
  React.ComponentPropsWithoutRef<typeof AccordionPrimitive.Item>
>(({ className, ...props }, ref) => (
  <AccordionPrimitive.Item ref={ref} className={cn('tw-border-b', className)} {...props} />
));
AccordionItem.displayName = 'AccordionItem';
export const AccordionTrigger = React.forwardRef<
  React.ElementRef<typeof AccordionPrimitive.Trigger>,
  React.ComponentPropsWithoutRef<typeof AccordionPrimitive.Trigger>
>(({ className, children, ...props }, ref) => (
  <AccordionPrimitive.Header className="tw-flex">
    <AccordionPrimitive.Trigger
      ref={ref}
      className={cn(
        'tw-flex tw-flex-1 tw-items-center tw-justify-between tw-rounded-ui2-sm tw-py-4 tw-text-left tw-text-ui2-sm tw-font-medium tw-transition-all hover:tw-underline focus-visible:tw-outline-none focus-visible:tw-ring-2 focus-visible:tw-ring-ui2-ring [&[data-state=open]>svg]:tw-rotate-180',
        className
      )}
      {...props}
    >
      {children}
      <ChevronDown className="tw-h-4 tw-w-4 tw-shrink-0 tw-text-ui2-muted-foreground tw-transition-transform tw-duration-200" />
    </AccordionPrimitive.Trigger>
  </AccordionPrimitive.Header>
));
AccordionTrigger.displayName = 'AccordionTrigger';
export const AccordionContent = React.forwardRef<
  React.ElementRef<typeof AccordionPrimitive.Content>,
  React.ComponentPropsWithoutRef<typeof AccordionPrimitive.Content>
>(({ className, children, ...props }, ref) => (
  <AccordionPrimitive.Content
    ref={ref}
    className="tw-overflow-hidden tw-text-ui2-sm data-[state=closed]:tw-animate-ui2-accordion-up data-[state=open]:tw-animate-ui2-accordion-down"
    {...props}
  >
    <div className={cn('tw-pb-4 tw-pt-0', className)}>{children}</div>
  </AccordionPrimitive.Content>
));
AccordionContent.displayName = 'AccordionContent';

export const Table = React.forwardRef<HTMLTableElement, React.HTMLAttributes<HTMLTableElement>>(
  ({ className, ...props }, ref) => (
    <div className="tw-relative tw-w-full tw-overflow-auto">
      <table ref={ref} className={cn('tw-w-full tw-caption-bottom tw-text-ui2-sm', className)} {...props} />
    </div>
  )
);
Table.displayName = 'Table';
export const TableHeader = ({ className, ...props }: React.HTMLAttributes<HTMLTableSectionElement>) => (
  <thead className={cn('[&_tr]:tw-border-b', className)} {...props} />
);
export const TableBody = ({ className, ...props }: React.HTMLAttributes<HTMLTableSectionElement>) => (
  <tbody className={cn('[&_tr:last-child]:tw-border-0', className)} {...props} />
);
export const TableRow = React.forwardRef<HTMLTableRowElement, React.HTMLAttributes<HTMLTableRowElement>>(
  ({ className, ...props }, ref) => (
    <tr
      ref={ref}
      className={cn(
        'tw-border-b tw-transition-colors hover:tw-bg-ui2-muted/50 data-[state=selected]:tw-bg-ui2-muted',
        className
      )}
      {...props}
    />
  )
);
TableRow.displayName = 'TableRow';
export const TableHead = ({ className, ...props }: React.ThHTMLAttributes<HTMLTableCellElement>) => (
  <th
    className={cn(
      'tw-h-10 tw-whitespace-nowrap tw-px-2 tw-text-left tw-align-middle tw-font-medium tw-text-ui2-muted-foreground [&:has([role=checkbox])]:tw-pr-0',
      className
    )}
    {...props}
  />
);
export const TableCell = ({ className, ...props }: React.TdHTMLAttributes<HTMLTableCellElement>) => (
  <td
    className={cn('tw-whitespace-nowrap tw-p-2 tw-align-middle [&:has([role=checkbox])]:tw-pr-0', className)}
    {...props}
  />
);
