import * as React from 'react';
import { DayPicker, getDefaultClassNames } from 'react-day-picker';
import { ChevronLeftIcon, ChevronRightIcon, ChevronDownIcon } from 'lucide-react';

import { cn } from '@/lib/utils';
import { Button, buttonVariants } from '@/components/ui/Rocket/shadcn/button';

function Calendar({
  className,
  classNames,
  showOutsideDays = true,
  captionLayout = 'label',
  buttonVariant = 'ghost',
  locale,
  formatters,
  components,
  ...props
}) {
  const defaultClassNames = getDefaultClassNames();

  return (
    <DayPicker
      showOutsideDays={showOutsideDays}
      className={cn(
        'tw-group/calendar tw-bg-background tw-p-2 [--cell-radius:0.375rem] [--cell-size:1.75rem] [[data-slot=card-content]_&]:tw-bg-transparent [[data-slot=popover-content]_&]:tw-bg-transparent',
        String.raw`rtl:[&_.rdp-button\_next>svg]:tw-rotate-180`,
        String.raw`rtl:[&_.rdp-button\_previous>svg]:tw-rotate-180`,
        className
      )}
      captionLayout={captionLayout}
      locale={locale}
      formatters={{
        formatMonthDropdown: (date) => date.toLocaleString(locale?.code, { month: 'short' }),
        ...formatters,
      }}
      classNames={{
        root: cn('tw-w-fit', defaultClassNames.root),
        months: cn('tw-relative tw-flex tw-flex-col tw-gap-4 md:tw-flex-row', defaultClassNames.months),
        month: cn('tw-flex tw-w-full tw-flex-col tw-gap-4', defaultClassNames.month),
        nav: cn(
          'tw-absolute tw-inset-x-0 tw-top-0 tw-flex tw-w-full tw-items-center tw-justify-between tw-gap-1',
          defaultClassNames.nav
        ),
        button_previous: cn(
          buttonVariants({ variant: buttonVariant }),
          'tw-size-[--cell-size] tw-p-0 tw-select-none aria-disabled:tw-opacity-50',
          defaultClassNames.button_previous
        ),
        button_next: cn(
          buttonVariants({ variant: buttonVariant }),
          'tw-size-[--cell-size] tw-p-0 tw-select-none aria-disabled:tw-opacity-50',
          defaultClassNames.button_next
        ),
        month_caption: cn(
          'tw-flex tw-h-[--cell-size] tw-w-full tw-items-center tw-justify-center tw-px-[--cell-size]',
          defaultClassNames.month_caption
        ),
        dropdowns: cn(
          'tw-flex tw-h-[--cell-size] tw-w-full tw-items-center tw-justify-center tw-gap-1.5 tw-text-sm tw-font-medium',
          defaultClassNames.dropdowns
        ),
        dropdown_root: cn('tw-relative tw-rounded-[--cell-radius]', defaultClassNames.dropdown_root),
        dropdown: cn('tw-absolute tw-inset-0 tw-bg-popover tw-opacity-0', defaultClassNames.dropdown),
        caption_label: cn(
          'tw-font-medium tw-select-none',
          captionLayout === 'label'
            ? 'tw-text-sm'
            : 'tw-flex tw-items-center tw-gap-1 tw-rounded-[--cell-radius] tw-text-sm [&>svg]:tw-size-3.5 [&>svg]:tw-text-muted-foreground',
          defaultClassNames.caption_label
        ),
        month_grid: cn('tw-w-full tw-border-collapse', defaultClassNames.month_grid),
        weekdays: cn('tw-flex', defaultClassNames.weekdays),
        weekday: cn(
          'tw-flex-1 tw-rounded-[--cell-radius] tw-text-[0.8rem] tw-font-normal tw-text-muted-foreground tw-select-none',
          defaultClassNames.weekday
        ),
        week: cn('tw-mt-2 tw-flex tw-w-full', defaultClassNames.week),
        week_number_header: cn('tw-w-[--cell-size] tw-select-none', defaultClassNames.week_number_header),
        week_number: cn('tw-text-[0.8rem] tw-text-muted-foreground tw-select-none', defaultClassNames.week_number),
        day: cn(
          'tw-group/day tw-relative tw-aspect-square tw-h-full tw-w-full tw-rounded-[--cell-radius] tw-p-0 tw-text-center tw-select-none [&:last-child[data-selected=true]_button]:tw-rounded-r-[--cell-radius]',
          props.showWeekNumber
            ? '[&:nth-child(2)[data-selected=true]_button]:tw-rounded-l-[--cell-radius]'
            : '[&:first-child[data-selected=true]_button]:tw-rounded-l-[--cell-radius]',
          defaultClassNames.day
        ),
        range_start: cn(
          'tw-relative tw-isolate tw-z-0 tw-rounded-l-[--cell-radius] tw-bg-muted after:tw-absolute after:tw-inset-y-0 after:tw-right-0 after:tw-w-4 after:tw-bg-muted',
          defaultClassNames.range_start
        ),
        range_middle: cn('tw-rounded-none', defaultClassNames.range_middle),
        range_end: cn(
          'tw-relative tw-isolate tw-z-0 tw-rounded-r-[--cell-radius] tw-bg-muted after:tw-absolute after:tw-inset-y-0 after:tw-left-0 after:tw-w-4 after:tw-bg-muted',
          defaultClassNames.range_end
        ),
        today: cn(
          'tw-rounded-[--cell-radius] tw-bg-muted tw-text-foreground data-[selected=true]:tw-rounded-none',
          defaultClassNames.today
        ),
        outside: cn('tw-text-muted-foreground aria-selected:tw-text-muted-foreground', defaultClassNames.outside),
        disabled: cn('tw-text-muted-foreground tw-opacity-50', defaultClassNames.disabled),
        hidden: cn('tw-invisible', defaultClassNames.hidden),
        ...classNames,
      }}
      components={{
        Root: ({ className, rootRef, ...props }) => {
          return <div data-slot="calendar" ref={rootRef} className={cn(className)} {...props} />;
        },
        Chevron: ({ className, orientation, ...props }) => {
          if (orientation === 'left') {
            return <ChevronLeftIcon className={cn('tw-size-4', className)} {...props} />;
          }

          if (orientation === 'right') {
            return <ChevronRightIcon className={cn('tw-size-4', className)} {...props} />;
          }

          return <ChevronDownIcon className={cn('tw-size-4', className)} {...props} />;
        },
        DayButton: ({ ...props }) => <CalendarDayButton locale={locale} {...props} />,
        WeekNumber: ({ children, ...props }) => {
          return (
            <td {...props}>
              <div className="tw-flex tw-size-[--cell-size] tw-items-center tw-justify-center tw-text-center">
                {children}
              </div>
            </td>
          );
        },
        ...components,
      }}
      {...props}
    />
  );
}

function CalendarDayButton({ className, day, modifiers, locale, ...props }) {
  const defaultClassNames = getDefaultClassNames();

  const ref = React.useRef(null);
  React.useEffect(() => {
    if (modifiers.focused) ref.current?.focus();
  }, [modifiers.focused]);

  return (
    <Button
      ref={ref}
      variant="ghost"
      size="icon"
      data-day={day.date.toLocaleDateString(locale?.code)}
      data-selected-single={
        modifiers.selected && !modifiers.range_start && !modifiers.range_end && !modifiers.range_middle
      }
      data-range-start={modifiers.range_start}
      data-range-end={modifiers.range_end}
      data-range-middle={modifiers.range_middle}
      className={cn(
        'tw-relative tw-isolate tw-z-10 tw-flex tw-aspect-square tw-size-auto tw-w-full tw-min-w-[--cell-size] tw-flex-col tw-gap-1 tw-border-0 tw-leading-none tw-font-normal group-data-[focused=true]/day:tw-relative group-data-[focused=true]/day:tw-z-10 group-data-[focused=true]/day:tw-border-ring group-data-[focused=true]/day:tw-ring-[3px] group-data-[focused=true]/day:tw-ring-ring/50 data-[range-end=true]:tw-rounded-[--cell-radius] data-[range-end=true]:tw-rounded-r-[--cell-radius] data-[range-end=true]:tw-bg-primary data-[range-end=true]:tw-text-primary-foreground data-[range-middle=true]:tw-rounded-none data-[range-middle=true]:tw-bg-muted data-[range-middle=true]:tw-text-foreground data-[range-start=true]:tw-rounded-[--cell-radius] data-[range-start=true]:tw-rounded-l-[--cell-radius] data-[range-start=true]:tw-bg-primary data-[range-start=true]:tw-text-primary-foreground data-[selected-single=true]:tw-bg-primary data-[selected-single=true]:tw-text-primary-foreground dark:hover:tw-text-foreground [&>span]:tw-text-xs [&>span]:tw-opacity-70',
        defaultClassNames.day,
        className
      )}
      {...props}
    />
  );
}

export { Calendar, CalendarDayButton };
