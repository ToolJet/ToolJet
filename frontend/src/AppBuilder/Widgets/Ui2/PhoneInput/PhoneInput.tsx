import React, { useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react';
import { Command } from 'cmdk';
import PhoneNumberInput from 'react-phone-number-input/input';
import flags from 'react-phone-number-input/flags';
import { isValidPhoneNumber } from 'react-phone-number-input';
import { Check, ChevronsUpDown, Search } from 'lucide-react';
import { FormField, controlAria, fieldIdOf } from '@/AppBuilder/Widgets/Ui2/_shared/field';
import { busy } from '@/AppBuilder/Widgets/Ui2/_shared/Shell';
import { useTextBox, useValidation } from '@/AppBuilder/Widgets/Ui2/_shared/formHooks';
import {
  missingIsGone,
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
import { SECONDARY_ON_HIGHLIGHT } from '@/AppBuilder/Widgets/Ui2/_pickers/pickerParts';
import { isEnter } from '@/AppBuilder/Widgets/Ui2/_shared/keyboard';

export const BareInput = React.forwardRef<HTMLInputElement, InputHTMLAttributes<HTMLInputElement>>((props, ref) => (
  <input ref={ref} {...props} />
));
BareInput.displayName = 'BareInput';

// ---- Phone input ---------------------------------------------------------------------------------------------------

const POPOVER_LIST = 'tw-max-h-[300px] tw-overflow-y-auto tw-overflow-x-hidden';

export const COMMAND_ITEM = `tw-relative tw-flex tw-cursor-default tw-select-none tw-items-center tw-gap-2 tw-rounded-ui2-sm tw-px-2 tw-py-1.5 tw-text-ui2-sm tw-outline-none data-[disabled=true]:tw-pointer-events-none data-[selected=true]:tw-bg-ui2-accent data-[selected=true]:tw-text-ui2-accent-foreground data-[disabled=true]:tw-opacity-50 ${SECONDARY_ON_HIGHLIGHT}`;

export const FlagIcon = ({ country, title }: { country: Country; title: string }) => {
  const Flag = flags[country];
  return (
    <span className="tw-flex tw-h-4 tw-w-6 tw-shrink-0 tw-overflow-hidden tw-rounded-ui2-xs tw-bg-[color:var(--sc-muted)] [&_svg]:tw-h-full [&_svg]:tw-w-full">
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
  const { properties, setExposedVariables, fireEvent, componentType, styles } = props;
  const defaultValue = useStable(properties.defaultValue);
  const defaultCountry = useStable(properties.defaultCountry);
  const onlyCountries = useStable(Array.isArray(properties.onlyCountries) ? properties.onlyCountries : null);
  const start = useMemo(
    () => M.phoneStart(defaultValue, defaultCountry, onlyCountries),
    [defaultValue, defaultCountry, onlyCountries]
  );
  const { countries } = start;
  const [state, setState] = useState<PhoneState>({ value: start.value, country: start.country });
  const startRef = useLatest(start);
  // A new default number or country starts the input again.
  useEffect(() => {
    const { value, country } = startRef.current;
    setState({ value, country });
  }, [defaultValue, defaultCountry, startRef]);
  // A new country list (reordered, longer, shorter) keeps the number the user set or cleared while its country is
  // still offered, so the Form keeps it too; only a list without that country starts the input again. An empty list
  // is not a removal (a query's data is [] while it reruns). The check reads the state queued before it (an updater),
  // so a new default arriving with the list wins.
  const listed = onlyCountries?.length ?? 0;
  useEffect(() => {
    if (!missingIsGone(listed)) return;
    const { value, country, countries: offered } = startRef.current;
    setState((s) => (offered.includes(s.country) ? s : { value, country }));
  }, [onlyCountries, listed, startRef]);
  const stateRef = useLatest(state);
  const info = M.phoneInfo(state.value, state.country);
  // Typing reaches update() from inside the phone library's effect, where React cannot render isValid before the
  // event fires (runNow cannot flush there). Its onChange waits for the next commit instead, after the effects that
  // publish isValid (the effect that fires it is declared after useValidation).
  const queued = useRef<string[]>([]);
  const [, setQueuedCount] = useState(0);
  const fireAfterCommit = (event: string) => {
    queued.current.push(event);
    setQueuedCount((n) => n + 1);
  };
  /** Sets the number as the user does (typing, picking a country). */
  const update = (next: PhoneState, fire = true) => {
    const prev = stateRef.current;
    if (next.value === prev.value && next.country === prev.country) return;
    stateRef.current = next;
    setState(next);
    if (!fire) return;
    setExposedVariables(M.phoneInfo(next.value, next.country));
    fireAfterCommit('onChange');
  };
  // The phone library keeps its own copy of `value` and `country`, synced in effects that report the copy back through
  // onChange. Those effects' updates run after an action's render (React gives them a later lane), so the copy from one
  // action would land after the next (`await setValue(...); await clear()` ended with the number set again). An action
  // that changes the number or the country starts the library afresh (a new key) from that state, so there is no copy
  // left to report; one that changes nothing leaves it alone. A box the user was typing in keeps focus, with the caret
  // at the end, and no second onFocus: the user never left it.
  const [revision, setRevision] = useState(0);
  const refocus = useRef(false);
  const refocusing = useRef(false);
  const restart = (prev: PhoneState, next: PhoneState) => {
    if (next.value === prev.value && next.country === prev.country) return;
    refocus.current = !!textBox.ref.current && document.activeElement === textBox.ref.current;
    setRevision((r) => r + 1);
  };
  /** Sets the number from an action, as the native Phone input's setValue and clear do: onChange, every time. */
  const set = (next: PhoneState) => {
    const prev = stateRef.current;
    stateRef.current = next;
    setState(next);
    restart(prev, next);
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
      if (!country) return;
      const prev = stateRef.current;
      const next = toCountry(country);
      update(next, false);
      restart(prev, next);
    },
    clear: async () => set({ ...stateRef.current, value: '' }),
  });
  const check = useValidation(
    withRule(props, (v) => (v && !isValidPhoneNumber(String(v)) ? 'Enter a valid phone number' : '')),
    state.value,
    () => update({ ...stateRef.current, value: '' })
  );
  const textBox = useTextBox(props, check.touch);
  const boxRef = textBox.ref;
  useLayoutEffect(() => {
    const box = boxRef.current;
    if (!refocus.current || !box) return;
    refocus.current = false;
    refocusing.current = true;
    box.focus();
    refocusing.current = false;
    box.setSelectionRange(box.value.length, box.value.length);
  }, [revision, boxRef]);
  useEffect(() => {
    const events = queued.current;
    if (events.length === 0) return;
    queued.current = [];
    events.forEach((event) => fireEvent(event));
  });
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
              aria-label="Choose a country"
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
                          <span data-secondary className="tw-text-xs tw-tabular-nums tw-text-ui2-muted-foreground">
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
          key={revision}
          ref={textBox.ref}
          id={fieldIdOf(props)}
          country={state.country}
          international={false}
          value={state.value || undefined}
          inputComponent={BareInput}
          autoComplete="tel"
          {...controlAria(props, check.error)}
          className={INNER}
          placeholder={toText(properties.placeholder)}
          disabled={disabled}
          onFocus={() => !refocusing.current && textBox.onFocus()}
          onBlur={textBox.onBlur}
          onChange={(v) => update({ ...stateRef.current, value: v || '' })}
          onKeyDown={(e: KeyboardEvent<HTMLInputElement>) => isEnter(e) && fireEvent('onEnterPressed')}
        />
      </Group>
    </FormField>
  );
};

export default withControlState(ShadPhoneInput);
