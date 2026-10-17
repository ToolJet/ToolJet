import React, { useEffect, useMemo, useRef, useState } from 'react';
import { Command } from 'cmdk';
import PhoneNumberInput from 'react-phone-number-input/input';
import flags from 'react-phone-number-input/flags';
import { isValidPhoneNumber } from 'react-phone-number-input';
import { Check, ChevronsUpDown, Search } from 'lucide-react';
import { FormField } from '@/AppBuilder/Widgets/Ui2/_shared/field';
import { busy } from '@/AppBuilder/Widgets/Ui2/_shared/Shell';
import { useTextBox, useValidation } from '@/AppBuilder/Widgets/Ui2/_shared/formHooks';
import {
  useAutoHeight,
  useExposed,
  useLatest,
  useStable,
  withControlState,
} from '@/AppBuilder/Widgets/Ui2/_shared/packHooks';
import { Popover, PopoverContent, PopoverTrigger, cn } from '@/AppBuilder/Widgets/Ui2/_shared/ui';
import { lookVars } from '@/AppBuilder/Widgets/Ui2/_shared/looks/shadcnLook';
import * as M from '@/AppBuilder/Widgets/Ui2/_inputs/phoneModel';
import { ADDON, ADDON_HOVER, EDGE, Group, INNER, withRule } from '@/AppBuilder/Widgets/Ui2/_inputs/inputParts';
import type { InputHTMLAttributes, KeyboardEvent } from 'react';
import type { Country } from 'react-phone-number-input';
import type { WidgetProps } from '@/AppBuilder/Widgets/Ui2/_shared/types';
import { toText } from '@/AppBuilder/Widgets/Ui2/_shared/values';

export const BareInput = React.forwardRef<HTMLInputElement, InputHTMLAttributes<HTMLInputElement>>((props, ref) => (
  <input ref={ref} {...props} />
));
BareInput.displayName = 'BareInput';

// ---- Phone input ---------------------------------------------------------------------------------------------------

const POPOVER_LIST = 'tw-max-h-[300px] tw-overflow-y-auto tw-overflow-x-hidden';

export const COMMAND_ITEM =
  'tw-relative tw-flex tw-cursor-default tw-select-none tw-items-center tw-gap-2 tw-rounded-ui2-sm tw-px-2 tw-py-1.5 tw-text-ui2-sm tw-outline-none data-[disabled=true]:tw-pointer-events-none data-[selected=true]:tw-bg-ui2-accent data-[selected=true]:tw-text-ui2-accent-foreground data-[disabled=true]:tw-opacity-50';

export const FlagIcon = ({ country, title }: { country: Country; title: string }) => {
  const Flag = flags[country];
  return (
    <span className="tw-flex tw-h-4 tw-w-6 tw-shrink-0 tw-overflow-hidden tw-rounded-ui2-sm tw-bg-[color:var(--sc-muted)] [&_svg]:tw-h-full [&_svg]:tw-w-full">
      {Flag ? <Flag title={title} /> : null}
    </span>
  );
};

/** The number (E.164, '' for none) and the country it is typed for. */
interface PhoneState {
  value: string;
  country: Country;
}

export const ShadPhoneInput = (props: WidgetProps) => {
  // Fields fit their content (label, help text, validation message), so nothing below is overlapped.
  const fit = useRef<HTMLDivElement>(null);
  useAutoHeight(props, fit);
  const { properties, setExposedVariables, fireEvent, id, componentType, styles } = props;
  // A new default number, country or country list starts the input again.
  const defaultValue = useStable(properties.defaultValue);
  const defaultCountry = useStable(properties.defaultCountry);
  const onlyCountries = useStable(Array.isArray(properties.onlyCountries) ? properties.onlyCountries : null);
  const start = useMemo(
    () => M.phoneStart(defaultValue, defaultCountry, onlyCountries),
    [defaultValue, defaultCountry, onlyCountries]
  );
  const { countries } = start;
  const [state, setState] = useState<PhoneState>({ value: start.value, country: start.country });
  useEffect(() => setState({ value: start.value, country: start.country }), [start]);
  const stateRef = useLatest(state);
  const info = M.phoneInfo(state.value, state.country);
  const update = (next: PhoneState, fire = true) => {
    const prev = stateRef.current;
    if (next.value === prev.value && next.country === prev.country) return;
    stateRef.current = next;
    setState(next);
    if (!fire) return;
    setExposedVariables(M.phoneInfo(next.value, next.country));
    fireEvent('onChange');
  };
  /** Sets the number from an action, as the native Phone input's setValue and clear do: onChange, every time. */
  const set = (next: PhoneState) => {
    stateRef.current = next;
    setState(next);
    setExposedVariables(M.phoneInfo(next.value, next.country));
    fireEvent('onChange');
  };
  const toCountry = (c: Country): PhoneState => {
    const prev = stateRef.current;
    return { country: c, value: M.rebasePhone(prev.value, prev.country, c) };
  };
  useExposed(setExposedVariables, properties, {
    ...info,
    // setValue(value, country), as the native Phone input takes it.
    setValue: async (v: unknown, c: unknown) => {
      const given = c === undefined || c === null || c === '' ? null : M.countryFromInput(c, countries);
      const prev = given ? { ...stateRef.current, country: given } : stateRef.current;
      const value = M.toPhoneValue(v, prev.country);
      const detected = M.phoneCountry(value, countries);
      set({ value, country: detected || prev.country });
    },
    setCountryCode: async (c: unknown) => {
      const country = M.countryFromInput(c, countries);
      if (country) update(toCountry(country), false);
    },
    clear: async () => set({ ...stateRef.current, value: '' }),
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
      <span className="tw-tabular-nums">+{code}</span>
    </>
  );
  return (
    <FormField props={props} properties={properties} check={check} innerRef={fit}>
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
                <ChevronsUpDown className="tw-h-3.5 tw-w-3.5 tw-opacity-50" />
              </button>
            </PopoverTrigger>
            <PopoverContent
              className="tw-w-[300px] tw-p-0"
              align="start"
              style={vars}
              onCloseAutoFocus={(e) => {
                e.preventDefault();
                textBox.ref.current?.focus();
              }}
            >
              <Command className="tw-flex tw-h-full tw-w-full tw-flex-col tw-overflow-hidden tw-rounded-ui2-md tw-bg-ui2-popover tw-text-ui2-popover-foreground">
                <div className="tw-flex tw-items-center tw-border-b tw-px-3">
                  <Search className="tw-mr-2 tw-h-4 tw-w-4 tw-shrink-0 tw-opacity-50" />
                  <Command.Input
                    placeholder="Search country..."
                    className="tw-flex tw-h-10 tw-w-full tw-rounded-ui2-md tw-border-0 tw-bg-transparent tw-py-3 tw-text-ui2-sm tw-text-[color:inherit] tw-shadow-none tw-outline-none placeholder:tw-text-ui2-muted-foreground focus:tw-outline-none"
                  />
                </div>
                <Command.List className={POPOVER_LIST}>
                  <Command.Empty className="tw-py-6 tw-text-center tw-text-ui2-sm tw-text-ui2-muted-foreground">
                    No country found.
                  </Command.Empty>
                  <Command.Group className="tw-overflow-hidden tw-p-1">
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
                          <span className="tw-flex-1 tw-truncate">{label}</span>
                          <span className="tw-text-xs tw-tabular-nums tw-text-ui2-muted-foreground">
                            +{M.callingCode(c)}
                          </span>
                          <Check
                            className={cn('tw-h-4 tw-w-4', c === state.country ? 'tw-opacity-100' : 'tw-opacity-0')}
                          />
                        </Command.Item>
                      );
                    })}
                  </Command.Group>
                </Command.List>
              </Command>
            </PopoverContent>
          </Popover>
        ) : (
          <span className={cn(ADDON, EDGE, 'tw-cursor-default')} aria-label={`Country: ${name}`}>
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
          placeholder={toText(properties.placeholder)}
          disabled={disabled}
          onFocus={textBox.onFocus}
          onBlur={textBox.onBlur}
          onChange={(v) => update({ ...stateRef.current, value: v || '' })}
          onKeyDown={(e: KeyboardEvent<HTMLInputElement>) => e.key === 'Enter' && fireEvent('onEnterPressed')}
        />
      </Group>
    </FormField>
  );
};

export default withControlState(ShadPhoneInput);
