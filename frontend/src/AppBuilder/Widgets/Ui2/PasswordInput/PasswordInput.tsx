import React, { useRef, useState } from 'react';
import { Eye, EyeOff } from 'lucide-react';
import { Field, HELP } from '@/AppBuilder/Widgets/Ui2/_shared/field';
import { Shell, busy } from '@/AppBuilder/Widgets/Ui2/_shared/Shell';
import { useTextBox, useValidation, useValue } from '@/AppBuilder/Widgets/Ui2/_shared/formHooks';
import { useExposed, useAutoHeight, withControlState } from '@/AppBuilder/Widgets/Ui2/_shared/packHooks';
import { cn } from '@/AppBuilder/Widgets/Ui2/_shared/ui';
import * as M from '@/AppBuilder/Widgets/Ui2/_inputs/inputsModel';
import { Group, INNER, text } from '@/AppBuilder/Widgets/Ui2/_inputs/inputParts';
import type { PasswordStrength } from '@/AppBuilder/Widgets/Ui2/_inputs/inputsModel';
import type { WidgetProps } from '@/AppBuilder/Widgets/Ui2/_shared/types';

// ---- Password input ------------------------------------------------------------------------------------------------

const STRENGTH_BAR: Partial<Record<PasswordStrength['level'], string>> = {
  weak: 'bg-[color:var(--lk-weak,var(--sc-destructive))]',
  fair: 'bg-[color:var(--lk-fair,var(--sc-warning))]',
  strong: 'bg-[color:var(--lk-strong,var(--sc-success))]',
};

export const STRENGTH_TEXT: Partial<Record<PasswordStrength['level'], string>> = {
  weak: 'text-[color:var(--lk-weak,var(--sc-destructive))]',
  fair: 'text-[color:var(--lk-fair,var(--sc-warning))]',
  strong: 'text-[color:var(--lk-strong,var(--sc-success))]',
};

export const ShadPasswordInput = (props: WidgetProps) => {
  // Fields fit their content (label, help text, validation message), so nothing below is overlapped.
  const fit = useRef<HTMLDivElement>(null);
  useAutoHeight(props, fit);
  const { properties, setExposedVariable, setExposedVariables, fireEvent, id } = props;
  const [value, change] = useValue(props, text(properties.defaultValue), (set) => ({
    setText: async (t: unknown) => set(text(t)),
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
    <Shell {...props} innerRef={fit}>
      <Field
        id={`shad-${id}`}
        label={properties.label}
        description={properties.description}
        error={check.error}
        required={check.required}
      >
        <Group disabled={disabled}>
          <input
            ref={textBox.ref}
            id={`shad-${id}`}
            type={visible ? 'text' : 'password'}
            autoComplete={properties.showStrength === true ? 'new-password' : 'current-password'}
            aria-invalid={!!check.error || undefined}
            className={cn(INNER, properties.showToggle !== false && 'pr-1')}
            value={value}
            placeholder={text(properties.placeholder)}
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
              className="flex w-9 shrink-0 items-center justify-center p-0 text-[color:var(--lk-icon,var(--sc-muted-foreground))] transition-colors hover:text-[color:var(--lk-fg,var(--sc-foreground))] focus:outline-none focus-visible:text-[color:var(--lk-fg,var(--sc-foreground))] disabled:pointer-events-none"
              disabled={disabled}
              onMouseDown={(e) => e.preventDefault()}
              onClick={() => setVisible((v) => !v)}
            >
              {visible ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
            </button>
          ) : null}
        </Group>
        {meter ? (
          <div className="flex items-center gap-3" data-strength={strength.level || 'empty'}>
            <div className="flex flex-1 gap-1" aria-hidden="true">
              {[0, 1, 2].map((i) => (
                <div
                  key={i}
                  className={cn(
                    'h-1 flex-1 rounded-full transition-colors',
                    i < strength.segments ? STRENGTH_BAR[strength.level] : 'bg-[color:var(--lk-track,var(--sc-muted))]'
                  )}
                />
              ))}
            </div>
            <span
              aria-live="polite"
              className={cn('min-w-[3rem] text-right text-xs font-medium', STRENGTH_TEXT[strength.level] || HELP)}
            >
              {strength.label}
            </span>
          </div>
        ) : null}
      </Field>
    </Shell>
  );
};

export default withControlState(ShadPasswordInput);
