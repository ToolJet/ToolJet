import React, { useEffect, useId } from 'react';
import * as CheckboxPrimitive from '@radix-ui/react-checkbox';
import { ToolJet } from '@tooljet/custom-component-sdk';
import { useLiveState } from '../lib/useLiveState';
import { useOwnEventGuard } from '../lib/ownEvent';
import { Check } from 'lucide-react';
import { CheckedRow } from '../lib/Field';
import { lookVars, useResetOn } from '../lib/ui2/choice/looks';
import { useBusy, useColorStyle } from '../lib/ui2/choice/fieldStyles';
import { TOKEN } from '../lib/styleDefaults';
import { InlineLoading } from '../lib/ui2/loading/look';
import '../styles/ui2-choice.css';

// UI 2.0's Checkbox (Ui2/Checkbox/Checkbox.tsx) on the pack's CSS: a box with its label and help text, value exposed,
// and a mandatory check (a mandatory checkbox must be checked).
export const Checkbox = () => {
  const [label] = ToolJet.useStateString({ name: 'label', label: 'Label', initialValue: 'Checkbox' });
  const [description] = ToolJet.useStateString({ name: 'description', label: 'Help text', initialValue: '' });
  const [defaultChecked] = ToolJet.useStateBoolean({
    name: 'defaultChecked',
    label: 'Checked by default',
    initialValue: false,
  });
  // Exposed value, and the pack's earlier name for it (also its default).
  const [, setValue] = ToolJet.useStateBoolean({ name: 'value', initialValue: false, inspector: 'hidden' });
  const [legacyChecked, setLegacyChecked] = ToolJet.useStateBoolean({
    name: 'checked',
    initialValue: false,
    inspector: 'hidden',
  });
  const [disabledProp] = ToolJet.useStateBoolean({
    name: 'disabled',
    label: 'Disable',
    initialValue: false,
    inspector: 'hidden',
  });
  const onChange = ToolJet.useEventCallback({ name: 'onChange' });
  const onCheck = ToolJet.useEventCallback({ name: 'onCheck' });
  // UI 2.0's spelling only: the pack's earlier onUncheck fired alongside it, a third event for one uncheck.
  const onUnCheck = ToolJet.useEventCallback({ name: 'onUnCheck' });
  const accentColor = useColorStyle('accentColor', 'Checked color', TOKEN.brand);
  const labelColor = useColorStyle('labelColor', 'Label color', TOKEN.text);
  const helpTextColor = useColorStyle('helpTextColor', 'Help text color', TOKEN.mutedText);
  const borderColor = useColorStyle('borderColor', 'Unchecked box border color', TOKEN.brand);
  const errorColor = useColorStyle('errorColor', 'Error color', TOKEN.error);
  const textColor = ToolJet.useStyleString({
    name: 'textColor',
    label: 'Label color (earlier name)',
    inspector: 'hidden',
    initialValue: '',
  });
  ToolJet.useComponentSettings({ role: 'checkbox', fit: true, loading: 'own', defaultWidth: 8, defaultHeight: 3 });
  const { disabled, loading } = useBusy(disabledProp);
  const hostId = ToolJet.useFieldId();
  const ownId = useId();
  const id = hostId ?? ownId;

  const [checked, setChecked, checkedRef] = useLiveState(() => defaultChecked === true || legacyChecked === true);
  useResetOn(defaultChecked, () => setChecked(defaultChecked === true));
  // A Form's clearForm empties what the field shows as well as what it exposes (the SDK clears only `value`).
  ToolJet.useFormClear(() => setChecked(false));
  useEffect(() => {
    setValue(checked);
    setLegacyChecked(checked);
  }, [checked]); // eslint-disable-line react-hooks/exhaustive-deps
  // A mandatory checkbox must be checked: unchecked is not a value here.
  const check = ToolJet.useValidation({ kind: 'choice', value: checked, present: checked });

  const guard = useOwnEventGuard();
  const set = (next: boolean) => {
    if (next === checkedRef.current) return;
    setChecked(next);
    setValue(next);
    setLegacyChecked(next);
    guard(() => {
      onChange();
      // onChange plus onCheck or onUnCheck, as UI 2.0's Checkbox: they mean different things.
      if (next) onCheck();
      else onUnCheck();
    });
  };
  ToolJet.useAction({ name: 'toggle', displayName: 'Toggle' }, () => set(!checkedRef.current));
  ToolJet.useAction(
    {
      name: 'setValue',
      displayName: 'Set value',
      params: [{ handle: 'value', displayName: 'Value', type: 'toggle', defaultValue: true }],
    },
    (next) => set(String(next) === 'true')
  );

  const note = check.error || description;
  const vars = lookVars({
    '--ui-primary': accentColor,
    '--lk-label': labelColor || textColor,
    '--lk-help': helpTextColor,
    '--lk-border': borderColor,
    '--ui-destructive': errorColor,
  });
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
