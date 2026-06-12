import { z } from 'zod';
import { componentTypes } from '../services/widget-config';
import { schemaToZod, UniversalPropertyValue } from './schema-to-zod';

/**
 * PoC: per-widget property schemas are generated only for these widget types.
 * Widgets outside this list are still gated by the structural checks
 * (known type, name) in component.schema.ts. Drop this filter to enable
 * schema generation for the entire registry.
 */
const POC_WIDGETS = ['Button'];

export const COMPONENT_TYPES: Set<string> = new Set(componentTypes.map((config: any) => config.component));

// `value` is optional because update diffs can touch only `fxActive` or other
// sibling keys; when present it must satisfy the typed validator.
const propertyValueObject = (typed: z.ZodTypeAny) => z.object({ value: typed.optional() }).passthrough();

const universalPropertyObject = propertyValueObject(UniversalPropertyValue);

/**
 * Builds a schema for one widget config section (properties / styles / general / others).
 * Keys with a `validation.schema` get a typed check; unknown or unannotated keys
 * fall back to the universal rule (value must never be a plain object).
 */
function buildSectionSchema(sectionConfig: Record<string, any> = {}): z.ZodTypeAny {
  const shape: Record<string, z.ZodTypeAny> = {};
  for (const [propertyName, definition] of Object.entries(sectionConfig)) {
    if (definition?.validation?.schema) {
      shape[propertyName] = propertyValueObject(schemaToZod(definition.validation.schema)).optional();
    }
  }
  return z.object(shape).catchall(universalPropertyObject);
}

function buildWidgetSchema(config: any): z.ZodTypeAny {
  return z
    .object({
      properties: buildSectionSchema(config.properties).optional(),
      styles: buildSectionSchema(config.styles).optional(),
      general: buildSectionSchema(config.general).optional(),
      others: buildSectionSchema(config.others).optional(),
    })
    .passthrough();
}

/** widgetType → Zod schema, auto-generated from `validation.schema` in widget configs at module init. */
export const WIDGET_ZOD_SCHEMAS: Record<string, z.ZodTypeAny> = Object.fromEntries(
  componentTypes
    .filter((config: any) => POC_WIDGETS.includes(config.component))
    .map((config: any) => [config.component, buildWidgetSchema(config)])
);
