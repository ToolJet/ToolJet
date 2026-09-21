/**
 * Form schema generation — pure unit tests.
 *
 * Contract: frontend/ee/test/app-builder/widgets/Form/TESTING.md
 * These scenarios are `Layer: Pure Jest`, so they live directly in __tests__/ rather than in
 * __tests__/integration/, per the repository's unit-versus-integration layout convention.
 */
import { generateUIComponents } from '@/AppBuilder/Widgets/Form/FormUtils';

const schema = {
  title: 'Details',
  properties: {
    name: { type: 'textinput', label: 'Name' },
    age: { type: 'number', label: 'Age' },
  },
  submitButton: { value: 'Send' },
};

describe('generateUIComponents', () => {
  // Break this catches: changing how a schema maps to components — a label/field pair per property
  // with the submit button appended last. The index-matched submit button depends on that shape.
  test('[Form-SCHEMA-001] generateUIComponents turns a schema into the expected component list', () => {
    const generated = generateUIComponents(schema, true, 'form1');

    // Measured shape: a leading Text for the schema TITLE, then a Text label plus a field for each
    // property, then the submit button last. The label Texts carry a formKey and the title does
    // not, which is what extractData's label/field pairing relies on.
    expect(generated).toHaveLength(6);
    expect(generated.map((c) => c?.component)).toEqual(['Text', 'Text', 'TextInput', 'Text', 'NumberInput', 'Button']);
    expect(generated[0].formKey).toBeUndefined();
    expect(generated[1].formKey).toBe('name');
    expect(generated[3].formKey).toBe('age');
    // The submit button is the last entry, which is what the index match relies on.
    expect(generated[generated.length - 1].component).toBe('Button');
  });

  test('[Form-SCHEMA-001] a schema with no properties object yields nothing', () => {
    expect(generateUIComponents({ title: 'x' }, true, 'form1')).toBeUndefined();
    expect(generateUIComponents(undefined, true, 'form1')).toBeUndefined();
  });

  // Break this catches: throwing, or silently dropping the whole form, when a schema names a field
  // type the resolver does not know — an app with one typo'd type would lose every field.
  test('[Form-SCHEMA-004] an unrecognised schema field type is dropped, not crashed', () => {
    const mixed = {
      title: 'Mixed',
      properties: {
        good: { type: 'textinput' },
        bad: { type: 'notawidget' },
      },
      submitButton: { value: 'Send' },
    };

    expect(() => generateUIComponents(mixed, true, 'form1')).not.toThrow();
    const generated = generateUIComponents(mixed, true, 'form1');

    // Measured shape: the unknown type contributes NOTHING. It is pushed as two undefined
    // placeholders and then removed by the trailing filter (FormUtils.js:486-488), so the known
    // field and the submit button are all that survive — and the button stays last, which is what
    // the index-matched submit relies on (Form.jsx:406-409).
    expect(generated.map((c) => c?.component)).toEqual(['Text', 'Text', 'TextInput', 'Button']);
    expect(generated.every((c) => c !== undefined)).toBe(true);
    expect(generated[generated.length - 1].component).toBe('Button');
  });
});
