import React, { useRef, useState } from 'react';
import { Minus } from 'lucide-react';
import { Field, fieldAria } from '../lib/Field';
import { cn } from '../lib/cn';
import { ToolJet } from '@tooljet/custom-component-sdk';
import { field, useLooks } from '../lib/ui2/inputs/looks';
import type { Look } from '../lib/ui2/inputs/looks';
import { TOKEN } from '../lib/styleDefaults';
import { useReseed } from '../lib/ui2/inputs/parts';
import * as M from '../lib/ui2/inputs/model';
import { FieldLoading } from '../lib/ui2/loading/look';
import { useValueSetter } from '../lib/sameValue';
import '../styles/ui2-inputs.css';

const LOOKS: Look[] = [
  ...field(),
  ['separatorColor', 'Separator color', '--lk-sep', TOKEN.mutedText],
  ['slotSize', 'Box size', '--lk-slot', 36],
];

// One hidden input over the boxes takes the typing, pasting and the phone's one-time-code autofill (UI 2.0's input-otp
// way); the boxes only draw it.
export const OtpInput = () => {
  const [label] = ToolJet.useStateString({ name: 'label', label: 'Label', initialValue: 'Verification code' });
  const [description] = ToolJet.useStateString({ name: 'description', label: 'Help text', initialValue: '' });
  const [length] = ToolJet.useStateNumber({ name: 'length', label: 'Length (4 to 8)', initialValue: 6 });
  const [characters] = ToolJet.useStateEnumeration({
    name: 'characters',
    label: 'Characters',
    enumDefinition: ['numeric', 'alphanumeric'],
    enumLabels: { numeric: 'Digits', alphanumeric: 'Letters and digits' },
    initialValue: 'numeric',
    inspector: 'switch',
  });
  const [separator] = ToolJet.useStateBoolean({
    name: 'separator',
    label: 'Separator in the middle',
    initialValue: false,
  });
  const [slotStyle] = ToolJet.useStateEnumeration({
    name: 'slotStyle',
    label: 'Boxes',
    enumDefinition: ['joined', 'separate'],
    enumLabels: { joined: 'Joined', separate: 'Separate' },
    initialValue: 'joined',
    inspector: 'switch',
  });
  const [masked] = ToolJet.useStateBoolean({ name: 'masked', label: 'Mask characters', initialValue: false });
  const [placeholder] = ToolJet.useStateString({
    name: 'placeholder',
    label: 'Placeholder (one character per box)',
    initialValue: '',
  });
  const [defaultValue] = ToolJet.useStateString({ name: 'defaultValue', label: 'Default value', initialValue: '' });
  const [rawValue, setValue] = ToolJet.useStateString({ name: 'value', initialValue: '', inspector: 'hidden' });
  const [, setIsComplete] = ToolJet.useStateBoolean({ name: 'isComplete', initialValue: false, inspector: 'hidden' });
  const [legacyDisabled] = ToolJet.useStateBoolean({
    name: 'disabled',
    label: 'Disable',
    initialValue: false,
    inspector: 'hidden',
  });
  const onChange = ToolJet.useEventCallback({ name: 'onChange' });
  const onComplete = ToolJet.useEventCallback({ name: 'onComplete' });
  const onFocus = ToolJet.useEventCallback({ name: 'onFocus' });
  const onBlur = ToolJet.useEventCallback({ name: 'onBlur' });

  const inputRef = useRef<HTMLInputElement>(null);
  const [focused, setFocused] = useState(false);
  const size = M.otpLength(length);
  const kind = characters === 'alphanumeric' ? 'alphanumeric' : 'numeric';
  const code = M.otpSanitize(rawValue, size, kind);

  const publish = (next: string) => {
    setValue(next);
    setIsComplete(next.length === size);
  };
  // From the latest code, so a second call in one batch compares with the first's (lib/sameValue).
  const codeSetter = useValueSetter(code, publish);
  /** Fills the boxes from an action (setText, clear): onChange only when the code changes. */
  const fill = (next: string) => {
    rule.touch();
    if (codeSetter.set(next)) onChange();
  };
  const change = (raw: string) => {
    const next = M.otpSanitize(raw, size, kind);
    if (!codeSetter.set(next)) return;
    onChange();
    if (next.length === size) onComplete();
  };
  // A new default starts the code again, an empty one included (useReseed already leaves an app's own `value` alone
  // on mount when the default is empty); a new length or kind of character keeps what was typed, cut to fit.
  useReseed(defaultValue, () => publish(M.otpSanitize(defaultValue, size, kind)));
  useReseed([size, kind], () => publish(M.otpSanitize(rawValue, size, kind)), { onMount: false });
  // A Form's clear empties `value` itself, without publish(), and would leave isComplete true over an empty code.
  ToolJet.useFormClear(() => publish(''));

  ToolJet.useAction({ name: 'clear', displayName: 'Clear' }, () => fill(''));
  ToolJet.useAction({ name: 'setFocus', displayName: 'Set focus' }, () => inputRef.current?.focus());
  ToolJet.useAction({ name: 'setBlur', displayName: 'Set blur' }, () => inputRef.current?.blur());
  ToolJet.useAction(
    { name: 'setText', displayName: 'Set text', params: [{ handle: 'value', displayName: 'Value' }] },
    (v) => fill(M.otpSanitize(v, size, kind))
  );

  const fieldId = ToolJet.useFieldId();
  const control = ToolJet.useControlState();
  const rule = ToolJet.useValidation({
    kind: 'text',
    value: code,
    rule: code && code.length < size ? `Enter all ${size} characters` : '',
  });
  const looks = useLooks(LOOKS);
  ToolJet.useComponentSettings({ role: 'otpinput', fit: true, loading: 'own', defaultWidth: 10, defaultHeight: 7 });

  const disabled = legacyDisabled || control.disabled;
  const joined = slotStyle !== 'separate';
  // One character per box: box i shows the placeholder's i-th character ('123456' reads 1 2 3 4 5 6). A single
  // character fills every box, so '-' still draws a dash in each.
  const hints = Array.from(String(placeholder ?? ''));
  const hintAt = (i: number) => (hints.length === 1 ? hints[0] : (hints[i] ?? ''));
  const active = focused ? Math.min(code.length, size - 1) : -1;
  const half = Math.ceil(size / 2);
  const groups =
    separator === true
      ? [
          [0, half],
          [half, size],
        ]
      : [[0, size]];
  const slot = (i: number) => {
    const char = code[i];
    const hint = hintAt(i);
    return (
      <div key={i} data-slot="otp" className={cn('ui2-otp-slot', i === active && 'is-active')}>
        {char ? masked === true ? '•' : char : hint ? <span className="ui2-otp-placeholder">{hint}</span> : null}
        {i === active && !char ? <div className="ui2-otp-caret" /> : null}
      </div>
    );
  };

  return (
    <div className="ui ui2-in" style={looks}>
      <Field label={label} description={description} htmlFor={fieldId} error={rule.error} required={rule.required}>
        <FieldLoading loading={control.loading}>
          <div className={cn('ui2-otp', disabled && 'is-disabled')}>
            {groups.map(([from, to], g) => (
              <React.Fragment key={g}>
                {g > 0 ? (
                  <div role="separator" className="ui2-otp-sep">
                    <Minus size={16} />
                  </div>
                ) : null}
                <div className={cn('ui2-otp-group', joined ? 'is-joined' : 'is-separate')}>
                  {Array.from({ length: to - from }, (_, k) => slot(from + k))}
                </div>
              </React.Fragment>
            ))}
            <input
              ref={inputRef}
              {...fieldAria(fieldId, rule.error, rule.required, !!description)}
              aria-label={label || 'One-time code'}
              inputMode={kind === 'numeric' ? 'numeric' : 'text'}
              autoComplete="one-time-code"
              autoCapitalize="characters"
              spellCheck={false}
              className="ui2-otp-input"
              value={code}
              disabled={disabled}
              onChange={(e) => change(e.target.value)}
              onFocus={() => {
                setFocused(true);
                onFocus();
              }}
              onBlur={() => {
                setFocused(false);
                rule.touch();
                onBlur();
              }}
              onSelect={(e) => {
                // The caret stays at the end (select-all is kept, so a paste replaces the code).
                const el = e.currentTarget;
                const end = el.value.length;
                const all = el.selectionStart === 0 && el.selectionEnd === end;
                if (!all && (el.selectionStart !== end || el.selectionEnd !== end)) el.setSelectionRange(end, end);
              }}
            />
          </div>
        </FieldLoading>
      </Field>
    </div>
  );
};
