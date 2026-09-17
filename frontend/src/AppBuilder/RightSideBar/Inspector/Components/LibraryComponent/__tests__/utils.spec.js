import { fieldMeta, additionalActionProps } from '../utils';

describe('fieldMeta', () => {
  it('[LibraryComponent-FIELDMETA-001] gives a boolean prop a boolean schema', () => {
    expect(fieldMeta({ name: 'isOpen', type: 'boolean' })).toMatchObject({
      validation: { schema: { type: 'boolean' } },
    });
  });

  it('[LibraryComponent-FIELDMETA-002] gives an enumeration prop a string schema — the selected value is always a string', () => {
    expect(fieldMeta({ name: 'variant', type: 'enumeration', enumValues: ['a', 'b'] })).toMatchObject({
      validation: { schema: { type: 'string' } },
    });
  });

  it.each([
    ['string', 'string'],
    ['number', 'number'],
    ['object', 'object'],
    ['array', 'array'],
  ])(
    '[LibraryComponent-FIELDMETA-003] maps manifest type "%s" straight to schema type "%s"',
    (propType, schemaType) => {
      expect(fieldMeta({ name: 'x', type: propType })).toMatchObject({ validation: { schema: { type: schemaType } } });
    }
  );

  it('[LibraryComponent-FIELDMETA-004] omits validation for a manifest type it does not recognize', () => {
    // Break this catches: attaching a schema validate() doesn't understand, which would
    // reject every value instead of leaving the prop unvalidated.
    expect(fieldMeta({ name: 'weird', type: 'whatever-a-custom-component-author-wrote' }).validation).toBeUndefined();
  });

  it('[LibraryComponent-FIELDMETA-005] passes a primitive default through as-is', () => {
    expect(fieldMeta({ name: 'label', type: 'string', default: 'Hello' }).validation).toMatchObject({
      defaultValue: 'Hello',
    });
    expect(fieldMeta({ name: 'count', type: 'number', default: 5 }).validation).toMatchObject({ defaultValue: 5 });
    expect(fieldMeta({ name: 'isOpen', type: 'boolean', default: true }).validation).toMatchObject({
      defaultValue: true,
    });
  });

  it('[LibraryComponent-FIELDMETA-006] stringifies an object/array default — PreviewBox renders it as code text', () => {
    // Break this catches: passing the raw object/array through, which renders as
    // "[object Object]" instead of readable JSON.
    expect(fieldMeta({ name: 'config', type: 'object', default: { a: 1 } }).validation).toMatchObject({
      defaultValue: '{"a":1}',
    });
    expect(fieldMeta({ name: 'items', type: 'array', default: [1, 2] }).validation).toMatchObject({
      defaultValue: '[1,2]',
    });
  });

  it('[LibraryComponent-FIELDMETA-007] omits defaultValue when the manifest declares none', () => {
    expect(fieldMeta({ name: 'label', type: 'string' }).validation).toEqual({ schema: { type: 'string' } });
  });
});

describe('additionalActionProps', () => {
  it('[LibraryComponent-ADDITIONALACTIONS-001] picks out properties marked section: additionalActions', () => {
    const componentMeta = {
      properties: {
        libraryId: { section: 'meta' },
        visibility: { section: 'additionalActions' },
      },
    };
    expect(additionalActionProps(componentMeta)).toEqual(['visibility']);
  });

  it('[LibraryComponent-ADDITIONALACTIONS-002] returns an empty list when no property is in that section', () => {
    const componentMeta = { properties: { libraryId: { section: 'meta' } } };
    expect(additionalActionProps(componentMeta)).toEqual([]);
  });

  it('[LibraryComponent-ADDITIONALACTIONS-003] returns an empty list when componentMeta has no properties', () => {
    expect(additionalActionProps({})).toEqual([]);
  });
});
