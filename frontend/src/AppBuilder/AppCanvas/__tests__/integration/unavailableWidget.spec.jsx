/**
 * An app that holds a component type this frontend does not register still loads.
 *
 * This is the rollback safety net for ToolJet UI 2.0: an app built on a newer ToolJet (its widget types start with
 * `Shad`) or one holding a widget a later release adds must open on this build. Each unknown component draws a
 * quiet "This widget is not available" box in its slot; every other widget renders and works.
 *
 * Real composed store, real RenderWidget, real Container and ModalV2; nothing App Builder side is mocked.
 */
import React from 'react';
import { screen, waitFor, fireEvent } from '@testing-library/react';
import RenderWidget from '@/AppBuilder/AppCanvas/RenderWidget';
import { Inspector } from '@/AppBuilder/RightSideBar/Inspector/Inspector';
import useStore from '@/AppBuilder/_stores/store';
import {
  AppBuilderTestSession,
  defineAppBuilderScenario,
  seedApp,
  componentDefinition,
  binding,
  drainExposedValueBatch,
} from '@/test/app-builder';
import { setVariableOn } from '@/AppBuilder/Widgets/__tests__/integration/widgetHarness';
import { pasteComponents } from '@/AppBuilder/AppCanvas/copyPasteWidgetsUtils';

const MODULE_ID = 'canvas';
const PLACEHOLDER = 'This widget is not available';
const state = () => useStore.getState();

const scenario = defineAppBuilderScenario({
  id: 'unavailable-widget',
  name: 'Unregistered widget type',
  primarySeam: 'rtl',
  surface: 'app-editor',
  edition: 'ce',
  environment: 'development',
  layout: 'desktop',
  version: 'draft',
  transferPath: 'not-applicable',
  access: 'authenticated',
  // dnd: a Container and an open Modal mount a real SubContainer.
  capabilities: {
    observers: true,
    media: { matches: false },
    dnd: true,
    // The duplicate saves the new components; the reply's content is not under test.
    network: [{ method: 'put', url: '*/components/batch', json: {} }],
  },
});

const widgetProps = (id, componentType, currentMode) => ({
  id,
  componentType,
  moduleId: MODULE_ID,
  currentMode,
  currentLayout: 'desktop',
  widgetHeight: 40,
  widgetWidth: 200,
  inCanvas: true,
  darkMode: false,
  onOptionChange: () => {},
  onOptionsChange: () => {},
});

// A component as a newer ToolJet saves it: a type this build has never heard of, with its own properties.
function unknownComponent(id, name, type, parent) {
  const definition = componentDefinition(id, name, type, {
    columns: { value: '{{[{ id: "todo", title: "To do" }]}}' },
    title: { value: 'Board' },
  });
  definition.component.definition.styles = { accent: { value: '#3e63dd' } };
  // Saved with the component (the server has no defaults to merge for a type it does not know).
  definition.component.definition.others = {
    showOnDesktop: { value: '{{true}}' },
    showOnMobile: { value: '{{false}}' },
  };
  if (parent) definition.component.parent = parent;
  return definition;
}

function button(id, name, text, parent) {
  const definition = componentDefinition(id, name, 'Button', { text: binding(text) });
  if (parent) definition.component.parent = parent;
  return definition;
}

const PAGE_ONE = () => ({
  btn1: button('btn1', 'button1', 'Save'),
  kanban1: unknownComponent('kanban1', 'kanban1', 'ShadKanban'),
  future1: unknownComponent('future1', 'future1', 'SomeFutureWidget'),
});

let session;

beforeEach(() => {
  session = new AppBuilderTestSession({ scenario });
});

afterEach(() => {
  drainExposedValueBatch();
});

function load(components, mode) {
  seedApp(components, { moduleId: MODULE_ID });
  state().setEditorLoading(false, MODULE_ID);
  state().setCurrentMode(mode, MODULE_ID);
}

describe('an app holding a component of an unregistered type', () => {
  test('loads: the store resolves every component, the unknown ones included', () => {
    expect(() => load(PAGE_ONE(), 'edit')).not.toThrow();

    expect(state().getResolvedComponent('btn1', null, MODULE_ID).properties.text).toBe('Save');
    // The unknown component's own saved values resolve and are kept, untouched.
    expect(state().getResolvedComponent('kanban1', null, MODULE_ID).properties.title).toBe('Board');
    expect(state().getComponentDefinition('kanban1', MODULE_ID).component.component).toBe('ShadKanban');
  });

  test.each(['edit', 'view'])(
    'in %s mode the Button renders and runs its event; each unknown one shows the placeholder',
    async (mode) => {
      load(PAGE_ONE(), mode);
      state().eventsSlice.setEvents(setVariableOn('btn1', 'onClick'), MODULE_ID);
      session.render(
        <>
          <RenderWidget {...widgetProps('btn1', 'Button', mode)} />
          <RenderWidget {...widgetProps('kanban1', 'ShadKanban', mode)} />
          <RenderWidget {...widgetProps('future1', 'SomeFutureWidget', mode)} />
        </>
      );

      expect(await screen.findAllByText(PLACEHOLDER)).toHaveLength(2);
      const save = await screen.findByRole('button', { name: 'Save' });
      fireEvent.click(save);
      await waitFor(() => expect(state().getVariable('seen', MODULE_ID)).toBe('YES'));
    }
  );

  test.each(['edit', 'view'])('in %s mode an unknown child of a Container shows the placeholder', async (mode) => {
    load(
      {
        container1: componentDefinition('container1', 'container1', 'Container'),
        btn1: button('btn1', 'button1', 'Inside', 'container1'),
        kanban1: unknownComponent('kanban1', 'kanban1', 'ShadKanban', 'container1'),
      },
      mode
    );
    session.render(<RenderWidget {...widgetProps('container1', 'Container', mode)} />);

    expect(await screen.findByText(PLACEHOLDER)).toBeInTheDocument();
    expect(await screen.findByRole('button', { name: 'Inside' })).toBeInTheDocument();
  });

  test('an unknown child of an open Modal shows the placeholder', async () => {
    const modal = componentDefinition('modal1', 'modal1', 'ModalV2');
    load(
      {
        modal1: modal,
        btn1: button('btn1', 'button1', 'In modal', 'modal1'),
        kanban1: unknownComponent('kanban1', 'kanban1', 'ShadKanban', 'modal1'),
      },
      'view'
    );
    session.render(
      <div className="canvas-container page-container">
        <div className="canvas-content">
          <div className="tj-canvas-area">
            <RenderWidget {...widgetProps('modal1', 'ModalV2', 'view')} />
          </div>
        </div>
      </div>
    );

    fireEvent.click(await waitFor(() => document.querySelector('[data-cy="modal1-launch-button"]')));

    expect(await screen.findByText(PLACEHOLDER)).toBeInTheDocument();
    expect(await screen.findByRole('button', { name: 'In modal' })).toBeInTheDocument();
  });

  test('a page switch onto a page holding one completes', async () => {
    state().initializeDependencySlice(MODULE_ID);
    state().setPages(
      [
        { id: 'page-a', handle: 'a', name: 'A', components: { btn1: button('btn1', 'button1', 'Save') } },
        {
          id: 'page-b',
          handle: 'b',
          name: 'B',
          components: {
            btn2: button('btn2', 'button2', 'Next'),
            kanban1: unknownComponent('kanban1', 'kanban1', 'ShadKanban'),
          },
        },
      ],
      MODULE_ID
    );
    state().setCurrentPageId('page-a', MODULE_ID);
    state().setComponentNameIdMapping(MODULE_ID);
    state().initDependencyGraph(MODULE_ID);
    state().setApp({ appId: 'app-1', appName: 'Test app', homePageId: 'page-a', slug: 'test-app' }, MODULE_ID);

    state().switchPage('page-b', 'b');
    // switchPage is fire-and-forget over two macrotask hops (see _stores/__tests__/integration/pageSwitch.spec.js);
    // a throw inside it is caught and logged, so the rebuilt page is what tells success from failure.
    for (let i = 0; i < 3; i++) await new Promise((resolve) => setTimeout(resolve, 0));

    expect(state().getCurrentPageId(MODULE_ID)).toBe('page-b');
    expect(state().getResolvedComponent('btn2', null, MODULE_ID).properties.text).toBe('Next');
    expect(state().getResolvedComponent('kanban1', null, MODULE_ID).properties.title).toBe('Board');
    expect(state().pageLoader).toBe(false);
  });

  test('duplicating an unknown component with a Button copies both, the unknown one unchanged', async () => {
    load(PAGE_ONE(), 'edit');
    const page = state().getCurrentPageComponents(MODULE_ID);
    const copied = ['kanban1', 'btn1'].map((id) => ({
      id,
      component: page[id].component,
      layouts: page[id].layouts,
      parent: page[id].component.parent,
      events: [],
    }));

    await session.store.act(() =>
      pasteComponents(undefined, { newComponents: copied, isCloning: true, pageId: 'page-1' })
    );

    const after = Object.values(state().getCurrentPageComponents(MODULE_ID));
    const kanbans = after.filter((c) => c.component.component === 'ShadKanban');
    expect(kanbans).toHaveLength(2);
    const copy = kanbans.find((c) => c.id !== 'kanban1');
    expect(copy.component.definition.properties.title).toEqual({ value: 'Board' });
    expect(state().getResolvedComponent(copy.id, null, MODULE_ID).properties.title).toBe('Board');
    expect(after.filter((c) => c.component.component === 'Button')).toHaveLength(2);
  });

  test('the inspector says the widget is not available, and the widget can still be deleted', async () => {
    load(PAGE_ONE(), 'edit');
    session.render(
      <Inspector
        selectedComponentId="kanban1"
        componentDefinitionChanged={() => {}}
        darkMode={false}
        pages={[]}
        handleRightSidebarToggle={() => {}}
      />
    );

    expect(await screen.findByText(/not available in this version/i)).toBeInTheDocument();
    expect(screen.getByDisplayValue('kanban1')).toBeInTheDocument();

    await session.store.act('deleteComponents', ['kanban1'], MODULE_ID, { saveAfterAction: false });
    expect(state().getCurrentPageComponents(MODULE_ID).kanban1).toBeUndefined();
    expect(state().getCurrentPageComponents(MODULE_ID).btn1).toBeDefined();
  });
});
