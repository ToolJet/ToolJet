import React from 'react';
import type { WidgetProps } from '@/AppBuilder/Widgets/Ui2/_shared/types';
import { Inbox } from 'lucide-react';
import { useExposed, withControlState } from '@/AppBuilder/Widgets/Ui2/_shared/packHooks';
import { Button } from '@/AppBuilder/Widgets/Ui2/_shared/ui';
import { Shell, busy } from '@/AppBuilder/Widgets/Ui2/_shared/Shell';

export const ShadEmpty = (props: WidgetProps) => {
  const { properties, setExposedVariables, fireEvent, height } = props;
  useExposed(setExposedVariables, properties, {});
  return (
    <Shell {...props}>
      <div
        className="tw-flex tw-flex-col tw-items-center tw-justify-center tw-gap-2 tw-rounded-[var(--lk-radius,var(--sc-radius))] tw-border tw-border-dashed tw-border-[color:var(--lk-border,var(--sc-border))] tw-bg-[color:var(--lk-bg,transparent)] tw-p-6 tw-text-center"
        style={{ minHeight: height }}
      >
        <div className="tw-mb-1 tw-flex tw-h-10 tw-w-10 tw-items-center tw-justify-center tw-rounded-ui2-lg tw-bg-[color:var(--lk-icon-bg,var(--sc-muted))]">
          <Inbox className="tw-h-5 tw-w-5 tw-text-[color:var(--lk-icon,var(--sc-muted-foreground))]" />
        </div>
        <p className="tw-text-ui2-sm tw-font-medium tw-text-[color:var(--lk-title,var(--sc-foreground))]">
          {String(properties.title ?? '')}
        </p>
        {properties.description ? (
          <p className="tw-max-w-xs tw-text-ui2-sm tw-text-[color:var(--lk-fg,var(--sc-muted-foreground))]">
            {String(properties.description)}
          </p>
        ) : null}
        {properties.actionLabel ? (
          // Disabled or loading, the action takes no click and fires nothing, as every other UI 2.0 action does.
          <Button
            size="sm"
            variant="outline"
            className="tw-mt-2"
            disabled={busy(properties)}
            onClick={() => {
              if (!busy(properties)) fireEvent('onActionClicked');
            }}
          >
            {String(properties.actionLabel)}
          </Button>
        ) : null}
      </div>
    </Shell>
  );
};

export default withControlState(ShadEmpty);
