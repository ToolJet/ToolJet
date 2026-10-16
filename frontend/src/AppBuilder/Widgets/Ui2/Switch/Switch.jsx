import React, { useRef } from 'react';
import { useAutoHeight } from '@/AppBuilder/Widgets/Ui2/_shared/packHooks';
import { Switch } from '@/AppBuilder/Widgets/Ui2/_shared/ui';
import { Shell, busy } from '@/AppBuilder/Widgets/Ui2/_shared/Shell';
import { CheckedRow, useChecked } from '@/AppBuilder/Widgets/Ui2/_shared/formHooks';

export const ShadSwitch = (props) => {
  // Fields fit their content (label, help text, validation message), so nothing below is overlapped.
  const fit = useRef(null);
  useAutoHeight(props, fit);
  const [checked, change] = useChecked(props);
  const id = `shad-${props.id}`;
  return (
    <Shell {...props} innerRef={fit}>
      <CheckedRow
        id={id}
        label={props.properties.label}
        description={props.properties.description}
        control={
          <Switch
            id={id}
            checked={checked}
            disabled={busy(props.properties)}
            onCheckedChange={change}
            className="data-[state=unchecked]:bg-[color:var(--lk-off,var(--sc-input))]"
          />
        }
      />
    </Shell>
  );
};
