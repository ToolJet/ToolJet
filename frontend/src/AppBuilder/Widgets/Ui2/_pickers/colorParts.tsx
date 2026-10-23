// ToolJet UI 2.0: the Color picker's building blocks: the colour as HSVA, a swatch's fill, the editor's sliders (thumb,
// focus ring, pointer dragging). The pure colour maths is in colorModel.ts.
import { useRef } from 'react';
import * as M from '@/AppBuilder/Widgets/Ui2/_pickers/colorModel';
import type { CSSProperties, PointerEvent } from 'react';
import type { Hsv } from '@/AppBuilder/Widgets/Ui2/_pickers/colorModel';

/** A colour as hue, saturation, value and alpha (0-1). */
export type Hsva = Hsv & { a: number };

/** The EyeDropper API (Chromium only), missing from TypeScript's DOM types. */
export interface EyeDropperWindow {
  EyeDropper?: new () => { open: () => Promise<{ sRGBHex?: string }> };
}

export const CHECKERBOARD = 'repeating-conic-gradient(#d4d4d4 0% 25%, #ffffff 0% 50%) 50% / 8px 8px';

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
  'tw-pointer-events-none tw-absolute tw-h-4 tw-w-4 -tw-translate-x-1/2 -tw-translate-y-1/2 tw-rounded-full tw-border-2 tw-border-white tw-shadow-[0_0_0_1px_rgba(0,0,0,0.25),0_1px_3px_rgba(0,0,0,0.3)]';

export const SLIDER_FOCUS =
  'tw-outline-none focus-visible:tw-ring-2 focus-visible:tw-ring-ui2-ring focus-visible:tw-ring-offset-1';

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
