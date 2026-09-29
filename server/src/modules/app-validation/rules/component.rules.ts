import { isKnownComponentType } from '../catalog';
import { ComponentWrite, Rule } from '../types';

// The call site must fill in `data.type`: partial MCP updates don't carry it.
export const componentKnownType: Rule<ComponentWrite> = {
  id: 'component-known-type',
  description: 'The component type is a registered widget',
  check(write) {
    if (write.op === 'delete' || !write.data?.type) return [];
    if (write.op === 'update' && !write.touched?.includes('type')) return [];
    if (isKnownComponentType(write.data.type)) return [];

    const name = write.data.name ?? write.id;
    return [
      {
        code: 'COMPONENT_UNKNOWN_TYPE',
        severity: 'critical',
        confidence: 'certain',
        path: `${name}.type`,
        message: `${name} → type: "${write.data.type}" is not a registered widget`,
        entity: { type: 'component', id: write.id, name: write.data.name },
        fix: 'Use one of the widget types from the component catalog, e.g. "Button" or "Table".',
      },
    ];
  },
};

export const componentRules: Rule<ComponentWrite>[] = [componentKnownType];
