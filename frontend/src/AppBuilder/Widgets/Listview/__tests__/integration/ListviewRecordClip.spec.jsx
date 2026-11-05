/**
 * The viewer rule in `listview.scss` that hides the record canvas's own scrollbar when Dynamic height is on must keep
 * matching the record canvas, whatever sits between `.list-item` and `.sub-canvas` (tj-ee#5560 review).
 * Contract: frontend/ee/test/app-builder/widgets/Listview/TESTING.md (Listview-ROW-008).
 *
 * jsdom has no layout, so the scrollbar itself is a browser check; here the real compiled stylesheet is matched
 * against the real rendered records.
 */
import fs from 'fs';
import path from 'path';
import { waitFor } from '@testing-library/react';
import { createWidgetHarness, binding } from '@/AppBuilder/Widgets/__tests__/integration/widgetHarness';
import { componentDefinition } from '@/test/app-builder';

const sass = require('sass');

const ID = 'lv1';

const clipSelectors = () => {
  const { css } = sass.compileString(fs.readFileSync(path.resolve(__dirname, '../../listview.scss'), 'utf8'));
  return [...css.matchAll(/([^{}]+)\{([^{}]*)\}/g)]
    .filter(([, , body]) => /overflow-y:\s*hidden\s*!important/.test(body))
    .flatMap(([, selector]) => selector.split(',').map((part) => part.trim()));
};

const matchesRule = (element, selectors) => selectors.some((selector) => element.matches(selector));

const text = componentDefinition('txt1', 'text1', 'Text', { text: binding('{{listItem.name}}') });
text.component.parent = ID;

const widget = createWidgetHarness({
  componentType: 'Listview',
  handle: 'listview1',
  id: ID,
  defaultProperties: {
    dataSourceSelector: binding('rawJson'),
    data: binding('{{[{ name: "a" }, { name: "b" }, { name: "c" }]}}'),
    mode: binding('list'),
    columns: binding('{{1}}'),
    rowHeight: binding('100'),
    loadingState: binding('{{false}}'),
    dynamicHeight: binding('{{true}}'),
    visibility: binding('{{true}}'),
    collapseWhenHidden: binding('{{false}}'),
    disabledState: binding('{{false}}'),
    showBorder: binding('{{true}}'),
    rowsPerPage: binding('{{3}}'),
    enablePagination: binding('{{false}}'),
  },
  defaultStyles: {},
  defaultExtraComponents: { txt1: text },
  capabilities: { dnd: true },
  widgetHeight: 800,
  widgetWidth: 600,
});

// The viewer's wrappers around a widget, as the released app renders them.
const inViewer = (row) => {
  const viewer = document.createElement('div');
  viewer.className = 'viewer';
  viewer.innerHTML = '<div class="dynamic-height-target"><div class="canvas-component"></div></div>';
  viewer.querySelector('.canvas-component').appendChild(row.cloneNode(true));
  document.body.appendChild(viewer);
  return viewer;
};

describe('Listview record canvas: the viewer Dynamic height rule', () => {
  beforeEach(widget.setup);
  afterEach(() => {
    widget.teardown();
    document.querySelectorAll('.viewer').forEach((node) => node.remove());
  });

  test('[Listview-ROW-008] the rule matches the canvas of every record the ListView renders', async () => {
    // Break this catches: a box added between the record and its canvas that the selector does not know about (the scrollbar returns in preview).
    widget.render({ currentMode: 'view' });
    await waitFor(() => expect(document.querySelectorAll('.list-item')).toHaveLength(3));
    const selectors = clipSelectors();
    expect(selectors.length).toBeGreaterThan(0);

    [...document.querySelectorAll('.list-item')].forEach((row) => {
      const viewer = inViewer(row);
      const canvas = viewer.querySelector('.list-item .sub-canvas');
      expect(canvas).not.toBeNull();
      expect(matchesRule(canvas, selectors)).toBe(true);
    });
  });

  test('[Listview-ROW-008] the rule still matches a record canvas that sits directly in the record', () => {
    // Break this catches: a selector rewritten for the box only, so a record rendered without it loses the rule.
    const viewer = document.createElement('div');
    viewer.className = 'viewer';
    viewer.innerHTML =
      '<div class="dynamic-height-target"><div class="canvas-component"><div class="list-item"><div class="sub-canvas"></div></div></div></div>';
    document.body.appendChild(viewer);

    expect(matchesRule(viewer.querySelector('.sub-canvas'), clipSelectors())).toBe(true);
  });

  test('[Listview-ROW-008] the rule does not reach a record canvas outside the viewer', async () => {
    // Break this catches: the `.viewer` scope dropped, which would hide the builder canvas's scrollbar.
    widget.render({ currentMode: 'view' });
    await waitFor(() => expect(document.querySelectorAll('.list-item')).toHaveLength(3));
    const wrapper = document.createElement('div');
    wrapper.innerHTML = '<div class="dynamic-height-target"><div class="canvas-component"></div></div>';
    wrapper.querySelector('.canvas-component').appendChild(document.querySelector('.list-item').cloneNode(true));
    document.body.appendChild(wrapper);

    expect(matchesRule(wrapper.querySelector('.sub-canvas'), clipSelectors())).toBe(false);
    wrapper.remove();
  });
});
