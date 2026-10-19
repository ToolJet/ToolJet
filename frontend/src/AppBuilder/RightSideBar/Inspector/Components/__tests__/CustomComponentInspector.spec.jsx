/**
 * CustomComponent has its own inspector panel that lists its accordions by hand. Its Visibility and
 * Collapse when hidden toggles live in Properties → Additional Actions, so the panel must draw that
 * section from the config.
 */
import React from 'react';
import { render, screen } from '@testing-library/react';
import { CustomComponent } from '../CustomComponent';
import { componentTypes } from '@/AppBuilder/WidgetManager/componentTypes';

jest.mock('@/AppBuilder/CodeEditor', () => () => null);
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

const componentMeta = componentTypes.find((c) => c.component === 'CustomComponent');

const renderInspector = () =>
  render(
    <CustomComponent
      component={{ component: { ...componentMeta, name: 'customcomponent1' } }}
      componentMeta={componentMeta}
      paramUpdated={() => {}}
      layoutPropertyChanged={() => {}}
      dataQueries={[]}
      components={{}}
      currentState={{}}
      darkMode={false}
    />
  );

describe('CustomComponent inspector', () => {
  test('draws an Additional Actions section with Visibility, Collapse when hidden and Tooltip', () => {
    renderInspector();

    const section = screen.getByRole('region', { name: 'Additional Actions' });
    expect(section.querySelector('[data-testid="inspector-properties-visibility"]')).toBeInTheDocument();
    expect(section.querySelector('[data-testid="inspector-properties-collapseWhenHidden"]')).toBeInTheDocument();
    expect(section.querySelector('[data-testid="inspector-properties-tooltipFormat"]')).toBeInTheDocument();
    expect(section.querySelector('[data-testid="inspector-properties-tooltip"]')).toBeInTheDocument();
  });
});
