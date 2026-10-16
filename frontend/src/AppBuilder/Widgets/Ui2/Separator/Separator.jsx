import React from 'react';
import { useExposed } from '@/AppBuilder/Widgets/Ui2/_shared/packHooks';
import { Separator, cn } from '@/AppBuilder/Widgets/Ui2/_shared/ui';
import { Shell } from '@/AppBuilder/Widgets/Ui2/_shared/Shell';

export const ShadSeparator = (props) => {
  const { properties, setExposedVariables, height } = props;
  useExposed(setExposedVariables, properties, {});
  const vertical = properties.orientation === 'vertical';
  return (
    <Shell {...props}>
      <div className="flex items-center justify-center" style={{ height }}>
        <Separator
          orientation={vertical ? 'vertical' : 'horizontal'}
          className={cn(
            'bg-[color:var(--lk-line,var(--sc-border))]',
            vertical ? 'w-[var(--lk-thick,1px)]' : 'h-[var(--lk-thick,1px)]'
          )}
        />
      </div>
    </Shell>
  );
};
