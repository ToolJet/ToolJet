import React from 'react';
import * as Lucide from 'lucide-react';
import type { LucideIcon } from 'lucide-react';
import type { Resolved } from '@/AppBuilder/Widgets/Ui2/_shared/types';
import { resolveIcon } from './iconModel';
import '@/AppBuilder/Widgets/Ui2/_shared/styles/shadcn.scss';
import { own } from '@/AppBuilder/Widgets/Ui2/_shared/values';

// ToolJet UI 2.0: display widgets. Configs in WidgetManager/widgets/shad*.js, style variables and
// loading looks in looks/display.ts, data logic in displayModel.ts. Colours come from the theme (shadcn tokens) and
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

const JUSTIFY: Record<string, string> = {
  left: 'tw-justify-start',
  center: 'tw-justify-center',
  right: 'tw-justify-end',
};
export const justify = (styles: Resolved | undefined, fallback = 'left'): string | undefined =>
  own(JUSTIFY, styles?.alignment) || JUSTIFY[fallback];
