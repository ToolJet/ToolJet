import React from 'react';
import * as Lucide from 'lucide-react';
import { resolveIcon } from './displayModel';
import '@/AppBuilder/Widgets/Ui2/_shared/styles/shadcn.scss';

// shadcn/ui pack (experiment): display widgets. Configs in WidgetManager/widgets/shad*.js, style variables and
// loading looks in looks/display.js, data logic in displayModel.js. Colours come from the theme (shadcn tokens) and
// each is overridable by a style through a CSS variable.

const { Circle, CircleDashed } = Lucide;
const ICON_MAPS = [Lucide.icons, Lucide];
const NEUTRAL_ICON = CircleDashed || Circle;
export const iconFor = (name, fallback = NEUTRAL_ICON) => resolveIcon(name, ICON_MAPS, fallback);

/** One lucide icon by name, for other pack widgets that load it on demand (the Stat's icon): this module holds the
 *  icon map, so a widget without an icon never loads it. */
export const IconGlyph = ({ name, size = 20, strokeWidth = 2 }) => {
  const Icon = iconFor(name);
  return <Icon size={size} strokeWidth={strokeWidth} aria-hidden="true" />;
};

/** A map entry for a property value, never an inherited key (a "constructor" from junk data). */
export const own = (map, key) =>
  typeof key === 'string' && Object.prototype.hasOwnProperty.call(map, key) ? map[key] : undefined;
const JUSTIFY = { left: 'justify-start', center: 'justify-center', right: 'justify-end' };
export const justify = (styles, fallback = 'left') => own(JUSTIFY, styles?.alignment) || JUSTIFY[fallback];

/** Enter or Space activates a div acting as a button. */
export const onKeyActivate = (handler) => (e) => {
  if (e.key === 'Enter' || e.key === ' ') {
    e.preventDefault();
    handler(e);
  }
};
