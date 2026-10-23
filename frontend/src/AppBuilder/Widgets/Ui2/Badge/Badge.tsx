import React from 'react';
import type { WidgetProps } from '@/AppBuilder/Widgets/Ui2/_shared/types';
import { useExposed, withControlState } from '@/AppBuilder/Widgets/Ui2/_shared/packHooks';
import { Badge, cn } from '@/AppBuilder/Widgets/Ui2/_shared/ui';
import { whenSet } from '@/AppBuilder/Widgets/Ui2/_shared/looks/shadcnLook';
import { Shell } from '@/AppBuilder/Widgets/Ui2/_shared/Shell';

const VARIANTS = ['default', 'secondary', 'outline', 'success', 'warning', 'destructive'];
/** The variant, now that it can be bound to data: a known name in any case ("Success"), danger as destructive, and
 *  anything else the default look rather than an unstyled badge. */
export const badgeVariant = (value: unknown) => {
  const name = String(value ?? '')
    .trim()
    .toLowerCase();
  if (name === 'danger') return 'destructive';
  return VARIANTS.includes(name) ? name : 'default';
};

export const ShadBadge = (props: WidgetProps) => {
  const { properties, setExposedVariables } = props;
  useExposed(setExposedVariables, properties, {});
  return (
    <Shell {...props}>
      <Badge
        variant={badgeVariant(properties.variant) as 'default'}
        className={cn(
          whenSet(props.styles, 'backgroundColor', 'tw-bg-[color:var(--lk-bg)]'),
          whenSet(props.styles, 'textColor', 'tw-text-[color:var(--lk-fg)]'),
          whenSet(props.styles, 'borderColor', 'tw-border-[color:var(--lk-border)]'),
          whenSet(props.styles, 'borderRadius', 'tw-rounded-[var(--lk-radius)]')
        )}
      >
        {String(properties.text ?? '')}
      </Badge>
    </Shell>
  );
};

export default withControlState(ShadBadge);
