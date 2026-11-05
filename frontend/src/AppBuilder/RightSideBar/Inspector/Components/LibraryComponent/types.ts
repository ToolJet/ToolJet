export interface ComponentIdentity {
  libraryId?: string;
  correlationId?: string;
  componentName?: string;
}

export interface InspectorComponent {
  id?: string;
  component?: {
    definition?: {
      properties?: Record<string, { value?: string }>;
      styles?: Record<string, { value?: unknown }>;
    };
  };
}

/**
 * Manifest `inspector` hints drawn by a purpose-built editor rather than a native field type: 'columns' (a table's
 * column objects), 'options' (a list of plain values or { label, value, disabled, description, icon }) and 'icon' (an
 * icon name). 'color' needs no editor of its own: it maps to the native swatch field.
 */
export type LibraryEditorHint = 'columns' | 'options' | 'icon';

export interface FieldMeta {
  // false hides the native icon field's show/hide toggle
  visibility?: boolean;
  displayName?: string;
  name: string;
  type?: string;
  checkboxLabel?: string;
  showLabel?: boolean;
  // Label tooltip (ToolTip.jsx reads meta.tip): the only helper-note channel native field meta has.
  tip?: string;
  placeholder?: string;
  // Read by the slider field (CodeBuilder/Elements/Slider.jsx); also spelled out in `tip` for other field types.
  min?: number;
  max?: number;
  options?: { value: string; [labelKey: string]: string }[];
  validation?: { schema: { type: string }; defaultValue?: unknown };
}

export type ParamUpdated = (
  param: Record<string, unknown>,
  attr: string,
  value: unknown,
  paramType: string,
  isParamFromTableColumn?: boolean,
  props?: Record<string, unknown>
) => void;

export type LayoutPropertyChanged = (param: unknown, attr: string, value: unknown, paramType: string) => void;

export type EventsChanged = (events: unknown) => void;

export interface LibraryComponentPropertiesProps {
  componentMeta: Record<string, unknown>;
  darkMode: boolean;
  layoutPropertyChanged: LayoutPropertyChanged;
  component: InspectorComponent;
  paramUpdated: ParamUpdated;
  dataQueries: unknown;
  currentState: unknown;
  eventsChanged: EventsChanged;
  apps: unknown;
  allComponents: Record<string, unknown>;
  pages: unknown;
}

export interface LibraryComponentStylesProps {
  componentMeta: Record<string, unknown>;
  component: InspectorComponent;
  paramUpdated: ParamUpdated;
  dataQueries: unknown;
  currentState: unknown;
  allComponents: Record<string, unknown>;
  darkMode: boolean;
}
