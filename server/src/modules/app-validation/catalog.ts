import { componentTypes } from '@modules/apps/services/widget-config';
import { ComponentData } from './types';
import { ValueSchema } from './values';

// Rule data comes from the server's widget config, the same objects used to fill in defaults on load.

export const SETTING_SECTIONS = ['properties', 'styles', 'general', 'generalStyles', 'validation', 'others'] as const;
export type SettingSection = (typeof SETTING_SECTIONS)[number];

// `others` is stored as `displayPreferences`.
export const SECTION_TO_COLUMN: Record<SettingSection, keyof ComponentData> = {
  properties: 'properties',
  styles: 'styles',
  general: 'general',
  generalStyles: 'generalStyles',
  validation: 'validation',
  others: 'displayPreferences',
};

export interface SettingDefinition {
  type?: string;
  displayName?: string;
  validation?: { schema?: ValueSchema; defaultValue?: unknown };
  options?: Array<{ value?: unknown }>;
}

export type WidgetDefinition = { component: string; events?: Record<string, unknown> } & Partial<
  Record<SettingSection, Record<string, SettingDefinition>>
>;

// Inspector controls whose `options` are the complete set of allowed plain values.
// `select` is excluded: the editor extends its options at runtime (Form's buttonToSubmit
// lists only "none" but stores Button ids). `clientServerSwitch` is excluded: its declared
// schema is boolean and old rows store true/false, not the option values.
const OPTION_CONTROLS = new Set(['switch', 'dropdownMenu']);

let widgetsByType: Map<string, WidgetDefinition> | undefined;

function widgets(): Map<string, WidgetDefinition> {
  widgetsByType ??= new Map((componentTypes as WidgetDefinition[]).map((widget) => [widget.component, widget]));
  return widgetsByType;
}

export function getWidget(type: string | undefined): WidgetDefinition | undefined {
  return type ? widgets().get(type) : undefined;
}

export function isKnownComponentType(type: string | undefined): boolean {
  return !!type && widgets().has(type);
}

export function getSetting(type: string, section: SettingSection, key: string): SettingDefinition | undefined {
  return getWidget(type)?.[section]?.[key];
}

export function valueSchemaOf(type: string, section: SettingSection, key: string): ValueSchema | undefined {
  return getSetting(type, section, key)?.validation?.schema;
}

// Settings whose stored values predate an options redesign and are still rendered fine.
// `padding` was a free number before the default/custom switch; templates ship "0", "1", "2".
const LEGACY_OPTION_SETTINGS = new Set(['padding']);

// Undefined when the setting takes free input.
export function allowedOptionValues(type: string, section: SettingSection, key: string): unknown[] | undefined {
  if (LEGACY_OPTION_SETTINGS.has(key)) return undefined;
  const setting = getSetting(type, section, key);
  if (!setting?.options?.length || !OPTION_CONTROLS.has(setting.type)) return undefined;
  if (!setting.options.every((option) => option && 'value' in option)) return undefined;
  return setting.options.map((option) => option.value);
}

export function widgetEvents(type: string): string[] {
  return Object.keys(getWidget(type)?.events ?? {});
}

export function settingLabel(type: string, section: SettingSection, key: string): string {
  return getSetting(type, section, key)?.displayName || key;
}
