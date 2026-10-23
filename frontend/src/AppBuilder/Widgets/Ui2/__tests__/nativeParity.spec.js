import '@/AppBuilder/Widgets/Ui2/__tests__/consoleGuard';
/**
 * UI 2.0 against the native widgets (Ui2/nativeParity.json): each UI 2.0 widget names its native counterpart, or says
 * it has none, and every native property, event, action and exposed value is either one a UI 2.0 counterpart has
 * (under the same name, or the name the table gives), or the table says it was dropped and why, or lists it as a gap
 * awaiting a decision. A native capability added later, or one a UI 2.0 widget loses, fails here until it is decided.
 */
import { componentTypes } from '@/AppBuilder/WidgetManager';
import TABLE from '../nativeParity.json';
import { CONFIGS, TYPES } from './packWidgets';

const NATIVE = Object.fromEntries(componentTypes.map((c) => [c.component, c]));
const SECTIONS = {
  properties: (c) => Object.keys(c.properties || {}),
  events: (c) => Object.keys(c.events || {}),
  actions: (c) => (c.actions || []).map((a) => a.handle),
  exposed: (c) => Object.keys(c.exposedVariables || {}),
};
const ui2Has = (types, name) =>
  types.some((type) => {
    const c = CONFIGS[type];
    return Object.values(SECTIONS).some((names) => names(c).includes(name)) || name in (c.styles || {});
  });

const ROWS = Object.entries(TABLE.natives).flatMap(([native, entry]) =>
  Object.keys(SECTIONS).flatMap((section) =>
    SECTIONS[section](NATIVE[native] || {}).map((name) => [native, section, name, entry.ui2, entry[section]?.[name]])
  )
);

describe('[UI2-NATIVE-PARITY] every native capability has a UI 2.0 answer', () => {
  it('maps every UI 2.0 widget to a native widget, or says it has none', () => {
    const mapped = new Set([...Object.values(TABLE.natives).flatMap((e) => e.ui2), ...Object.keys(TABLE.noNative)]);
    expect(TYPES.filter((type) => !mapped.has(type))).toEqual([]);
    expect([...mapped].filter((type) => !CONFIGS[type])).toEqual([]);
    expect(Object.keys(TABLE.natives).filter((native) => !NATIVE[native])).toEqual([]);
  });

  it.each(ROWS)('%s %s %s', (native, section, name, ui2, decision) => {
    if (decision === undefined) {
      // Not in the table: a UI 2.0 counterpart must have it under the same name.
      expect(ui2Has(ui2, name)).toBe(true);
    } else if (typeof decision === 'string') {
      // Under another name, which a UI 2.0 counterpart must have.
      expect(ui2Has(ui2, decision)).toBe(true);
    } else {
      expect(Object.keys(decision)).toHaveLength(1);
      expect(['dropped', 'gap']).toContain(Object.keys(decision)[0]);
      expect(String(Object.values(decision)[0]).trim()).not.toBe('');
    }
  });

  it('names no native capability that no longer exists', () => {
    const stale = Object.entries(TABLE.natives).flatMap(([native, entry]) =>
      Object.keys(SECTIONS).flatMap((section) =>
        Object.keys(entry[section] || {})
          .filter((name) => !SECTIONS[section](NATIVE[native] || {}).includes(name))
          .map((name) => `${native}.${section}.${name}`)
      )
    );
    expect(stale).toEqual([]);
  });
});
