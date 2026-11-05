import React from 'react';
import { waitFor } from '@testing-library/react';
import { Container } from '@/AppBuilder/AppCanvas/Container';
import useStore from '@/AppBuilder/_stores/store';
import { AppBuilderTestSession, defineAppBuilderScenario, seedApp, componentDefinition } from '@/test/app-builder';

// Which sub-canvases let the builder select the components in them. A row-scoped widget (List view, Kanban, Table,
// a pack list) draws one canvas per row; only row 0 is editable and the others are read-only mirrors. A canvas with
// no row index (a pack or library component's ToolJet.Slot) is not a row, so its components are selectable.
// Uses the real store (Container reads the components and the editor mode from it).

const MODULE_ID = 'canvas';

const scenario = defineAppBuilderScenario({
  id: 'container-read-only-rows',
  name: 'Container read-only rows',
  primarySeam: 'rtl',
  surface: 'app-editor',
  edition: 'ce',
  environment: 'development',
  layout: 'desktop',
  version: 'draft',
  transferPath: 'not-applicable',
  access: 'authenticated',
  capabilities: { dnd: true, observers: true, media: { matches: false } },
});

const renderCanvas = (session, { canvasId, componentType, index }) => {
  const child = componentDefinition('child1', 'button1', 'Button', { text: { value: 'Inside' } });
  child.component.parent = canvasId;
  child.component.definition.others = { showOnDesktop: { value: '{{true}}' }, showOnMobile: { value: '{{false}}' } };
  seedApp({ child1: child }, { moduleId: MODULE_ID });
  useStore.getState().setEditorLoading(false, MODULE_ID);
  useStore.getState().setCurrentMode('edit', MODULE_ID);
  session.render(
    <Container
      id={canvasId}
      canvasWidth={400}
      componentType={componentType}
      {...(index === undefined ? {} : { index })}
      darkMode={false}
      allowContainerSelect={true}
    />
  );
};

const childBox = () => document.querySelector('.ele-child1');

describe('selecting a component inside a sub-canvas', () => {
  let session;
  beforeEach(() => {
    session = new AppBuilderTestSession({ scenario });
  });

  test("a List view's first row: its components are selectable", async () => {
    renderCanvas(session, { canvasId: 'lv1', componentType: 'Listview', index: 0 });
    await waitFor(() => expect(childBox()).toBeTruthy());
    expect(childBox().classList).toContain('moveable-box');
  });

  test("a List view's second row is a read-only mirror: its components are not selectable", async () => {
    // Break this catches: every row of a list made editable, so a click edits a mirror instead of row 0.
    renderCanvas(session, { canvasId: 'lv1', componentType: 'Listview', index: 1 });
    await waitFor(() => expect(childBox()).toBeTruthy());
    expect(childBox().classList).not.toContain('moveable-box');
  });

  test.each(['PackComponent', 'LibraryComponent'])(
    "a %s's drop area (no row index): its components are selectable",
    async (componentType) => {
      // Break this catches: a drop area of a pack or custom component drawn as a mirror row, so what was dropped
      // into it can never be selected again.
      renderCanvas(session, { canvasId: 'pack1-body', componentType, index: undefined });
      await waitFor(() => expect(childBox()).toBeTruthy());
      expect(childBox().classList).toContain('moveable-box');
    }
  );
});
