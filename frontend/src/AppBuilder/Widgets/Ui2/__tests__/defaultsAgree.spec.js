// A choice property's default (what the inspector resets to and shows as the default) and the value a new widget is
// created with must agree. They disagreed on the Line and Combo charts (yAxisFormat "number" in the inspector, created
// as "currency"), so a line chart of job counts read "$0 $1 $2" on its axis; and on the Line chart's legend and the
// Record list's trailing value format.
import { shadcnConfigs } from '../../../WidgetManager/widgets/shadcn';

const choiceCases = shadcnConfigs.flatMap((config) =>
  Object.entries(config.properties || {})
    .filter(([key, def]) => key !== 'tooltipFormat' && (def.options || ['select', 'switch', 'toggle'].includes(def.type)))
    .map(([key, def]) => [config.name, key, def])
    .filter(([, key, def]) => (def.validation?.defaultValue ?? def.defaultValue) !== undefined)
    .filter(([name, key]) => shadcnConfigs.find((c) => c.name === name).definition?.properties?.[key]?.value !== undefined)
);
const unwrap = (v) => String(v).replace(/^\{\{(.*)\}\}$/, '$1');

describe('pack choice defaults agree with what a new widget is created with', () => {
  it.each(choiceCases)('%s.%s', (name, key, def) => {
    const created = shadcnConfigs.find((c) => c.name === name).definition.properties[key].value;
    expect(unwrap(created)).toBe(unwrap(def.validation?.defaultValue ?? def.defaultValue));
  });
});
