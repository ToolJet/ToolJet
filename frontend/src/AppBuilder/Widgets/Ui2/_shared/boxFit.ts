// How a UI 2.0 widget drawn at its box's height sits in the box, when the fixed-box policy (Shell's FIXED_BOX, for
// widgets with a Dynamic height setting) does not already apply: a widget that never measures itself (a Progress bar,
// a Badge, a chart), and a fitted one in the editor. Its root fills the box, so no band shows under a short one (a
// Progress bar's 8px root sat at the top of its 40px box), small content is centred in it, and content taller or wider
// than the box scrolls inside it instead of painting over the widgets around it (a Dropdown menu's 36px button in a
// 20px box). The root scrolls only while its content overflows: a scroller clips focus rings, which a control that fits
// its box keeps.
import { useLayoutEffect, useState } from 'react';
import type { CSSProperties, RefObject } from 'react';
import { isPackBoxSized } from '@/AppBuilder/_helpers/dynamicHeightPolicy';
import { inFixedBox } from './useDynamicHeight';

// Small content, centred in its box.
const CENTRED = new Set([
  'ShadProgress',
  'ShadBreadcrumb',
  'ShadAvatar',
  'ShadBadge',
  'ShadSpinner',
  'ShadLink',
  'ShadIcon',
]);

interface BoxProps {
  componentType: string;
  properties: Record<string, unknown>;
  currentMode?: string;
  height?: number;
  width?: number;
}

/** Whether the widget is drawn at its box's height: always for one that never measures itself, else in a fixed box. */
export const drawnAtBoxHeight = ({ componentType, properties, currentMode }: BoxProps): boolean =>
  isPackBoxSized(componentType) || inFixedBox({ componentType, properties, currentMode });

/** The root's classes and style for `props`, unless `contained` (the fixed-box policy applies instead). */
export const useBoxFit = (
  props: BoxProps,
  root: RefObject<HTMLElement>,
  contained: boolean
): { className?: string; style: CSSProperties } => {
  const boxed = !contained && drawnAtBoxHeight(props);
  const [overflowing, setOverflowing] = useState(false);
  useLayoutEffect(() => {
    const el = root.current;
    if (!boxed || !el) {
      setOverflowing(false);
      return undefined;
    }
    const check = () => setOverflowing(el.scrollHeight > el.clientHeight + 1 || el.scrollWidth > el.clientWidth + 1);
    check();
    if (typeof ResizeObserver === 'undefined') return undefined;
    const observer = new ResizeObserver(check);
    observer.observe(el);
    Array.from(el.children).forEach((child) => observer.observe(child));
    return () => observer.disconnect();
  }, [boxed, root, props.height, props.width]);
  if (!boxed) return { style: {} };
  return {
    className: overflowing ? 'tw-h-full tw-min-h-0 tw-overflow-auto' : 'tw-h-full tw-min-h-0',
    style: CENTRED.has(props.componentType)
      ? { display: 'flex', flexDirection: 'column', justifyContent: 'safe center' }
      : {},
  };
};
