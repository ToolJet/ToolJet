import React, { forwardRef, useState, type ButtonHTMLAttributes } from 'react';
import { ChevronDown } from 'lucide-react';

import { cn } from '@/lib/utils';
import { useHeaderEnvironmentStore } from '@/_stores/headerEnvironmentStore';
import { Button } from '@/components/ui/Rocket';
import DropdownMenu from '@/components/ui/Rocket/DropdownMenu';
import Tooltip from '@/components/ui/Rocket/Tooltip';

const ENV_DOT_COLORS: Record<string, string> = {
  development: 'tw-bg-background-accent-strong',
  staging: 'tw-bg-background-warning-strong',
  production: 'tw-bg-background-success-strong',
};

// The design's environment marker: 6px on the trigger, 8px in the menu rows. Names outside the three defaults get a
// neutral dot.
function EnvDot({ name, className }: { name?: string; className?: string }) {
  return (
    <span
      aria-hidden
      className={cn(
        'tw-shrink-0 tw-rounded-full',
        ENV_DOT_COLORS[name?.toLowerCase() ?? ''] ?? 'tw-bg-icon-weak',
        className
      )}
    />
  );
}

const EnvOption = ({ name }: { name: string }) => (
  <span className="tw-flex tw-items-center tw-gap-2">
    <EnvDot name={name} className="tw-size-2" />
    {name}
  </span>
);

// The design's text wraps at 120px; the bubble adds 12px of padding on each side.
const ENV_TOOLTIP_CLASSES = { content: 'tw-max-w-[144px] tw-text-center' };
// The design's pill: an outlined, lifted button, like the version and environment pill in the App Builder header.
const PILL_CLASS = 'tw-shadow-elevation-100';
const MENU_CLASSES = { item: 'tw-h-[30px]' };

// The menu hands its props and ref to this component, which passes them on to the button; the tooltip then adds its
// own on top.
const EnvTrigger = forwardRef<
  HTMLButtonElement,
  ButtonHTMLAttributes<HTMLButtonElement> & { name?: string; tooltipOff: boolean }
>(function EnvTrigger({ name, tooltipOff, ...props }, ref) {
  return (
    // `open={undefined}` leaves the tooltip to its own hover and focus handling.
    <Tooltip
      content="Choose which environment’s values the list shows."
      arrow
      classes={ENV_TOOLTIP_CLASSES}
      open={tooltipOff ? false : undefined}
    >
      <Button
        ref={ref}
        variant="outline"
        size="medium"
        aria-label={name ? `${name} environment` : 'Environment'}
        className={PILL_CLASS}
        leadingVisual={<EnvDot name={name} className="tw-size-1.5" />}
        trailingVisual={<ChevronDown size={14} />}
        {...props}
      >
        {name}
      </Button>
    </Tooltip>
  );
});

// Shows the environment select the current page set through `useHeaderEnvironmentSelect`; nothing otherwise.
export default function HeaderEnvironmentSelect() {
  const select = useHeaderEnvironmentStore((state) => state.select);
  const [menuOpen, setMenuOpen] = useState(false);
  // Dismissing the menu hands focus back to the pill, and focus alone would open its tooltip. Keep it off from the
  // dismissal until the pointer next enters the pill or focus leaves it.
  const [dismissed, setDismissed] = useState(false);
  if (!select) return null;

  const { environments, environmentId, onChange } = select;
  const current = environments.find((environment) => environment.id === environmentId);

  return (
    <DropdownMenu
      compact
      align="end"
      classes={MENU_CLASSES}
      onOpenChange={(open: boolean) => {
        setMenuOpen(open);
        if (!open) setDismissed(true);
      }}
      sections={[
        {
          id: 'environment',
          // One environment at a time: a checkbox list that ignores unchecking the current one, as the sort menu does.
          items: environments.map(({ id, name }) => ({
            id,
            type: 'checkbox' as const,
            label: <EnvOption name={name} />,
            checked: id === environmentId,
            onCheckedChange: (checked: boolean) => checked && onChange(id),
          })),
        },
      ]}
      trigger={
        <EnvTrigger
          name={current?.name}
          tooltipOff={menuOpen || dismissed}
          onPointerEnter={() => setDismissed(false)}
          onBlur={() => setDismissed(false)}
        />
      }
    />
  );
}
