/**
 * Chart has its own inspector panel that lists its accordions by hand. Visibility, Collapse when
 * hidden, Disable, Loading and Tooltip live in Properties → Additional Actions, so the panel must
 * draw that section from the config — and Loading must no longer be drawn in the Options section.
 */
import React from 'react';
import { render, screen } from '@testing-library/react';
import { Chart } from '../Chart';
import { componentTypes } from '@/AppBuilder/WidgetManager/componentTypes';

jest.mock('@/AppBuilder/CodeEditor', () => () => null);
jest.mock('../../EventManager', () => ({ EventManager: () => null }));
jest.mock('../../Utils', () => ({
  renderElement: (_component, _meta, _paramUpdated, _dataQueries, param, paramType) => (
    <div key={`${paramType}-${param}`} data-testid={`inspector-${paramType}-${param}`} />
  ),
}));
jest.mock('@/AppBuilder/RightSideBar/Inspector/InspectorAccordion', () => ({ items }) => (
  <div>
    {items.map((item) => (
      <section key={item.title} aria-label={item.title}>
        {item.children}
      </section>
    ))}
  </div>
));

const componentMeta = componentTypes.find((c) => c.component === 'Chart');

const renderInspector = () =>
  render(
    <Chart
      component={{ component: { ...componentMeta, name: 'chart1' } }}
      componentMeta={componentMeta}
      paramUpdated={() => {}}
      layoutPropertyChanged={() => {}}
      dataQueries={[]}
      components={{}}
      currentState={{}}
      darkMode={false}
    />
  );

describe('Chart inspector', () => {
  test('draws an Additional Actions section with every state toggle and the tooltip', () => {
    renderInspector();

    const section = screen.getByRole('region', { name: 'Additional Actions' });
    for (const key of [
      'loadingState',
      'visibility',
      'collapseWhenHidden',
      'disabledState',
      'tooltipFormat',
      'tooltip',
    ]) {
      expect(section.querySelector(`[data-testid="inspector-properties-${key}"]`)).toBeInTheDocument();
    }
  });

  test('no longer draws Loading in the Options section', () => {
    renderInspector();

    const options = screen.getByRole('region', { name: 'Options' });
    expect(options.querySelector('[data-testid="inspector-properties-loadingState"]')).not.toBeInTheDocument();
  });
});
