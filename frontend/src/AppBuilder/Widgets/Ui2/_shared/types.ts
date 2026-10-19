// What RenderWidget (AppCanvas/RenderWidget.jsx) passes every UI 2.0 widget, and the shapes the shared helpers use.
import type { CSSProperties } from 'react';

/**
 * A widget's resolved properties, styles or validation: whatever the app's bindings evaluate to. An app can bind any
 * value to any key (a binding that has not resolved yet is undefined, a misconfigured one can be an object or NaN),
 * so the widgets read every value defensively and these maps stay untyped by design.
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export type Resolved = Record<string, any>;

/** A value inside a bound property, such as an item of a bound list (packHooks' list): untyped for the same reason. */
export type Bound = Resolved[string];

/** The result of the widget's Validation section for a value (ToolJet's validateWidget). */
export interface ValidationResult {
  isValid?: boolean;
  validationError?: string;
}

export type ValidationStatus = ValidationResult | null | undefined;

export interface WidgetProps {
  id: string;
  componentType: string;
  componentName?: string;
  properties: Resolved;
  styles: Resolved;
  validation?: Resolved;
  /** The widget's box in px, from the grid or its FlexContainer. */
  width: number;
  height: number;
  /** How the box was sized: placed on the grid, a fixed-width flex child, or a flex child that fills its share of the
   *  line (WidgetWrapper, from useFlexWidgetLayout). */
  boxFit?: 'grid' | 'fixed' | 'fill';
  /** The box is stretched to its row's height: an Equal heights FlexContainer row lines up its cards
   *  (dynamicHeightPolicy.stretchesInRow). A widget with a surface fills it; its content height is still its own. */
  boxStretch?: boolean;
  currentMode?: 'edit' | 'view';
  currentLayout?: string;
  darkMode?: boolean;
  dataCy?: string;
  parentId?: string;
  subContainerIndex?: number;
  /** The control's DOM id (withControlState): `shad-<id>`, with an instance suffix inside repeated rows. */
  domId?: string;
  setExposedVariable: (key: string, value: unknown) => void;
  setExposedVariables: (values: Record<string, unknown>) => void;
  fireEvent: (event: string, options?: unknown) => void;
  validate?: (value: unknown) => ValidationStatus;
  resetComponent?: () => void;
  onComponentClick?: (id: string) => void;
}

/** CSS custom properties ({ '--lk-bg': '#fff' }); a style accepts them as they are. */
export type CssVars = { [name: `--${string}`]: string };

/** A style that also sets CSS custom properties. */
export type StyleWithVars = CSSProperties & CssVars;

/** One style of a widget as CSS: the style key, the variable(s) it sets, and how to write the value (String when
 *  absent). */
export type LookEntry = readonly [
  styleKey: string,
  cssVar: string | readonly string[],
  toCss?: (value: unknown) => string
];

/** Style key -> CSS variable entries, by component type (looks/shadcnLook.ts LOOKS and the group modules). */
export type LookMap = Record<string, readonly LookEntry[]>;

/** How a widget looks while loading (Shell's LOADING_LOOK). */
export type LoadingLook =
  | 'own'
  | 'field'
  | 'inline'
  | 'inline-top'
  | 'wide'
  | 'heading'
  | 'text'
  | 'line'
  | 'pill'
  | 'avatar'
  | 'bar'
  | 'columns'
  | 'block';

/** Loading look by component type. */
export type LoadingMap = Record<string, LoadingLook>;
