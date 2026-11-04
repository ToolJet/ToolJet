/**
 * The Styles tab of a List View with the real fx editor: numeric fields reuse the Number input that Container,
 * Table and Key value pair use, and the Container group labels its background "Background".
 */
jest.mock('@/AppBuilder/RightSideBar/Inspector/EventManager', () => ({ EventManager: () => null }));
jest.mock('@/_ui/Accordion', () => ({
  __esModule: true,
  default: ({ items }) => (
    <div>
      {items.map((item) => (
        <section key={item.title} data-section={item.title}>
          {[].concat(item.children).filter((child) => child && child.$$typeof)}
        </section>
      ))}
    </div>
  ),
}));

import React from 'react';
import { render, fireEvent } from '@testing-library/react';
import { listviewConfig } from '@tooljet/widget-definitions';
import useStore from '@/AppBuilder/_stores/store';
import { seedApp } from '@/test/app-builder';
import { Inspector } from '@/AppBuilder/RightSideBar/Inspector/Inspector';

const LV_ID = 'lv1';

function renderStyles(styles = {}) {
  seedApp({});
  const definition = {
    ...listviewConfig.definition,
    styles: { ...listviewConfig.definition.styles, listStyle: { value: 'container' }, ...styles },
  };
  const component = {
    id: LV_ID,
    component: { name: 'listview1', component: 'Listview', definition, properties: listviewConfig.properties },
  };
  const paramUpdated = jest.fn();
  const view = render(
    <Inspector.RenderStyleOptions
      componentMeta={{ ...listviewConfig, general: { tooltip: { displayName: 'Tooltip' } } }}
      hasCustomStyling={false}
      component={component}
      paramUpdated={paramUpdated}
      dataQueries={[]}
      currentState={{}}
      allComponents={{}}
    />
  );
  return { ...view, paramUpdated };
}

const numberInputs = (name) => [...document.querySelectorAll(`[data-param="${name}"] input[type="number"]`)];
const group = (title) => document.querySelector(`[data-section="${title}"]`);

describe('List View Styles panel', () => {
  test('[Listview-INSP-010] Gap and both Border radius fields are Number inputs, the radius ones with the corners icon', () => {
    // Break this catches: the old native number input, or a radius field without the icon Container and Table show.
    renderStyles();

    expect(numberInputs('gap')).toHaveLength(1);
    expect(numberInputs('recordBorderRadius')).toHaveLength(1);
    expect(numberInputs('borderRadius')).toHaveLength(1);
    expect(group('Records').querySelector('[data-param="recordBorderRadius"] [data-cy$="prefix-icon"]')).toBeTruthy();
    expect(group('Container').querySelector('[data-param="borderRadius"] [data-cy$="prefix-icon"]')).toBeTruthy();
    expect(group('Records').querySelector('[data-param="gap"] .tj-number-input-element')).toBeTruthy();
  });

  test('[Listview-INSP-010] the Container group labels its background "Background"', () => {
    // Break this catches: "Background color", which wraps to two lines in the panel.
    renderStyles();

    const labels = [...group('Container').querySelectorAll('[data-cy$="-widget-parameter-label"]')].map((node) =>
      node.textContent.trim()
    );
    expect(labels).toContain('Background');
    expect(labels).not.toContain('Background color');
  });

  test('[Listview-INSP-010] saved {{12}}, {{6}} and plain numbers still display in the Number inputs', () => {
    // Break this catches: a numeric control that shows the expression text or goes blank for a saved binding.
    renderStyles({ gap: { value: '{{12}}' }, recordBorderRadius: { value: '{{6}}' }, borderRadius: { value: 4 } });

    expect(useStore.getState().getResolvedValue('{{12}}')).toBe(12);
    expect(numberInputs('gap')[0].value).toBe('12');
    expect(numberInputs('recordBorderRadius')[0].value).toBe('6');
    expect(numberInputs('borderRadius')[0].value).toBe('4');
  });

  test('[Listview-INSP-010] a Number input edit is saved as the typed number', () => {
    // Break this catches: an edit saved in a shape the widget cannot read back.
    const { paramUpdated } = renderStyles({ gap: { value: '{{12}}' } });

    fireEvent.change(numberInputs('gap')[0], { target: { value: '20' } });

    expect(paramUpdated).toHaveBeenCalledWith(expect.objectContaining({ name: 'gap' }), 'value', '20', 'styles');
  });
});
