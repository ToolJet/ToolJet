import React, { forwardRef, useState, type ButtonHTMLAttributes, type ReactNode } from 'react';
import { cn } from '@/lib/utils';
import { Button } from '../Button/Button';
import DropdownMenu, { type DropdownMenuSection } from '../DropdownMenu';
import Tooltip from '../Tooltip';
import { StatusDot, type StatusDotTone } from '../StatusDot/StatusDot';

export interface EnvironmentSwitcherOption {
  id: string;
  label: string;
  tone?: StatusDotTone;
  /** Shown in the trigger, before the label, while this option is the current one. Menu rows do not show it. */
  meta?: ReactNode;
  disabled?: boolean;
  /** Shown in a tooltip on the option's row when it is disabled. */
  disabledReason?: ReactNode;
}

export interface EnvironmentSwitcherProps {
  options: EnvironmentSwitcherOption[];
  /** The id of the current option; undefined while the options load. */
  value: string | undefined;
  onValueChange: (id: string) => void;
  disabled?: boolean;
  /** Shown when the trigger is hovered or focused. */
  tooltip?: ReactNode;
  className?: string;
}

// Matches the design's menu: 8px of padding round the rows.
const MENU_CLASSES = { group: 'tw-p-2' };
// The design's trigger is an outlined, lifted button. Open ("pressed") looks like hover.
const TRIGGER_CLASS = 'tw-shadow-elevation-100 data-[state=open]:tw-bg-button-outline-pressed';
// The design's text wraps at 120px; the bubble adds 12px of padding on each side.
const TOOLTIP_CLASSES = { content: 'tw-max-w-[144px] tw-text-center' };

// The 16px slot keeps labels aligned whatever the dot's size.
const DotSlot = ({ tone }: { tone?: StatusDotTone }) => (
  <span className="tw-flex tw-size-4 tw-shrink-0 tw-items-center tw-justify-center">
    <StatusDot tone={tone} size="small" />
  </span>
);

function OptionRow({ option }: { option: EnvironmentSwitcherOption }) {
  return (
    <span className="tw-flex tw-min-w-0 tw-flex-1 tw-items-center tw-gap-1.5">
      <DotSlot tone={option.tone} />
      <span className="tw-truncate">{option.label}</span>
    </span>
  );
}

// The menu hands its props and ref to this component, which passes them on to the button; the tooltip then adds its
// own on top.
type TriggerProps = ButtonHTMLAttributes<HTMLButtonElement> & {
  current: EnvironmentSwitcherOption | undefined;
  tooltip: ReactNode;
  tooltipOff: boolean;
};

const Trigger = forwardRef<HTMLButtonElement, TriggerProps>(function Trigger(
  { current, tooltip, tooltipOff, className, ...props },
  ref
) {
  return (
    // `open={undefined}` leaves the tooltip to its own hover and focus handling.
    <Tooltip content={tooltip} arrow classes={TOOLTIP_CLASSES} open={tooltipOff ? false : undefined}>
      <Button
        ref={ref}
        variant="outline"
        size="medium"
        aria-label={current ? `${current.label} environment` : 'Environment'}
        className={cn(TRIGGER_CLASS, className)}
        leadingVisual={
          current && (
            <>
              <StatusDot tone={current.tone} size="small" />
              {current.meta && (
                <>
                  <span className="tw-font-title-default tw-text-text-default">{current.meta}</span>
                  <span aria-hidden className="tw-h-4 tw-w-px tw-bg-border-default" />
                </>
              )}
            </>
          )
        }
        {...props}
      >
        {current?.label}
      </Button>
    </Tooltip>
  );
});

export function EnvironmentSwitcher({
  options,
  value,
  onValueChange,
  disabled = false,
  tooltip,
  className,
}: EnvironmentSwitcherProps) {
  const [menuOpen, setMenuOpen] = useState(false);
  // Dismissing the menu hands focus back to the trigger, and focus alone would open its tooltip. Keep it off from the
  // dismissal until the pointer next enters the trigger or focus leaves it.
  const [dismissed, setDismissed] = useState(false);

  const current = options.find((option) => option.id === value);

  const sections: DropdownMenuSection[] = [
    {
      id: 'options',
      // One option at a time: a list that ignores unchecking the current one, with a tick on the current one.
      items: options.map((option) => ({
        id: option.id,
        type: 'checkbox' as const,
        indicator: 'check' as const,
        label: <OptionRow option={option} />,
        checked: option.id === value,
        disabled: option.disabled,
        onCheckedChange: (checked: boolean) => checked && onValueChange(option.id),
        // A disabled row swallows pointer events, so the tooltip sits on a wrapper.
        wrapper:
          option.disabled && option.disabledReason
            ? (item) => (
                <Tooltip content={option.disabledReason} classes={TOOLTIP_CLASSES} arrow>
                  <div>{item}</div>
                </Tooltip>
              )
            : undefined,
      })),
    },
  ];

  return (
    <DropdownMenu
      // Radix only knows a trigger is disabled through its own prop, which the menu wrapper does not expose.
      open={disabled ? false : undefined}
      align="end"
      classes={MENU_CLASSES}
      onOpenChange={(open: boolean) => {
        setMenuOpen(open);
        if (!open) setDismissed(true);
      }}
      sections={sections}
      trigger={
        <Trigger
          current={current}
          tooltip={tooltip}
          tooltipOff={menuOpen || dismissed}
          disabled={disabled}
          className={className}
          onPointerEnter={() => setDismissed(false)}
          onBlur={() => setDismissed(false)}
        />
      }
    />
  );
}
