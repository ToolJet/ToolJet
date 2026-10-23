import React from 'react';
import type { WidgetProps } from '@/AppBuilder/Widgets/Ui2/_shared/types';
import { useExposed, withControlState } from '@/AppBuilder/Widgets/Ui2/_shared/packHooks';
import { Separator, cn } from '@/AppBuilder/Widgets/Ui2/_shared/ui';
import { Shell } from '@/AppBuilder/Widgets/Ui2/_shared/Shell';

export const ShadSeparator = (props: WidgetProps) => {
  const { properties, setExposedVariables, height } = props;
  useExposed(setExposedVariables, properties, {});
  const vertical = properties.orientation === 'vertical';
  return (
    <Shell {...props}>
      <div className="tw-flex tw-items-center tw-justify-center" style={{ height }}>
        <Separator
          orientation={vertical ? 'vertical' : 'horizontal'}
          className={cn(
            'tw-bg-[color:var(--lk-line,var(--sc-border))]',
            vertical ? 'tw-w-[var(--lk-thick,1px)]' : 'tw-h-[var(--lk-thick,1px)]'
          )}
        />
      </div>
    </Shell>
  );
};

export default withControlState(ShadSeparator);
