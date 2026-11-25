import React, { forwardRef } from 'react';
import PropTypes from 'prop-types';
import { cn } from '@/lib/utils';
import { Calendar as ShadcnCalendar, CalendarDayButton } from '@/components/ui/Rocket/shadcn/calendar';

// Day cell: ToolJet tokens over the shadcn defaults. Range ends are solid brand, the middle is the
// selected tint, today is marked by brand text rather than a fill so it never reads as a selection.
const dayButtonClasses = cn(
  'tw-h-[--cell-size] tw-w-[--cell-size] tw-min-w-0 tw-aspect-auto tw-p-0',
  'tw-rounded-md tw-font-body-default tw-text-text-default tw-bg-transparent',
  'hover:tw-bg-interactive-hover',
  'focus-visible:tw-ring-2 focus-visible:tw-ring-interactive-focus-outline focus-visible:tw-outline-none',
  'data-[selected-single=true]:tw-bg-button-primary data-[selected-single=true]:tw-text-text-on-solid',
  'data-[range-start=true]:tw-bg-button-primary data-[range-start=true]:tw-text-text-on-solid',
  'data-[range-end=true]:tw-bg-button-primary data-[range-end=true]:tw-text-text-on-solid',
  'data-[range-middle=true]:tw-bg-transparent data-[range-middle=true]:tw-text-text-default',
  'data-[range-middle=true]:hover:tw-bg-interactive-hover',
  'disabled:tw-text-text-disabled disabled:hover:tw-bg-transparent'
);

const DayButton = ({ className, ...props }) => (
  <CalendarDayButton className={cn(dayButtonClasses, className)} {...props} />
);

const Calendar = forwardRef(function Calendar({ className, classNames, components, ...props }, ref) {
  return (
    <ShadcnCalendar
      className={cn('tw-bg-transparent tw-p-0 [--cell-size:2.25rem]', className)}
      classNames={{
        months: 'tw-relative tw-flex tw-flex-col tw-gap-6 md:tw-flex-row',
        caption_label: 'tw-font-title-default tw-text-text-default tw-select-none',
        button_previous:
          'tw-size-[--cell-size] tw-p-0 tw-inline-flex tw-items-center tw-justify-center tw-rounded-md tw-border-0 tw-bg-transparent tw-text-icon-default hover:tw-bg-interactive-hover aria-disabled:tw-opacity-40',
        button_next:
          'tw-size-[--cell-size] tw-p-0 tw-inline-flex tw-items-center tw-justify-center tw-rounded-md tw-border-0 tw-bg-transparent tw-text-icon-default hover:tw-bg-interactive-hover aria-disabled:tw-opacity-40',
        weekday: 'tw-w-[--cell-size] tw-flex-none tw-font-body-small tw-text-text-placeholder tw-select-none',
        week: 'tw-mt-0.5 tw-flex tw-w-full',
        day: 'tw-relative tw-size-[--cell-size] tw-flex-none tw-p-0 tw-text-center tw-select-none',
        range_start:
          'tw-relative tw-isolate tw-z-0 tw-rounded-l-md tw-bg-background-accent-weak after:tw-absolute after:tw-inset-y-0 after:tw-right-0 after:tw-w-4 after:tw-bg-background-accent-weak',
        range_middle: 'tw-rounded-none tw-bg-background-accent-weak',
        range_end:
          'tw-relative tw-isolate tw-z-0 tw-rounded-r-md tw-bg-background-accent-weak after:tw-absolute after:tw-inset-y-0 after:tw-left-0 after:tw-w-4 after:tw-bg-background-accent-weak',
        today: 'tw-rounded-md [&_button]:tw-font-title-default [&_button]:tw-text-text-brand',
        outside: 'tw-text-text-placeholder [&_button]:tw-text-text-placeholder',
        disabled: '[&_button]:tw-text-text-disabled [&_button]:tw-opacity-60',
        ...classNames,
      }}
      components={{
        DayButton,
        Root: ({ className: rootClassName, rootRef, ...rootProps }) => (
          <div
            data-slot="calendar"
            ref={(node) => {
              if (typeof rootRef === 'function') rootRef(node);
              else if (rootRef) rootRef.current = node;
              if (typeof ref === 'function') ref(node);
              else if (ref) ref.current = node;
            }}
            className={rootClassName}
            {...rootProps}
          />
        ),
        ...components,
      }}
      {...props}
    />
  );
});
Calendar.displayName = 'Calendar';
Calendar.propTypes = {
  className: PropTypes.string,
  classNames: PropTypes.object,
  components: PropTypes.object,
};

export { Calendar };
