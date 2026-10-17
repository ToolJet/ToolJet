import React from 'react';
import type { WidgetProps } from '@/AppBuilder/Widgets/Ui2/_shared/types';
import { useExposed, withControlState } from '@/AppBuilder/Widgets/Ui2/_shared/packHooks';
import { Progress, cn } from '@/AppBuilder/Widgets/Ui2/_shared/ui';
import { useOverrides } from '@/AppBuilder/Widgets/Ui2/_shared/parity';
import { Shell } from '@/AppBuilder/Widgets/Ui2/_shared/Shell';
import { HELP, LABEL } from '@/AppBuilder/Widgets/Ui2/_shared/field';

export const ShadProgress = (props: WidgetProps) => {
  const { setExposedVariables } = props;
  const [properties, override] = useOverrides(props.properties);
  const value = Math.max(0, Math.min(100, Number(properties.value) || 0));
  useExposed(setExposedVariables, properties, {
    value,
    setValue: async (v: unknown) => override('value', Number(v) || 0),
  });
  return (
    <Shell {...props}>
      <div className="tw-flex tw-flex-col tw-gap-2">
        {properties.label || properties.showValue ? (
          <div className="tw-flex tw-items-center tw-justify-between tw-text-ui2-sm">
            <span className={cn('tw-font-medium', LABEL)}>{String(properties.label ?? '')}</span>
            {properties.showValue ? <span className={cn('tw-tabular-nums', HELP)}>{Math.round(value)}%</span> : null}
          </div>
        ) : null}
        <Progress value={value} className="tw-h-[var(--lk-height,0.5rem)]" />
      </div>
    </Shell>
  );
};

export default withControlState(ShadProgress);
