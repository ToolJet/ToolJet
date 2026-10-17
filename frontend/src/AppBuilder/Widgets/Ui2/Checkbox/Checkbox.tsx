import React, { useRef } from 'react';
import { useAutoHeight, withControlState } from '@/AppBuilder/Widgets/Ui2/_shared/packHooks';
import { Checkbox } from '@/AppBuilder/Widgets/Ui2/_shared/ui';
import { Shell, busy } from '@/AppBuilder/Widgets/Ui2/_shared/Shell';
import { CheckedRow, useChecked, useValidation } from '@/AppBuilder/Widgets/Ui2/_shared/formHooks';
import type { WidgetProps } from '@/AppBuilder/Widgets/Ui2/_shared/types';

export const ShadCheckbox = (props: WidgetProps) => {
  // Fields fit their content (label, help text, validation message), so nothing below is overlapped.
  const fit = useRef<HTMLDivElement>(null);
  useAutoHeight(props, fit);
  const [checked, change] = useChecked(props);
  // A mandatory checkbox must be checked: unchecked is not a value here.
  const check = useValidation(props, checked, () => change(false), checked);
  const id = `shad-${props.id}`;
  return (
    <Shell {...props} innerRef={fit}>
      <CheckedRow
        id={id}
        label={props.properties.label}
        description={props.properties.description}
        error={check.error}
        required={check.required}
        control={
          <Checkbox
            id={id}
            checked={checked}
            disabled={busy(props.properties)}
            onCheckedChange={(v) => {
              change(v);
              check.touch();
            }}
            aria-invalid={!!check.error || undefined}
            className="data-[state=unchecked]:tw-border-[color:var(--lk-invalid,var(--lk-border,var(--sc-primary)))]"
          />
        }
      />
    </Shell>
  );
};

export default withControlState(ShadCheckbox);
