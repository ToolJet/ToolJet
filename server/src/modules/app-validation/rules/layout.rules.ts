import { Issue, LayoutWrite, Rule, RuleContext } from '../types';

export const LAYOUT_TYPES = ['desktop', 'mobile'] as const;

const SIZE_FIELDS = ['width', 'height'] as const;
const POSITION_FIELDS = ['top', 'left'] as const;
const NUMERIC_FIELDS = [...POSITION_FIELDS, ...SIZE_FIELDS, 'widthPx'] as const;

function labelOf(write: LayoutWrite): string {
  return write.data?.componentId ?? write.id;
}

// Skips fields an update didn't touch, so old mistakes elsewhere stay warnings.
function touchedField(write: LayoutWrite, field: string): boolean {
  if (write.op !== 'update' || !write.touched) return field in (write.data ?? {});
  return write.touched.includes(field) && field in (write.data ?? {});
}

function asNumber(value: unknown): number | undefined {
  if (typeof value === 'number') return value;
  // The editor's own exports store sub-grid floats; numeric strings appear in old exports.
  if (typeof value === 'string' && value.trim() !== '' && !Number.isNaN(Number(value))) return Number(value);
  return undefined;
}

// The layout type addresses the stored row: an unknown one is silently a no-op on update
// and a database enum crash on insert.
export const layoutTypeKnown: Rule<LayoutWrite> = {
  id: 'layout-type-known',
  description: 'The layout type is desktop or mobile',
  check(write) {
    if (write.op === 'delete' || !write.data?.type) return [];
    if ((LAYOUT_TYPES as readonly string[]).includes(write.data.type)) return [];
    return [
      {
        code: 'LAYOUT_UNKNOWN_TYPE',
        severity: 'critical',
        confidence: 'certain',
        path: `${labelOf(write)}.layouts.${write.data.type}`,
        message: `${labelOf(write)} → layout type: "${write.data.type}" is not a layout, expected desktop or mobile`,
        entity: { type: 'layout', id: write.id },
        fix: 'Use "desktop" or "mobile" as the layout key.',
      },
    ];
  },
};

// Postgres double precision accepts NaN, so a bad value persists silently and the canvas
// breaks on load. Negative values only warn: ToolJet's own templates ship negative divider
// heights (-172) and overlap tops (-10), and they render fine.
export const layoutNumbersValid: Rule<LayoutWrite> = {
  id: 'layout-numbers-valid',
  description: 'Layout dimensions are finite numbers',
  check(write) {
    if (write.op === 'delete' || !write.data) return [];
    const type = write.data.type ?? 'desktop';
    const issues: Issue[] = [];

    for (const field of NUMERIC_FIELDS) {
      if (!touchedField(write, field)) continue;
      const raw = (write.data as Record<string, unknown>)[field];
      if (raw === undefined || raw === null) continue;
      const path = `${labelOf(write)}.layouts.${type}.${field}`;
      const value = asNumber(raw);

      if (value === undefined || !Number.isFinite(value)) {
        issues.push({
          code: 'LAYOUT_VALUE_NOT_NUMBER',
          severity: 'high',
          confidence: 'certain',
          path,
          message: `${labelOf(write)} → ${type} layout ${field}: must be a finite number, got ${JSON.stringify(raw)}`,
          entity: { type: 'layout', id: write.id },
          fix: 'Send a plain finite number, e.g. 10.',
        });
        continue;
      }

      if ((SIZE_FIELDS as readonly string[]).includes(field) && value < 0) {
        issues.push({
          code: 'LAYOUT_NEGATIVE_SIZE',
          severity: 'medium',
          confidence: 'heuristic',
          path,
          message: `${labelOf(write)} → ${type} layout ${field}: ${value} is negative, which usually hides the component`,
          entity: { type: 'layout', id: write.id },
        });
      } else if ((POSITION_FIELDS as readonly string[]).includes(field) && value < -1) {
        // Tolerates the tiny negative float artifacts the editor's own drag math produces
        // (ToolJet templates contain lefts like -0.0000084).
        issues.push({
          code: 'LAYOUT_OFFSCREEN_POSITION',
          severity: 'medium',
          confidence: 'heuristic',
          path,
          message: `${labelOf(write)} → ${type} layout ${field}: ${value} places the component off-canvas`,
          entity: { type: 'layout', id: write.id },
        });
      }
    }
    return issues;
  },
};

// Today the save code checks the id exists but not that it belongs to this version, so a
// caller who knows a foreign id can move another app's components.
export const layoutComponentInVersion: Rule<LayoutWrite> = {
  id: 'layout-component-in-version',
  description: 'The layout belongs to a component of this app version',
  async check(write, ctx: RuleContext) {
    if (write.op === 'delete') return [];
    const componentId = write.data?.componentId ?? write.id;
    if (!componentId) return [];
    const index = await ctx.index();
    if (index.component(componentId)) return [];
    return [
      {
        code: 'LAYOUT_COMPONENT_NOT_FOUND',
        severity: 'high',
        confidence: 'certain',
        path: `${componentId}.layouts`,
        message: `${componentId} → layout: no component with this id exists in this app version`,
        entity: { type: 'layout', id: componentId },
        fix: 'Use the id of a component that belongs to the version being edited.',
      },
    ];
  },
};

export const layoutRules: Rule<LayoutWrite>[] = [layoutTypeKnown, layoutNumbersValid, layoutComponentInVersion];
