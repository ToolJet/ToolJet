/**
 * Saving a Form field from the inspector writes its mandatory/visibility into the field component.
 * The field editor popover passes them as the property's `{ value, fxActive }` object; the column
 * mapping list passes a bare boolean. Both must land as `{ value: X }`. Nesting the object under
 * `.value` gave `{ value: { value: X } }`, which the TextInput rendered as an object and crashed.
 */
import { seedApp, componentDefinition, binding } from '@/test/app-builder';
import { updateFormFieldComponent } from '../fieldOperations';

const FIELD_ID = 'field-1';

function seedField() {
  const field = componentDefinition(FIELD_ID, 'name', 'TextInput', {
    label: binding('Name'),
    visibility: binding('{{true}}'),
  });
  field.component.definition.validation = { mandatory: { value: false } };
  field.component.parent = 'form-1';
  return seedApp({ [FIELD_ID]: field });
}

const currentField = {
  componentId: FIELD_ID,
  componentType: 'TextInput',
  label: 'Name',
  name: 'name',
  mandatory: { value: false },
  visibility: { value: '{{true}}' },
};

const save = (changes) =>
  updateFormFieldComponent({ ...currentField, ...changes }, currentField, 'form-1').updated.component.definition;

beforeEach(() => {
  seedField();
});

describe('updateFormFieldComponent', () => {
  test('hiding a field from the field editor stores visibility as { value }, not nested', () => {
    const definition = save({ visibility: { value: '{{false}}', fxActive: false } });

    expect(definition.properties.visibility).toEqual({ value: '{{false}}', fxActive: false });
  });

  test('making a field mandatory from the field editor stores mandatory as { value }, not nested', () => {
    const definition = save({ mandatory: { value: true } });

    expect(definition.validation.mandatory).toEqual({ value: true });
  });

  test('switching visibility to an fx expression in the field editor keeps fxActive', () => {
    const definition = save({ visibility: { value: '{{components.toggle.value}}', fxActive: true } });

    expect(definition.properties.visibility).toEqual({ value: '{{components.toggle.value}}', fxActive: true });
  });

  test('a bare boolean from the column mapping list is stored under .value', () => {
    const definition = save({ mandatory: true });

    expect(definition.validation.mandatory).toEqual({ value: true });
  });
});
