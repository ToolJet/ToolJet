import React, { useEffect, useRef, useState } from 'react';
import { useAutoHeight, useExposed, withControlState } from '@/AppBuilder/Widgets/Ui2/_shared/packHooks';
import { Field } from '@/AppBuilder/Widgets/Ui2/_shared/field';
import { Shell, busy } from '@/AppBuilder/Widgets/Ui2/_shared/Shell';
import { Spinner } from '@/AppBuilder/Widgets/Ui2/_shared/loadingLook';
import { useValidation } from '@/AppBuilder/Widgets/Ui2/_shared/formHooks';
import { buttonVariants, cn } from '@/AppBuilder/Widgets/Ui2/_shared/ui';
import { whenSet } from '@/AppBuilder/Widgets/Ui2/_shared/looks/shadcnLook';
import {
  groupButtons,
  initialSelection,
  selectionExposed,
  toggleSelection,
} from '@/AppBuilder/Widgets/Ui2/_actions/actionsModel';
import { stringify } from '@/AppBuilder/Widgets/Ui2/_shared/packJson';
import { Icon, SIZES, useLive } from '@/AppBuilder/Widgets/Ui2/_actions/actionParts';

// ---- Button group ------------------------------------------------------------------------------------------------

const GROUP_MODES = ['actions', 'single', 'multiple'];

export const GROUP_VARIANTS = ['outline', 'secondary', 'default', 'ghost'];

export const SQUARE = { sm: 'w-8 px-0', default: 'w-9 px-0', lg: 'w-10 px-0' };

// Attached buttons: inner corners squared, one border between neighbours (outline) or a hairline divider (filled).
export const ATTACHED = {
  horizontal: '[&>*:not(:first-child)]:rounded-l-none [&>*:not(:last-child)]:rounded-r-none [&>*:focus-visible]:z-10',
  vertical: '[&>*:not(:first-child)]:rounded-t-none [&>*:not(:last-child)]:rounded-b-none [&>*:focus-visible]:z-10',
};

export const JOIN = {
  horizontal: {
    outline: '[&>*:not(:first-child)]:border-l-0',
    filled:
      '[&>*:not(:first-child)]:border-l [&>*:not(:first-child)]:border-solid [&>*:not(:first-child)]:border-l-[color:var(--lk-border,color-mix(in_srgb,currentColor_16%,transparent))]',
  },
  vertical: {
    outline: '[&>*:not(:first-child)]:border-t-0',
    filled:
      '[&>*:not(:first-child)]:border-t [&>*:not(:first-child)]:border-solid [&>*:not(:first-child)]:border-t-[color:var(--lk-border,color-mix(in_srgb,currentColor_16%,transparent))]',
  },
};

export const SELECTED =
  'data-[state=on]:bg-[color:var(--lk-on-bg,var(--sc-primary))] data-[state=on]:text-[color:var(--lk-on-fg,var(--sc-primary-foreground))] data-[state=on]:hover:bg-[color:var(--lk-on-bg,var(--sc-primary))] data-[state=on]:hover:text-[color:var(--lk-on-fg,var(--sc-primary-foreground))] data-[state=on]:border-[color:var(--lk-on-bg,var(--sc-primary))]';

// A primary-filled group marks its selection a shade darker.
export const SELECTED_ON_PRIMARY =
  'data-[state=on]:bg-[color:var(--lk-on-bg,color-mix(in_srgb,var(--sc-primary)_75%,#000))] data-[state=on]:text-[color:var(--lk-on-fg,var(--sc-primary-foreground))] data-[state=on]:hover:bg-[color:var(--lk-on-bg,color-mix(in_srgb,var(--sc-primary)_75%,#000))]';

export const ShadButtonGroup = (props) => {
  const { properties, styles, setExposedVariable, setExposedVariables, fireEvent } = props;
  const ref = useRef(null);
  useAutoHeight(props, ref);
  const mode = GROUP_MODES.includes(properties.mode) ? properties.mode : 'single';
  const buttons = groupButtons(properties.buttons);
  const keys = stringify(buttons.map((b) => String(b.value)));
  const initial = initialSelection(properties.defaultValue, mode, buttons);
  const initialKey = stringify(initial);
  const [selected, setSelected] = useState(initial);
  useEffect(() => setSelected(initial), [initialKey, mode, keys]); // eslint-disable-line react-hooks/exhaustive-deps
  const [lastClicked, setLastClicked] = useState(null);
  const live = useLive({ mode, buttons });
  const exposed = selectionExposed(selected, mode, buttons);
  const apply = (next) => {
    setSelected(next);
    setExposedVariables(selectionExposed(next, live.current.mode, live.current.buttons));
  };
  useExposed(setExposedVariables, properties, {
    ...exposed,
    lastClicked,
    setSelected: async (v) => apply(initialSelection(v, live.current.mode, live.current.buttons)),
    clear: async () => apply([]),
  });
  const check = useValidation(
    props,
    mode === 'multiple' ? exposed.values : mode === 'single' ? exposed.value : lastClicked?.value ?? '',
    () => apply([])
  );
  const variant = GROUP_VARIANTS.includes(properties.variant) ? properties.variant : 'outline';
  const size = SIZES.includes(properties.size) ? properties.size : 'default';
  const orientation = properties.orientation === 'vertical' ? 'vertical' : 'horizontal';
  const fullWidth = properties.fullWidth === true;
  const disabled = busy(properties);
  const click = (button) => {
    const info = { label: button.label, value: button.value };
    setLastClicked(info);
    setExposedVariable('lastClicked', info);
    const next = toggleSelection(selected, String(button.value), mode, properties.allowDeselect === true);
    const changed = stringify(next) !== stringify(selected);
    if (changed) apply(next);
    check.touch();
    fireEvent('onClick');
    if (changed) fireEvent('onChange');
  };
  const on = new Set(selected);
  return (
    <Shell {...props} innerRef={ref}>
      <Field
        label={properties.label}
        description={properties.description}
        error={check.error}
        required={check.required}
      >
        {buttons.length ? (
          <div className={cn('flex items-center gap-3', fullWidth && 'w-full')}>
            <div
              role="group"
              aria-label={properties.label ? String(properties.label) : 'Button group'}
              className={cn(
                'inline-flex w-fit items-stretch',
                orientation === 'vertical' ? 'flex-col' : 'flex-row',
                fullWidth && 'flex w-full',
                variant === 'outline' && 'rounded-[var(--lk-radius,calc(var(--sc-radius)-2px))] shadow-sm',
                ATTACHED[orientation],
                JOIN[orientation][variant === 'outline' ? 'outline' : variant === 'ghost' ? 'ghost' : 'filled']
              )}
            >
              {buttons.map((button) => {
                const isOn = mode !== 'actions' && on.has(String(button.value));
                const own = button.variant || variant;
                return (
                  <button
                    key={String(button.value)}
                    type="button"
                    data-state={mode === 'actions' ? undefined : isOn ? 'on' : 'off'}
                    aria-pressed={mode === 'actions' ? undefined : isOn}
                    disabled={disabled || button.disabled}
                    title={button.tooltip || (!button.label ? String(button.value) : undefined)}
                    aria-label={!button.label ? String(button.value) : undefined}
                    onClick={() => click(button)}
                    className={cn(
                      buttonVariants({ variant: own, size }),
                      'shadow-none rounded-[var(--lk-radius,calc(var(--sc-radius)-2px))]',
                      !button.label && button.icon && SQUARE[size],
                      fullWidth && 'flex-1',
                      orientation === 'vertical' && 'justify-start',
                      whenSet(styles, 'backgroundColor', 'bg-[color:var(--lk-bg)]'),
                      whenSet(styles, 'textColor', 'text-[color:var(--lk-fg)]'),
                      own === 'outline' && whenSet(styles, 'borderColor', 'border-[color:var(--lk-border)]'),
                      whenSet(styles, 'hoverBackgroundColor', 'hover:bg-[color:var(--lk-hover)]'),
                      own === 'default' ? SELECTED_ON_PRIMARY : SELECTED,
                      isOn && 'font-semibold'
                    )}
                  >
                    {button.icon ? (
                      <Icon
                        name={button.icon}
                        className={isOn ? undefined : 'text-[color:var(--lk-icon,currentColor)]'}
                      />
                    ) : null}
                    {button.label ? <span className="truncate">{button.label}</span> : null}
                  </button>
                );
              })}
            </div>
            {properties.loadingState ? <Spinner /> : null}
          </div>
        ) : (
          <p className="text-sm text-[color:var(--sc-muted-foreground)]">No buttons</p>
        )}
      </Field>
    </Shell>
  );
};

export default withControlState(ShadButtonGroup);
