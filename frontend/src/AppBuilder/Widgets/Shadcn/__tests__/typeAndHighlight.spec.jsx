import React from 'react';
import { act, render } from '@testing-library/react';
import {
  shadBarChartConfig,
  shadHeadingConfig,
  shadStatConfig,
  shadTextConfig,
} from '../../../WidgetManager/shadcnSource';
import { ShadHeading, ShadStat, ShadText } from '../Shadcn';
import { ShadBarChart } from '../ShadCharts';
import { FONT_STACKS } from '../typeLook';

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

const mount = (Widget, config, properties = {}, styles = {}) =>
  render(
    <Widget
      id="c1"
      componentType={config.name}
      height={280}
      width={480}
      properties={{ ...defaultsOf(config), animate: false, ...properties }}
      styles={styles}
      setExposedVariables={() => {}}
      setExposedVariable={() => {}}
      fireEvent={() => {}}
    />
  );

describe('typeface styles', () => {
  it('leaves the heading on the theme font by default', () => {
    const { container } = mount(ShadHeading, shadHeadingConfig, { text: 'Booking desk' });
    expect(container.querySelector('h2').className).not.toMatch(/lk-font|lk-case/);
  });

  it('sets a serif, uppercase, spaced heading through classes and variables', () => {
    const { container } = mount(
      ShadHeading,
      shadHeadingConfig,
      { text: 'Booking desk', level: 'h1' },
      { fontFamily: 'serif', textTransform: 'uppercase', letterSpacing: '0.12em', fontWeight: '500' }
    );
    const h1 = container.querySelector('h1');
    expect(h1.className).toMatch(/lk-font/);
    expect(h1.className).toMatch(/lk-case/);
    expect(h1.className).toMatch(/lk-tracking/);
    expect(h1.className).toMatch(/lk-weight/);
    const root = container.querySelector('.tj-shadcn') || container.firstChild;
    const vars = root.getAttribute('style') || '';
    expect(vars).toContain(`--lk-font: ${FONT_STACKS.serif}`);
    expect(vars).toContain('--lk-case: uppercase');
  });

  it('gives text a size and a typeface', () => {
    const { container } = mount(
      ShadText,
      shadTextConfig,
      { text: 'AZURE CHARTERS', tone: 'small' },
      { fontSize: 11, fontFamily: 'mono' }
    );
    expect(container.querySelector('p').className).toMatch(/lk-size/);
    expect(container.querySelector('p').className).toMatch(/lk-font/);
  });

  it('styles the stat value and label separately', () => {
    const { container, getByText } = mount(
      ShadStat,
      shadStatConfig,
      { label: 'Season revenue', value: '€5,904,000' },
      { valueFontFamily: 'display', labelTextTransform: 'uppercase', labelLetterSpacing: '0.1em' }
    );
    expect(getByText('€5,904,000').className).toMatch(/lk-value-font/);
    expect(getByText('Season revenue').className).toMatch(/lk-label-case/);
    expect(getByText('Season revenue').className).toMatch(/lk-label-tracking/);
    expect(container.innerHTML).not.toMatch(/undefined/);
  });

  it('never throws on junk styles', () => {
    [
      { fontFamily: {} },
      { fontFamily: 42, fontWeight: 'heavy', letterSpacing: null, textTransform: [] },
      { fontSize: NaN },
    ].forEach((styles) => {
      expect(() => mount(ShadHeading, shadHeadingConfig, {}, styles)).not.toThrow();
      expect(() => mount(ShadText, shadTextConfig, {}, styles)).not.toThrow();
    });
  });
});

describe('bar chart highlight', () => {
  const data = [
    { month: 'May', revenue: 400 },
    { month: 'Jun', revenue: 900 },
    { month: 'Jul', revenue: 700 },
  ];
  const faded = (container) => container.querySelectorAll('[fill-opacity="0.32"]').length;
  // Recharts draws the bars once its entry animation has run.
  const settle = () => act(() => new Promise((resolve) => setTimeout(resolve, 1200)));

  it('draws every bar in full when nothing is highlighted', async () => {
    const { container } = mount(ShadBarChart, shadBarChartConfig, { data, xField: 'month', yFields: 'revenue' });
    await settle();
    expect(container.querySelectorAll('.recharts-rectangle')).toHaveLength(3);
    expect(faded(container)).toBe(0);
  });

  it('fades the other bars when one is highlighted', async () => {
    const { container } = mount(ShadBarChart, shadBarChartConfig, {
      data,
      xField: 'month',
      yFields: 'revenue',
      highlight: 'Jun',
    });
    await settle();
    expect(container.querySelectorAll('.recharts-rectangle')).toHaveLength(3);
    expect(faded(container)).toBe(2);
  });

  it('colours each category its own colour when categoryColors names it', async () => {
    const { container } = mount(ShadBarChart, shadBarChartConfig, {
      data: [
        { result: 'Won', deals: 3 },
        { result: 'Lost', deals: 2 },
      ],
      xField: 'result',
      yFields: 'deals',
      categoryColors: { Won: '#16a34a', Lost: '#dc2626' },
    });
    await settle();
    const fills = [...container.querySelectorAll('.recharts-rectangle')].map((r) => r.getAttribute('fill'));
    expect(fills).toEqual(['#16a34a', '#dc2626']);
  });

  it('never throws on a junk highlight', () => {
    [{}, NaN, [null], 'max', 'nothing'].forEach((highlight) =>
      expect(() =>
        mount(ShadBarChart, shadBarChartConfig, { data, xField: 'month', yFields: 'revenue', highlight })
      ).not.toThrow()
    );
  });
});
