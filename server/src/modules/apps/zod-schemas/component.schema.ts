import { z } from 'zod';
import { BadRequestException } from '@nestjs/common';
import { COMPONENT_TYPES, WIDGET_ZOD_SCHEMAS } from './widget-schema-registry';

export interface ValidationIssue {
  path: (string | number)[];
  message: string;
}

/** Structural (Layer 1) check applied to every component in a create diff. */
export const ComponentCreateSchema = z
  .object({
    name: z.string(),
    type: z.string().refine(
      (type) => COMPONENT_TYPES.has(type),
      (type) => ({ message: `Invalid component type: '${type}'` })
    ),
    layouts: z.object({}).passthrough().optional(),
  })
  .passthrough();

function collectIssues(
  result: z.SafeParseReturnType<unknown, unknown>,
  basePath: (string | number)[]
): ValidationIssue[] {
  if (result.success) return [];
  return result.error.issues.map((issue) => ({
    path: [...basePath, ...issue.path],
    message: issue.message,
  }));
}

function throwIfInvalid(issues: ValidationIssue[]): void {
  if (issues.length === 0) return;
  throw new BadRequestException({
    statusCode: 400,
    error: 'App JSON validation failed',
    issues,
  });
}

/**
 * Validates a component create diff (`diff[componentId] = { name, type, properties, styles, ... }`).
 * Throws BadRequestException with a Zod issue list on failure.
 */
export function validateComponentCreateDiff(diff: Record<string, any>): void {
  const issues: ValidationIssue[] = [];

  for (const [componentId, payload] of Object.entries(diff ?? {})) {
    issues.push(...collectIssues(ComponentCreateSchema.safeParse(payload), [componentId]));

    const widgetSchema = payload?.type && WIDGET_ZOD_SCHEMAS[payload.type];
    if (widgetSchema) {
      issues.push(...collectIssues(widgetSchema.safeParse(payload), [componentId]));
    }
  }

  throwIfInvalid(issues);
}

/**
 * Validates a component definition update diff (`component.definition` from an update
 * payload) against the schema of the widget type stored in the DB.
 * Throws BadRequestException with a Zod issue list on failure.
 */
export function validateComponentDefinitionUpdate(
  componentId: string,
  componentType: string,
  definition: Record<string, any>
): void {
  const widgetSchema = WIDGET_ZOD_SCHEMAS[componentType];
  if (!widgetSchema || !definition) return;

  throwIfInvalid(collectIssues(widgetSchema.safeParse(definition), [componentId]));
}
