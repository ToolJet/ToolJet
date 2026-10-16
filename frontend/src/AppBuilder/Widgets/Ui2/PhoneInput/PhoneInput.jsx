import React, { useEffect, useMemo, useRef, useState } from 'react';
import { Command } from 'cmdk';
import PhoneNumberInput from 'react-phone-number-input/input';
import flags from 'react-phone-number-input/flags';
import { isValidPhoneNumber } from 'react-phone-number-input';
import { Check, ChevronsUpDown, Search } from 'lucide-react';
import { Field } from '@/AppBuilder/Widgets/Ui2/_shared/field';
import { Shell, busy } from '@/AppBuilder/Widgets/Ui2/_shared/Shell';
import { useTextBox, useValidation } from '@/AppBuilder/Widgets/Ui2/_shared/formHooks';
import { useExposed, useAutoHeight, withControlState } from '@/AppBuilder/Widgets/Ui2/_shared/packHooks';
import { Popover, PopoverContent, PopoverTrigger, cn } from '@/AppBuilder/Widgets/Ui2/_shared/ui';
import { lookVars } from '@/AppBuilder/Widgets/Ui2/_shared/looks/shadcnLook';
import * as M from '@/AppBuilder/Widgets/Ui2/_inputs/phoneModel';
import { stringify } from '@/AppBuilder/Widgets/Ui2/_shared/packJson';
import {
  ADDON,
  ADDON_HOVER,
  EDGE,
  Group,
  INNER,
  text,
  useLatest,
  withRule,
} from '@/AppBuilder/Widgets/Ui2/_inputs/inputParts';

export const BareInput = React.forwardRef((props, ref) => <input ref={ref} {...props} />);
BareInput.displayName = 'BareInput';

// ---- Phone input ---------------------------------------------------------------------------------------------------

const POPOVER_LIST = 'max-h-[300px] overflow-y-auto overflow-x-hidden';

export const COMMAND_ITEM =
  'relative flex cursor-default select-none items-center gap-2 rounded-sm px-2 py-1.5 text-sm outline-none data-[disabled=true]:pointer-events-none data-[selected=true]:bg-accent data-[selected=true]:text-accent-foreground data-[disabled=true]:opacity-50';

export const FlagIcon = ({ country, title }) => {
  const Flag = flags[country];
  return (
    <span className="flex h-4 w-6 shrink-0 overflow-hidden rounded-sm bg-[color:var(--sc-muted)] [&_svg]:h-full [&_svg]:w-full">
      {Flag ? <Flag title={title} /> : null}
    </span>
  );
};

export const ShadPhoneInput = (props) => {
  // Fields fit their content (label, help text, validation message), so nothing below is overlapped.
  const fit = useRef(null);
  useAutoHeight(props, fit);
  const { properties, setExposedVariables, fireEvent, id, componentType, styles } = props;
  const listKey = stringify(Array.isArray(properties.onlyCountries) ? properties.onlyCountries : null);
  const start = useMemo(
    () => M.phoneStart(properties.defaultValue, properties.defaultCountry, properties.onlyCountries),
    [text(properties.defaultValue), text(properties.defaultCountry), listKey] // eslint-disable-line react-hooks/exhaustive-deps
  );
  const { countries } = start;
  const [state, setState] = useState({ value: start.value, country: start.country });
  useEffect(() => setState({ value: start.value, country: start.country }), [start]);
  const stateRef = useLatest(state);
  const info = M.phoneInfo(state.value, state.country);
  const update = (next, fire = true) => {
    const prev = stateRef.current;
    if (next.value === prev.value && next.country === prev.country) return;
    stateRef.current = next;
    setState(next);
    if (!fire) return;
    setExposedVariables(M.phoneInfo(next.value, next.country));
    fireEvent('onChange');
  };
  const toCountry = (c) => {
    const prev = stateRef.current;
    return { country: c, value: M.rebasePhone(prev.value, prev.country, c) };
  };
  useExposed(setExposedVariables, properties, {
    ...info,
    // setValue(value, country), as the native Phone input takes it.
    setValue: async (v, c) => {
      const given = c === undefined || c === null || c === '' ? null : M.countryFromInput(c, countries);
      const prev = given ? { ...stateRef.current, country: given } : stateRef.current;
      const value = M.toPhoneValue(v, prev.country);
      const detected = M.phoneCountry(value, countries);
      update({ value, country: detected || prev.country }, false);
    },
    setCountryCode: async (c) => {
      const country = M.countryFromInput(c, countries);
      if (country) update(toCountry(country), false);
    },
    clear: async () => update({ ...stateRef.current, value: '' }, false),
  });
  const check = useValidation(
    withRule(props, (v) => (v && !isValidPhoneNumber(String(v)) ? 'Enter a valid phone number' : '')),
    state.value,
    () => update({ ...stateRef.current, value: '' })
  );
  const textBox = useTextBox(props, check.touch);
  const [open, setOpen] = useState(false);
  const disabled = busy(properties);
  const canChange = properties.isCountryChangeEnabled !== false && countries.length > 1;
  const showFlag = properties.showFlag !== false;
  const name = M.countryName(state.country);
  const code = M.callingCode(state.country);
  const vars = lookVars(componentType, styles);
  const current = (
    <>
      {showFlag ? <FlagIcon country={state.country} title={name} /> : null}
      <span className="tabular-nums">+{code}</span>
    </>
  );
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
          {canChange ? (
            <Popover open={open} onOpenChange={setOpen}>
              <PopoverTrigger asChild>
                <button
                  type="button"
                  aria-label={`Country: ${name}`}
                  disabled={disabled}
                  className={cn(ADDON, ADDON_HOVER, EDGE)}
                >
                  {current}
                  <ChevronsUpDown className="h-3.5 w-3.5 opacity-50" />
                </button>
              </PopoverTrigger>
              <PopoverContent
                className="w-[300px] p-0"
                align="start"
                style={vars}
                onCloseAutoFocus={(e) => {
                  e.preventDefault();
                  textBox.ref.current?.focus();
                }}
              >
                <Command className="flex h-full w-full flex-col overflow-hidden rounded-md bg-popover text-popover-foreground">
                  <div className="flex items-center border-b px-3">
                    <Search className="mr-2 h-4 w-4 shrink-0 opacity-50" />
                    <Command.Input
                      placeholder="Search country..."
                      className="flex h-10 w-full rounded-md border-0 bg-transparent py-3 text-sm text-[color:inherit] shadow-none outline-none placeholder:text-muted-foreground focus:outline-none"
                    />
                  </div>
                  <Command.List className={POPOVER_LIST}>
                    <Command.Empty className="py-6 text-center text-sm text-muted-foreground">
                      No country found.
                    </Command.Empty>
                    <Command.Group className="overflow-hidden p-1">
                      {countries.map((c) => {
                        const label = M.countryName(c);
                        return (
                          <Command.Item
                            key={c}
                            value={`${label} +${M.callingCode(c)} ${c}`}
                            className={COMMAND_ITEM}
                            onSelect={() => {
                              update(toCountry(c));
                              setOpen(false);
                            }}
                          >
                            {showFlag ? <FlagIcon country={c} title={label} /> : null}
                            <span className="flex-1 truncate">{label}</span>
                            <span className="text-xs tabular-nums text-muted-foreground">+{M.callingCode(c)}</span>
                            <Check className={cn('h-4 w-4', c === state.country ? 'opacity-100' : 'opacity-0')} />
                          </Command.Item>
                        );
                      })}
                    </Command.Group>
                  </Command.List>
                </Command>
              </PopoverContent>
            </Popover>
          ) : (
            <span className={cn(ADDON, EDGE, 'cursor-default')} aria-label={`Country: ${name}`}>
              {current}
            </span>
          )}
          <PhoneNumberInput
            ref={textBox.ref}
            id={`shad-${id}`}
            country={state.country}
            international={false}
            value={state.value || undefined}
            inputComponent={BareInput}
            autoComplete="tel"
            aria-invalid={!!check.error || undefined}
            className={INNER}
            placeholder={text(properties.placeholder)}
            disabled={disabled}
            onFocus={textBox.onFocus}
            onBlur={textBox.onBlur}
            onChange={(v) => update({ ...stateRef.current, value: v || '' })}
            onKeyDown={(e) => e.key === 'Enter' && fireEvent('onEnterPressed')}
          />
        </Group>
      </Field>
    </Shell>
  );
};

export default withControlState(ShadPhoneInput);
