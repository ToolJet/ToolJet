/**
 * "Show bottom border" only acts on a Legacy List, so the Inspector shows it in the Styles tab, Records group,
 * for that case alone. The saved value stays under `properties.showBorder`: moving the key would need a data migration.
 */
const editors = [];
jest.mock('@/AppBuilder/CodeEditor', () => ({
  __esModule: true,
  default: (props) => {
    editors.push(props);
    return <div data-cy={`stub-editor-${props.paramName}`}>{props.paramLabel}</div>;
  },
}));
jest.mock('@/AppBuilder/RightSideBar/Inspector/EventManager', () => ({ EventManager: () => null }));
// The Styles tab hands back spread elements and empty objects for hidden fields; the real accordion skips the empties.
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
jest.mock('@/AppBuilder/RightSideBar/Inspector/InspectorAccordion', () => ({
  __esModule: true,
  default: ({ items }) => (
    <div>
      {items.map((item) => (
        <section key={item.title} data-section={item.title}>
          {item.children}
        </section>
      ))}
    </div>
  ),
}));

import React from 'react';
import { render } from '@testing-library/react';
import { listviewConfig } from '@tooljet/widget-definitions';
import useStore from '@/AppBuilder/_stores/store';
import { seedApp } from '@/test/app-builder';
import { DefaultComponent } from '@/AppBuilder/RightSideBar/Inspector/Components/DefaultComponent';
import { Inspector } from '@/AppBuilder/RightSideBar/Inspector/Inspector';

const LV_ID = 'lv1';

function inspectorFor({ mode = 'list', listStyle = 'legacy', showBorder } = {}) {
  seedApp({});
  editors.length = 0;
  const definition = {
    ...listviewConfig.definition,
    properties: {
      ...listviewConfig.definition.properties,
      mode: { value: mode },
      ...(showBorder === undefined ? {} : { showBorder: { value: showBorder } }),
    },
    styles: { ...listviewConfig.definition.styles, listStyle: { value: listStyle } },
  };
  const component = {
    id: LV_ID,
    component: { name: 'listview1', component: 'Listview', definition, properties: listviewConfig.properties },
  };
  const meta = { ...listviewConfig, general: { tooltip: { displayName: 'Tooltip' } } };
  const paramUpdated = jest.fn();
  const common = {
    component,
    paramUpdated,
    dataQueries: [],
    currentState: {},
    allComponents: {},
  };
  const properties = render(
    <DefaultComponent
      componentMeta={meta}
      darkMode={false}
      layoutPropertyChanged={jest.fn()}
      eventsChanged={jest.fn()}
      apps={[]}
      components={{}}
      pages={[]}
      selectedComponentId={LV_ID}
      {...common}
    />
  );
  const propertiesFields = [...properties.container.querySelectorAll('[data-cy^="stub-editor-"]')].map((node) =>
    node.getAttribute('data-cy').replace('stub-editor-', '')
  );
  properties.unmount();
  editors.length = 0;
  const styles = render(<Inspector.RenderStyleOptions componentMeta={meta} hasCustomStyling={false} {...common} />);
  const recordsFields = [
    ...(styles.container.querySelector('[data-section="Records"]')?.querySelectorAll('[data-cy^="stub-editor-"]') ??
      []),
  ].map((node) => [node.getAttribute('data-cy').replace('stub-editor-', ''), node.textContent]);
  return { paramUpdated, propertiesFields, recordsFields };
}

const editor = (name) => editors.filter((props) => props.paramName === name).pop();

describe('Show bottom border placement', () => {
  test('[Listview-INSP-006] Legacy list shows it in Styles > Records and edits properties.showBorder', () => {
    // Break this catches: the field missing from Styles, or writing a styles key.
    const { paramUpdated, recordsFields } = inspectorFor({ mode: 'list', listStyle: 'legacy', showBorder: '{{true}}' });

    expect(recordsFields).toContainEqual(['showBorder', 'Show bottom border']);
    editor('showBorder').onChange('{{false}}');
    expect(paramUpdated).toHaveBeenCalledWith(
      expect.objectContaining({ name: 'showBorder' }),
      'value',
      '{{false}}',
      'properties'
    );
  });

  test('[Listview-INSP-006] it shows the saved value', () => {
    // Break this catches: the field reading a styles default instead of the saved property.
    inspectorFor({ showBorder: '{{false}}' });

    expect(editor('showBorder').initialValue).toBe('{{false}}');
  });

  test('[Listview-INSP-006] a bordered list does not show it', () => {
    // Break this catches: showing a field that does nothing outside Legacy.
    expect(inspectorFor({ listStyle: 'bordered' }).recordsFields.map(([name]) => name)).not.toContain('showBorder');
  });

  test('[Listview-INSP-006] a Legacy grid does not show it', () => {
    // Break this catches: showing a field that does nothing in a grid.
    expect(inspectorFor({ mode: 'grid', listStyle: 'legacy' }).recordsFields.map(([name]) => name)).not.toContain(
      'showBorder'
    );
  });

  test('[Listview-INSP-006] a Legacy list saved with "List" still shows it', () => {
    // Break this catches: a case-sensitive layout check hiding the field from a list the widget treats as List.
    expect(inspectorFor({ mode: 'List' }).recordsFields.map(([name]) => name)).toContain('showBorder');
  });

  test('[Listview-INSP-006] it is not in the Properties tab', () => {
    // Break this catches: the field shown twice.
    expect(inspectorFor({ mode: 'list', listStyle: 'legacy' }).propertiesFields).not.toContain('showBorder');
  });

  test('[Listview-INSP-006] a Legacy layout bound by an expression that resolves to list still shows it', () => {
    // Break this catches: judging the layout from the raw expression text.
    expect(useStore.getState().getResolvedValue("{{'list'}}")).toBe('list');
    expect(inspectorFor({ mode: "{{'list'}}" }).recordsFields.map(([name]) => name)).toContain('showBorder');
  });
});
