import React, { useRef, useState } from 'react';
import { Eye, EyeOff } from 'lucide-react';
import { FormField, HELP } from '@/AppBuilder/Widgets/Ui2/_shared/field';
import { busy } from '@/AppBuilder/Widgets/Ui2/_shared/Shell';
import { useTextBox, useValidation, useValue } from '@/AppBuilder/Widgets/Ui2/_shared/formHooks';
import { useExposed, useAutoHeight, withControlState } from '@/AppBuilder/Widgets/Ui2/_shared/packHooks';
import { cn } from '@/AppBuilder/Widgets/Ui2/_shared/ui';
import * as M from '@/AppBuilder/Widgets/Ui2/_inputs/inputsModel';
import { Group, INNER } from '@/AppBuilder/Widgets/Ui2/_inputs/inputParts';
import type { PasswordStrength } from '@/AppBuilder/Widgets/Ui2/_inputs/inputsModel';
import type { WidgetProps } from '@/AppBuilder/Widgets/Ui2/_shared/types';
import { toText } from '@/AppBuilder/Widgets/Ui2/_shared/values';

// ---- Password input ------------------------------------------------------------------------------------------------

const STRENGTH_BAR: Partial<Record<PasswordStrength['level'], string>> = {
  weak: 'tw-bg-[color:var(--lk-weak,var(--sc-destructive))]',
  fair: 'tw-bg-[color:var(--lk-fair,var(--sc-warning))]',
  strong: 'tw-bg-[color:var(--lk-strong,var(--sc-success))]',
};

export const STRENGTH_TEXT: Partial<Record<PasswordStrength['level'], string>> = {
  weak: 'tw-text-[color:var(--lk-weak,var(--sc-destructive))]',
  fair: 'tw-text-[color:var(--lk-fair,var(--sc-warning))]',
  strong: 'tw-text-[color:var(--lk-strong,var(--sc-success))]',
};

export const ShadPasswordInput = (props: WidgetProps) => {
  // Fields fit their content (label, help text, validation message), so nothing below is overlapped.
  const fit = useRef<HTMLDivElement>(null);
  useAutoHeight(props, fit);
  const { properties, setExposedVariable, setExposedVariables, fireEvent, id } = props;
  const [value, change] = useValue(props, toText(properties.defaultValue), (set) => ({
    setText: async (t: unknown) => set(toText(t)),
    clear: async () => set(''),
  }));
  const strength = M.passwordStrength(value);
  useExposed(setExposedVariables, properties, { strength: strength.level });
  const onChange = (next: string) => {
    setExposedVariable('strength', M.passwordStrength(next).level);
    change(next);
  };
  const check = useValidation(props, value, () => onChange(''));
  const textBox = useTextBox(props, check.touch);
  const [visible, setVisible] = useState(false);
  const disabled = busy(properties);
  const loading = !!properties.loadingState;
  const meter = properties.showStrength === true && !loading;
  return (
    <FormField props={props} properties={properties} check={check} innerRef={fit}>
      <Group disabled={disabled}>
        <input
          ref={textBox.ref}
          id={`shad-${id}`}
          type={visible ? 'text' : 'password'}
          autoComplete={properties.showStrength === true ? 'new-password' : 'current-password'}
          aria-invalid={!!check.error || undefined}
          className={cn(INNER, properties.showToggle !== false && 'tw-pr-1')}
          value={value}
          placeholder={toText(properties.placeholder)}
          disabled={disabled}
          onFocus={textBox.onFocus}
          onBlur={textBox.onBlur}
          onChange={(e) => onChange(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && fireEvent('onEnterPressed')}
        />
        {properties.showToggle !== false && !loading ? (
          <button
            type="button"
            aria-label={visible ? 'Hide password' : 'Show password'}
            aria-pressed={visible}
            className="tw-flex tw-w-9 tw-shrink-0 tw-items-center tw-justify-center tw-p-0 tw-text-[color:var(--lk-icon,var(--sc-muted-foreground))] tw-transition-colors hover:tw-text-[color:var(--lk-fg,var(--sc-foreground))] focus:tw-outline-none focus-visible:tw-text-[color:var(--lk-fg,var(--sc-foreground))] disabled:tw-pointer-events-none"
            disabled={disabled}
            onMouseDown={(e) => e.preventDefault()}
            onClick={() => setVisible((v) => !v)}
          >
            {visible ? <EyeOff className="tw-h-4 tw-w-4" /> : <Eye className="tw-h-4 tw-w-4" />}
          </button>
        ) : null}
      </Group>
      {meter ? (
        <div className="tw-flex tw-items-center tw-gap-3" data-strength={strength.level || 'empty'}>
          <div className="tw-flex tw-flex-1 tw-gap-1" aria-hidden="true">
            {[0, 1, 2].map((i) => (
              <div
                key={i}
                className={cn(
                  'tw-h-1 tw-flex-1 tw-rounded-full tw-transition-colors',
                  i < strength.segments ? STRENGTH_BAR[strength.level] : 'tw-bg-[color:var(--lk-track,var(--sc-muted))]'
                )}
              />
            ))}
          </div>
          <span
            aria-live="polite"
            className={cn(
              'tw-min-w-[3rem] tw-text-right tw-text-xs tw-font-medium',
              STRENGTH_TEXT[strength.level] || HELP
            )}
          >
            {strength.label}
          </span>
        </div>
      ) : null}
    </FormField>
  );
};

export default withControlState(ShadPasswordInput);
