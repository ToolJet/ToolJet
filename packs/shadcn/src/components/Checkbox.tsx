import React, { useEffect, useId, useState } from 'react';
import * as CheckboxPrimitive from '@radix-ui/react-checkbox';
import { ToolJet } from '@tooljet/custom-component-sdk';
import { Check } from 'lucide-react';
import { CheckedRow } from '../lib/Field';
import { lookVars, useResetOn } from '../lib/ui2/choice/looks';
import { useBusy, useColorStyle } from '../lib/ui2/choice/fieldStyles';
import { InlineLoading } from '../lib/ui2/loading/look';
import '../styles/ui2-choice.css';

// UI 2.0's Checkbox (Ui2/Checkbox/Checkbox.tsx) on the pack's CSS: a box with its label and help text, value exposed,
// and a mandatory check (a mandatory checkbox must be checked).
export const Checkbox = () => {
  const [label] = ToolJet.useStateString({ name: 'label', label: 'Label', initialValue: 'Checkbox' });
  const [description] = ToolJet.useStateString({ name: 'description', label: 'Help text', initialValue: '' });
  const [defaultChecked] = ToolJet.useStateBoolean({ name: 'defaultChecked', label: 'Checked by default', initialValue: false });
  // Exposed value, and the pack's earlier name for it (also its default).
  const [, setValue] = ToolJet.useStateBoolean({ name: 'value', initialValue: false, inspector: 'hidden' });
  const [legacyChecked, setLegacyChecked] = ToolJet.useStateBoolean({ name: 'checked', initialValue: false, inspector: 'hidden' });
  const [disabledProp] = ToolJet.useStateBoolean({ name: 'disabled', label: 'Disable', initialValue: false, inspector: 'hidden' });
  const onChange = ToolJet.useEventCallback({ name: 'onChange' });
  const onCheck = ToolJet.useEventCallback({ name: 'onCheck' });
  const onUnCheck = ToolJet.useEventCallback({ name: 'onUnCheck' });
  const onUncheck = ToolJet.useEventCallback({ name: 'onUncheck' });
  const accentColor = useColorStyle('accentColor', 'Checked color');
  const labelColor = useColorStyle('labelColor', 'Label color');
  const helpTextColor = useColorStyle('helpTextColor', 'Help text color');
  const borderColor = useColorStyle('borderColor', 'Unchecked box border color');
  const errorColor = useColorStyle('errorColor', 'Error color');
  const textColor = ToolJet.useStyleString({ name: 'textColor', label: 'Label color (earlier name)', inspector: 'hidden', initialValue: '' });
  ToolJet.useComponentSettings({ defaultWidth: 8, defaultHeight: 3 });
  const { disabled, loading } = useBusy(disabledProp);
  const hostId = ToolJet.useFieldId();
  const ownId = useId();
  const id = hostId ?? ownId;

  const [checked, setChecked] = useState(() => defaultChecked === true || legacyChecked === true);
  useResetOn(defaultChecked, () => setChecked(defaultChecked === true));
  useEffect(() => {
    setValue(checked);
    setLegacyChecked(checked);
  }, [checked]); // eslint-disable-line react-hooks/exhaustive-deps
  // A mandatory checkbox must be checked: unchecked is not a value here.
  const check = ToolJet.useValidation({ section: 'choice', value: checked, present: checked });

  const set = (next: boolean) => {
    if (next === checked) return;
    setChecked(next);
    setValue(next);
    setLegacyChecked(next);
    onChange();
    if (next) onCheck();
    else {
      onUnCheck();
      onUncheck();
    }
  };
  ToolJet.useAction({ name: 'toggle', displayName: 'Toggle' }, () => set(!checked));
  ToolJet.useAction(
    { name: 'setValue', displayName: 'Set value', params: [{ handle: 'value', displayName: 'Value', type: 'toggle', defaultValue: true }] },
    (next) => set(String(next) === 'true')
  );
  ToolJet.useAction(
    { name: 'setChecked', displayName: 'Set checked', params: [{ handle: 'checked', displayName: 'Checked', type: 'toggle', defaultValue: true }] },
    (next) => set(String(next) === 'true')
  );

  const note = check.error || description;
  const vars = lookVars({ '--ui-primary': accentColor, '--lk-label': labelColor || textColor, '--lk-help': helpTextColor, '--lk-border': borderColor, '--ui-destructive': errorColor });
  return (
    <div className="ui uc" style={vars}>
      <InlineLoading loading={loading}>
        <CheckedRow
          htmlFor={id}
          label={label}
          description={description}
          error={check.error}
          required={check.required}
          control={
            <CheckboxPrimitive.Root
              id={id}
              className="ui-checkbox ui-focus"
              checked={checked}
              disabled={disabled}
              aria-invalid={check.error ? true : undefined}
              aria-required={check.required || undefined}
              aria-describedby={note ? `${id}-note` : undefined}
              onCheckedChange={(next) => {
                set(next === true);
                check.touch();
              }}
            >
              <CheckboxPrimitive.Indicator>
                <Check strokeWidth={3} />
              </CheckboxPrimitive.Indicator>
            </CheckboxPrimitive.Root>
          }
        />
      </InlineLoading>
    </div>
  );
};
