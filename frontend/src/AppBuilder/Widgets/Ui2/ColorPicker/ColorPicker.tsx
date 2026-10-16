import React, { useEffect, useRef, useState } from 'react';
import { Check, Pipette } from 'lucide-react';
import { CONTROL, Field } from '@/AppBuilder/Widgets/Ui2/_shared/field';
import { Shell, busy } from '@/AppBuilder/Widgets/Ui2/_shared/Shell';
import { useAutoHeight, useExposed, withControlState } from '@/AppBuilder/Widgets/Ui2/_shared/packHooks';
import { Button, Input, Popover, PopoverContent, PopoverTrigger, cn } from '@/AppBuilder/Widgets/Ui2/_shared/ui';
import { lookVars } from '@/AppBuilder/Widgets/Ui2/_shared/looks/shadcnLook';
import * as M from '@/AppBuilder/Widgets/Ui2/_pickers/colorModel';
import { useFocusEvents } from '@/AppBuilder/Widgets/Ui2/_shared/parity';
import { MENU_SURFACE, PLACEHOLDER } from '@/AppBuilder/Widgets/Ui2/_pickers/pickerParts';
import type { CSSProperties, KeyboardEvent, PointerEvent } from 'react';
import type { Hsv } from '@/AppBuilder/Widgets/Ui2/_pickers/colorModel';
import type { WidgetProps } from '@/AppBuilder/Widgets/Ui2/_shared/types';

// ---- Color picker --------------------------------------------------------------------------------------------------

/** A colour as hue, saturation, value and alpha (0-1). */
export type Hsva = Hsv & { a: number };

/** The EyeDropper API (Chromium only), missing from TypeScript's DOM types. */
interface EyeDropperWindow {
  EyeDropper?: new () => { open: () => Promise<{ sRGBHex?: string }> };
}

const CHECKERBOARD = 'repeating-conic-gradient(#d4d4d4 0% 25%, #ffffff 0% 50%) 50% / 8px 8px';

/** A swatch's fill: the colour over a checkerboard when it is see-through. */
export const swatchStyle = (hex: string): CSSProperties | undefined => {
  if (!hex) return undefined;
  return hex.length === 9 ? { background: `linear-gradient(${hex}, ${hex}), ${CHECKERBOARD}` } : { background: hex };
};

export const toHsva = (hex: unknown, keepHue?: number): Hsva => {
  const c = M.hexToRgba(hex);
  if (!c) return { h: keepHue ?? 0, s: 0, v: 1, a: 1 };
  const hsv = M.rgbToHsv(c);
  return { ...hsv, h: (hsv.s === 0 || hsv.v === 0) && keepHue !== undefined ? keepHue : hsv.h, a: c.a };
};

export const clamp01 = (n: number) => Math.max(0, Math.min(1, n));

export const THUMB =
  'pointer-events-none absolute h-4 w-4 -translate-x-1/2 -translate-y-1/2 rounded-full border-2 border-white shadow-[0_0_0_1px_rgba(0,0,0,0.25),0_1px_3px_rgba(0,0,0,0.3)]';

export const SLIDER_FOCUS = 'outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-1';

/** Pointer dragging over an element: onMove({ x, y }) with both from 0 to 1, onEnd when released. */
export const useDrag = (onMove: (point: { x: number; y: number }) => void, onEnd: () => void) => {
  const el = useRef<HTMLDivElement>(null);
  const at = (e: PointerEvent<HTMLElement>) => {
    const r = el.current?.getBoundingClientRect?.() || { left: 0, top: 0, width: 0, height: 0 };
    return {
      x: r.width ? clamp01((e.clientX - r.left) / r.width) : 0,
      y: r.height ? clamp01((e.clientY - r.top) / r.height) : 0,
    };
  };
  return {
    ref: el,
    onPointerDown: (e: PointerEvent<HTMLElement>) => {
      if (e.button !== undefined && e.button !== 0) return;
      e.preventDefault();
      e.currentTarget.setPointerCapture?.(e.pointerId);
      e.currentTarget.focus?.();
      onMove(at(e));
    },
    onPointerMove: (e: PointerEvent<HTMLElement>) => {
      if (e.currentTarget.hasPointerCapture?.(e.pointerId)) onMove(at(e));
    },
    onPointerUp: (e: PointerEvent<HTMLElement>) => {
      e.currentTarget.releasePointerCapture?.(e.pointerId);
      onEnd();
    },
  };
};

export const ShadColorPicker = (props: WidgetProps) => {
  const { properties, styles, setExposedVariables, fireEvent, id, componentType } = props;
  const ref = useRef<HTMLDivElement>(null);
  useAutoHeight(props, ref);
  const alpha = properties.allowAlpha === true;
  const initial = M.normalizeHex(properties.defaultValue, alpha) || '';
  const [value, setValue] = useState(initial);
  useEffect(() => setValue(initial), [initial]);
  const [open, setOpen] = useState(false);
  const [hsva, setHsvaState] = useState(() => toHsva(initial));
  const hsvaRef = useRef(hsva);
  const [draft, setDraft] = useState(initial);
  const alphaRef = useRef(alpha);
  alphaRef.current = alpha;
  const triggerRef = useRef<HTMLButtonElement>(null);
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
  const live = open ? hexOf(hsva) : value;
  const setHsva = (next: Hsva) => {
    hsvaRef.current = next;
    setHsvaState(next);
    setDraft(hexOf(next));
  };
  const commit = (hex: string) => {
    if (!hex || hex === value) return;
    setValue(hex);
    setExposedVariables(colorExposed(hex));
    fireEvent('onChange');
  };
  const pickHex = (hex: string) => {
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
    if (next && busy(properties)) return;
    if (next) {
      const start = toHsva(value);
      hsvaRef.current = start;
      setHsvaState(start);
      setDraft(value);
    }
    setOpen(next);
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
  const eyeDrop = async () => {
    if (!Dropper) return;
    try {
      const result = await new Dropper().open();
      const hex = M.normalizeHex(result?.sRGBHex, alpha);
      if (hex) pickHex(hex);
    } catch {
      // cancelled
    }
  };
  const swatchOnly = properties.triggerStyle === 'swatch';
  const disabled = busy(properties);
  return (
    <Shell {...props} innerRef={ref}>
      <Field id={`shad-${id}`} label={properties.label} description={properties.description}>
        <Popover open={open} onOpenChange={openChange}>
          <PopoverTrigger asChild>
            <Button
              ref={triggerRef}
              id={`shad-${id}`}
              type="button"
              variant="outline"
              disabled={disabled}
              {...focus.handlers}
              aria-label={swatchOnly ? `Color ${value || 'not set'}` : undefined}
              className={cn(
                'font-normal',
                CONTROL,
                swatchOnly ? 'h-9 w-9 p-1.5' : 'w-full justify-start gap-2 px-3',
                swatchOnly && 'shrink-0'
              )}
            >
              <span
                className={cn(
                  'shrink-0 rounded-[calc(var(--sc-radius)-4px)] border border-[color:var(--sc-border)] shadow-sm',
                  swatchOnly ? 'h-full w-full' : 'h-5 w-5',
                  !live && 'border-dashed'
                )}
                style={swatchStyle(live)}
              />
              {swatchOnly ? null : (
                <span className={cn('truncate', live ? 'uppercase tabular-nums' : PLACEHOLDER)}>
                  {live || String(properties.placeholder ?? '')}
                </span>
              )}
            </Button>
          </PopoverTrigger>
          <PopoverContent
            align="start"
            className={cn('flex w-64 flex-col gap-3 p-3', MENU_SURFACE)}
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
                    'relative h-36 w-full cursor-crosshair touch-none rounded-[calc(var(--sc-radius)-2px)]',
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
                  className={cn('relative h-3 w-full cursor-pointer touch-none rounded-full', SLIDER_FOCUS)}
                  style={{
                    background: 'linear-gradient(to right, #f00, #ff0, #0f0, #0ff, #00f, #f0f, #f00)',
                  }}
                >
                  <span
                    className={cn(THUMB, 'top-1/2')}
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
                    className={cn('relative h-3 w-full cursor-pointer touch-none rounded-full', SLIDER_FOCUS)}
                    style={{ background: `linear-gradient(to right, transparent, ${opaque}), ${CHECKERBOARD}` }}
                  >
                    <span className={cn(THUMB, 'top-1/2')} style={{ left: `${hsva.a * 100}%`, background: opaque }} />
                  </div>
                ) : null}
              </>
            ) : null}
            <div className="flex items-center gap-2">
              <span
                className="h-8 w-8 shrink-0 rounded-[calc(var(--sc-radius)-2px)] border border-[color:var(--sc-border)] shadow-sm"
                style={swatchStyle(live)}
              />
              <Input
                aria-label="Hex color"
                spellCheck={false}
                value={draft}
                onChange={(e) => setDraft(e.target.value)}
                onBlur={applyDraft}
                onKeyDown={(e) => e.key === 'Enter' && applyDraft()}
                className="h-8 border-[color:var(--sc-input)] font-mono text-xs uppercase"
              />
              {canEyeDrop ? (
                <Button
                  type="button"
                  variant="outline"
                  size="icon"
                  className="h-8 w-8 shrink-0"
                  aria-label="Pick a color from the screen"
                  onClick={eyeDrop}
                >
                  <Pipette />
                </Button>
              ) : null}
            </div>
            {properties.showSwatches !== false && swatches.length ? (
              <div className="grid grid-cols-8 gap-1.5">
                {swatches.map((c) => (
                  <button
                    key={c}
                    type="button"
                    title={c}
                    aria-label={c}
                    aria-pressed={c === value}
                    onClick={() => pickHex(M.normalizeHex(c, alpha) ?? c)}
                    className="relative aspect-square w-full rounded-[calc(var(--sc-radius)-4px)] border border-[color:var(--sc-border)] p-0 shadow-sm outline-none transition-transform hover:scale-110 focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-1"
                    style={swatchStyle(c)}
                  >
                    {c === value ? (
                      <Check className="absolute inset-0 m-auto h-3.5 w-3.5" style={{ color: M.contrastOn(c) }} />
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
