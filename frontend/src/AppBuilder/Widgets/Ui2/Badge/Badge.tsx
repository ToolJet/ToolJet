import React from 'react';
import type { WidgetProps } from '@/AppBuilder/Widgets/Ui2/_shared/types';
import { useExposed, withControlState } from '@/AppBuilder/Widgets/Ui2/_shared/packHooks';
import { Badge, cn } from '@/AppBuilder/Widgets/Ui2/_shared/ui';
import { whenSet } from '@/AppBuilder/Widgets/Ui2/_shared/looks/shadcnLook';
import { Shell } from '@/AppBuilder/Widgets/Ui2/_shared/Shell';

export const ShadBadge = (props: WidgetProps) => {
  const { properties, setExposedVariables } = props;
  useExposed(setExposedVariables, properties, {});
  return (
    <Shell {...props}>
      <Badge
        variant={properties.variant || 'default'}
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
