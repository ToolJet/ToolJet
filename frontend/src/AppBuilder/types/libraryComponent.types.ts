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
  // v2 manifest (packages/pack-tools/build.mjs): what the SDK hook call declared beyond the CLI's static fields.
  description?: string;
  placeholder?: string;
  min?: number;
  max?: number;
  // Conditional field: shown only while the instance's resolved value of `key` equals `value`.
  visibleWhen?: ManifestVisibleWhen;
}

export interface ManifestVisibleWhen {
  key: string;
  value: unknown;
}

export interface ManifestEvent {
  name: string;
  displayName?: string;
}

// Which native validation fields the component honors: text inputs get the full set, choice and date
// controls only mandatory + custom rule (a regex or length limit means nothing for a selected option or date).
export type ManifestValidationKind = 'text' | 'choice' | 'date';

export interface ManifestSlot {
  name: string;
  kind?: string;
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
  // v2 manifest fields
  defaultWidth?: number;
  defaultHeight?: number;
  validation?: ManifestValidationKind;
  // The component reads the host's standard control state (disabledState), so the Inspector offers it.
  controlState?: boolean;
  slots?: ManifestSlot[];
  role?: string;
  usage?: string;
  fit?: boolean;
}

export interface LibraryManifest {
  manifestVersion?: number;
  pack?: string;
  components?: Record<string, ManifestComponent>;
}
