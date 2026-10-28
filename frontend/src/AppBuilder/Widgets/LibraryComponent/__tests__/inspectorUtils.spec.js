import {
  fieldMeta,
  additionalActionProps,
  buildEventMetaDefinition,
  DISABLED_STATE_META,
  eventDisplayName,
  isFieldVisible,
  validationFields,
  withValidationMeta,
  groupPropsBySection,
  groupStylesBySection,
  styleFieldMeta,
  withManifestDefaults,
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

describe('styleFieldMeta', () => {
  it('[LibraryComponent-STYLES-001] gives a color style the theme-aware swatch picker', () => {
    // Break this catches: rendering style colors with the plain prop color input, which can't pick theme tokens.
    expect(styleFieldMeta({ name: 'accent', type: 'string', inspector: 'color' })).toMatchObject({
      type: 'colorSwatches',
      validation: { schema: { type: 'string' } },
    });
  });

  it('[LibraryComponent-STYLES-002] maps every other style like a prop', () => {
    // Break this catches: style fields diverging from prop fields for the same declared type.
    const style = { name: 'radius', type: 'number', default: 4 };
    expect(styleFieldMeta(style)).toEqual(fieldMeta(style));
  });
});

describe('groupStylesBySection', () => {
  it('[LibraryComponent-STYLES-003] groups styles with no section under "Styles"', () => {
    // Break this catches: unsectioned styles landing under "Properties" in the Styles tab.
    const styles = [
      { name: 'a', type: 'string' },
      { name: 'b', type: 'string', section: 'Header' },
    ];
    expect(groupStylesBySection(styles).map((section) => section.title)).toEqual(['Styles', 'Header']);
  });
});

describe('withManifestDefaults', () => {
  const instance = (styles) => ({ id: 'c1', component: { definition: { properties: {}, styles } } });

  it('[LibraryComponent-DEFAULTS-001] shows the manifest default for a style the instance never stored', () => {
    // Break this catches: a style added in a newer revision rendering as an empty (and invalid) field
    // while the component itself draws its initialValue.
    const component = instance({ backgroundColor: { value: '#ff0000' } });
    const styles = [
      { name: 'backgroundColor', type: 'string', default: 'var(--cc-surface1-surface)' },
      { name: 'borderRadius', type: 'number', default: 6 },
    ];

    const shown = withManifestDefaults(component, 'styles', styles).component.definition.styles;

    expect(shown.backgroundColor.value).toBe('#ff0000');
    expect(shown.borderRadius.value).toBe('{{6}}');
    expect(component.component.definition.styles.borderRadius).toBeUndefined();
  });

  it('[LibraryComponent-DEFAULTS-002] returns the same object when every field is stored', () => {
    // Break this catches: a fresh object on every render, which re-renders every Inspector field.
    const component = instance({ borderRadius: { value: '{{4}}' } });
    expect(withManifestDefaults(component, 'styles', [{ name: 'borderRadius', type: 'number', default: 6 }])).toBe(
      component
    );
  });
});

describe('fieldMeta v2 manifest fields', () => {
  it('[LibraryComponent-FIELDMETA-008] puts min/max on the meta and spells them out in the tooltip', () => {
    // Break this catches: declared limits reaching neither the slider (meta.min/max) nor any other field's label.
    expect(fieldMeta({ name: 'value', type: 'number', inspector: 'slider', min: 0, max: 100 })).toMatchObject({
      type: 'slider',
      min: 0,
      max: 100,
      tip: 'Between 0 and 100.',
    });
    expect(fieldMeta({ name: 'rows', type: 'number', min: 1 }).tip).toBe('At least 1.');
    expect(fieldMeta({ name: 'rows', type: 'number', max: 0 })).toMatchObject({ max: 0, tip: 'At most 0.' });
  });

  it('[LibraryComponent-FIELDMETA-009] turns description into the label tooltip, before the limits', () => {
    // Break this catches: the author's description never showing, or the limits note replacing it.
    expect(fieldMeta({ name: 'label', type: 'string', description: 'Shown above the field.' }).tip).toBe(
      'Shown above the field.'
    );
    expect(fieldMeta({ name: 'step', type: 'number', description: 'Step size.', min: 1, max: 10 }).tip).toBe(
      'Step size. Between 1 and 10.'
    );
  });

  it('[LibraryComponent-FIELDMETA-010] passes placeholder through and omits absent v2 keys', () => {
    // Break this catches: undefined tip/min/max keys on every field, or the placeholder being dropped.
    expect(fieldMeta({ name: 'label', type: 'string', placeholder: 'Enter a label' }).placeholder).toBe(
      'Enter a label'
    );
    const plain = fieldMeta({ name: 'label', type: 'string' });
    expect(plain).not.toHaveProperty('tip');
    expect(plain).not.toHaveProperty('min');
    expect(plain).not.toHaveProperty('placeholder');
  });

  it('[LibraryComponent-FIELDMETA-011] renders an options array prop as the code field', () => {
    // Break this catches: type 'options' reaching DynamicFxTypeRenderer, which has no such element and crashes.
    expect(fieldMeta({ name: 'options', type: 'array', inspector: 'options' })).toMatchObject({
      type: 'code',
      validation: { schema: { type: 'array' } },
    });
  });
});

describe('isFieldVisible', () => {
  const instance = (properties, styles = {}) => ({ component: { definition: { properties, styles } } });
  const resolve = (value) => (value === '{{true}}' ? true : value === '{{false}}' ? false : value);

  it('[LibraryComponent-VISIBLEWHEN-001] always shows a field without visibleWhen', () => {
    expect(isFieldVisible({ name: 'a', type: 'string' }, instance({}), 'properties', resolve)).toBe(true);
  });

  it('[LibraryComponent-VISIBLEWHEN-002] shows the field only while the resolved driver equals the value', () => {
    // Break this catches: comparing the raw stored '{{true}}' instead of its resolved value, hiding the field forever.
    const prop = { name: 'clearLabel', type: 'string', visibleWhen: { key: 'clearable', value: true } };
    expect(isFieldVisible(prop, instance({ clearable: { value: '{{true}}' } }), 'properties', resolve)).toBe(true);
    expect(isFieldVisible(prop, instance({ clearable: { value: '{{false}}' } }), 'properties', resolve)).toBe(false);
  });

  it('[LibraryComponent-VISIBLEWHEN-003] matches an enum driver and accepts a list of values', () => {
    const prop = { name: 'href', type: 'string', visibleWhen: { key: 'variant', value: 'link' } };
    expect(isFieldVisible(prop, instance({ variant: { value: 'link' } }), 'properties', resolve)).toBe(true);
    expect(isFieldVisible(prop, instance({ variant: { value: 'default' } }), 'properties', resolve)).toBe(false);
    const anyOf = { ...prop, visibleWhen: { key: 'variant', value: ['link', 'ghost'] } };
    expect(isFieldVisible(anyOf, instance({ variant: { value: 'ghost' } }), 'properties', resolve)).toBe(true);
  });

  it('[LibraryComponent-VISIBLEWHEN-004] lets a style depend on a property', () => {
    // Break this catches: a style field looking for its driver only among styles, so it never shows.
    const style = { name: 'iconColor', type: 'string', visibleWhen: { key: 'showIcon', value: true } };
    expect(isFieldVisible(style, instance({ showIcon: { value: '{{true}}' } }), 'styles', resolve)).toBe(true);
  });
});

describe('eventDisplayName', () => {
  it('[LibraryComponent-EVENTS-001] uses the manifest display name when there is one', () => {
    expect(eventDisplayName({ name: 'onClick', displayName: 'On press' })).toBe('On press');
  });

  it.each([
    ['onClick', 'On click'],
    ['onValueChange', 'On value change'],
    ['onOpenURL', 'On open url'],
    ['submit', 'Submit'],
  ])('[LibraryComponent-EVENTS-002] turns handler name %s into "%s"', (name, expected) => {
    // Break this catches: the event picker listing raw handler names (onClick) instead of native wording.
    expect(eventDisplayName({ name })).toBe(expected);
  });

  it('[LibraryComponent-EVENTS-003] feeds the display names into the event meta definition', () => {
    expect(buildEventMetaDefinition({}, [{ name: 'onClick' }]).events).toEqual({
      onClick: { displayName: 'On click' },
    });
  });
});

describe('validationFields', () => {
  const names = (kind) => validationFields(kind).map(({ name }) => name);

  it('[LibraryComponent-VALIDATION-001] gives a text component every native text-input validation field', () => {
    // Break this catches: a text component missing regex or length limits that native TextInput offers.
    expect(names('text')).toEqual(['mandatory', 'regex', 'minLength', 'maxLength', 'customRule']);
    expect(validationFields('text')[0].meta).toMatchObject({
      type: 'toggle',
      displayName: 'Make this field mandatory',
    });
  });

  it('[LibraryComponent-VALIDATION-002] gives choice and date components only mandatory and custom rule', () => {
    // Break this catches: offering a regex or length limit on a select or date picker, where it can never apply.
    expect(names('choice')).toEqual(['mandatory', 'customRule']);
    expect(names('date')).toEqual(['mandatory', 'customRule']);
  });

  it('[LibraryComponent-VALIDATION-003] gives no section when the manifest declares no validation', () => {
    expect(validationFields(undefined)).toEqual([]);
    expect(validationFields('something-else')).toEqual([]);
  });

  it('[LibraryComponent-VALIDATION-004] adds the validation meta renderElement reads, keeping the host meta', () => {
    // Break this catches: renderElement throwing on componentMeta.validation[param] for a host config that has none.
    const meta = withValidationMeta({ properties: { visibility: {} } }, validationFields('choice'));
    expect(Object.keys(meta.validation)).toEqual(['mandatory', 'customRule']);
    expect(meta.properties).toEqual({ visibility: {} });
  });
});

describe('additionalActionProps with controlState', () => {
  const hostMeta = {
    properties: {
      visibility: { section: 'additionalActions' },
      disabledState: { section: 'additionalActions' },
      dynamicHeight: { section: 'additionalActions' },
    },
  };

  it('[LibraryComponent-CONTROLSTATE-001] hides disabledState from a component that does not declare controlState', () => {
    // Break this catches: a Disable toggle on a component that never reads it, so it silently does nothing.
    expect(additionalActionProps(hostMeta)).toEqual(['visibility', 'dynamicHeight']);
  });

  it('[LibraryComponent-CONTROLSTATE-002] shows disabledState in its declared place for a controlState component', () => {
    expect(additionalActionProps(hostMeta, true)).toEqual(['visibility', 'disabledState', 'dynamicHeight']);
  });

  it('[LibraryComponent-CONTROLSTATE-003] still lists disabledState when the host config lacks it', () => {
    // Break this catches: controlState components losing the toggle until the host widget config gains the key.
    expect(additionalActionProps({ properties: { visibility: { section: 'additionalActions' } } }, true)).toEqual([
      'visibility',
      'disabledState',
    ]);
    expect(DISABLED_STATE_META).toMatchObject({ type: 'toggle', displayName: 'Disable' });
  });
});

describe('inspector hints the panel does not know, and the icon set', () => {
  const {
    fieldMeta: meta,
    editorHint: hint,
    formatRevisionLabel: label,
  } = jest.requireActual('@/AppBuilder/RightSideBar/Inspector/Components/LibraryComponent/utils');

  it.each([
    ['a typo', { name: 'x', type: 'string', inspector: 'colour' }],
    ['a hint for another type', { name: 'n', type: 'number', inspector: 'boxShadow' }],
    ['a list hint on an object', { name: 'o', type: 'object', inspector: 'options' }],
  ])('draws the code field for %s instead of a field type that cannot render', (_label, prop) => {
    // Break this catches: an unknown hint passed through as the field type, which DynamicFxTypeRenderer cannot draw.
    expect(meta(prop).type).toBe('code');
  });

  it('keeps the native field types each value type supports', () => {
    // Break this catches: the fallback swallowing hints the packs rely on.
    expect(meta({ name: 'c', type: 'string', inspector: 'color' }).type).toBe('colorSwatches');
    expect(meta({ name: 's', type: 'string', inspector: 'boxShadow' }).type).toBe('boxShadow');
    expect(meta({ name: 'r', type: 'number', inspector: 'numberInput' }).type).toBe('numberInput');
  });

  it("gives a Tabler icon prop ToolJet's own icon field, without the show/hide eye", () => {
    // Break this catches: a Tabler component handed lucide names, or the eye writing an unused iconVisibility style.
    const prop = { name: 'icon', type: 'string', inspector: 'icon' };
    expect(hint(prop)).toBeUndefined();
    expect(meta(prop)).toMatchObject({ type: 'icon', visibility: false });
  });

  it('gives a lucide icon prop the lucide picker', () => {
    // Break this catches: a lucide component (the shadcn pack) handed Tabler names it cannot draw.
    expect(hint({ name: 'icon', type: 'string', inspector: 'icon', iconSet: 'lucide' })).toBe('icon');
  });

  it('labels a built-in version "Built in"', () => {
    // Break this catches: the Inspector showing the raw content hash as the version.
    expect(label('builtin:abc123def4567890')).toBe('Built in');
    expect(label('v3')).toBe('v3');
  });
});
