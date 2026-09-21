import {
  fieldMeta,
  additionalActionProps,
  groupPropsBySection,
} from '@/AppBuilder/RightSideBar/Inspector/Components/LibraryComponent/utils';

describe('fieldMeta', () => {
  it('[LibraryComponent-FIELDMETA-001] gives a boolean prop a boolean schema', () => {
    // Break this catches: validating a boolean prop as a string, which rejects every toggle value.
    expect(fieldMeta({ name: 'isOpen', type: 'boolean' })).toMatchObject({
      validation: { schema: { type: 'boolean' } },
    });
  });

  it('[LibraryComponent-FIELDMETA-002] gives an enumeration prop a string schema — the selected value is always a string', () => {
    // Break this catches: validating an enumeration as its option array type, which rejects every selected value.
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
    // Break this catches: collapsing every code-field type to one schema, so numbers/objects/arrays are validated as strings.
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
    // Break this catches: coercing primitive defaults (e.g. to strings), so a numeric or boolean default shows the wrong type.
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
    // Break this catches: emitting an empty-string default for a prop that declares none, overriding the shell's own initial value.
    expect(fieldMeta({ name: 'label', type: 'string' }).validation).toEqual({ schema: { type: 'string' } });
  });
});

describe('additionalActionProps', () => {
  it('[LibraryComponent-ADDITIONALACTIONS-001] picks out properties marked section: additionalActions', () => {
    // Break this catches: listing every property in Additional Actions instead of only the ones marked for it.
    const componentMeta = {
      properties: {
        libraryId: { section: 'meta' },
        visibility: { section: 'additionalActions' },
      },
    };
    expect(additionalActionProps(componentMeta)).toEqual(['visibility']);
  });

  it('[LibraryComponent-ADDITIONALACTIONS-002] returns an empty list when no property is in that section', () => {
    // Break this catches: falling back to non-additionalActions properties when none are marked.
    const componentMeta = { properties: { libraryId: { section: 'meta' } } };
    expect(additionalActionProps(componentMeta)).toEqual([]);
  });

  it('[LibraryComponent-ADDITIONALACTIONS-003] returns an empty list when componentMeta has no properties', () => {
    // Break this catches: throwing when componentMeta has no properties, crashing the Inspector panel.
    expect(additionalActionProps({})).toEqual([]);
  });

  it('[LibraryComponent-ADDITIONALACTIONS-004] picks out multiple properties in that section, in declaration order', () => {
    // Break this catches: loadingState (added alongside visibility) being dropped from
    // the "Additional Actions" panel because only the first/last match was picked out.
    const componentMeta = {
      properties: {
        libraryId: { section: 'meta' },
        visibility: { section: 'additionalActions' },
        loadingState: { section: 'additionalActions' },
      },
    };
    expect(additionalActionProps(componentMeta)).toEqual(['visibility', 'loadingState']);
  });
});

describe('groupPropsBySection', () => {
  it('[LibraryComponent-SECTION-001] groups props with no section under a single "Properties" section', () => {
    // Break this catches: manifests that never declare `section` (today's only case)
    // splintering into multiple accordion items instead of the one they get today.
    const props = [
      { name: 'label', type: 'string' },
      { name: 'count', type: 'number' },
    ];
    expect(groupPropsBySection(props)).toEqual([{ title: 'Properties', props }]);
  });

  it('[LibraryComponent-SECTION-002] groups props by their declared section, in first-seen order', () => {
    // Break this catches: sorting sections or mixing props across them, reordering the author's Inspector layout.
    const label = { name: 'label', type: 'string', section: 'Content' };
    const color = { name: 'color', type: 'string', section: 'Style' };
    const size = { name: 'size', type: 'number', section: 'Style' };
    const count = { name: 'count', type: 'number' }; // no section

    expect(groupPropsBySection([label, color, size, count])).toEqual([
      { title: 'Content', props: [label] },
      { title: 'Style', props: [color, size] },
      { title: 'Properties', props: [count] },
    ]);
  });

  it('[LibraryComponent-SECTION-003] returns [] for an empty prop list', () => {
    // Break this catches: emitting an empty "Properties" accordion for a component with no props.
    expect(groupPropsBySection([])).toEqual([]);
  });
});
