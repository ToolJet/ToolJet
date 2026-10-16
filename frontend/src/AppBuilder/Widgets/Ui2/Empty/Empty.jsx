import React from 'react';
import { Inbox } from 'lucide-react';
import { useExposed } from '@/AppBuilder/Widgets/Ui2/_shared/packHooks';
import { Button } from '@/AppBuilder/Widgets/Ui2/_shared/ui';
import { Shell } from '@/AppBuilder/Widgets/Ui2/_shared/Shell';

export const ShadEmpty = (props) => {
  const { properties, setExposedVariables, fireEvent, height } = props;
  useExposed(setExposedVariables, properties, {});
  return (
    <Shell {...props}>
      <div
        className="flex flex-col items-center justify-center gap-2 rounded-[var(--lk-radius,var(--sc-radius))] border border-dashed border-[color:var(--lk-border,var(--sc-border))] bg-[color:var(--lk-bg,transparent)] p-6 text-center"
        style={{ minHeight: height }}
      >
        <div className="mb-1 flex h-10 w-10 items-center justify-center rounded-lg bg-[color:var(--lk-icon-bg,var(--sc-muted))]">
          <Inbox className="h-5 w-5 text-[color:var(--lk-icon,var(--sc-muted-foreground))]" />
        </div>
        <p className="text-sm font-medium text-[color:var(--lk-title,var(--sc-foreground))]">
          {String(properties.title ?? '')}
        </p>
        {properties.description ? (
          <p className="max-w-xs text-sm text-[color:var(--lk-fg,var(--sc-muted-foreground))]">
            {String(properties.description)}
          </p>
        ) : null}
        {properties.actionLabel ? (
          <Button size="sm" variant="outline" className="mt-2" onClick={() => fireEvent('onActionClicked')}>
            {String(properties.actionLabel)}
          </Button>
        ) : null}
      </div>
    </Shell>
  );
};
