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
    };
  };
}

export interface FieldMeta {
  displayName?: string;
  name: string;
  type?: string;
  checkboxLabel?: string;
  options?: { value: string; [labelKey: string]: string }[];
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
