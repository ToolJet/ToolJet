/**
 * Listview 2.0 builder: a click on a read-only record changes nothing (tj-ee#5559 AC7, Listview-BLD-007).
 * Drives Selecto's real `dragCondition`, which is what turns a canvas click into a selection; react-selecto
 * itself is replaced by a probe that hands over its props, because jsdom has no pointer gestures.
 */
import React from 'react';
import { render, waitFor } from '@testing-library/react';
import { createWidgetHarness, binding, store } from '@/AppBuilder/Widgets/__tests__/integration/widgetHarness';
import { componentDefinition } from '@/test/app-builder';
import EditorSelecto from '@/AppBuilder/AppCanvas/Selecto';

let mockSelectoProps;
jest.mock('react-selecto', () => {
  const mockReact = require('react');
  return {
    __esModule: true,
    default: (props) => {
      mockSelectoProps = props;
      return mockReact.createElement('span');
    },
  };
});

const ID = 'lv1';
const records = `{{${JSON.stringify(Array.from({ length: 3 }, (_, index) => ({ name: `r${index}` })))}}}`;
const txt = () => {
  const definition = componentDefinition('txt1', 'text1', 'Text', { text: binding('{{listItem.name}}') });
  definition.component.parent = ID;
  definition.component.definition.styles = {};
  definition.component.definition.others = { showOnDesktop: binding('{{true}}'), showOnMobile: binding('{{false}}') };
  return definition;
};
const widget = createWidgetHarness({
  componentType: 'Listview',
  handle: 'listview1',
  id: ID,
  defaultProperties: {
    dataSourceSelector: binding('rawJson'),
    data: binding(records),
    mode: binding('list'),
    columns: binding('{{1}}'),
    rowHeight: binding('100'),
    rowsPerPage: binding('{{2}}'),
    enablePagination: binding('{{true}}'),
    visibility: binding('{{true}}'),
  },
  defaultStyles: {},
  defaultExtraComponents: { txt1: txt() },
  capabilities: { dnd: true },
  widgetHeight: 600,
  widgetWidth: 600,
});

const copy = (index) => document.querySelectorAll('.ele-txt1')[index];
const click = (target) => mockSelectoProps.dragCondition({ inputEvent: { target, shiftKey: false } });

async function mount() {
  widget.render({ currentMode: 'edit' });
  await waitFor(() => expect(document.querySelectorAll('.list-item')).toHaveLength(2));
  // The harness has no WidgetWrapper, so the list's own box is marked the way WidgetWrapper marks it.
  const box = document.getElementById(ID);
  box.classList.add('moveable-box');
  box.setAttribute('widgetid', ID);
  render(<EditorSelecto />);
}

describe('Listview builder: clicking read-only records', () => {
  beforeEach(widget.setup);
  afterEach(widget.teardown);

  test('[Listview-BLD-007] a click on a component copy selects neither the copy nor the list', async () => {
    // Break this catches: the click walking up to the list's box and selecting the whole ListView.
    await mount();
    await widget.session.store.act(() => store().setSelectedComponents(['txt1']));

    click(copy(1));

    expect(store().selectedComponents).toEqual(['txt1']);
  });

  test('[Listview-BLD-007] a click on the record background of a copy changes nothing either', async () => {
    // Break this catches: only the component being guarded, so the copy's empty canvas still selects the list.
    await mount();
    await widget.session.store.act(() => store().setSelectedComponents(['txt1']));

    click(document.querySelectorAll('.list-item')[1].querySelector('.real-canvas'));

    expect(store().selectedComponents).toEqual(['txt1']);
  });

  test('[Listview-BLD-007] a click on the pager still selects the list', async () => {
    // Break this catches: the guard swallowing every click inside the list, so the pager can no longer select it.
    await mount();
    await widget.session.store.act(() => store().setSelectedComponents(['txt1']));

    click(document.querySelector('[data-cy="container-pagination"]'));

    expect(store().selectedComponents).toEqual([ID]);
  });

  test('[Listview-BLD-007] a click on the editable record 1 still selects its component', async () => {
    // Break this catches: the guard also catching the original, which would make record 1 unselectable.
    await mount();
    const original = copy(0);
    original.classList.add('moveable-box');

    click(original.firstElementChild ?? original);

    expect(store().selectedComponents).toEqual(['txt1']);
  });
});
