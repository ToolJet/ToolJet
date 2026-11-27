/**
 * Collapse when hidden, in the viewer: a widget that gives up its room when hidden asks the dynamic height scheduler
 * for a pass as soon as its visibility changes, so the widgets under it move up in the next frame.
 *
 * Real store, scheduler and engine. Each spec runs the scheduler's pending pass itself (`flush`), so what it checks is
 * what RenderWidget asked for, not what a later frame happened to do.
 */
import React from 'react';
import { act } from '@testing-library/react';
import RenderWidget from '@/AppBuilder/AppCanvas/RenderWidget';
import useStore from '@/AppBuilder/_stores/store';
import { AppBuilderTestSession, defineAppBuilderScenario, seedApp, binding } from '@/test/app-builder';
import { uuid, widget } from '@/AppBuilder/_stores/dynamicHeight/__tests__/integration/dynamicHeightPage';

const scenario = defineAppBuilderScenario({
  id: 'render-widget-collapse',
  name: 'Collapse when hidden asks for a dynamic height pass',
  primarySeam: 'rtl',
  surface: 'released-viewer',
  edition: 'ce',
  environment: 'development',
  layout: 'desktop',
  version: 'released',
  transferPath: 'not-applicable',
  access: 'authenticated',
  capabilities: { observers: true, media: { matches: false } },
});

const s = () => useStore.getState();
const temps = () => s().temporaryLayouts;
const flush = () => s().getDynamicHeightScheduler().flush();
const COLLAPSES = { collapseWhenHidden: binding('{{true}}') };

describe('RenderWidget: collapse when hidden', () => {
  let session;
  const renderIn = (id, props = {}) => {
    s().setEditorLoading(false, 'canvas');
    s().setCurrentMode(props.currentMode ?? 'view', 'canvas');
    return session.render(
      <RenderWidget
        id={id}
        componentType="Text"
        moduleId="canvas"
        currentMode="view"
        currentLayout="desktop"
        widgetHeight={40}
        widgetWidth={200}
        inCanvas
        darkMode={false}
        onOptionChange={() => {}}
        onOptionsChange={() => {}}
        {...props}
      />
    );
  };

  beforeEach(() => {
    session = new AppBuilderTestSession({ scenario });
  });

  it('[DynamicHeight-COLLAPSE-001] asks for a pass when hidden, so the widget under it moves up in the next frame', () => {
    seedApp({
      a: widget('a', 'Text', { top: 0, properties: COLLAPSES }),
      b: widget('b', 'Text', { top: 60 }),
    });
    renderIn('a');
    flush(); // the pass seeding the page asked for

    act(() => s().setExposedValue('a', 'isVisible', false));
    flush();
    expect(temps().b).toEqual({ top: 0, height: 40 });
  });

  it('[DynamicHeight-COLLAPSE-002] asks for the pass of its own row in a List view', () => {
    // `a` is hidden in row 1 only (its visibility reads the row's data), and collapses there.
    const LIST = uuid(1);
    seedApp({
      [LIST]: widget(LIST, 'Listview', {
        top: 0,
        height: 218,
        properties: {
          dynamicHeight: binding('{{true}}'),
          dataSourceSelector: binding('rawJson'),
          data: binding('{{[{ "show": true }, { "show": false }]}}'),
          rowHeight: binding('{{100}}'),
        },
      }),
      a: widget('a', 'Text', {
        parent: LIST,
        top: 0,
        properties: { ...COLLAPSES, visibility: binding('{{listItem.show}}') },
      }),
      b: widget('b', 'Text', { parent: LIST, top: 60 }),
    });
    s().updateCustomResolvables(LIST, [{ listItem: { show: true } }, { listItem: { show: false } }], 'listItem');
    flush(); // the pass seeding the page asked for
    // Row 1 drawn as if `a` had not collapsed: only the pass RenderWidget asks for puts `b` back.
    s().setTemporaryLayouts({ 'b-1': { top: 60, height: 40 } });

    renderIn('a', { resolveIndex: [1], subContainerIndex: 1 });
    flush();
    expect(temps()['b-1']).toEqual({ top: 0, height: 40 });
    expect(temps()['b-0']).toBeUndefined();
  });

  it('[DynamicHeight-COLLAPSE-003] asks for nothing in the editor, where dynamic height does not run yet', () => {
    seedApp({
      a: widget('a', 'Text', { top: 0, properties: COLLAPSES }),
      b: widget('b', 'Text', { top: 60 }),
    });
    renderIn('a', { currentMode: 'edit' });
    flush();

    act(() => s().setExposedValue('a', 'isVisible', false));
    flush();
    expect(temps().b).toBeUndefined();
  });
});
