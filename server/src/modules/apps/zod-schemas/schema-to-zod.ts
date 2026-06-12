import { z } from 'zod';

/**
 * Property values at rest are usually string expressions ('{{false}}', '{{14}}')
 * regardless of the declared validation type, so every typed validator must also
 * accept a string. The rule that holds universally: a property `value` is never
 * a plain object — that shape is the double-wrap corruption pattern.
 */
export const UniversalPropertyValue = z.union([z.string(), z.number(), z.boolean(), z.array(z.any()), z.null()]);

export interface WidgetValidationSchema {
  type?: string;
  schemas?: WidgetValidationSchema[] | WidgetValidationSchema;
}

export function schemaToZod(schema: WidgetValidationSchema | undefined): z.ZodTypeAny {
  switch (schema?.type) {
    case 'string':
      return z.string();
    case 'boolean':
      // stored as '{{false}}' (string) or occasionally a raw boolean
      return z.union([z.string(), z.boolean()]);
    case 'number':
      return z.union([z.string(), z.number()]);
    case 'array':
      return z.union([z.string(), z.array(z.any())]);
    case 'union': {
      const members = (Array.isArray(schema.schemas) ? schema.schemas : []).map(schemaToZod);
      if (members.length >= 2) return z.union(members as [z.ZodTypeAny, z.ZodTypeAny, ...z.ZodTypeAny[]]);
      return members[0] ?? UniversalPropertyValue;
    }
    default:
      return UniversalPropertyValue;
  }
}
