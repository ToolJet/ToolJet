/**
 * Chat has its own inspector panel that lists its Additional Actions by hand, so a toggle added to the
 * config does not appear unless the panel renders it too. Collapse when hidden must sit right after
 * Visibility in that section.
 */
import React from 'react';
import { render, screen } from '@testing-library/react';
import { Chat } from '../Chat';
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

const componentMeta = componentTypes.find((c) => c.component === 'Chat');

describe('Chat inspector', () => {
  test('draws Collapse when hidden in Additional Actions, right after Visibility', () => {
    render(
      <Chat
        component={{ component: { ...componentMeta, name: 'chat1' } }}
        componentMeta={componentMeta}
        paramUpdated={() => {}}
        layoutPropertyChanged={() => {}}
        dataQueries={[]}
        components={{}}
        currentState={{}}
        darkMode={false}
      />
    );

    const section = screen.getByRole('region', { name: 'Additional Actions' });
    const keys = Array.from(section.querySelectorAll('[data-testid^="inspector-properties-"]')).map((node) =>
      node.getAttribute('data-testid').replace('inspector-properties-', '')
    );
    expect(keys.indexOf('collapseWhenHidden')).toBe(keys.indexOf('visibility') + 1);
  });
});
