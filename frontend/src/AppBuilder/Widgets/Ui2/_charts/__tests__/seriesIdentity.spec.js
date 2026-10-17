import '@/AppBuilder/Widgets/Ui2/__tests__/consoleGuard';
import { seriesSlots } from '@/AppBuilder/Widgets/Ui2/_charts/chartsModel';
import { seriesSetup } from '@/AppBuilder/Widgets/Ui2/_charts/cartesianParts';

// A series keeps its own label and colour when another configured field is missing from the data: with yFields
// revenue, cost and tax and rows without revenue, cost was drawn as "Revenue" in Revenue's colour (release audit 41).
const FIELDS = ['revenue', 'cost', 'tax'];
const LIST = ['Revenue', 'Cost', 'Tax'];

describe('chart series identity', () => {
  it('places each drawn series by its configured field, and a fallback series by its place among those drawn', () => {
    expect(seriesSlots(FIELDS, ['cost', 'tax'])).toEqual([1, 2]);
    expect(seriesSlots([], ['amount', 'units'])).toEqual([0, 1]);
  });

  it('keeps the configured label and colour per series in the shared cartesian setup', () => {
    const setup = (rows, seriesLabels) =>
      seriesSetup(rows, {
        xField: 'day',
        yFields: FIELDS,
        seriesLabels,
        colors: ['#0000ff', '#ff0000', '#00ff00'],
        affixes: {},
        stacked: false,
      });
    const rows = (s) => s.series.map((key, i) => [key, s.names[i], s.fills[i]]);
    expect(rows(setup([{ day: 'Mon', cost: 85, tax: 10 }], LIST))).toEqual([
      ['cost', 'Cost', '#ff0000'],
      ['tax', 'Tax', '#00ff00'],
    ]);
    expect(rows(setup([{ day: 'Mon', revenue: 250, tax: 10 }], { revenue: 'Revenue', tax: 'Tax' }))).toEqual([
      ['revenue', 'Revenue', '#0000ff'],
      ['tax', 'Tax', '#00ff00'],
    ]);
  });
});
