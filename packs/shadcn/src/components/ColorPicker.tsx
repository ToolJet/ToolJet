import React, { useRef, useState } from 'react';
import * as Popover from '@radix-ui/react-popover';
import { Check, Pipette } from 'lucide-react';
import { Field } from '../lib/Field';
import { cn } from '../lib/cn';
import { usePortalContainer } from '../lib/usePortalContainer';
import { useOwnerGuard } from '../lib/useOwnerGuard';
import { TJ } from '../lib/ui2/inputs/sdk';
import { field, useLooks } from '../lib/ui2/inputs/looks';
import type { Look } from '../lib/ui2/inputs/looks';
import { ClearX, isEnter, useReseed } from '../lib/ui2/inputs/parts';
import * as M from '../lib/ui2/inputs/model';
import type { Hsva } from '../lib/ui2/inputs/model';
import { FieldLoading } from '../lib/ui2/loading/look';
import '../styles/ui2-inputs.css';

const LOOKS: Look[] = [
  ...field({ accentColor: 'Accent (focus ring)' }, ['errorColor']),
  ['menuBackgroundColor', 'Popover background', '--lk-menu-bg'],
];

const SWATCHES = [
  '#0f172a', '#64748b', '#ef4444', '#f97316', '#f59e0b', '#eab308', '#84cc16', '#22c55e',
  '#10b981', '#14b8a6', '#06b6d4', '#3b82f6', '#6366f1', '#8b5cf6', '#d946ef', '#ec4899',
];

type EyeDropperCtor = new () => { open: () => Promise<{ sRGBHex?: string }> };

const clamp01 = (n: number) => Math.max(0, Math.min(1, n));

/** Pointer dragging over an element: onMove({ x, y }) with both from 0 to 1, onEnd when released. */
const useDrag = (onMove: (p: { x: number; y: number }) => void, onEnd: () => void) => {
  const ref = useRef<HTMLDivElement>(null);
  const at = (e: React.PointerEvent) => {
    const r = ref.current?.getBoundingClientRect() ?? { left: 0, top: 0, width: 0, height: 0 };
    return { x: r.width ? clamp01((e.clientX - r.left) / r.width) : 0, y: r.height ? clamp01((e.clientY - r.top) / r.height) : 0 };
  };
  return {
    ref,
    onPointerDown: (e: React.PointerEvent<HTMLDivElement>) => {
      if (e.button !== 0) return;
      e.preventDefault();
      e.currentTarget.setPointerCapture?.(e.pointerId);
      e.currentTarget.focus();
      onMove(at(e));
    },
    onPointerMove: (e: React.PointerEvent<HTMLDivElement>) => {
      if (e.currentTarget.hasPointerCapture?.(e.pointerId)) onMove(at(e));
    },
    onPointerUp: (e: React.PointerEvent<HTMLDivElement>) => {
      e.currentTarget.releasePointerCapture?.(e.pointerId);
      onEnd();
    },
  };
};

export const ColorPicker = () => {
  const [label] = TJ.useStateString({ name: 'label', label: 'Label', initialValue: 'Brand color' });
  const [description] = TJ.useStateString({ name: 'description', label: 'Help text', initialValue: '' });
  const [defaultValue] = TJ.useStateString({ name: 'defaultValue', label: 'Default color', initialValue: '#6366f1' });
  const [placeholder] = TJ.useStateString({ name: 'placeholder', label: 'Placeholder', initialValue: 'Pick a color' });
  const [swatches] = TJ.useStateArray({ name: 'swatches', label: 'Preset swatches', placeholder: "['#0f172a', '#6366f1', '#22c55e']", initialValue: SWATCHES });
  const [showSwatches] = TJ.useStateBoolean({ name: 'showSwatches', label: 'Show swatches', initialValue: true });
  const [showPicker] = TJ.useStateBoolean({ name: 'showPicker', label: 'Show saturation and hue picker', initialValue: true });
  const [allowAlpha] = TJ.useStateBoolean({ name: 'allowAlpha', label: 'Allow transparency (alpha)', initialValue: false });
  const [triggerStyle] = TJ.useStateEnumeration({
    name: 'triggerStyle',
    label: 'Trigger',
    enumDefinition: ['field', 'swatch'],
    enumLabels: { field: 'Swatch and hex', swatch: 'Swatch only' },
    initialValue: 'field',
    inspector: 'switch',
  });
  const [showClearBtn] = TJ.useStateBoolean({ name: 'showClearBtn', label: 'Show clear button', initialValue: false });
  // Exposed: the hex (what a Form collects) and UI 2.0's other forms of it.
  const [rawValue, setValue] = TJ.useStateString({ name: 'value', initialValue: '', inspector: 'hidden' });
  const [, setSelectedColorRGB] = TJ.useStateString({ name: 'selectedColorRGB', initialValue: '', inspector: 'hidden' });
  const [, setSelectedColorRGBA] = TJ.useStateString({ name: 'selectedColorRGBA', initialValue: '', inspector: 'hidden' });
  const [, setColorFormat] = TJ.useStateString({ name: 'colorFormat', initialValue: 'hex', inspector: 'hidden' });
  const [, setAllowOpacity] = TJ.useStateBoolean({ name: 'allowOpacity', initialValue: false, inspector: 'hidden' });
  // UI 2.0 exposes isValid as always true: any colour the picker holds is valid.
  TJ.useStateBoolean({ name: 'isValid', initialValue: true, inspector: 'hidden' });
  const [legacyDisabled] = TJ.useStateBoolean({ name: 'disabled', label: 'Disable', initialValue: false, inspector: 'hidden' });
  const onChange = TJ.useEventCallback({ name: 'onChange' });
  const onFocus = TJ.useEventCallback({ name: 'onFocus' });
  const onBlur = TJ.useEventCallback({ name: 'onBlur' });

  const alpha = allowAlpha === true;
  const value = M.normalizeHex(rawValue, alpha) ?? '';
  const triggerRef = useRef<HTMLButtonElement>(null);
  const [anchorRef, container] = usePortalContainer();
  const [open, setOpen] = useState(false);
  const [hsva, setHsvaState] = useState<Hsva>(() => M.toHsva(value));
  const hsvaRef = useRef(hsva);
  const [draft, setDraft] = useState(value);

  const publish = (hex: string) => {
    const forms = M.colorForms(hex);
    setValue(hex);
    setSelectedColorRGB(forms.rgb);
    setSelectedColorRGBA(forms.rgba);
  };
  useReseed(defaultValue, () => publish(M.normalizeHex(defaultValue || rawValue, alpha) ?? ''));
  useReseed(alpha, () => {
    setAllowOpacity(alpha);
    setColorFormat('hex');
  });

  const control = TJ.useControlState();
  const disabled = legacyDisabled || control.disabled;
  // An open popup closes when its owner stops taking input (disabled, or blocked or hidden by the host): useOwnerGuard.
  useOwnerGuard(anchorRef, open, () => setOpen(false), disabled);
  const hexOf = (c: Hsva) => M.rgbaToHex({ ...M.hsvToRgb(c), a: c.a }, alpha);
  const live = open ? hexOf(hsva) : value;
  const setHsva = (next: Hsva) => {
    hsvaRef.current = next;
    setHsvaState(next);
    setDraft(hexOf(next));
  };
  const commit = (hex: string) => {
    if (!hex || hex === value || disabled) return;
    publish(hex);
    onChange();
  };
  const pickHex = (hex: string) => {
    if (disabled) return;
    setHsva(M.toHsva(hex, hsvaRef.current.h));
    setDraft(hex);
    commit(hex);
  };
  const applyDraft = () => {
    const hex = M.normalizeHex(draft, alpha);
    if (hex) pickHex(hex);
    else setDraft(value);
  };
  const openChange = (next: boolean) => {
    if (next && disabled) return;
    if (next) {
      const start = M.toHsva(value);
      hsvaRef.current = start;
      setHsvaState(start);
      setDraft(value);
    }
    setOpen(next);
    (next ? onFocus : onBlur)();
  };
  const commitLive = () => commit(hexOf(hsvaRef.current));
  const area = useDrag(({ x, y }) => setHsva({ ...hsvaRef.current, s: x, v: 1 - y }), commitLive);
  const hue = useDrag(({ x }) => setHsva({ ...hsvaRef.current, h: x * 360 }), commitLive);
  const alphaBar = useDrag(({ x }) => setHsva({ ...hsvaRef.current, a: Math.round(x * 100) / 100 }), commitLive);
  /** Arrow keys on a slider: one channel by a step (ten with Shift), committed. */
  const keys = (channel: keyof Hsva, step: number, max: number) => (e: React.KeyboardEvent) => {
    const dir = ({ ArrowRight: 1, ArrowUp: 1, ArrowLeft: -1, ArrowDown: -1 } as Record<string, number>)[e.key];
    if (!dir) return;
    e.preventDefault();
    const c = hsvaRef.current;
    const next = { ...c, [channel]: Math.max(0, Math.min(max, c[channel] + dir * step * (e.shiftKey ? 10 : 1))) };
    setHsva(next);
    commit(hexOf(next));
  };
  const areaKeys = (e: React.KeyboardEvent) => (e.key === 'ArrowUp' || e.key === 'ArrowDown' ? keys('v', 0.01, 1)(e) : keys('s', 0.01, 1)(e));

  TJ.useAction({ name: 'setColor', displayName: 'Set color', params: [{ handle: 'color', displayName: 'Color', type: 'color' }] }, (c) => {
    if (c === '' || c === null || c === undefined) return publish('');
    const hex = M.normalizeHex(c, alpha);
    if (hex) publish(hex);
    return undefined;
  });
  TJ.useAction({ name: 'setFocus', displayName: 'Set focus' }, () => triggerRef.current?.focus());
  TJ.useAction({ name: 'setBlur', displayName: 'Set blur' }, () => triggerRef.current?.blur());

  const fieldId = TJ.useFieldId();
  const looks = useLooks(LOOKS);
  TJ.useComponentSettings({ defaultWidth: 8, defaultHeight: 7 });

  const colors = M.toSwatches(swatches);
  const opaque = M.rgbaToHex(M.hsvToRgb(hsva), false);
  const Dropper = typeof window !== 'undefined' ? (window as unknown as { EyeDropper?: EyeDropperCtor }).EyeDropper : undefined;
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
  const swatchOnly = triggerStyle === 'swatch';
  const clearable = showClearBtn && !!value && !disabled && !control.loading;
  const clearColor = () => {
    publish('');
    onChange();
    triggerRef.current?.focus();
  };
  const trigger = (
    <Popover.Trigger asChild>
      <button
        ref={triggerRef}
        id={fieldId}
        type="button"
        disabled={disabled}
        aria-label={swatchOnly ? `Color ${value || 'not set'}` : undefined}
        className={cn('ui2-box ui2-color-trigger', swatchOnly && 'is-swatch')}
      >
        <span className={cn('ui2-color-chip', !live && 'is-empty')} style={M.swatchStyle(live)} />
        {swatchOnly ? null : (
          <span className={cn('ui2-color-text', !live && 'is-placeholder')}>{live || placeholder}</span>
        )}
      </button>
    </Popover.Trigger>
  );

  return (
    <div className="ui ui2-in" ref={anchorRef} style={looks}>
      <Field label={label} description={description} htmlFor={fieldId}>
        <FieldLoading loading={control.loading}>
          <Popover.Root open={open} onOpenChange={openChange}>
            {swatchOnly && showClearBtn ? (
              <div className="ui2-color-row">
                {trigger}
                {clearable ? <ClearX onClear={clearColor} /> : null}
              </div>
            ) : showClearBtn ? (
              <div className={cn('ui2-with-clear', clearable && 'has-x')}>
                {trigger}
                {clearable ? <ClearX onClear={clearColor} /> : null}
              </div>
            ) : (
              trigger
            )}
            {container ? (
              <Popover.Portal container={container}>
                <Popover.Content aria-label="Choose a colour" className="ui-popup ui2-in ui2-pop ui2-color-pop" style={looks} align="start" sideOffset={4}>
                  {showPicker !== false ? (
                    <>
                      <div
                        {...area}
                        role="slider"
                        tabIndex={0}
                        aria-label="Saturation and brightness"
                        aria-valuetext={`Saturation ${Math.round(hsva.s * 100)}%, brightness ${Math.round(hsva.v * 100)}%`}
                        onKeyDown={areaKeys}
                        className="ui2-color-area"
                        style={{
                          background: `linear-gradient(to top, #000000, transparent), linear-gradient(to right, #ffffff, hsl(${Math.round(hsva.h)} 100% 50%))`,
                        }}
                      >
                        <span className="ui2-color-thumb" style={{ left: `${hsva.s * 100}%`, top: `${(1 - hsva.v) * 100}%`, background: opaque }} />
                      </div>
                      <div
                        {...hue}
                        role="slider"
                        tabIndex={0}
                        aria-label="Hue"
                        aria-valuemin={0}
                        aria-valuemax={360}
                        aria-valuenow={Math.round(hsva.h)}
                        onKeyDown={keys('h', 1, 360)}
                        className="ui2-color-bar"
                        style={{ background: 'linear-gradient(to right, #f00, #ff0, #0f0, #0ff, #00f, #f0f, #f00)' }}
                      >
                        <span className="ui2-color-thumb" style={{ left: `${(hsva.h / 360) * 100}%`, background: `hsl(${Math.round(hsva.h)} 100% 50%)` }} />
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
                          onKeyDown={keys('a', 0.01, 1)}
                          className="ui2-color-bar"
                          style={{ background: `linear-gradient(to right, transparent, ${opaque}), ${M.CHECKERBOARD}` }}
                        >
                          <span className="ui2-color-thumb" style={{ left: `${hsva.a * 100}%`, background: opaque }} />
                        </div>
                      ) : null}
                    </>
                  ) : null}
                  <div className="ui2-color-hex-row">
                    <span className="ui2-color-preview" style={M.swatchStyle(live)} />
                    <input
                      aria-label="Hex color"
                      spellCheck={false}
                      className="ui-input ui2-color-hex"
                      value={draft}
                      onChange={(e) => setDraft(e.target.value)}
                      onBlur={applyDraft}
                      onKeyDown={(e) => isEnter(e) && applyDraft()}
                    />
                    {typeof Dropper === 'function' ? (
                      <button type="button" className="ui2-color-dropper" aria-label="Pick a color from the screen" onClick={eyeDrop}>
                        <Pipette size={16} />
                      </button>
                    ) : null}
                  </div>
                  {showSwatches !== false && colors.length ? (
                    <div className="ui2-color-swatches">
                      {colors.map((c) => (
                        <button
                          key={c}
                          type="button"
                          title={c}
                          aria-label={c}
                          aria-pressed={c === value}
                          className="ui2-color-swatch"
                          style={M.swatchStyle(c)}
                          onClick={() => pickHex(M.normalizeHex(c, alpha) ?? c)}
                        >
                          {c === value ? <Check size={14} style={{ color: M.contrastOn(c) }} /> : null}
                        </button>
                      ))}
                    </div>
                  ) : null}
                </Popover.Content>
              </Popover.Portal>
            ) : null}
          </Popover.Root>
        </FieldLoading>
      </Field>
    </div>
  );
};
