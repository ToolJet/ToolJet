import React, { useEffect, useId } from 'react';
import * as SwitchPrimitive from '@radix-ui/react-switch';
import { ToolJet } from '@tooljet/custom-component-sdk';
import { useLiveState } from '../lib/useLiveState';
import { CheckedRow } from '../lib/Field';
import { lookVars, useResetOn } from '../lib/ui2/choice/looks';
import { useBusy, useColorStyle } from '../lib/ui2/choice/fieldStyles';
import { TOKEN } from '../lib/styleDefaults';
import { InlineLoading } from '../lib/ui2/loading/look';
import '../styles/ui2-choice.css';

// UI 2.0's Switch (Ui2/Switch/Switch.tsx) on the pack's CSS: a switch with its label and help text, value exposed.
export const Switch = () => {
  const [label] = ToolJet.useStateString({ name: 'label', label: 'Label', initialValue: 'Enabled' });
  const [description] = ToolJet.useStateString({ name: 'description', label: 'Help text', initialValue: '' });
  const [defaultChecked] = ToolJet.useStateBoolean({ name: 'defaultChecked', label: 'On by default', initialValue: false });
  // Exposed value, and the pack's earlier name for it (also its default).
  const [, setValue] = ToolJet.useStateBoolean({ name: 'value', initialValue: false, inspector: 'hidden' });
  const [legacyChecked, setLegacyChecked] = ToolJet.useStateBoolean({ name: 'checked', initialValue: false, inspector: 'hidden' });
  const [disabledProp] = ToolJet.useStateBoolean({ name: 'disabled', label: 'Disable', initialValue: false, inspector: 'hidden' });
  const onChange = ToolJet.useEventCallback({ name: 'onChange' });
  const accentColor = useColorStyle('accentColor', 'Switch on color', TOKEN.brand);
  const labelColor = useColorStyle('labelColor', 'Label color', TOKEN.text);
  const helpTextColor = useColorStyle('helpTextColor', 'Help text color', TOKEN.mutedText);
  const offColor = useColorStyle('offColor', 'Switch off color', TOKEN.border);
  const textColor = ToolJet.useStyleString({ name: 'textColor', label: 'Label color (earlier name)', inspector: 'hidden', initialValue: '' });
  ToolJet.useComponentSettings({ defaultWidth: 8, defaultHeight: 3 });
  const { disabled, loading } = useBusy(disabledProp);
  const hostId = ToolJet.useFieldId();
  const ownId = useId();
  const id = hostId ?? ownId;

  const [checked, setChecked, checkedRef] = useLiveState(() => defaultChecked === true || legacyChecked === true);
  useResetOn(defaultChecked, () => setChecked(defaultChecked === true));
  useEffect(() => {
    setValue(checked);
    setLegacyChecked(checked);
  }, [checked]); // eslint-disable-line react-hooks/exhaustive-deps

  const set = (next: boolean) => {
    if (next === checkedRef.current) return;
    setChecked(next);
    setValue(next);
    setLegacyChecked(next);
    onChange();
  };
  ToolJet.useAction({ name: 'toggle', displayName: 'Toggle' }, () => set(!checkedRef.current));
  ToolJet.useAction(
    { name: 'setValue', displayName: 'Set value', params: [{ handle: 'value', displayName: 'Value', type: 'toggle', defaultValue: true }] },
    (next) => set(String(next) === 'true')
  );

  const vars = lookVars({ '--ui-primary': accentColor, '--lk-label': labelColor || textColor, '--lk-help': helpTextColor, '--lk-off': offColor });
  return (
    <div className="ui uc" style={vars}>
      <InlineLoading loading={loading}>
        <CheckedRow
          htmlFor={id}
          label={label}
          description={description}
          control={
            <SwitchPrimitive.Root
              id={id}
              className="ui-switch ui-focus"
              checked={checked}
              disabled={disabled}
              aria-describedby={description ? `${id}-note` : undefined}
              onCheckedChange={set}
            >
              <SwitchPrimitive.Thumb className="ui-switch-thumb" />
            </SwitchPrimitive.Root>
          }
        />
      </InlineLoading>
    </div>
  );
};
