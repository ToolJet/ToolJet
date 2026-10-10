import React from 'react';
import { render, waitFor } from '@testing-library/react';
import { shadStatConfig } from '../../../WidgetManager/shadcnSource';
import { ShadStat } from '../Shadcn';

// jsdom has no ResizeObserver; the Stat's auto height observes its box in view mode.
global.ResizeObserver =
  global.ResizeObserver ||
  class {
    observe() {}
    unobserve() {}
    disconnect() {}
  };

const defaultsOf = (config) =>
  Object.fromEntries(
    Object.entries(config.definition.properties).map(([key, { value }]) => {
      const m = typeof value === 'string' && value.match(/^\{\{([\s\S]*)\}\}$/);
      // eslint-disable-next-line no-new-func
      return [key, m ? new Function(`return (${m[1]});`)() : value];
    })
  );
const mount = (properties = {}, styles = {}) =>
  render(
    <ShadStat
      id="s1"
      componentType="ShadStat"
      height={140}
      width={300}
      currentMode="view"
      properties={{ ...defaultsOf(shadStatConfig), ...properties }}
      styles={styles}
      setExposedVariables={() => {}}
      setExposedVariable={() => {}}
      fireEvent={() => {}}
    />
  );

describe('Stat', () => {
  it('stays a plain figure by default', () => {
    const { container } = mount({ label: 'Revenue', value: '$12,400' });
    expect(container.querySelector('svg path')).toBeNull();
    expect(container.textContent).toContain('$12,400');
  });

  it('draws an icon tile, a trend line and a progress bar when set', async () => {
    const { container, getByText } = mount({
      label: 'Revenue',
      value: '$12,400',
      icon: 'wallet',
      trendData: [3, 5, 4, 8, 9],
      progress: 64,
      progressLabel: '64% of target',
      change: '+12%',
      changeLabel: 'vs last month',
    });
    expect(getByText('64% of target')).toBeTruthy();
    expect(getByText('vs last month')).toBeTruthy();
    expect(container.querySelector('[style*="width: 64%"]')).toBeTruthy();
    expect(container.querySelectorAll('svg path').length).toBeGreaterThanOrEqual(2);
    // The icon loads on demand into its tile.
    await waitFor(() => expect(container.querySelectorAll('svg').length).toBeGreaterThanOrEqual(2));
  });

  it('moves the change badge beside the figure when the icon takes the corner', () => {
    const { getByText } = mount({ value: '42', change: '+3', icon: 'users', iconPosition: 'right' });
    const badge = getByText('+3');
    expect(badge.parentElement.textContent).toContain('42');
  });

  it('never throws on junk', () => {
    [
      { trendData: 'a,b' },
      { trendData: {} },
      { progress: 'lots' },
      { icon: 42, iconPosition: 'diagonal', size: 'xxl' },
      { trendData: [null, NaN], progress: Infinity },
    ].forEach((p) => expect(() => mount(p)).not.toThrow());
  });
});
