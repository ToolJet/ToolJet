import { installBrowserStubs } from './fuzz/packTestEnv';
import { mountPack } from './packMount';

installBrowserStubs();

// QA AD-43: the Ant Design Summary Strip and Progress List read percents as whole points, so fractions showed 100 times
// too small (0.5 as 0.5%, a 0.75 Percent field as a 1% bar), unlike Ant's Descriptions and Statistic, which read
// fractions. Decided: percents are fractions in the Ant pack; Rocket 2.0 keeps whole points, as UI 2.0 takes them. In
// both strips a small change (-0.004) was rounded to a grey 0 with no arrow.
jest.mock('@/AppBuilder/Widgets/LibraryComponent/inlineRuntime', () => ({
  ...jest.requireActual('@/AppBuilder/Widgets/LibraryComponent/inlineRuntime'),
  loadLibraryModule: jest.fn(),
  loadLibraryCss: jest.fn(() => Promise.resolve(null)),
}));

const lib = (pack, file) => require(`../../../../../../packs/${pack}/src/lib/${file}`);

const ITEMS = [
  { label: 'Half', value: 0.5, format: 'percent' },
  { label: 'Refund', value: 0.021, format: 'percent', delta: -0.004, deltaFormat: 'number', lowerIsBetter: true },
  { label: 'Big', value: 45, format: 'percent' },
  { label: 'Rev', value: 100, delta: 0.12 },
  { label: 'Cost', value: 100, delta: -0.05 },
];

describe('Ant Design Summary Strip', () => {
  const { summaryFigures } = lib('antd', 'ui2/display/summary.ts');

  test('[PackComponent-PERCENT-001] a percent figure is a fraction: 0.5 is 50%, 0.021 is 2.1%, 45 is 4,500%', () => {
    expect(
      summaryFigures(ITEMS)
        .slice(0, 3)
        .map((f) => f.value)
    ).toEqual(['50%', '2.1%', '4,500%']);
  });

  test('[PackComponent-PERCENT-002] a percent change is a fraction: 0.12 is +12.0% up, -0.05 is −5.0% down', () => {
    const [, , , rev, cost] = summaryFigures(ITEMS);

    expect(rev.delta).toMatchObject({ text: '+12.0%', direction: 1, tone: 'positive' });
    expect(cost.delta).toMatchObject({ text: '−5.0%', direction: -1, tone: 'negative' });
  });

  test('[PackComponent-PERCENT-003] a small number change keeps its digit and direction: −0.004, good when lower is better', () => {
    const [, refund] = summaryFigures(ITEMS);

    expect(refund.delta).toMatchObject({ text: '−0.004', direction: -1, tone: 'positive' });
  });

  test('[PackComponent-PERCENT-004] the default strip shows Refund rate 2.1% and its change −0.004 with a down arrow, in green', async () => {
    const v = await mountPack('antd', 'SummaryStrip', {});
    const refund = [...v.root().querySelectorAll('.tj-ant-strip-item')].find((item) =>
      item.textContent.includes('Refund rate')
    );
    const change = refund.querySelector('.tj-ant-stat-change');

    expect(refund.querySelector('.ant-statistic-content').textContent).toBe('2.1%');
    expect(change.textContent).toBe('−0.004');
    expect(change.querySelector('[aria-label="arrow-down"]')).not.toBeNull();
    expect(change.classList.contains('is-up')).toBe(true);
  });
});

describe('Ant Design Progress List', () => {
  const { progressEntries, progressItem } = lib('antd', 'ui2/charts/progressModel.ts');
  const rows = (data, fields) =>
    progressEntries(data, 'id').map((entry) =>
      progressItem(entry, { labelField: 'label', valueField: 'value', ...fields })
    );

  test('[PackComponent-PERCENT-005] the Percent field is a fraction: 0.75 is a 75% bar; text with % stays as written', () => {
    const [revenue, leads] = rows(
      [
        { id: 1, label: 'Revenue', pct: 0.75 },
        { id: 2, label: 'Leads', pct: '42%' },
      ],
      { percentField: 'pct' }
    );

    expect(revenue.pct).toBe(75);
    expect(leads.pct).toBe(42);
  });

  test('[PackComponent-PERCENT-006] under Value format percent a value is a fraction: 0.42 shows 42% and a 42% bar', () => {
    const [row] = rows([{ id: 1, label: 'Conversion', value: 0.42 }], { valueFormat: 'percent' });

    expect(row.value).toBe('42%');
    expect(row.pct).toBeCloseTo(42);
  });

  // Characterization: a value under another format is the percentage itself, as the default rows (72) are.
  test('[PackComponent-PERCENT-007] a value under another format still reads as the percentage: 72 is a 72% bar', () => {
    const [row] = rows([{ id: 1, label: 'Design', value: 72 }], { valueFormat: 'auto' });

    expect(row.value).toBe('72');
    expect(row.pct).toBe(72);
  });
});

describe('Rocket 2.0 Summary Strip', () => {
  const { summaryFigures } = lib('shadcn', 'ui2/display/summary.ts');

  // Characterization of the decision: Rocket 2.0 keeps whole points.
  test('[PackComponent-PERCENT-008] a percent figure stays in whole points: 2.1 is 2.1%', () => {
    expect(summaryFigures([{ label: 'Refund rate', value: 2.1, format: 'percent' }])[0].value).toBe('2.1%');
  });

  test('[PackComponent-PERCENT-009] a small number change keeps its digit and direction: −0.004, good when lower is better', () => {
    const [refund] = summaryFigures([ITEMS[1]]);

    expect(refund.delta).toMatchObject({ text: '−0.004', direction: -1, tone: 'positive' });
  });
});
