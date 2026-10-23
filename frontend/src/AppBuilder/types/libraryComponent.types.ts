// Shape of a CCL library's manifest.json — shared by the widget runner
// (Widgets/LibraryComponent.jsx) and the Inspector panel (RightSideBar/Inspector/
// Components/LibraryComponent), which both read it independently.

export interface ManifestProp {
  name: string;
  label?: string;
  type: 'boolean' | 'enumeration' | string;
  inspector?: string;
  enumValues?: string[];
  enumLabels?: Record<string, string>;
  default?: unknown;
  section?: string;
}

export interface ManifestEvent {
  name: string;
}

export interface ManifestActionParam {
  handle: string;
  displayName?: string;
  defaultValue?: unknown;
  type?: string;
  options?: { name: string; value: string }[];
}

export interface ManifestAction {
  name: string;
  displayName?: string;
  params?: ManifestActionParam[];
}

export interface ManifestComponent {
  displayName?: string;
  props?: ManifestProp[];
  // ToolJet.useStyleX declarations: Styles-tab fields, stored in definition.styles, never exposed.
  styles?: ManifestProp[];
  events?: ManifestEvent[];
  actions?: ManifestAction[];
}

export interface LibraryManifest {
  components?: Record<string, ManifestComponent>;
}
