import React from 'react';
import { render } from '@testing-library/react';
import { shadAreaChartConfig } from '../../../WidgetManager/widgets/shadAreaChart';
import { shadBarChartConfig } from '../../../WidgetManager/widgets/shadBarChart';
import { ShadAreaChart, ShadBarChart } from '../ShadCharts';

// Counts (doses, jobs, seats) drew value ticks of 0.5, or 0.8, 1.5 and 2.3, which blind reviewers marked down in
// three rounds: an axis whose values are all whole numbers ticks in whole numbers.

jest.mock('recharts', () => {
  const actual = jest.requireActual('recharts');
  const React = jest.requireActual('react');
  return {
    ...actual,
    ResponsiveContainer: ({ children }) => (
      <div style={{ width: 480, height: 280 }}>{React.cloneElement(children, { width: 480, height: 280 })}</div>
    ),
  };
});

const defaultsOf = (config) =>
  Object.fromEntries(
    Object.entries(config.definition.properties).map(([key, { value }]) => {
      const m = typeof value === 'string' && value.match(/^\{\{([\s\S]*)\}\}$/);
      // eslint-disable-next-line no-new-func
      return [key, m ? new Function(`return (${m[1]});`)() : value];
    })
  );

const mount = (Widget, config, properties) =>
  render(
    <Widget
      id="c1"
      componentType={config.name}
      height={280}
      width={480}
      properties={{ ...defaultsOf(config), animate: false, ...properties }}
      styles={{}}
      setExposedVariables={() => {}}
      setExposedVariable={() => {}}
      fireEvent={() => {}}
    />
  );

const COUNTS = [
  { name: 'Ana', jobs: 3 },
  { name: 'Ben', jobs: 2 },
  { name: 'Cy', jobs: 2 },
  { name: 'Di', jobs: 1 },
];

// The tick labels of the value axis: numbers only (the category axis shows names).
const numericTicks = (container) =>
  [...container.querySelectorAll('.recharts-cartesian-axis-tick-value')]
    .map((t) => t.textContent.trim())
    .filter((t) => /^-?[\d.,]+$/.test(t));

describe('chart value axes over whole numbers', () => {
  it('a bar chart of counts ticks in whole numbers', () => {
    const { container } = mount(ShadBarChart, shadBarChartConfig, { data: COUNTS, xField: 'name', yFields: ['jobs'] });
    const ticks = numericTicks(container);
    expect(ticks.length).toBeGreaterThan(1);
    expect(ticks.filter((t) => t.includes('.'))).toEqual([]);
  });

  it('a horizontal bar chart of counts ticks in whole numbers', () => {
    const { container } = mount(ShadBarChart, shadBarChartConfig, {
      data: COUNTS,
      xField: 'name',
      yFields: ['jobs'],
      horizontal: true,
    });
    const ticks = numericTicks(container);
    expect(ticks.length).toBeGreaterThan(1);
    expect(ticks.filter((t) => t.includes('.'))).toEqual([]);
  });

  it('an area chart of counts ticks in whole numbers', () => {
    const { container } = mount(ShadAreaChart, shadAreaChartConfig, {
      data: COUNTS,
      xField: 'name',
      yFields: ['jobs'],
    });
    const ticks = numericTicks(container);
    expect(ticks.length).toBeGreaterThan(1);
    expect(ticks.filter((t) => t.includes('.'))).toEqual([]);
  });

  it('keeps fractional ticks for fractional data', () => {
    const data = [
      { name: 'a', rate: 0.25 },
      { name: 'b', rate: 0.5 },
    ];
    const { container } = mount(ShadBarChart, shadBarChartConfig, { data, xField: 'name', yFields: ['rate'] });
    expect(numericTicks(container).some((t) => t.includes('.'))).toBe(true);
  });
});

// Ten genres in a half-width chart cut one-word names to "Ficti..." and "Child..." (bookshop, 2026-10-14): a name that
// cannot wrap into its band is drawn at an angle, in full.
describe('category names wider than their bands', () => {
  const GENRES = [
    'Fiction',
    'Crime',
    "Children's",
    'Romance',
    'Fantasy',
    'Science',
    'Cookery',
    'Poetry',
    'History',
    'Historical Fiction',
  ].map((name, i) => ({ name, sales: 30 - i * 2 }));
  it('are angled and whole', () => {
    const { container } = mount(ShadBarChart, shadBarChartConfig, { data: GENRES, xField: 'name', yFields: ['sales'] });
    const texts = [...container.querySelectorAll('.recharts-xAxis text')];
    expect(texts.some((t) => /rotate\(-35/.test(t.getAttribute('transform') || ''))).toBe(true);
    expect(container.textContent).toContain("Children's");
    expect(container.textContent).not.toContain('…');
  });
  it('stay level when they fit', () => {
    const { container } = mount(ShadBarChart, shadBarChartConfig, { data: COUNTS, xField: 'name', yFields: ['jobs'] });
    expect(
      [...container.querySelectorAll('.recharts-xAxis text')].some((t) =>
        /rotate/.test(t.getAttribute('transform') || '')
      )
    ).toBe(false);
  });
});
