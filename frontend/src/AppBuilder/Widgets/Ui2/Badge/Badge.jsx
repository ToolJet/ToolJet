import React from 'react';
import { useExposed, withControlState } from '@/AppBuilder/Widgets/Ui2/_shared/packHooks';
import { Badge, cn } from '@/AppBuilder/Widgets/Ui2/_shared/ui';
import { whenSet } from '@/AppBuilder/Widgets/Ui2/_shared/looks/shadcnLook';
import { Shell } from '@/AppBuilder/Widgets/Ui2/_shared/Shell';

export const ShadBadge = (props) => {
  const { properties, setExposedVariables } = props;
  useExposed(setExposedVariables, properties, {});
  return (
    <Shell {...props}>
      <Badge
        variant={properties.variant || 'default'}
        className={cn(
          whenSet(props.styles, 'backgroundColor', 'bg-[color:var(--lk-bg)]'),
          whenSet(props.styles, 'textColor', 'text-[color:var(--lk-fg)]'),
          whenSet(props.styles, 'borderColor', 'border-[color:var(--lk-border)]'),
          whenSet(props.styles, 'borderRadius', 'rounded-[var(--lk-radius)]')
        )}
      >
        {String(properties.text ?? '')}
      </Badge>
    </Shell>
  );
};

export default withControlState(ShadBadge);
