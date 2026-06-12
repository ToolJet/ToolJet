import { BadRequestException } from '@nestjs/common';
import {
  validateComponentCreateDiff,
  validateComponentDefinitionUpdate,
  COMPONENT_TYPES,
  WIDGET_ZOD_SCHEMAS,
} from '../../../../src/modules/apps/zod-schemas';

const validButtonDiff = {
  'comp-1': {
    name: 'button1',
    type: 'Button',
    properties: {
      text: { value: 'Button', fxActive: false },
      loadingState: { value: '{{false}}', fxActive: false },
      visibility: { value: '{{true}}' },
    },
    styles: {
      textSize: { value: '{{14}}' },
      backgroundColor: { value: 'var(--cc-primary-brand)' },
      borderRadius: { value: '{{6}}' },
    },
    layouts: {
      desktop: { top: 100, left: 10, width: 4, height: 40 },
    },
  },
};

const issuesOf = (fn: () => void) => {
  try {
    fn();
  } catch (err) {
    expect(err).toBeInstanceOf(BadRequestException);
    return (err as BadRequestException).getResponse() as any;
  }
  throw new Error('expected validation to throw');
};

describe('App JSON validation (PoC — Button)', () => {
  it('builds COMPONENT_TYPES from the widget config registry', () => {
    expect(COMPONENT_TYPES.has('Button')).toBe(true);
    expect(COMPONENT_TYPES.has('Table')).toBe(true);
    expect(COMPONENT_TYPES.size).toBeGreaterThan(50);
  });

  it('generates a Zod schema for Button from validation.schema', () => {
    expect(WIDGET_ZOD_SCHEMAS['Button']).toBeDefined();
  });

  it('accepts a valid Button create diff', () => {
    expect(() => validateComponentCreateDiff(validButtonDiff)).not.toThrow();
  });

  it('rejects an unknown widget type (AI hallucination)', () => {
    const diff = { 'comp-1': { ...validButtonDiff['comp-1'], type: 'SuperChart' } };
    const response = issuesOf(() => validateComponentCreateDiff(diff));
    expect(response.error).toBe('App JSON validation failed');
    expect(response.issues).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ path: ['comp-1', 'type'], message: "Invalid component type: 'SuperChart'" }),
      ])
    );
  });

  it('rejects double-wrapped property values', () => {
    const diff = {
      'comp-1': {
        ...validButtonDiff['comp-1'],
        properties: {
          text: { value: { value: '{{Button}}', fxActive: false } },
        },
      },
    };
    const response = issuesOf(() => validateComponentCreateDiff(diff));
    expect(response.issues[0].path).toEqual(['comp-1', 'properties', 'text', 'value']);
  });

  it('rejects double-wrap on properties without validation.schema via the universal rule', () => {
    const diff = {
      'comp-1': {
        ...validButtonDiff['comp-1'],
        styles: {
          someUnknownStyle: { value: { nested: true } },
        },
      },
    };
    expect(() => validateComponentCreateDiff(diff)).toThrow(BadRequestException);
  });

  it('rejects a missing component name', () => {
    const { name, ...rest } = validButtonDiff['comp-1'];
    const response = issuesOf(() => validateComponentCreateDiff({ 'comp-1': rest }));
    expect(response.issues).toEqual(
      expect.arrayContaining([expect.objectContaining({ path: ['comp-1', 'name'] })])
    );
  });

  it('validates definition updates against the DB-resolved widget type', () => {
    const corruptedDefinition = {
      properties: { text: { value: { value: 'oops' } } },
    };
    expect(() => validateComponentDefinitionUpdate('comp-1', 'Button', corruptedDefinition)).toThrow(
      BadRequestException
    );

    const validDefinition = { properties: { text: { value: 'Updated' } } };
    expect(() => validateComponentDefinitionUpdate('comp-1', 'Button', validDefinition)).not.toThrow();
  });

  it('skips per-widget validation for types outside the PoC registry', () => {
    const definition = { properties: { data: { value: { anything: 'goes' } } } };
    expect(() => validateComponentDefinitionUpdate('comp-1', 'Table', definition)).not.toThrow();
  });
});
