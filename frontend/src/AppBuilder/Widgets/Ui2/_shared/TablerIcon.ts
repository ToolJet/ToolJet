import type { ComponentType, SVGProps } from 'react';
import TablerIconComponent from '@/_ui/Icon/TablerIcon';

/** The props _ui/Icon/TablerIcon reads: the Tabler icon's name, a fallback, and the SVG props it passes to the icon. */
export interface TablerIconProps extends Omit<SVGProps<SVGSVGElement>, 'stroke'> {
  /** The icon's component name, e.g. 'IconHome2'. */
  iconName: string;
  fallbackIcon?: string;
  stroke?: number | string;
}

// TablerIcon.jsx is JavaScript (memo of untyped props), so TypeScript sees no props: this gives them a type.
export const TablerIcon = TablerIconComponent as ComponentType<TablerIconProps>;
