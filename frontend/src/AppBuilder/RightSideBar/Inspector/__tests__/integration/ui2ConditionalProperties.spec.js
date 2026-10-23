// UI 2.0 properties that apply to one setting are hidden in the inspector until they apply (conditionallyRender in the
// widget configs). Before, renderElement read conditionallyRender for a fixed list of native widgets (and ShadTabs,
// whose config had none), so every UI 2.0 property showed all the time: the wizard's step labels for every Tabs style,
// the Hero's image URL for every background. Hiding is inspector-only: saved values and the widget are unchanged, and
// a property stays shown while it, or the setting it depends on, is bound to something live.
jest.mock('../../Elements/Code', () => ({ Code: () => null }));
jest.mock('../../Components/Form/_components', () => ({ LabeledDivider: () => null }));

import useStore from '@/AppBuilder/_stores/store';
import { seedApp, componentDefinition, binding } from '@/test/app-builder';
import { isLiveBinding, renderElement } from '../../Utils';
import { componentTypeDefinitionMap } from '@/AppBuilder/WidgetManager';

const shown = (type, param, properties) => {
  const meta = componentTypeDefinitionMap[type];
  const definition = componentDefinition('w1', 'w1', type, properties).component.definition;
  const component = { component: { component: type, properties: meta.properties, definition } };
  return renderElement(component, meta, () => {}, [], param, 'properties', {}, {}) !== undefined;
};

// [widget, dependent property, setting, a value where it applies, a value where it does not]
const CASES = [
  ['ShadTabs', 'showStepNav', 'variant', 'steps', 'pills'],
  ['ShadTabs', 'nextLabel', 'variant', 'steps', 'underline'],
  ['ShadTabs', 'backLabel', 'variant', 'steps', 'pills'],
  ['ShadTabs', 'finishLabel', 'variant', 'steps', 'pills'],
  ['ShadTabs', 'linearSteps', 'variant', 'steps', 'pills'],
  ['ShadHero', 'imageUrl', 'background', 'image', 'tint'],
  ['ShadSchedule', 'days', 'scale', 'days', 'hours'],
  ['ShadMap', 'heatField', 'display', 'heat', 'markers'],
  ['ShadMap', 'heatRadius', 'display', 'both', 'markers'],
  ['ShadMap', 'routeField', 'connectMarkers', '{{true}}', '{{false}}'],
  ['ShadMap', 'routeOrderField', 'connectMarkers', '{{true}}', '{{false}}'],
  ['ShadMap', 'routeStart', 'connectMarkers', '{{true}}', '{{false}}'],
  ['ShadLineChart', 'currency', 'yAxisFormat', 'currency', 'number'],
  ['ShadFunnelChart', 'currency', 'yAxisFormat', 'currency', 'compact'],
  ['ShadHeatmapChart', 'currency', 'yAxisFormat', 'currency', 'percent'],
  ['ShadProgressList', 'currency', 'valueFormat', 'currency', 'auto'],
  ['ShadCircularProgress', 'text', 'centerText', 'custom', 'value'],
  ['ShadCarousel', 'interval', 'autoplay', '{{true}}', '{{false}}'],
  ['ShadCarousel', 'pauseOnHover', 'autoplay', '{{true}}', '{{false}}'],
  ['ShadListView', 'columns', 'mode', 'grid', 'list'],
  ['ShadKeyValue', 'labelWidth', 'layout', 'inline', 'stacked'],
];

beforeEach(() => {
  seedApp({ c1: componentDefinition('c1', 'picker', 'ShadSelect') });
});

describe('UI 2.0 properties that apply to one setting', () => {
  test.each(CASES)('%s %s shows only when %s applies', (type, param, setting, on, off) => {
    expect(shown(type, param, { [setting]: binding(on) })).toBe(true);
    expect(shown(type, param, { [setting]: binding(off) })).toBe(false);
  });

  test('the Tabs wizard fields read a setting written as a literal binding too', () => {
    expect(shown('ShadTabs', 'nextLabel', { variant: binding("{{'steps'}}") })).toBe(true);
    expect(shown('ShadTabs', 'nextLabel', { variant: binding("{{'pills'}}") })).toBe(false);
  });

  test('a property bound to something live stays shown, whatever the setting', () => {
    expect(
      shown('ShadHero', 'imageUrl', { background: binding('tint'), imageUrl: binding('{{components.picker.value}}') })
    ).toBe(true);
    expect(shown('ShadTabs', 'nextLabel', { variant: binding('pills'), nextLabel: binding("{{'Continue'}}") })).toBe(
      false
    );
  });

  test('a setting bound to something live keeps its dependents shown (its value can change at run time)', () => {
    useStore.getState().setExposedValue('c1', 'value', 'pills');
    expect(shown('ShadTabs', 'nextLabel', { variant: binding('{{components.picker.value}}') })).toBe(true);
  });

  test('properties without a condition always show', () => {
    expect(shown('ShadHero', 'title', { background: binding('tint') })).toBe(true);
    expect(shown('ShadTabs', 'tabs', { variant: binding('pills') })).toBe(true);
  });

  test('isLiveBinding tells a live binding from a literal', () => {
    for (const literal of ['steps', '{{true}}', '{{7}}', "{{'steps'}}", '{{ -2.5 }}', '', undefined, 3]) {
      expect(isLiveBinding(literal)).toBe(false);
    }
    for (const live of ['{{components.a.value}}', '{{queries.q.data[0].url}}', "{{x ? 'a' : 'b'}}", 'a {{b}}']) {
      expect(isLiveBinding(live)).toBe(true);
    }
  });
});
