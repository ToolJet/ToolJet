// Same Code stub as pdfAdditionalActions.spec.jsx: the CodeMirror tree cannot run in jsdom.
jest.mock('@/AppBuilder/RightSideBar/Inspector/Elements/Code', () => {
  const React = require('react');
  return { Code: () => React.createElement('div') };
});

import React from 'react';
import { render } from '@testing-library/react';
import { seedApp, componentDefinition } from '@/test/app-builder';
import { Select } from '@/AppBuilder/RightSideBar/Inspector/Components/Select';
import { componentTypeDefinitionMap } from '@/AppBuilder/WidgetManager/componentTypes';

const meta = componentTypeDefinitionMap.RadioButtonV2;
const option = (label, value, flag) => ({
  label,
  value,
  default: { value: flag },
  visible: { value: flag === false ? false : '{{true}}' },
  disable: { value: '{{false}}' },
});

const renderInspector = (options, paramUpdated) =>
  render(
    <Select
      componentMeta={meta}
      component={{
        id: 'radio1',
        component: {
          component: 'RadioButtonV2',
          properties: meta.properties,
          definition: { properties: { advanced: { value: '{{false}}' }, options: { value: options } } },
        },
      }}
      paramUpdated={paramUpdated}
      dataQueries={[]}
      eventsChanged={() => {}}
      allComponents={{}}
      currentState={{}}
      pages={[]}
    />
  );

describe('[RadioButtonV2-INSP-001] opening the options inspector', () => {
  beforeEach(() => seedApp({ radio1: componentDefinition('radio1', 'radiobutton1', 'RadioButtonV2') }));

  // Break this catches: rewriting the options on every inspector mount, which after an undo records a new edit and
  // clears the redo history, so redo does nothing.
  test('[RadioButtonV2-INSP-001] does not write options that are already normalised', () => {
    const paramUpdated = jest.fn();
    renderInspector([option('A', '1', '{{true}}'), option('B', '2', '{{false}}')], paramUpdated);

    expect(paramUpdated).not.toHaveBeenCalled();
  });

  test('[RadioButtonV2-INSP-001] still normalises boolean flags once, without changing the saved objects in place', () => {
    const paramUpdated = jest.fn();
    const saved = [option('A', '1', true), option('B', '2', false)];
    renderInspector(saved, paramUpdated);

    expect(paramUpdated).toHaveBeenCalledTimes(1);
    expect(paramUpdated.mock.calls[0][2][0].default.value).toBe('{{true}}');
    expect(saved[0].default.value).toBe(true);
  });
});
