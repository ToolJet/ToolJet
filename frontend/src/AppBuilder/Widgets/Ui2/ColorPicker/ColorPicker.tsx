import React, { useEffect, useRef, useState } from 'react';
import { Check, Pipette } from 'lucide-react';
import { CONTROL, Field, fieldIdOf } from '@/AppBuilder/Widgets/Ui2/_shared/field';
import { Shell, busy } from '@/AppBuilder/Widgets/Ui2/_shared/Shell';
import { CLEAR_ROOM, ClearX, WithClear, showsClear } from '@/AppBuilder/Widgets/Ui2/_shared/FieldClear';
import {
  runNow,
  useAutoHeight,
  useExposed,
  useLatest,
  withControlState,
} from '@/AppBuilder/Widgets/Ui2/_shared/packHooks';
import { Button, Input, Popover, PopoverContent, PopoverTrigger, cn } from '@/AppBuilder/Widgets/Ui2/_shared/ui';
import { lookVars } from '@/AppBuilder/Widgets/Ui2/_shared/looks/shadcnLook';
import * as M from '@/AppBuilder/Widgets/Ui2/_pickers/colorModel';
import { useFocusEvents, usePickerPopup } from '@/AppBuilder/Widgets/Ui2/_shared/parity';
import { MENU_SURFACE, PLACEHOLDER } from '@/AppBuilder/Widgets/Ui2/_pickers/pickerParts';
import type { KeyboardEvent } from 'react';
import {
  CHECKERBOARD,
  SLIDER_FOCUS,
  THUMB,
  swatchStyle,
  toHsva,
  useDrag,
} from '@/AppBuilder/Widgets/Ui2/_pickers/colorParts';
import type { EyeDropperWindow, Hsva } from '@/AppBuilder/Widgets/Ui2/_pickers/colorParts';
import type { WidgetProps } from '@/AppBuilder/Widgets/Ui2/_shared/types';
import { isEnter } from '@/AppBuilder/Widgets/Ui2/_shared/keyboard';
import { useFormClearNow } from '@/AppBuilder/Widgets/Ui2/_shared/formHooks';

// ---- Color picker --------------------------------------------------------------------------------------------------

export const ShadColorPicker = (props: WidgetProps) => {
  const { properties, styles, setExposedVariables, fireEvent, componentType } = props;
  const ref = useRef<HTMLDivElement>(null);
  useAutoHeight(props, ref);
  const alpha = properties.allowAlpha === true;
  const initial = M.normalizeHex(properties.defaultValue, alpha) || '';
  const [value, setValue] = useState(initial);
  useEffect(() => setValue(initial), [initial]);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const popup = usePickerPopup(properties, triggerRef);
  const { open } = popup;
  const [hsva, setHsvaState] = useState(() => toHsva(initial));
  const hsvaRef = useRef(hsva);
  const [draft, setDraft] = useState(initial);
  const alphaRef = useRef(alpha);
  alphaRef.current = alpha;
  const focus = useFocusEvents(fireEvent);
  // value is the hex (what a Form collects); the other forms keep the native Color picker's names.
  const colorExposed = (hex: string) => {
    const forms = M.colorForms(hex);
    return { value: hex, selectedColorRGB: forms.rgb, selectedColorRGBA: forms.rgba };
  };
  useExposed(setExposedVariables, properties, {
    ...colorExposed(value),
    colorFormat: 'hex',
    allowOpacity: alpha,
    isValid: true,
    label: String(properties.label ?? ''),
    setFocus: async () => triggerRef.current?.focus(),
    setBlur: async () => triggerRef.current?.blur(),
    setColor: async (c: unknown) => {
      if (c === '' || c === null || c === undefined) return setValue('');
      const hex = M.normalizeHex(c, alphaRef.current);
      if (hex) setValue(hex);
    },
  });
  const hexOf = (c: Hsva) => M.rgbaToHex({ ...M.hsvToRgb(c), a: c.a }, alpha);
  // A color set from outside while the popup is open (setColor, a new default) reaches the open editor and its hex
  // field; otherwise leaving the field applied its old text and undid the change. The user's own picks already match.
  useEffect(() => {
    if (!open) return;
    const c = hsvaRef.current;
    if (M.rgbaToHex({ ...M.hsvToRgb(c), a: c.a }, alphaRef.current) === value) return;
    const next = toHsva(value, c.h);
    hsvaRef.current = next;
    setHsvaState(next);
    setDraft(value);
  }, [open, value]);
  const live = open ? hexOf(hsva) : value;
  const setHsva = (next: Hsva) => {
    hsvaRef.current = next;
    setHsvaState(next);
    setDraft(hexOf(next));
  };
  const commit = (hex: string) => {
    if (!hex || hex === value || popup.blocked) return;
    setValue(hex);
    setExposedVariables(colorExposed(hex));
    fireEvent('onChange');
  };
  // A Form's clearForm empties it, as the native Color picker.
  useFormClearNow(() => {
    if (value === '') return;
    setValue('');
    setExposedVariables(colorExposed(''));
    fireEvent('onChange');
  });
  const pickHex = (hex: string) => {
    if (popup.blocked) return;
    setHsva(toHsva(hex, hsvaRef.current.h));
    setDraft(hex);
    commit(hex);
  };
  const applyDraft = () => {
    const hex = M.normalizeHex(draft, alpha);
    if (hex) pickHex(hex);
    else setDraft(value);
  };
  const openChange = (next: boolean) => {
    if (next && popup.blocked) return;
    if (next) {
      const start = toHsva(value);
      hsvaRef.current = start;
      setHsvaState(start);
      setDraft(value);
    }
    popup.setOpen(next);
    focus.opened(next);
  };
  const commitLive = () => commit(hexOf(hsvaRef.current));
  const area = useDrag(({ x, y }) => setHsva({ ...hsvaRef.current, s: x, v: 1 - y }), commitLive);
  const hue = useDrag(({ x }) => setHsva({ ...hsvaRef.current, h: x * 360 }), commitLive);
  const alphaBar = useDrag(({ x }) => setHsva({ ...hsvaRef.current, a: Math.round(x * 100) / 100 }), commitLive);
  /** Arrow keys on a slider: change one channel by a step (ten steps with Shift) and commit. */
  const keys = (channel: keyof Hsva, step: number, min: number, max: number) => (e: KeyboardEvent<HTMLElement>) => {
    const dirs: Record<string, number> = { ArrowRight: 1, ArrowUp: 1, ArrowLeft: -1, ArrowDown: -1 };
    const dir = dirs[e.key];
    if (!dir) return;
    e.preventDefault();
    const c = hsvaRef.current;
    const delta = dir * step * (e.shiftKey ? 10 : 1);
    const next = { ...c, [channel]: Math.max(min, Math.min(max, c[channel] + delta)) };
    setHsva(next);
    commit(hexOf(next));
  };
  const areaKeys = (e: KeyboardEvent<HTMLElement>) => {
    if (e.key === 'ArrowUp' || e.key === 'ArrowDown') return keys('v', 0.01, 0, 1)(e);
    return keys('s', 0.01, 0, 1)(e);
  };
  const swatches = M.toSwatches(properties.swatches);
  const opaque = M.rgbaToHex(M.hsvToRgb(hsva), false);
  const Dropper = typeof window !== 'undefined' ? (window as Window & EyeDropperWindow).EyeDropper : undefined;
  const canEyeDrop = typeof Dropper === 'function';
  // The EyeDropper answers when the user clicks somewhere on screen, which can be long after this click. The answer is
  // this picker's only while it is mounted and no later pick has started (an unmounted picker's answer reached a new
  // picker with the same id through the store), and it is checked against the picker as it is when the answer comes
  // (latest pickHex: disabled, loading, hidden, or in a panel that takes no input refuse it).
  const latestPick = useLatest(pickHex);
  const latestAlpha = useLatest(alpha);
  const dropping = useRef(0);
  useEffect(() => {
    const operations = dropping;
    return () => {
      operations.current += 1;
    };
  }, []);
  const eyeDrop = async () => {
    if (!Dropper) return;
    const operation = (dropping.current += 1);
    try {
      const result = await new Dropper().open();
      if (operation !== dropping.current) return;
      const hex = M.normalizeHex(result?.sRGBHex, latestAlpha.current);
      if (hex) latestPick.current(hex);
    } catch {
      // cancelled
    }
  };
  const swatchOnly = properties.triggerStyle === 'swatch';
  const disabled = busy(properties);
  const clearable = showsClear(properties, !!value);
  const clearColor = () => {
    runNow(() => {
      setValue('');
      setExposedVariables(colorExposed(''));
      fireEvent('onChange');
    });
    triggerRef.current?.focus();
  };
  const trigger = (
    <PopoverTrigger asChild>
      <Button
        ref={triggerRef}
        id={fieldIdOf(props)}
        type="button"
        variant="outline"
        disabled={disabled}
        {...focus.handlers}
        aria-label={swatchOnly ? `Color ${value || 'not set'}` : undefined}
        className={cn(
          'tw-font-normal',
          CONTROL,
          swatchOnly ? 'tw-h-9 tw-w-9 tw-p-1.5' : 'tw-w-full tw-justify-start tw-gap-2 tw-px-3',
          swatchOnly && 'tw-shrink-0',
          clearable && !swatchOnly && CLEAR_ROOM
        )}
      >
        <span
          className={cn(
            'tw-shrink-0 tw-rounded-[calc(var(--sc-radius)-4px)] tw-border tw-border-[color:var(--sc-border)] tw-shadow-sm',
            swatchOnly ? 'tw-h-full tw-w-full' : 'tw-h-5 tw-w-5',
            !live && 'tw-border-dashed'
          )}
          style={swatchStyle(live)}
        />
        {swatchOnly ? null : (
          <span className={cn('tw-truncate', live ? 'tw-uppercase tw-tabular-nums' : PLACEHOLDER)}>
            {live || String(properties.placeholder ?? '')}
          </span>
        )}
      </Button>
    </PopoverTrigger>
  );
  return (
    <Shell {...props} innerRef={ref}>
      <Field id={fieldIdOf(props)} label={properties.label} description={properties.description}>
        <Popover open={open} onOpenChange={openChange}>
          {/* Show clear button (the native Color picker's showClearBtn): an x while a colour is set empties it, as a
              Form's clearForm does, firing onChange once. Over the button's right end, or beside a swatch-only one. */}
          {swatchOnly && properties.showClearBtn === true ? (
            <div className="tw-flex tw-items-center tw-gap-1.5">
              {trigger}
              {clearable ? <ClearX onClear={clearColor} /> : null}
            </div>
          ) : (
            <WithClear enabled={properties.showClearBtn === true} show={clearable} onClear={clearColor}>
              {trigger}
            </WithClear>
          )}
          <PopoverContent
            aria-label="Choose a colour"
            align="start"
            className={cn('tw-flex tw-w-64 tw-flex-col tw-gap-3 tw-p-3', MENU_SURFACE)}
            style={lookVars(componentType, styles)}
          >
            {properties.showPicker !== false ? (
              <>
                <div
                  {...area}
                  role="slider"
                  tabIndex={0}
                  aria-label="Saturation and brightness"
                  aria-valuetext={`Saturation ${Math.round(hsva.s * 100)}%, brightness ${Math.round(hsva.v * 100)}%`}
                  onKeyDown={areaKeys}
                  className={cn(
                    'tw-relative tw-h-36 tw-w-full tw-cursor-crosshair tw-touch-none tw-rounded-[calc(var(--sc-radius)-2px)]',
                    SLIDER_FOCUS
                  )}
                  style={{
                    background: `linear-gradient(to top, #000000, transparent), linear-gradient(to right, #ffffff, hsl(${Math.round(
                      hsva.h
                    )} 100% 50%))`,
                  }}
                >
                  <span
                    className={THUMB}
                    style={{ left: `${hsva.s * 100}%`, top: `${(1 - hsva.v) * 100}%`, background: opaque }}
                  />
                </div>
                <div
                  {...hue}
                  role="slider"
                  tabIndex={0}
                  aria-label="Hue"
                  aria-valuemin={0}
                  aria-valuemax={360}
                  aria-valuenow={Math.round(hsva.h)}
                  onKeyDown={keys('h', 1, 0, 360)}
                  className={cn(
                    'tw-relative tw-h-3 tw-w-full tw-cursor-pointer tw-touch-none tw-rounded-full',
                    SLIDER_FOCUS
                  )}
                  style={{
                    background: 'linear-gradient(to right, #f00, #ff0, #0f0, #0ff, #00f, #f0f, #f00)',
                  }}
                >
                  <span
                    className={cn(THUMB, 'tw-top-1/2')}
                    style={{ left: `${(hsva.h / 360) * 100}%`, background: `hsl(${Math.round(hsva.h)} 100% 50%)` }}
                  />
                </div>
                {alpha ? (
                  <div
                    {...alphaBar}
                    role="slider"
                    tabIndex={0}
                    aria-label="Opacity"
                    aria-valuemin={0}
                    aria-valuemax={100}
                    aria-valuenow={Math.round(hsva.a * 100)}
                    onKeyDown={keys('a', 0.01, 0, 1)}
                    className={cn(
                      'tw-relative tw-h-3 tw-w-full tw-cursor-pointer tw-touch-none tw-rounded-full',
                      SLIDER_FOCUS
                    )}
                    style={{ background: `linear-gradient(to right, transparent, ${opaque}), ${CHECKERBOARD}` }}
                  >
                    <span
                      className={cn(THUMB, 'tw-top-1/2')}
                      style={{ left: `${hsva.a * 100}%`, background: opaque }}
                    />
                  </div>
                ) : null}
              </>
            ) : null}
            <div className="tw-flex tw-items-center tw-gap-2">
              <span
                className="tw-h-8 tw-w-8 tw-shrink-0 tw-rounded-[calc(var(--sc-radius)-2px)] tw-border tw-border-[color:var(--sc-border)] tw-shadow-sm"
                style={swatchStyle(live)}
              />
              <Input
                aria-label="Hex color"
                spellCheck={false}
                value={draft}
                onChange={(e) => setDraft(e.target.value)}
                onBlur={applyDraft}
                onKeyDown={(e) => isEnter(e) && applyDraft()}
                className="tw-h-8 tw-border-[color:var(--sc-input)] tw-font-mono tw-text-xs tw-uppercase"
              />
              {canEyeDrop ? (
                <Button
                  type="button"
                  variant="outline"
                  size="icon"
                  className="tw-h-8 tw-w-8 tw-shrink-0"
                  aria-label="Pick a color from the screen"
                  onClick={eyeDrop}
                >
                  <Pipette />
                </Button>
              ) : null}
            </div>
            {properties.showSwatches !== false && swatches.length ? (
              <div className="tw-grid tw-grid-cols-8 tw-gap-1.5">
                {swatches.map((c) => (
                  <button
                    key={c}
                    type="button"
                    title={c}
                    aria-label={c}
                    aria-pressed={c === value}
                    onClick={() => pickHex(M.normalizeHex(c, alpha) ?? c)}
                    className="tw-relative tw-aspect-square tw-w-full tw-rounded-[calc(var(--sc-radius)-4px)] tw-border tw-border-[color:var(--sc-border)] tw-p-0 tw-shadow-sm tw-outline-none tw-transition-transform hover:tw-scale-110 focus-visible:tw-ring-2 focus-visible:tw-ring-ui2-ring focus-visible:tw-ring-offset-1"
                    style={swatchStyle(c)}
                  >
                    {c === value ? (
                      <Check
                        className="tw-absolute tw-inset-0 tw-m-auto tw-h-3.5 tw-w-3.5"
                        style={{ color: M.contrastOn(c) }}
                      />
                    ) : null}
                  </button>
                ))}
              </div>
            ) : null}
          </PopoverContent>
        </Popover>
      </Field>
    </Shell>
  );
};

export default withControlState(ShadColorPicker);
