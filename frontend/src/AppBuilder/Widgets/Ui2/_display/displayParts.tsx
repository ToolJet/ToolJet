import React from 'react';
import * as Lucide from 'lucide-react';
import type { LucideIcon } from 'lucide-react';
import type { KeyboardEvent } from 'react';
import type { Resolved } from '@/AppBuilder/Widgets/Ui2/_shared/types';
import { resolveIcon } from './iconModel';
import '@/AppBuilder/Widgets/Ui2/_shared/styles/shadcn.scss';

// shadcn/ui pack (experiment): display widgets. Configs in WidgetManager/widgets/shad*.js, style variables and
// loading looks in looks/display.js, data logic in displayModel.js. Colours come from the theme (shadcn tokens) and
// each is overridable by a style through a CSS variable.

const { Circle, CircleDashed } = Lucide;
const ICON_MAPS = [Lucide.icons, Lucide];
const NEUTRAL_ICON = CircleDashed || Circle;
export function iconFor(name: unknown): LucideIcon;
export function iconFor(name: unknown, fallback: LucideIcon | null): LucideIcon | null;
export function iconFor(name: unknown, fallback: LucideIcon | null = NEUTRAL_ICON) {
  return resolveIcon(name, ICON_MAPS, fallback);
}

/** One lucide icon by name, for other pack widgets that load it on demand (the Stat's icon): this module holds the
 *  icon map, so a widget without an icon never loads it. */
export const IconGlyph = ({
  name,
  size = 20,
  strokeWidth = 2,
}: {
  name: unknown;
  size?: number;
  strokeWidth?: number;
}) => {
  const Icon = iconFor(name);
  return <Icon size={size} strokeWidth={strokeWidth} aria-hidden="true" />;
};

/** A map entry for a property value, never an inherited key (a "constructor" from junk data). */
export const own = <T,>(map: Record<string, T>, key: unknown): T | undefined =>
  typeof key === 'string' && Object.prototype.hasOwnProperty.call(map, key) ? map[key] : undefined;
const JUSTIFY: Record<string, string> = { left: 'justify-start', center: 'justify-center', right: 'justify-end' };
export const justify = (styles: Resolved | undefined, fallback = 'left'): string | undefined =>
  own(JUSTIFY, styles?.alignment) || JUSTIFY[fallback];

/** Enter or Space activates a div acting as a button. */
export const onKeyActivate =
  <E extends Element>(handler: (e: KeyboardEvent<E>) => void) =>
  (e: KeyboardEvent<E>) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      handler(e);
    }
  };
