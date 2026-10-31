import {
  allowedOptionValues,
  isKnownComponentType,
  settingLabel,
  valueSchemaOf,
  widgetEvents,
} from '@modules/app-validation/catalog';
import { templateAppVersions } from '../helpers/templates';

describe('app-validation catalog (server widget definitions)', () => {
  it('knows every component type used in ToolJet templates', () => {
    const unknown = new Set<string>();
    for (const version of templateAppVersions()) {
      for (const component of version.components) {
        if (!isKnownComponentType(component.type)) unknown.add(component.type);
      }
    }
    expect([...unknown]).toEqual([]);
    expect(templateAppVersions().length).toBeGreaterThan(50);
  });

  it('includes the module and custom component types', () => {
    for (const type of ['ModuleContainer', 'ModuleViewer', 'LibraryComponent', 'CustomComponent']) {
      expect(isKnownComponentType(type)).toBe(true);
    }
    expect(isKnownComponentType('Buttonn')).toBe(false);
  });

  it('exposes value types, allowed options, events and labels', () => {
    expect(valueSchemaOf('Table', 'properties', 'rowsPerPage')).toEqual({ type: 'number' });
    expect(allowedOptionValues('Button', 'styles', 'type')).toEqual(['primary', 'outline']);
    expect(settingLabel('Button', 'styles', 'type')).toBe('Type');
    expect(widgetEvents('Button')).toEqual(expect.arrayContaining(['onClick', 'onHover']));
  });

  it('has no allowed-options list for free-input settings', () => {
    expect(allowedOptionValues('Button', 'properties', 'text')).toBeUndefined();
    expect(allowedOptionValues('NoSuchWidget', 'properties', 'text')).toBeUndefined();
  });
});
