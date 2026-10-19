import React, { useEffect, useRef, useState } from 'react';
import isEqual from 'lodash/isEqual';
import {
  missingIsGone,
  runNow,
  useAutoHeight,
  useExposed,
  useLatest,
  useStable,
  withControlState,
} from '@/AppBuilder/Widgets/Ui2/_shared/packHooks';
import { Field, controlAria, fieldIdOf } from '@/AppBuilder/Widgets/Ui2/_shared/field';
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
import { Icon, SIZES } from '@/AppBuilder/Widgets/Ui2/_actions/actionParts';
import type { GroupButton, Text } from '@/AppBuilder/Widgets/Ui2/_actions/actionsModel';
import type { WidgetProps } from '@/AppBuilder/Widgets/Ui2/_shared/types';

// ---- Button group ------------------------------------------------------------------------------------------------

const GROUP_MODES = ['actions', 'single', 'multiple'];

export const GROUP_VARIANTS = ['outline', 'secondary', 'default', 'ghost'];

export const SQUARE: Record<string, string> = {
  sm: 'tw-w-8 tw-px-0',
  default: 'tw-w-9 tw-px-0',
  lg: 'tw-w-10 tw-px-0',
};

// Attached buttons: inner corners squared, one border between neighbours (outline) or a hairline divider (filled).
export const ATTACHED = {
  horizontal:
    '[&>*:not(:first-child)]:tw-rounded-l-none [&>*:not(:last-child)]:tw-rounded-r-none [&>*:focus-visible]:tw-z-10',
  vertical:
    '[&>*:not(:first-child)]:tw-rounded-t-none [&>*:not(:last-child)]:tw-rounded-b-none [&>*:focus-visible]:tw-z-10',
};

export const JOIN: Record<'horizontal' | 'vertical', Record<string, string>> = {
  horizontal: {
    outline: '[&>*:not(:first-child)]:tw-border-l-0',
    filled:
      '[&>*:not(:first-child)]:tw-border-l [&>*:not(:first-child)]:tw-border-solid [&>*:not(:first-child)]:tw-border-l-[color:var(--lk-border,color-mix(in_srgb,currentColor_16%,transparent))]',
  },
  vertical: {
    outline: '[&>*:not(:first-child)]:tw-border-t-0',
    filled:
      '[&>*:not(:first-child)]:tw-border-t [&>*:not(:first-child)]:tw-border-solid [&>*:not(:first-child)]:tw-border-t-[color:var(--lk-border,color-mix(in_srgb,currentColor_16%,transparent))]',
  },
};

export const SELECTED =
  'data-[state=on]:tw-bg-[color:var(--lk-on-bg,var(--sc-primary))] data-[state=on]:tw-text-[color:var(--lk-on-fg,var(--sc-primary-foreground))] data-[state=on]:hover:tw-bg-[color:var(--lk-on-bg,var(--sc-primary))] data-[state=on]:hover:tw-text-[color:var(--lk-on-fg,var(--sc-primary-foreground))] data-[state=on]:tw-border-[color:var(--lk-on-bg,var(--sc-primary))]';

// A primary-filled group marks its selection a shade darker.
export const SELECTED_ON_PRIMARY =
  'data-[state=on]:tw-bg-[color:var(--lk-on-bg,color-mix(in_srgb,var(--sc-primary)_75%,#000))] data-[state=on]:tw-text-[color:var(--lk-on-fg,var(--sc-primary-foreground))] data-[state=on]:hover:tw-bg-[color:var(--lk-on-bg,color-mix(in_srgb,var(--sc-primary)_75%,#000))]';

export const ShadButtonGroup = (props: WidgetProps) => {
  const { properties, styles, setExposedVariable, setExposedVariables, fireEvent } = props;
  const ref = useRef<HTMLDivElement>(null);
  useAutoHeight(props, ref);
  const mode = GROUP_MODES.includes(properties.mode) ? properties.mode : 'single';
  const buttons = groupButtons(properties.buttons);
  // A new default or mode starts the selection again. A new set of buttons keeps a choice the user (or an action) made,
  // dropping a button that is gone (it does not come back when the button does); until a choice is made it keeps
  // following the default, so a default whose buttons arrive later (a query still loading) is applied.
  const keys = useStable(buttons.map((b) => String(b.value)));
  const defaultValue = useStable(properties.defaultValue);
  const [selected, setSelected] = useState(() => initialSelection(properties.defaultValue, mode, buttons));
  const chosen = useRef(false);
  const live = useLatest({ mode, buttons, defaultValue });
  useEffect(() => {
    chosen.current = false;
    setSelected(initialSelection(defaultValue, mode, live.current.buttons));
  }, [defaultValue, mode, live]);
  useEffect(() => {
    if (!chosen.current) {
      setSelected(initialSelection(live.current.defaultValue, live.current.mode, live.current.buttons));
      return;
    }
    // An empty set of buttons (a query rerunning) removes nothing: the choice comes back with its button.
    if (!missingIsGone(keys.length)) return;
    setSelected((current) =>
      current.every((k) => keys.includes(k)) ? current : current.filter((k) => keys.includes(k))
    );
  }, [keys, live]);
  const [lastClicked, setLastClicked] = useState<{ label: string; value: Text } | null>(null);
  const exposed = selectionExposed(selected, mode, buttons);
  const apply = (next: string[]) => {
    chosen.current = true;
    setSelected(next);
    setExposedVariables(selectionExposed(next, live.current.mode, live.current.buttons));
  };
  useExposed(setExposedVariables, properties, {
    ...exposed,
    lastClicked,
    setSelected: async (v: unknown) => apply(initialSelection(v, live.current.mode, live.current.buttons)),
    clear: async () => apply([]),
  });
  // A Form's clearForm empties what validity reads: the selection, and in actions mode the last click (a mandatory
  // actions group stayed valid after the clear).
  const clearField = () => {
    apply([]);
    if (live.current.mode !== 'actions') return;
    setLastClicked(null);
    setExposedVariable('lastClicked', null);
  };
  const check = useValidation(props, mode === 'actions' ? lastClicked?.value ?? '' : exposed.value, clearField);
  const variant = GROUP_VARIANTS.includes(properties.variant) ? properties.variant : 'outline';
  const size = SIZES.includes(properties.size) ? properties.size : 'default';
  const orientation = properties.orientation === 'vertical' ? 'vertical' : 'horizontal';
  const fullWidth = properties.fullWidth === true;
  const disabled = busy(properties);
  const click = (button: GroupButton) =>
    runNow(() => {
      const info = { label: button.label, value: button.value };
      setLastClicked(info);
      setExposedVariable('lastClicked', info);
      const next = toggleSelection(selected, String(button.value), mode, properties.allowDeselect === true);
      const changed = !isEqual(next, selected);
      if (changed) apply(next);
      check.touch();
      fireEvent('onClick');
      if (changed) fireEvent('onChange');
    });
  const on = new Set(selected);
  return (
    <Shell {...props} innerRef={ref}>
      <Field
        id={fieldIdOf(props)}
        label={properties.label}
        description={properties.description}
        error={check.error}
        required={check.required}
      >
        {buttons.length ? (
          <div className={cn('tw-flex tw-items-center tw-gap-3', fullWidth && 'tw-w-full')}>
            <div
              id={fieldIdOf(props)}
              role="group"
              aria-label={properties.label ? String(properties.label) : 'Button group'}
              {...controlAria(props, check.error)}
              className={cn(
                'tw-inline-flex tw-w-fit tw-items-stretch',
                orientation === 'vertical' ? 'tw-flex-col' : 'tw-flex-row',
                fullWidth && 'tw-flex tw-w-full',
                variant === 'outline' && 'tw-rounded-[var(--lk-radius,calc(var(--sc-radius)-2px))] tw-shadow-sm',
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
                      'tw-shadow-none tw-rounded-[var(--lk-radius,calc(var(--sc-radius)-2px))]',
                      !button.label && button.icon && SQUARE[size],
                      fullWidth && 'tw-flex-1',
                      orientation === 'vertical' && 'tw-justify-start',
                      whenSet(styles, 'backgroundColor', 'tw-bg-[color:var(--lk-bg)]'),
                      whenSet(styles, 'textColor', 'tw-text-[color:var(--lk-fg)]'),
                      own === 'outline' && whenSet(styles, 'borderColor', 'tw-border-[color:var(--lk-border)]'),
                      whenSet(styles, 'hoverBackgroundColor', 'hover:tw-bg-[color:var(--lk-hover)]'),
                      own === 'default' ? SELECTED_ON_PRIMARY : SELECTED,
                      isOn && 'tw-font-semibold'
                    )}
                  >
                    {button.icon ? (
                      <Icon
                        name={button.icon}
                        className={isOn ? undefined : 'tw-text-[color:var(--lk-icon,currentColor)]'}
                      />
                    ) : null}
                    {button.label ? <span className="tw-truncate">{button.label}</span> : null}
                  </button>
                );
              })}
            </div>
            {properties.loadingState ? <Spinner /> : null}
          </div>
        ) : (
          <p className="tw-text-ui2-sm tw-text-[color:var(--sc-muted-foreground)]">No buttons</p>
        )}
      </Field>
    </Shell>
  );
};

export default withControlState(ShadButtonGroup);
