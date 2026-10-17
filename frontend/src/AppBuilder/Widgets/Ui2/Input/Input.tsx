import React, { useRef } from 'react';
import { useAutoHeight, withControlState } from '@/AppBuilder/Widgets/Ui2/_shared/packHooks';
import { Input } from '@/AppBuilder/Widgets/Ui2/_shared/ui';
import { FormField } from '@/AppBuilder/Widgets/Ui2/_shared/field';
import { useTextField } from '@/AppBuilder/Widgets/Ui2/_shared/formHooks';
import type { WidgetProps } from '@/AppBuilder/Widgets/Ui2/_shared/types';
import { isEnter } from '@/AppBuilder/Widgets/Ui2/_shared/keyboard';

export const ShadInput = (props: WidgetProps) => {
  // Fields fit their content (label, help text, validation message), so nothing below is overlapped.
  const fit = useRef<HTMLDivElement>(null);
  useAutoHeight(props, fit);
  const { properties, fireEvent } = props;
  const { check, fieldProps } = useTextField<HTMLInputElement>(props);
  return (
    <FormField props={props} properties={properties} check={check} innerRef={fit}>
      <Input
        {...fieldProps}
        type={properties.inputType || 'text'}
        onKeyDown={(e) => isEnter(e) && fireEvent('onEnterPressed')}
      />
    </FormField>
  );
};

export default withControlState(ShadInput);
