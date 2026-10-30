import { radiobuttonV2Config } from '@tooljet/widget-definitions';

describe('RadioButtonV2 widget config', () => {
  test('declares every runtime-exposed variable so the inspector lists them', () => {
    expect(Object.keys(radiobuttonV2Config.exposedVariables).sort()).toEqual(
      ['isDisabled', 'isLoading', 'isMandatory', 'isValid', 'isVisible', 'label', 'options', 'value'].sort()
    );
  });

  test.each(['loadingState', 'disabledState'])(
    '%s validation fallback matches the widget default (false)',
    (property) => {
      expect(radiobuttonV2Config.properties[property].validation.defaultValue).toBe(false);
      expect(radiobuttonV2Config.definition.properties[property].value).toBe('{{false}}');
    }
  );
});
