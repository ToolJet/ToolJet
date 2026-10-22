import React, { useRef } from 'react';
import type { WidgetProps } from '@/AppBuilder/Widgets/Ui2/_shared/types';
import { useAutoHeight, useExposed, withControlState } from '@/AppBuilder/Widgets/Ui2/_shared/packHooks';
import { Alert, AlertDescription, AlertTitle, cn } from '@/AppBuilder/Widgets/Ui2/_shared/ui';
import { whenSet } from '@/AppBuilder/Widgets/Ui2/_shared/looks/shadcnLook';
import { Shell } from '@/AppBuilder/Widgets/Ui2/_shared/Shell';
import { inFixedBox } from '@/AppBuilder/Widgets/Ui2/_shared/useDynamicHeight';

export const ShadAlert = (props: WidgetProps) => {
  const { properties, styles, setExposedVariables } = props;
  const ref = useRef<HTMLDivElement>(null);
  useAutoHeight(props, ref);
  useExposed(setExposedVariables, properties, {});
  // In a fixed box (the editor, or Dynamic height off) the card fills the box, its content scrolling inside: sized to
  // its content, the card ignored the box's height.
  const fixed = inFixedBox(props);
  return (
    <Shell {...props} innerRef={ref} className={cn(fixed && 'tw-h-full')}>
      <Alert
        variant={properties.variant === 'destructive' ? 'destructive' : 'default'}
        className={cn(
          fixed && 'tw-h-full tw-overflow-y-auto',
          whenSet(styles, 'backgroundColor', 'tw-bg-[color:var(--lk-bg)]'),
          whenSet(styles, 'borderColor', 'tw-border-[color:var(--lk-border)]'),
          whenSet(styles, 'borderRadius', 'tw-rounded-[var(--lk-radius)]')
        )}
      >
        <AlertTitle className={whenSet(styles, 'titleColor', 'tw-text-[color:var(--lk-title)]')}>
          {String(properties.title ?? '')}
        </AlertTitle>
        {properties.description ? (
          <AlertDescription className={whenSet(styles, 'textColor', 'tw-text-[color:var(--lk-fg)] tw-opacity-100')}>
            {String(properties.description)}
          </AlertDescription>
        ) : null}
      </Alert>
    </Shell>
  );
};

export default withControlState(ShadAlert);
