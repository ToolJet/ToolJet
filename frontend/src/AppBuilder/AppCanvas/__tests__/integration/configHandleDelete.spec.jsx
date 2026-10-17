/**
 * A component's handle deletes that component.
 *
 * The canvas doesn't select a component when one of its handle's buttons is pressed (they are buttons, not a place to
 * grab it), so a delete that went by the selection deleted nothing when nothing was selected, and another component
 * when that one was. With the handle's component in a multi-selection, the whole selection is deleted, as before.
 */
import React from 'react';
import { fireEvent } from '@testing-library/react';
import { ConfigHandle } from '@/AppBuilder/AppCanvas/ConfigHandle/ConfigHandle';
import useStore from '@/AppBuilder/_stores/store';
import { AppBuilderTestSession, defineAppBuilderScenario, seedApp, componentDefinition } from '@/test/app-builder';
import { MODULE_ID } from '@/AppBuilder/Widgets/__tests__/integration/widgetHarness';

const state = () => useStore.getState();

const SCENARIO = defineAppBuilderScenario({
  id: 'config-handle-delete',
  name: "A component's handle deletes that component",
  primarySeam: 'rtl',
  surface: 'app-editor',
  edition: 'ce',
  environment: 'development',
  layout: 'desktop',
  version: 'draft',
  transferPath: 'not-applicable',
  access: 'authenticated',
  capabilities: { observers: true, media: { matches: false } },
});

const handle = (id) => (
  <ConfigHandle id={id} widgetTop={100} widgetHeight={40} showHandle componentType="Button" visibility />
);
const deleteButtonOf = (name) => document.querySelector(`[data-cy="${name}-delete-component-button"]`);

describe('Component handle: delete', () => {
  let session;

  beforeEach(() => {
    session = new AppBuilderTestSession({ scenario: SCENARIO });
    seedApp(
      {
        b1: componentDefinition('b1', 'button1', 'Button', {}),
        b2: componentDefinition('b2', 'button2', 'Button', {}),
        b3: componentDefinition('b3', 'button3', 'Button', {}),
      },
      { moduleId: MODULE_ID }
    );
    state().setEditorLoading(false, MODULE_ID);
    state().setCurrentMode('edit', MODULE_ID);
    session.render(
      <>
        {handle('b1')}
        {handle('b2')}
        {handle('b3')}
      </>
    );
  });

  test('with nothing selected, it deletes its own component', () => {
    state().setSelectedComponents([]);
    fireEvent.click(deleteButtonOf('button2'));
    expect(state().showWidgetDeleteConfirmation).toBe(true);
    expect(state().widgetDeleteConfirmationTargets).toEqual(['b2']);
  });

  test('with another component selected, it deletes its own, and leaves the selection', () => {
    state().setSelectedComponents(['b1']);
    fireEvent.click(deleteButtonOf('button2'));
    expect(state().widgetDeleteConfirmationTargets).toEqual(['b2']);
    expect(state().selectedComponents).toEqual(['b1']);
  });

  test('as part of a multi-selection, it deletes the whole selection', () => {
    state().setSelectedComponents(['b1', 'b2']);
    fireEvent.click(deleteButtonOf('button2'));
    expect(state().widgetDeleteConfirmationTargets).toEqual(['b1', 'b2']);
  });
});
