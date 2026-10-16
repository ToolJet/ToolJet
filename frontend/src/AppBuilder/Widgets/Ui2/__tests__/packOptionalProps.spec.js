import { validateProperties } from '@/AppBuilder/_utils/component-properties-validation';
import { shadcnConfigs } from '../../../WidgetManager/widgets/shadcn';

// A KPI card bound to a query reads undefined until the query answers; every pack property failed validation then, and
// a fresh analytics app opened with 66 "Expected a value of type string, but received undefined" in the debugger
// (2026-10-13). Pack widgets render a missing value (fuzzed), so a missing value is not an error.
describe('pack widget properties accept a missing value', () => {
  const stat = shadcnConfigs.find((c) => c.name === 'ShadStat');

  it('logs nothing for undefined bindings on a stat card', () => {
    const [, errors] = validateProperties(
      { value: undefined, change: undefined, trend: undefined, changeLabel: undefined },
      stat.properties,
      'ShadStat'
    );
    expect(errors).toEqual([]);
  });

  it('still reports a value of the wrong type', () => {
    const [, errors] = validateProperties({ change: { not: 'text' } }, stat.properties, 'ShadStat');
    expect(errors.length).toBeGreaterThan(0);
  });

  it('marks every pack property and style schema optional', () => {
    const required = shadcnConfigs.flatMap((c) =>
      ['properties', 'styles'].flatMap((section) =>
        Object.entries(c[section] ?? {})
          .filter(([, def]) => def?.validation?.schema && !def.validation.schema.optional)
          .map(([key]) => `${c.name}.${section}.${key}`)
      )
    );
    expect(required).toEqual([]);
  });

  // The card a UI 2.0 page draws is a FlexContainer; its title and description read from queries too, and a card
  // beside a chart logged "Card extra ... received undefined" on every page load (2026-10-15). The label named the
  // packs it serves ("Ant", "UI 2.0"), which users never see.
  it('accepts a missing card title and description on a FlexContainer, under a plain label', () => {
    const { flexContainerConfig } = require('../../../WidgetManager/widgets/flexContainer');
    const [, errors] = validateProperties(
      { cardTitle: undefined, cardExtra: undefined },
      flexContainerConfig.properties,
      'FlexContainer'
    );
    expect(errors).toEqual([]);
    expect(flexContainerConfig.properties.cardExtra.displayName).toBe('Card description');
    const labels = flexContainerConfig.properties.cardStyle.options.map((o) => o.displayName).join(' ');
    expect(labels).not.toMatch(/UI 2\.0|shadcn|Shad\b/);
  });
});
