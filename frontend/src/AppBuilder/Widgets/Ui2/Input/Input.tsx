import React, { useRef } from 'react';
import { useAutoHeight, withControlState } from '@/AppBuilder/Widgets/Ui2/_shared/packHooks';
import { Input } from '@/AppBuilder/Widgets/Ui2/_shared/ui';
import { Shell, busy } from '@/AppBuilder/Widgets/Ui2/_shared/Shell';
import { CONTROL, Field, fieldName } from '@/AppBuilder/Widgets/Ui2/_shared/field';
import { useTextBox, useValidation, useValue } from '@/AppBuilder/Widgets/Ui2/_shared/formHooks';
import type { WidgetProps } from '@/AppBuilder/Widgets/Ui2/_shared/types';

export const ShadInput = (props: WidgetProps) => {
  // Fields fit their content (label, help text, validation message), so nothing below is overlapped.
  const fit = useRef<HTMLDivElement>(null);
  useAutoHeight(props, fit);
  const { properties, fireEvent, id } = props;
  const [value, change] = useValue(props, String(properties.defaultValue ?? ''), (set) => ({
    setText: async (t: unknown) => set(String(t ?? '')),
    clear: async () => set(''),
  }));
  const check = useValidation(props, value, () => change('', 'onChange'));
  const box = useTextBox(props, check.touch);
  return (
    <Shell {...props} innerRef={fit}>
      <Field
        id={`shad-${id}`}
        label={properties.label}
        description={properties.description}
        error={check.error}
        required={check.required}
      >
        <Input
          ref={box.ref}
          id={`shad-${id}`}
          type={properties.inputType || 'text'}
          className={CONTROL}
          value={value}
          aria-invalid={!!check.error || undefined}
          aria-label={fieldName(props)}
          onFocus={box.onFocus}
          onBlur={box.onBlur}
          placeholder={String(properties.placeholder ?? '')}
          disabled={busy(properties)}
          onChange={(e) => change(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && fireEvent('onEnterPressed')}
        />
      </Field>
    </Shell>
  );
};

export default withControlState(ShadInput);
